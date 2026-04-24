import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import {
  Plus, Search, Edit, Trash2, FileText, Filter, BookOpen, BarChart3,
  Shield, TrendingUp, DollarSign, Eye, Globe, Paperclip, Upload, X, Download,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { uploadsApi, type UploadedFile } from "@/lib/api";

interface Attachment {
  url: string;
  originalName: string;
  filename?: string;
  size: number;
  mimeType?: string;
  uploadedAt?: string;
  uploadedBy?: string | null;
}

const TYPE_ICONS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  financial: { bg: "bg-green-100", text: "text-green-800", icon: <DollarSign className="w-3 h-3" /> },
  operational: { bg: "bg-blue-100", text: "text-blue-800", icon: <BarChart3 className="w-3 h-3" /> },
  safety: { bg: "bg-orange-100", text: "text-orange-800", icon: <Shield className="w-3 h-3" /> },
  performance: { bg: "bg-purple-100", text: "text-purple-800", icon: <TrendingUp className="w-3 h-3" /> },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-slate-100", text: "text-slate-700" },
  published: { bg: "bg-green-100", text: "text-green-800" },
  archived: { bg: "bg-blue-100", text: "text-blue-700" },
};

const EMPTY_FORM = {
  title: "", type: "operational", summary: "", content: "",
  status: "draft", period_start: "", period_end: "",
  attachments: [] as Attachment[],
};

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export function ReportsPage() {
  const { t } = useTranslation();
  const { reports, fetchReports, addReport, updateReport, deleteReport, loading } = useAppStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editReport, setEditReport] = useState<any | null>(null);
  const [viewReport, setViewReport] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchReports(); }, []);

  const tLabel = (type: string) => t(`reports.${type}`, type);
  const tStatus = (status: string) => t(`reports.${status}`, status);

  const rptList = Array.isArray(reports) ? reports : [];
  const filtered = rptList.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title?.toLowerCase().includes(q) || r.summary?.toLowerCase().includes(q);
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const published = filtered.filter((r) => r.status === "published").length;
  const drafts = filtered.filter((r) => r.status === "draft").length;

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: UploadedFile[] = await uploadsApi.upload(files);
      setForm((f) => ({ ...f, attachments: [...f.attachments, ...uploaded] }));
    } catch (err: any) {
      toast.error(err?.message || t("reports.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (idx: number) => {
    if (!confirm(t("reports.confirmDeleteFile"))) return;
    setForm((f) => ({ ...f, attachments: f.attachments.filter((_, i) => i !== idx) }));
    toast.success(t("reports.fileDeletedToast"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        type: form.type,
        summary: form.summary,
        content: form.content || null,
        status: form.status,
        author: user?.name || "Manager",
        period_start: form.period_start || null,
        period_end: form.period_end || null,
        attachments: form.attachments,
      };
      if (editReport) {
        await updateReport(editReport.id, payload as any);
        toast.success(t("reports.updatedToast"));
        setEditReport(null);
      } else {
        await addReport(payload as any);
        toast.success(t("reports.createdToast"));
        setAddOpen(false);
      }
      setForm(EMPTY_FORM);
    } catch {
      toast.error(t("reports.errorToast"));
    }
  };

  const handleEdit = (r: any) => {
    setForm({
      title: r.title || "",
      type: r.type || "operational",
      summary: r.summary || "",
      content: r.content || "",
      status: r.status || "draft",
      period_start: (r.period_start || "").substring(0, 10),
      period_end: (r.period_end || "").substring(0, 10),
      attachments: Array.isArray(r.attachments) ? r.attachments : [],
    });
    setEditReport(r);
  };

  const handleTogglePublish = async (r: any) => {
    const newStatus = r.status === "published" ? "draft" : "published";
    try {
      await updateReport(r.id, { status: newStatus } as any);
      toast.success(newStatus === "published" ? t("reports.publishedToast") : t("reports.draftToast"));
    } catch {
      toast.error(t("reports.errorToast"));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteReport(deleteConfirm.id);
      toast.success(t("reports.deletedToast"));
      setDeleteConfirm(null);
    } catch {
      toast.error(t("reports.errorToast"));
    }
  };

  const tc = (type: string) => TYPE_ICONS[type] || TYPE_ICONS.operational;
  const sc = (status: string) => STATUS_COLORS[status] || STATUS_COLORS.draft;

  const AttachmentList = ({ items, onRemove }: { items: Attachment[]; onRemove?: (i: number) => void }) => (
    <div className="space-y-1.5">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">{t("reports.noAttachments")}</p>
      ) : (
        items.map((a, i) => (
          <div key={`${a.filename || a.url}-${i}`} className="flex items-center gap-2 bg-slate-50 rounded-md px-2 py-1.5 text-xs">
            <Paperclip className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <a
              href={uploadsApi.resolveUrl(a.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 truncate text-blue-700 hover:underline"
              title={a.originalName}
            >
              {a.originalName}
            </a>
            <span className="text-slate-500 whitespace-nowrap">{formatBytes(a.size)}</span>
            <a
              href={uploadsApi.resolveUrl(a.url)}
              download={a.originalName}
              className="text-slate-500 hover:text-blue-600"
              title={t("reports.download")}
            >
              <Download className="w-3.5 h-3.5" />
            </a>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-slate-500 hover:text-red-600"
                title={t("reports.remove")}
                aria-label={t("reports.remove")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );

  const ReportForm = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>{t("reports.reportTitle")} *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            placeholder={t("reports.titlePlaceholder")}
          />
        </div>
        <div>
          <Label>{t("reports.reportType")}</Label>
          <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">{tLabel("financial")}</SelectItem>
              <SelectItem value="operational">{tLabel("operational")}</SelectItem>
              <SelectItem value="safety">{tLabel("safety")}</SelectItem>
              <SelectItem value="performance">{tLabel("performance")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {editReport && (
          <div>
            <Label>{t("reports.status")}</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{tStatus("draft")}</SelectItem>
                <SelectItem value="published">{tStatus("published")}</SelectItem>
                <SelectItem value="archived">{tStatus("archived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label>{t("reports.periodStart")}</Label>
          <Input type="date" value={form.period_start} onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))} />
        </div>
        <div>
          <Label>{t("reports.periodEnd")}</Label>
          <Input type="date" value={form.period_end} onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <Label>{t("reports.summary")} *</Label>
          <Textarea
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            required
            rows={3}
            placeholder={t("reports.summaryPlaceholder")}
          />
        </div>
        <div className="col-span-2">
          <Label>{t("reports.content")}</Label>
          <Textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={6}
            placeholder={t("reports.contentPlaceholder")}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5" />
              {t("reports.attachments")}
              {form.attachments.length > 0 && (
                <span className="text-xs text-muted-foreground">({form.attachments.length})</span>
              )}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-7 gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? t("reports.uploadingFiles") : t("reports.chooseFiles")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </div>
          <AttachmentList items={form.attachments} onRemove={removeAttachment} />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 bg-blue-800 hover:bg-blue-900" disabled={loading.reports || uploading}>
          {loading.reports ? t("reports.saving") : editReport ? t("reports.save") : t("reports.create")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setEditReport(null);
            setAddOpen(false);
            setForm(EMPTY_FORM);
          }}
        >
          {t("reports.cancel")}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "total", label: t("reports.totalReports"), value: filtered.length, color: "bg-blue-50 border-blue-200", icon: <FileText className="w-5 h-5 text-blue-600" /> },
          { key: "published", label: tStatus("published"), value: published, color: "bg-green-50 border-green-200", icon: <Globe className="w-5 h-5 text-green-600" /> },
          { key: "drafts", label: t("reports.drafts"), value: drafts, color: "bg-slate-50 border-slate-200", icon: <BookOpen className="w-5 h-5 text-slate-600" /> },
          { key: "types", label: t("reports.types"), value: [...new Set(filtered.map((r) => r.type))].length, color: "bg-purple-50 border-purple-200", icon: <BarChart3 className="w-5 h-5 text-purple-600" /> },
        ].map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-lg border p-3 ${s.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
              {s.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("reports.searchReports")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 h-9">
              <Filter className="w-3.5 h-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("reports.allTypes")}</SelectItem>
              <SelectItem value="financial">{tLabel("financial")}</SelectItem>
              <SelectItem value="operational">{tLabel("operational")}</SelectItem>
              <SelectItem value="safety">{tLabel("safety")}</SelectItem>
              <SelectItem value="performance">{tLabel("performance")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("reports.allStatus")}</SelectItem>
              <SelectItem value="draft">{tStatus("draft")}</SelectItem>
              <SelectItem value="published">{tStatus("published")}</SelectItem>
              <SelectItem value="archived">{tStatus("archived")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900 text-white gap-2 h-9">
              <Plus className="w-4 h-4" /> {t("reports.addReport")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("reports.createReport")}</DialogTitle>
            </DialogHeader>
            <ReportForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Excel-like Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg border border-slate-300 overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white">
                {[
                  t("reports.columns.id"),
                  t("reports.columns.title"),
                  t("reports.columns.type"),
                  t("reports.columns.status"),
                  t("reports.columns.author"),
                  t("reports.columns.date"),
                  t("reports.columns.summary"),
                  t("reports.attachments"),
                  t("reports.columns.actions"),
                ].map((h, i) => (
                  <th
                    key={`col-${i}`}
                    className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-indigo-700 last:border-r-0 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading.reports ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    {t("reports.loadingData")}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    {t("reports.noReportsFound")}{" "}
                    <button onClick={() => setAddOpen(true)} className="text-blue-600 underline">
                      {t("reports.addReport")}.
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const tcInfo = tc(r.type);
                  const scInfo = sc(r.status);
                  const attachCount = Array.isArray(r.attachments) ? r.attachments.length : 0;
                  return (
                    <tr
                      key={r.id}
                      className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"} hover:bg-indigo-50/40 transition-colors`}
                    >
                      <td className="px-3 py-2.5 text-xs text-slate-500 border-r border-slate-100 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100">
                        <div className="font-semibold text-slate-800">{r.title}</div>
                        {(r.period_start || r.period_end) && (
                          <div className="text-xs text-slate-500">
                            {r.period_start && new Date(r.period_start).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                            {r.period_end && ` → ${new Date(r.period_end).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${tcInfo.bg} ${tcInfo.text}`}>
                          {tcInfo.icon} {tLabel(r.type)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100">
                        <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-semibold ${scInfo.bg} ${scInfo.text}`}>
                          {tStatus(r.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-xs font-medium text-slate-700">
                        {r.author || "-"}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-xs text-slate-600 whitespace-nowrap">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100">
                        <p className="text-xs text-slate-600 truncate max-w-[200px]">{r.summary || "-"}</p>
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-xs text-slate-600">
                        {attachCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setViewReport(r)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            {attachCount}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-500 hover:bg-slate-100"
                            onClick={() => setViewReport(r)}
                            title={t("common.view", "View")}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 w-7 p-0 ${r.status === "published" ? "text-green-600 hover:bg-green-50" : "text-slate-500 hover:bg-slate-50"}`}
                            onClick={() => handleTogglePublish(r)}
                            title={r.status === "published" ? t("reports.markDraft") : t("reports.publishReport")}
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-700"
                            onClick={() => handleEdit(r)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-700"
                            onClick={() => setDeleteConfirm(r)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editReport} onOpenChange={(o) => { if (!o) { setEditReport(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("reports.editReport")}</DialogTitle></DialogHeader>
          {editReport && <ReportForm />}
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={!!viewReport} onOpenChange={(o) => !o && setViewReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> {viewReport?.title}
            </DialogTitle>
          </DialogHeader>
          {viewReport && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${tc(viewReport.type).bg} ${tc(viewReport.type).text}`}>
                  {tc(viewReport.type).icon} {tLabel(viewReport.type)}
                </span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${sc(viewReport.status).bg} ${sc(viewReport.status).text}`}>
                  {tStatus(viewReport.status)}
                </span>
                <span className="text-xs text-slate-500">{viewReport.author}</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-800 mb-2">{t("reports.summary")}:</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{viewReport.summary}</p>
              </div>
              {viewReport.content && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-2">{t("reports.content")}:</p>
                  <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans bg-white border rounded-lg p-4">{viewReport.content}</pre>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> {t("reports.attachments")}
                </p>
                <AttachmentList items={Array.isArray(viewReport.attachments) ? viewReport.attachments : []} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">{t("reports.deleteTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            {t("reports.deleteConfirm")} <strong>"{deleteConfirm?.title}"</strong>?
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>
              {t("reports.deleteYes")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>
              {t("reports.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
