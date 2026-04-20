import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  MapPin,
  Calendar,
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
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-steel hover:bg-steel-dark gap-2">
              <Plus className="w-4 h-4" />
              Add New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="heading-md">Add New Job</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={2} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select name="type" defaultValue="construction">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mining">Mining</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input id="assignedTo" name="assignedTo" required />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" required />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
                <div>
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input id="budget" name="budget" type="number" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">Create Job</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Budget</TableHead>
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
                      <Badge variant="secondary" className="text-[10px] capitalize">{job.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${statusColors[job.status]}`}>
                        {job.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${priorityColors[job.priority]}`}>
                        {job.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-20">
                        <Progress value={job.progress} className="h-1.5" />
                        <span className="text-[10px] text-muted-foreground">{job.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">${job.budget.toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditJob(job)}>
                            <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteJob(job.id)} className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editJob} onOpenChange={(o) => !o && setEditJob(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="heading-md">Edit Job</DialogTitle>
          </DialogHeader>
          {editJob && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Job Title</Label>
                  <Input name="title" defaultValue={editJob.title} required />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea name="description" defaultValue={editJob.description} rows={2} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select name="type" defaultValue={editJob.type}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mining">Mining</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editJob.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue={editJob.priority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <Input name="assignedTo" defaultValue={editJob.assignedTo} required />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input name="location" defaultValue={editJob.location} required />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input name="startDate" type="date" defaultValue={editJob.startDate} required />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input name="endDate" type="date" defaultValue={editJob.endDate} required />
                </div>
                <div>
                  <Label>Budget ($)</Label>
                  <Input name="budget" type="number" defaultValue={editJob.budget} required />
                </div>
                <div>
                  <Label>Progress (%)</Label>
                  <Input name="progress" type="number" min={0} max={100} defaultValue={editJob.progress} required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">Update Job</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
