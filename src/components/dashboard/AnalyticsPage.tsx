import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Briefcase,
  ArrowUpRight,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export function AnalyticsPage() {
  const { analyticsData, jobs, employees } = useAppStore();

  const totalRevenue = analyticsData.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = analyticsData.reduce((s, d) => s + d.expenses, 0);
  const totalProfit = analyticsData.reduce((s, d) => s + d.profit, 0);
  const totalJobsDone = analyticsData.reduce((s, d) => s + d.jobsCompleted, 0);
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  const kpis = [
    { title: "Total Revenue", value: `$${(totalRevenue / 1_000_000).toFixed(2)}M`, trend: "+14.2%", trendUp: true, icon: DollarSign, color: "text-steel", bg: "bg-steel/10" },
    { title: "Total Expenses", value: `$${(totalExpenses / 1_000_000).toFixed(2)}M`, trend: "+8.7%", trendUp: false, icon: TrendingDown, color: "text-iron", bg: "bg-iron/10" },
    { title: "Net Profit", value: `$${(totalProfit / 1_000_000).toFixed(2)}M`, trend: `${profitMargin}% margin`, trendUp: true, icon: TrendingUp, color: "text-hunter", bg: "bg-hunter/10" },
    { title: "Jobs Completed", value: totalJobsDone.toString(), trend: `${jobs.length} total`, trendUp: true, icon: Briefcase, color: "text-amber", bg: "bg-amber/10" },
  ];

  const revenueExpenseConfig = {
    revenue: { label: "Revenue", color: "var(--color-chart-1)" },
    expenses: { label: "Expenses", color: "var(--color-chart-3)" },
    profit: { label: "Profit", color: "var(--color-chart-2)" },
  };

  const profitConfig = {
    profit: { label: "Profit", color: "var(--color-chart-2)" },
  };

  const jobsConfig = {
    jobsCompleted: { label: "Jobs Completed", color: "var(--color-chart-1)" },
  };

  // Expense breakdown pie data
  const totalPayroll = employees.reduce((s, e) => s + e.netPay, 0);
  const fuelCost = totalExpenses * 0.22;
  const materialCost = totalExpenses * 0.35;
  const maintenanceCost = totalExpenses * 0.13;
  const otherCost = totalExpenses - totalPayroll - fuelCost - materialCost - maintenanceCost;

  const expenseBreakdown = [
    { name: "Payroll", value: totalPayroll, fill: "var(--color-chart-1)" },
    { name: "Materials", value: Math.round(materialCost), fill: "var(--color-chart-2)" },
    { name: "Fuel", value: Math.round(fuelCost), fill: "var(--color-chart-4)" },
    { name: "Maintenance", value: Math.round(maintenanceCost), fill: "var(--color-chart-5)" },
    { name: "Other", value: Math.round(Math.max(otherCost, 0)), fill: "var(--color-chart-3)" },
  ];

  const pieConfig: Record<string, { label: string; color: string }> = {};
  expenseBreakdown.forEach((item) => {
    pieConfig[item.name.toLowerCase()] = { label: item.name, color: item.fill };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="heading-lg text-foreground">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Financial performance and operational metrics over the last 7 months.</p>
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
                  <div className={`flex items-center gap-1 text-xs font-medium ${kpi.trendUp ? "text-hunter" : "text-iron"}`}>
                    <ArrowUpRight className={`w-3 h-3 ${!kpi.trendUp ? "rotate-90" : ""}`} />
                    {kpi.trend}
                  </div>
                </div>
                <div className="heading-lg text-foreground">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{kpi.title}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue vs Expenses vs Profit Area Chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="heading-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-steel" />
              Revenue vs Expenses vs Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueExpenseConfig} className="w-full h-[320px]">
              <AreaChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="var(--color-chart-3)" fill="var(--color-chart-3)" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Row: Profit Trend + Expense Breakdown */}
      <div className="grid lg:grid-cols-7 gap-6">
        <motion.div className="lg:col-span-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="heading-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-hunter" />
                Monthly Profit Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={profitConfig} className="w-full h-[280px]">
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v / 1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="profit" stroke="var(--color-chart-2)" strokeWidth={2.5} dot={{ fill: "var(--color-chart-2)", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="lg:col-span-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="heading-sm flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-steel" />
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={pieConfig} className="w-full h-[280px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {expenseBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Jobs Completed */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="heading-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-steel" />
              Jobs Completed per Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={jobsConfig} className="w-full h-[260px]">
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

      {/* Summary Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        <Card>
          <CardHeader>
            <CardTitle className="heading-sm">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {analyticsData.map((d) => (
                <div key={d.month} className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{d.month}</span>
                    <Badge variant="secondary" className="text-[10px] bg-steel/10 text-steel">
                      {d.jobsCompleted} jobs
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium text-steel">${(d.revenue / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expenses</span>
                      <span className="font-medium text-iron">${(d.expenses / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit</span>
                      <span className="font-medium text-hunter">${(d.profit / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
