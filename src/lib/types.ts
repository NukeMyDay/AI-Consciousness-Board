export type ResourceType = 'paper' | 'book' | 'blog_post' | 'podcast' | 'video' | 'website' | 'community';
export type ResourceStatus = 'backlog' | 'to_read' | 'reading' | 'done' | 'applied';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Tag {
	id: string;
	name: string;
	color: string;
	description: string | null;
}

export interface Author {
	id: string;
	name: string;
}

export interface LearningPathStep {
	id: string;
	pathId: string;
	position: number;
	resourceId: string | null;
	title: string;
	description: string | null;
	isCompleted: boolean;
	resource?: Resource | null;
}

export interface LearningPath {
	id: string;
	name: string;
	description: string | null;
	createdAt: string;
	steps: LearningPathStep[];
}

export type ChatProvider = 'claude' | 'gemini';

export interface ChatMessage {
	id: string;
	conversationId: string;
	role: 'user' | 'assistant';
	content: string;
	createdAt: string;
}

export interface Conversation {
	id: string;
	resourceId: string;
	title: string | null;
	provider: ChatProvider;
	model: string;
	createdAt: string;
	messages: ChatMessage[];
}

export const CHAT_MODELS: { provider: ChatProvider; model: string; label: string }[] = [
	{ provider: 'claude', model: 'claude-sonnet-4-20250514', label: 'Claude Sonnet' },
	{ provider: 'claude', model: 'claude-opus-4-20250514', label: 'Claude Opus' },
	{ provider: 'gemini', model: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
	{ provider: 'gemini', model: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
];

export interface KnowledgeCard {
	id: string;
	resourceId: string | null;
	concept: string;
	explanation: string | null;
	difficulty: Difficulty | null;
	createdAt: string;
	resourceTitle?: string;
	nextReview?: string | null;
	reviewCount?: number;
}

export interface CardReview {
	id: string;
	cardId: string;
	scheduledAt: string;
	completedAt: string | null;
	rating: 'understood' | 'review_again' | null;
	intervalDays: number;
}

export interface Feed {
	id: string;
	name: string;
	url: string;
	category: string | null;
	lastFetched: string | null;
	isActive: boolean;
	keywords: string | null;
}

export interface FeedItem {
	id: string;
	feedId: string;
	title: string;
	url: string;
	publishedAt: string | null;
	summary: string | null;
	isSaved: boolean;
	isDismissed: boolean;
	discoveredAt: string;
	feedName?: string;
}

export interface Highlight {
	id: string;
	resourceId: string;
	text: string;
	note: string | null;
	createdAt: string;
}

export interface Resource {
	id: string;
	title: string;
	type: ResourceType;
	url: string | null;
	description: string | null;
	status: ResourceStatus;
	rating: number | null;
	priority: Priority;
	difficulty: Difficulty | null;
	coverImageUrl: string | null;
	personalNotes: string | null;
	dateAdded: string;
	dateStarted: string | null;
	dateCompleted: string | null;
	tags: Tag[];
	authors: Author[];
	highlights?: Highlight[];
	highlightCount?: number;
}

export interface ResourceCreate {
	title: string;
	type: ResourceType;
	url?: string | null;
	description?: string | null;
	status?: ResourceStatus;
	priority?: Priority;
	difficulty?: Difficulty | null;
	tagIds?: string[];
	authorNames?: string[];
}

export interface ResourceUpdate {
	title?: string;
	type?: ResourceType;
	url?: string | null;
	description?: string | null;
	status?: ResourceStatus;
	rating?: number | null;
	priority?: Priority;
	difficulty?: Difficulty | null;
	personalNotes?: string | null;
	tagIds?: string[];
	authorNames?: string[];
}

export const STATUS_COLUMNS: { key: ResourceStatus; label: string }[] = [
	{ key: 'backlog', label: 'Backlog' },
	{ key: 'to_read', label: 'To Read' },
	{ key: 'reading', label: 'Reading' },
	{ key: 'done', label: 'Done' },
	{ key: 'applied', label: 'Applied' }
];

export const TYPE_LABELS: Record<ResourceType, string> = {
	paper: 'Paper',
	book: 'Book',
	blog_post: 'Blog Post',
	podcast: 'Podcast',
	video: 'Video',
	website: 'Website',
	community: 'Community'
};

export const PRIORITY_COLORS: Record<Priority, string> = {
	low: '#6B7280',
	medium: '#F59E0B',
	high: '#F97316',
	critical: '#EF4444'
};
