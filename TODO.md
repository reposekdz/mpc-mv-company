# MPC-MV Company App - Real Data & Functionality Implementation Plan

## Overview
Remove mocks, integrate real backend/DB data, remove GPS, add EmployeesPage, enhance features.

## Steps (Approved Plan Breakdown)

### 1. Backend Setup & Verify ✅ [AI Complete when done]
- [ ] cd backend && npm install
- [ ] node database/migrate.js
- [ ] mysql < database/schema.sql (or node migrate)
- [ ] node database/seed.sql
- [ ] npm start (port 5000)
- [ ] Test: curl http://localhost:5000/api/health
- [ ] Test: curl http://localhost:5000/api/trucks (see 8 seeded trucks)

### 2. Frontend Core Fixes [High Priority]
- ✅ Update TrucksPage.tsx: Remove GPS/map/socket/mock, add fetchTrucks useEffect, fix data fields
- [ ] Update ReportsPage.tsx: Add fetchReports useEffect
- [ ] Update MeetingsPage.tsx: Add fetchMeetings useEffect  
- [ ] Update SalariesPage.tsx: Add fetchEmployees, map to salaries view
- ✅ Update DashboardLayout.tsx: fetchAllData on mount, auth check

### 3. Create Missing Pages
- ✅ Create EmployeesPage.tsx: Full CRUD employees

### 4. Advanced Features [After core]
- [ ] Pagination/filters in all lists (API params)
- [ ] Reports: Uploads/PDF export
- [ ] Trucks: Stats/maintenance alerts
- [ ] Salaries: Bulk payroll button
- [ ] Charts in Analytics/Overview (recharts)

### 5. Testing & Polish
- [ ] Test login: admin@mocmv.com / admin123 (manager role)
- [ ] Verify CRUD on trucks/reports/etc.
- [ ] Error/loading states
- [ ] attempt_completion

**Progress: 0/20** Current: Backend setup ready. Next: TrucksPage cleanup.

**Updated:** Mark [✅] when AI completes step.

