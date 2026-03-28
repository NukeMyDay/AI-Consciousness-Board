<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		count,
		children,
		collapsible = false,
		defaultOpen = true
	}: {
		title: string;
		count?: number;
		children: Snippet;
		collapsible?: boolean;
		defaultOpen?: boolean;
	} = $props();

	let open = $state(defaultOpen);
</script>

<section class="mb-10">
	<div class="mb-4 flex items-center gap-2">
		{#if collapsible}
			<button
				class="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-surface-400 dark:text-surface-300 hover:text-surface-400"
				onclick={() => (open = !open)}
			>
				<svg
					class="h-3 w-3 transition-transform {open ? 'rotate-90' : ''}"
					fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
				</svg>
				{title}
			</button>
		{:else}
			<h2 class="text-xs font-medium uppercase tracking-widest text-surface-400 dark:text-surface-300">
				{title}
			</h2>
		{/if}
		{#if count !== undefined}
			<span class="text-[10px] text-surface-400 dark:text-surface-300">{count}</span>
		{/if}
	</div>

	{#if open}
		{@render children()}
	{/if}
</section>
