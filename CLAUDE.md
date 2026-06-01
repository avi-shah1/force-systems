# Force Systems — CLAUDE.md

Client tracking dashboard for Avi Shah. React + Vite, no backend. Data persists in localStorage.

## Dev

```bash
npm run dev      # http://localhost:5173
npm run build    # output to dist/
npm run preview  # preview the build locally
```

## File structure

```
src/
├── components/
│   ├── ClientList.jsx / .css   # Client card list + individual card
│   ├── ClientModal.jsx / .css  # Add / Edit modal form
│   └── StatCard.jsx            # Single stat display (Total / Active / Pending / Closed)
├── hooks/
│   └── useClients.js           # All client CRUD logic + localStorage sync
├── utils/
│   └── format.js               # formatDate helper
├── App.jsx / App.css           # Root layout, header, search/filter, stats
├── index.css                   # Global reset and base styles
└── main.jsx                    # React DOM entry point
```

## Data model

Clients are stored as a JSON array in `localStorage` under the key `force_systems_clients`.

Each client object:
```js
{
  id: string,          // crypto.randomUUID()
  createdAt: string,   // ISO 8601
  name: string,        // required
  email?: string,
  phone?: string,
  company?: string,
  status: 'active' | 'pending' | 'closed',
  notes?: string,
}
```

## Key conventions

- All state lives in `useClients` — components receive data and callbacks via props, no context
- No external UI library — plain CSS modules co-located with each component
- Styles use a dark theme defined in `index.css` and `App.css`; accent colors per status are defined inline in `ClientList.jsx` (`STATUS_COLORS`)
- `StatCard` accent variants (`--green`, `--yellow`, `--gray`) are CSS modifier classes in `App.css`
