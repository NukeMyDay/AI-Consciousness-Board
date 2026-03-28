import { json } from '@sveltejs/kit';
import { getAllResources, getAllTags } from '$lib/server/api/resources';
import { getAllPaths } from '$lib/server/api/paths';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const data = {
		exportedAt: new Date().toISOString(),
		resources: getAllResources(),
		tags: getAllTags(),
		paths: getAllPaths()
	};

	return new Response(JSON.stringify(data, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': 'attachment; filename="ai-consciousness-board-export.json"'
		}
	});
};
