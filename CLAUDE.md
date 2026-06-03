# Force Systems — CLAUDE.md

Client follow-up dashboard for Avi Shah. It replaces the manual "Follow-up
Required" spreadsheet. React + Vite frontend; Supabase backend (in progress —
localStorage is still the active persistence layer while migration is underway).

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
- Use plain CSS co-located with each component. Do not add Tailwind, MUI, or any
  other UI library.
- Generate IDs with `crypto.randomUUID()`. Store all dates as ISO 8601 strings.
- All Supabase access goes through `src/lib/supabase.js` — import `supabase` from
  there; never instantiate a second client elsewhere.

## Data model — IMPORTANT

Clients are a JSON array in localStorage under the key `force_systems_clients`.
Each client object:

```js
{
  id,                  // string, crypto.randomUUID()
  createdAt,           // string, ISO 8601
  updatedAt,           // string, ISO 8601
  name,                // required — client / project name
  company, email, phone, // optional strings

  stage,               // 'active' | 'paused' | 'onboarding' | 'awaiting-form' | 'warm'

  // follow-up workflow — these mirror the old spreadsheet columns:
  paymentDue,          // string — money owed or payment note, '' if none
  onboardingFormDone,  // boolean
  imagesStatus,        // 'awaiting-client' | 'received' | <custom string>
  gmbStatus,           // 'na' | 'waiting-access' | 'needs-page' | 'verifying' | 'verified' | 'access-given' | <custom string>
  domainStatus,        // 'na' | 'waiting-access' | 'access-given' | 'need-to-buy' | <custom string>
  nextCheckIn,         // YYYY-MM-DD date string or null — drives the follow-up queue
  marketingFormSent,   // boolean
  notes,               // free-text — first line shown as summary on card; may contain action text
}
```

YOU MUST migrate existing localStorage records whenever you change this shape:
read the stored array, fill missing fields with defaults, write it back. Never
ship a schema change that drops or orphans saved client data — there is no
backup.

## Stage enums — keep in sync

- `stage` values must match the keys in `STAGE_COLORS` (`ClientList.jsx`) and
  the `StatCard` accent classes in `App.css`. Adding a stage means updating all three.
- `gmbStatus` and `domainStatus` use only the exact strings listed above. Do not
  reintroduce free-text status values — the dashboard exists to replace the
  spreadsheet's messy free text.

## Follow-up queue

`nextCheckIn` is load-bearing. The main view sorts clients by `nextCheckIn`
ascending; a client whose date is today or earlier is "due". Treat this as the
core feature of the tool.

## Supabase — SECURITY RULES (read before touching anything auth/data related)

- **Anon key is intentionally public** — it is safe to ship in browser code and
  is already exposed via `VITE_SUPABASE_ANON_KEY`. It grants only what RLS allows.
- **Never add the `service_role` key anywhere in this repo.** It bypasses RLS and
  has full database access. It must never appear in client code, `.env`, or git history.
- **Security comes from Row Level Security policies on the Supabase side**, not
  from hiding the anon key. Before exposing any table, ensure RLS is enabled and
  policies are in place.
- **Never commit secrets.** `.env` is in `.gitignore`. If you need to document
  which variables are required, use `.env.example` with empty values only.

### Environment variables

| Variable | Where | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` (local only) | Project URL from Supabase dashboard |
| `VITE_SUPABASE_ANON_KEY` | `.env` (local only) | Public anon key — safe in browser |

## File structure

```
src/
├── components/  ClientList, ClientModal, StatCard  (.jsx + co-located .css)
├── hooks/       useClients.js — all client CRUD + localStorage sync
├── lib/         supabase.js — single Supabase client instance
├── utils/       format.js — formatDate helper
├── App.jsx / App.css        — root layout, header, search/filter, stats
├── index.css                — global reset + base styles + dark theme
└── main.jsx                 — React DOM entry point
```

## Gotchas

- localStorage is per-browser and per-device. There is no sync and no server
  backup. Warn before any change that could clear or overwrite the stored array.
- Stage accent colors live in two places (`STAGE_COLORS` inline in `ClientList.jsx` + `StatCard`
  CSS modifiers in `App.css`). They drift apart easily — change both.

<!-- Maintainer note: sales scripts, GBP and website SOPs live in the project docs, not here, by design (see CLAUDE.md guidance: exclude business context). -->
