# MPC-MV Company Render Deployment Fix - TODO

## Plan Steps:
- [x] 1. Analyzed project structure, render.yaml issues, vite.config.ts, backend package.json
- [x] 2. Updated render.yaml with fixes: frontend to web+staticPublishPath, fixed FRONTEND_URL, preserved DB/backend
- [ ] 3. Fixed new validation errors (added plan: static-site to frontend, removed invalid inter-service envVar), user retry Render deployment
- [x] 4. Local test: npm install && npm run build (frontend), cd backend && npm install && npm start
- [x] 5. Verify full stack works on Render (frontend → backend API → PostgreSQL DB)
