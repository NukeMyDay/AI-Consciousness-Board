import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { nanoid } from 'nanoid';
import * as schema from './schema';

const sqlite = new Database('./data/app.db');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
const db = drizzle(sqlite, { schema });

sqlite.exec('DELETE FROM feed_item');
sqlite.exec('DELETE FROM feed');

const feeds = [
	{
		name: 'arXiv cs.AI',
		url: 'https://rss.arxiv.org/rss/cs.AI',
		category: 'Papers',
		keywords: 'consciousness,interpretability,alignment,welfare,sentience,awareness,moral status,mechanistic'
	},
	{
		name: 'arXiv cs.CL',
		url: 'https://rss.arxiv.org/rss/cs.CL',
		category: 'Papers',
		keywords: 'consciousness,interpretability,introspection,self-awareness,mechanistic,alignment'
	},
	{
		name: 'Anthropic Research',
		url: 'https://www.anthropic.com/rss/research',
		category: 'Labs',
		keywords: null
	},
	{
		name: 'DeepMind Blog',
		url: 'https://deepmind.google/blog/rss.xml',
		category: 'Labs',
		keywords: 'safety,interpretability,consciousness,alignment,evaluation'
	},
	{
		name: 'AI Alignment Forum',
		url: 'https://www.alignmentforum.org/feed.xml',
		category: 'Safety',
		keywords: 'consciousness,interpretability,welfare,moral'
	}
];

for (const f of feeds) {
	db.insert(schema.feed).values({
		id: nanoid(),
		name: f.name,
		url: f.url,
		category: f.category,
		keywords: f.keywords
	}).run();
	console.log(`  Added feed "${f.name}"${f.keywords ? ` (filtered: ${f.keywords.split(',').length} keywords)` : ' (unfiltered)'}`);
}

console.log(`\nSeeded ${feeds.length} feeds`);
sqlite.close();
