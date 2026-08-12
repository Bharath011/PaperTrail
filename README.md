# PaperTrail

**Read. Track. Reflect.**

PaperTrail is a focused personal research-paper library and literature-survey tracker. It imports a Google Sheets research document into a durable local database, preserves its tab-based organization, and adds reading states, research notes, search, filters, and progress visibility.

## Features

- Home library with a persistent **Papers in focus this week** reading queue
- Seven spreadsheet-derived collections with 67 initial paper/resource records
- Three-state workflow: **To Read**, **Reading**, and **Completed**
- Instant status changes from the library table
- Clickable paper titles that open linked PDFs and source pages directly
- Paper detail drawer with remarks, key takeaways, limitations, ideas/connections, and tags
- Add, edit, open, and confirmed-delete actions
- Duplicate warnings based on normalized title or URL
- Search across title, authors, venue, category, notes, and tags
- Year filters and sorting by recency, title, publication year, or status
- Responsive navigation and layouts for desktop, tablet, and mobile
- Persistent light/dark theme preference
- Cloudflare D1 persistence locally and on Sites

## Spreadsheet audit

The source workbook currently contains these tabs:

1. Reasoning
2. Latent Reasoning
3. Taxonmy of Reasoning Models
4. Distillation+ Reasoning
5. Basic Papers
6. Interpretability
7. People to Follow

The five paper-oriented tabs contribute 67 initial records. The taxonomy and people tabs remain visible as collections so the workbook's information architecture is not flattened or discarded; they currently have no paper records.

The source is semi-structured: URLs and titles appear in different columns between tabs, many rows omit authors or venue, some rows are headings or research resources rather than formal papers, and publication details are often embedded in free-text cells. The importer preserves those extra values as remarks and extracts a four-digit year where available. Missing metadata remains visibly unset rather than being invented.

## Technology

- React 19 and TypeScript
- vinext / Vite application runtime
- Tailwind CSS plus a product-specific CSS design system
- Drizzle ORM
- Cloudflare D1 / local SQLite-compatible development storage
- Cloudflare Sites-ready Worker output

## Requirements

- Node.js 22.13 or newer
- npm
- Python 3 for spreadsheet re-imports

## Local setup

```bash
npm install
npm run db:local
npm run dev
```

Open `http://localhost:3000`.

For a clean database, apply both SQL files in `drizzle/` in filename order. The included local configuration uses `.wrangler/state` for project-local development data.

## Spreadsheet import

PaperTrail does not query Google Sheets on page load. The application database becomes the source of truth after import.

To refresh the initial seed from the source sheet:

1. Download the workbook as `literature-source.xlsx` in the project root.
2. Run:

```bash
python scripts/import_sheet.py
```

This rewrites `db/seed-papers.ts`. The downloaded workbook is ignored by Git. Re-importing changes the seed used for a new empty database; it does not overwrite an existing working library.

## Development commands

```bash
npm run dev          # start the local app
npm run db:generate  # generate migrations from the schema
npm run db:local     # apply local migrations
npm run lint         # run static checks
npm run build        # create the production build
npm test             # build and run rendered-output tests
```

## Environment variables

No secrets are required for local development. Runtime storage bindings are declared in `.openai/hosting.json`; deployment infrastructure supplies the real D1 binding.

## Project structure

```text
app/
  api/papers/        Paper CRUD and duplicate detection
  components/        Dashboard, sidebar, library, and detail drawer
  tracker-client.tsx Main client state and workflows
db/
  schema.ts          Drizzle data model
  seed-papers.ts     Generated spreadsheet seed
drizzle/             Database migrations
scripts/
  import_sheet.py    Workbook-to-seed importer
worker/               Cloudflare Worker entry point
```

## Deployment

The production build targets Cloudflare Sites and includes the D1 migrations automatically:

```bash
npm run build
```

Do not commit `.env` files, credentials, the downloaded workbook, or local `.wrangler` state.

## Screenshots

Add desktop dashboard, library, and mobile screenshots here after visual review.
