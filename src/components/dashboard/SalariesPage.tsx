import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import { Plus, Search, Edit, Trash2, Users, DollarSign, CheckCircle, Clock, AlertTriangle, Filter, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

const PAYMENT_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  paid: { label: "Bishyuwe", bg: "bg-green-100", text: "text-green-800" },
  pending: { label: "Bitegereje", bg: "bg-yellow-100", text: "text-yellow-800" },
  overdue: { label: "Byarenze", bg: "bg-red-100", text: "text-red-800" },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "Bikora", bg: "bg-green-100", text: "text-green-800" },
  on_leave: { label: "Mu Kiruhuko", bg: "bg-blue-100", text: "text-blue-800" },
  terminated: { label: "Byahagaritswe", bg: "bg-red-100", text: "text-red-800" },
  resigned: { label: "Yasezereye", bg: "bg-slate-100", text: "text-slate-700" },
};

const EMPTY_FORM = {
  first_name: "", last_name: "", email: "", phone: "", position: "",
  department: "", salary: "", hourly_rate: "", hire_date: "",
  employment_type: "full_time", status: "active", payment_status: "pending",
};

export function SalariesPage() {
  const { employees, fetchEmployees, addEmployee, updateEmployee, deleteEmployee, processPayroll, loading } = useAppStore();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchEmployees(); }, []);

  const empList = Array.isArray(employees) ? employees : [];
  const departments = [...new Set(empList.map(e => e.department).filter(Boolean))];

  const filtered = empList.filter(e => {
    const q = search.toLowerCase();
    const fullName = `${e.first_name || ''} ${e.last_name || ''}`.toLowerCase();
    const matchSearch = !q || fullName.includes(q) || e.email?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q);
    const matchDept = deptFilter === "all" || e.department === deptFilter;
    const matchPay = payFilter === "all" || e.payment_status === payFilter;
    return matchSearch && matchDept && matchPay;
  });

  const totalPayroll = filtered.reduce((s, e) => s + Number(e.salary || 0), 0);
  const paidCount = filtered.filter(e => e.payment_status === 'paid').length;
  const pendingCount = filtered.filter(e => e.payment_status !== 'paid').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        first_name: form.first_name, last_name: form.last_name,
        email: form.email, phone: form.phone || null,
        position: form.position, department: form.department,
        salary: Number(form.salary) || 0, hourly_rate: Number(form.hourly_rate) || 0,
        hire_date: form.hire_date || null, employment_type: form.employment_type,
        status: form.status, payment_status: form.payment_status,
      };
      if (editEmp) {
        await updateEmployee(editEmp.id, payload);
        toast.success("Umukozi wavuguruwe neza!");
        setEditEmp(null);
      } else {
        await addEmployee(payload);
        toast.success("Umukozi wongerewe neza!");
        setAddOpen(false);
      }
      setForm(EMPTY_FORM);
    } catch { toast.error("Habaye ikosa. Ongera ugerageze."); }
  };

  const handleEdit = (emp: any) => {
    setForm({
      first_name: emp.first_name || "", last_name: emp.last_name || "",
      email: emp.email || "", phone: emp.phone || "",
      position: emp.position || "", department: emp.department || "",
      salary: String(emp.salary || ""), hourly_rate: String(emp.hourly_rate || ""),
      hire_date: (emp.hire_date || "").substring(0, 10),
      employment_type: emp.employment_type || "full_time",
      status: emp.status || "active", payment_status: emp.payment_status || "pending",
    });
    setEditEmp(emp);
  };

  const handlePaymentToggle = async (emp: any) => {
    const newStatus = emp.payment_status === 'paid' ? 'pending' : 'paid';
    try {
      await updateEmployee(emp.id, { payment_status: newStatus });
      toast.success(newStatus === 'paid' ? "Bishyuwe!" : "Bihinduwe nk'Bitegereje");
    } catch { toast.error("Habaye ikosa."); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteEmployee(deleteConfirm.id);
      toast.success("Umukozi wasibwe neza!");
      setDeleteConfirm(null);
    } catch { toast.error("Habaye ikosa."); }
  };

  const handleProcessPayroll = async () => {
    try {
      await processPayroll();
      toast.success("Imishahara yatangazwe neza!");
    } catch { toast.error("Habaye ikosa."); }
  };

  const EmpForm = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Izina ry'Ibanze *</Label>
          <Input value={form.first_name} onChange={e => setForm(f => ({...f, first_name: e.target.value}))} required placeholder="Izina ry'ibanze" />
        </div>
        <div>
          <Label>Izina ry'Umuryango *</Label>
          <Input value={form.last_name} onChange={e => setForm(f => ({...f, last_name: e.target.value}))} required placeholder="Izina ry'umuryango" />
        </div>
        <div>
          <Label>Imeyili *</Label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required placeholder="email@mocmv.com" />
        </div>
        <div>
          <Label>Telefoni</Label>
          <Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+250 7XX XXX XXX" />
        </div>
        <div>
          <Label>Icyicaro *</Label>
          <Input value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value}))} required placeholder="Umuyobozi, Umukozi..." />
        </div>
        <div>
          <Label>Ishami *</Label>
          <Input value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} required placeholder="Ubucukuzi, Ubwubatsi..." />
        </div>
        <div>
          <Label>Umushahara (RWF)</Label>
          <Input type="number" value={form.salary} onChange={e => setForm(f => ({...f, salary: e.target.value}))} min="0" placeholder="0" />
        </div>
        <div>
          <Label>Igiciro cy'Isaha (RWF)</Label>
          <Input type="number" value={form.hourly_rate} onChange={e => setForm(f => ({...f, hourly_rate: e.target.value}))} min="0" placeholder="0" />
        </div>
        <div>
          <Label>Itariki yo Kwinjira</Label>
          <Input type="date" value={form.hire_date} onChange={e => setForm(f => ({...f, hire_date: e.target.value}))} />
        </div>
        <div>
          <Label>Ubwoko bw'Akazi</Label>
          <Select value={form.employment_type} onValueChange={v => setForm(f => ({...f, employment_type: v}))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Igihe Cyose</SelectItem>
              <SelectItem value="part_time">Igice cy'Igihe</SelectItem>
              <SelectItem value="contract">Amasezerano</SelectItem>
              <SelectItem value="temporary">Agateganyo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Imimerere</Label>
          <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Bikora</SelectItem>
              <SelectItem value="on_leave">Mu Kiruhuko</SelectItem>
              <SelectItem value="terminated">Byahagaritswe</SelectItem>
              <SelectItem value="resigned">Yasezereye</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Imimerere y'Ubwishyu</Label>
          <Select value={form.payment_status} onValueChange={v => setForm(f => ({...f, payment_status: v}))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Bishyuwe</SelectItem>
              <SelectItem value="pending">Bitegereje</SelectItem>
              <SelectItem value="overdue">Byarenze</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 bg-blue-800 hover:bg-blue-900" disabled={loading.employees}>
          {loading.employees ? "Gutegereza..." : editEmp ? "Vugurura" : "Shyiraho"}
        </Button>
        <Button type="button" variant="outline" onClick={() => { setEditEmp(null); setAddOpen(false); setForm(EMPTY_FORM); }}>Hagarika</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Abakozi Bose", value: filtered.length, icon: <Users className="w-5 h-5 text-blue-600" />, color: "bg-blue-50 border-blue-200" },
          { label: "Umushahara Wose", value: `${(totalPayroll/1000000).toFixed(1)}M RWF`, icon: <DollarSign className="w-5 h-5 text-green-600" />, color: "bg-green-50 border-green-200" },
          { label: "Bishyuwe", value: paidCount, icon: <CheckCircle className="w-5 h-5 text-green-600" />, color: "bg-green-50 border-green-200" },
          { label: "Bitegereje/Byarenze", value: pendingCount, icon: <AlertTriangle className="w-5 h-5 text-amber-600" />, color: "bg-amber-50 border-amber-200" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-lg border p-3 ${s.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
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
            <Input placeholder="Shakisha abakozi..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-36 h-9"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Ishami" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Amashami Yose</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={payFilter} onValueChange={setPayFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Ubwishyu" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Byose</SelectItem>
              <SelectItem value="paid">Bishyuwe</SelectItem>
              <SelectItem value="pending">Bitegereje</SelectItem>
              <SelectItem value="overdue">Byarenze</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 gap-2 border-green-300 text-green-700 hover:bg-green-50" onClick={handleProcessPayroll} disabled={loading.employees}>
            <DollarSign className="w-4 h-4" /> Tangaza Imishahara
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-800 hover:bg-blue-900 text-white gap-2 h-9">
                <Plus className="w-4 h-4" /> Ongeraho Umukozi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Ongeraho Umukozi Mushya</DialogTitle></DialogHeader>
              <EmpForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Excel-like Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-slate-300 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-green-900 to-green-800 text-white">
                {["#", "Amazina", "Icyicaro / Ishami", "Imeyili / Telefoni", "Umushahara", "Ubwoko", "Imimerere", "Ubwishyu", "Kwinjira", "Ibikorwa"]
                  .map((h, i) => (
                    <th key={i} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-green-700 last:border-r-0 whitespace-nowrap">{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading.employees ? (
                <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">Gutegereza amakuru...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">Nta mukozi wabonetse.</td></tr>
              ) : filtered.map((emp, idx) => {
                const pc = PAYMENT_CONFIG[emp.payment_status] || PAYMENT_CONFIG.pending;
                const sc = STATUS_CONFIG[emp.status] || STATUS_CONFIG.active;
                return (
                  <tr key={emp.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-green-50/40 transition-colors`}>
                    <td className="px-3 py-2.5 text-xs text-slate-500 border-r border-slate-100 font-mono">{idx + 1}</td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <div className="font-semibold text-slate-800">{emp.first_name} {emp.last_name}</div>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <div className="text-xs font-medium">{emp.position || '-'}</div>
                      <div className="text-xs text-slate-500">{emp.department || '-'}</div>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <div className="flex items-center gap-1 text-xs text-slate-600"><Mail className="w-3 h-3" />{emp.email}</div>
                      {emp.phone && <div className="flex items-center gap-1 text-xs text-slate-500"><Phone className="w-3 h-3" />{emp.phone}</div>}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100 font-bold text-green-700 text-xs whitespace-nowrap">
                      {Number(emp.salary || 0).toLocaleString()} RWF
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100 text-xs capitalize text-slate-600">
                      {emp.employment_type?.replace('_', ' ') || '-'}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <button onClick={() => handlePaymentToggle(emp)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${pc.bg} ${pc.text} hover:opacity-80 transition-opacity cursor-pointer`}>
                        {emp.payment_status === 'paid' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {pc.label}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100 text-xs text-slate-600">
                      {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('rw-RW') : '-'}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-700" onClick={() => handleEdit(emp)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-700" onClick={() => setDeleteConfirm(emp)}>
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
                <tr className="bg-green-50 border-t-2 border-green-300">
                  <td colSpan={4} className="px-3 py-2 text-xs font-bold text-slate-700">Igiteranyo ({filtered.length} abakozi)</td>
                  <td className="px-3 py-2 text-xs font-bold text-green-800">{totalPayroll.toLocaleString()} RWF</td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editEmp} onOpenChange={o => { if (!o) { setEditEmp(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Hindura Umukozi</DialogTitle></DialogHeader>
          {editEmp && <EmpForm />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-red-600">Emeza Gusiba</DialogTitle></DialogHeader>
          <p className="text-sm">Urafasha gusiba umukozi: <strong>"{deleteConfirm?.first_name} {deleteConfirm?.last_name}"</strong>?</p>
          <div className="flex gap-2 pt-2">
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Yego, siba</Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Hagarika</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
