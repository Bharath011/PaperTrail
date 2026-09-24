# PaperTrail

**Read. Track. Reflect.**

PaperTrail is a focused personal research-paper library and literature-survey tracker. It preserves the spreadsheet's tab-based organization and adds reading states, research notes, search, filters, and weekly focus planning.

## Features

- Home library with a persistent **Papers in focus this week** reading queue
- One shared link for a live library and weekly focus list
- Seven spreadsheet-derived collections with 67 initial paper/resource records
- A dedicated People to Follow directory with persistent add, edit, link, notes, type, and delete controls
- Three-state workflow: **To Read**, **Reading**, and **Completed**
- Instant status changes from the library table
- Clickable paper titles that open linked PDFs and source pages directly
- Paper detail drawer with remarks, key takeaways, limitations, ideas/connections, and tags
- Add, edit, open, and confirmed-delete actions
- Duplicate warnings based on normalized title or URL
- Search across title, authors, venue, category, notes, and tags
- Year filters and sorting by recency, title, publication year, or status
- Responsive navigation and layouts for desktop, tablet, and mobile
- Shared D1 storage for papers, notes, statuses, weekly focus, and researchers
- Automatic refresh so changes made by one viewer appear for everyone within seconds
- Persistent Sage, Sage night, and Ink theme choices

## Spreadsheet audit

The source workbook currently contains these tabs:

1. Reasoning
2. Latent Reasoning
3. Taxonmy of Reasoning Models
4. Distillation+ Reasoning
5. Basic Papers
6. Interpretability
7. People to Follow

The five paper-oriented tabs contribute 67 initial records. The taxonomy tab remains visible as a collection, while People to Follow has a dedicated researcher-directory presentation with names, affiliations, and profile links extracted from spreadsheet hyperlinks.

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
printf 'PAPERTRAIL_EDITOR_KEY=%s\n' "$(openssl rand -hex 32)" > .dev.vars
npm run db:local
npm run dev
```

Open `http://localhost:3000`.

For a clean database, apply the SQL files in `drizzle/` in filename order. The included local configuration uses `.wrangler/state` for project-local development data.

## Spreadsheet import

PaperTrail does not query Google Sheets on page load. The public GitHub Pages site reads one Cloudflare D1 library through the PaperTrail API Worker. **Copy site link** always copies the same URL; it does not create a snapshot. PaperTrail checks for updates every ten seconds, so everyone sees the current weekly focus and library. Visitors can browse the library; changes require the private editor key. The first editor session imports that browser’s previous PaperTrail data once into the shared database.

To refresh the initial seed from the source sheet:

1. Download the workbook as `literature-source.xlsx` in the project root.
2. Run:

```bash
python scripts/import_sheet.py
```

This rewrites `db/seed-papers.ts` and `db/seed-researchers.ts`. The downloaded workbook is ignored by Git. Re-importing changes the seed used for a new empty database; it does not overwrite an existing working library.

## Development commands

```bash
npm run dev          # start the local app
npm run db:generate  # generate migrations from the schema
npm run db:local     # apply local migrations
npm run db:remote    # apply migrations to the shared Cloudflare database
npm run lint         # run static checks
npm run build        # create the production build
npm run deploy:api   # migrate and deploy the shared API Worker
npm test             # build and run rendered-output tests
```

## Environment variables

No Cloudflare account is required for local development. The local app uses a project-local D1 database under `.wrangler/state`; its editor key is `papertrail-local-editor` from the ignored `.dev.vars` file.

## Project structure

```text
app/
  api/               Paper and researcher CRUD with duplicate detection
  components/        Sidebar, library, weekly focus, directories, and drawers
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

The public interface remains at the existing GitHub Pages URL. A small Cloudflare Worker serves its shared D1 API. Set up the Worker once:

```bash
npx wrangler login
npx wrangler d1 create papertrail-shared
```

Copy the new database ID from Wrangler’s output into the existing `DB` entry in `wrangler.jsonc`, replacing the all-zero `database_id`. Then deploy the API and set its editor key. On first deploy, Wrangler prompts you to register a `workers.dev` subdomain for the API; the public Pages link stays the same:

```bash
npm run deploy:api
npx wrangler secret put PAPERTRAIL_EDITOR_KEY
```

Use a unique editor key and keep it private. The Pages workflow is wired to the deployed API endpoint. To enable automatic API deployments on future pushes, add the Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, then the Actions variable `ENABLE_CLOUDFLARE_DEPLOY=true`. The Cloudflare API token needs permission to deploy Workers and manage D1. The shared link remains `https://bharath011.github.io/PaperTrail/`.

After deployment, open the owner access page by adding `?owner=1` to the Pages URL and enter the editor key once. This imports any existing browser library, including weekly focus, into the shared database. Use the regular Pages URL without `?owner=1` as the link to share. Visitors can view the live library but cannot edit it without the editor key. The library is public, so do not put sensitive or private research notes in it. The owner page is also available with **Ctrl+Shift+E** (or **⌘+Shift+E** on Mac).

Do not commit `.env` files, credentials, the downloaded workbook, or local `.wrangler` state.

## Screenshots

Add desktop library, researcher-directory, and mobile screenshots here after visual review.
