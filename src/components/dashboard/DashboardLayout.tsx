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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuthStore } from "@/store/useAuthStore";
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
} from "lucide-react";

export function DashboardLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

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

  return (
    <SidebarProvider>
      <Sidebar className="border-r-0">
         <SidebarHeader className="p-4">
           <div className="flex items-center gap-2.5">
             <img src="/logo.png" alt="MPC-MV" className="w-9 h-9 rounded-lg" />
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
                      <AvatarFallback className="bg-steel text-white text-xs">MG</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">Manager</div>
                      <div className="text-xs text-muted-foreground">manager@gmail.com</div>
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
          <LanguageSwitcher variant="ghost" />
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
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
