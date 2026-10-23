# AI Tools Directory

A React + Vite app for discovering AI tools by task, category, and use case instead of by hype.

This project is built around a structured catalog of AI products that users can browse by work type — writing, coding, research, design, automation, customer support, HR, and more. The front end is designed for practical discovery: users can search, filter, compare, and save promising tools without getting lost in a generic AI list.

## Why this project exists

The core problem is simple: most AI tool lists are either too generic or too noisy to be useful in real work. This project turns that into a usable product experience:

- start from the kind of work you need to do
- browse curated categories and search by intent
- filter by pricing, use case, and metadata
- compare a few promising tools side by side
- keep useful results in a saved list for later review

From a product perspective, the app is a task-first discovery layer over a structured AI catalog. From an engineering perspective, it is a catalog-driven frontend with searchable data, URL-synced filters, validation logic, and Supabase-backed persistence.

## What’s included

- category-driven browsing across multiple AI workflows
- text search and URL-synced filtering
- server-side or local fallback filtering logic
- dynamic detail pages for each tool
- compare tray for up to three tools
- saved tools with anonymous session persistence
- tool submission waitlist flow
- schema validation and catalog utilities for data quality

## Tech stack

- React 19 + Vite 8
- React Router
- Supabase for database, auth, storage, and server-side search
- Vanilla CSS with shared design tokens
- Lucide React icons
- Node’s built-in test runner

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A Supabase project (optional for local dev, required for live data features such as storage, auth, and server-side filtering)

## Environment variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | client | Project URL. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | Browser-safe publishable key (`sb_publishable_…`). |
| `SUPABASE_SECRET_KEY` | server only | Secret key used by data sync and logo upload scripts. Never expose this in the browser. |
| `SITE_URL` | build-time | Public origin used to generate absolute sitemap and robots output. |

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are missing, the app still runs with the bundled catalog and browser storage.

## Local development

```sh
npm install
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://localhost:5173/
```

## Connecting Supabase

If you want the full app experience with persistent favorites, compare state, and server-side search, set up Supabase and run the migrations in order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_search.sql`
3. `supabase/migrations/0003_storage.sql`
4. `supabase/migrations/0004_waitlist_guard.sql`

Then enable anonymous sign-in in Supabase and run:

```sh
npm run seed
npm run upload:logos
```

This loads the catalog into the database and syncs tool logos into storage.

## Scripts

```sh
npm run dev            # start the Vite dev server
npm run build          # build the production bundle
npm run preview        # preview the built app locally
npm run lint           # run Oxlint
npm test               # validate catalog and utility logic
npm run seed           # sync src/data into Supabase
npm run upload:logos   # upload tool logos to Supabase Storage
npm run sitemap        # generate sitemap.xml and robots.txt
```

## App structure

### Routes

| Path | Page |
| --- | --- |
| `/` | Home page |
| `/tools` | Explore tools |
| `/tools/:slug` | Tool detail |
| `/categories` | All categories |
| `/categories/:slug` | Category-specific tools |
| `/saved` | Saved tools |
| `/compare` | Compare up to three tools |
| `/about` | About the project |
| `/submit` | Tool submission waitlist |
| `*` | 404 |

### Data model

The catalog source of truth lives in `src/data/tools.js`. Categories live in `src/data/categories.js`.

Each tool record includes:

- name
- description
- pricing model
- website URL
- category assignments
- use cases
- tags
- source references
- verification metadata

This keeps the directory maintainable and easy to extend without losing structure.

## Adding a tool

Use the `makeTool` helper to create a tool entry in `src/data/tools.js`, then run the seed process so Supabase reflects the latest catalog.

Recommended fields:

- unique `id`
- `name`
- concise `description`
- official `websiteUrl`
- supported `pricingModel`
- one or more matching categories
- relevant `useCases`, `tags`, and `features`
- source URL and pricing references when available
- `featured: true` only for intentionally curated picks

The validation utility in `src/utils/validateTools.js` checks catalog data and surfaces warnings/errors before the app uses it.

## Tool logos

Tool logos are stored in the Supabase `tool-logos` bucket and synced through the `upload:logos` script. If a source image is missing, the app falls back to a vendor favicon or category icon.

## Deployment

This app works as a static frontend on most hosting platforms with SPA rewrite support, such as Vercel.

Set the environment variables for the host and build the site:

```sh
npm run build
```

Then configure rewrite rules so all routes resolve to `index.html`.

## License

This project is currently configured for local use and extension in a personal or prototype environment. Add your preferred license before public deployment.

## Summary

This directory is meant to make AI tool discovery feel less like endless scrolling and more like finding the right solution for a real task. It is practical, browsing-first, and designed to help people move from “What tool should I use?” to “I found something useful for this exact job.”
