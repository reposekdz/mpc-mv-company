# MOC-MV Company Ltd

A full-stack company management platform for MOC-MV Company Ltd, built with React + Vite (frontend) and Node.js/Express (backend) with PostgreSQL.

## Architecture

- **Frontend**: React 19 + Vite 8, TailwindCSS v4, shadcn/ui, React Router, Zustand, i18next (EN/FR)
- **Backend**: Node.js/Express REST API with Socket.io for real-time features
- **Database**: Replit built-in PostgreSQL (via `DATABASE_URL` secret)

## Project Structure

```
/
├── src/                    # React frontend source
│   ├── components/         # UI components (shadcn/ui based)
│   ├── hooks/             # Custom React hooks
│   ├── i18n/              # Translations (EN/FR)
│   ├── lib/               # API client, utilities
│   ├── store/             # Zustand state stores
│   └── types/             # TypeScript types
├── backend/
│   ├── src/
│   │   ├── config/db.js   # PostgreSQL pool config
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Auth, upload middleware
│   │   ├── routes/        # Express routes
│   │   └── index.js       # Server entry point
│   └── database/
│       ├── schema.sql     # DB schema (run via migrate.js)
│       └── seed.sql       # Seed data
├── public/                # Static assets
├── vite.config.ts         # Vite config with proxy to backend
└── index.html             # App entry HTML
```

## Workflows

- **Start application** — Vite dev server on port 5000 (webview)
- **Backend API** — Express API server on port 3001 (console)

## API Routing

The Vite dev server proxies all `/api/*` requests to `http://localhost:3001`. In production, set `VITE_API_URL` or configure a reverse proxy.

## Environment Variables (Secrets)

All set via Replit Secrets:
- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `JWT_SECRET` — JWT signing secret (auto-generated during migration)
- `JWT_REFRESH_SECRET` — JWT refresh token secret (auto-generated)
- `NODE_ENV` — `production`
- `PORT` — `3001` (backend port)

## Database

Schema covers: users, jobs, trucks, employees, salaries, reports, meetings, consulting_topics, analytics_data, homework, contact_messages, service_requests.

Default seeded accounts:
- Admin: `admin@mocmv.com` / `admin123`
- Manager: `manager@mocmv.com` / `admin123`
- Viewer: `viewer@mocmv.com` / `admin123`

## Running Database Migrations

```bash
cd backend && node database/migrate.js
```

## Key Features

- Job and fleet management
- Employee and salary tracking
- Reports and analytics dashboard
- Real-time updates via Socket.io
- Role-based access control (admin/manager/viewer)
- Internationalization (EN/FR)
- Contact and service request forms
