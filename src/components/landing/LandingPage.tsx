import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { LoginDialog } from "./LoginDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Mountain,
  HardHat,
  Truck,
  BarChart3,
  Shield,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  FileText,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsApi } from "@/lib/api";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

export function LandingPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getDashboard();
      setDashboardStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
      toast.error("Ntabwo byakunze kubona makuru");
    } finally {
      setLoading(false);
    }
  };

  const systemModules = [
    { icon: Briefcase, title: t("nav.jobs"), description: "Gucunga imirimo yose yo mu kazi, intambwe n'imimerere", count: dashboardStats?.activeJobs || 0, status: "active" },
    { icon: Truck, title: t("nav.trucks"), description: "Kugena ibinyabiziga, gutunganya no kumenya uko bimeze", count: dashboardStats?.totalTrucks || 0, status: "active" },
    { icon: Users, title: t("nav.salaries"), description: "Gucunga abakozi, imishahara, amasanduku n'ibikurwa", count: dashboardStats?.totalEmployees || 0, status: "active" },
    { icon: FileText, title: t("nav.reports"), description: "Kora raporo z'ibikorwa zibanda mu gihe", count: dashboardStats?.totalReports || 0, status: "active" },
    { icon: BarChart3, title: t("nav.analytics"), description: "Isesengura y'imari n'ibipimo by'ubwiza", count: null, status: "live" },
    { icon: Calendar, title: t("nav.meetings"), description: "Guteganya inama, gusukura ibitekerezo n'inyandiko", count: dashboardStats?.upcomingMeetings || 0, status: "scheduled" },
  ];

  const stats = [
    { label: t("landing.activeProjects"), value: dashboardStats?.activeJobs || 24, icon: HardHat, trend: "+12%" },
    { label: t("landing.fleetVehicles"), value: dashboardStats?.totalTrucks || 52, icon: Truck, trend: "85%" },
    { label: t("landing.teamMembers"), value: dashboardStats?.totalEmployees || 187, icon: Users, trend: "+8%" },
    { label: t("analytics.totalRevenue"), value: dashboardStats?.totalRevenue?.toLocaleString() || "38.7M", icon: DollarSign, trend: "+18%" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-steel to-steel-dark flex items-center justify-center">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="heading-md text-foreground tracking-tight">MPC-MV</span>
              <span className="text-xs text-muted-foreground -mt-1">Ikibanza cy'Ubuyobozi</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <LoginDialog />
          </div>
        </div>
      </nav>

      {/* Hero Section - Management Portal Only */}
      <section className="relative pt-24 min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(70, 130, 180, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(70, 130, 180, 0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <motion.div 
              initial="hidden" 
              animate="visible" 
              className="lg:col-span-3 text-white space-y-6"
            >
              <motion.div custom={0} variants={fadeUp}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-steel/20 border border-steel/30 mb-6">
                  <Shield className="w-4 h-4 text-steel-light" />
                  <span className="text-sm font-medium text-steel-light">{t("nav.managementPortal")}</span>
                </div>
              </motion.div>

              <motion.h1 custom={1} variants={fadeUp} className="text-4xl md:text-6xl font-bold leading-tight">
                Ubuyobozi bw'Umugambi
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-steel-light to-blue-300">
                  MPC-MV Company Ltd
                </span>
              </motion.h1>

              <motion.p custom={2} variants={fadeUp} className="text-lg text-gray-300 max-w-2xl leading-relaxed">
                Ikibanza cyo gucunga umugambi wose wa MPC-MV: imirimo, ibinyabiziga, abakozi, imishahara, raporo, inama
                n'ibindi byose byo mu kazi. Ushobora kugena ibintu vyose hamwe.
              </motion.p>

              <motion.div custom={3} variants={fadeUp} className="flex flex-wrap gap-4 pt-4">
                <LoginDialog />
              </motion.div>
            </motion.div>

            <motion.div 
              initial="hidden" 
              animate="visible" 
              className="lg:col-span-2 grid grid-cols-2 gap-4"
            >
              {stats.map((stat, i) => (
                <motion.div key={stat.label} custom={i + 2} variants={fadeUp}>
                  <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <stat.icon className="w-5 h-5 text-steel-light" />
                        <span className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <div className="text-3xl font-bold text-white">{stat.value}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Management Modules Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="mt-20"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl font-semibold text-white mb-2">Ibintu Dushobora Kugena</h2>
              <p className="text-gray-400">Ibice byose byo mu kibanza cy'ubuyobozi</p>
            {error && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">{error}</span>
                <button
                  type="button"
                  className="h-6 px-2 text-xs text-white hover:bg-red-500/20 rounded transition-colors"
                  onClick={loadDashboardData}
                >
                  Ongera Ugerageze
                </button>
              </div>
            )}
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="h-full bg-white/5 border-white/10">
                    <CardContent className="p-5 text-center">
                      <Skeleton className="w-12 h-12 rounded-xl mx-auto mb-3 bg-white/10" />
                      <Skeleton className="h-5 w-20 mx-auto mb-2 bg-white/10" />
                      <Skeleton className="h-3 w-full bg-white/10" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                systemModules.map((module, i) => (
                  <motion.div
                    key={module.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.08 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="transition-transform"
                  >
                    <Card className="h-full bg-white/5 border-white/10 hover:bg-white/10 hover:border-steel/40 transition-all duration-300 group cursor-pointer">
                      <CardContent className="p-5 text-center">
                        <div className="w-12 h-12 rounded-xl bg-steel/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-steel/30 transition-colors">
                          <module.icon className="w-6 h-6 text-steel-light" />
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{module.title}</h3>
                          {module.count !== null && (
                            <Badge variant="secondary" className="h-5 px-1.5 bg-steel/30 text-steel-light text-[10px]">
                              {module.count}
                            </Badge>
                          )}
                          {module.status === "live" && (
                            <Badge variant="secondary" className="h-5 px-1.5 bg-green-500/20 text-green-400 text-[10px] gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                              LIVE
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{module.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-white py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Mountain className="w-5 h-5 text-steel-light" />
              <span className="font-medium">MPC-MV Company Ltd</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2026 MPC-MV Company Ltd. Uburenganzira bwose bwabikiwe.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
