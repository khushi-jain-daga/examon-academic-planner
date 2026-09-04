# Examon Academic Planner V5

A browser-based academic operations and study-plan generation tool for Examon Education.

## Current V5 features

- Premium Study Plan PDF / Print view
  - branded cover
  - KPI overview
  - faculty workload
  - category-wise module roadmap
  - polished date-wise schedule tables
  - page numbering and academic notes
- Light operational UI with navy sidebar
- Create Study Plan workflow
- Faculty ↔ Subject association via Subject Master
- Subject priority, tracks, timings, class counts and duration controls
- Monday–Friday scheduling by default
- Saturday/Sunday available only through explicit rescheduling
- Rolling Batch import workflow, e.g. SSC JE 1.0 → SSC JE 2.0
  - copies the previous batch structure
  - moves already-completed subjects later in the new track
  - keeps ongoing/upcoming subjects earlier
  - still allows add/delete/edit before generation
- Calendar exports
  - full calendar CSV
  - daily CSV
  - daily print / Save as PDF
- Browser localStorage persistence
- JSON backup/import-export

## Run locally

The repository uses compressed runtime bundles so it must be served over HTTP rather than opened directly with `file://`.

```bash
npm run dev
```

Then open the local address shown in the terminal, normally `http://localhost:5173`.

You can also use any static server, for example:

```bash
npx serve .
```

## Deploy to Vercel

This repository includes `vercel.json` and can be deployed as a static project on Vercel.

The main runtime files are:

- `index.html` — app entry
- `loader.js` — loads and decompresses the runtime bundles in the browser
- `app.js.gz` — V5 application logic
- `styles.css.gz` — V5 styles
- `assets/examon-logo.webp` — Examon branding asset

## Data note

Operational data is stored in browser `localStorage`. Export a JSON backup before clearing browser data or moving to another device.

## Main workflow

1. Maintain Faculty and Subject associations.
2. Create a new study plan or start a Rolling Batch from a previous batch.
3. Set classes, priority, track, timing and duration.
4. Generate the schedule.
5. Review/edit sessions and weekend exceptions.
6. Export daily/full calendar data or print the premium study plan as PDF.
