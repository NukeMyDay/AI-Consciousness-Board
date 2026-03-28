import { json, error } from '@sveltejs/kit';
import { addStep, reorderSteps, getPathById } from '$lib/server/api/paths';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const data = await request.json();
	if (!data.title) throw error(400, 'Title is required');
	const step = addStep(params.id, data);
	return json(step, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const { stepIds } = await request.json();
	reorderSteps(params.id, stepIds);
	const path = getPathById(params.id);
	return json(path);
};
