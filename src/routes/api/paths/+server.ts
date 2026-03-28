import { json } from '@sveltejs/kit';
import { getAllPaths, createPath } from '$lib/server/api/paths';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json(getAllPaths());
};

export const POST: RequestHandler = async ({ request }) => {
	const { name, description } = await request.json();
	const path = createPath(name, description);
	return json(path, { status: 201 });
};
