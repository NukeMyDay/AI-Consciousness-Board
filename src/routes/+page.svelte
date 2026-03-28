<script lang="ts">
	import type { Resource, LearningPath } from '$lib/types';
	import DashboardSection from '$lib/components/DashboardSection.svelte';
	import FeaturedCard from '$lib/components/FeaturedCard.svelte';
	import CompactListItem from '$lib/components/CompactListItem.svelte';
	import ResourceDialog from '$lib/components/ResourceDialog.svelte';
	import LearningPathCard from '$lib/components/LearningPathCard.svelte';
	import GamificationBar from '$lib/components/GamificationBar.svelte';
	import DiscoverSection from '$lib/components/DiscoverSection.svelte';
	import ReviewSection from '$lib/components/ReviewSection.svelte';
	import KnowledgeCardsSection from '$lib/components/KnowledgeCardsSection.svelte';

	let { data } = $props();

	let resources = $state(data.resources);
	let tags = $state(data.tags);
	let paths = $state<LearningPath[]>(data.paths);

	let dialogOpen = $state(false);
	let selectedResource = $state<Resource | null>(null);

	// Toast
	let toast = $state('');
	let toastTimeout: ReturnType<typeof setTimeout>;

	function showToast(msg: string) {
		toast = msg;
		clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => (toast = ''), 2500);
	}

	// Resource → Learning Path mapping
	let resourcePathMap = $derived.by(() => {
		const map: Record<string, string[]> = {};
		for (const p of paths) {
			for (const s of p.steps) {
				if (s.resourceId) {
					if (!map[s.resourceId]) map[s.resourceId] = [];
					if (!map[s.resourceId].includes(p.name)) map[s.resourceId].push(p.name);
				}
			}
		}
		return map;
	});

	// Derived sections
	let allUpNext = $derived(
		resources
			.filter((r) => r.status === 'to_read')
			.sort((a, b) => {
				const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
				return (pOrder[a.priority] ?? 3) - (pOrder[b.priority] ?? 3);
			})
	);

	let upNextExpanded = $state(false);
	let upNext = $derived(upNextExpanded ? allUpNext : allUpNext.slice(0, 6));
	let hasMoreUpNext = $derived(allUpNext.length > 6);

	let currentlyReading = $derived(
		resources.filter((r) => r.status === 'reading')
	);

	let completed = $derived(
		resources.filter((r) => r.status === 'done' || r.status === 'applied')
	);

	// Library filters
	let librarySearch = $state('');
	let libraryTag = $state('');
	let libraryType = $state('');
	let libraryStatus = $state('');

	let libraryResources = $derived.by(() => {
		let result = resources;
		if (librarySearch) {
			const q = librarySearch.toLowerCase();
			result = result.filter(
				(r) =>
					r.title.toLowerCase().includes(q) ||
					r.authors.some((a) => a.name.toLowerCase().includes(q))
			);
		}
		if (libraryTag) {
			result = result.filter((r) => r.tags.some((t) => t.id === libraryTag));
		}
		if (libraryType) {
			result = result.filter((r) => r.type === libraryType);
		}
		if (libraryStatus) {
			result = result.filter((r) => r.status === libraryStatus);
		}
		// Sort: reading > to_read > backlog > done/applied
		const statusOrder: Record<string, number> = {
			reading: 0,
			to_read: 1,
			backlog: 2,
			done: 3,
			applied: 4
		};
		result = [...result].sort(
			(a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)
		);
		return result;
	});

	// Stats
	let stats = $derived({
		total: resources.length,
		toRead: resources.filter((r) => r.status === 'to_read').length,
		reading: resources.filter((r) => r.status === 'reading').length,
		done: resources.filter((r) => r.status === 'done' || r.status === 'applied').length,
		backlog: resources.filter((r) => r.status === 'backlog').length
	});

	async function handleStatusChange(id: string, status: string) {
		const res = await fetch(`/api/resources/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status })
		});
		if (res.ok) {
			const updated = await res.json();
			resources = resources.map((r) => (r.id === id ? updated : r));
			const labels: Record<string, string> = {
				to_read: 'Saved to read',
				reading: 'Marked as reading',
				done: 'Marked as done',
				backlog: 'Moved to backlog'
			};
			showToast(labels[status] ?? 'Updated');
		}
	}

	function handleResourceClick(resource: Resource) {
		selectedResource = resource;
		dialogOpen = true;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (dialogOpen) return;
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
	}

	const types = ['paper', 'book', 'blog_post', 'podcast', 'video', 'website', 'community'];

	// Learning Paths
	let showCreatePath = $state(false);
	let newPathName = $state('');
	let newPathDescription = $state('');

	async function handleDeletePath(id: string) {
		const res = await fetch(`/api/paths/${id}`, { method: 'DELETE' });
		if (res.ok) {
			paths = paths.filter((p) => p.id !== id);
			showToast('Learning path deleted');
		}
	}

	async function handleResourceSaved(resourceId: string) {
		const res = await fetch(`/api/resources/${resourceId}`);
		if (res.ok) {
			const newResource: Resource = await res.json();
			resources = [...resources, newResource];
			showToast('Resource added to Up Next');
		}
	}

	async function createPath() {
		if (!newPathName.trim()) return;
		const res = await fetch('/api/paths', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newPathName, description: newPathDescription || undefined })
		});
		if (res.ok) {
			const created: LearningPath = await res.json();
			paths = [...paths, created];
			newPathName = '';
			newPathDescription = '';
			showCreatePath = false;
			showToast('Learning path created');
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Gamification Bar -->
<GamificationBar {resources} {tags} {paths} />

<!-- Review — due knowledge cards -->
<DashboardSection title="Review" collapsible defaultOpen={true}>
	<ReviewSection />
</DashboardSection>

<!-- Up Next — featured cards -->
{#if allUpNext.length > 0}
	<DashboardSection title="Up Next" count={allUpNext.length} collapsible>
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each upNext as r (r.id)}
				<FeaturedCard
					resource={r}
					onclick={() => handleResourceClick(r)}
					onstatuschange={handleStatusChange}
					ondismiss={(id) => handleStatusChange(id, 'backlog')}
					pathNames={resourcePathMap[r.id] ?? []}
				/>
			{/each}
		</div>
		{#if hasMoreUpNext}
			<button
				onclick={() => (upNextExpanded = !upNextExpanded)}
				class="mt-3 text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
			>
				{upNextExpanded ? 'Show less' : `Show ${allUpNext.length - 6} more`}
			</button>
		{/if}
	</DashboardSection>
{/if}

<!-- Currently Reading — featured cards -->
{#if currentlyReading.length > 0}
	<DashboardSection title="Currently Reading" count={currentlyReading.length} collapsible>
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each currentlyReading as r (r.id)}
				<FeaturedCard
					resource={r}
					onclick={() => handleResourceClick(r)}
					onstatuschange={handleStatusChange}
					ondismiss={(id) => handleStatusChange(id, 'backlog')}
					pathNames={resourcePathMap[r.id] ?? []}
				/>
			{/each}
		</div>
	</DashboardSection>
{/if}

<!-- Knowledge Cards -->
<DashboardSection title="Knowledge Cards" collapsible defaultOpen={false}>
	<KnowledgeCardsSection {resources} />
</DashboardSection>

<!-- Learning Paths -->
<DashboardSection title="Learning Paths" count={paths.length} collapsible defaultOpen={false}>
	{#if paths.length > 0}
		<div class="space-y-3">
			{#each paths as p (p.id)}
				<LearningPathCard
					path={p}
					{resources}
					onupdate={(updated) => { paths = paths.map((pp) => (pp.id === updated.id ? updated : pp)); }}
					ondelete={handleDeletePath}
					onstatuschange={handleStatusChange}
					onresourceclick={handleResourceClick}
				/>
			{/each}
		</div>
	{/if}

	{#if showCreatePath}
		<div class="mt-3 rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-800/60 dark:bg-surface-900/40">
			<input
				bind:value={newPathName}
				placeholder="Path name, e.g. 'AI Consciousness Foundations'"
				class="mb-2 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-surface-400 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200"
			/>
			<input
				bind:value={newPathDescription}
				placeholder="Description (optional)"
				class="mb-3 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-surface-400 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200"
			/>
			<div class="flex gap-2">
				<button onclick={() => (showCreatePath = false)} class="text-xs text-surface-500 hover:text-surface-300">Cancel</button>
				<button
					onclick={createPath}
					disabled={!newPathName.trim()}
					class="rounded bg-accent px-3 py-1 text-xs text-white hover:bg-accent/90 disabled:opacity-40"
				>
					Create
				</button>
			</div>
		</div>
	{:else}
		<button
			onclick={() => (showCreatePath = true)}
			class="mt-3 text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
		>
			+ New learning path
		</button>
	{/if}
</DashboardSection>

<!-- Completed — compact list -->
{#if completed.length > 0}
	<DashboardSection title="Completed" count={completed.length} collapsible defaultOpen={false}>
		<div class="rounded-xl border border-surface-200 bg-white dark:border-surface-700/50 dark:bg-surface-850">
			{#each completed as r, i (r.id)}
				{#if i > 0}
					<div class="mx-3 border-t border-surface-100 dark:border-surface-800/30"></div>
				{/if}
				<CompactListItem
					resource={r}
					onclick={() => handleResourceClick(r)}
					onstatuschange={handleStatusChange}
					pathNames={resourcePathMap[r.id] ?? []}
				/>
			{/each}
		</div>
	</DashboardSection>
{/if}

<!-- Discover -->
<DashboardSection title="Discover" collapsible defaultOpen={false}>
	<DiscoverSection onresourcesaved={handleResourceSaved} />
</DashboardSection>

<!-- Full Library — collapsible, with filters -->
<DashboardSection title="Library" count={libraryResources.length} collapsible defaultOpen={false}>
	<!-- Filters -->
	<div class="mb-5 flex flex-wrap items-center gap-3">
		<div class="relative">
			<svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				placeholder="Search library..."
				bind:value={librarySearch}
				class="h-9 w-56 rounded-lg border border-surface-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-surface-400 dark:border-surface-800/60 dark:bg-surface-900 dark:text-surface-300 dark:focus:border-surface-600"
			/>
		</div>
		<select bind:value={libraryTag} class="h-9 rounded-lg border border-surface-200 bg-white px-3 text-sm outline-none focus:border-surface-400 dark:border-surface-800/60 dark:bg-surface-900 dark:text-surface-300 dark:focus:border-surface-600">
			<option value="">All tags</option>
			{#each tags as t (t.id)}
				<option value={t.id}>{t.name}</option>
			{/each}
		</select>
		<select bind:value={libraryType} class="h-9 rounded-lg border border-surface-200 bg-white px-3 text-sm outline-none focus:border-surface-400 dark:border-surface-800/60 dark:bg-surface-900 dark:text-surface-300 dark:focus:border-surface-600">
			<option value="">All types</option>
			{#each types as t}
				<option value={t}>{t.replace('_', ' ')}</option>
			{/each}
		</select>
		<select bind:value={libraryStatus} class="h-9 rounded-lg border border-surface-200 bg-white px-3 text-sm outline-none focus:border-surface-400 dark:border-surface-800/60 dark:bg-surface-900 dark:text-surface-300 dark:focus:border-surface-600">
			<option value="">All statuses</option>
			<option value="reading">Reading</option>
			<option value="to_read">To Read</option>
			<option value="backlog">Backlog</option>
			<option value="done">Done</option>
			<option value="applied">Applied</option>
		</select>
	</div>

	<!-- List -->
	<div class="rounded-xl border border-surface-200 bg-white dark:border-surface-700/50 dark:bg-surface-850">
		{#each libraryResources as r, i (r.id)}
			{#if i > 0}
				<div class="mx-3 border-t border-surface-100 dark:border-surface-800/30"></div>
			{/if}
			<CompactListItem
				resource={r}
				onclick={() => handleResourceClick(r)}
				onstatuschange={handleStatusChange}
					pathNames={resourcePathMap[r.id] ?? []}
	
			/>
		{/each}
		{#if libraryResources.length === 0}
			<p class="px-4 py-8 text-center text-sm text-surface-400">No resources match your filters.</p>
		{/if}
	</div>
</DashboardSection>

<ResourceDialog
	resource={selectedResource}
	bind:open={dialogOpen}
	onstatuschange={handleStatusChange}
	onresourceupdate={(updated) => { resources = resources.map((r) => (r.id === updated.id ? updated : r)); }}
/>

<!-- Toast -->
{#if toast}
	<div class="fixed bottom-4 right-4 z-50 rounded-lg bg-surface-800 px-4 py-2 text-sm text-white shadow-lg dark:bg-surface-200 dark:text-surface-900">
		{toast}
	</div>
{/if}
