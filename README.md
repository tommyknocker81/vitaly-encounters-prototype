# Vitaly Encounters Prototype

Interactive prototype of the **Vitaly RSO Patient 360 / Encounters** view, simulating progressive multi-source clinical data loading (FHIR-style) with animated transitions.

All data is mock — a fictional patient, no real endpoints.

## What it demonstrates

- **5 mock sources** with different delays and outcomes: loaded, empty (responded, no records), failed (with retry), and one deliberately slow source (Erasmus MC, 14–24s)
- **Merge-on-arrival**: each source's encounters are inserted into the chronologically sorted list as they arrive
- **Per-source status panel** with animated state transitions (spinner → check / minus / warning), "fetching more…" on pagination, and "Latest 10 of 16 records loaded" for partially fetched sources
- **Server-side pagination**: sources return at most 10 entries per fetch; "Show more (N)" appears only when a source reports more records on the server, and fetches the remainder
- **Deferred reflow**: if the user has scrolled into the page, unsolicited arrivals queue behind a "New entries available" banner instead of disrupting reading; explicitly requested records merge immediately
- **Framer Motion** throughout: card fade+slide entries with `layout` reflow, crossfading status icons, animated banner/button/panel transitions, animated tab underline

Design tokens (colors, Source Sans Pro typography) are pulled from the OpenLine-Vitaly Figma file.

## Run

```bash
npm install
npm run dev
```

Vite serves on http://localhost:5178. Tailwind is loaded via CDN in `index.html` (prototype-only setup).

## Structure

Single self-contained component: [`src/EncountersPrototype.jsx`](src/EncountersPrototype.jsx) — page shell (sidebar, top bar, patient bar with tabs) plus the `EncountersSection` with all simulation logic. Tune the `delayMs` values in `SOURCE_CONFIG` to change the loading rhythm.
