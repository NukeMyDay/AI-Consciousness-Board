import { json, error } from '@sveltejs/kit';
import { addHighlight, getResourceById } from '$lib/server/api/resources';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const resource = getResourceById(params.id);
	if (!resource) throw error(404, 'Resource not found');

	const { text, note } = await request.json();
	if (!text) throw error(400, 'Text is required');

	const highlight = addHighlight(params.id, text, note);
	return json(highlight, { status: 201 });
};
