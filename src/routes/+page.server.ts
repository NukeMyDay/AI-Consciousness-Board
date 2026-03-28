import { getAllResources, getAllTags } from '$lib/server/api/resources';
import { getAllPaths } from '$lib/server/api/paths';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		resources: getAllResources(),
		tags: getAllTags(),
		paths: getAllPaths()
	};
};
