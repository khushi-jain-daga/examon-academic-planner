# Examon Academic Planner V5

A self-contained browser-based academic operations tool for Examon Education.

## What this version includes

- **Premium Study Plan PDF** (print / Save as PDF)
  - Branded premium cover page (batch, exam, type, branch, date range)
  - Executive KPI overview (classes, active dates, modules, faculty, technical/non-tech/theory/practice)
  - Faculty allocation & workload bars
  - Category-wise module roadmap cards (faculty, classes, priority, track, timing, date span)
  - Improved date-wise schedule pages (clean table hierarchy, zebra rows, category chips, repeating header/footer, page numbering)
  - Academic notes / closing page
  - A4 print CSS with `print-color-adjust: exact`
- Lighter operational UI (navy sidebar + light workspace)
- Create Study Plan wizard
- Rolling Batch import workflow (e.g. SSC JE 1.0 → SSC JE 2.0)
  - Import the previous plan structure
  - Automatically move subjects completed before the new batch start date to the end of the track
  - Keep ongoing/upcoming subjects earlier
  - Change/delete/add subjects, classes, timings, priority and tracks before generation
- Faculty ↔ Subject association via Subject Master
- Monday–Friday scheduling by default
- Saturday/Sunday only through explicit manual/reschedule use
- Calendar exports: full CSV + per-day CSV + per-day print/PDF
- Local browser persistence and JSON backup import/export

## Run locally

This is a static app. No build step is required.

1. Download or clone this repository.
2. Open `index.html` in a modern browser.

For a local web server (recommended for development), run:

```bash
npx serve .
```

## Deploy

The included `vercel.json` is configured for static deployment on Vercel.

## Important note about local data

The app stores operational data in browser `localStorage`. Use the JSON backup/export feature before clearing browser storage or moving to another machine.

## Main workflow

1. Maintain faculty and subject associations.
2. Create a new study plan or import a previous batch as a rolling batch.
3. Enter class counts, priorities, tracks and timings.
4. Generate the schedule.
5. Review/edit sessions and exceptions.
6. Export calendar/day schedules or print the premium study plan as PDF.
