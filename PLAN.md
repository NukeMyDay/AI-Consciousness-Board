# AI Consciousness Research Board — Phase 1 Plan

## Stack
- **SvelteKit** (Svelte 5) — Frontend + API in einem Projekt
- **SQLite** via **better-sqlite3** + **Drizzle ORM** — leichtgewichtig, eine Datei
- **Tailwind CSS 4** + **bits-ui** — Styling + Headless Components
- **svelte-dnd-action** — Drag & Drop für Kanban
- **TypeScript** durchgehend

## Warum dieser Stack
- SvelteKit = ein Prozess, ein Port, kein separates Backend
- SQLite = kein DB-Server, Backup = Datei kopieren, perfekt für Single-User
- Drizzle = typsicherer SQL-Zugriff ohne Prisma-Overhead (kein Binary, kein Engine)
- Svelte 5 Runes = weniger Code als React für gleiche Funktionalität
- bits-ui statt shadcn = native Svelte, kein Port/Wrapper

## Finales Datenmodell (alle Phasen)

### resource
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | nanoid |
| title | text NOT NULL | |
| type | text NOT NULL | paper, book, blog_post, podcast, video, website, community |
| url | text | nullable |
| description | text | manuell, kurz |
| status | text NOT NULL | backlog, to_read, reading, done, applied |
| rating | integer | 1-5, nullable |
| priority | text NOT NULL | low, medium, high, critical |
| difficulty | text | beginner, intermediate, advanced |
| cover_image_url | text | nullable |
| source_feed_id | text | FK zu feed, nullable |
| personal_notes | text | Markdown |
| date_added | text NOT NULL | ISO datetime |
| date_started | text | nullable |
| date_completed | text | nullable |

### author
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | nanoid |
| name | text NOT NULL UNIQUE | |

### resource_author
| Column | Type | Notes |
|--------|------|-------|
| resource_id | text FK | |
| author_id | text FK | |
| PK | composite | (resource_id, author_id) |

### tag
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | nanoid |
| name | text NOT NULL UNIQUE | |
| color | text NOT NULL | hex |
| description | text | nullable |

### resource_tag
| Column | Type | Notes |
|--------|------|-------|
| resource_id | text FK | |
| tag_id | text FK | |
| PK | composite | (resource_id, tag_id) |

### highlight (Phase 2)
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | nanoid |
| resource_id | text FK NOT NULL | |
| text | text NOT NULL | der markierte Text |
| note | text | eigene Anmerkung |
| created_at | text NOT NULL | ISO datetime |

### feed (Phase 5)
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | nanoid |
| name | text NOT NULL | |
| url | text NOT NULL | |
| category | text | nullable |
| last_fetched | text | nullable |
| is_active | integer NOT NULL | boolean, default 1 |
| auto_add | integer NOT NULL | boolean, default 0 |
| keywords | text | comma-separated filter keywords |

### feed_item (Phase 5)
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | nanoid |
| feed_id | text FK NOT NULL | |
| title | text NOT NULL | |
| url | text NOT NULL | |
| published_at | text | nullable |
| summary | text | nullable |
| is_saved | integer NOT NULL | default 0 |
| is_dismissed | integer NOT NULL | default 0 |
| discovered_at | text NOT NULL | |

### learning_path (Phase 4)
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | nanoid |
| name | text NOT NULL | |
| description | text | |
| created_at | text NOT NULL | |

### learning_path_step (Phase 4)
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | nanoid |
| path_id | text FK NOT NULL | |
| position | integer NOT NULL | Sortierung |
| resource_id | text FK | nullable — wenn verknüpft |
| title | text NOT NULL | Freitext wenn kein Resource |
| description | text | |
| is_completed | integer NOT NULL | default 0 |

### review (Phase 7)
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | nanoid |
| resource_id | text FK NOT NULL | |
| scheduled_at | text NOT NULL | wann Review fällig |
| completed_at | text | nullable |
| rating | text | retained, review_again |
| interval_days | integer NOT NULL | aktuelles Intervall |

