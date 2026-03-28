import { json } from '@sveltejs/kit';
import { fetchAllFeeds } from '$lib/server/api/feeds';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	const result = await fetchAllFeeds();
	return json(result);
};
