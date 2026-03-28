import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const resource = sqliteTable('resource', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	type: text('type', {
		enum: ['paper', 'book', 'blog_post', 'podcast', 'video', 'website', 'community']
	}).notNull(),
	url: text('url'),
	description: text('description'),
	status: text('status', {
		enum: ['backlog', 'to_read', 'reading', 'done', 'applied']
	}).notNull().default('backlog'),
	rating: integer('rating'),
	priority: text('priority', {
		enum: ['low', 'medium', 'high', 'critical']
	}).notNull().default('medium'),
	difficulty: text('difficulty', {
		enum: ['beginner', 'intermediate', 'advanced']
	}),
	coverImageUrl: text('cover_image_url'),
	sourceFeedId: text('source_feed_id'),
	personalNotes: text('personal_notes'),
	dateAdded: text('date_added').notNull(),
	dateStarted: text('date_started'),
	dateCompleted: text('date_completed')
});

export const author = sqliteTable('author', {
	id: text('id').primaryKey(),
	name: text('name').notNull().unique()
});

export const resourceAuthor = sqliteTable(
	'resource_author',
	{
		resourceId: text('resource_id').notNull().references(() => resource.id, { onDelete: 'cascade' }),
		authorId: text('author_id').notNull().references(() => author.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.resourceId, table.authorId] })]
);

export const tag = sqliteTable('tag', {
	id: text('id').primaryKey(),
	name: text('name').notNull().unique(),
	color: text('color').notNull(),
	description: text('description')
});

export const resourceTag = sqliteTable(
	'resource_tag',
	{
		resourceId: text('resource_id').notNull().references(() => resource.id, { onDelete: 'cascade' }),
		tagId: text('tag_id').notNull().references(() => tag.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.resourceId, table.tagId] })]
);

export const highlight = sqliteTable('highlight', {
	id: text('id').primaryKey(),
	resourceId: text('resource_id').notNull().references(() => resource.id, { onDelete: 'cascade' }),
	text: text('text').notNull(),
	note: text('note'),
	createdAt: text('created_at').notNull()
});

export const learningPath = sqliteTable('learning_path', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: text('created_at').notNull()
});

export const learningPathStep = sqliteTable('learning_path_step', {
	id: text('id').primaryKey(),
	pathId: text('path_id').notNull().references(() => learningPath.id, { onDelete: 'cascade' }),
	position: integer('position').notNull(),
	resourceId: text('resource_id').references(() => resource.id, { onDelete: 'set null' }),
	title: text('title').notNull(),
	description: text('description'),
	isCompleted: integer('is_completed').notNull().default(0)
});

export const conversation = sqliteTable('conversation', {
	id: text('id').primaryKey(),
	resourceId: text('resource_id').notNull().references(() => resource.id, { onDelete: 'cascade' }),
	title: text('title'),
	provider: text('provider').notNull().default('claude'),
	model: text('model').notNull().default('claude-sonnet-4-20250514'),
	createdAt: text('created_at').notNull()
});

export const conversationMessage = sqliteTable('conversation_message', {
	id: text('id').primaryKey(),
	conversationId: text('conversation_id').notNull().references(() => conversation.id, { onDelete: 'cascade' }),
	role: text('role', { enum: ['user', 'assistant'] }).notNull(),
	content: text('content').notNull(),
	createdAt: text('created_at').notNull()
});

export const feed = sqliteTable('feed', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	url: text('url').notNull(),
	category: text('category'),
	lastFetched: text('last_fetched'),
	isActive: integer('is_active').notNull().default(1),
	keywords: text('keywords')
});

export const feedItem = sqliteTable('feed_item', {
	id: text('id').primaryKey(),
	feedId: text('feed_id').notNull().references(() => feed.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	url: text('url').notNull(),
	publishedAt: text('published_at'),
	summary: text('summary'),
	isSaved: integer('is_saved').notNull().default(0),
	isDismissed: integer('is_dismissed').notNull().default(0),
	discoveredAt: text('discovered_at').notNull()
});

export const knowledgeCard = sqliteTable('knowledge_card', {
	id: text('id').primaryKey(),
	resourceId: text('resource_id').references(() => resource.id, { onDelete: 'set null' }),
	concept: text('concept').notNull(),
	explanation: text('explanation'),
	difficulty: text('difficulty', { enum: ['beginner', 'intermediate', 'advanced'] }),
	createdAt: text('created_at').notNull()
});

export const cardReview = sqliteTable('card_review', {
	id: text('id').primaryKey(),
	cardId: text('card_id').notNull().references(() => knowledgeCard.id, { onDelete: 'cascade' }),
	scheduledAt: text('scheduled_at').notNull(),
	completedAt: text('completed_at'),
	rating: text('rating', { enum: ['understood', 'review_again'] }),
	intervalDays: integer('interval_days').notNull().default(1)
});
