# Examon Academic Planner

A browser-based academic operations and study-plan planning system built for **Examon Education**.

It is designed for teams that launch new exam batches frequently and need a faster way to plan classes, reuse previous batch structures, manage faculty-subject mapping, generate schedules, and create professional study-plan PDFs.

## Live Site

**[Open Examon Academic Planner](https://examon-academic-planner.vercel.app)**

## Why this project exists

Academic teams often recreate the same study-plan structure every time a new batch is launched. The syllabus may remain almost identical, but dates, priorities, faculty availability, class timing, and subject sequence keep changing.

Examon Academic Planner reduces that repeated work by turning the planning process into a reusable academic operations workflow.

A previous batch such as **SSC JE Foundation 1.0** can be used as the base for **SSC JE Foundation 2.0**, while still allowing the academic team to change classes, priorities, timings, tracks, and subject order before generating the new schedule.

## Core Features

### Study Plan Builder

- Create Foundation, Crash Course, Question Practice, Revision, and other academic plans
- Configure exam name, batch name, branch, start date, exam date, and content type
- Select faculty once at batch level
- Select subjects using faculty-subject associations from the Subject Master
- Set class count, priority, track, timing, duration, and custom start date
- Run multiple academic tracks in parallel

### Faculty ↔ Subject Association

Faculty assignment is maintained centrally instead of selecting faculty repeatedly for every subject.

For example:

- Engineering Mechanics → assigned Mechanical faculty
- Fluid Mechanics → assigned Mechanical faculty
- History / Polity / Geography → assigned Non-Technical faculty
- English → assigned English faculty

This makes new batch creation significantly faster and keeps faculty allocation consistent.

### Rolling Batch Workflow

Built for frequent batch relaunches such as:

`Foundation 1.0 → Foundation 2.0 → Foundation 3.0`

When importing a previous batch:

- syllabus structure is reused
- faculty associations are retained
- class counts and timings can be reused
- completed subjects can be pushed later in the new batch sequence
- ongoing and upcoming subjects remain earlier
- subjects can still be added, removed, reordered, or edited before generation

This is useful when a new batch is launched every few weeks but the academic syllabus remains largely unchanged.

### Scheduling Engine

- Monday–Friday scheduling by default
- Saturday and Sunday remain off automatically
- Weekend classes can still be added through explicit rescheduling
- Priority controls subject sequence within a track
- Different tracks can run in parallel
- Supports fixed and custom start dates
- Faculty timing conflicts are detected across active batches

### Calendar & Daily Operations

- Master academic calendar across all batches
- Date-wise class listing
- Faculty, subject, batch, category, and timing visibility
- Export complete calendar as CSV
- Export individual days as CSV
- Print / Save daily schedule as PDF

### Professional Study Plan PDF

The generated print view is designed as a shareable academic document rather than a plain browser table.

It includes:

- branded cover page
- batch and exam details
- total classes, modules, active dates, and faculty summary
- academic overview and KPI cards
- faculty workload section
- category-wise module roadmap
- subject, track, priority, class count, time, and date ranges
- polished date-wise schedule tables
- academic notes and operational guidelines
- Examon branding throughout

### Study Plan Management

- Save multiple study plans
- Review batch details and generated sessions
- Edit class dates and timings
- Reschedule individual sessions
- Shift remaining module classes when required
- Archive older plans
- Reuse previous plans for new batch launches

### Data Backup

The current implementation stores planning data in browser `localStorage`.

Available controls include:

- JSON data export
- JSON data import
- browser-based persistence
- reset / backup options

> For team-wide production usage, the next natural upgrade is shared cloud persistence with authentication and role-based access.

## Main Workflow

1. Maintain faculty and subject associations.
2. Create a new batch or import an existing study plan.
3. Select faculty available for the batch.
4. Select associated subjects.
5. Enter classes, timings, priorities, tracks, and durations.
6. Generate the schedule.
7. Review date-wise classes and conflicts.
8. Reschedule individual sessions when required.
9. Export daily calendar data.
10. Print or save the professional study plan as PDF.

## Project Structure

```text
examon-academic-planner/
├── index.html
├── loader.js
├── chunks/
│   ├── app-1.txt
│   ├── app-2.txt
│   ├── app-3.txt
│   ├── styles-1.txt
│   ├── styles-2.txt
│   └── styles-3.txt
├── assets/
│   └── examon-logo.webp
├── package.json
├── vercel.json
└── README.md
```

The application is intentionally lightweight and does not require a complex build pipeline for the current deployment.

## Run Locally

Clone the repository:

```bash
git clone https://github.com/khushi-jain-daga/examon-academic-planner.git
cd examon-academic-planner
```

Start a local static server:

```bash
npm run dev
```

Then open the local address shown in the terminal, normally:

```text
http://localhost:5173
```

You can also use:

```bash
npx serve .
```

## Deployment

The project is deployed on Vercel and connected to the repository's main branch.

**Production:** [https://examon-academic-planner.vercel.app](https://examon-academic-planner.vercel.app)

## Planned Advanced Improvements

The project can be extended into a complete Academic Operations Console with:

- partial subject carry-forward between batches
- drag-and-drop subject priority planning
- Gantt / timeline view
- faculty workload heatmap
- smart conflict-resolution suggestions
- bulk subject editing
- batch-to-batch comparison
- batch progress tracking
- version history and approval workflow
- shared database and authentication
- role-based access for academic, faculty, and operations teams

## Built For

**Examon Education** — academic planning, faculty coordination, recurring batch launches, and study-plan operations.
