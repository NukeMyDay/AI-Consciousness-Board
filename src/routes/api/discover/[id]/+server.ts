import { json, error } from '@sveltejs/kit';
import { dismissFeedItem, saveFeedItem } from '$lib/server/api/feeds';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const { action } = await request.json();
	if (action === 'save') {
		const result = saveFeedItem(params.id);
		return json(result);
	} else if (action === 'dismiss') {
		dismissFeedItem(params.id);
		return json({ success: true });
	} else {
		throw error(400, 'action must be "save" or "dismiss"');
	}
};
