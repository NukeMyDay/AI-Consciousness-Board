import { db } from '../db';
import { learningPath, learningPathStep, resource, author, resourceAuthor } from '../db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { LearningPath, LearningPathStep } from '$lib/types';

export function getAllPaths(): LearningPath[] {
	const paths = db.select().from(learningPath).orderBy(learningPath.createdAt).all();
	return paths.map((p) => enrichPath(p));
}

export function getPathById(id: string): LearningPath | null {
	const row = db.select().from(learningPath).where(eq(learningPath.id, id)).get();
	if (!row) return null;
	return enrichPath(row);
}

function enrichPath(p: typeof learningPath.$inferSelect): LearningPath {
	const steps = db
		.select()
		.from(learningPathStep)
		.where(eq(learningPathStep.pathId, p.id))
		.orderBy(asc(learningPathStep.position))
		.all();

	const enrichedSteps: LearningPathStep[] = steps.map((s) => {
		let linkedResource = null;
		if (s.resourceId) {
			const r = db.select().from(resource).where(eq(resource.id, s.resourceId)).get();
			if (r) {
				const authors = db
					.select({ id: author.id, name: author.name })
					.from(resourceAuthor)
					.innerJoin(author, eq(resourceAuthor.authorId, author.id))
					.where(eq(resourceAuthor.resourceId, r.id))
					.all();
				linkedResource = {
					id: r.id,
					title: r.title,
					type: r.type,
					url: r.url,
					status: r.status,
					authors
				};
			}
		}
		return {
			id: s.id,
			pathId: s.pathId,
			position: s.position,
			resourceId: s.resourceId,
			title: s.title,
			description: s.description,
			isCompleted: s.isCompleted === 1,
			resource: linkedResource
		};
	});

	return {
		id: p.id,
		name: p.name,
		description: p.description,
		createdAt: p.createdAt,
		steps: enrichedSteps
	};
}

export function createPath(name: string, description?: string): LearningPath {
	const id = nanoid();
	const now = new Date().toISOString();
	db.insert(learningPath).values({ id, name, description: description ?? null, createdAt: now }).run();
	return { id, name, description: description ?? null, createdAt: now, steps: [] };
}

export function updatePath(id: string, data: { name?: string; description?: string | null }): LearningPath | null {
	const existing = db.select().from(learningPath).where(eq(learningPath.id, id)).get();
	if (!existing) return null;
	const updates: Record<string, unknown> = {};
	if (data.name !== undefined) updates.name = data.name;
	if (data.description !== undefined) updates.description = data.description;
	if (Object.keys(updates).length > 0) {
		db.update(learningPath).set(updates).where(eq(learningPath.id, id)).run();
	}
	return getPathById(id);
}

export function deletePath(id: string): boolean {
	const result = db.delete(learningPath).where(eq(learningPath.id, id)).run();
	return result.changes > 0;
}

export function addStep(
	pathId: string,
	data: { title: string; description?: string; resourceId?: string }
): LearningPathStep {
	const id = nanoid();
	// Get next position
	const last = db
		.select({ position: learningPathStep.position })
		.from(learningPathStep)
		.where(eq(learningPathStep.pathId, pathId))
		.orderBy(asc(learningPathStep.position))
		.all();
	const position = last.length > 0 ? last[last.length - 1].position + 1 : 0;

	db.insert(learningPathStep)
		.values({
			id,
			pathId,
			position,
			resourceId: data.resourceId ?? null,
			title: data.title,
			description: data.description ?? null,
			isCompleted: 0
		})
		.run();

	return {
		id,
		pathId,
		position,
		resourceId: data.resourceId ?? null,
		title: data.title,
		description: data.description ?? null,
		isCompleted: false
	};
}

export function updateStep(
	id: string,
	data: { title?: string; description?: string | null; isCompleted?: boolean; position?: number }
): boolean {
	const step = db.select().from(learningPathStep).where(eq(learningPathStep.id, id)).get();
	if (!step) return false;

	const updates: Record<string, unknown> = {};
	if (data.title !== undefined) updates.title = data.title;
	if (data.description !== undefined) updates.description = data.description;
	if (data.isCompleted !== undefined) updates.isCompleted = data.isCompleted ? 1 : 0;
	if (data.position !== undefined) updates.position = data.position;
	if (Object.keys(updates).length > 0) {
		db.update(learningPathStep).set(updates).where(eq(learningPathStep.id, id)).run();
	}

	// Sync linked resource status when step completion changes
	if (data.isCompleted !== undefined && step.resourceId) {
		if (data.isCompleted) {
			// Mark resource as done
			const now = new Date().toISOString();
			db.update(resource)
				.set({ status: 'done', dateCompleted: now })
				.where(eq(resource.id, step.resourceId))
				.run();
		} else {
			// Move resource back to to_read
			db.update(resource)
				.set({ status: 'to_read', dateCompleted: null })
				.where(eq(resource.id, step.resourceId))
				.run();
		}
	}

	return true;
}

export function deleteStep(id: string): boolean {
	const result = db.delete(learningPathStep).where(eq(learningPathStep.id, id)).run();
	return result.changes > 0;
}

export function reorderSteps(pathId: string, stepIds: string[]): boolean {
	for (let i = 0; i < stepIds.length; i++) {
		db.update(learningPathStep)
			.set({ position: i })
			.where(eq(learningPathStep.id, stepIds[i]))
			.run();
	}
	return true;
}
