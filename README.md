# todo-web

Next.js frontend for a local full-stack todo app. The UI runs in the browser and calls the separate [todo-api](https://github.com/tyler-intern/todo-api) REST service.

**Default URL:** `http://localhost:3000`

## Prerequisites

- Node.js 18+
- [todo-api](https://github.com/tyler-intern/todo-api) running on `http://localhost:3001`
- PostgreSQL running (used by the API, not this app directly)

## Setup

1. **Clone and enter the repo**

   ```bash
   git clone git@github.com:tyler-intern/todo-web.git
   cd todo-web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Default | Purpose |
   | -------- | ------- | ------- |
   | `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Base URL for API requests |

   The app currently uses `http://localhost:3001` in `fetch()` calls; keep this in sync if you change ports.

## Run

Start the API first, then:

```bash
npm run dev
```

Open **http://localhost:3000**.

Other scripts:

| Command | Purpose |
| ------- | ------- |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |

## Pages

| Route | File | What it does |
| ----- | ---- | -------------- |
| `/` | `app/page.tsx` | Main board: two columns (in progress / completed), create modal, inline edit, delete, drag-and-drop reorder |
| `/todos/[id]` | `app/todos/[id]/page.tsx` | Detail view: edit description, notes, due date; save via PATCH |

Both pages are **Client Components** (`'use client'`) and talk to the API with `fetch()`.

## Features

- List, create, update, and delete todos
- Mark complete via checkbox or drag between columns
- Drag-and-drop reorder (`PUT /todos/reorder` on the API)
- Detail page for longer fields (notes, description)

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- `@hello-pangea/dnd` for drag-and-drop
- Tailwind CSS (global styles in `app/globals.css`)

## Related repo

- **[todo-api](https://github.com/tyler-intern/todo-api)** — Go REST API + `schema.sql` (port `3001`)

## Project layout

```
todo-web/
├── app/
│   ├── page.tsx              # Home / todo board
│   ├── todos/[id]/page.tsx   # Todo detail
│   ├── layout.tsx
│   └── globals.css
├── public/
├── package.json
├── .env.example
└── README.md
```

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| Network errors to `:3001` | Start todo-api; confirm `curl http://localhost:3001/health` works |
| CORS errors in browser console | API must allow origin `http://localhost:3000` |
| Empty list after create | Check API logs and Postgres connection |
