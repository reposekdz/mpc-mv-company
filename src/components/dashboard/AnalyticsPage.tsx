import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Briefcase,
  ArrowUpRight,
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

const PIE_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { analyticsData } = useAppStore();

  const totalRevenue = analyticsData.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = analyticsData.reduce((s, d) => s + d.expenses, 0);
  const totalProfit = analyticsData.reduce((s, d) => s + d.profit, 0);
  const totalJobsDone = analyticsData.reduce((s, d) => s + d.jobsCompleted, 0);
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  const kpis = [
    { title: t("analytics.totalRevenue"), value: `$${(totalRevenue / 1_000_000).toFixed(2)}M`, trend: "+14.2%", trendUp: true, icon: DollarSign, color: "text-steel", bg: "bg-steel/10" },
    { title: t("analytics.totalExpenses"), value: `$${(totalExpenses / 1_000_000).toFixed(2)}M`, trend: "+8.7%", trendUp: false, icon: TrendingDown, color: "text-iron", bg: "bg-iron/10" },
    { title: t("analytics.netProfit"), value: `$${(totalProfit / 1_000_000).toFixed(2)}M`, trend: `${profitMargin}% ${t("analytics.margin")}`, trendUp: true, icon: TrendingUp, color: "text-hunter", bg: "bg-hunter/10" },
    { title: t("analytics.jobsCompleted"), value: totalJobsDone.toString(), trend: `${totalJobsDone} ${t("analytics.jobs")}`, trendUp: true, icon: Briefcase, color: "text-amber", bg: "bg-amber/10" },
  ];

  const revenueChartConfig = {
    revenue: { label: t("analytics.revenue"), color: "var(--color-chart-1)" },
    expenses: { label: t("analytics.expenses"), color: "var(--color-chart-5)" },
    profit: { label: t("analytics.profit"), color: "var(--color-chart-2)" },
  };

  const profitChartConfig = {
    profit: { label: t("analytics.profit"), color: "var(--color-chart-2)" },
  };

  const jobsChartConfig = {
    jobsCompleted: { label: t("analytics.jobsCompleted"), color: "var(--color-chart-1)" },
  };

  const expenseBreakdown = [
    { name: t("analytics.payroll"), value: 42 },
    { name: t("analytics.materials"), value: 25 },
    { name: t("analytics.fuelCost"), value: 15 },
    { name: t("analytics.maintenanceCost"), value: 12 },
    { name: t("analytics.other"), value: 6 },
  ];

  const pieChartConfig = Object.fromEntries(
    expenseBreakdown.map((item, i) => [item.name, { label: item.name, color: PIE_COLORS[i] }])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="heading-lg text-foreground">{t("analytics.title")}</h2>
        <p className="text-muted-foreground">{t("analytics.subtitle")}</p>
      </motion.div>

      {/* KPIs */}
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
                    <ArrowUpRight className="w-3 h-3" />
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

      {/* Revenue vs Expenses vs Profit */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="heading-sm">{t("analytics.revenueVsExpensesVsProfit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="w-full h-[320px]">
              <AreaChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="var(--color-chart-5)" fill="var(--color-chart-5)" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profit Trend + Expense Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="heading-sm">{t("analytics.monthlyProfitTrend")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={profitChartConfig} className="w-full h-[280px]">
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v / 1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="profit" stroke="var(--color-chart-2)" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="heading-sm">{t("analytics.expenseBreakdown")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={pieChartConfig} className="w-full h-[280px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                    {expenseBreakdown.map((_entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Jobs Completed + Financial Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="heading-sm">{t("analytics.jobsCompletedPerMonth")}</CardTitle>
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="heading-sm">{t("analytics.financialSummary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.map((d) => (
                  <div key={d.month} className="flex items-center justify-between text-sm">
                    <span className="font-medium w-10">{d.month}</span>
                    <div className="flex-1 mx-4">
                      <div className="flex gap-1 h-5">
                        <div className="bg-steel/80 rounded-sm" style={{ width: `${(d.revenue / 2000000) * 100}%` }} />
                        <div className="bg-slate-steel/40 rounded-sm" style={{ width: `${(d.expenses / 2000000) * 100}%` }} />
                        <div className="bg-hunter/60 rounded-sm" style={{ width: `${(d.profit / 2000000) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right">${(d.profit / 1000).toFixed(0)}k {t("analytics.profit").toLowerCase()}</span>
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-steel/80" />{t("analytics.revenue")}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-steel/40" />{t("analytics.expenses")}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-hunter/60" />{t("analytics.profit")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
