<script lang="ts">
	import type { Resource } from '$lib/types';
	import { TYPE_LABELS } from '$lib/types';
	import { XP_PER_TYPE } from '$lib/gamification';
	import QuickActions from './QuickActions.svelte';

	let {
		resource,
		onclick,
		onstatuschange,
		pathNames = []
	}: {
		resource: Resource;
		onclick: () => void;
		onstatuschange: (id: string, status: string) => void;
		pathNames?: string[];
	} = $props();

	const statusColors: Record<string, string> = {
		to_read: '#8B5CF6',
		reading: '#3B82F6',
		done: '#10B981',
		applied: '#10B981'
	};

	let borderColor = $derived(statusColors[resource.status] ?? 'transparent');
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div
	class="group flex w-full cursor-pointer items-center gap-3 border-l-3 py-3 pl-4 pr-4 text-left transition-colors hover:bg-surface-100 dark:hover:bg-surface-800/30"
	style="border-left-color: {borderColor}"
	onclick={onclick}
>
	<span class="w-24 shrink-0 text-xs text-surface-400 dark:text-surface-500">
		{TYPE_LABELS[resource.type]}
		<span class="text-accent/50">{XP_PER_TYPE[resource.type]}</span>
	</span>

	<div class="min-w-0 flex-1">
		<span class="text-sm">{resource.title}</span>
		{#if resource.authors.length > 0}
			<span class="ml-2 text-xs text-surface-500 dark:text-surface-500">
				{resource.authors.map((a) => a.name).join(', ')}
			</span>
		{/if}
		{#if pathNames.length > 0}
			<span class="ml-2 text-[10px] text-accent/70">{pathNames.join(', ')}</span>
		{/if}
	</div>

	{#if resource.personalNotes || (resource.highlightCount ?? 0) > 0}
		<span class="hidden shrink-0 items-center gap-1.5 text-[10px] text-surface-400 dark:text-surface-500 sm:flex">
			{#if resource.personalNotes}
				<span>Notes</span>
			{/if}
			{#if (resource.highlightCount ?? 0) > 0}
				<span>{resource.highlightCount}h</span>
			{/if}
		</span>
	{/if}

	<div class="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
		<QuickActions
			status={resource.status}
			url={resource.url}
			onstatuschange={(s) => onstatuschange(resource.id, s)}
		/>
	</div>
</div>
