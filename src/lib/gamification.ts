import type { Resource, ResourceType, Tag } from './types';

// --- XP System ---
export const XP_PER_TYPE: Record<ResourceType, number> = {
	book: 100,
	paper: 40,
	podcast: 25,
	blog_post: 20,
	video: 20,
	website: 10,
	community: 10
};

export function getResourceXP(r: Resource): number {
	if (r.status !== 'done' && r.status !== 'applied') return 0;
	return XP_PER_TYPE[r.type] ?? 10;
}

export const XP_PER_REVIEW = 5;

export function getTotalXP(resources: Resource[], reviewCount = 0): number {
	return resources.reduce((sum, r) => sum + getResourceXP(r), 0) + (reviewCount * XP_PER_REVIEW);
}

// --- Levels ---
export interface Level {
	level: number;
	name: string;
	minXP: number;
}

export const LEVELS: Level[] = [
	{ level: 1, name: 'Beginner', minXP: 0 },
	{ level: 2, name: 'Student', minXP: 100 },
	{ level: 3, name: 'Researcher', minXP: 300 },
	{ level: 4, name: 'Scholar', minXP: 600 },
	{ level: 5, name: 'Specialist', minXP: 1000 },
	{ level: 6, name: 'Expert', minXP: 1600 },
	{ level: 7, name: 'Authority', minXP: 2500 },
	{ level: 8, name: 'Thought Leader', minXP: 4000 }
];

export function getLevel(xp: number) {
	let current = LEVELS[0];
	for (const lvl of LEVELS) {
		if (xp >= lvl.minXP) current = lvl;
	}
	const next = LEVELS.find((l) => l.minXP > xp) ?? null;
	const xpInLevel = xp - current.minXP;
	const xpForNext = next ? next.minXP - current.minXP : 0;
	const progress = next ? Math.round((xpInLevel / xpForNext) * 100) : 100;
	// Cumulative display: show total XP / next level threshold
	const displayXP = xp;
	const displayTarget = next ? next.minXP : current.minXP;
	return { ...current, xp, xpInLevel, xpForNext, progress, next, displayXP, displayTarget };
}

// --- Expertise Tiers per Tag ---
export interface ExpertiseTier {
	name: string;
	min: number;
	color: string;
}

export const TIERS: ExpertiseTier[] = [
	{ name: 'Novice', min: 0, color: '#71717a' },
	{ name: 'Explorer', min: 2, color: '#3B82F6' },
	{ name: 'Practitioner', min: 4, color: '#8B5CF6' },
	{ name: 'Expert', min: 7, color: '#F59E0B' },
	{ name: 'Authority', min: 11, color: '#10B981' }
];

export function getTier(doneCount: number): ExpertiseTier {
	let current = TIERS[0];
	for (const tier of TIERS) {
		if (doneCount >= tier.min) current = tier;
	}
	return current;
}

export function getNextTier(doneCount: number): ExpertiseTier | null {
	for (const tier of TIERS) {
		if (doneCount < tier.min) return tier;
	}
	return null;
}

export interface TagExpertise {
	tag: Tag;
	doneCount: number;
	totalCount: number;
	tier: ExpertiseTier;
	nextTier: ExpertiseTier | null;
	progressToNext: number;
}

export function getTagExpertise(resources: Resource[], tags: Tag[]): TagExpertise[] {
	return tags.map((tag) => {
		const tagged = resources.filter((r) => r.tags.some((t) => t.id === tag.id));
		const done = tagged.filter((r) => r.status === 'done' || r.status === 'applied');
		const tier = getTier(done.length);
		const nextTier = getNextTier(done.length);
		const progressToNext = nextTier
			? Math.round(((done.length - tier.min) / (nextTier.min - tier.min)) * 100)
			: 100;
		return { tag, doneCount: done.length, totalCount: tagged.length, tier, nextTier, progressToNext };
	}).sort((a, b) => b.doneCount - a.doneCount);
}

// --- Milestones ---
export interface Milestone {
	id: string;
	label: string;
	achieved: boolean;
}

