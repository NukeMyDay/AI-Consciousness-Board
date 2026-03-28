<script lang="ts">
	import type { Resource, ResourceStatus, Tag } from '$lib/types';
	import { STATUS_COLUMNS } from '$lib/types';
	import KanbanColumn from './KanbanColumn.svelte';

	let {
		resources,
		tags,
		onresourceclick,
		onstatuschange
	}: {
		resources: Resource[];
		tags: Tag[];
		onresourceclick: (resource: Resource) => void;
		onstatuschange: (id: string, status: string) => void;
	} = $props();

	// Filter state
	let searchQuery = $state('');
	let selectedTag = $state('');
	let selectedType = $state('');
	let selectedPriority = $state('');
	let selectedDifficulty = $state('');

	let filteredResources = $derived.by(() => {
		let result = resources;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(r) =>
					r.title.toLowerCase().includes(q) ||
					r.authors.some((a) => a.name.toLowerCase().includes(q))
			);
		}
		if (selectedTag) {
			result = result.filter((r) => r.tags.some((t) => t.id === selectedTag));
		}
		if (selectedType) {
			result = result.filter((r) => r.type === selectedType);
		}
		if (selectedPriority) {
			result = result.filter((r) => r.priority === selectedPriority);
		}
		if (selectedDifficulty) {
			result = result.filter((r) => r.difficulty === selectedDifficulty);
		}
		return result;
	});

	let columns = $derived(
		STATUS_COLUMNS.map((col) => ({
			...col,
			items: filteredResources.filter((r) => r.status === col.key)
		}))
	);

	// We need mutable copies for DnD
	let columnItems: Record<string, Resource[]> = $state({});

	$effect(() => {
		const next: Record<string, Resource[]> = {};
		for (const col of columns) {
			next[col.key] = [...col.items];
		}
		columnItems = next;
	});

	const types = ['paper', 'book', 'blog_post', 'podcast', 'video', 'website', 'community'];
	const priorities = ['low', 'medium', 'high', 'critical'];
	const difficulties = ['beginner', 'intermediate', 'advanced'];

	let hasActiveFilters = $derived(
		!!searchQuery || !!selectedTag || !!selectedType || !!selectedPriority || !!selectedDifficulty
	);

	function clearFilters() {
		searchQuery = '';
		selectedTag = '';
		selectedType = '';
		selectedPriority = '';
		selectedDifficulty = '';
	}
</script>

<!-- Filter bar -->
<div class="mb-4 flex flex-wrap items-center gap-2">
	<div class="relative">
		<svg class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
		</svg>
		<input
			type="text"
			placeholder="Search..."
			bind:value={searchQuery}
			class="h-8 w-48 rounded-lg border border-surface-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-accent dark:border-surface-700 dark:bg-surface-850"
		/>
	</div>

	<select bind:value={selectedTag} class="h-8 rounded-lg border border-surface-200 bg-white px-2 text-sm dark:border-surface-700 dark:bg-surface-850">
		<option value="">All tags</option>
		{#each tags as t (t.id)}
			<option value={t.id}>{t.name}</option>
		{/each}
	</select>

	<select bind:value={selectedType} class="h-8 rounded-lg border border-surface-200 bg-white px-2 text-sm dark:border-surface-700 dark:bg-surface-850">
		<option value="">All types</option>
		{#each types as t}
			<option value={t}>{t.replace('_', ' ')}</option>
		{/each}
	</select>

	<select bind:value={selectedPriority} class="h-8 rounded-lg border border-surface-200 bg-white px-2 text-sm dark:border-surface-700 dark:bg-surface-850">
		<option value="">All priorities</option>
		{#each priorities as p}
			<option value={p}>{p}</option>
		{/each}
	</select>

	<select bind:value={selectedDifficulty} class="h-8 rounded-lg border border-surface-200 bg-white px-2 text-sm dark:border-surface-700 dark:bg-surface-850">
		<option value="">All levels</option>
		{#each difficulties as d}
			<option value={d}>{d}</option>
		{/each}
	</select>

	{#if hasActiveFilters}
		<button
			onclick={clearFilters}
			class="h-8 rounded-lg bg-surface-200 px-3 text-xs font-medium text-surface-600 hover:bg-surface-300 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
		>
			Clear
		</button>
	{/if}

	<span class="ml-auto text-xs text-surface-400">
		{filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
	</span>
</div>

<!-- Kanban columns -->
<div class="flex gap-3 overflow-x-auto pb-4" style="height: calc(100vh - 160px)">
	{#each STATUS_COLUMNS as col (col.key)}
		{#if columnItems[col.key]}
			<KanbanColumn
				status={col.key}
				label={col.label}
				bind:items={columnItems[col.key]}
				{onstatuschange}
				{onresourceclick}
			/>
		{/if}
	{/each}
</div>
