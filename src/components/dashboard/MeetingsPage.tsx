import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import { meetingsApi } from "@/lib/api";
import { Plus, Search, Edit, Trash2, CalendarDays, Clock, MapPin, Filter, FileText, CheckCircle, Play, XCircle, AlertCircle, Link } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  scheduled: { label: "Biteganyijwe", bg: "bg-blue-100", text: "text-blue-800", icon: <CalendarDays className="w-3 h-3" /> },
  in_progress: { label: "Birimo", bg: "bg-green-100", text: "text-green-800", icon: <Play className="w-3 h-3" /> },
  completed: { label: "Byarangiye", bg: "bg-slate-100", text: "text-slate-700", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Byahagaritswe", bg: "bg-red-100", text: "text-red-800", icon: <XCircle className="w-3 h-3" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  normal: { label: "Bisanzwe", bg: "bg-slate-100", text: "text-slate-700" },
  important: { label: "Byihutirwa", bg: "bg-amber-100", text: "text-amber-800" },
  urgent: { label: "Bikomeye", bg: "bg-red-100", text: "text-red-800" },
};

const EMPTY_FORM = {
  title: "", description: "", date: "", start_time: "", end_time: "",
  location: "", organizer: "", attendees: "", status: "scheduled",
  priority: "normal", notes: "", agenda: "", online_link: "",
};

