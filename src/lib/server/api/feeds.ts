import { db } from '../db';
import { feed, feedItem, resource } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Feed, FeedItem, Resource } from '$lib/types';

// --- Feed CRUD ---

export function getAllFeeds(): Feed[] {
	return db.select().from(feed).all().map((f) => ({
		...f,
		isActive: f.isActive === 1
	}));
}

export function createFeed(data: { name: string; url: string; category?: string; keywords?: string }): Feed {
	const id = nanoid();
	db.insert(feed).values({
		id,
		name: data.name,
		url: data.url,
		category: data.category ?? null,
		keywords: data.keywords ?? null
	}).run();
	return { id, name: data.name, url: data.url, category: data.category ?? null, lastFetched: null, isActive: true, keywords: data.keywords ?? null };
}

export function updateFeed(id: string, data: { name?: string; url?: string; category?: string | null; keywords?: string | null; isActive?: boolean }): boolean {
	const updates: Record<string, unknown> = {};
	if (data.name !== undefined) updates.name = data.name;
	if (data.url !== undefined) updates.url = data.url;
	if (data.category !== undefined) updates.category = data.category;
	if (data.keywords !== undefined) updates.keywords = data.keywords;
	if (data.isActive !== undefined) updates.isActive = data.isActive ? 1 : 0;
	if (Object.keys(updates).length > 0) {
		db.update(feed).set(updates).where(eq(feed.id, id)).run();
	}
	return true;
}

export function deleteFeed(id: string): boolean {
	return db.delete(feed).where(eq(feed.id, id)).run().changes > 0;
}

// --- Feed Items ---

export function getDiscoverItems(limit = 50): FeedItem[] {
	const items = db
		.select({
			id: feedItem.id,
			feedId: feedItem.feedId,
			title: feedItem.title,
			url: feedItem.url,
			publishedAt: feedItem.publishedAt,
			summary: feedItem.summary,
			isSaved: feedItem.isSaved,
			isDismissed: feedItem.isDismissed,
			discoveredAt: feedItem.discoveredAt,
			feedName: feed.name
		})
		.from(feedItem)
		.innerJoin(feed, eq(feedItem.feedId, feed.id))
		.where(and(eq(feedItem.isSaved, 0), eq(feedItem.isDismissed, 0)))
		.orderBy(desc(feedItem.discoveredAt))
		.limit(limit)
		.all();

	return items.map((i) => ({
		...i,
		isSaved: i.isSaved === 1,
		isDismissed: i.isDismissed === 1
	}));
}

export function dismissFeedItem(id: string): boolean {
	return db.update(feedItem).set({ isDismissed: 1 }).where(eq(feedItem.id, id)).run().changes > 0;
}

export function saveFeedItem(id: string): { success: boolean; resourceId?: string } {
	const item = db
		.select({ id: feedItem.id, title: feedItem.title, url: feedItem.url, summary: feedItem.summary, feedId: feedItem.feedId })
		.from(feedItem)
		.where(eq(feedItem.id, id))
		.get();
	if (!item) return { success: false };

	// Get feed category to determine resource type
	const f = db.select({ category: feed.category }).from(feed).where(eq(feed.id, item.feedId)).get();
	const type = f?.category === 'Papers' ? 'paper' : 'blog_post';

	// Create resource
	const resourceId = nanoid();
	const now = new Date().toISOString();
	db.insert(resource).values({
		id: resourceId,
		title: item.title,
		type,
		url: item.url,
		description: item.summary ?? null,
		status: 'to_read',
		priority: 'medium',
		sourceFeedId: item.feedId,
		dateAdded: now
	}).run();

	// Mark feed item as saved
	db.update(feedItem).set({ isSaved: 1 }).where(eq(feedItem.id, id)).run();

	return { success: true, resourceId };
}

// --- RSS Fetching ---

export async function fetchAllFeeds(): Promise<{ fetched: number; newItems: number; errors: string[] }> {
	const Parser = (await import('rss-parser')).default;
	const parser = new Parser({ timeout: 15000 });
	const errors: string[] = [];

	const feeds = db.select().from(feed).where(eq(feed.isActive, 1)).all();
	let totalNew = 0;

	for (const f of feeds) {
		try {
			const parsed = await parser.parseURL(f.url);
			const keywords = f.keywords
				? f.keywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean)
				: [];

			const now = new Date().toISOString();

			for (const item of parsed.items ?? []) {
				const itemUrl = item.link ?? '';
				const itemTitle = item.title ?? '';
				if (!itemUrl || !itemTitle) continue;

				// Check if already exists
				const existing = db.select({ id: feedItem.id }).from(feedItem)
					.where(and(eq(feedItem.feedId, f.id), eq(feedItem.url, itemUrl)))
					.get();
				if (existing) continue;

				// Keyword filter: if keywords set, only include matching items
				if (keywords.length > 0) {
					const text = (itemTitle + ' ' + (item.contentSnippet ?? '')).toLowerCase();
					const matches = keywords.some((kw) => text.includes(kw));
					if (!matches) continue;
				}

				db.insert(feedItem).values({
					id: nanoid(),
					feedId: f.id,
					title: itemTitle,
					url: itemUrl,
					publishedAt: item.isoDate ?? null,
					summary: item.contentSnippet?.substring(0, 500) ?? null,
					discoveredAt: now
				}).run();
				totalNew++;
			}

			// Update last fetched
			db.update(feed).set({ lastFetched: now }).where(eq(feed.id, f.id)).run();
		} catch (e: any) {
			const msg = `${f.name}: ${e.message ?? 'unknown error'}`;
			console.error(`Failed to fetch feed: ${msg}`);
			errors.push(msg);
		}
	}

	return { fetched: feeds.length, newItems: totalNew, errors };
}
