# Force Systems — CLAUDE.md

Client follow-up dashboard for Avi Shah. It replaces the manual "Follow-up
Required" spreadsheet. React + Vite, no backend, data persists in localStorage.

## Dev

```bash
npm run dev      # http://localhost:5173
npm run build    # output to dist/
npm run preview  # preview the production build
```

Add the exact lint / test / typecheck commands here as soon as they exist — do
not guess them.

## Architecture rules

- Keep all client state in `useClients` (`src/hooks/useClients.js`). Pass data and
  callbacks down via props. Do not add React context or a state library.
- Do not add a backend, API calls, or an external database. Persistence is
  localStorage only.
- Use plain CSS co-located with each component. Do not add Tailwind, MUI, or any
  other UI library.
- Generate IDs with `crypto.randomUUID()`. Store all dates as ISO 8601 strings.

## Data model — IMPORTANT

Clients are a JSON array in localStorage under the key `force_systems_clients`.
Each client object:

```js
{
  id,                  // string, crypto.randomUUID()
  createdAt,           // string, ISO 8601
  name,                // required — client / project name
  company, email, phone, // optional strings

  status,              // 'active' | 'pending' | 'closed'  (sales/pipeline state)

  // follow-up workflow — these mirror the old spreadsheet columns:
  paymentDue,          // string — money owed or payment note, '' if none
  onboardingFormDone,  // boolean
  photosReceived,      // boolean
  gmbStatus,           // 'na' | 'waiting' | 'needs-page' | 'verifying' | 'verified'
  domainStatus,        // 'na' | 'waiting' | 'need-access' | 'received'
  nextCheckIn,         // ISO date string — drives the follow-up queue
  action,              // free-text next step (e.g. "send new payment link")
  qrMarketingGiven,    // boolean — only relevant once the build is finished
  notes,               // free-text
}
```

YOU MUST migrate existing localStorage records whenever you change this shape:
read the stored array, fill missing fields with defaults, write it back. Never
ship a schema change that drops or orphans saved client data — there is no
backup.

## Status enums — keep in sync

- `status` values must match the keys in `STATUS_COLORS` (`ClientList.jsx`) and
  the `StatCard` accent classes (`--green` / `--yellow` / `--gray` in `App.css`).
  Adding a status means updating all three.
- `gmbStatus` and `domainStatus` use only the exact strings listed above. Do not
  reintroduce free-text status values — the dashboard exists to replace the
  spreadsheet's messy free text.

## Follow-up queue

`nextCheckIn` is load-bearing. The main view sorts clients by `nextCheckIn`
ascending; a client whose date is today or earlier is "due". Treat this as the
core feature of the tool.

## File structure

```
src/
├── components/  ClientList, ClientModal, StatCard  (.jsx + co-located .css)
├── hooks/       useClients.js — all client CRUD + localStorage sync
├── utils/       format.js — formatDate helper
├── App.jsx / App.css        — root layout, header, search/filter, stats
├── index.css                — global reset + base styles + dark theme
└── main.jsx                 — React DOM entry point
```

## Gotchas

- localStorage is per-browser and per-device. There is no sync and no server
  backup. Warn before any change that could clear or overwrite the stored array.
- Status accent colors live in two places (`STATUS_COLORS` inline + `StatCard`
  CSS modifiers). They drift apart easily — change both.

<!-- Maintainer note: sales scripts, GBP and website SOPs live in the project docs, not here, by design (see CLAUDE.md guidance: exclude business context). -->
