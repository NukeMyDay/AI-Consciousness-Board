import { json, error } from '@sveltejs/kit';
import { getAllCards, getDueCards, createCard } from '$lib/server/api/cards';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const resourceId = url.searchParams.get('resourceId');
	const due = url.searchParams.get('due') === 'true';

	if (due) return json(getDueCards());

	const cards = getAllCards();
	if (resourceId) return json(cards.filter((c) => c.resourceId === resourceId));
	return json(cards);
};

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	if (!data.concept) throw error(400, 'concept required');
	return json(createCard(data), { status: 201 });
};
