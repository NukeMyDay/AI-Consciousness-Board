import { json, error } from '@sveltejs/kit';
import { getPathById, updatePath, deletePath } from '$lib/server/api/paths';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const path = getPathById(params.id);
	if (!path) throw error(404, 'Path not found');
	return json(path);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const data = await request.json();
	const updated = updatePath(params.id, data);
	if (!updated) throw error(404, 'Path not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const deleted = deletePath(params.id);
	if (!deleted) throw error(404, 'Path not found');
	return json({ success: true });
};
