import { db } from '../db';
import { resource, tag, resourceTag, author, resourceAuthor, highlight, learningPathStep } from '../db/schema';
import { eq, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Resource, ResourceCreate, ResourceUpdate, Highlight } from '$lib/types';

export function getAllResources(): Resource[] {
	const rows = db
		.select()
		.from(resource)
		.orderBy(resource.dateAdded)
		.all();

	return rows.map((r) => enrichResource(r));
}

export function getResourceById(id: string, includeHighlights = false): Resource | null {
	const row = db.select().from(resource).where(eq(resource.id, id)).get();
	if (!row) return null;
	return enrichResource(row, includeHighlights);
}

function enrichResource(r: typeof resource.$inferSelect, includeHighlights = false): Resource {
	const rTags = db
		.select({ id: tag.id, name: tag.name, color: tag.color, description: tag.description })
		.from(resourceTag)
		.innerJoin(tag, eq(resourceTag.tagId, tag.id))
		.where(eq(resourceTag.resourceId, r.id))
		.all();

	const rAuthors = db
		.select({ id: author.id, name: author.name })
		.from(resourceAuthor)
		.innerJoin(author, eq(resourceAuthor.authorId, author.id))
		.where(eq(resourceAuthor.resourceId, r.id))
		.all();

	const hlCount = db
		.select({ value: count() })
		.from(highlight)
		.where(eq(highlight.resourceId, r.id))
		.get();

	const result: Resource = {
		id: r.id,
		title: r.title,
		type: r.type as Resource['type'],
		url: r.url,
		description: r.description,
		status: r.status as Resource['status'],
		rating: r.rating,
		priority: r.priority as Resource['priority'],
		difficulty: r.difficulty as Resource['difficulty'],
		coverImageUrl: r.coverImageUrl,
		personalNotes: r.personalNotes,
		dateAdded: r.dateAdded,
		dateStarted: r.dateStarted,
		dateCompleted: r.dateCompleted,
		tags: rTags,
		authors: rAuthors,
		highlightCount: hlCount?.value ?? 0
	};

	if (includeHighlights) {
		result.highlights = db
			.select()
			.from(highlight)
			.where(eq(highlight.resourceId, r.id))
			.orderBy(highlight.createdAt)
			.all();
	}

	return result;
}

export function createResource(data: ResourceCreate): Resource {
	const id = nanoid();
	const now = new Date().toISOString();

	db.insert(resource)
		.values({
			id,
			title: data.title,
			type: data.type,
			url: data.url ?? null,
			description: data.description ?? null,
			status: data.status ?? 'backlog',
			priority: data.priority ?? 'medium',
			difficulty: data.difficulty ?? null,
			dateAdded: now
		})
		.run();

	if (data.tagIds?.length) {
		for (const tagId of data.tagIds) {
			db.insert(resourceTag).values({ resourceId: id, tagId }).run();
		}
	}

	if (data.authorNames?.length) {
		for (const name of data.authorNames) {
			const authorId = getOrCreateAuthor(name);
			db.insert(resourceAuthor).values({ resourceId: id, authorId }).run();
		}
	}

	return getResourceById(id)!;
}

export function updateResource(id: string, data: ResourceUpdate): Resource | null {
	const existing = db.select().from(resource).where(eq(resource.id, id)).get();
	if (!existing) return null;

	const updates: Record<string, unknown> = {};
	if (data.title !== undefined) updates.title = data.title;
	if (data.type !== undefined) updates.type = data.type;
	if (data.url !== undefined) updates.url = data.url;
	if (data.description !== undefined) updates.description = data.description;
	if (data.status !== undefined) {
		updates.status = data.status;
		if (data.status === 'reading' && !existing.dateStarted) {
			updates.dateStarted = new Date().toISOString();
		}
		if (data.status === 'done' || data.status === 'applied') {
			updates.dateCompleted = new Date().toISOString();
			// Auto-complete linked learning path steps
			db.update(learningPathStep)
				.set({ isCompleted: 1 })
				.where(eq(learningPathStep.resourceId, id))
				.run();
		} else if (existing.status === 'done' || existing.status === 'applied') {
			// Un-complete linked steps when moving away from done
			db.update(learningPathStep)
				.set({ isCompleted: 0 })
				.where(eq(learningPathStep.resourceId, id))
				.run();
		}
	}
	if (data.rating !== undefined) updates.rating = data.rating;
	if (data.priority !== undefined) updates.priority = data.priority;
	if (data.difficulty !== undefined) updates.difficulty = data.difficulty;
	if (data.personalNotes !== undefined) updates.personalNotes = data.personalNotes;

	if (Object.keys(updates).length > 0) {
		db.update(resource).set(updates).where(eq(resource.id, id)).run();
	}

	if (data.tagIds !== undefined) {
		db.delete(resourceTag).where(eq(resourceTag.resourceId, id)).run();
		for (const tagId of data.tagIds) {
			db.insert(resourceTag).values({ resourceId: id, tagId }).run();
		}
	}

	if (data.authorNames !== undefined) {
		db.delete(resourceAuthor).where(eq(resourceAuthor.resourceId, id)).run();
		for (const name of data.authorNames) {
			const authorId = getOrCreateAuthor(name);
			db.insert(resourceAuthor).values({ resourceId: id, authorId }).run();
		}
	}

	return getResourceById(id);
}

export function deleteResource(id: string): boolean {
	const result = db.delete(resource).where(eq(resource.id, id)).run();
	return result.changes > 0;
}

export function getAllTags() {
	return db.select().from(tag).orderBy(tag.name).all();
}

function getOrCreateAuthor(name: string): string {
	const existing = db.select().from(author).where(eq(author.name, name)).get();
	if (existing) return existing.id;
	const id = nanoid();
	db.insert(author).values({ id, name }).run();
	return id;
}

// Highlight CRUD
export function addHighlight(resourceId: string, text: string, note?: string): Highlight {
	const id = nanoid();
	const now = new Date().toISOString();
	db.insert(highlight).values({ id, resourceId, text, note: note ?? null, createdAt: now }).run();
	return { id, resourceId, text, note: note ?? null, createdAt: now };
}

export function updateHighlight(id: string, data: { text?: string; note?: string | null }): Highlight | null {
	const existing = db.select().from(highlight).where(eq(highlight.id, id)).get();
	if (!existing) return null;
	const updates: Record<string, unknown> = {};
	if (data.text !== undefined) updates.text = data.text;
	if (data.note !== undefined) updates.note = data.note;
	if (Object.keys(updates).length > 0) {
		db.update(highlight).set(updates).where(eq(highlight.id, id)).run();
	}
	return db.select().from(highlight).where(eq(highlight.id, id)).get() as Highlight;
}

export function deleteHighlight(id: string): boolean {
	const result = db.delete(highlight).where(eq(highlight.id, id)).run();
	return result.changes > 0;
}