### conversation (Phase 6)
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | nanoid |
| resource_id | text FK NOT NULL | |
| created_at | text NOT NULL | |
| title | text | auto-generiert oder manuell |

### conversation_message (Phase 6)
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | nanoid |
| conversation_id | text FK NOT NULL | |
| role | text NOT NULL | user, assistant |
| content | text NOT NULL | |
| created_at | text NOT NULL | |

## Phase 1 Scope — Kanban Board + CRUD

### Schritt 1: Projekt-Scaffolding
- `npm create svelte@latest` mit TypeScript + Tailwind
- Drizzle ORM + better-sqlite3 einrichten
- Projektstruktur:
```
ai-consciousness-board/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── index.ts          # DB connection
│   │   │   │   ├── schema.ts         # Drizzle schema (Phase 1 tables)
│   │   │   │   └── seed.ts           # Seed script
│   │   │   └── api/
│   │   │       └── resources.ts      # Resource CRUD logic
│   │   ├── components/
│   │   │   ├── KanbanBoard.svelte
│   │   │   ├── KanbanColumn.svelte
│   │   │   ├── ResourceCard.svelte
│   │   │   ├── ResourceDialog.svelte # Create/Edit Modal
│   │   │   ├── TagBadge.svelte
│   │   │   └── Header.svelte
│   │   ├── types.ts                  # Shared TypeScript types
│   │   └── utils.ts                  # nanoid, date helpers
│   ├── routes/
│   │   ├── +layout.svelte            # App shell, dark mode
│   │   ├── +page.svelte              # Kanban Board (Hauptseite)
│   │   └── api/
│   │       └── resources/
│   │           ├── +server.ts         # GET (list), POST (create)
│   │           └── [id]/
│   │               └── +server.ts     # GET, PATCH, DELETE
│   └── app.css                        # Tailwind base + custom
├── drizzle/                           # Generated migrations
├── drizzle.config.ts
├── package.json
├── svelte.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

### Schritt 2: Datenbank Schema (Phase 1 Tabellen)
- resource, author, resource_author, tag, resource_tag
- Drizzle schema definieren
- Migration generieren + anwenden

### Schritt 3: Seed Script
- Alle 24 Resources aus dem Prompt
- 10 Tags mit Farben
- Autoren extrahieren und verknüpfen
- Script läuft via `npm run seed`

### Schritt 4: API Endpoints
- `GET /api/resources` — alle Resources mit Tags + Autoren, gruppiert nach Status
- `POST /api/resources` — neue Resource erstellen
- `PATCH /api/resources/[id]` — Resource updaten (inkl. Status-Wechsel für Drag & Drop)
- `DELETE /api/resources/[id]` — Resource löschen

### Schritt 5: Kanban Board UI
- 5 Spalten: Backlog, To Read, Reading, Done, Applied
- Cards mit: Titel, Type-Icon, Tag-Chips, Priority-Indicator, Difficulty-Badge
- Drag & Drop zwischen Spalten (svelte-dnd-action)
- Drop aktualisiert Status via PATCH

### Schritt 6: Resource Create/Edit Dialog
- Modal mit Formular für alle Felder
- Tag-Auswahl (Multi-Select mit farbigen Chips)
- Autoren als kommasepariertes Textfeld (werden automatisch zu Author-Entities)

### Schritt 7: Filter + Suche (Basis)
- Filter-Bar über dem Board: Tag, Type, Priority, Difficulty
- Textsuche über Titel
- Filter als URL-Parameter (shareable state)

### Schritt 8: Dark Mode + Styling
- Dark Mode als Default, Toggle im Header
- Tailwind dark: Klassen
- Farbschema: Neutral-Grau Basis, Akzentfarben über Tags
- Responsive Grundlayout (Desktop-first)
