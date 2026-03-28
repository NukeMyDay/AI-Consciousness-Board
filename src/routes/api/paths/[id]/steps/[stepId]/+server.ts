import { json, error } from '@sveltejs/kit';
import { updateStep, deleteStep } from '$lib/server/api/paths';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const data = await request.json();
	updateStep(params.stepId, data);
	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const deleted = deleteStep(params.stepId);
	if (!deleted) throw error(404, 'Step not found');
	return json({ success: true });
};
