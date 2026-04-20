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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useAppStore } from "@/store/useAppStore";
import type { ConsultingTopic, ConsultingReply } from "@/types";
import {
  Plus,
  Search,
  MessageSquare,
  Send,
  CheckCircle2,
  RotateCcw,
  Filter,
  Calendar,
  User,
} from "lucide-react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ConsultingPage() {
  const { t } = useTranslation();
  const { consultingTopics, addConsultingTopic, addReply, updateTopicStatus } = useAppStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<ConsultingTopic | null>(null);
  const [replyText, setReplyText] = useState("");

  const statusConfig: Record<ConsultingTopic["status"], { label: string; color: string }> = {
    open: { label: t("consulting.open"), color: "bg-steel/10 text-steel" },
    in_discussion: { label: t("consulting.inDiscussion"), color: "bg-amber/10 text-amber" },
    resolved: { label: t("consulting.resolved"), color: "bg-hunter/10 text-hunter" },
  };

  const categoryConfig: Record<ConsultingTopic["category"], { label: string; color: string }> = {
    performance: { label: t("consulting.performanceCategory"), color: "bg-amber/10 text-amber" },
    strategy: { label: t("consulting.strategyCategory"), color: "bg-steel/10 text-steel" },
    operations: { label: t("consulting.operationsCategory"), color: "bg-hunter/10 text-hunter" },
    finance: { label: t("consulting.financeCategory"), color: "bg-iron/10 text-iron" },
  };

  const filtered = consultingTopics.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(search.toLowerCase()) ||
      topic.author.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "all" || topic.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newTopic: ConsultingTopic = {
      id: `c${Date.now()}`,
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      author: fd.get("author") as string,
      date: new Date().toISOString().split("T")[0],
      category: fd.get("category") as ConsultingTopic["category"],
      status: "open",
      replies: [],
    };
    addConsultingTopic(newTopic);
    setAddOpen(false);
  };

  const handleReply = () => {
    if (!selectedTopic || !replyText.trim()) return;
    const newReply: ConsultingReply = {
      id: `cr${Date.now()}`,
      author: "Manager",
      content: replyText.trim(),
      date: new Date().toISOString().split("T")[0],
    };
    addReply(selectedTopic.id, newReply);
    setReplyText("");
    setSelectedTopic((prev) => {
      if (!prev) return null;
      return { ...prev, replies: [...prev.replies, newReply] };
    });
  };

  const activeTopic = selectedTopic
    ? consultingTopics.find((topic) => topic.id === selectedTopic.id) || selectedTopic
    : null;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("consulting.searchTopics")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder={t("consulting.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("consulting.allCategories")}</SelectItem>
              <SelectItem value="performance">{t("consulting.performanceCategory")}</SelectItem>
              <SelectItem value="strategy">{t("consulting.strategyCategory")}</SelectItem>
              <SelectItem value="operations">{t("consulting.operationsCategory")}</SelectItem>
              <SelectItem value="finance">{t("consulting.financeCategory")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-steel hover:bg-steel-dark gap-2">
              <Plus className="w-4 h-4" />
              {t("consulting.newDiscussion")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="heading-md">{t("consulting.newDiscussion")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>{t("consulting.topicTitle")}</Label>
                  <Input name="title" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("consulting.category")}</Label>
                    <Select name="category" defaultValue="operations">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">{t("consulting.performanceCategory")}</SelectItem>
                        <SelectItem value="strategy">{t("consulting.strategyCategory")}</SelectItem>
                        <SelectItem value="operations">{t("consulting.operationsCategory")}</SelectItem>
                        <SelectItem value="finance">{t("consulting.financeCategory")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("consulting.author")}</Label>
                    <Input name="author" required />
                  </div>
                </div>
                <div>
                  <Label>{t("consulting.descriptionLabel")}</Label>
                  <Textarea name="description" rows={3} required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">{t("consulting.createTopic")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Topics List + Detail */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Topics List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((topic, i) => {
            const isActive = activeTopic?.id === topic.id;
            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isActive ? "ring-2 ring-steel shadow-md" : ""
                  }`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold leading-snug flex-1">{topic.title}</h3>
                      <Badge variant="secondary" className={`text-[10px] shrink-0 ${statusConfig[topic.status].color}`}>
                        {statusConfig[topic.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{topic.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />{topic.author}
                        </span>
                        <Badge variant="secondary" className={`text-[9px] ${categoryConfig[topic.category].color}`}>
                          {categoryConfig[topic.category].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />{topic.replies.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{topic.date}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{t("consulting.noTopicsFound")}</p>
            </div>
          )}
        </div>

        {/* Topic Detail */}
        <div className="lg:col-span-3">
          {activeTopic ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="heading-sm mb-2">{activeTopic.title}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={`text-[10px] ${statusConfig[activeTopic.status].color}`}>
                          {statusConfig[activeTopic.status].label}
                        </Badge>
                        <Badge variant="secondary" className={`text-[10px] ${categoryConfig[activeTopic.category].color}`}>
                          {categoryConfig[activeTopic.category].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{t("consulting.by")} {activeTopic.author} · {activeTopic.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {activeTopic.status !== "resolved" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-hunter border-hunter/30 hover:bg-hunter/10"
                          onClick={() => updateTopicStatus(activeTopic.id, "resolved")}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t("consulting.resolve")}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => updateTopicStatus(activeTopic.id, "open")}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {t("consulting.reopen")}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Description */}
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-foreground leading-relaxed">{activeTopic.description}</p>
                  </div>

                  <Separator />

                  {/* Replies */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      {activeTopic.replies.length === 1
                        ? t("consulting.repliesCount", { count: activeTopic.replies.length })
                        : t("consulting.repliesCount_plural", { count: activeTopic.replies.length })}
                    </h4>
                    <ScrollArea className={activeTopic.replies.length > 3 ? "h-[280px]" : ""}>
                      <div className="space-y-3 pr-3">
                        {activeTopic.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className="text-[10px] bg-steel/10 text-steel">
                                {getInitials(reply.author)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 p-3 rounded-lg bg-muted/40 border border-border/50">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold">{reply.author}</span>
                                <span className="text-[10px] text-muted-foreground">{reply.date}</span>
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                        {activeTopic.replies.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-6">{t("consulting.noReplies")}</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Reply Input */}
                  <div className="flex gap-3 pt-2">
                    <Textarea
                      placeholder={t("consulting.writeReply")}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 min-h-[80px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          handleReply();
                        }
                      }}
                    />
                    <Button
                      className="bg-steel hover:bg-steel-dark self-end gap-2"
                      onClick={handleReply}
                      disabled={!replyText.trim()}
                    >
                      <Send className="w-4 h-4" />
                      {t("consulting.reply")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="heading-sm text-muted-foreground mb-1">{t("consulting.selectTopic")}</h3>
                <p className="text-sm text-muted-foreground/70">{t("consulting.selectTopicDescription")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
