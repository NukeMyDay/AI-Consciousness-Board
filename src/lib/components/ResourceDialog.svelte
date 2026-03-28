<script lang="ts">
	import type { Resource, Highlight } from '$lib/types';
	import { TYPE_LABELS } from '$lib/types';
	import QuickActions from './QuickActions.svelte';
	import ResourceChat from './ResourceChat.svelte';
	import ResourceKnowledgeCards from './ResourceKnowledgeCards.svelte';

	let {
		resource = null,
		open = $bindable(false),
		onstatuschange,
		onresourceupdate
	}: {
		resource?: Resource | null;
		open: boolean;
		onstatuschange: (id: string, status: string) => void;
		onresourceupdate: (resource: Resource) => void;
	} = $props();

	// Detail data (loaded when opening)
	let detailResource = $state<Resource | null>(null);
	let loading = $state(false);

	// Notes editing
	let editingNotes = $state(false);
	let notesValue = $state('');

	// Highlight form
	let showHighlightForm = $state(false);
	let highlightText = $state('');
	let highlightNote = $state('');

	$effect(() => {
		if (open && resource) {
			loadDetail(resource.id);
		} else {
			detailResource = null;
			editingNotes = false;
			showHighlightForm = false;
		}
	});

	async function loadDetail(id: string) {
		loading = true;
		const res = await fetch(`/api/resources/${id}?detail=true`);
		if (res.ok) {
			detailResource = await res.json();
		}
		loading = false;
	}

	async function saveNotes() {
		if (!detailResource) return;
		const res = await fetch(`/api/resources/${detailResource.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ personalNotes: notesValue || null })
		});
		if (res.ok) {
			const updated = await res.json();
			detailResource = { ...detailResource, personalNotes: updated.personalNotes };
			onresourceupdate(updated);
			editingNotes = false;
		}
	}

	async function clearNotes() {
		if (!detailResource) return;
		const res = await fetch(`/api/resources/${detailResource.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ personalNotes: null })
		});
		if (res.ok) {
			const updated = await res.json();
			detailResource = { ...detailResource, personalNotes: null };
			onresourceupdate(updated);
		}
	}

	function startEditNotes() {
		notesValue = detailResource?.personalNotes ?? '';
		editingNotes = true;
	}

	async function addHighlight() {
		if (!detailResource || !highlightText.trim()) return;
		const res = await fetch(`/api/resources/${detailResource.id}/highlights`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text: highlightText, note: highlightNote || undefined })
		});
		if (res.ok) {
			const hl: Highlight = await res.json();
			const newHighlights = [...(detailResource.highlights ?? []), hl];
			detailResource = {
				...detailResource,
				highlights: newHighlights,
				highlightCount: newHighlights.length
			};
			onresourceupdate({ ...detailResource });
			highlightText = '';
			highlightNote = '';
			showHighlightForm = false;
		}
	}

	async function removeHighlight(hlId: string) {
		if (!detailResource) return;
		const res = await fetch(`/api/resources/${detailResource.id}/highlights/${hlId}`, {
			method: 'DELETE'
		});
		if (res.ok) {
			const newHighlights = (detailResource.highlights ?? []).filter((h) => h.id !== hlId);
			detailResource = {
				...detailResource,
				highlights: newHighlights,
				highlightCount: newHighlights.length
			};
			onresourceupdate({ ...detailResource });
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (editingNotes) { editingNotes = false; return; }
			if (showHighlightForm) { showHighlightForm = false; return; }
			open = false;
		}
	}

	const statusLabels: Record<string, string> = {
		backlog: 'Backlog',
		to_read: 'To Read',
		reading: 'Reading',
		done: 'Done',
		applied: 'Applied'
	};

	const inputClass = 'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-surface-400 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200 dark:focus:border-surface-600';
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open && resource}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-[5vh] pb-[5vh]"
		onclick={() => (open = false)}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
		<div
			class="w-full max-w-2xl rounded-2xl border border-surface-200 bg-white p-8 shadow-2xl dark:border-surface-800 dark:bg-surface-900"
			onclick={(e) => e.stopPropagation()}
		>
			{#if loading && !detailResource}
				<div class="flex items-center justify-center py-12 text-sm text-surface-500">Loading...</div>
			{:else if detailResource}
				<!-- Header -->
				<div class="mb-6 flex items-start justify-between gap-4">
					<div class="flex-1">
						<div class="mb-2 flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
							<span>{TYPE_LABELS[detailResource.type]}</span>
							{#if detailResource.difficulty}
								<span class="text-surface-300 dark:text-surface-500">·</span>
								<span class="capitalize">{detailResource.difficulty}</span>
							{/if}
							<span class="text-surface-300 dark:text-surface-500">·</span>
							<span>{statusLabels[detailResource.status]}</span>
						</div>
						<h2 class="text-xl font-semibold leading-tight">{detailResource.title}</h2>
						{#if detailResource.authors.length > 0}
							<p class="mt-1.5 text-sm text-surface-500 dark:text-surface-400">
								{detailResource.authors.map((a) => a.name).join(', ')}
							</p>
						{/if}
					</div>
					<button
						onclick={() => (open = false)}
						class="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
						aria-label="Close"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Actions -->
				<div class="mb-6 flex items-center gap-3">
					<QuickActions
						status={detailResource.status}
						url={detailResource.url}
						onstatuschange={(s) => { onstatuschange(detailResource.id, s); detailResource = { ...detailResource, status: s }; }}
					/>
					{#if detailResource.url}
						<a
							href={detailResource.url}
							target="_blank"
							rel="noopener noreferrer"
							class="ml-auto text-xs text-surface-500 dark:text-surface-400 underline decoration-surface-300 dark:decoration-surface-600 hover:text-surface-700 dark:hover:text-surface-200"
						>
							{detailResource.url.replace(/^https?:\/\//, '').split('/')[0]}
						</a>
					{/if}
				</div>

				<!-- Tags -->
				{#if detailResource.tags.filter(t => !['Must Read', 'Anthropic'].includes(t.name)).length > 0}
					<div class="mb-6 flex flex-wrap gap-1.5">
						{#each detailResource.tags.filter(t => !['Must Read', 'Anthropic'].includes(t.name)) as t (t.id)}
							<span class="rounded-full px-2.5 py-1 text-xs text-surface-500 dark:text-surface-400 ring-1 ring-surface-200 dark:ring-surface-700">
								{t.name}
							</span>
						{/each}
					</div>
				{/if}

				<!-- Description -->
				{#if detailResource.description}
					<div class="mb-6">
						<p class="text-sm leading-relaxed text-surface-600 dark:text-surface-300">{detailResource.description}</p>
					</div>
				{/if}

				<!-- Notes -->
				<div class="border-t border-surface-200 dark:border-surface-800 pt-6">
					<div class="mb-3 flex items-center justify-between">
						<h3 class="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">Notes</h3>
						{#if !editingNotes}
							<div class="flex items-center gap-3">
								{#if detailResource.personalNotes}
									<button
										onclick={clearNotes}
										class="text-xs text-surface-500 dark:text-surface-500 hover:text-red-400"
									>
										Remove
									</button>
								{/if}
								<button
									onclick={startEditNotes}
									class="text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
								>
									{detailResource.personalNotes ? 'Edit' : 'Add notes'}
								</button>
							</div>
						{/if}
					</div>

					{#if editingNotes}
						<textarea
							bind:value={notesValue}
							rows={6}
							placeholder="Write your notes here... (Markdown supported)"
							class={inputClass}
						></textarea>
						<div class="mt-2 flex justify-end gap-2">
							<button
								onclick={() => (editingNotes = false)}
								class="rounded-lg px-3 py-1.5 text-xs text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
							>
								Cancel
							</button>
							<button
								onclick={saveNotes}
								class="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
							>
								Save
							</button>
						</div>
					{:else if detailResource.personalNotes}
						<div class="whitespace-pre-wrap text-sm leading-relaxed text-surface-600 dark:text-surface-300">
							{detailResource.personalNotes}
						</div>
					{:else}
						<p class="text-sm text-surface-400 dark:text-surface-600">No notes yet.</p>
					{/if}
				</div>

				<!-- Highlights -->
				<div class="mt-6 border-t border-surface-200 dark:border-surface-800 pt-6">
					<div class="mb-3 flex items-center justify-between">
						<h3 class="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">
							Highlights
							{#if detailResource.highlights?.length}
								<span class="ml-1 text-surface-400 dark:text-surface-500">{detailResource.highlights.length}</span>
							{/if}
						</h3>
						<button
							onclick={() => (showHighlightForm = !showHighlightForm)}
							class="text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
						>
							{showHighlightForm ? 'Cancel' : 'Add highlight'}
						</button>
					</div>

					{#if showHighlightForm}
						<div class="mb-4 rounded-lg border border-surface-200 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-850">
							<textarea
								bind:value={highlightText}
								rows={2}
								placeholder="Paste a quote or excerpt..."
								class="{inputClass} mb-2"
							></textarea>
							<input
								type="text"
								bind:value={highlightNote}
								placeholder="Your annotation (optional)"
								class={inputClass}
							/>
							<div class="mt-3 flex justify-end">
								<button
									onclick={addHighlight}
									disabled={!highlightText.trim()}
									class="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-40"
								>
									Add
								</button>
							</div>
						</div>
					{/if}

					{#if detailResource.highlights?.length}
						<div class="space-y-3">
							{#each detailResource.highlights as hl (hl.id)}
								<div class="group rounded-lg border-l-2 border-accent/40 bg-surface-50 px-4 py-3 dark:bg-surface-850">
									<p class="text-sm leading-relaxed text-surface-700 dark:text-surface-200 italic">
										"{hl.text}"
									</p>
									{#if hl.note}
										<p class="mt-1.5 text-xs text-surface-500 dark:text-surface-400">{hl.note}</p>
									{/if}
									<div class="mt-2 flex items-center justify-between">
										<span class="text-[10px] text-surface-400 dark:text-surface-600">
											{new Date(hl.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
										</span>
										<button
											onclick={() => removeHighlight(hl.id)}
											class="text-[10px] text-surface-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
										>
											Remove
										</button>
									</div>
								</div>
							{/each}
						</div>
					{:else if !showHighlightForm}
						<p class="text-sm text-surface-400 dark:text-surface-600">No highlights yet.</p>
					{/if}
				</div>

				<!-- Knowledge Cards -->
				<ResourceKnowledgeCards resourceId={detailResource.id} />

				<!-- Chat -->
				<div class="mt-6">
					<ResourceChat resourceId={detailResource.id} />
				</div>

				<!-- Meta -->
				<div class="mt-6 border-t border-surface-200 dark:border-surface-800 pt-4 text-xs text-surface-500 dark:text-surface-500">
					Added {new Date(detailResource.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
					{#if detailResource.dateStarted}
						· Started {new Date(detailResource.dateStarted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
					{/if}
					{#if detailResource.dateCompleted}
						· Completed {new Date(detailResource.dateCompleted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