export function getMilestones(resources: Resource[], pathsCompleted: number): Milestone[] {
	const done = resources.filter((r) => r.status === 'done' || r.status === 'applied').length;
	const reading = resources.filter((r) => r.status === 'reading').length;
	const withNotes = resources.filter((r) => r.personalNotes).length;
	const mustReads = resources.filter(
		(r) => r.tags.some((t) => t.name === 'Must Read') && (r.status === 'done' || r.status === 'applied')
	).length;
	const totalMustReads = resources.filter((r) => r.tags.some((t) => t.name === 'Must Read')).length;
	const xp = getTotalXP(resources);

	return [
		{ id: 'first-read', label: 'First Resource Read', achieved: done >= 1 },
		{ id: 'five-done', label: '5 Resources Completed', achieved: done >= 5 },
		{ id: 'ten-done', label: '10 Resources Completed', achieved: done >= 10 },
		{ id: 'first-notes', label: 'First Notes Written', achieved: withNotes >= 1 },
		{ id: 'five-notes', label: '5 Resources with Notes', achieved: withNotes >= 5 },
		{ id: 'first-path', label: 'First Learning Path Completed', achieved: pathsCompleted >= 1 },
		{ id: 'all-mustreads', label: 'All Must-Reads Done', achieved: mustReads >= totalMustReads && totalMustReads > 0 },
		{ id: 'active-reader', label: '3+ Resources Reading', achieved: reading >= 3 },
		{ id: 'twenty-done', label: '20 Resources Completed', achieved: done >= 20 },
		{ id: 'xp-500', label: '500 XP Earned', achieved: xp >= 500 },
		{ id: 'xp-1000', label: '1000 XP Earned', achieved: xp >= 1000 },
	];
}

// --- Profile Assessment ---
export function getProfileAssessment(resources: Resource[], tags: Tag[], xp: number): string {
	const done = resources.filter((r) => r.status === 'done' || r.status === 'applied');
	const reading = resources.filter((r) => r.status === 'reading');
	const total = done.length + reading.length;

	const metaTags = ['Must Read', 'Anthropic'];
	const contentTags = tags.filter((t) => !metaTags.includes(t.name));
	const tagDone: Record<string, number> = {};
	for (const t of contentTags) {
		tagDone[t.name] = done.filter((r) => r.tags.some((rt) => rt.id === t.id)).length;
	}

	const topTags = Object.entries(tagDone)
		.sort((a, b) => b[1] - a[1])
		.filter(([, count]) => count > 0)
		.map(([name]) => name);

	if (total === 0) {
		return "No resources completed yet. You have a reading list — now you need to work through it. AI specialist roles at Anthropic, DeepMind, or OpenAI require deep, demonstrated expertise. Right now you're at zero. Pick the first item from Up Next and start building actual knowledge.";
	}

	if (xp < 100) {
		const focus = topTags.length > 0 ? topTags.slice(0, 2).join(' and ') : 'AI consciousness';
		return `You've started with ${focus}, but ${done.length} resource${done.length === 1 ? '' : 's'} completed is barely scratching the surface. AI labs expect candidates to have read dozens of papers and formed original perspectives. You're not competitive for any research role yet — keep going, the foundation matters.`;
	}

	if (xp < 300) {
		const focus = topTags.slice(0, 3).join(', ');
		return `Building knowledge in ${focus}. You're past the "just getting started" phase but still far from the depth AI labs expect. At this point you could speak intelligently about these topics in an interview, but lack the breadth to contribute meaningfully to research. Target: keep completing resources and start writing notes to consolidate your understanding.`;
	}

	if (xp < 600) {
		const focus = topTags.slice(0, 3).join(', ');
		return `Solid grounding in ${focus}. You're developing the kind of cross-domain awareness that distinguishes strong candidates. With this profile you could credibly apply for junior roles: AI Research Assistant, AI Policy Analyst, or support roles on safety/interpretability teams. To reach researcher-level positions, you'll need to deepen further and start forming your own views on open questions.`;
	}

	if (xp < 1000) {
		const focus = topTags.slice(0, 2).join(' and ');
		return `Strong expertise in ${focus}. Your profile shows real depth — you can hold your own in technical discussions and have covered key literature. Competitive for: AI Safety Researcher (junior-mid), Interpretability Research Engineer, AI Ethics Specialist, or Evaluation roles at Anthropic, Google DeepMind, or research-focused organizations. The gap to senior roles is original research contribution — reading alone won't get you there.`;
	}

	if (xp < 1600) {
		const focus = topTags.slice(0, 2).join(' and ');
		return `Deep expertise across ${focus} and related fields. You've covered more literature than most candidates and have a genuinely interdisciplinary profile. Realistic targets: AI Safety Researcher, Alignment Research Scientist, AI Consciousness Research Lead at Anthropic, DeepMind, MIRI, or Redwood Research. To reach principal/senior level, complement this reading with hands-on research or published work.`;
	}

	return `Exceptional breadth and depth across AI consciousness, interpretability, and ethics. Very few people have this level of systematic coverage. You're competitive for senior research positions — but remember that reading is preparation, not output. The next step is translating this knowledge into original contributions: papers, tools, or open-source work that demonstrates expertise in action.`;
}
