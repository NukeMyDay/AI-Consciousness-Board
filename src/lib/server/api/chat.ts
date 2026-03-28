import { db } from '../db';
import { conversation, conversationMessage, resource, tag, resourceTag, highlight, author, resourceAuthor } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Conversation, ChatMessage, ChatProvider } from '$lib/types';
import { env } from '$env/dynamic/private';

// --- Conversation CRUD ---

export function getConversationsForResource(resourceId: string): Conversation[] {
	const convos = db.select().from(conversation).where(eq(conversation.resourceId, resourceId)).orderBy(asc(conversation.createdAt)).all();
	return convos.map((c) => ({
		...c,
		provider: c.provider as ChatProvider,
		messages: db.select().from(conversationMessage).where(eq(conversationMessage.conversationId, c.id)).orderBy(asc(conversationMessage.createdAt)).all()
	}));
}

export function getConversation(id: string): Conversation | null {
	const c = db.select().from(conversation).where(eq(conversation.id, id)).get();
	if (!c) return null;
	return {
		...c,
		provider: c.provider as ChatProvider,
		messages: db.select().from(conversationMessage).where(eq(conversationMessage.conversationId, c.id)).orderBy(asc(conversationMessage.createdAt)).all()
	};
}

export function createConversation(resourceId: string, provider: ChatProvider, model: string): Conversation {
	const id = nanoid();
	const now = new Date().toISOString();
	db.insert(conversation).values({ id, resourceId, provider, model, createdAt: now }).run();
	return { id, resourceId, title: null, provider, model, createdAt: now, messages: [] };
}

export function deleteConversation(id: string): boolean {
	return db.delete(conversation).where(eq(conversation.id, id)).run().changes > 0;
}

// --- Build system prompt from resource context ---

function buildSystemPrompt(resourceId: string): string {
	const r = db.select().from(resource).where(eq(resource.id, resourceId)).get();
	if (!r) return 'You are a helpful research assistant.';

	const tags = db.select({ name: tag.name }).from(resourceTag).innerJoin(tag, eq(resourceTag.tagId, tag.id)).where(eq(resourceTag.resourceId, resourceId)).all();
	const authors = db.select({ name: author.name }).from(resourceAuthor).innerJoin(author, eq(resourceAuthor.authorId, author.id)).where(eq(resourceAuthor.resourceId, resourceId)).all();
	const highlights = db.select().from(highlight).where(eq(highlight.resourceId, resourceId)).all();

	let prompt = `You are a knowledgeable research assistant helping someone study AI consciousness, interpretability, and AI safety. You are discussing a specific resource with them.

RESOURCE CONTEXT:
- Title: ${r.title}
- Type: ${r.type}
- Authors: ${authors.map((a) => a.name).join(', ') || 'Unknown'}
- Tags: ${tags.map((t) => t.name).join(', ')}`;

	if (r.url) prompt += `\n- URL: ${r.url}`;
	if (r.description) prompt += `\n- Description: ${r.description}`;

	if (r.personalNotes) {
		prompt += `\n\nUSER'S NOTES:\n${r.personalNotes}`;
	}

	if (highlights.length > 0) {
		prompt += `\n\nUSER'S HIGHLIGHTS:`;
		for (const h of highlights) {
			prompt += `\n- "${h.text}"`;
			if (h.note) prompt += ` (Note: ${h.note})`;
		}
	}

	prompt += `\n\nBe concise, insightful, and reference specific aspects of this resource when possible. If the user asks about concepts from the resource, explain them clearly. Help them develop deep understanding.`;

	return prompt;
}

// --- Send message and get AI response ---

export async function sendMessage(conversationId: string, userMessage: string): Promise<ChatMessage> {
	const convo = getConversation(conversationId);
	if (!convo) throw new Error('Conversation not found');

	// Save user message
	const userMsgId = nanoid();
	const now = new Date().toISOString();
	db.insert(conversationMessage).values({ id: userMsgId, conversationId, role: 'user', content: userMessage, createdAt: now }).run();

	// Build messages array for API
	const systemPrompt = buildSystemPrompt(convo.resourceId);
	const messages = [...convo.messages, { role: 'user' as const, content: userMessage }]
		.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

	// Call AI provider
	let assistantContent: string;

	if (convo.provider === 'claude') {
		assistantContent = await callClaude(systemPrompt, messages, convo.model);
	} else if (convo.provider === 'gemini') {
		assistantContent = await callGemini(systemPrompt, messages, convo.model);
	} else {
		throw new Error(`Unknown provider: ${convo.provider}`);
	}

	// Save assistant message
	const assistantMsgId = nanoid();
	const assistantNow = new Date().toISOString();
	db.insert(conversationMessage).values({ id: assistantMsgId, conversationId, role: 'assistant', content: assistantContent, createdAt: assistantNow }).run();

	// Auto-title on first message
	if (convo.messages.length === 0) {
		const title = userMessage.length > 60 ? userMessage.substring(0, 57) + '...' : userMessage;
		db.update(conversation).set({ title }).where(eq(conversation.id, conversationId)).run();
	}

	return { id: assistantMsgId, conversationId, role: 'assistant', content: assistantContent, createdAt: assistantNow };
}

// --- Provider implementations ---

async function callClaude(systemPrompt: string, messages: { role: string; content: string }[], model: string): Promise<string> {
	if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');

	const Anthropic = (await import('@anthropic-ai/sdk')).default;
	const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

	const response = await client.messages.create({
		model,
		max_tokens: 2048,
		system: systemPrompt,
		messages: messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
	});

	const block = response.content[0];
	return block.type === 'text' ? block.text : 'Unable to generate response.';
}

async function callGemini(systemPrompt: string, messages: { role: string; content: string }[], model: string): Promise<string> {
	if (!env.GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY not configured');

	const { GoogleGenAI } = await import('@google/genai');
	const ai = new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY });

	// Build Gemini conversation history
	const contents = messages.map((m) => ({
		role: m.role === 'assistant' ? 'model' : 'user',
		parts: [{ text: m.content }]
	}));

	const response = await ai.models.generateContent({
		model,
		contents,
		config: {
			systemInstruction: systemPrompt,
			maxOutputTokens: 2048
		}
	});

	return response.text ?? 'Unable to generate response.';
}
