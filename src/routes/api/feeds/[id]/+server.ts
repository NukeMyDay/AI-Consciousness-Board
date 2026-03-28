import { json, error } from '@sveltejs/kit';
import { updateFeed, deleteFeed } from '$lib/server/api/feeds';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const data = await request.json();
	updateFeed(params.id, data);
	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const deleted = deleteFeed(params.id);
	if (!deleted) throw error(404, 'Feed not found');
	return json({ success: true });
};
