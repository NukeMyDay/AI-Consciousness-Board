import { json } from '@sveltejs/kit';
import { getDiscoverItems } from '$lib/server/api/feeds';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json(getDiscoverItems());
};
