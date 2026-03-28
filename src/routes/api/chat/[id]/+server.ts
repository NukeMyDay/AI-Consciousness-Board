import { json, error } from '@sveltejs/kit';
import { sendMessage, deleteConversation, getConversation } from '$lib/server/api/chat';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const convo = getConversation(params.id);
	if (!convo) throw error(404, 'Conversation not found');
	return json(convo);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const { message } = await request.json();
	if (!message) throw error(400, 'message required');

	try {
		const response = await sendMessage(params.id, message);
		return json(response);
	} catch (e: any) {
		throw error(500, e.message ?? 'Failed to get AI response');
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	deleteConversation(params.id);
	return json({ success: true });
};
