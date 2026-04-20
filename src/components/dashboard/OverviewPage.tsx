import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/store/useAppStore";
import {
  Briefcase,
  Truck,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
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
  const { jobs, trucks, employees, analyticsData } = useAppStore();

  const activeJobs = jobs.filter((j) => j.status === "in_progress").length;
  const availableTrucks = trucks.filter((t) => t.status === "available").length;
  const totalRevenue = analyticsData.reduce((s, d) => s + d.revenue, 0);
  const totalProfit = analyticsData.reduce((s, d) => s + d.profit, 0);
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  const kpis = [
    {
      title: "Active Jobs",
      value: activeJobs.toString(),
      subtitle: `${jobs.length} total`,
      icon: Briefcase,
      trend: "+2 this month",
      trendUp: true,
      color: "text-steel",
      bg: "bg-steel/10",
    },
    {
      title: "Total Revenue",
      value: `$${(totalRevenue / 1_000_000).toFixed(1)}M`,
      subtitle: "Last 7 months",
      icon: DollarSign,
      trend: "+14.2%",
      trendUp: true,
      color: "text-hunter",
      bg: "bg-hunter/10",
    },
    {
      title: "Fleet Status",
      value: `${availableTrucks}/${trucks.length}`,
      subtitle: "Available",
      icon: Truck,
      trend: `${trucks.filter((t) => t.status === "maintenance").length} in maintenance`,
      trendUp: false,
      color: "text-amber",
      bg: "bg-amber/10",
    },
    {
      title: "Profit Margin",
      value: `${profitMargin}%`,
      subtitle: `${employees.length} employees`,
      icon: TrendingUp,
      trend: "+3.1%",
      trendUp: true,
      color: "text-steel",
      bg: "bg-steel/10",
    },
  ];

  const revenueChartConfig = {
    revenue: { label: "Revenue", color: "var(--color-chart-1)" },
    expenses: { label: "Expenses", color: "var(--color-chart-5)" },
    profit: { label: "Profit", color: "var(--color-chart-2)" },
  };

  const jobsChartConfig = {
    jobsCompleted: { label: "Jobs Completed", color: "var(--color-chart-1)" },
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="heading-lg text-foreground">Welcome back, Manager</h2>
        <p className="text-muted-foreground">Here's your company performance at a glance.</p>
      </motion.div>

      {/* KPI Cards */}
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

      {/* Charts Row */}
      <div className="grid lg:grid-cols-7 gap-6">
        <motion.div className="lg:col-span-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="heading-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-steel" />
                Revenue vs Expenses
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
                Jobs Completed
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

      {/* Recent Jobs & Trucks */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="heading-sm">Active Jobs</CardTitle>
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
                  {job.type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="heading-sm">Fleet Overview</CardTitle>
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
                  {truck.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
