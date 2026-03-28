<script lang="ts">
	import type { ResourceStatus } from '$lib/types';

	let {
		status,
		url,
		onstatuschange
	}: {
		status: ResourceStatus;
		url: string | null;
		onstatuschange: (status: ResourceStatus) => void;
	} = $props();
</script>

<div class="flex items-center gap-1">
	{#if url}
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			class="cursor-pointer rounded-md p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
			title="Open link"
			onclick={(e) => e.stopPropagation()}
		>
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
			</svg>
		</a>
	{/if}

	<button
		class="cursor-pointer rounded-md p-1.5 transition-colors {status === 'to_read'
			? 'text-accent bg-accent/10'
			: 'text-surface-400 hover:bg-surface-100 hover:text-accent dark:hover:bg-surface-800'}"
		title={status === 'to_read' ? 'Remove from reading list' : 'Save to read'}
		onclick={(e) => { e.stopPropagation(); onstatuschange(status === 'to_read' ? 'backlog' : 'to_read'); }}
	>
		<svg class="h-3.5 w-3.5" fill={status === 'to_read' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
		</svg>
	</button>

	<button
		class="cursor-pointer rounded-md p-1.5 transition-colors {status === 'reading'
			? 'text-blue-500 bg-blue-500/10'
			: 'text-surface-400 hover:bg-surface-100 hover:text-blue-500 dark:hover:bg-surface-800'}"
		title={status === 'reading' ? 'Stop reading' : 'Mark as reading'}
		onclick={(e) => { e.stopPropagation(); onstatuschange(status === 'reading' ? 'to_read' : 'reading'); }}
	>
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
		</svg>
	</button>

	<button
		class="cursor-pointer rounded-md p-1.5 transition-colors {status === 'done' || status === 'applied'
			? 'text-green-500 bg-green-500/10'
			: 'text-surface-400 hover:bg-surface-100 hover:text-green-500 dark:hover:bg-surface-800'}"
		title={status === 'done' ? 'Mark as not done' : 'Mark as done'}
		onclick={(e) => { e.stopPropagation(); onstatuschange(status === 'done' || status === 'applied' ? 'to_read' : 'done'); }}
	>
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
	</button>
</div>
