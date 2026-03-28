import { json, error } from '@sveltejs/kit';
import { updateHighlight, deleteHighlight } from '$lib/server/api/resources';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const data = await request.json();
	const updated = updateHighlight(params.highlightId, data);
	if (!updated) throw error(404, 'Highlight not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const deleted = deleteHighlight(params.highlightId);
	if (!deleted) throw error(404, 'Highlight not found');
	return json({ success: true });
};
