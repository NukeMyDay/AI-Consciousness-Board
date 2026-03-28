<script lang="ts">
	import type { FeedItem, Feed, Resource } from '$lib/types';

	let {
		onresourcesaved
	}: {
		onresourcesaved: (resourceId: string) => void;
	} = $props();

	let discoverItems = $state<FeedItem[]>([]);
	let feeds = $state<Feed[]>([]);
	let loading = $state(false);
	let fetching = $state(false);
	let fetchErrors = $state<string[]>([]);
	let showManageFeeds = $state(false);
	let showAddFeed = $state(false);
	let newFeedName = $state('');
	let newFeedUrl = $state('');
	let newFeedCategory = $state('');
	let newFeedKeywords = $state('');

	$effect(() => {
		loadItems();
	});

	async function loadItems() {
		loading = true;
		const res = await fetch('/api/discover');
		if (res.ok) discoverItems = await res.json();
		loading = false;
	}

	async function loadFeeds() {
		const res = await fetch('/api/feeds');
		if (res.ok) feeds = await res.json();
	}

	async function fetchFeeds() {
		fetching = true;
		fetchErrors = [];
		const res = await fetch('/api/feeds/fetch', { method: 'POST' });
		if (res.ok) {
			const result = await res.json();
			fetchErrors = result.errors ?? [];
			await loadItems();
		}
		fetching = false;
	}

	async function dismissItem(id: string) {
		await fetch(`/api/discover/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'dismiss' })
		});
		discoverItems = discoverItems.filter((i) => i.id !== id);
	}

	let savedMsg = $state('');

	async function saveItem(id: string) {
		const item = discoverItems.find((i) => i.id === id);
		const res = await fetch(`/api/discover/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'save' })
		});
		if (res.ok) {
			const result = await res.json();
			discoverItems = discoverItems.filter((i) => i.id !== id);
			savedMsg = `"${item?.title?.substring(0, 40)}..." added to Up Next`;
			setTimeout(() => (savedMsg = ''), 3000);
			if (result.resourceId) onresourcesaved(result.resourceId);
		}
	}

	async function addFeed() {
		if (!newFeedName.trim() || !newFeedUrl.trim()) return;
		await fetch('/api/feeds', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: newFeedName,
				url: newFeedUrl,
				category: newFeedCategory || undefined,
				keywords: newFeedKeywords || undefined
			})
		});
		newFeedName = '';
		newFeedUrl = '';
		newFeedCategory = '';
		newFeedKeywords = '';
		showAddFeed = false;
		await loadFeeds();
	}

	async function removeFeed(id: string) {
		await fetch(`/api/feeds/${id}`, { method: 'DELETE' });
		feeds = feeds.filter((f) => f.id !== id);
	}

	async function toggleFeed(id: string, isActive: boolean) {
		await fetch(`/api/feeds/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isActive: !isActive })
		});
		feeds = feeds.map((f) => f.id === id ? { ...f, isActive: !isActive } : f);
	}

	function toggleManageFeeds() {
		showManageFeeds = !showManageFeeds;
		if (showManageFeeds && feeds.length === 0) loadFeeds();
	}

	const inputClass = 'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-surface-400 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200';
</script>

<div>
	<!-- Header with actions -->
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<button
				onclick={fetchFeeds}
				disabled={fetching}
				class="text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 disabled:opacity-50"
			>
				{fetching ? 'Fetching...' : 'Refresh feeds'}
			</button>
			<button
				onclick={toggleManageFeeds}
				class="text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
			>
				{showManageFeeds ? 'Hide feeds' : 'Manage feeds'}
			</button>
		</div>
	</div>

	{#if fetchErrors.length > 0}
		<div class="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
			{#each fetchErrors as err}
				<p class="text-[11px] text-red-400">{err}</p>
			{/each}
		</div>
	{/if}

	<!-- Manage feeds panel -->
	{#if showManageFeeds}
		<div class="mb-5 rounded-lg border border-surface-200 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-850">
			<div class="space-y-2">
				{#each feeds as f (f.id)}
					<div class="flex items-center gap-3">
						<button
							onclick={() => toggleFeed(f.id, f.isActive)}
							class="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors
								{f.isActive ? 'border-accent bg-accent text-white' : 'border-surface-300 dark:border-surface-600'}"
						>
							{#if f.isActive}
								<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
								</svg>
							{/if}
						</button>
						<span class="flex-1 text-xs {f.isActive ? '' : 'text-surface-400 line-through'}">{f.name}</span>
						{#if f.keywords}
							<span class="text-[10px] text-surface-400 dark:text-surface-600">{f.keywords.split(',').length} keywords</span>
						{/if}
						<span class="text-[10px] text-surface-400 dark:text-surface-600">{f.category ?? ''}</span>
						<button
							onclick={() => removeFeed(f.id)}
							class="text-[10px] text-surface-400 hover:text-red-400"
						>
							Remove
						</button>
					</div>
				{/each}
			</div>

			{#if showAddFeed}
				<div class="mt-3 space-y-2 border-t border-surface-200 pt-3 dark:border-surface-800">
					<input bind:value={newFeedName} placeholder="Feed name" class={inputClass} />
					<input bind:value={newFeedUrl} placeholder="RSS/Atom URL" class={inputClass} />
					<input bind:value={newFeedCategory} placeholder="Category (optional)" class={inputClass} />
					<input bind:value={newFeedKeywords} placeholder="Keywords, comma-separated (optional)" class={inputClass} />
					<div class="flex gap-2">
						<button onclick={() => (showAddFeed = false)} class="text-xs text-surface-500">Cancel</button>
						<button onclick={addFeed} disabled={!newFeedName.trim() || !newFeedUrl.trim()} class="rounded bg-accent px-2 py-1 text-xs text-white hover:bg-accent/90 disabled:opacity-40">Add feed</button>
					</div>
				</div>
			{:else}
				<button onclick={() => (showAddFeed = true)} class="mt-3 text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200">
					+ Add feed
				</button>
			{/if}
		</div>
	{/if}

	<!-- Discover items -->
	{#if loading}
		<p class="text-xs text-surface-500">Loading...</p>
	{:else if discoverItems.length === 0}
		<p class="text-xs text-surface-400 dark:text-surface-600">No new items. Click "Refresh feeds" to fetch latest content.</p>
	{:else}
		<div class="rounded-xl border border-surface-200 bg-white dark:border-surface-700/50 dark:bg-surface-850">
			{#each discoverItems as item, i (item.id)}
				{#if i > 0}
					<div class="mx-4 border-t border-surface-200 dark:border-surface-700/50"></div>
				{/if}
				<div class="group flex items-start gap-3 px-4 py-3">
					<div class="min-w-0 flex-1">
						<a
							href={item.url}
							target="_blank"
							rel="noopener noreferrer"
							class="text-sm hover:text-accent"
						>
							{item.title}
						</a>
						<div class="mt-0.5 flex items-center gap-2 text-[10px] text-surface-500 dark:text-surface-500">
							<span>{item.feedName}</span>
							{#if item.publishedAt}
								<span>·</span>
								<span>{new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
							{/if}
						</div>
						{#if item.summary}
							<p class="mt-1 text-[11px] leading-relaxed text-surface-500 dark:text-surface-400 line-clamp-2">{item.summary}</p>
						{/if}
					</div>

					<div class="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
						<button
							onclick={() => saveItem(item.id)}
							class="rounded-md px-2 py-1 text-[10px] text-accent ring-1 ring-accent/30 hover:bg-accent/10"
						>
							Save
						</button>
						<button
							onclick={() => dismissItem(item.id)}
							class="rounded-md p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
							title="Dismiss"
						>
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if savedMsg}
		<div class="mt-3 text-xs text-accent">{savedMsg}</div>
	{/if}
</div>
