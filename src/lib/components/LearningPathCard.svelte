<script lang="ts">
	import type { LearningPath, LearningPathStep, Resource } from '$lib/types';
	import QuickActions from './QuickActions.svelte';

	let {
		path,
		resources,
		onupdate,
		ondelete,
		onstatuschange,
		onresourceclick
	}: {
		path: LearningPath;
		resources: Resource[];
		onupdate: (path: LearningPath) => void;
		ondelete: (id: string) => void;
		onstatuschange: (id: string, status: string) => void;
		onresourceclick: (resource: Resource) => void;
	} = $props();

	let expanded = $state(false);
	let showAddStep = $state(false);
	let newStepTitle = $state('');
	let newStepDescription = $state('');
	let newStepResourceId = $state('');
	let editingPath = $state(false);
	let pathName = $state(path.name);
	let pathDescription = $state(path.description ?? '');

	let completedCount = $derived(path.steps.filter((s) => s.isCompleted).length);
	let progress = $derived(path.steps.length > 0 ? Math.round((completedCount / path.steps.length) * 100) : 0);

	async function toggleStep(step: LearningPathStep) {
		const res = await fetch(`/api/paths/${path.id}/steps/${step.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isCompleted: !step.isCompleted })
		});
		if (res.ok) {
			const updated = {
				...path,
				steps: path.steps.map((s) =>
					s.id === step.id ? { ...s, isCompleted: !s.isCompleted } : s
				)
			};
			onupdate(updated);
		}
	}

	async function addStep() {
		if (!newStepTitle.trim()) return;
		const res = await fetch(`/api/paths/${path.id}/steps`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: newStepTitle,
				description: newStepDescription || undefined,
				resourceId: newStepResourceId || undefined
			})
		});
		if (res.ok) {
			const step: LearningPathStep = await res.json();
			if (newStepResourceId) {
				const linked = resources.find((r) => r.id === newStepResourceId);
				if (linked) step.resource = linked;
			}
			onupdate({ ...path, steps: [...path.steps, step] });
			newStepTitle = '';
			newStepDescription = '';
			newStepResourceId = '';
			showAddStep = false;
		}
	}

	function handleStepStatusChange(step: LearningPathStep, newStatus: string) {
		// Update resource via parent
		if (step.resourceId) onstatuschange(step.resourceId, newStatus);
		// Immediately update local state so border color + completion reacts
		const isDone = newStatus === 'done' || newStatus === 'applied';
		const updatedSteps = path.steps.map((s) => {
			if (s.id !== step.id) return s;
			return {
				...s,
				isCompleted: isDone,
				resource: s.resource ? { ...s.resource, status: newStatus } : s.resource
			};
		});
		onupdate({ ...path, steps: updatedSteps });
	}

	async function removeStep(stepId: string) {
		const res = await fetch(`/api/paths/${path.id}/steps/${stepId}`, { method: 'DELETE' });
		if (res.ok) {
			onupdate({ ...path, steps: path.steps.filter((s) => s.id !== stepId) });
		}
	}

	async function savePath() {
		const res = await fetch(`/api/paths/${path.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: pathName, description: pathDescription || null })
		});
		if (res.ok) {
			const updated = await res.json();
			onupdate(updated);
			editingPath = false;
		}
	}

	const inputClass = 'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-surface-400 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200 dark:focus:border-surface-600';
</script>

