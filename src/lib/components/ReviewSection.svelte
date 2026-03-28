<script lang="ts">
	import type { KnowledgeCard } from '$lib/types';
	import { CHAT_MODELS } from '$lib/types';

	let dueCards = $state<KnowledgeCard[]>([]);
	let currentIndex = $state(0);
	let loading = $state(true);
	let phase = $state<'question' | 'answer' | 'feedback' | 'followup'>('question');
	let userAnswer = $state('');
	let aiFeedback = $state('');
	let aiFollowUp = $state('');
	let followUpAnswer = $state('');
	let aiFinalFeedback = $state('');
	let evaluating = $state(false);

	let currentCard = $derived(dueCards[currentIndex] ?? null);

	$effect(() => {
		loadDueCards();
	});

	async function loadDueCards() {
		loading = true;
		const res = await fetch('/api/cards?due=true');
		if (res.ok) dueCards = await res.json();
		loading = false;
	}

	async function submitAnswer() {
		if (!userAnswer.trim() || !currentCard) return;
		evaluating = true;

		try {
			// Use first available model for evaluation
			const res = await fetch(`/api/cards/${currentCard.id}/evaluate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ answer: userAnswer, concept: currentCard.concept, explanation: currentCard.explanation })
			});

			if (res.ok) {
				const result = await res.json();
				aiFeedback = result.feedback;
				aiFollowUp = result.followUp;
				phase = 'feedback';
			} else {
				// Fallback if AI not available
				aiFeedback = '';
				aiFollowUp = '';
				phase = 'feedback';
			}
		} catch {
			phase = 'feedback';
		}
		evaluating = false;
	}

	async function submitFollowUp() {
		if (!followUpAnswer.trim() || !currentCard) return;
		evaluating = true;

		try {
			const res = await fetch(`/api/cards/${currentCard.id}/evaluate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					answer: followUpAnswer,
					concept: currentCard.concept,
					explanation: currentCard.explanation,
					isFollowUp: true,
					originalAnswer: userAnswer,
					followUpQuestion: aiFollowUp
				})
			});

			if (res.ok) {
				const result = await res.json();
				aiFinalFeedback = result.feedback;
			}
		} catch {}
		evaluating = false;
		phase = 'followup';
	}

	async function rateCard(rating: 'understood' | 'review_again') {
		if (!currentCard) return;
		await fetch(`/api/cards/${currentCard.id}/review`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ rating })
		});

		// Move to next card
		dueCards = dueCards.filter((c) => c.id !== currentCard.id);
		phase = 'question';
		userAnswer = '';
		aiFeedback = '';
		aiFollowUp = '';
		followUpAnswer = '';
		aiFinalFeedback = '';
	}

	function skipCard() {
		if (currentIndex < dueCards.length - 1) {
			currentIndex++;
		} else {
			currentIndex = 0;
		}
		phase = 'question';
		userAnswer = '';
		aiFeedback = '';
		aiFollowUp = '';
	}
</script>