export function MeetingsPage() {
  const { meetings, fetchMeetings, addMeeting, updateMeeting, deleteMeeting, loading } = useAppStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<any | null>(null);
  const [notesOpen, setNotesOpen] = useState<any | null>(null);
  const [notesText, setNotesText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchMeetings(); }, []);

  const mtgList = Array.isArray(meetings) ? meetings : [];
  const filtered = mtgList.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.title?.toLowerCase().includes(q) || m.organizer?.toLowerCase().includes(q) || m.location?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const today = new Date().toISOString().split('T')[0];
  const upcoming = filtered.filter(m => (m.date || '').substring(0, 10) >= today && m.status === 'scheduled').length;
  const todayMtgs = filtered.filter(m => (m.date || '').substring(0, 10) === today).length;
  const completed = filtered.filter(m => m.status === 'completed').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title, description: form.description,
        date: form.date,
        start_time: form.start_time || null, end_time: form.end_time || null,
        location: form.location || null,
        organizer: form.organizer || user?.name || 'Manager',
        attendees: form.attendees || null,
        status: form.status, priority: form.priority,
        notes: form.notes || null,
        agenda: form.agenda || null,
        online_link: form.online_link || null,
      };
      if (editMeeting) {
        await updateMeeting(editMeeting.id, payload);
        toast.success("Inama yavuguruwe neza!");
        setEditMeeting(null);
      } else {
        await addMeeting(payload);
        toast.success("Inama yongerewe neza!");
        setAddOpen(false);
      }
      setForm(EMPTY_FORM);
    } catch { toast.error("Habaye ikosa. Ongera ugerageze."); }
  };

  const handleEdit = (m: any) => {
    setForm({
      title: m.title || "", description: m.description || "",
      date: (m.date || "").substring(0, 10),
      start_time: m.start_time || "", end_time: m.end_time || "",
      location: m.location || "", organizer: m.organizer || "",
      attendees: Array.isArray(m.attendees) ? m.attendees.join(', ') : (m.attendees || ""),
      status: m.status || "scheduled", priority: m.priority || "normal",
      notes: m.notes || "",
      agenda: Array.isArray(m.agenda) ? m.agenda.join('\n') : (m.agenda || ""),
      online_link: m.online_link || "",
    });
    setEditMeeting(m);
  };

  const handleSaveNotes = async () => {
    if (!notesOpen) return;
    try {
      await meetingsApi.addNotes(notesOpen.id, notesText);
      await fetchMeetings();
      toast.success("Inyandiko zabitswe neza!");
      setNotesOpen(null);
    } catch { toast.error("Habaye ikosa."); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMeeting(deleteConfirm.id);
      toast.success("Inama yasibwe neza!");
      setDeleteConfirm(null);
    } catch { toast.error("Habaye ikosa."); }
  };

  const sc = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG.scheduled;
  const pc = (p: string) => PRIORITY_CONFIG[p] || PRIORITY_CONFIG.normal;

  const MeetingForm = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Izina ry'Inama *</Label>
          <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required placeholder="Izina ry'inama..." />
        </div>
        <div className="col-span-2">
          <Label>Intego y'Inama</Label>
          <Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} placeholder="Ibisobanuro by'inama..." />
        </div>
        <div>
          <Label>Itariki *</Label>
          <Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} required />
        </div>
        <div>
          <Label>Ahantu / Kuri Interineti</Label>
          <Input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="Kigali, Zoom, Teams..." />
        </div>
        <div>
          <Label>Isaha yo Gutangira</Label>
          <Input type="time" value={form.start_time} onChange={e => setForm(f => ({...f, start_time: e.target.value}))} />
        </div>
        <div>
          <Label>Isaha yo Kurangira</Label>
          <Input type="time" value={form.end_time} onChange={e => setForm(f => ({...f, end_time: e.target.value}))} />
        </div>
        <div>
          <Label>Umuteganya</Label>
          <Input value={form.organizer} onChange={e => setForm(f => ({...f, organizer: e.target.value}))} placeholder={user?.name || 'Manager'} />
        </div>
        <div>
          <Label>Uburemere</Label>
          <Select value={form.priority} onValueChange={v => setForm(f => ({...f, priority: v}))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Bisanzwe</SelectItem>
              <SelectItem value="important">Byihutirwa</SelectItem>
              <SelectItem value="urgent">Bikomeye Cyane</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {editMeeting && (
          <div>
            <Label>Imimerere</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Biteganyijwe</SelectItem>
                <SelectItem value="in_progress">Birimo</SelectItem>
                <SelectItem value="completed">Byarangiye</SelectItem>
                <SelectItem value="cancelled">Byahagaritswe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="col-span-2">
          <Label>Abitabiriye (atandukanijwe na virgule)</Label>
          <Input value={form.attendees} onChange={e => setForm(f => ({...f, attendees: e.target.value}))} placeholder="Jean, Marie, Patrick..." />
        </div>
        <div className="col-span-2">
          <Label>Gahunda y'Inama (murongo ku murongo)</Label>
          <Textarea value={form.agenda} onChange={e => setForm(f => ({...f, agenda: e.target.value}))} rows={3}
            placeholder={"1. Ibiganiro\n2. Ibyacumuwe\n3. Impanvu..."} />
        </div>
        <div className="col-span-2">
          <Label>Uhuza rw'Inama kuri Interineti</Label>
          <Input value={form.online_link} onChange={e => setForm(f => ({...f, online_link: e.target.value}))}
            placeholder="https://zoom.us/j/..." type="url" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 bg-purple-800 hover:bg-purple-900" disabled={loading.meetings}>
          {loading.meetings ? "Gutegereza..." : editMeeting ? "Vugurura" : "Shyiraho"}
        </Button>
        <Button type="button" variant="outline" onClick={() => { setEditMeeting(null); setAddOpen(false); setForm(EMPTY_FORM); }}>Hagarika</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Inama Zose", value: filtered.length, color: "bg-blue-50 border-blue-200", icon: <CalendarDays className="w-5 h-5 text-blue-600" /> },
          { label: "Inama z'Uyu Munsi", value: todayMtgs, color: "bg-amber-50 border-amber-200", icon: <Clock className="w-5 h-5 text-amber-600" /> },
          { label: "Ziteganyijwe", value: upcoming, color: "bg-purple-50 border-purple-200", icon: <AlertCircle className="w-5 h-5 text-purple-600" /> },
          { label: "Zarangiye", value: completed, color: "bg-green-50 border-green-200", icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
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
            <Input placeholder="Shakisha inama..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Imimerere Yose</SelectItem>
              <SelectItem value="scheduled">Biteganyijwe</SelectItem>
              <SelectItem value="in_progress">Birimo</SelectItem>
              <SelectItem value="completed">Byarangiye</SelectItem>
              <SelectItem value="cancelled">Byahagaritswe</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-800 hover:bg-purple-900 text-white gap-2 h-9">
              <Plus className="w-4 h-4" /> Guteganya Inama
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Teganya Inama Nshya</DialogTitle></DialogHeader>
            <MeetingForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Excel-like Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-slate-300 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-purple-900 to-purple-800 text-white">
                {["#", "Izina ry'Inama", "Itariki", "Isaha", "Ahantu", "Umuteganya", "Imimerere", "Uburemere", "Inyandiko", "Ibikorwa"]
                  .map((h, i) => (
                    <th key={i} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-purple-700 last:border-r-0 whitespace-nowrap">{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading.meetings ? (
                <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">Gutegereza amakuru...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">
                  Nta nama yabonetse. <button onClick={() => setAddOpen(true)} className="text-purple-600 underline">Teganya inama.</button>
                </td></tr>
              ) : filtered.map((m, idx) => {
                const s = sc(m.status);
                const p = pc(m.priority || 'normal');
                const hasNotes = m.notes && m.notes.trim().length > 0;
                return (
                  <tr key={m.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-purple-50/40 transition-colors`}>
                    <td className="px-3 py-2.5 text-xs text-slate-500 border-r border-slate-100 font-mono">{idx + 1}</td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <div className="font-semibold text-slate-800">{m.title}</div>
                      {m.description && <div className="text-xs text-slate-500 truncate max-w-[180px]">{m.description}</div>}
                      {m.online_link && (
                        <a href={m.online_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <Link className="w-3 h-3" /> Kuri Interineti
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100 text-xs whitespace-nowrap font-medium">
                      {m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('fr-RW', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100 text-xs whitespace-nowrap">
                      {m.start_time ? `${m.start_time}${m.end_time ? ` → ${m.end_time}` : ''}` : '-'}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      {m.location ? (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span className="truncate max-w-[100px]">{m.location}</span>
                        </div>
                      ) : <span className="text-xs text-slate-400">-</span>}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100 text-xs font-medium">{m.organizer || '-'}</td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-semibold ${p.bg} ${p.text}`}>{p.label}</span>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <Button size="sm" variant="ghost"
                        className={`h-7 gap-1 text-[10px] px-2 ${hasNotes ? 'text-green-700 hover:bg-green-50' : 'text-slate-500 hover:bg-slate-50'}`}
                        onClick={() => { setNotesOpen(m); setNotesText(m.notes || ''); }}>
                        <FileText className="w-3 h-3" />
                        {hasNotes ? 'Reba' : 'Andika'}
                      </Button>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-700" onClick={() => handleEdit(m)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-700" onClick={() => setDeleteConfirm(m)}>
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
      <Dialog open={!!editMeeting} onOpenChange={o => { if (!o) { setEditMeeting(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Hindura Inama</DialogTitle></DialogHeader>
          {editMeeting && <MeetingForm />}
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={!!notesOpen} onOpenChange={o => !o && setNotesOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" /> Inyandiko z'Inama
            </DialogTitle>
            <p className="text-sm text-slate-600">{notesOpen?.title}</p>
          </DialogHeader>
          <div className="space-y-3">
            {notesOpen?.agenda && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-bold text-blue-800 mb-1">Gahunda y'Inama:</p>
                <pre className="text-xs text-blue-700 whitespace-pre-wrap font-sans">{notesOpen.agenda}</pre>
              </div>
            )}
            <div>
              <Label className="font-semibold">Inyandiko z'Inama</Label>
              <p className="text-xs text-slate-500 mb-2">Injiza ibyo byaganiriweho, ibyabyajwe, n'ibizakozwe</p>
              <Textarea value={notesText} onChange={e => setNotesText(e.target.value)} rows={8}
                placeholder={"Andika inyandiko z'inama:\n- Ibyaganiriweho\n- Ibyabyajwe\n- Ibizakozwe\n- Abazibikiza\n..."} />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-purple-800 hover:bg-purple-900" onClick={handleSaveNotes}>Bika Inyandiko</Button>
              <Button variant="outline" className="flex-1" onClick={() => setNotesOpen(null)}>Funga</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-red-600">Emeza Gusiba</DialogTitle></DialogHeader>
          <p className="text-sm">Urafasha gusiba inama: <strong>"{deleteConfirm?.title}"</strong>?</p>
          <div className="flex gap-2 pt-2">
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Yego, siba</Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Hagarika</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
