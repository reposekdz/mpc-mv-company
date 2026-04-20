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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import type { Meeting, MeetingStatus, MeetingPriority } from "@/types";
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Calendar,
  Clock,
  MapPin,
  Users,
  Filter,
  FileText,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  CalendarDays,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export function MeetingsPage() {
  const { t } = useTranslation();
  const { meetings, addMeeting, updateMeeting, deleteMeeting } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null);
  const [meetingNotes, setMeetingNotes] = useState("");

  const statusConfig: Record<MeetingStatus, { label: string; color: string }> = {
    scheduled: { label: t("meetings.scheduled"), color: "bg-steel/10 text-steel" },
    in_progress: { label: t("meetings.inProgress"), color: "bg-amber/10 text-amber" },
    completed: { label: t("meetings.completed"), color: "bg-hunter/10 text-hunter" },
    cancelled: { label: t("meetings.cancelled"), color: "bg-iron/10 text-iron" },
  };

  const priorityConfig: Record<MeetingPriority, { label: string; color: string }> = {
    normal: { label: t("meetings.normal"), color: "bg-slate-steel/10 text-slate-steel" },
    important: { label: t("meetings.important"), color: "bg-amber/10 text-amber" },
    urgent: { label: t("meetings.urgent"), color: "bg-iron/10 text-iron" },
  };

  const filtered = meetings.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.organizer.toLowerCase().includes(search.toLowerCase()) ||
      m.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const today = new Date().toISOString().split("T")[0];
  const scheduledCount = meetings.filter((m) => m.status === "scheduled").length;
  const completedCount = meetings.filter((m) => m.status === "completed").length;
  const todayCount = meetings.filter((m) => m.date === today).length;

  const kpis = [
    { title: t("meetings.totalMeetings"), value: meetings.length.toString(), icon: CalendarDays, color: "text-steel", bg: "bg-steel/10" },
    { title: t("meetings.upcoming"), value: scheduledCount.toString(), icon: Calendar, color: "text-amber", bg: "bg-amber/10" },
    { title: t("meetings.completedCount"), value: completedCount.toString(), icon: CalendarCheck, color: "text-hunter", bg: "bg-hunter/10" },
    { title: t("meetings.todaysMeetings"), value: todayCount.toString(), icon: Clock, color: "text-steel", bg: "bg-steel/10" },
  ];

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const attendeesStr = fd.get("attendees") as string;
    const newMeeting: Meeting = {
      id: `m${Date.now()}`,
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      date: fd.get("date") as string,
      startTime: fd.get("startTime") as string,
      endTime: fd.get("endTime") as string,
      location: fd.get("location") as string,
      organizer: fd.get("organizer") as string,
      attendees: attendeesStr.split(",").map((a) => a.trim()).filter(Boolean),
      status: "scheduled",
      priority: fd.get("priority") as MeetingPriority,
      notes: "",
      agenda: fd.get("agenda") as string,
    };
    addMeeting(newMeeting);
    setAddOpen(false);
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editMeeting) return;
    const fd = new FormData(e.currentTarget);
    const attendeesStr = fd.get("attendees") as string;
    updateMeeting(editMeeting.id, {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      date: fd.get("date") as string,
      startTime: fd.get("startTime") as string,
      endTime: fd.get("endTime") as string,
      location: fd.get("location") as string,
      organizer: fd.get("organizer") as string,
      attendees: attendeesStr.split(",").map((a) => a.trim()).filter(Boolean),
      status: fd.get("status") as MeetingStatus,
      priority: fd.get("priority") as MeetingPriority,
      agenda: fd.get("agenda") as string,
    });
    setEditMeeting(null);
  };

  const handleSaveNotes = () => {
    if (!detailMeeting) return;
    updateMeeting(detailMeeting.id, { notes: meetingNotes });
    setDetailMeeting({ ...detailMeeting, notes: meetingNotes });
  };

  const activeDetail = detailMeeting
    ? meetings.find((m) => m.id === detailMeeting.id) || detailMeeting
    : null;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.title} custom={i} initial="hidden" animate="visible" variants={fadeIn}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{kpi.title}</div>
                    <div className="heading-md text-foreground">{kpi.value}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("meetings.searchMeetings")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder={t("meetings.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("meetings.allStatus")}</SelectItem>
              <SelectItem value="scheduled">{t("meetings.scheduled")}</SelectItem>
              <SelectItem value="in_progress">{t("meetings.inProgress")}</SelectItem>
              <SelectItem value="completed">{t("meetings.completed")}</SelectItem>
              <SelectItem value="cancelled">{t("meetings.cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-steel hover:bg-steel-dark gap-2">
              <Plus className="w-4 h-4" />
              {t("meetings.addMeeting")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="heading-md">{t("meetings.addMeeting")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>{t("meetings.meetingTitle")}</Label>
                  <Input name="title" required />
                </div>
                <div className="col-span-2">
                  <Label>{t("meetings.description")}</Label>
                  <Textarea name="description" rows={2} />
                </div>
                <div>
                  <Label>{t("meetings.date")}</Label>
                  <Input name="date" type="date" required />
                </div>
                <div>
                  <Label>{t("meetings.priority")}</Label>
                  <Select name="priority" defaultValue="normal">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{t("meetings.normal")}</SelectItem>
                      <SelectItem value="important">{t("meetings.important")}</SelectItem>
                      <SelectItem value="urgent">{t("meetings.urgent")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("meetings.startTime")}</Label>
                  <Input name="startTime" type="time" required />
                </div>
                <div>
                  <Label>{t("meetings.endTime")}</Label>
                  <Input name="endTime" type="time" required />
                </div>
                <div>
                  <Label>{t("meetings.location")}</Label>
                  <Input name="location" required />
                </div>
                <div>
                  <Label>{t("meetings.organizer")}</Label>
                  <Input name="organizer" required />
                </div>
                <div className="col-span-2">
                  <Label>{t("meetings.attendees")}</Label>
                  <Input name="attendees" placeholder={t("meetings.attendeesPlaceholder")} required />
                </div>
                <div className="col-span-2">
                  <Label>{t("meetings.agenda")}</Label>
                  <Textarea name="agenda" rows={3} placeholder={t("meetings.agendaPlaceholder")} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">{t("meetings.createMeeting")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Meeting Cards + Detail */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <ScrollArea className={filtered.length > 5 ? "h-[600px]" : ""}>
            <div className="space-y-3 pr-2">
              {filtered.map((meeting, i) => {
                const isActive = activeDetail?.id === meeting.id;
                return (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isActive ? "ring-2 ring-steel shadow-md" : ""
                      }`}
                      onClick={() => {
                        const fresh = meetings.find((m) => m.id === meeting.id) || meeting;
                        setDetailMeeting(fresh);
                        setMeetingNotes(fresh.notes);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-semibold leading-snug flex-1">{meeting.title}</h3>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className={`text-[10px] shrink-0 ${priorityConfig[meeting.priority].color}`}>
                              {priorityConfig[meeting.priority].label}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditMeeting(meeting); }}>
                                  <Edit className="w-3.5 h-3.5 mr-2" /> {t("common.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteMeeting(meeting.id); }} className="text-destructive">
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> {t("common.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className={`text-[10px] ${statusConfig[meeting.status].color}`}>
                            {statusConfig[meeting.status].label}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {meeting.date} · {meeting.startTime} - {meeting.endTime}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {meeting.location}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3" />
                            {meeting.attendees.length + 1} {t("meetings.attendees").toLowerCase()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center text-muted-foreground py-16">
                  <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>{t("meetings.noMeetingsFound")}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-3">
          {activeDetail ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="heading-sm mb-2">{activeDetail.title}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={`text-[10px] ${statusConfig[activeDetail.status].color}`}>
                          {statusConfig[activeDetail.status].label}
                        </Badge>
                        <Badge variant="secondary" className={`text-[10px] ${priorityConfig[activeDetail.priority].color}`}>
                          {priorityConfig[activeDetail.priority].label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {activeDetail.status === "scheduled" && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-steel border-steel/30 hover:bg-steel/10"
                          onClick={() => updateMeeting(activeDetail.id, { status: "in_progress" })}>
                          <Play className="w-3.5 h-3.5" />{t("meetings.startMeeting")}
                        </Button>
                      )}
                      {activeDetail.status === "in_progress" && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-hunter border-hunter/30 hover:bg-hunter/10"
                          onClick={() => updateMeeting(activeDetail.id, { status: "completed" })}>
                          <CheckCircle2 className="w-3.5 h-3.5" />{t("meetings.completeMeeting")}
                        </Button>
                      )}
                      {(activeDetail.status === "scheduled" || activeDetail.status === "in_progress") && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-iron border-iron/30 hover:bg-iron/10"
                          onClick={() => updateMeeting(activeDetail.id, { status: "cancelled" })}>
                          <XCircle className="w-3.5 h-3.5" />{t("meetings.cancelMeeting")}
                        </Button>
                      )}
                      {(activeDetail.status === "completed" || activeDetail.status === "cancelled") && (
                        <Button size="sm" variant="outline" className="gap-1.5"
                          onClick={() => updateMeeting(activeDetail.id, { status: "scheduled" })}>
                          <RotateCcw className="w-3.5 h-3.5" />{t("meetings.reopenMeeting")}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">{t("meetings.date")}</div>
                        <div className="font-medium">{activeDetail.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">{t("meetings.startTime")} - {t("meetings.endTime")}</div>
                        <div className="font-medium">{activeDetail.startTime} - {activeDetail.endTime}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">{t("meetings.location")}</div>
                        <div className="font-medium">{activeDetail.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">{t("meetings.organizer")}</div>
                        <div className="font-medium">{activeDetail.organizer}</div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {activeDetail.description && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{t("meetings.description")}</h4>
                      <p className="text-sm text-foreground leading-relaxed p-3 rounded-lg bg-muted/30">{activeDetail.description}</p>
                    </div>
                  )}

                  {/* Attendees */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{t("meetings.attendees")} ({activeDetail.attendees.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {activeDetail.attendees.map((attendee) => (
                        <Badge key={attendee} variant="secondary" className="text-xs">{attendee}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Agenda */}
                  {activeDetail.agenda && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{t("meetings.agenda")}</h4>
                      <div className="p-3 rounded-lg bg-muted/30 text-sm whitespace-pre-line">{activeDetail.agenda}</div>
                    </div>
                  )}

                  <Separator />

                  {/* Notes */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{t("meetings.notes")}</h4>
                    <Textarea
                      value={meetingNotes}
                      onChange={(e) => setMeetingNotes(e.target.value)}
                      placeholder={t("meetings.notesPlaceholder")}
                      rows={4}
                      className="resize-none"
                    />
                    <Button
                      size="sm"
                      className="mt-2 bg-steel hover:bg-steel-dark gap-1.5"
                      onClick={handleSaveNotes}
                      disabled={meetingNotes === activeDetail.notes}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {t("meetings.addNotes")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <CardContent className="text-center">
                <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="heading-sm text-muted-foreground mb-1">{t("meetings.meetingDetails")}</h3>
                <p className="text-sm text-muted-foreground/70">{t("meetings.noMeetingsFound")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editMeeting} onOpenChange={(o) => !o && setEditMeeting(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="heading-md">{t("meetings.editMeeting")}</DialogTitle>
          </DialogHeader>
          {editMeeting && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>{t("meetings.meetingTitle")}</Label>
                  <Input name="title" defaultValue={editMeeting.title} required />
                </div>
                <div className="col-span-2">
                  <Label>{t("meetings.description")}</Label>
                  <Textarea name="description" defaultValue={editMeeting.description} rows={2} />
                </div>
                <div>
                  <Label>{t("meetings.date")}</Label>
                  <Input name="date" type="date" defaultValue={editMeeting.date} required />
                </div>
                <div>
                  <Label>{t("meetings.status")}</Label>
                  <Select name="status" defaultValue={editMeeting.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">{t("meetings.scheduled")}</SelectItem>
                      <SelectItem value="in_progress">{t("meetings.inProgress")}</SelectItem>
                      <SelectItem value="completed">{t("meetings.completed")}</SelectItem>
                      <SelectItem value="cancelled">{t("meetings.cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("meetings.startTime")}</Label>
                  <Input name="startTime" type="time" defaultValue={editMeeting.startTime} required />
                </div>
                <div>
                  <Label>{t("meetings.endTime")}</Label>
                  <Input name="endTime" type="time" defaultValue={editMeeting.endTime} required />
                </div>
                <div>
                  <Label>{t("meetings.location")}</Label>
                  <Input name="location" defaultValue={editMeeting.location} required />
                </div>
                <div>
                  <Label>{t("meetings.organizer")}</Label>
                  <Input name="organizer" defaultValue={editMeeting.organizer} required />
                </div>
                <div>
                  <Label>{t("meetings.priority")}</Label>
                  <Select name="priority" defaultValue={editMeeting.priority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{t("meetings.normal")}</SelectItem>
                      <SelectItem value="important">{t("meetings.important")}</SelectItem>
                      <SelectItem value="urgent">{t("meetings.urgent")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>{t("meetings.attendees")}</Label>
                  <Input name="attendees" defaultValue={editMeeting.attendees.join(", ")} required />
                </div>
                <div className="col-span-2">
                  <Label>{t("meetings.agenda")}</Label>
                  <Textarea name="agenda" defaultValue={editMeeting.agenda} rows={3} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">{t("meetings.updateMeeting")}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
