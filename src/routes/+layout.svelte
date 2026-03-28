<script lang="ts">
	import '../app.css';

	let { children } = $props();
	let dark = $state(true);

	$effect(() => {
		if (dark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});
</script>

<div class="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-950 dark:text-surface-100">
	<header class="sticky top-0 z-50 border-b border-surface-200 bg-surface-50/80 backdrop-blur dark:border-surface-800 dark:bg-surface-950/80">
		<div class="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4">
			<div class="flex items-center gap-3">
				<h1 class="text-lg font-semibold tracking-tight">
					<span class="text-accent">AI</span> Consciousness Board
				</h1>
			</div>
			<div class="flex items-center gap-1">
				<a
					href="/api/export"
					class="rounded-lg p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
					title="Export as JSON"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
				</a>
				<button
					onclick={() => (dark = !dark)}
					class="rounded-lg p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
					aria-label="Toggle dark mode"
				>
				{#if dark}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				{:else}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
					</svg>
				{/if}
			</button>
			</div>
		</div>
	</header>
	<main class="mx-auto max-w-[1600px] p-4">
		{@render children()}
	</main>
</div>
