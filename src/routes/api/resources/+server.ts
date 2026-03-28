import { json } from '@sveltejs/kit';
import { getAllResources, createResource, getAllTags } from '$lib/server/api/resources';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const includeTags = url.searchParams.get('includeTags') === 'true';
	const resources = getAllResources();

	if (includeTags) {
		const tags = getAllTags();
		return json({ resources, tags });
	}

	return json({ resources });
};

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	const created = createResource(data);
	return json(created, { status: 201 });
};
