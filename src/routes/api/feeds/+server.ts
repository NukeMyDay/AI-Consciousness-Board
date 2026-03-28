import { json, error } from '@sveltejs/kit';
import { getAllFeeds, createFeed } from '$lib/server/api/feeds';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json(getAllFeeds());
};

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	if (!data.name || !data.url) throw error(400, 'name and url required');
	return json(createFeed(data), { status: 201 });
};
