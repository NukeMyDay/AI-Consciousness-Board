import { json, error } from '@sveltejs/kit';
import { deleteCard } from '$lib/server/api/cards';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
	const deleted = deleteCard(params.id);
	if (!deleted) throw error(404, 'Card not found');
	return json({ success: true });
};
