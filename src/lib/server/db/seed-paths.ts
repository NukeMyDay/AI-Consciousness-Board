import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import * as schema from './schema';

const DB_PATH = './data/app.db';
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
const db = drizzle(sqlite, { schema });

// Helper to find resource by title
function findResource(title: string): string | null {
	const r = db.select({ id: schema.resource.id }).from(schema.resource).where(eq(schema.resource.title, title)).get();
	return r?.id ?? null;
}

// Clear existing paths
sqlite.exec('DELETE FROM learning_path_step');
sqlite.exec('DELETE FROM learning_path');

const now = new Date().toISOString();

interface PathSeed {
	name: string;
	description: string;
	steps: { title: string; description?: string; resourceTitle?: string }[];
}

const paths: PathSeed[] = [
	{
		name: 'Foundations of AI Consciousness',
		description: 'From neuroscience basics to the hard problem — build a solid understanding of what consciousness means and why it matters for AI.',
		steps: [
			{ title: 'Read "Being You" by Anil Seth', description: 'Accessible introduction to consciousness from a neuroscience perspective.', resourceTitle: 'Being You' },
			{ title: 'Listen: Kyle Fish on AI Welfare', description: 'Practical perspective on why AI consciousness matters today.', resourceTitle: 'Kyle Fish on AI Welfare Experiments' },
			{ title: 'Read: Is AI Conscious? A Primer on the Myths and Confusions', description: 'Clears up common misconceptions.', resourceTitle: 'Is AI Conscious? A Primer on the Myths and Confusions' },
			{ title: 'Read: The Evidence for AI Consciousness, Today', description: 'Current state of evidence and arguments.', resourceTitle: 'The Evidence for AI Consciousness, Today' },
			{ title: 'Read: AI Consciousness — A Centrist Manifesto', description: 'Birch\'s balanced framework for thinking about AI consciousness.', resourceTitle: 'AI Consciousness: A Centrist Manifesto' },
			{ title: 'Read: Identifying Indicators of Consciousness in AI Systems', description: 'The key paper on systematic consciousness indicators.', resourceTitle: 'Identifying Indicators of Consciousness in AI Systems' },
			{ title: 'Read: The Conscious Mind by Chalmers', description: 'Deep dive into the philosophy — the hard problem of consciousness.', resourceTitle: 'The Conscious Mind' },
		]
	},
	{
		name: 'Mechanistic Interpretability',
		description: 'Understand how neural networks work internally — from the "why" to the technical "how" of circuit analysis and SAEs.',
		steps: [
			{ title: 'Read: The Urgency of Interpretability', description: 'Dario Amodei on why interpretability is critical now.', resourceTitle: 'The Urgency of Interpretability' },
			{ title: 'Listen: Chris Olah on Interpretability Research', description: 'The pioneer of mechanistic interpretability explains his vision.', resourceTitle: 'Chris Olah on Interpretability Research' },
			{ title: 'Explore: Transformer Circuits Thread', description: 'Work through key posts on transformer-circuits.pub.', resourceTitle: 'Transformer Circuits Thread' },
			{ title: 'Read: Emergent Introspective Awareness in LLMs', description: 'Where interpretability meets consciousness research.', resourceTitle: 'Emergent Introspective Awareness in LLMs' },
			{ title: 'Study: Sparse Autoencoders (SAEs)', description: 'Understand the key tool for feature extraction in neural networks. Find papers on Anthropic Research.' },
			{ title: 'Practice: Run interpretability experiments', description: 'Hands-on: Use TransformerLens or SAE tools on a small model.' },
		]
	},
	{
		name: 'AI Welfare & Moral Status',
		description: 'The ethical dimension — should we care about AI wellbeing? How do we operationalize moral consideration for AI systems?',
		steps: [
			{ title: 'Read: Exploring Model Welfare', description: 'Anthropic\'s foundational post on why they take model welfare seriously.', resourceTitle: 'Exploring Model Welfare' },
			{ title: 'Read: Taking AI Welfare Seriously', description: 'The comprehensive case by Sebo, Chalmers et al.', resourceTitle: 'Taking AI Welfare Seriously' },
			{ title: 'Read: The Moral Circle by Jeff Sebo', description: 'Broader philosophical framework for expanding moral consideration.', resourceTitle: 'The Moral Circle' },
			{ title: 'Explore: Eleos AI Research', description: 'Review research from the leading AI welfare organization.', resourceTitle: 'Eleos AI Research' },
			{ title: 'Explore: PRISM', description: 'Partnership for Research Into Sentient Machines — community and research.', resourceTitle: 'PRISM — Partnership for Research Into Sentient Machines' },
			{ title: 'Read: Illusions of AI Consciousness', description: 'The skeptical counterpoint — Bengio on why we might be wrong.', resourceTitle: 'Illusions of AI Consciousness' },
		]
	},
	{
		name: 'AI Evaluation & Measurement',
		description: 'How do we systematically test, measure, and evaluate AI capabilities, consciousness indicators, and safety?',
		steps: [
			{ title: 'Read: Identifying Indicators of Consciousness in AI Systems', description: 'The framework paper for consciousness evaluation.', resourceTitle: 'Identifying Indicators of Consciousness in AI Systems' },
			{ title: 'Read: Just Aware Enough', description: 'Evers et al. on minimal thresholds for awareness.', resourceTitle: 'Just Aware Enough' },
			{ title: 'Read: Probing for Consciousness in Machines', description: 'Practical approaches to testing for consciousness.', resourceTitle: 'Probing for Consciousness in Machines' },
			{ title: 'Study: Current AI benchmarks landscape', description: 'Survey MMLU, ARC, BigBench — understand how AI capabilities are measured today.' },
			{ title: 'Study: Behavioral vs. mechanistic evaluation', description: 'Understand the difference between testing what AI does vs. how it works internally.' },
			{ title: 'Read: AI Consciousness is Inevitable?', description: 'Blum & Blum\'s argument — consider the implications for evaluation.', resourceTitle: 'AI Consciousness is Inevitable' },
		]
	}
];

for (const p of paths) {
	const pathId = nanoid();
	db.insert(schema.learningPath).values({
		id: pathId,
		name: p.name,
		description: p.description,
		createdAt: now
	}).run();

	for (let i = 0; i < p.steps.length; i++) {
		const step = p.steps[i];
		const resourceId = step.resourceTitle ? findResource(step.resourceTitle) : null;

		db.insert(schema.learningPathStep).values({
			id: nanoid(),
			pathId,
			position: i,
			resourceId,
			title: step.title,
			description: step.description ?? null,
			isCompleted: 0
		}).run();
	}

	console.log(`  Created path "${p.name}" with ${p.steps.length} steps`);
}

console.log(`\nSeeded ${paths.length} learning paths`);
console.log('Done!');
sqlite.close();
