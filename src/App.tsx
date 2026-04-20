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
import { useAuthStore } from "@/store/useAuthStore";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="trucks" element={<TrucksPage />} />
          <Route path="salaries" element={<SalariesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="consulting" element={<ConsultingPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
