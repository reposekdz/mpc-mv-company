import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSocket } from "@/hooks/useSocket";
import type { AppNotification } from "@/hooks/useSocket";
import {
  LayoutDashboard,
  Briefcase,
  Truck,
  DollarSign,
  FileText,
  BarChart3,
  MessageSquare,
  LogOut,
  ChevronUp,
  User,
  CalendarDays,
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";

export function DashboardLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const appStore = useAppStore();
  const { notifications, unreadCount, markAllRead, markRead, clearNotifications, connected } = useSocket();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    appStore.fetchAllData().catch(console.error);
  }, []);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const navItems = [
    { title: t("nav.overview"), path: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.jobs"), path: "/dashboard/jobs", icon: Briefcase },
    { title: t("nav.trucks"), path: "/dashboard/trucks", icon: Truck },
    { title: t("nav.salaries"), path: "/dashboard/salaries", icon: DollarSign },
    { title: t("nav.reports"), path: "/dashboard/reports", icon: FileText },
    { title: t("nav.analytics"), path: "/dashboard/analytics", icon: BarChart3 },
    { title: t("nav.consulting"), path: "/dashboard/consulting", icon: MessageSquare },
    { title: t("nav.meetings"), path: "/dashboard/meetings", icon: CalendarDays },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getNotifIcon = (type: AppNotification['type']) => {
    const icons: Record<string, string> = {
      job_created: '💼',
      job_updated: '✏️',
      truck_updated: '🚛',
      meeting_created: '📅',
      report_created: '📊',
      info: 'ℹ️',
    };
    return icons[type] || '🔔';
  };

  const getTimeAgo = (timestamp: Date) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    if (mins < 1) return 'Ubu nyine';
    if (mins < 60) return `${mins}min`;
    if (hrs < 24) return `${hrs}h`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r-0">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="MPC-MV" className="w-9 h-9 rounded-lg" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div>
              <div className="heading-sm text-sidebar-foreground leading-tight">MPC-MV</div>
              <div className="text-[11px] text-sidebar-foreground/50">{t("nav.managementPortal")}</div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("nav.navigation")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.path}
                      onClick={() => navigate(item.path)}
                      tooltip={item.title}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-steel text-white text-xs">
                        {user?.name?.charAt(0).toUpperCase() || 'M'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{user?.name || 'Manager'}</div>
                      <div className="text-xs text-muted-foreground capitalize">{user?.role || 'manager'}</div>
                    </div>
                    <ChevronUp className="w-4 h-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56">
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    {t("nav.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex-1">
            <h1 className="heading-sm text-foreground">
              {navItems.find((n) => n.path === location.pathname)?.title || t("nav.dashboard")}
            </h1>
          </div>

          {/* Real-time connection indicator */}
          <div className="flex items-center gap-1.5">
            {connected ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-xs hidden sm:inline">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-400">
                <WifiOff className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="sm"
              className="relative h-9 w-9 p-0"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 border-0 text-white rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>

            {/* Notification Panel */}
            {notifOpen && (
              <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-sm">Ubutumwa</span>
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-[10px] h-4 px-1.5">{unreadCount}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {notifications.length > 0 && (
                      <>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-600 hover:bg-blue-50" onClick={markAllRead}>
                          <CheckCheck className="w-3 h-3 mr-1" /> Byose
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-slate-500 hover:bg-slate-100" onClick={clearNotifications}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <BellOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">Nta butumwa bushya</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <button
                        key={notif.id}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/40' : ''}`}
                        onClick={() => markRead(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg leading-none mt-0.5">{getNotifIcon(notif.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-xs font-semibold truncate ${!notif.read ? 'text-slate-800' : 'text-slate-600'}`}>
                                {notif.title}
                              </p>
                              {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{getTimeAgo(notif.timestamp)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {connected ? '🟢 Guhuza mu gihe nyacyo' : '🔴 Gukurwa'}
                    </span>
                    <span className="text-[10px] text-slate-400">{notifications.length} ubutumwa</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <LanguageSwitcher variant="ghost" />
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 hidden sm:flex">
            <LogOut className="w-3.5 h-3.5" />
            {t("nav.logout")}
          </Button>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
