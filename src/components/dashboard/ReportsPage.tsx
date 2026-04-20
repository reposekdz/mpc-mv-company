import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import type { Report } from "@/types";
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Trash2,
  Calendar,
  User,
  Filter,
  BarChart3,
  Shield,
  TrendingUp,
  DollarSign,
  Edit,
  CheckCircle,
  Clock,
} from "lucide-react";

const typeConfig: Record<Report["type"], { icon: typeof FileText; color: string; bg: string }> = {
  financial: { icon: DollarSign, color: "text-steel", bg: "bg-steel/10" },
  operational: { icon: BarChart3, color: "text-hunter", bg: "bg-hunter/10" },
  safety: { icon: Shield, color: "text-iron", bg: "bg-iron/10" },
  performance: { icon: TrendingUp, color: "text-amber", bg: "bg-amber/10" },
};

export function ReportsPage() {
  const { t } = useTranslation();
  const { reports, addReport, updateReport, deleteReport } = useAppStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editReport, setEditReport] = useState<Report | null>(null);

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      financial: t("reports.financial"),
      operational: t("reports.operational"),
      safety: t("reports.safety"),
      performance: t("reports.performance"),
    };
    return map[type] || type;
  };

  const filtered = reports.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.author.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newReport: Report = {
      id: `r${Date.now()}`,
      title: fd.get("title") as string,
      type: fd.get("type") as Report["type"],
      date: new Date().toISOString().split("T")[0],
      status: fd.get("status") as Report["status"],
      summary: fd.get("summary") as string,
      author: fd.get("author") as string,
    };
    addReport(newReport);
    setAddOpen(false);
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editReport) return;
    const fd = new FormData(e.currentTarget);
    updateReport(editReport.id, {
      title: fd.get("title") as string,
      type: fd.get("type") as Report["type"],
      status: fd.get("status") as Report["status"],
      summary: fd.get("summary") as string,
      author: fd.get("author") as string,
    });
    setEditReport(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("reports.searchReports")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder={t("reports.reportType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("reports.allTypes")}</SelectItem>
              <SelectItem value="financial">{t("reports.financial")}</SelectItem>
              <SelectItem value="operational">{t("reports.operational")}</SelectItem>
              <SelectItem value="safety">{t("reports.safety")}</SelectItem>
              <SelectItem value="performance">{t("reports.performance")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-steel hover:bg-steel-dark gap-2">
              <Plus className="w-4 h-4" />
              {t("reports.addReport")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="heading-md">{t("reports.createReport")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>{t("reports.reportTitle")}</Label>
                  <Input name="title" required />
                </div>
                <div>
                  <Label>{t("reports.reportType")}</Label>
                  <Select name="type" defaultValue="operational">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">{t("reports.financial")}</SelectItem>
                      <SelectItem value="operational">{t("reports.operational")}</SelectItem>
                      <SelectItem value="safety">{t("reports.safety")}</SelectItem>
                      <SelectItem value="performance">{t("reports.performance")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("reports.status")}</Label>
                  <Select name="status" defaultValue="draft">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t("reports.draft")}</SelectItem>
                      <SelectItem value="published">{t("reports.published")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>{t("reports.author")}</Label>
                  <Input name="author" required />
                </div>
                <div className="col-span-2">
                  <Label>{t("reports.summary")}</Label>
                  <Textarea name="summary" rows={3} required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">{t("reports.createReport")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((report, i) => {
          const cfg = typeConfig[report.type];
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-all group h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                      <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          report.status === "published"
                            ? "bg-hunter/10 text-hunter"
                            : "bg-amber/10 text-amber"
                        }`}
                      >
                        {report.status === "published" ? t("reports.published") : t("reports.draft")}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditReport(report)}>
                            <Edit className="w-3.5 h-3.5 mr-2" /> {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {report.status === "draft" ? (
                            <DropdownMenuItem onClick={() => updateReport(report.id, { status: "published" })}>
                              <CheckCircle className="w-3.5 h-3.5 mr-2" /> {t("reports.publishReport")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => updateReport(report.id, { status: "draft" })}>
                              <Clock className="w-3.5 h-3.5 mr-2" /> {t("reports.markDraft")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteReport(report.id)} className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-3 leading-snug">{report.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col">
                  <Badge variant="secondary" className="text-[10px] w-fit mb-2">{typeLabel(report.type)}</Badge>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{report.summary}</p>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {report.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {report.date}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-16">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{t("reports.noReportsFound")}</p>
          </div>
        )}
      </div>

      {/* Edit Report Dialog */}
      <Dialog open={!!editReport} onOpenChange={(o) => !o && setEditReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="heading-md">{t("reports.editReport")}</DialogTitle>
          </DialogHeader>
          {editReport && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>{t("reports.reportTitle")}</Label>
                  <Input name="title" defaultValue={editReport.title} required />
                </div>
                <div>
                  <Label>{t("reports.reportType")}</Label>
                  <Select name="type" defaultValue={editReport.type}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">{t("reports.financial")}</SelectItem>
                      <SelectItem value="operational">{t("reports.operational")}</SelectItem>
                      <SelectItem value="safety">{t("reports.safety")}</SelectItem>
                      <SelectItem value="performance">{t("reports.performance")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("reports.status")}</Label>
                  <Select name="status" defaultValue={editReport.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t("reports.draft")}</SelectItem>
                      <SelectItem value="published">{t("reports.published")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>{t("reports.author")}</Label>
                  <Input name="author" defaultValue={editReport.author} required />
                </div>
                <div className="col-span-2">
                  <Label>{t("reports.summary")}</Label>
                  <Textarea name="summary" defaultValue={editReport.summary} rows={3} required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">{t("reports.updateReport")}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
