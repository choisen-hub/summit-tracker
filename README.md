# summit-tracker

A diplomacy intelligence dashboard that records meetings between heads of state and government (bilateral summits, multilateral meetings, phone calls) as structured data and lets you explore the relationship network, meeting frequency, agendas and joint statements. Global scope; seeded from public datasets (Wikidata, curated summit lists) and designed to be kept current by an LLM extraction pipeline over news feeds. Interface text is Korean.

The Korean version of this document is `README.ko.md`; the design document is `docs/DESIGN.md` with a visual dossier in `docs/design.html`.

## Features

- Dashboard (`/`): statistics tiles, a bilateral relationship network (SVG, edge width = meeting count, hover highlighting; large multilateral meetings such as G20 and G7 are excluded from the network because they connect every participant uniformly), a monthly frequency chart, top relationships, a leader grid and recent meetings.
- Meeting list (`/meetings`) with verification badges, and a detail page (`/meetings/[id]`) with participating countries, agenda items, joint statements, confidence score and source links.
- Data: 51 countries (G20 plus 30 non-G20 states), current G20 leaders pulled from Wikidata SPARQL, 20 annual G20 summits (2008 to 2025), curated bilateral and small-group summits, and 40 meetings for 2026 with per-meeting source URLs.
- "Active since" filter (`ACTIVE_SINCE` in `src/lib/queries.ts`) that limits the dashboard to a date range without deleting older rows.
- Pure-function modules for deduplication (`src/lib/dedup.ts`: same meeting reported by several articles is clustered by date ±1 day, participant set and place) and entity linking (`src/lib/entity-linking.ts`: aliases to canonical leader and country rows), each with tests.

## How it works

```
Wikidata SPARQL ──▶ seed-wikidata.ts ──▶ leaders, countries ─┐
curated lists   ──▶ seed-summits.ts / seed-bilaterals.ts / seed-2026.ts ──▶ meetings, participants, agendas, statements, sources
news feeds      ──▶ extract-news.ts (Phase 3, LLM) ──▶ verification queue ──▶ same tables
                                                             │
                                   Supabase Postgres (8 tables, 3 views) ──▶ Next.js server components ──▶ dashboard
```

- Reads go through `src/lib/queries.ts` (anon key, server only); aggregation for charts is in `src/lib/aggregate.ts` (pure functions).
- Writes and seeding use the service-role key through `src/lib/supabase-admin.ts` and the scripts in `scripts/`.
- Every record carries sources and a confidence value; automatically extracted rows are meant to pass a verification queue before they count.
- Multilateral meetings are attributed at country level (migration 0003) so that participant counting works for large summits.

## Requirements

- Node 18 or later (the project pins Next.js 15 and Tailwind CSS v3 for Node 18; Node 20+ allows newer versions).
- A Supabase project (free tier is enough).
- Optional: an Anthropic API key for the news extraction script.

## Installation and running

```
npm install
cp .env.example .env.local        # fill in the Supabase URL and keys

# apply the schema to the hosted project
npx supabase login
npx supabase link --project-ref <your-project-ref>
npm run db:push                   # or paste supabase/schema.sql into the SQL editor

# seed data
npm run seed:all                  # countries, Wikidata leaders, summits, bilaterals, 2026 meetings

npm run dev                       # http://localhost:3000
```

Run either `npm run dev` or `npm run build && npm run start`, not both at once: building while the dev server runs corrupts the `.next` cache.

## Configuration

| Variable | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | app, scripts | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | app (read only) | anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | scripts only | never shipped to the browser |
| `SUPABASE_URL` | scripts (optional) | overrides the public URL |
| `ANTHROPIC_API_KEY` | `scripts/extract-news.ts` | Phase 3 only |

Scripts load `.env.local` through `scripts/load-env.ts`. `.env*` files are ignored by git; only `.env.example` with placeholders is committed.

## Project structure

```
src/app/                 routes: dashboard, meetings list, meeting detail
src/components/          NetworkGraph, FrequencyChart (client), SiteHeader
src/lib/                 supabase clients, queries, aggregate, dedup, entity-linking, labels, types
src/data/countries.ts    country reference (51 states)
scripts/                 seed-* and extract-news (run with tsx)
supabase/                schema.sql (combined), migrations 0001 to 0003, config.toml
docs/                    DESIGN.md (goals, data strategy, schema, roadmap), design.html
```

## Data sources and licensing

- Leaders and terms: Wikidata (CC0) via SPARQL; presidential systems use P35 (head of state), parliamentary systems use P6 (head of government).
- Summits and bilateral meetings: curated from public reporting; each 2026 meeting stores its source URLs in the `sources` table with a confidence value between 0.7 and 0.9.
- Planned: Wikipedia "international trips" lists, UN Digital Library and foreign-ministry archives for joint statements (see `docs/DESIGN.md`).

## Known limitations

- Historical bilateral coverage is curated, not exhaustive; dates for some older meetings are approximate.
- The relationship network only becomes meaningful with bilateral data; annual multilateral summits alone produce a uniform clique.
- The live news pipeline (Phase 3), world map view (Phase 4) and deployment are on the roadmap, not implemented.

## License

MIT, see `LICENSE`.
