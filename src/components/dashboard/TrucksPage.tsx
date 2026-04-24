import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import { Plus, Search, Edit, Trash2, Fuel, Gauge, Wrench, MapPin, Truck as TruckIcon, Filter } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  available: { label: "Bihari", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  in_use: { label: "Bikoreshwa", bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  maintenance: { label: "Gutunganya", bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  out_of_service: { label: "Ntibikora", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
};

const EMPTY_FORM = {
  name: "", plate_number: "", type: "truck", model: "", year: "",
  status: "available", driver_id: "", fuel_level: "100", mileage: "0",
  last_maintenance: "", next_maintenance: "", current_location: "", value: "", purchase_date: "",
};

export function TrucksPage() {
  const { trucks, fetchTrucks, addTruck, updateTruck, deleteTruck, loading } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editTruck, setEditTruck] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchTrucks(); }, []);

  const filtered = (Array.isArray(trucks) ? trucks : []).filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name?.toLowerCase().includes(q) || t.plate_number?.toLowerCase().includes(q) || t.model?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: filtered.length,
    available: filtered.filter(t => t.status === 'available').length,
    in_use: filtered.filter(t => t.status === 'in_use').length,
    maintenance: filtered.filter(t => t.status === 'maintenance').length,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name, plate_number: form.plate_number, type: form.type,
        model: form.model || null, year: Number(form.year) || null,
        status: form.status, driver_id: form.driver_id || null,
        fuel_level: Number(form.fuel_level) || 100, mileage: Number(form.mileage) || 0,
        last_maintenance: form.last_maintenance || null, next_maintenance: form.next_maintenance || null,
        current_location: form.current_location || null, value: Number(form.value) || 0,
        purchase_date: form.purchase_date || null,
      };
      if (editTruck) {
        await updateTruck(editTruck.id, payload);
        toast.success("Ikinyabiziga cyavuguruwe neza!");
        setEditTruck(null);
      } else {
        await addTruck(payload);
        toast.success("Ikinyabiziga cyongerewe neza!");
        setAddOpen(false);
      }
      setForm(EMPTY_FORM);
    } catch { toast.error("Habaye ikosa. Ongera ugerageze."); }
  };

  const handleEdit = (truck: any) => {
    setForm({
      name: truck.name || "", plate_number: truck.plate_number || "",
      type: truck.type || "truck", model: truck.model || "", year: String(truck.year || ""),
      status: truck.status || "available", driver_id: String(truck.driver_id || ""),
      fuel_level: String(truck.fuel_level || 100), mileage: String(truck.mileage || 0),
      last_maintenance: (truck.last_maintenance || "").substring(0, 10),
      next_maintenance: (truck.next_maintenance || "").substring(0, 10),
      current_location: truck.current_location || "", value: String(truck.value || ""),
      purchase_date: (truck.purchase_date || "").substring(0, 10),
    });
    setEditTruck(truck);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTruck(deleteConfirm.id);
      toast.success("Ikinyabiziga cyasibwe neza!");
      setDeleteConfirm(null);
    } catch { toast.error("Habaye ikosa."); }
  };

  const fuelColor = (level: number) => {
    if (level >= 60) return "text-green-600";
    if (level >= 30) return "text-amber-600";
    return "text-red-600";
  };

  const TruckForm = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Izina *</Label>
          <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required placeholder="Izina ry'ikinyabiziga" />
        </div>
        <div>
          <Label>Iplaki *</Label>
          <Input value={form.plate_number} onChange={e => setForm(f => ({...f, plate_number: e.target.value}))} required placeholder="RAA 001 A" />
        </div>
        <div>
          <Label>Ubwoko</Label>
          <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="truck">Kamyo</SelectItem>
              <SelectItem value="excavator">Excavator</SelectItem>
              <SelectItem value="crane">Crane</SelectItem>
              <SelectItem value="bulldozer">Bulldozer</SelectItem>
              <SelectItem value="other">Ibindi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Imimerere</Label>
          <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Bihari</SelectItem>
              <SelectItem value="in_use">Bikoreshwa</SelectItem>
              <SelectItem value="maintenance">Gutunganya</SelectItem>
              <SelectItem value="out_of_service">Ntibikora</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Modeli</Label>
          <Input value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))} placeholder="Volvo FH16..." />
        </div>
        <div>
          <Label>Umwaka</Label>
          <Input type="number" value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))} placeholder="2020" min="1990" max="2030" />
        </div>
        <div>
          <Label>Peteroli (%)</Label>
          <Input type="number" value={form.fuel_level} onChange={e => setForm(f => ({...f, fuel_level: e.target.value}))} min="0" max="100" />
        </div>
        <div>
          <Label>Kilometero</Label>
          <Input type="number" value={form.mileage} onChange={e => setForm(f => ({...f, mileage: e.target.value}))} min="0" />
        </div>
        <div>
          <Label>Gutunganya kwa Nyuma</Label>
          <Input type="date" value={form.last_maintenance} onChange={e => setForm(f => ({...f, last_maintenance: e.target.value}))} />
        </div>
        <div>
          <Label>Gutunganya Gukurikira</Label>
          <Input type="date" value={form.next_maintenance} onChange={e => setForm(f => ({...f, next_maintenance: e.target.value}))} />
        </div>
        <div className="col-span-2">
          <Label>Ahantu Hiriho</Label>
          <Input value={form.current_location} onChange={e => setForm(f => ({...f, current_location: e.target.value}))} placeholder="Kigali, Musanze..." />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 bg-blue-800 hover:bg-blue-900" disabled={loading.trucks}>
          {loading.trucks ? "Gutegereza..." : editTruck ? "Vugurura" : "Shyiraho"}
        </Button>
        <Button type="button" variant="outline" onClick={() => { setEditTruck(null); setAddOpen(false); setForm(EMPTY_FORM); }}>Hagarika</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Ibinyabiziga Byose", value: stats.total, color: "bg-blue-50 border-blue-200", dot: "bg-blue-500" },
          { label: "Bihari", value: stats.available, color: "bg-green-50 border-green-200", dot: "bg-green-500" },
          { label: "Bikoreshwa", value: stats.in_use, color: "bg-blue-50 border-blue-200", dot: "bg-blue-400" },
          { label: "Gutunganya", value: stats.maintenance, color: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-lg border p-3 ${s.color}`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${s.dot}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Shakisha ibinyabiziga..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Imimerere Yose</SelectItem>
              <SelectItem value="available">Bihari</SelectItem>
              <SelectItem value="in_use">Bikoreshwa</SelectItem>
              <SelectItem value="maintenance">Gutunganya</SelectItem>
              <SelectItem value="out_of_service">Ntibikora</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900 text-white gap-2 h-9">
              <Plus className="w-4 h-4" /> Ongeraho Ikinyabiziga
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Ongeraho Ikinyabiziga Gishya</DialogTitle></DialogHeader>
            <TruckForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Excel-like Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-slate-300 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                {["#", "Izina", "Iplaki", "Ubwoko", "Imimerere", "Peteroli", "Kilometero", "Ahantu", "Gutunganya", "Ibikorwa"]
                  .map((h, i) => (
                    <th key={i} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-slate-600 last:border-r-0 whitespace-nowrap">{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading.trucks ? (
                <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">Gutegereza amakuru...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">
                  Nta binyabiziga byabonetse.
                </td></tr>
              ) : filtered.map((truck, idx) => {
                const sc = STATUS_CONFIG[truck.status] || STATUS_CONFIG.available;
                const fuel = Number(truck.fuel_level || 0);
                const nextMaint = truck.next_maintenance ? new Date(truck.next_maintenance) : null;
                const isMaintenanceDue = nextMaint && nextMaint < new Date();
                return (
                  <tr key={truck.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-slate-100/70 transition-colors`}>
                    <td className="px-3 py-2.5 text-xs text-slate-500 border-r border-slate-100 font-mono">{idx + 1}</td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <TruckIcon className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-800">{truck.name}</span>
                      </div>
                      {truck.model && <div className="text-xs text-slate-500 pl-6">{truck.model} {truck.year && `(${truck.year})`}</div>}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100 font-mono text-xs font-bold text-slate-700">{truck.plate_number}</td>
                    <td className="px-3 py-2.5 border-r border-slate-100 text-xs capitalize">{truck.type || '-'}</td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <Fuel className={`w-3.5 h-3.5 ${fuelColor(fuel)}`} />
                        <Progress value={fuel} className="h-2 w-14" />
                        <span className={`text-xs font-medium ${fuelColor(fuel)}`}>{fuel}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <div className="flex items-center gap-1 text-xs">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        <span>{Number(truck.mileage || 0).toLocaleString()} km</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      {truck.current_location ? (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[100px]">{truck.current_location}</span>
                        </div>
                      ) : <span className="text-xs text-slate-400">-</span>}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <div className={`flex items-center gap-1 text-xs ${isMaintenanceDue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                        <Wrench className="w-3 h-3" />
                        {truck.next_maintenance ? new Date(truck.next_maintenance).toLocaleDateString('rw-RW') : '-'}
                        {isMaintenanceDue && <span className="text-red-500 text-[10px]">!</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-700" onClick={() => handleEdit(truck)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-700" onClick={() => setDeleteConfirm(truck)}>
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
      <Dialog open={!!editTruck} onOpenChange={o => { if (!o) { setEditTruck(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Hindura Ikinyabiziga</DialogTitle></DialogHeader>
          {editTruck && <TruckForm />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-red-600">Emeza Gusiba</DialogTitle></DialogHeader>
          <p className="text-sm">Urafasha gusiba ikinyabiziga: <strong>"{deleteConfirm?.name} ({deleteConfirm?.plate_number})"</strong>?</p>
          <div className="flex gap-2 pt-2">
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Yego, siba</Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Hagarika</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
