import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { LandingPage } from "@/components/landing/LandingPage";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OverviewPage } from "@/components/dashboard/OverviewPage";
import { JobsPage } from "@/components/dashboard/JobsPage";
import { TrucksPage } from "@/components/dashboard/TrucksPage";
import { SalariesPage } from "@/components/dashboard/SalariesPage";
import { ReportsPage } from "@/components/dashboard/ReportsPage";
import { AnalyticsPage } from "@/components/dashboard/AnalyticsPage";
import { ConsultingPage } from "@/components/dashboard/ConsultingPage";
import { MeetingsPage } from "@/components/dashboard/MeetingsPage";
import { useAuthStore } from "@/store/useAuthStore";

function ProtectedRoute({ children, requireManager = true }: { children: React.ReactNode; requireManager?: boolean }) {
  const { isAuthenticated, user, isManager } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (requireManager && !isManager()) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter key="router">
      {[
        <Routes key="app-routes">
          <Route key="home" path="/" element={<LandingPage />} />
          <Route
            key="dashboard"
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route key="overview" index element={<OverviewPage />} />
            <Route key="jobs" path="jobs" element={<JobsPage />} />
            <Route key="trucks" path="trucks" element={<TrucksPage />} />
            <Route key="salaries" path="salaries" element={<SalariesPage />} />
            <Route key="reports" path="reports" element={<ReportsPage />} />
            <Route key="analytics" path="analytics" element={<AnalyticsPage />} />
            <Route key="consulting" path="consulting" element={<ConsultingPage />} />
            <Route key="meetings" path="meetings" element={<MeetingsPage />} />
          </Route>
          <Route key="catchall" path="*" element={<Navigate to="/" replace />} />
        </Routes>,
        <Toaster key="toaster" position="top-right" richColors />,
      ]}
    </BrowserRouter>
  );
}

export default App;
