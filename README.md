# AI Consciousness Board

A self-hosted research platform for tracking, organizing, and learning about AI consciousness, interpretability, and evaluation. Built as a personal learning hub with gamification, AI-powered chat, and spaced repetition.

## Features

- **Curated Dashboard** with Up Next, Currently Reading, and status-based organization
- **Learning Paths** with ordered steps linked to resources and auto-completion tracking
- **Knowledge Cards + Spaced Repetition** with AI-powered evaluation (Claude/Gemini)
- **AI Chat** per resource — discuss papers with Claude or Gemini using full resource context
- **Gamification** — XP system, levels, spider chart expertise visualization, milestones, role assessment
- **RSS Feeds** with keyword filtering for discovering new research
- **Notes + Highlights** per resource with Markdown support
- **JSON Export** of all data
- **Dark/Light mode**

## Tech Stack

- **SvelteKit** (Svelte 5) — Frontend + API
- **SQLite** via better-sqlite3 + Drizzle ORM
- **Tailwind CSS 4**
- **TypeScript**

## Quick Start

### Prerequisites

- Node.js >= 22.12

### Local Development

```bash
# Install dependencies
npm install

# Seed the database
npm run seed
npm run seed:paths
npm run seed:feeds

# Start dev server
npm run dev
```

Open http://localhost:5173

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Optional — enables AI chat and knowledge card evaluation
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
```

The app works without API keys — chat and AI evaluation features will be disabled.

### Docker

```bash
# Build and run
docker compose up -d

# With API keys
ANTHROPIC_API_KEY=sk-ant-... docker compose up -d
```

The app will be available at http://localhost:3000

## Pre-seeded Content

The app comes with:
- **24 resources** — key papers, books, podcasts, and blogs on AI consciousness
- **10 tags** — Consciousness, Interpretability, AI Safety, Model Welfare, etc.
- **4 learning paths** — Foundations, Mechanistic Interpretability, AI Welfare, AI Evaluation
- **5 RSS feeds** — arXiv, Anthropic Research, DeepMind, AI Alignment Forum

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run seed` | Seed resources + tags |
| `npm run seed:paths` | Seed learning paths |
| `npm run seed:feeds` | Seed RSS feeds |
| `npm run db:generate` | Generate DB migration |
| `npm run db:migrate` | Apply migrations |

## License

MIT
