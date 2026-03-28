<script lang="ts">
	import type { KnowledgeCard } from '$lib/types';

	let {
		resourceId
	}: {
		resourceId: string;
	} = $props();

	let cards = $state<KnowledgeCard[]>([]);
	let showCreate = $state(false);
	let newConcept = $state('');
	let newExplanation = $state('');

	$effect(() => {
		loadCards();
	});

	async function loadCards() {
		const res = await fetch(`/api/cards?resourceId=${resourceId}`);
		if (res.ok) cards = await res.json();
	}

	async function createCard() {
		if (!newConcept.trim()) return;
		const res = await fetch('/api/cards', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ concept: newConcept, explanation: newExplanation || undefined, resourceId })
		});
		if (res.ok) {
			const card: KnowledgeCard = await res.json();
			cards = [card, ...cards];
			newConcept = '';
			newExplanation = '';
			showCreate = false;
		}
	}

	async function deleteCard(id: string) {
		await fetch(`/api/cards/${id}`, { method: 'DELETE' });
		cards = cards.filter((c) => c.id !== id);
	}

	const inputClass = 'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-surface-400 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200';
</script>

<div class="mt-6 border-t border-surface-200 pt-6 dark:border-surface-800">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">
			Knowledge Cards
			{#if cards.length > 0}
				<span class="ml-1 text-surface-400 dark:text-surface-500">{cards.length}</span>
			{/if}
		</h3>
		<button
			onclick={() => (showCreate = !showCreate)}
			class="text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
		>
			{showCreate ? 'Cancel' : 'Add card'}
		</button>
	</div>

	{#if showCreate}
		<div class="mb-4 rounded-lg border border-surface-200 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-850">
			<input bind:value={newConcept} placeholder="Concept or question to remember" class="{inputClass} mb-2" />
			<textarea bind:value={newExplanation} placeholder="Expected explanation (optional)" rows={2} class={inputClass}></textarea>
			<div class="mt-2 flex gap-2">
				<button onclick={() => (showCreate = false)} class="text-xs text-surface-500">Cancel</button>
				<button
					onclick={createCard}
					disabled={!newConcept.trim()}
					class="rounded bg-accent px-2 py-1 text-xs text-white hover:bg-accent/90 disabled:opacity-40"
				>
					Create
				</button>
			</div>
		</div>
	{/if}

	{#if cards.length > 0}
		<div class="space-y-2">
			{#each cards as card (card.id)}
				<div class="group flex items-start gap-3 rounded-lg bg-surface-50 px-3 py-2.5 dark:bg-surface-850">
					<div class="min-w-0 flex-1">
						<span class="text-xs font-medium">{card.concept}</span>
						{#if card.explanation}
							<p class="mt-0.5 text-[11px] text-surface-500 dark:text-surface-400">{card.explanation}</p>
						{/if}
					</div>
					<button
						onclick={() => deleteCard(card.id)}
						class="text-[10px] text-surface-400 opacity-0 hover:text-red-400 group-hover:opacity-100"
					>
						Remove
					</button>
				</div>
			{/each}
		</div>
	{:else if !showCreate}
		<p class="text-sm text-surface-400 dark:text-surface-600">No knowledge cards yet.</p>
	{/if}
</div>
