import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import {
  Briefcase,
  Truck,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CalendarDays,
  Clock,
  MapPin,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export function OverviewPage() {
  const { t } = useTranslation();
  const { jobs, trucks, employees, analyticsData, meetings, fetchAllData, loading, clearError, error } = useAppStore();

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const activeJobs = jobs.filter((j) => j.status === "in_progress").length;
  const availableTrucks = trucks.filter((t) => t.status === "available").length;
  const totalRevenue = analyticsData.reduce((s, d) => s + d.revenue, 0);
  const totalProfit = analyticsData.reduce((s, d) => s + d.profit, 0);
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  const kpis = [
    {
      title: t("overview.activeJobs"),
      value: activeJobs.toString(),
      subtitle: `${jobs.length} ${t("overview.total")}`,
      icon: Briefcase,
      trend: t("overview.thisMonth"),
      trendUp: true,
      color: "text-steel",
      bg: "bg-steel/10",
    },
    {
      title: t("overview.totalRevenue"),
      value: `$${(totalRevenue / 1_000_000).toFixed(1)}M`,
      subtitle: t("overview.last7Months"),
      icon: DollarSign,
      trend: "+14.2%",
      trendUp: true,
      color: "text-hunter",
      bg: "bg-hunter/10",
    },
    {
      title: t("overview.fleetStatus"),
      value: `${availableTrucks}/${trucks.length}`,
      subtitle: t("overview.available"),
      icon: Truck,
      trend: `${trucks.filter((t) => t.status === "maintenance").length} ${t("overview.inMaintenance")}`,
      trendUp: false,
      color: "text-amber",
      bg: "bg-amber/10",
    },
    {
      title: t("overview.profitMargin"),
      value: `${profitMargin}%`,
      subtitle: `${employees.length} ${t("overview.employees")}`,
      icon: TrendingUp,
      trend: "+3.1%",
      trendUp: true,
      color: "text-steel",
      bg: "bg-steel/10",
    },
  ];

  const revenueChartConfig = {
    revenue: { label: t("analytics.revenue"), color: "var(--color-chart-1)" },
    expenses: { label: t("analytics.expenses"), color: "var(--color-chart-5)" },
    profit: { label: t("analytics.profit"), color: "var(--color-chart-2)" },
  };

  const jobsChartConfig = {
    jobsCompleted: { label: t("overview.jobsCompleted"), color: "var(--color-chart-1)" },
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: t("jobs.pending"),
      in_progress: t("jobs.inProgress"),
      completed: t("jobs.completed"),
      on_hold: t("jobs.onHold"),
      cancelled: t("jobs.cancelled"),
    };
    return map[status] || status;
  };

  const truckStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      available: t("trucks.available"),
      in_use: t("trucks.inUse"),
      maintenance: t("trucks.maintenance"),
      out_of_service: t("trucks.outOfService"),
    };
    return map[status] || status;
  };

  if (loading.jobs || loading.trucks || loading.employees) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <Skeleton className="w-10 h-10 rounded-lg mb-3" />
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid lg:grid-cols-7 gap-6">
          <Card className="lg:col-span-4 animate-pulse">
            <CardContent className="h-[320px]" />
          </Card>
          <Card className="lg:col-span-3 animate-pulse">
            <CardContent className="h-[320px]" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="heading-lg text-foreground">{t("overview.welcome")}</h2>
            <p className="text-muted-foreground">{t("overview.subtitle")}</p>
          </div>
          {error && (
            <Button variant="destructive" size="sm" className="gap-2" onClick={fetchAllData}>
              <AlertCircle className="w-4 h-4" />
              Ongera Ugerageze
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.title} custom={i} initial="hidden" animate="visible" variants={fadeIn}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${kpi.trendUp ? "text-hunter" : "text-amber"}`}>
                    {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {kpi.trend}
                  </div>
                </div>
                <div className="heading-lg text-foreground">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{kpi.subtitle}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-7 gap-6">
        <motion.div className="lg:col-span-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="heading-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-steel" />
                {t("overview.revenueVsExpenses")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueChartConfig} className="w-full h-[280px]">
                <AreaChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v / 1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="var(--color-chart-5)" fill="var(--color-chart-5)" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="lg:col-span-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="heading-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-steel" />
                {t("overview.jobsCompleted")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={jobsChartConfig} className="w-full h-[280px]">
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="jobsCompleted" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upcoming Meetings */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
        <Card>
          <CardHeader>
            <CardTitle className="heading-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-steel" />
              {t("overview.upcomingMeetings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {meetings
              .filter((m) => m.status === "scheduled" || m.status === "in_progress")
              .slice(0, 3)
              .map((meeting) => (
                <div key={meeting.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className={`w-2 h-2 rounded-full ${meeting.priority === "urgent" ? "bg-iron" : meeting.priority === "important" ? "bg-amber" : "bg-steel"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{meeting.title}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{meeting.date} · {meeting.startTime}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{meeting.location}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] ${meeting.status === "in_progress" ? "bg-amber/10 text-amber" : "bg-steel/10 text-steel"}`}>
                    {meeting.status === "in_progress" ? t("meetings.inProgress") : t("meetings.scheduled")}
                  </Badge>
                </div>
              ))}
            {meetings.filter((m) => m.status === "scheduled" || m.status === "in_progress").length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">{t("overview.noUpcoming")}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="heading-sm">{t("overview.activeJobsList")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobs.filter((j) => j.status === "in_progress").slice(0, 4).map((job) => (
              <div key={job.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className={`w-2 h-2 rounded-full ${job.priority === "critical" ? "bg-iron" : job.priority === "high" ? "bg-amber" : "bg-steel"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{job.title}</div>
                  <div className="text-xs text-muted-foreground">{job.location}</div>
                </div>
                <div className="w-24">
                  <Progress value={job.progress} className="h-1.5" />
                  <div className="text-[10px] text-muted-foreground text-right mt-0.5">{job.progress}%</div>
                </div>
                <Badge variant={job.type === "mining" ? "default" : "secondary"} className="text-[10px]">
                  {job.type === "mining" ? t("jobs.mining") : t("jobs.construction")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="heading-sm">{t("overview.fleetOverview")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trucks.slice(0, 4).map((truck) => (
              <div key={truck.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <Truck className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{truck.name}</div>
                  <div className="text-xs text-muted-foreground">{truck.plateNumber} · {truck.driver}</div>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${
                    truck.status === "available"
                      ? "bg-hunter/10 text-hunter"
                      : truck.status === "in_use"
                      ? "bg-steel/10 text-steel"
                      : "bg-amber/10 text-amber"
                  }`}
                >
                  {truckStatusLabel(truck.status)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
