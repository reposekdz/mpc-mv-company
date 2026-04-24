import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import { Plus, Search, Edit, Trash2, FileText, Filter, BookOpen, BarChart3, Shield, TrendingUp, DollarSign, Eye, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  financial: { label: "Imari", bg: "bg-green-100", text: "text-green-800", icon: <DollarSign className="w-3 h-3" /> },
  operational: { label: "Ibikorwa", bg: "bg-blue-100", text: "text-blue-800", icon: <BarChart3 className="w-3 h-3" /> },
  safety: { label: "Umutekano", bg: "bg-orange-100", text: "text-orange-800", icon: <Shield className="w-3 h-3" /> },
  performance: { label: "Imikorere", bg: "bg-purple-100", text: "text-purple-800", icon: <TrendingUp className="w-3 h-3" /> },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Impapuro", bg: "bg-slate-100", text: "text-slate-700" },
  published: { label: "Byatangazwe", bg: "bg-green-100", text: "text-green-800" },
  archived: { label: "Byabitswe", bg: "bg-blue-100", text: "text-blue-700" },
};

const EMPTY_FORM = {
  title: "", type: "operational", summary: "", content: "",
  status: "draft", period_start: "", period_end: "",
};

export function ReportsPage() {
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

  useEffect(() => { fetchReports(); }, []);

  const rptList = Array.isArray(reports) ? reports : [];
  const filtered = rptList.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title?.toLowerCase().includes(q) || r.summary?.toLowerCase().includes(q);
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const published = filtered.filter(r => r.status === 'published').length;
  const drafts = filtered.filter(r => r.status === 'draft').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title, type: form.type,
        summary: form.summary, content: form.content || null,
        status: form.status,
        author: user?.name || 'Manager',
        period_start: form.period_start || null,
        period_end: form.period_end || null,
      };
      if (editReport) {
        await updateReport(editReport.id, payload);
        toast.success("Raporo yavuguruwe neza!");
        setEditReport(null);
      } else {
        await addReport(payload);
        toast.success("Raporo yongerewe neza!");
        setAddOpen(false);
      }
      setForm(EMPTY_FORM);
    } catch { toast.error("Habaye ikosa. Ongera ugerageze."); }
  };

  const handleEdit = (r: any) => {
    setForm({
      title: r.title || "", type: r.type || "operational",
      summary: r.summary || "", content: r.content || "",
      status: r.status || "draft",
      period_start: (r.period_start || "").substring(0, 10),
      period_end: (r.period_end || "").substring(0, 10),
    });
    setEditReport(r);
  };

  const handleTogglePublish = async (r: any) => {
    const newStatus = r.status === 'published' ? 'draft' : 'published';
    try {
      await updateReport(r.id, { status: newStatus });
      toast.success(newStatus === 'published' ? "Raporo yatangazwe!" : "Raporo yashyiwe nk'impapuro");
    } catch { toast.error("Habaye ikosa."); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteReport(deleteConfirm.id);
      toast.success("Raporo yasibwe neza!");
      setDeleteConfirm(null);
    } catch { toast.error("Habaye ikosa."); }
  };

  const tc = (t: string) => TYPE_CONFIG[t] || TYPE_CONFIG.operational;
  const sc = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG.draft;

  const ReportForm = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Izina rya Raporo *</Label>
          <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required placeholder="Izina rya raporo..." />
        </div>
        <div>
          <Label>Ubwoko bwa Raporo</Label>
          <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">Imari</SelectItem>
              <SelectItem value="operational">Ibikorwa</SelectItem>
              <SelectItem value="safety">Umutekano</SelectItem>
              <SelectItem value="performance">Imikorere</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {editReport && (
          <div>
            <Label>Imimerere</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Impapuro</SelectItem>
                <SelectItem value="published">Byatangazwe</SelectItem>
                <SelectItem value="archived">Byabitswe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label>Igihe cy'Ubwishyu - Gutangira</Label>
          <Input type="date" value={form.period_start} onChange={e => setForm(f => ({...f, period_start: e.target.value}))} />
        </div>
        <div>
          <Label>Igihe cy'Ubwishyu - Kurangira</Label>
          <Input type="date" value={form.period_end} onChange={e => setForm(f => ({...f, period_end: e.target.value}))} />
        </div>
        <div className="col-span-2">
          <Label>Incamake *</Label>
          <Textarea value={form.summary} onChange={e => setForm(f => ({...f, summary: e.target.value}))} required rows={3} placeholder="Incamake yuzuye ya raporo..." />
        </div>
        <div className="col-span-2">
          <Label>Ibikubiyemo (Ibisobanuro byinshi)</Label>
          <Textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} rows={6}
            placeholder={"Injiza amakuru yuzuye ya raporo:\n- Ibyakozwe\n- Ibyageragejwe\n- Imigambi..."} />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 bg-blue-800 hover:bg-blue-900" disabled={loading.reports}>
          {loading.reports ? "Gutegereza..." : editReport ? "Vugurura" : "Shyiraho"}
        </Button>
        <Button type="button" variant="outline" onClick={() => { setEditReport(null); setAddOpen(false); setForm(EMPTY_FORM); }}>Hagarika</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Raporo Zose", value: filtered.length, color: "bg-blue-50 border-blue-200", icon: <FileText className="w-5 h-5 text-blue-600" /> },
          { label: "Byatangazwe", value: published, color: "bg-green-50 border-green-200", icon: <Globe className="w-5 h-5 text-green-600" /> },
          { label: "Impapuro", value: drafts, color: "bg-slate-50 border-slate-200", icon: <BookOpen className="w-5 h-5 text-slate-600" /> },
          { label: "Ubwoko", value: [...new Set(filtered.map(r => r.type))].length, color: "bg-purple-50 border-purple-200", icon: <BarChart3 className="w-5 h-5 text-purple-600" /> },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-lg border p-3 ${s.color}`}>
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
            <Input placeholder="Shakisha raporo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 h-9"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ubwoko Bwose</SelectItem>
              <SelectItem value="financial">Imari</SelectItem>
              <SelectItem value="operational">Ibikorwa</SelectItem>
              <SelectItem value="safety">Umutekano</SelectItem>
              <SelectItem value="performance">Imikorere</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Byose</SelectItem>
              <SelectItem value="draft">Impapuro</SelectItem>
              <SelectItem value="published">Byatangazwe</SelectItem>
              <SelectItem value="archived">Byabitswe</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900 text-white gap-2 h-9">
              <Plus className="w-4 h-4" /> Ongeraho Raporo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Ongeraho Raporo Nshya</DialogTitle></DialogHeader>
            <ReportForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Excel-like Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-slate-300 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white">
                {["#", "Izina rya Raporo", "Ubwoko", "Imimerere", "Umwanditsi", "Igihe", "Incamake", "Ibikorwa"]
                  .map((h, i) => (
                    <th key={i} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-indigo-700 last:border-r-0 whitespace-nowrap">{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading.reports ? (
                <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">Gutegereza amakuru...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">
                  Nta raporo yabonetse. <button onClick={() => setAddOpen(true)} className="text-blue-600 underline">Ongeraho raporo.</button>
                </td></tr>
              ) : filtered.map((r, idx) => {
                const t = tc(r.type);
                const s = sc(r.status);
                return (
                  <tr key={r.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-indigo-50/40 transition-colors`}>
                    <td className="px-3 py-2.5 text-xs text-slate-500 border-r border-slate-100 font-mono">{idx + 1}</td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <div className="font-semibold text-slate-800">{r.title}</div>
                      {(r.period_start || r.period_end) && (
                        <div className="text-xs text-slate-500">
                          {r.period_start && new Date(r.period_start).toLocaleDateString('fr-RW', { month: 'short', year: 'numeric' })}
                          {r.period_end && ` → ${new Date(r.period_end).toLocaleDateString('fr-RW', { month: 'short', year: 'numeric' })}`}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${t.bg} ${t.text}`}>
                        {t.icon} {t.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>{s.label}</span>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100 text-xs font-medium text-slate-700">{r.author || '-'}</td>
                    <td className="px-3 py-2.5 border-r border-slate-100 text-xs text-slate-600 whitespace-nowrap">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-RW') : '-'}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <p className="text-xs text-slate-600 truncate max-w-[200px]">{r.summary || '-'}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" className={`h-7 w-7 p-0 ${r.status === 'published' ? 'text-green-600 hover:bg-green-50' : 'text-slate-500 hover:bg-slate-50'}`}
                          onClick={() => handleTogglePublish(r)} title={r.status === 'published' ? 'Gushyira nk\'Impapuro' : 'Gutangaza'}>
                          {r.status === 'published' ? <Globe className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-700" onClick={() => handleEdit(r)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-700" onClick={() => setDeleteConfirm(r)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editReport} onOpenChange={o => { if (!o) { setEditReport(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Hindura Raporo</DialogTitle></DialogHeader>
          {editReport && <ReportForm />}
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={!!viewReport} onOpenChange={o => !o && setViewReport(null)}>
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
                  {tc(viewReport.type).icon} {tc(viewReport.type).label}
                </span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${sc(viewReport.status).bg} ${sc(viewReport.status).text}`}>
                  {sc(viewReport.status).label}
                </span>
                <span className="text-xs text-slate-500">na {viewReport.author}</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-800 mb-2">Incamake:</p>
                <p className="text-sm text-slate-600">{viewReport.summary}</p>
              </div>
              {viewReport.content && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-2">Ibikubiyemo:</p>
                  <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans bg-white border rounded-lg p-4">{viewReport.content}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-red-600">Emeza Gusiba</DialogTitle></DialogHeader>
          <p className="text-sm">Urafasha gusiba raporo: <strong>"{deleteConfirm?.title}"</strong>?</p>
          <div className="flex gap-2 pt-2">
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Yego, siba</Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Hagarika</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