<div class="rounded-xl border border-surface-200 bg-white dark:border-surface-700/50 dark:bg-surface-850">
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<!-- Header -->
	<div
		class="flex cursor-pointer items-center gap-3 px-5 py-5"
		onclick={() => { if (!editingPath) expanded = !expanded; }}
	>
		<div class="text-surface-400">
			<svg
				class="h-3.5 w-3.5 transition-transform {expanded ? 'rotate-90' : ''}"
				fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
			</svg>
		</div>

		<div class="flex-1">
			{#if editingPath}
				<input bind:value={pathName} class="{inputClass} mb-1" placeholder="Path name" />
				<input bind:value={pathDescription} class={inputClass} placeholder="Description (optional)" />
				<div class="mt-2 flex gap-2">
					<button onclick={() => (editingPath = false)} class="text-xs text-surface-500 hover:text-surface-300">Cancel</button>
					<button onclick={savePath} class="rounded bg-accent px-2 py-1 text-xs text-white hover:bg-accent/90">Save</button>
				</div>
			{:else}
				<h3 class="text-sm font-medium">{path.name}</h3>
				{#if path.description}
					<p class="text-xs text-surface-500 dark:text-surface-400">{path.description}</p>
				{/if}
			{/if}
		</div>

		<!-- Progress -->
		<div class="flex items-center gap-2.5">
			<div class="h-1.5 w-24 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
				<div class="h-full rounded-full bg-accent transition-all" style="width: {progress}%"></div>
			</div>
			<span class="text-xs text-surface-500 dark:text-surface-400">{completedCount}/{path.steps.length}</span>
		</div>
	</div>

	<!-- Steps -->
	{#if expanded}
		<div class="border-t border-surface-100 dark:border-surface-800/40">
			{#each path.steps as step, i (step.id)}
				{@const status = step.resource?.status ?? 'backlog'}
				{@const borderColor = status === 'to_read' ? '#8B5CF6' : status === 'reading' ? '#3B82F6' : status === 'done' || status === 'applied' ? '#10B981' : 'transparent'}
				{#if i > 0}
					<div class="mx-5 border-t border-surface-100 dark:border-surface-800/30"></div>
				{/if}
				<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
				<div
					class="group flex items-start gap-3 border-l-3 px-5 py-4 transition-colors {step.resourceId ? 'cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800/30' : ''}"
					style="border-left-color: {borderColor}"
					onclick={() => {
						if (step.resourceId) {
							const r = resources.find((res) => res.id === step.resourceId);
							if (r) onresourceclick(r);
						}
					}}
				>
					<div class="min-w-0 flex-1">
						<span class="text-sm {step.isCompleted ? 'line-through text-surface-400 dark:text-surface-600' : ''}">
							{step.title}
						</span>
						{#if step.resource}
							<span class="ml-1.5 text-xs text-surface-400 dark:text-surface-500">
								— {step.resource.type}
							</span>
						{/if}
						{#if step.description}
							<p class="mt-1 text-xs text-surface-500 dark:text-surface-500">{step.description}</p>
						{/if}
					</div>

					<div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						{#if step.resourceId}
							<QuickActions
								status={status}
								url={step.resource?.url ?? null}
								onstatuschange={(s) => handleStepStatusChange(step, s)}
							/>
						{/if}
						<button
							onclick={() => removeStep(step.id)}
							class="rounded-md p-1.5 text-surface-400 hover:text-red-400"
							title="Remove step"
						>
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			{/each}

			<!-- Footer: Add step + path actions -->
			<div class="border-t border-surface-100 px-5 py-3 dark:border-surface-800/40">
				{#if showAddStep}
					<div class="space-y-2">
						<input bind:value={newStepTitle} placeholder="Step title" class={inputClass} />
						<input bind:value={newStepDescription} placeholder="Description (optional)" class={inputClass} />
						<select bind:value={newStepResourceId} class={inputClass}>
							<option value="">Link to resource (optional)</option>
							{#each resources as r (r.id)}
								<option value={r.id}>{r.title}</option>
							{/each}
						</select>
						<div class="flex gap-2">
							<button onclick={() => (showAddStep = false)} class="text-xs text-surface-500 hover:text-surface-300">Cancel</button>
							<button
								onclick={addStep}
								disabled={!newStepTitle.trim()}
								class="rounded bg-accent px-2 py-1 text-xs text-white hover:bg-accent/90 disabled:opacity-40"
							>
								Add step
							</button>
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-4">
						<button
							onclick={() => (showAddStep = true)}
							class="text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
						>
							+ Add step
						</button>
						<button
							onclick={() => { editingPath = true; pathName = path.name; pathDescription = path.description ?? ''; }}
							class="text-xs text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
						>
							Edit path
						</button>
						<button
							onclick={() => ondelete(path.id)}
							class="text-xs text-surface-400 dark:text-surface-500 hover:text-red-400"
						>
							Delete path
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
