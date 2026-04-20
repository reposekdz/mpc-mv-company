import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import type { Truck, TruckStatus } from "@/types";
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Fuel,
  Gauge,
  Wrench,
  User,
  Truck as TruckIcon,
} from "lucide-react";

export function TrucksPage() {
  const { t } = useTranslation();
  const { trucks, addTruck, updateTruck, deleteTruck } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editTruck, setEditTruck] = useState<Truck | null>(null);

  const statusConfig: Record<TruckStatus, { label: string; color: string }> = {
    available: { label: t("trucks.available"), color: "bg-hunter/10 text-hunter border-hunter/20" },
    in_use: { label: t("trucks.inUse"), color: "bg-steel/10 text-steel border-steel/20" },
    maintenance: { label: t("trucks.maintenance"), color: "bg-amber/10 text-amber border-amber/20" },
    out_of_service: { label: t("trucks.outOfService"), color: "bg-iron/10 text-iron border-iron/20" },
  };

  const filtered = trucks.filter((tr) => {
    const matchesSearch = tr.name.toLowerCase().includes(search.toLowerCase()) ||
      tr.plateNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || tr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newTruck: Truck = {
      id: `t${Date.now()}`,
      name: fd.get("name") as string,
      plateNumber: fd.get("plateNumber") as string,
      model: fd.get("model") as string,
      year: Number(fd.get("year")),
      status: "available",
      driver: fd.get("driver") as string || t("trucks.unassigned"),
      assignedJob: "N/A",
      fuelLevel: 100,
      mileage: Number(fd.get("mileage")),
      lastMaintenance: fd.get("lastMaintenance") as string,
      nextMaintenance: fd.get("nextMaintenance") as string,
    };
    addTruck(newTruck);
    setAddOpen(false);
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTruck) return;
    const fd = new FormData(e.currentTarget);
    updateTruck(editTruck.id, {
      name: fd.get("name") as string,
      plateNumber: fd.get("plateNumber") as string,
      model: fd.get("model") as string,
      year: Number(fd.get("year")),
      status: fd.get("status") as TruckStatus,
      driver: fd.get("driver") as string,
      mileage: Number(fd.get("mileage")),
    });
    setEditTruck(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("trucks.searchTrucks")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder={t("jobs.status")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("trucks.allStatus")}</SelectItem>
              <SelectItem value="available">{t("trucks.available")}</SelectItem>
              <SelectItem value="in_use">{t("trucks.inUse")}</SelectItem>
              <SelectItem value="maintenance">{t("trucks.maintenance")}</SelectItem>
              <SelectItem value="out_of_service">{t("trucks.outOfService")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-steel hover:bg-steel-dark gap-2"><Plus className="w-4 h-4" />{t("trucks.addTruck")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="heading-md">{t("trucks.addTruck")}</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>{t("trucks.name")}</Label><Input name="name" required /></div>
                <div><Label>{t("trucks.plateNumber")}</Label><Input name="plateNumber" required /></div>
                <div><Label>{t("trucks.model")}</Label><Input name="model" required /></div>
                <div><Label>{t("trucks.year")}</Label><Input name="year" type="number" required /></div>
                <div><Label>{t("trucks.driver")}</Label><Input name="driver" placeholder={t("trucks.unassigned")} /></div>
                <div><Label>{t("trucks.mileage")} (km)</Label><Input name="mileage" type="number" defaultValue={0} /></div>
                <div><Label>{t("trucks.lastMaintenance")}</Label><Input name="lastMaintenance" type="date" required /></div>
                <div><Label>{t("trucks.nextMaintenance")}</Label><Input name="nextMaintenance" type="date" required /></div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">{t("trucks.addTruck")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((truck, i) => (
          <motion.div key={truck.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-steel/10 flex items-center justify-center">
                      <TruckIcon className="w-5 h-5 text-steel" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{truck.name}</div>
                      <div className="text-xs text-muted-foreground">{truck.plateNumber}</div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTruck(truck)}><Edit className="w-3.5 h-3.5 mr-2" />{t("common.edit")}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => deleteTruck(truck.id)} className="text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" />{t("common.delete")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Badge variant="secondary" className={`text-[10px] mb-4 ${statusConfig[truck.status].color}`}>
                  {statusConfig[truck.status].label}
                </Badge>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Gauge className="w-3 h-3" />{t("trucks.model")}</span>
                    <span className="font-medium">{truck.model} ({truck.year})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><User className="w-3 h-3" />{t("trucks.driver")}</span>
                    <span className="font-medium">{truck.driver}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Fuel className="w-3 h-3" />{t("trucks.fuel")}</span>
                      <span className="font-medium">{truck.fuelLevel}%</span>
                    </div>
                    <Progress value={truck.fuelLevel} className="h-1.5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Wrench className="w-3 h-3" />{t("trucks.mileage")}</span>
                    <span className="font-medium">{truck.mileage.toLocaleString()} km</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!editTruck} onOpenChange={(o) => !o && setEditTruck(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="heading-md">{t("trucks.editTruck")}</DialogTitle></DialogHeader>
          {editTruck && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>{t("trucks.name")}</Label><Input name="name" defaultValue={editTruck.name} required /></div>
                <div><Label>{t("trucks.plateNumber")}</Label><Input name="plateNumber" defaultValue={editTruck.plateNumber} required /></div>
                <div><Label>{t("trucks.model")}</Label><Input name="model" defaultValue={editTruck.model} required /></div>
                <div><Label>{t("trucks.year")}</Label><Input name="year" type="number" defaultValue={editTruck.year} required /></div>
                <div>
                  <Label>{t("jobs.status")}</Label>
                  <Select name="status" defaultValue={editTruck.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">{t("trucks.available")}</SelectItem>
                      <SelectItem value="in_use">{t("trucks.inUse")}</SelectItem>
                      <SelectItem value="maintenance">{t("trucks.maintenance")}</SelectItem>
                      <SelectItem value="out_of_service">{t("trucks.outOfService")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{t("trucks.driver")}</Label><Input name="driver" defaultValue={editTruck.driver} required /></div>
                <div><Label>{t("trucks.mileage")} (km)</Label><Input name="mileage" type="number" defaultValue={editTruck.mileage} /></div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">{t("trucks.updateTruck")}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
