import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, Edit, Trash2, MapPin, Filter, Briefcase, DollarSign, TrendingUp, Clock, AlertCircle, CheckCircle, XCircle, Pause } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  pending: { label: "Bitegereje", bg: "bg-amber-100", text: "text-amber-800", icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: "Birimo", bg: "bg-blue-100", text: "text-blue-800", icon: <TrendingUp className="w-3 h-3" /> },
  completed: { label: "Byarangiye", bg: "bg-green-100", text: "text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
  on_hold: { label: "Birahagaritswe", bg: "bg-orange-100", text: "text-orange-800", icon: <Pause className="w-3 h-3" /> },
  cancelled: { label: "Byahagaritswe", bg: "bg-red-100", text: "text-red-800", icon: <XCircle className="w-3 h-3" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  low: { label: "Buke", bg: "bg-slate-100", text: "text-slate-700" },
  medium: { label: "Hagati", bg: "bg-yellow-100", text: "text-yellow-800" },
  high: { label: "Byinshi", bg: "bg-orange-100", text: "text-orange-800" },
  critical: { label: "Byihutirwa", bg: "bg-red-100", text: "text-red-800" },
};

const EMPTY_FORM = {
  title: "", description: "", type: "construction", priority: "medium",
  status: "pending", assignedTo: "", location: "", startDate: "", endDate: "", budget: "", progress: "0",
};

export function JobsPage() {
  const { t } = useTranslation();
  const { jobs, fetchJobs, addJob, updateJob, deleteJob, loading } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editJob, setEditJob] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchJobs(); }, []);

  const filtered = (Array.isArray(jobs) ? jobs : []).filter(j => {
    const q = search.toLowerCase();
    const matchesSearch = !q || j.title?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) || j.description?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    const matchesType = typeFilter === "all" || j.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalBudget = filtered.reduce((s, j) => s + Number(j.budget || 0), 0);
  const avgProgress = filtered.length > 0 ? Math.round(filtered.reduce((s, j) => s + Number(j.progress || 0), 0) / filtered.length) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title, description: form.description, type: form.type,
        priority: form.priority, status: form.status,
        assigned_to: form.assignedTo || null, location: form.location,
        start_date: form.startDate || null, end_date: form.endDate || null,
        budget: Number(form.budget) || 0, progress: Number(form.progress) || 0,
      };
      if (editJob) {
        await updateJob(editJob.id, payload);
        toast.success("Umurimo wavuguruwe neza!");
        setEditJob(null);
      } else {
        await addJob(payload);
        toast.success("Umurimo wongerewe neza!");
        setAddOpen(false);
      }
      setForm(EMPTY_FORM);
    } catch { toast.error("Habaye ikosa. Ongera ugerageze."); }
  };

  const handleEdit = (job: any) => {
    setForm({
      title: job.title || "", description: job.description || "",
      type: job.type || "construction", priority: job.priority || "medium",
      status: job.status || "pending", assignedTo: job.assigned_to || job.assignedTo || "",
      location: job.location || "",
      startDate: (job.start_date || job.startDate || "").substring(0, 10),
      endDate: (job.end_date || job.endDate || "").substring(0, 10),
      budget: String(job.budget || ""), progress: String(job.progress || 0),
    });
    setEditJob(job);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteJob(deleteConfirm.id);
      toast.success("Umurimo wasibwe neza!");
      setDeleteConfirm(null);
    } catch { toast.error("Habaye ikosa. Ongera ugerageze."); }
  };

  const statusCfg = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG.pending;
  const priorityCfg = (p: string) => PRIORITY_CONFIG[p] || PRIORITY_CONFIG.medium;

  const JobForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Izina ry'Umurimo *</Label>
          <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required placeholder="Injiza izina ry'umurimo" />
        </div>
        <div className="col-span-2">
          <Label>Ibisobanuro</Label>
          <Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} placeholder="Ibisobanuro by'umurimo..." />
        </div>
        <div>
          <Label>Ubwoko</Label>
          <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mining">Ubucukuzi</SelectItem>
              <SelectItem value="construction">Ubwubatsi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Uburemere</Label>
          <Select value={form.priority} onValueChange={v => setForm(f => ({...f, priority: v}))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Buke</SelectItem>
              <SelectItem value="medium">Hagati</SelectItem>
              <SelectItem value="high">Byinshi</SelectItem>
              <SelectItem value="critical">Byihutirwa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {editJob && (
          <div>
            <Label>Imimerere</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Bitegereje</SelectItem>
                <SelectItem value="in_progress">Birimo Gukorwa</SelectItem>
                <SelectItem value="completed">Byarangiye</SelectItem>
                <SelectItem value="on_hold">Birahagaritswe</SelectItem>
                <SelectItem value="cancelled">Byahagaritswe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label>Ugenewe</Label>
          <Input value={form.assignedTo} onChange={e => setForm(f => ({...f, assignedTo: e.target.value}))} placeholder="Izina cyangwa nimero" />
        </div>
        <div>
          <Label>Ahantu *</Label>
          <Input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} required placeholder="Ahantu h'umurimo" />
        </div>
        <div>
          <Label>Itariki yo Gutangira</Label>
          <Input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} />
        </div>
        <div>
          <Label>Itariki yo Kurangira</Label>
          <Input type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} />
        </div>
        <div>
          <Label>Ingengo y'Imari (RWF)</Label>
          <Input type="number" value={form.budget} onChange={e => setForm(f => ({...f, budget: e.target.value}))} placeholder="0" min="0" />
        </div>
        {editJob && (
          <div>
            <Label>Intambwe (%)</Label>
            <Input type="number" value={form.progress} onChange={e => setForm(f => ({...f, progress: e.target.value}))} min="0" max="100" />
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 bg-blue-800 hover:bg-blue-900 text-white" disabled={loading.jobs}>
          {loading.jobs ? "Gutegereza..." : editJob ? "Vugurura" : "Shyiraho"}
        </Button>
        <Button type="button" variant="outline" onClick={() => { setEditJob(null); setAddOpen(false); setForm(EMPTY_FORM); }}>
          Hagarika
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Imirimo Yose", value: filtered.length, icon: <Briefcase className="w-5 h-5 text-blue-600" />, color: "bg-blue-50 border-blue-200" },
          { label: "Ingengo y'Imari", value: formatCurrency(totalBudget), icon: <DollarSign className="w-5 h-5 text-green-600" />, color: "bg-green-50 border-green-200" },
          { label: "Intambwe Hagati", value: `${avgProgress}%`, icon: <TrendingUp className="w-5 h-5 text-purple-600" />, color: "bg-purple-50 border-purple-200" },
          { label: "Birimo Gukorwa", value: filtered.filter(j => j.status === 'in_progress').length, icon: <AlertCircle className="w-5 h-5 text-amber-600" />, color: "bg-amber-50 border-amber-200" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-lg border p-3 ${stat.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Shakisha imirimo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Imimerere" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Imimerere Yose</SelectItem>
              <SelectItem value="pending">Bitegereje</SelectItem>
              <SelectItem value="in_progress">Birimo</SelectItem>
              <SelectItem value="completed">Byarangiye</SelectItem>
              <SelectItem value="on_hold">Birahagaritswe</SelectItem>
              <SelectItem value="cancelled">Byahagaritswe</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Ubwoko" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ubwoko Bwose</SelectItem>
              <SelectItem value="mining">Ubucukuzi</SelectItem>
              <SelectItem value="construction">Ubwubatsi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900 text-white gap-2 h-9">
              <Plus className="w-4 h-4" /> Ongeraho Umurimo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Ongeraho Umurimo Mushya</DialogTitle></DialogHeader>
            <JobForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Excel-like Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-slate-300 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-700 w-8">#</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-700">Izina ry'Umurimo</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-700">Ubwoko</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-700">Imimerere</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-700">Uburemere</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-700">Intambwe</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-700">Ingengo</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-700">Ahantu</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider">Ibikorwa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading.jobs ? (
                <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">Gutegereza amakuru...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">
                  Nta mirimo yabonetse. <button onClick={() => setAddOpen(true)} className="text-blue-600 underline">Ongeraho umurimo.</button>
                </td></tr>
              ) : filtered.map((job, idx) => {
                const s = statusCfg(job.status);
                const p = priorityCfg(job.priority);
                return (
                  <tr key={job.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-blue-50/60 transition-colors`}>
                    <td className="px-3 py-2.5 text-xs text-slate-500 border-r border-slate-100 font-mono">{idx + 1}</td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <div className="font-semibold text-slate-800">{job.title}</div>
                      {job.description && <div className="text-xs text-slate-500 truncate max-w-[200px]">{job.description}</div>}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <Badge variant="outline" className={`text-[10px] font-semibold ${job.type === 'mining' ? 'bg-yellow-50 text-yellow-800 border-yellow-300' : 'bg-blue-50 text-blue-800 border-blue-300'}`}>
                        {job.type === 'mining' ? '⛏ Ubucukuzi' : '🏗 Ubwubatsi'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${p.bg} ${p.text}`}>
                        {p.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <Progress value={Number(job.progress || 0)} className="h-2 w-16" />
                        <span className="text-xs font-medium text-slate-700">{job.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100 font-semibold text-green-700 text-xs whitespace-nowrap">
                      {formatCurrency(job.budget || 0)}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[120px]">{job.location || '-'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-700" onClick={() => handleEdit(job)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-700" onClick={() => setDeleteConfirm(job)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300">
                  <td colSpan={6} className="px-3 py-2 text-xs font-bold text-slate-700">Igiteranyo ({filtered.length} imirimo)</td>
                  <td className="px-3 py-2 text-xs font-bold text-green-800">{formatCurrency(totalBudget)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editJob} onOpenChange={o => { if (!o) { setEditJob(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Hindura Umurimo</DialogTitle></DialogHeader>
          {editJob && <JobForm />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-red-600">Emeza Gusiba</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Urafasha gusiba umurimo: <strong>"{deleteConfirm?.title}"</strong>? Ibi ntibishobora gusubirwaho.</p>
          <div className="flex gap-2 pt-2">
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Yego, siba</Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Hagarika</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
