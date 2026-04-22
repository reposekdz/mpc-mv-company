# MPC-MV Company Deployment Fix Task
## Approved Plan Steps

### 1. Create vercel.json for Frontend Static Deploy (Vercel)
- Add vercel.json to root with build/output settings for Vite.

### 2. Loosen TS Configs to Fix Build Errors
- Update tsconfig.app.json: disable strict unused checks.

### 3. Test Local Build
- Run `npm run build` and verify dist/.

### 4. Deploy Backend to Render
- Use render.yaml (already set).

### 5. Update Frontend API URL
- Point src/lib/api.ts to Render backend URL.

### 6. Deploy Frontend to Vercel
- Push and deploy.

### 7. Verify Full Stack
- Test app end-to-end.

**Progress: 3/7 complete (build script fix + local test pending)**

