<script lang="ts">
	import type { KnowledgeCard, Resource } from '$lib/types';

	let {
		resources
	}: {
		resources: Resource[];
	} = $props();

	let cards = $state<KnowledgeCard[]>([]);
	let loading = $state(true);
	let showCreate = $state(false);
	let newConcept = $state('');
	let newExplanation = $state('');
	let newResourceId = $state('');
	let filterResource = $state('');

	$effect(() => {
		loadCards();
	});

	async function loadCards() {
		loading = true;
		const res = await fetch('/api/cards');
		if (res.ok) cards = await res.json();
		loading = false;
	}

	let filteredCards = $derived(
		filterResource ? cards.filter((c) => c.resourceId === filterResource) : cards
	);

	async function createCard() {
		if (!newConcept.trim()) return;
		const res = await fetch('/api/cards', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				concept: newConcept,
				explanation: newExplanation || undefined,
				resourceId: newResourceId || undefined
			})
		});
		if (res.ok) {
			const card: KnowledgeCard = await res.json();
			cards = [card, ...cards];
			newConcept = '';
			newExplanation = '';
			newResourceId = '';
			showCreate = false;
		}
	}

	async function deleteCard(id: string) {
		await fetch(`/api/cards/${id}`, { method: 'DELETE' });
		cards = cards.filter((c) => c.id !== id);
	}

	const inputClass = 'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-surface-400 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200';
</script>

<div>
	<!-- Filter + actions -->
	<div class="mb-4 flex items-center gap-3">
		<select bind:value={filterResource} class="h-8 rounded-lg border border-surface-200 bg-white px-2 text-xs dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300">
			<option value="">All resources</option>
			{#each resources.filter(r => cards.some(c => c.resourceId === r.id)) as r (r.id)}
				<option value={r.id}>{r.title.substring(0, 50)}</option>
			{/each}
		</select>
		<span class="text-xs text-surface-500 dark:text-surface-400">{filteredCards.length} cards</span>
		<button
			onclick={() => (showCreate = !showCreate)}
			class="ml-auto text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
		>
			{showCreate ? 'Cancel' : '+ New card'}
		</button>
	</div>

	<!-- Create form -->
	{#if showCreate}
		<div class="mb-4 rounded-lg border border-surface-200 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-850">
			<input bind:value={newConcept} placeholder="Concept or question" class="{inputClass} mb-2" />
			<textarea bind:value={newExplanation} placeholder="Expected explanation (optional)" rows={2} class="{inputClass} mb-2"></textarea>
			<select bind:value={newResourceId} class="{inputClass} mb-3">
				<option value="">Link to resource (optional)</option>
				{#each resources as r (r.id)}
					<option value={r.id}>{r.title}</option>
				{/each}
			</select>
			<div class="flex gap-2">
				<button onclick={() => (showCreate = false)} class="text-xs text-surface-500">Cancel</button>
				<button
					onclick={createCard}
					disabled={!newConcept.trim()}
					class="rounded bg-accent px-3 py-1 text-xs text-white hover:bg-accent/90 disabled:opacity-40"
				>
					Create card
				</button>
			</div>
		</div>
	{/if}

	<!-- Cards list -->
	{#if loading}
		<p class="text-xs text-surface-500">Loading...</p>
	{:else if filteredCards.length === 0}
		<p class="text-xs text-surface-400 dark:text-surface-600">No knowledge cards yet. Create one from a resource or here directly.</p>
	{:else}
		<div class="rounded-xl border border-surface-200 bg-white dark:border-surface-700/50 dark:bg-surface-850">
			{#each filteredCards as card, i (card.id)}
				{#if i > 0}
					<div class="mx-4 border-t border-surface-200 dark:border-surface-700/50"></div>
				{/if}
				<div class="group flex items-start gap-3 px-4 py-3.5">
					<div class="min-w-0 flex-1">
						<span class="text-sm font-medium">{card.concept}</span>
						{#if card.resourceTitle}
							<span class="ml-2 text-[10px] text-surface-400 dark:text-surface-500">{card.resourceTitle}</span>
						{/if}
						{#if card.explanation}
							<p class="mt-1 text-xs text-surface-500 dark:text-surface-400 line-clamp-2">{card.explanation}</p>
						{/if}
					</div>
					<div class="flex shrink-0 items-center gap-2 text-[10px]">
						{#if card.reviewCount && card.reviewCount > 0}
							<span class="text-accent">{card.reviewCount}x reviewed</span>
						{/if}
						<button
							onclick={() => deleteCard(card.id)}
							class="text-surface-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
						>
							Remove
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
