<script lang="ts">
	import type { Resource } from '$lib/types';
	import ResourceCard from './ResourceCard.svelte';
	import { dndzone } from 'svelte-dnd-action';

	let {
		status,
		label,
		items = $bindable(),
		onstatuschange,
		onresourceclick
	}: {
		status: string;
		label: string;
		items: Resource[];
		onstatuschange: (id: string, status: string) => void;
		onresourceclick: (resource: Resource) => void;
	} = $props();

	const flipDurationMs = 200;

	function handleDndConsider(e: CustomEvent<{ items: Resource[] }>) {
		items = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<{ items: Resource[] }>) {
		items = e.detail.items;
		for (const item of items) {
			if (item.status !== status) {
				onstatuschange(item.id, status);
			}
		}
	}
</script>

<div class="flex h-full w-72 shrink-0 flex-col rounded-xl bg-surface-100/50 dark:bg-surface-900/50">
	<div class="flex items-center justify-between px-3 py-2.5">
		<h2 class="text-sm font-semibold text-surface-600 dark:text-surface-400">{label}</h2>
		<span class="rounded-full bg-surface-200 px-2 py-0.5 text-xs font-medium text-surface-500 dark:bg-surface-800">
			{items.length}
		</span>
	</div>

	<div
		class="flex min-h-[100px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2"
		use:dndzone={{ items, flipDurationMs, type: 'resource' }}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
	>
		{#each items as item (item.id)}
			<ResourceCard resource={item} onclick={() => onresourceclick(item)} />
		{/each}
	</div>
</div>
