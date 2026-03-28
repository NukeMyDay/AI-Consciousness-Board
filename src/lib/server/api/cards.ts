import { db } from '../db';
import { knowledgeCard, cardReview, resource } from '../db/schema';
import { eq, desc, asc, lte, isNull, and, or, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { KnowledgeCard, CardReview } from '$lib/types';

// Spaced repetition intervals (in days)
const INTERVALS = [1, 3, 7, 14, 30, 90];

function nextInterval(currentInterval: number, understood: boolean): number {
	if (!understood) return 1;
	const idx = INTERVALS.indexOf(currentInterval);
	return idx >= 0 && idx < INTERVALS.length - 1 ? INTERVALS[idx + 1] : INTERVALS[INTERVALS.length - 1];
}

// --- Card CRUD ---

export function getAllCards(): KnowledgeCard[] {
	const cards = db
		.select({
			id: knowledgeCard.id,
			resourceId: knowledgeCard.resourceId,
			concept: knowledgeCard.concept,
			explanation: knowledgeCard.explanation,
			difficulty: knowledgeCard.difficulty,
			createdAt: knowledgeCard.createdAt,
			resourceTitle: resource.title
		})
		.from(knowledgeCard)
		.leftJoin(resource, eq(knowledgeCard.resourceId, resource.id))
		.orderBy(desc(knowledgeCard.createdAt))
		.all();

	return cards.map((c) => {
		const latestReview = db
			.select()
			.from(cardReview)
			.where(eq(cardReview.cardId, c.id))
			.orderBy(desc(cardReview.scheduledAt))
			.limit(1)
			.get();

		const reviewCount = db
			.select({ value: count() })
			.from(cardReview)
			.where(and(eq(cardReview.cardId, c.id), eq(cardReview.rating, 'understood')))
			.get();

		return {
			...c,
			resourceTitle: c.resourceTitle ?? undefined,
			nextReview: latestReview?.completedAt ? null : latestReview?.scheduledAt ?? null,
			reviewCount: reviewCount?.value ?? 0
		};
	});
}

export function getCardsForResource(resourceId: string): KnowledgeCard[] {
	return getAllCards().filter((c) => c.resourceId === resourceId);
}

export function getDueCards(): KnowledgeCard[] {
	const now = new Date().toISOString();
	// Cards with a pending review scheduled before now, or cards with no reviews yet
	const allCards = getAllCards();

	return allCards.filter((c) => {
		const latestReview = db
			.select()
			.from(cardReview)
			.where(eq(cardReview.cardId, c.id))
			.orderBy(desc(cardReview.scheduledAt))
			.limit(1)
			.get();

		if (!latestReview) return true; // Never reviewed
		if (latestReview.completedAt) {
			// Check if next review is due
			return latestReview.scheduledAt <= now;
		}
		return latestReview.scheduledAt <= now; // Pending and due
	});
}

export function createCard(data: { concept: string; explanation?: string; resourceId?: string; difficulty?: string }): KnowledgeCard {
	const id = nanoid();
	const now = new Date().toISOString();
	db.insert(knowledgeCard).values({
		id,
		concept: data.concept,
		explanation: data.explanation ?? null,
		resourceId: data.resourceId ?? null,
		difficulty: data.difficulty ?? null,
		createdAt: now
	}).run();

	// Schedule first review for tomorrow
	const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
	db.insert(cardReview).values({
		id: nanoid(),
		cardId: id,
		scheduledAt: tomorrow,
		intervalDays: 1
	}).run();

	let resourceTitle: string | undefined;
	if (data.resourceId) {
		const r = db.select({ title: resource.title }).from(resource).where(eq(resource.id, data.resourceId)).get();
		resourceTitle = r?.title;
	}

	return { id, concept: data.concept, explanation: data.explanation ?? null, resourceId: data.resourceId ?? null, difficulty: (data.difficulty as any) ?? null, createdAt: now, resourceTitle, nextReview: tomorrow, reviewCount: 0 };
}

export function deleteCard(id: string): boolean {
	return db.delete(knowledgeCard).where(eq(knowledgeCard.id, id)).run().changes > 0;
}

// --- Review ---

export function completeReview(cardId: string, rating: 'understood' | 'review_again'): CardReview {
	const now = new Date().toISOString();

	// Find current pending review
	const pending = db
		.select()
		.from(cardReview)
		.where(and(eq(cardReview.cardId, cardId), isNull(cardReview.completedAt)))
		.orderBy(desc(cardReview.scheduledAt))
		.limit(1)
		.get();

	const currentInterval = pending?.intervalDays ?? 1;
	const newInterval = nextInterval(currentInterval, rating === 'understood');

	// Complete current review
	if (pending) {
		db.update(cardReview)
			.set({ completedAt: now, rating })
			.where(eq(cardReview.id, pending.id))
			.run();
	}

	// Schedule next review
	const nextDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000).toISOString();
	const nextReviewId = nanoid();
	db.insert(cardReview).values({
		id: nextReviewId,
		cardId,
		scheduledAt: nextDate,
		intervalDays: newInterval
	}).run();

	return { id: pending?.id ?? nextReviewId, cardId, scheduledAt: nextDate, completedAt: now, rating, intervalDays: newInterval };
}
