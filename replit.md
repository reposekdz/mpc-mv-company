# MOC-MV Company Ltd

A full-stack company management platform for MOC-MV Company Ltd, built with React 19 + Vite (frontend) and Node.js/Express (backend) with PostgreSQL.

## Architecture

- **Frontend**: React 19 + Vite 8, TailwindCSS v4, shadcn/ui (`@base-ui/react`), React Router, Zustand, i18next (RW/EN/FR)
- **Backend**: Node.js/Express REST API with Socket.io for real-time notifications
- **Database**: Replit built-in PostgreSQL (via `DATABASE_URL` secret)
- **JSX Plugin**: `@vitejs/plugin-react-swc` (SWC-based, fully installed in node_modules)

## Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── dashboard/         # All management pages (Excel-like colored tables)
│   │   │   ├── JobsPage.tsx
│   │   │   ├── TrucksPage.tsx
│   │   │   ├── SalariesPage.tsx
│   │   │   ├── MeetingsPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   └── DashboardLayout.tsx  # With notification bell (Socket.io)
│   │   ├── landing/           # Public landing page
│   │   └── ui/                # Reusable UI components
│   ├── hooks/
│   │   └── useSocket.ts       # Socket.io real-time notifications hook
│   ├── i18n/
│   │   └── locales/rw.ts      # Kinyarwanda translations (default language)
│   ├── lib/api.ts             # API client with auth token handling
│   ├── store/
│   │   └── useAuthStore.ts    # Zustand auth store (JWT + persist)
│   └── jsx-dev-runtime-shim.js # Fixes React 19 + NODE_ENV=production JSX issue
├── backend/
│   ├── src/
│   │   ├── config/db.js       # PostgreSQL pool config
│   │   ├── controllers/       # Route controllers (with Socket.io emit)
│   │   ├── middleware/        # Auth, upload middleware
│   │   ├── routes/            # Express routes
│   │   └── index.js           # Server entry, Socket.io, CORS config
│   └── database/
│       ├── schema.sql         # DB schema
│       └── seed.sql           # Seed data
├── public/                    # Static assets
├── vite.config.ts             # Vite config, SWC plugin, jsx-dev-runtime alias
└── index.html                 # App entry (no hardcoded React Refresh scripts)
```

## Workflows

- **Start application** — `NODE_ENV=development vite` on port 5000 (webview preview)
- **Backend API** — `cd backend && node src/index.js` on port 3001 (console)

## API Routing

- **Development**: Vite dev server (port 5000) proxies `/api/*` to backend (port 3001)
- **Production**: Backend serves both the API (`/api/*`) and the built React app (`dist/`) on a single port

## Deployment

### Replit (single-origin, recommended)
- Build command: `npm run build`
- Run command: `node backend/src/index.js`
- Target: `vm` (required for Socket.io persistent connections)
- Backend serves `dist/` static files and all React routes in production.

### Vercel (frontend) + Render (backend)
- **Render** (`render.yaml` blueprint): provisions `mocmv-backend` web service + `mocmv-db` PostgreSQL.
  - `startCommand` runs `database/migrate.js && node src/index.js` so the schema, seed, and admin password reset are applied on every deploy.
  - `JWT_SECRET` / `JWT_REFRESH_SECRET` are auto-generated. `SEED_DEFAULT_PASSWORD` and `FRONTEND_URL` must be set in the Render dashboard after first deploy.
- **Vercel** (`vercel.json`): builds Vite (`npm run build` → `dist/`) and rewrites `/api/*` and `/socket.io/*` to `https://mocmv-backend.onrender.com`. Update those URLs to match the actual Render service name if it differs.
- The frontend never needs `VITE_API_URL` set on Vercel — the rewrite turns relative `/api/*` calls into the right Render URL. If `VITE_API_URL` is accidentally left pointing at `http://localhost:*`, `src/lib/api.ts` ignores it in production builds (safety net).
- CORS in `backend/src/index.js` auto-allows `*.vercel.app`, `*.onrender.com`, `*.replit.{dev,app}` and `*.repl.co`. Add a custom domain via the `ALLOWED_ORIGINS` env var (comma-separated).

## Environment Variables (Secrets)

All set via Replit Secrets:
- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `JWT_SECRET` — JWT signing secret
- `JWT_REFRESH_SECRET` — JWT refresh token secret
- `NODE_ENV` — `production` (system-level; dev script uses `NODE_ENV=development` prefix)
- `PORT` — `3001` (backend port; set by Replit system)

## Database

Schema covers: users, jobs, trucks, employees, salaries, reports, meetings, consulting_topics, analytics_data, homework, contact_messages, service_requests.

Meetings table has extra columns: `date`, `priority`, `organizer_name`, `notes`, `online_link`.
Reports table has extra columns: `summary`, `content`, `author`, `period_start`, `period_end`.

Default seeded accounts:
- Admin: `admin@mocmv.com` / `Admin@123`
- Manager: `manager@mocmv.com` / `Admin@123`
- Viewer: `viewer@mocmv.com` / `Admin@123`

## Running Database Migrations

```bash
cd backend && node database/migrate.js
```

## Key Features

- **Job & Fleet Management** — Excel-like colored tables with full CRUD and status tracking
- **Salary & Employee Tracking** — Color-coded tables by department
- **Meetings Management** — Online meeting records with notes, virtual links, priority
- **Advanced Reports** — Full reports with content, author, period tracking
- **Real-time Notifications** — Socket.io dashboard notification bell
- **Kinyarwanda Default** — Full translations in RW, EN, FR (RW is default)
- **Role-based Access** — admin/manager/viewer roles with JWT auth
- **Analytics Dashboard** — Charts and statistics overview

## Critical Fix: JSX Dev Runtime

The Replit environment sets `NODE_ENV=production` globally. React 19's `jsx-dev-runtime` exports `jsxDEV = undefined` in production mode, breaking Vite's SWC React plugin.

Fix applied:
1. `src/jsx-dev-runtime-shim.js` — Re-exports `jsxDEV` using `react/jsx-runtime`'s `jsx` function (which works in all modes)
2. `vite.config.ts` resolve alias — Redirects all `react/jsx-dev-runtime` imports to the shim
3. `package.json` dev script — `NODE_ENV=development vite` to ensure proper dev behavior
4. `index.html` — Removed hardcoded `/@react-refresh` scripts (injected by plugin automatically)
