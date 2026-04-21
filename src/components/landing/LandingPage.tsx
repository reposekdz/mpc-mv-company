import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { LoginDialog } from "./LoginDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Mountain,
  Truck,
  BarChart3,
  Shield,
  Users,
  Briefcase,
  Calendar,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

export function LandingPage() {
  const { t } = useTranslation();

  const systemModules = [
    { icon: Briefcase, title: t("nav.jobs"), description: t("services.miningDesc"), status: "active" },
    { icon: Truck, title: t("nav.trucks"), description: t("services.fleetDesc"), status: "active" },
    { icon: Users, title: t("nav.salaries"), description: t("services.consultingServiceDesc"), status: "active" },
    { icon: FileText, title: t("nav.reports"), description: t("services.analyticsReportingDesc"), status: "active" },
    { icon: BarChart3, title: t("nav.analytics"), description: t("services.analyticsReportingDesc"), status: "live" },
    { icon: Calendar, title: t("nav.meetings"), description: t("services.consultingServiceDesc"), status: "scheduled" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <img src="/logo.png" alt="MPC-MV" className="w-12 h-12 rounded-xl" />
             <div className="flex flex-col">
               <span className="heading-md text-foreground tracking-tight">MPC-MV</span>
               <span className="text-xs text-muted-foreground -mt-1">{t("nav.managementPortal")}</span>
             </div>
           </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <LoginDialog />
          </div>
        </div>
      </nav>

      {/* Hero Section - Management Portal Only */}
      <section className="relative pt-24 min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(70, 130, 180, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(70, 130, 180, 0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <motion.div 
              initial="hidden" 
              animate="visible" 
              className="lg:col-span-3 text-white space-y-6"
            >
              <motion.div custom={0} variants={fadeUp}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-steel/20 border border-steel/30 mb-6">
                  <Shield className="w-4 h-4 text-steel-light" />
                  <span className="text-sm font-medium text-steel-light">{t("nav.managementPortal")}</span>
                </div>
              </motion.div>

              <motion.h1 custom={1} variants={fadeUp} className="text-4xl md:text-6xl font-bold leading-tight">
                {t("landing.heroTitle1")}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-steel-light to-blue-300">
                  {t("landing.heroTitle2")}
                </span>
              </motion.h1>

              <motion.p custom={2} variants={fadeUp} className="text-lg text-gray-300 max-w-2xl leading-relaxed">
                {t("landing.heroDescription")}
              </motion.p>

              <motion.div custom={3} variants={fadeUp} className="flex flex-wrap gap-4 pt-4">
                <LoginDialog />
              </motion.div>
            </motion.div>

             <motion.div 
               initial="hidden" 
               animate="visible" 
               className="lg:col-span-2 flex items-center justify-center"
               custom={2}
               variants={fadeUp}
             >
               <img 
                 src="/logo.png" 
                 alt="MPC-MV Company Ltd" 
                 className="w-64 h-auto opacity-95 hover:opacity-100 transition-opacity drop-shadow-2xl"
               />
             </motion.div>
          </div>

          {/* Management Modules Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="mt-20"
          >
             <div className="text-center mb-10">
               <h2 className="text-2xl font-semibold text-white mb-2">{t("landing.whatWeDo")}</h2>
               <p className="text-gray-400">{t("landing.servicesSubtitle")}</p>
             </div>

             <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
               {systemModules.map((module, i) => (
                 <motion.div
                   key={module.title}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.8 + i * 0.08 }}
                   whileHover={{ scale: 1.02, y: -4 }}
                   className="transition-transform"
                 >
                   <Card className="h-full bg-white/5 border-white/10 hover:bg-white/10 hover:border-steel/40 transition-all duration-300 group cursor-pointer">
                     <CardContent className="p-5 text-center">
                       <div className="w-12 h-12 rounded-xl bg-steel/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-steel/30 transition-colors">
                         <module.icon className="w-6 h-6 text-steel-light" />
                       </div>
                       <div className="flex items-center justify-center gap-2 mb-1">
                         <h3 className="font-semibold text-white">{module.title}</h3>
                         {module.status === "live" && (
                           <Badge variant="secondary" className="h-5 px-1.5 bg-green-500/20 text-green-400 text-[10px] gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                             LIVE
                           </Badge>
                         )}
                       </div>
                       <p className="text-xs text-gray-400">{module.description}</p>
                     </CardContent>
                   </Card>
                 </motion.div>
               ))}
             </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-white py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-2">
             <img src="/logo.png" alt="MPC-MV" className="w-5 h-5" />
             <span className="font-medium">MPC-MV Company Ltd</span>
           </div>
            <p className="text-sm text-gray-500">
              © 2026 MPC-MV Company Ltd. Uburenganzira bwose bwabikiwe.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
