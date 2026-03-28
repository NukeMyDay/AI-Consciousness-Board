import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { nanoid } from 'nanoid';
import * as schema from './schema';
import { existsSync, mkdirSync } from 'fs';

const DB_PATH = './data/app.db';
const dir = './data';
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

// Run migrations
migrate(db, { migrationsFolder: './drizzle' });

// Clear existing data
sqlite.exec('DELETE FROM resource_tag');
sqlite.exec('DELETE FROM resource_author');
sqlite.exec('DELETE FROM resource');
sqlite.exec('DELETE FROM tag');
sqlite.exec('DELETE FROM author');

// --- TAGS ---
const tags: Record<string, string> = {};
const tagData = [
	{ name: 'Consciousness', color: '#8B5CF6', description: 'AI consciousness, sentience, and the hard problem' },
	{ name: 'Interpretability', color: '#3B82F6', description: 'Mechanistic interpretability, SAEs, circuit analysis' },
	{ name: 'AI Safety', color: '#EF4444', description: 'Alignment, safety, responsible development' },
	{ name: 'Model Welfare', color: '#10B981', description: 'AI welfare, moral status, ethical consideration' },
	{ name: 'Evaluation', color: '#F59E0B', description: 'Benchmarks, evals, systematic measurement' },
	{ name: 'Philosophy', color: '#EC4899', description: 'Philosophy of mind, ethics, epistemology' },
	{ name: 'Neuroscience', color: '#6366F1', description: 'Neuroscience of consciousness, brain theories' },
	{ name: 'Anthropic', color: '#D97706', description: 'Research and publications from Anthropic' },
	{ name: 'Agents', color: '#14B8A6', description: 'Agentic systems, multi-agent, orchestration' },
	{ name: 'Must Read', color: '#DC2626', description: 'Essential reading' }
];

for (const t of tagData) {
	const id = nanoid();
	tags[t.name] = id;
	db.insert(schema.tag).values({ id, ...t }).run();
}

// --- AUTHORS ---
const authors: Record<string, string> = {};

function getOrCreateAuthor(name: string): string {
	if (authors[name]) return authors[name];
	const id = nanoid();
	authors[name] = id;
	db.insert(schema.author).values({ id, name }).run();
	return id;
}

// --- RESOURCES ---
interface SeedResource {
	title: string;
	type: 'paper' | 'book' | 'blog_post' | 'podcast' | 'video' | 'website' | 'community';
	url?: string;
	authors?: string[];
	status: 'backlog' | 'to_read' | 'reading' | 'done' | 'applied';
	priority: 'low' | 'medium' | 'high' | 'critical';
	difficulty?: 'beginner' | 'intermediate' | 'advanced';
	tags: string[];
}

