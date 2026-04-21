import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { Job, JobStatus, JobPriority } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  MapPin,
  Filter,
} from "lucide-react";

const statusColors: Record<JobStatus, string> = {
  pending: "bg-slate-steel/10 text-slate-steel",
  in_progress: "bg-steel/10 text-steel",
  completed: "bg-hunter/10 text-hunter",
  on_hold: "bg-amber/10 text-amber",
  cancelled: "bg-iron/10 text-iron",
};

const priorityColors: Record<JobPriority, string> = {
  low: "bg-slate-steel/10 text-slate-steel",
  medium: "bg-steel/10 text-steel",
  high: "bg-amber/10 text-amber",
  critical: "bg-iron/10 text-iron",
};

export function JobsPage() {
  const { t } = useTranslation();
  const { jobs, addJob, updateJob, deleteJob } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);

  const filtered = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: t("jobs.pending"),
      in_progress: t("jobs.inProgress"),
      completed: t("jobs.completed"),
      on_hold: t("jobs.onHold"),
      cancelled: t("jobs.cancelled"),
    };
    return map[status] || status;
  };

  const priorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      low: t("jobs.low"),
      medium: t("jobs.medium"),
      high: t("jobs.high"),
      critical: t("jobs.critical"),
    };
    return map[priority] || priority;
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newJob: Job = {
      id: `j${Date.now()}`,
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      status: "pending",
      priority: fd.get("priority") as JobPriority,
      assignedTo: fd.get("assignedTo") as string,
      location: fd.get("location") as string,
      startDate: fd.get("startDate") as string,
      endDate: fd.get("endDate") as string,
      budget: Number(fd.get("budget")),
      progress: 0,
      type: fd.get("type") as "mining" | "construction",
    };
    addJob(newJob);
    setAddOpen(false);
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editJob) return;
    const fd = new FormData(e.currentTarget);
    updateJob(editJob.id, {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      priority: fd.get("priority") as JobPriority,
      status: fd.get("status") as JobStatus,
      assignedTo: fd.get("assignedTo") as string,
      location: fd.get("location") as string,
      startDate: fd.get("startDate") as string,
      endDate: fd.get("endDate") as string,
      budget: Number(fd.get("budget")),
      progress: Number(fd.get("progress")),
      type: fd.get("type") as "mining" | "construction",
    });
    setEditJob(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("jobs.searchJobs")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder={t("jobs.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("jobs.allStatus")}</SelectItem>
              <SelectItem value="pending">{t("jobs.pending")}</SelectItem>
              <SelectItem value="in_progress">{t("jobs.inProgress")}</SelectItem>
              <SelectItem value="completed">{t("jobs.completed")}</SelectItem>
              <SelectItem value="on_hold">{t("jobs.onHold")}</SelectItem>
              <SelectItem value="cancelled">{t("jobs.cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-steel hover:bg-steel-dark gap-2">
              <Plus className="w-4 h-4" />
              {t("jobs.addNewJob")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="heading-md">{t("jobs.addNewJob")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">{t("jobs.jobTitle")}</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">{t("jobs.description")}</Label>
                  <Textarea id="description" name="description" rows={2} />
                </div>
                <div>
                  <Label>{t("jobs.type")}</Label>
                  <Select name="type" defaultValue="construction">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mining">{t("jobs.mining")}</SelectItem>
                      <SelectItem value="construction">{t("jobs.construction")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("jobs.priority")}</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("jobs.low")}</SelectItem>
                      <SelectItem value="medium">{t("jobs.medium")}</SelectItem>
                      <SelectItem value="high">{t("jobs.high")}</SelectItem>
                      <SelectItem value="critical">{t("jobs.critical")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignedTo">{t("jobs.assignedTo")}</Label>
                  <Input id="assignedTo" name="assignedTo" required />
                </div>
                <div>
                  <Label htmlFor="location">{t("jobs.location")}</Label>
                  <Input id="location" name="location" required />
                </div>
                <div>
                  <Label htmlFor="startDate">{t("jobs.startDate")}</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div>
                  <Label htmlFor="endDate">{t("jobs.endDate")}</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
                <div>
                  <Label htmlFor="budget">{t("jobs.budget")} ($)</Label>
                  <Input id="budget" name="budget" type="number" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">{t("jobs.createJob")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("jobs.jobTitle")}</TableHead>
                  <TableHead>{t("jobs.type")}</TableHead>
                  <TableHead>{t("jobs.status")}</TableHead>
                  <TableHead>{t("jobs.priority")}</TableHead>
                  <TableHead>{t("jobs.progress")}</TableHead>
                  <TableHead>{t("jobs.budget")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{job.title}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {job.type === "mining" ? t("jobs.mining") : t("jobs.construction")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${statusColors[job.status]}`}>
                        {statusLabel(job.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${priorityColors[job.priority]}`}>
                        {priorityLabel(job.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-20">
                        <Progress value={job.progress} className="h-1.5" />
                        <span className="text-[10px] text-muted-foreground">{job.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatCurrency(job.budget)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditJob(job)}>
                            <Edit className="w-3.5 h-3.5 mr-2" /> {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteJob(job.id)} className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      {t("jobs.noJobsFound")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={!!editJob} onOpenChange={(o) => !o && setEditJob(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="heading-md">{t("jobs.editJob")}</DialogTitle>
          </DialogHeader>
          {editJob && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>{t("jobs.jobTitle")}</Label>
                  <Input name="title" defaultValue={editJob.title} required />
                </div>
                <div className="col-span-2">
                  <Label>{t("jobs.description")}</Label>
                  <Textarea name="description" defaultValue={editJob.description} rows={2} />
                </div>
                <div>
                  <Label>{t("jobs.type")}</Label>
                  <Select name="type" defaultValue={editJob.type}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mining">{t("jobs.mining")}</SelectItem>
                      <SelectItem value="construction">{t("jobs.construction")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("jobs.status")}</Label>
                  <Select name="status" defaultValue={editJob.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t("jobs.pending")}</SelectItem>
                      <SelectItem value="in_progress">{t("jobs.inProgress")}</SelectItem>
                      <SelectItem value="completed">{t("jobs.completed")}</SelectItem>
                      <SelectItem value="on_hold">{t("jobs.onHold")}</SelectItem>
                      <SelectItem value="cancelled">{t("jobs.cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("jobs.priority")}</Label>
                  <Select name="priority" defaultValue={editJob.priority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("jobs.low")}</SelectItem>
                      <SelectItem value="medium">{t("jobs.medium")}</SelectItem>
                      <SelectItem value="high">{t("jobs.high")}</SelectItem>
                      <SelectItem value="critical">{t("jobs.critical")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("jobs.assignedTo")}</Label>
                  <Input name="assignedTo" defaultValue={editJob.assignedTo} required />
                </div>
                <div>
                  <Label>{t("jobs.location")}</Label>
                  <Input name="location" defaultValue={editJob.location} required />
                </div>
                <div>
                  <Label>{t("jobs.startDate")}</Label>
                  <Input name="startDate" type="date" defaultValue={editJob.startDate} required />
                </div>
                <div>
                  <Label>{t("jobs.endDate")}</Label>
                  <Input name="endDate" type="date" defaultValue={editJob.endDate} required />
                </div>
                <div>
                  <Label>{t("jobs.budget")} ($)</Label>
                  <Input name="budget" type="number" defaultValue={editJob.budget} required />
                </div>
                <div>
                  <Label>{t("jobs.progress")} (%)</Label>
                  <Input name="progress" type="number" min={0} max={100} defaultValue={editJob.progress} required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">{t("jobs.updateJob")}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
