import { json, error } from '@sveltejs/kit';
import { getResourceById, updateResource, deleteResource } from '$lib/server/api/resources';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const detail = url.searchParams.get('detail') === 'true';
	const resource = getResourceById(params.id, detail);
	if (!resource) throw error(404, 'Resource not found');
	return json(resource);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const data = await request.json();
	const updated = updateResource(params.id, data);
	if (!updated) throw error(404, 'Resource not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const deleted = deleteResource(params.id);
	if (!deleted) throw error(404, 'Resource not found');
	return json({ success: true });
};