const resources: SeedResource[] = [
	// Podcasts
	{
		title: 'Kyle Fish on AI Welfare Experiments',
		type: 'podcast',
		url: 'https://80000hours.org/podcast/episodes/kyle-fish-ai-welfare-anthropic/',
		authors: ['Kyle Fish'],
		status: 'to_read',
		priority: 'critical',
		difficulty: 'beginner',
		tags: ['Consciousness', 'Model Welfare', 'Anthropic', 'Must Read']
	},
	{
		title: 'Chris Olah on Interpretability Research',
		type: 'podcast',
		url: 'https://80000hours.org/podcast/episodes/chris-olah-interpretability-research/',
		authors: ['Chris Olah'],
		status: 'to_read',
		priority: 'critical',
		difficulty: 'beginner',
		tags: ['Interpretability', 'Anthropic', 'Must Read']
	},
	// Papers
	{
		title: 'Taking AI Welfare Seriously',
		type: 'paper',
		url: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4810844',
		authors: ['Jeff Sebo', 'David Chalmers', 'Robert Long', 'Kyle Fish'],
		status: 'to_read',
		priority: 'critical',
		difficulty: 'intermediate',
		tags: ['Model Welfare', 'Consciousness', 'Philosophy', 'Must Read']
	},
	{
		title: 'Identifying Indicators of Consciousness in AI Systems',
		type: 'paper',
		url: 'https://www.cell.com/trends/cognitive-sciences/fulltext/S1364-6613(25)00286-4',
		authors: ['Patrick Butlin', 'Robert Long', 'David Chalmers', 'Yoshua Bengio'],
		status: 'to_read',
		priority: 'critical',
		difficulty: 'advanced',
		tags: ['Consciousness', 'Evaluation', 'Neuroscience', 'Must Read']
	},
	{
		title: 'Illusions of AI Consciousness',
		type: 'paper',
		authors: ['Yoshua Bengio', 'Guillaume Elmoznino'],
		status: 'to_read',
		priority: 'high',
		difficulty: 'intermediate',
		tags: ['Consciousness', 'Philosophy', 'AI Safety']
	},
	{
		title: 'Conscious Artificial Intelligence and Biological Naturalism',
		type: 'paper',
		authors: ['Anil Seth'],
		status: 'backlog',
		priority: 'medium',
		difficulty: 'advanced',
		tags: ['Consciousness', 'Neuroscience', 'Philosophy']
	},
	{
		title: 'AI Consciousness: A Centrist Manifesto',
		type: 'paper',
		authors: ['Jonathan Birch'],
		status: 'backlog',
		priority: 'high',
		difficulty: 'intermediate',
		tags: ['Consciousness', 'Philosophy']
	},
	{
		title: 'Is AI Conscious? A Primer on the Myths and Confusions',
		type: 'paper',
		authors: ['Susan Schneider'],
		status: 'backlog',
		priority: 'medium',
		difficulty: 'beginner',
		tags: ['Consciousness', 'Philosophy']
	},
	{
		title: 'Just Aware Enough',
		type: 'paper',
		url: 'https://arxiv.org/pdf/2601.14901',
		authors: ['Kathinka Evers'],
		status: 'backlog',
		priority: 'medium',
		difficulty: 'advanced',
		tags: ['Consciousness', 'Evaluation']
	},
	{
		title: 'Probing for Consciousness in Machines',
		type: 'paper',
		status: 'backlog',
		priority: 'medium',
		difficulty: 'advanced',
		tags: ['Consciousness', 'Evaluation', 'Neuroscience']
	},
	{
		title: 'AI Consciousness is Inevitable',
		type: 'paper',
		authors: ['Lenore Blum', 'Manuel Blum'],
		status: 'backlog',
		priority: 'low',
		difficulty: 'advanced',
		tags: ['Consciousness', 'Philosophy']
	},
	{
		title: 'Emergent Introspective Awareness in LLMs',
		type: 'paper',
		authors: ['Chris Lindsey'],
		status: 'to_read',
		priority: 'high',
		difficulty: 'advanced',
		tags: ['Interpretability', 'Consciousness', 'Anthropic']
	},
	// Blog Posts / Essays
	{
		title: 'The Urgency of Interpretability',
		type: 'blog_post',
		url: 'https://www.darioamodei.com/post/the-urgency-of-interpretability',
		authors: ['Dario Amodei'],
		status: 'to_read',
		priority: 'critical',
		difficulty: 'beginner',
		tags: ['Interpretability', 'Anthropic', 'AI Safety', 'Must Read']
	},
	{
		title: 'The Evidence for AI Consciousness, Today',
		type: 'blog_post',
		url: 'https://ai-frontiers.org/articles/the-evidence-for-ai-consciousness-today',
		status: 'to_read',
		priority: 'high',
		difficulty: 'intermediate',
		tags: ['Consciousness', 'Model Welfare']
	},
	{
		title: 'Exploring Model Welfare',
		type: 'blog_post',
		url: 'https://www.anthropic.com/research/exploring-model-welfare',
		status: 'to_read',
		priority: 'critical',
		difficulty: 'beginner',
		tags: ['Model Welfare', 'Anthropic', 'Must Read']
	},
	// Websites / Communities
	{
		title: 'Transformer Circuits Thread',
		type: 'website',
		url: 'https://transformer-circuits.pub/',
		status: 'reading',
		priority: 'high',
		tags: ['Interpretability', 'Anthropic']
	},
	{
		title: 'Eleos AI Research',
		type: 'community',
		url: 'https://eleosai.org/research/',
		status: 'backlog',
		priority: 'medium',
		tags: ['Model Welfare', 'Consciousness']
	},
	{
		title: 'The Consciousness AI',
		type: 'community',
		url: 'https://theconsciousness.ai/',
		status: 'backlog',
		priority: 'medium',
		tags: ['Consciousness']
	},
	{
		title: 'PRISM — Partnership for Research Into Sentient Machines',
		type: 'community',
		url: 'https://www.prism-global.com/',
		status: 'backlog',
		priority: 'medium',
		tags: ['Consciousness', 'Model Welfare']
	},
	// Books
	{
		title: 'Being You',
		type: 'book',
		authors: ['Anil Seth'],
		status: 'to_read',
		priority: 'critical',
		difficulty: 'beginner',
		tags: ['Consciousness', 'Neuroscience', 'Must Read']
	},
	{
		title: 'The Conscious Mind',
		type: 'book',
		authors: ['David Chalmers'],
		status: 'backlog',
		priority: 'high',
		difficulty: 'advanced',
		tags: ['Consciousness', 'Philosophy']
	},
	{
		title: 'Embodiment and the Inner Life',
		type: 'book',
		authors: ['Murray Shanahan'],
		status: 'backlog',
		priority: 'medium',
		difficulty: 'intermediate',
		tags: ['Consciousness', 'Philosophy', 'Agents']
	},
	{
		title: 'The Hidden Spring',
		type: 'book',
		authors: ['Mark Solms'],
		status: 'backlog',
		priority: 'medium',
		difficulty: 'intermediate',
		tags: ['Consciousness', 'Neuroscience']
	},
	{
		title: 'The Moral Circle',
		type: 'book',
		authors: ['Jeff Sebo'],
		status: 'backlog',
		priority: 'medium',
		difficulty: 'intermediate',
		tags: ['Model Welfare', 'Philosophy']
	}
];

const now = new Date().toISOString();

for (const r of resources) {
	const id = nanoid();

	db.insert(schema.resource)
		.values({
			id,
			title: r.title,
			type: r.type,
			url: r.url ?? null,
			description: null,
			status: r.status,
			priority: r.priority,
			difficulty: r.difficulty ?? null,
			dateAdded: now
		})
		.run();

	// Link tags
	for (const tagName of r.tags) {
		const tagId = tags[tagName];
		if (tagId) {
			db.insert(schema.resourceTag).values({ resourceId: id, tagId }).run();
		}
	}

	// Link authors
	if (r.authors) {
		for (const authorName of r.authors) {
			const authorId = getOrCreateAuthor(authorName);
			db.insert(schema.resourceAuthor).values({ resourceId: id, authorId }).run();
		}
	}
}

console.log(`Seeded ${tagData.length} tags`);
console.log(`Seeded ${Object.keys(authors).length} authors`);
console.log(`Seeded ${resources.length} resources`);
console.log('Done!');

sqlite.close();
