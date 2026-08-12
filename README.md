# Marginalia

A calm, personal reading desk for a literature survey. Marginalia turns the tabs of a research spreadsheet into browsable collections, with durable reading checklists and remarks for every paper.

## What it includes

- 7 collections imported from the source Google Sheet
- 67 paper and research-resource records
- read/unread checklists and overall progress
- editable remarks, metadata, links, and collections
- full-library search and reading-status filters
- a `+ Add paper` flow that accepts new or existing collection names
- responsive desktop and mobile layouts
- Cloudflare D1-backed persistence

## Local development

The project requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Regenerate the imported seed data after downloading the source workbook as `literature-source.xlsx`:

```bash
python scripts/import_sheet.py
npm run db:generate
```

The downloaded workbook is intentionally ignored by Git; the generated seed data is committed.