{#if loading}
	<p class="text-xs text-surface-500">Loading reviews...</p>
{:else if dueCards.length === 0}
	<p class="text-xs text-surface-400 dark:text-surface-600">No cards due for review. Create knowledge cards to start building retention.</p>
{:else if currentCard}
	<div class="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700/50 dark:bg-surface-850">
		<!-- Progress -->
		<div class="mb-4 flex items-center justify-between text-[10px] text-surface-500 dark:text-surface-400">
			<span>{dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due</span>
			{#if currentCard.resourceTitle}
				<span>{currentCard.resourceTitle}</span>
			{/if}
		</div>

		<!-- Concept -->
		<h3 class="mb-4 text-base font-medium">{currentCard.concept}</h3>

		{#if phase === 'question'}
			<!-- Answer input -->
			<textarea
				bind:value={userAnswer}
				rows={4}
				placeholder="Explain this concept in your own words..."
				class="mb-3 w-full rounded-lg border border-surface-200 bg-white px-4 py-3 text-sm outline-none focus:border-surface-400 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200"
			></textarea>
			<div class="flex items-center gap-3">
				<button
					onclick={submitAnswer}
					disabled={!userAnswer.trim() || evaluating}
					class="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-40"
				>
					{evaluating ? 'Evaluating...' : 'Check'}
				</button>
				<button onclick={skipCard} class="text-xs text-surface-500 hover:text-surface-300">
					Skip
				</button>
			</div>

		{:else if phase === 'feedback'}
			<!-- Show user's answer + AI feedback -->
			<div class="mb-4 rounded-lg bg-surface-50 px-4 py-3 dark:bg-surface-800/50">
				<p class="mb-1 text-[10px] font-medium uppercase tracking-wider text-surface-400">Your answer</p>
				<p class="text-xs text-surface-600 dark:text-surface-300">{userAnswer}</p>
			</div>

			{#if aiFeedback}
				<div class="mb-4">
					<p class="mb-1 text-[10px] font-medium uppercase tracking-wider text-accent/70">Feedback</p>
					<p class="text-xs leading-relaxed text-surface-600 dark:text-surface-300">{aiFeedback}</p>
				</div>
			{/if}

			{#if aiFollowUp}
				<!-- Follow-up question -->
				<div class="mb-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
					<p class="mb-2 text-xs font-medium text-accent/80">Follow-up question:</p>
					<p class="text-xs text-surface-600 dark:text-surface-300">{aiFollowUp}</p>
				</div>
				<textarea
					bind:value={followUpAnswer}
					rows={3}
					placeholder="Your answer to the follow-up..."
					class="mb-3 w-full rounded-lg border border-surface-200 bg-white px-4 py-3 text-sm outline-none focus:border-surface-400 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200"
				></textarea>
				<button
					onclick={submitFollowUp}
					disabled={!followUpAnswer.trim() || evaluating}
					class="mb-4 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-40"
				>
					{evaluating ? 'Evaluating...' : 'Answer'}
				</button>
			{/if}

			<!-- Rating buttons -->
			<div class="flex items-center gap-3 border-t border-surface-200 pt-4 dark:border-surface-800">
				<span class="text-xs text-surface-500 dark:text-surface-400">How did you do?</span>
				<button
					onclick={() => rateCard('understood')}
					class="rounded-lg bg-green-500/10 px-4 py-2 text-xs font-medium text-green-600 ring-1 ring-green-500/20 hover:bg-green-500/20 dark:text-green-400"
				>
					Got it
				</button>
				<button
					onclick={() => rateCard('review_again')}
					class="rounded-lg bg-red-500/10 px-4 py-2 text-xs font-medium text-red-500 ring-1 ring-red-500/20 hover:bg-red-500/20 dark:text-red-400"
				>
					Review again
				</button>
			</div>

		{:else if phase === 'followup'}
			<!-- Final feedback after follow-up -->
			<div class="mb-4 rounded-lg bg-surface-50 px-4 py-3 dark:bg-surface-800/50">
				<p class="text-xs text-surface-600 dark:text-surface-300">{followUpAnswer}</p>
			</div>
			{#if aiFinalFeedback}
				<div class="mb-4">
					<p class="mb-1 text-[10px] font-medium uppercase tracking-wider text-accent/70">Feedback</p>
					<p class="text-xs leading-relaxed text-surface-600 dark:text-surface-300">{aiFinalFeedback}</p>
				</div>
			{/if}

			<div class="flex items-center gap-3 border-t border-surface-200 pt-4 dark:border-surface-800">
				<span class="text-xs text-surface-500 dark:text-surface-400">How did you do?</span>
				<button onclick={() => rateCard('understood')} class="rounded-lg bg-green-500/10 px-4 py-2 text-xs font-medium text-green-600 ring-1 ring-green-500/20 hover:bg-green-500/20 dark:text-green-400">Got it</button>
				<button onclick={() => rateCard('review_again')} class="rounded-lg bg-red-500/10 px-4 py-2 text-xs font-medium text-red-500 ring-1 ring-red-500/20 hover:bg-red-500/20 dark:text-red-400">Review again</button>
			</div>
		{/if}
	</div>
{/if}
