import { json, error } from '@sveltejs/kit';
import { createConversation, getConversationsForResource } from '$lib/server/api/chat';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const resourceId = url.searchParams.get('resourceId');
	if (!resourceId) throw error(400, 'resourceId required');
	return json(getConversationsForResource(resourceId));
};

export const POST: RequestHandler = async ({ request }) => {
	const { resourceId, provider, model } = await request.json();
	if (!resourceId || !provider || !model) throw error(400, 'resourceId, provider, and model required');
	const convo = createConversation(resourceId, provider, model);
	return json(convo, { status: 201 });
};
