import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import { existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

const DB_PATH = './data/app.db';

const dir = dirname(DB_PATH);
if (!existsSync(dir)) {
	mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Auto-migrate on startup
try {
	const migrationsPath = resolve('./drizzle');
	if (existsSync(migrationsPath)) {
		migrate(db, { migrationsFolder: migrationsPath });
	}
} catch (e) {
	console.error('Migration error:', e);
}
