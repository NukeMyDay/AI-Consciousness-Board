<script lang="ts">
	import type { Resource } from '$lib/types';
	import { TYPE_LABELS } from '$lib/types';
	import { XP_PER_TYPE } from '$lib/gamification';
	import QuickActions from './QuickActions.svelte';

	const metaTags = ['Must Read', 'Anthropic'];

	let {
		resource,
		onclick,
		onstatuschange,
		ondismiss,
		pathNames = []
	}: {
		resource: Resource;
		onclick: () => void;
		onstatuschange: (id: string, status: string) => void;
		ondismiss?: (id: string) => void;
		pathNames?: string[];
	} = $props();

	let visibleTags = $derived(resource.tags.filter(t => !metaTags.includes(t.name)));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div
	class="group w-full cursor-pointer rounded-xl border border-surface-200 bg-white p-5 text-left transition-all hover:border-surface-300 dark:border-surface-700/50 dark:bg-surface-850 dark:hover:border-surface-600"
	onclick={onclick}
>
	<div class="mb-3 flex items-center justify-between">
		<span class="text-xs text-surface-500 dark:text-surface-400">
			{TYPE_LABELS[resource.type]}
			{#if resource.difficulty}
				<span class="text-surface-300 dark:text-surface-500"> · </span>
				<span class="capitalize">{resource.difficulty}</span>
			{/if}
			<span class="text-surface-300 dark:text-surface-500"> · </span>
			<span class="text-accent/70">{XP_PER_TYPE[resource.type]} XP</span>
		</span>
		<div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
			<QuickActions
				status={resource.status}
				url={resource.url}
				onstatuschange={(s) => onstatuschange(resource.id, s)}
			/>
			{#if ondismiss}
				<button
					class="cursor-pointer rounded-md p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
					title="Remove from Up Next"
					onclick={(e) => { e.stopPropagation(); ondismiss(resource.id); }}
				>
					<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<h3 class="mb-1 text-[15px] font-medium leading-snug">{resource.title}</h3>

	{#if resource.authors.length > 0}
		<p class="text-xs text-surface-500 dark:text-surface-400">{resource.authors.map((a) => a.name).join(', ')}</p>
	{/if}

	{#if pathNames.length > 0}
		<p class="mt-1 text-[10px] text-accent/70">{pathNames.join(', ')}</p>
	{/if}

	{#if visibleTags.length > 0 || resource.personalNotes || (resource.highlightCount ?? 0) > 0}
		<div class="mt-3 flex flex-wrap items-center gap-1.5">
			{#each visibleTags.slice(0, 3) as t (t.id)}
				<span class="rounded-full px-2 py-0.5 text-[10px] text-surface-500 dark:text-surface-400 ring-1 ring-surface-200 dark:ring-surface-700/60">
					{t.name}
				</span>
			{/each}
			{#if visibleTags.length > 3}
				<span class="px-1 text-[10px] text-surface-500 dark:text-surface-500">+{visibleTags.length - 3}</span>
			{/if}
			{#if resource.personalNotes || (resource.highlightCount ?? 0) > 0}
				<span class="ml-auto flex items-center gap-1.5 text-[10px] text-surface-400 dark:text-surface-500">
					{#if resource.personalNotes}
						<span title="Has notes">Notes</span>
					{/if}
					{#if (resource.highlightCount ?? 0) > 0}
						<span title="Has highlights">{resource.highlightCount} highlight{resource.highlightCount === 1 ? '' : 's'}</span>
					{/if}
				</span>
			{/if}
		</div>
	{/if}
</div>
