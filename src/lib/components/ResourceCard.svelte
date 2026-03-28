<script lang="ts">
	import type { Resource } from '$lib/types';
	import { TYPE_LABELS, PRIORITY_COLORS } from '$lib/types';
	import TagBadge from './TagBadge.svelte';

	let { resource, onclick }: { resource: Resource; onclick?: () => void } = $props();
</script>

<button
	class="group w-full cursor-grab rounded-lg border border-surface-200 bg-white p-3 text-left shadow-sm transition-all hover:shadow-md active:cursor-grabbing dark:border-surface-700 dark:bg-surface-850 dark:hover:border-surface-600"
	{onclick}
>
	<div class="mb-2 flex items-start justify-between gap-2">
		<div class="flex items-center gap-1.5">
			<span class="text-sm" title={resource.type}>{TYPE_LABELS[resource.type]}</span>
			<span
				class="h-1.5 w-1.5 rounded-full"
				style="background-color: {PRIORITY_COLORS[resource.priority]}"
				title="Priority: {resource.priority}"
			></span>
		</div>
		{#if resource.difficulty}
			<span
				class="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider
					{resource.difficulty === 'beginner'
					? 'bg-green-500/10 text-green-600 dark:text-green-400'
					: resource.difficulty === 'intermediate'
						? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
						: 'bg-red-500/10 text-red-600 dark:text-red-400'}"
			>
				{resource.difficulty}
			</span>
		{/if}
	</div>

	<h3 class="mb-1 text-sm font-medium leading-snug">{resource.title}</h3>

	{#if resource.authors.length > 0}
		<p class="mb-2 text-xs text-surface-500">
			{resource.authors.map((a) => a.name).join(', ')}
		</p>
	{/if}

	{#if resource.tags.length > 0}
		<div class="flex flex-wrap gap-1">
			{#each resource.tags.slice(0, 3) as t (t.id)}
				<TagBadge tag={t} small />
			{/each}
			{#if resource.tags.length > 3}
				<span class="px-1 text-[10px] text-surface-400">+{resource.tags.length - 3}</span>
			{/if}
		</div>
	{/if}
</button>
