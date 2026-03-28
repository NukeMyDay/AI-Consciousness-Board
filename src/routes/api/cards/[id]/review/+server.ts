import { json, error } from '@sveltejs/kit';
import { completeReview } from '$lib/server/api/cards';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { rating } = await request.json();
	if (rating !== 'understood' && rating !== 'review_again') {
		throw error(400, 'rating must be "understood" or "review_again"');
	}
	const review = completeReview(params.id, rating);
	return json(review);
};
