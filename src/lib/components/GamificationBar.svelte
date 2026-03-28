<script lang="ts">
	import type { Resource, Tag, LearningPath } from '$lib/types';
	import {
		getTotalXP,
		getLevel,
		getTagExpertise,
		getMilestones,
		getProfileAssessment,
	} from '$lib/gamification';

	let {
		resources,
		tags,
		paths
	}: {
		resources: Resource[];
		tags: Tag[];
		paths: LearningPath[];
	} = $props();

	let expanded = $state(false);

	let totalXP = $derived(getTotalXP(resources));
	let doneCount = $derived(resources.filter((r) => r.status === 'done' || r.status === 'applied').length);
	let readingCount = $derived(resources.filter((r) => r.status === 'reading').length);
	let level = $derived(getLevel(totalXP));
	let tagExpertise = $derived(getTagExpertise(resources, tags));
	let pathsCompleted = $derived(paths.filter((p) => p.steps.length > 0 && p.steps.every((s) => s.isCompleted)).length);
	let milestones = $derived(getMilestones(resources, pathsCompleted));
	let achievedMilestones = $derived(milestones.filter((m) => m.achieved).length);
	let profileAssessment = $derived(getProfileAssessment(resources, tags, totalXP));

	// Weekly activity
	let weekAgo = $derived(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
	let completedThisWeek = $derived(resources.filter((r) => r.dateCompleted && r.dateCompleted >= weekAgo).length);

	// Content expertise (exclude meta tags)
	let contentExpertise = $derived(tagExpertise.filter((te) => te.totalCount > 0 && !metaTags.includes(te.tag.name)));

	// Spider chart
	const spiderSize = 340;
	const spiderCenter = spiderSize / 2;
	const spiderRadius = 110;
	const spiderLevels = 4;

	function polarToXY(angle: number, radius: number): { x: number; y: number } {
		const rad = (angle - 90) * (Math.PI / 180);
		return {
			x: spiderCenter + radius * Math.cos(rad),
			y: spiderCenter + radius * Math.sin(rad)
		};
	}

	const metaTags = ['Must Read', 'Anthropic'];

	let spiderPoints = $derived.by(() => {
		const filtered = tagExpertise.filter((te) => te.totalCount > 0 && !metaTags.includes(te.tag.name));
		if (filtered.length < 3) return null;

		const angleStep = 360 / filtered.length;
		const axes = filtered.map((te, i) => ({
			...te,
			angle: i * angleStep,
			value: te.totalCount > 0 ? te.doneCount / te.totalCount : 0
		}));

		const gridPaths: string[] = [];
		for (let lvl = 1; lvl <= spiderLevels; lvl++) {
			const r = (spiderRadius / spiderLevels) * lvl;
			const points = axes.map((a) => polarToXY(a.angle, r));
			gridPaths.push(points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z');
		}

		const axisLines = axes.map((a) => {
			const end = polarToXY(a.angle, spiderRadius);
			return `M${spiderCenter},${spiderCenter} L${end.x},${end.y}`;
		});

		const dataPoints = axes.map((a) => polarToXY(a.angle, spiderRadius * a.value));
		const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

		const labels = axes.map((a) => {
			const pos = polarToXY(a.angle, spiderRadius + 30);
			return { ...a, labelX: pos.x, labelY: pos.y };
		});

		return { gridPaths, axisLines, dataPath, labels };
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="mb-8 rounded-xl border border-surface-200 bg-white dark:border-surface-700/50 dark:bg-surface-850">
	<!-- Collapsed -->
	<div
		class="flex cursor-pointer items-center gap-6 px-6 py-5"
		onclick={() => (expanded = !expanded)}
	>
		<span class="shrink-0 text-sm font-medium">Level {level.level} · {level.name}</span>

		<div class="flex flex-1 items-center gap-3">
			<div class="h-2 flex-1 max-w-sm overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
				<div class="h-full rounded-full bg-accent transition-all" style="width: {level.progress}%"></div>
			</div>
			<span class="shrink-0 text-xs text-surface-500 dark:text-surface-400">
				{#if level.next}
					{level.displayXP}/{level.displayTarget} XP
				{:else}
					{totalXP} XP · Max Level
				{/if}
			</span>
		</div>

		<div class="flex shrink-0 items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
			<span>{completedThisWeek} this week</span>
			<span class="text-surface-300 dark:text-surface-700">·</span>
			<span>{doneCount} completed</span>
			<span class="text-surface-300 dark:text-surface-700">·</span>
			<span>{readingCount} reading</span>
		</div>

		<svg
			class="h-3.5 w-3.5 shrink-0 text-surface-400 transition-transform {expanded ? 'rotate-180' : ''}"
			fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
		</svg>
	</div>

	<!-- Expanded -->
	{#if expanded}
		<div class="border-t border-surface-100 px-6 py-8 dark:border-surface-800/40">
			<div class="grid gap-10 lg:grid-cols-[60fr_40fr]">
				<!-- Left: Profile + Expertise + Milestones -->
				<div>
					<!-- Profile Assessment -->
					<h3 class="mb-3 text-xs font-medium uppercase tracking-wider text-surface-400 dark:text-surface-300">
						Role Assessment
					</h3>
					<p class="text-xs leading-relaxed text-surface-500 dark:text-surface-400">
						{profileAssessment}
					</p>

					<!-- Expertise -->
					<h3 class="mb-3 mt-10 text-xs font-medium uppercase tracking-wider text-surface-400 dark:text-surface-300">
						Expertise
					</h3>
					<div class="flex flex-wrap gap-x-5 gap-y-2">
						{#each contentExpertise as te (te.tag.id)}
							<div class="flex items-baseline gap-1.5">
								<span class="text-[11px] text-surface-500 dark:text-surface-400">{te.tag.name}</span>
								<span class="text-[11px] font-medium {te.doneCount > 0 ? 'text-accent' : 'text-surface-400 dark:text-surface-600'}">
									{te.doneCount}/{te.totalCount}
								</span>
							</div>
						{/each}
					</div>

					<!-- Milestones -->
					<h3 class="mb-4 mt-10 text-xs font-medium uppercase tracking-wider text-surface-400 dark:text-surface-300">
						Milestones
						<span class="ml-1 text-surface-500">{achievedMilestones}/{milestones.length}</span>
					</h3>
					<div class="flex flex-wrap gap-1.5">
						{#each milestones as m (m.id)}
							<span
								class="rounded-full px-2.5 py-1 text-[11px] ring-1
									{m.achieved
									? 'text-accent ring-accent/30 bg-accent/5'
									: 'text-surface-400 dark:text-surface-600 ring-surface-200 dark:ring-surface-800'}"
							>
								{#if m.achieved}<span class="mr-0.5">✓</span>{/if}
								{m.label}
							</span>
						{/each}
					</div>
				</div>

				<!-- Right: Spider -->
				<div class="flex justify-center">
					{#if spiderPoints}
						<svg viewBox="-15 15 {spiderSize + 30} {spiderSize - 30}" class="w-full max-w-[400px]">
							{#each spiderPoints.gridPaths as gp}
								<path d={gp} fill="none" stroke="currentColor" class="text-surface-200 dark:text-surface-700" stroke-width="0.5" />
							{/each}
							{#each spiderPoints.axisLines as al}
								<path d={al} stroke="currentColor" class="text-surface-200 dark:text-surface-700" stroke-width="0.5" />
							{/each}
							<path d={spiderPoints.dataPath} fill="rgba(139, 92, 246, 0.12)" stroke="#8B5CF6" stroke-width="1.5" />
							{#each spiderPoints.labels as l}
								{@const dp = polarToXY(l.angle, spiderRadius * l.value)}
								<circle cx={dp.x} cy={dp.y} r="3" fill="#8B5CF6" />
							{/each}
							{#each spiderPoints.labels as l}
								<text
									x={l.labelX}
									y={l.labelY}
									text-anchor="middle"
									dominant-baseline="central"
									class="fill-surface-500 dark:fill-surface-400"
									font-size="11"
								>
									{l.tag.name}
								</text>
							{/each}
						</svg>
					{:else}
						<p class="py-12 text-sm text-surface-500">Complete more resources to see your coverage.</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
