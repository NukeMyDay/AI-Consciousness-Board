<script lang="ts">
	import type { Conversation, ChatMessage } from '$lib/types';
	import { CHAT_MODELS } from '$lib/types';

	let {
		resourceId
	}: {
		resourceId: string;
	} = $props();

	let conversations = $state<Conversation[]>([]);
	let activeConvo = $state<Conversation | null>(null);
	let input = $state('');
	let sending = $state(false);
	let errorMsg = $state('');

	// New conversation form
	let showNewChat = $state(false);
	let selectedModel = $state(CHAT_MODELS[0].model);

	let selectedProvider = $derived(CHAT_MODELS.find((m) => m.model === selectedModel)?.provider ?? 'claude');

	// Load conversations on mount
	$effect(() => {
		loadConversations();
	});

	async function loadConversations() {
		const res = await fetch(`/api/chat?resourceId=${resourceId}`);
		if (res.ok) {
			conversations = await res.json();
			if (conversations.length > 0 && !activeConvo) {
				activeConvo = conversations[conversations.length - 1];
			}
		}
	}

	async function createChat() {
		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ resourceId, provider: selectedProvider, model: selectedModel })
		});
		if (res.ok) {
			const convo: Conversation = await res.json();
			conversations = [...conversations, convo];
			activeConvo = convo;
			showNewChat = false;
		}
	}

	async function sendMsg() {
		if (!input.trim() || !activeConvo || sending) return;
		const msg = input.trim();
		input = '';
		sending = true;
		errorMsg = '';

		// Optimistic: add user message
		const tempUserMsg: ChatMessage = {
			id: 'temp-' + Date.now(),
			conversationId: activeConvo.id,
			role: 'user',
			content: msg,
			createdAt: new Date().toISOString()
		};
		activeConvo = { ...activeConvo, messages: [...activeConvo.messages, tempUserMsg] };

		try {
			const res = await fetch(`/api/chat/${activeConvo.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: msg })
			});
			if (res.ok) {
				const assistantMsg: ChatMessage = await res.json();
				activeConvo = {
					...activeConvo,
					messages: [...activeConvo.messages, assistantMsg]
				};
			} else {
				const err = await res.json().catch(() => ({ message: 'Request failed' }));
				errorMsg = err.message ?? 'Failed to get response';
			}
		} catch (e) {
			errorMsg = 'Network error — check your connection';
		}
		sending = false;
	}

	async function deleteChat(id: string) {
		await fetch(`/api/chat/${id}`, { method: 'DELETE' });
		conversations = conversations.filter((c) => c.id !== id);
		if (activeConvo?.id === id) {
			activeConvo = conversations.length > 0 ? conversations[conversations.length - 1] : null;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMsg();
		}
	}

	let modelLabel = $derived(
		activeConvo ? CHAT_MODELS.find((m) => m.model === activeConvo.model)?.label ?? activeConvo.model : ''
	);
</script>

<div class="border-t border-surface-200 pt-6 dark:border-surface-800">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">
			Chat
		</h3>
		<div class="flex items-center gap-2">
			<!-- Conversation tabs -->
			{#each conversations as c (c.id)}
				<button
					onclick={() => (activeConvo = c)}
					class="rounded-md px-2 py-1 text-[10px] ring-1 transition-colors
						{activeConvo?.id === c.id
						? 'text-accent ring-accent/30 bg-accent/5'
						: 'text-surface-400 dark:text-surface-600 ring-surface-200 dark:ring-surface-800 hover:text-surface-600 dark:hover:text-surface-400'}"
				>
					{c.title ?? 'New chat'}
				</button>
			{/each}
			<button
				onclick={() => (showNewChat = !showNewChat)}
				class="text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
			>
				+ New
			</button>
		</div>
	</div>

	<!-- New chat form -->
	{#if showNewChat}
		<div class="mb-4 flex items-center gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-800 dark:bg-surface-850">
			<select
				bind:value={selectedModel}
				class="h-8 rounded-lg border border-surface-200 bg-white px-2 text-xs dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300"
			>
				{#each CHAT_MODELS as m}
					<option value={m.model}>{m.label}</option>
				{/each}
			</select>
			<button
				onclick={createChat}
				class="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
			>
				Start chat
			</button>
			<button
				onclick={() => (showNewChat = false)}
				class="text-xs text-surface-500 hover:text-surface-300"
			>
				Cancel
			</button>
		</div>
	{/if}

	<!-- Chat messages -->
	{#if activeConvo}
		<div class="mb-3 flex items-center justify-between">
			<span class="text-[10px] text-surface-500 dark:text-surface-500">{modelLabel}</span>
			<button
				onclick={() => deleteChat(activeConvo.id)}
				class="text-[10px] text-surface-400 dark:text-surface-600 hover:text-red-400"
			>
				Delete chat
			</button>
		</div>

		<div class="mb-4 max-h-96 space-y-3 overflow-y-auto">
			{#each activeConvo.messages as msg (msg.id)}
				<div class="flex gap-3 {msg.role === 'user' ? '' : ''}">
					<div class="min-w-0 flex-1">
						<span class="mb-1 block text-[10px] font-medium uppercase tracking-wider {msg.role === 'user' ? 'text-surface-500 dark:text-surface-400' : 'text-accent/70'}">
							{msg.role === 'user' ? 'You' : modelLabel}
						</span>
						<div class="whitespace-pre-wrap text-xs leading-relaxed {msg.role === 'user' ? 'text-surface-600 dark:text-surface-300' : 'text-surface-600 dark:text-surface-300'}">
							{msg.content}
						</div>
					</div>
				</div>
			{/each}

			{#if sending}
				<div class="flex items-center gap-2 text-xs text-surface-400">
					<span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent"></span>
					Thinking...
				</div>
			{/if}
		</div>

		{#if errorMsg}
			<p class="mb-3 text-xs text-red-400">{errorMsg}</p>
		{/if}

		<!-- Input -->
		<div class="flex gap-2">
			<textarea
				bind:value={input}
				onkeydown={handleKeydown}
				rows={2}
				placeholder="Ask about this resource..."
				disabled={sending}
				class="flex-1 resize-none rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none focus:border-surface-400 disabled:opacity-50 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200 dark:focus:border-surface-600"
			></textarea>
			<button
				onclick={sendMsg}
				disabled={!input.trim() || sending}
				class="shrink-0 self-end rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-40"
			>
				Send
			</button>
		</div>
	{:else if !showNewChat}
		<p class="text-xs text-surface-400 dark:text-surface-600">No conversations yet. Start one to discuss this resource with AI.</p>
	{/if}
</div>
