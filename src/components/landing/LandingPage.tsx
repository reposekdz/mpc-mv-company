import { motion } from "framer-motion";
import { LoginDialog } from "./LoginDialog";
import {
  Mountain,
  HardHat,
  Truck,
  BarChart3,
  Shield,
  Users,
  ArrowRight,
  ChevronDown,
  Pickaxe,
  Building2,
  TrendingUp,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const stats = [
  { label: "Active Projects", value: "24+", icon: HardHat },
  { label: "Fleet Vehicles", value: "50+", icon: Truck },
  { label: "Team Members", value: "200+", icon: Users },
  { label: "Years Experience", value: "15+", icon: TrendingUp },
];

const services = [
  {
    icon: Pickaxe,
    title: "Mining Operations",
    description:
      "Full-scale mining from exploration surveys to mineral extraction with advanced geological analysis and sustainable practices.",
  },
  {
    icon: Building2,
    title: "Construction Projects",
    description:
      "Infrastructure development including highways, bridges, commercial buildings, and industrial facilities built to international standards.",
  },
  {
    icon: Truck,
    title: "Fleet Management",
    description:
      "Heavy equipment fleet operations with real-time tracking, maintenance scheduling, and fuel efficiency optimization.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description:
      "Data-driven insights with comprehensive financial reports, performance dashboards, and predictive analytics.",
  },
  {
    icon: Shield,
    title: "Safety & Compliance",
    description:
      "Industry-leading safety protocols, regular audits, and full regulatory compliance across all operation sites.",
  },
  {
    icon: Users,
    title: "Consulting Services",
    description:
      "Expert consulting on project planning, resource allocation, and operational strategy for maximum ROI.",
  },
];

const whyUs = [
  "ISO 9001 certified operations across all divisions",
  "Zero critical safety incidents in 24 months",
  "Fleet utilization rate above 85%",
  "On-time project delivery rate of 94%",
  "Sustainable mining practices certified",
  "24/7 operations monitoring and support",
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain className="w-7 h-7 text-steel" />
            <span className="heading-md text-foreground tracking-wider">MPC-MV</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Services</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            <LoginDialog />
          </div>
          <div className="md:hidden">
            <LoginDialog />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 min-h-screen flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C2536] via-[#253350] to-[#1C2536]" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, #4682B4 1px, transparent 1px), radial-gradient(circle at 75% 75%, #4682B4 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-white"
          >
            <motion.div custom={0} variants={fadeUp} className="label-uppercase text-steel-light mb-4 tracking-widest">
              Mining & Construction Excellence
            </motion.div>
            <motion.h1
              custom={1}
              variants={fadeUp}
              className="heading-xl text-white mb-6 leading-none"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
            >
              Powering Progress,
              <br />
              <span className="text-steel-light">Building Futures</span>
            </motion.h1>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-gray-300 mb-8 max-w-lg leading-relaxed">
              MPC-MV Company Ltd delivers world-class mining and construction services across the
              region. From mineral extraction to infrastructure development, we build the foundations
              of tomorrow.
            </motion.p>
            <motion.div custom={3} variants={fadeUp} className="flex flex-wrap gap-4">
              <LoginDialog />
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base gap-2"
                onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
              >
                Our Services
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Floating Stat Cards */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i + 2}
                variants={fadeUp}
              >
                <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <stat.icon className="w-8 h-8 text-steel-light mb-3" />
                    <div className="heading-lg text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="w-6 h-6 text-white/50" />
        </motion.div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="label-uppercase text-steel mb-3 block">What We Do</span>
            <h2 className="heading-lg text-foreground mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive mining and construction solutions powered by cutting-edge technology and
              decades of industry expertise.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-steel/10 flex items-center justify-center mb-4 group-hover:bg-steel/20 transition-colors">
                      <service.icon className="w-6 h-6 text-steel" />
                    </div>
                    <h3 className="heading-sm text-foreground mb-2">{service.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Why Choose Us */}
      <section id="about" className="py-24 bg-muted">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="label-uppercase text-steel mb-3 block">About MPC-MV</span>
              <h2 className="heading-lg text-foreground mb-6">Why Choose Us</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Founded with a vision to transform the mining and construction industry, MPC-MV
                Company Ltd has grown into one of the region's most trusted operators. Our commitment
                to safety, efficiency, and sustainability sets us apart in every project we undertake.
              </p>
              <div className="space-y-3">
                {whyUs.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-hunter mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <Card className="bg-steel text-white border-0">
                <CardContent className="p-6">
                  <div className="heading-lg">$42M+</div>
                  <div className="text-sm text-white/70 mt-1">Total Revenue 2025</div>
                </CardContent>
              </Card>
              <Card className="bg-hunter text-white border-0">
                <CardContent className="p-6">
                  <div className="heading-lg">98%</div>
                  <div className="text-sm text-white/70 mt-1">Client Satisfaction</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1C2536] text-white border-0">
                <CardContent className="p-6">
                  <div className="heading-lg">150+</div>
                  <div className="text-sm text-white/70 mt-1">Projects Delivered</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-steel text-white border-0">
                <CardContent className="p-6">
                  <div className="heading-lg">5</div>
                  <div className="text-sm text-white/70 mt-1">Operating Regions</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="label-uppercase text-steel mb-3 block">Get In Touch</span>
            <h2 className="heading-lg text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ready to start your next project? Our team is available around the clock.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Phone, label: "Phone", value: "+250 788 123 456" },
              { icon: Mail, label: "Email", value: "info@mpc-mv.com" },
              { icon: MapPin, label: "Address", value: "KG 123 St, Kigali, Rwanda" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-steel/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-5 h-5 text-steel" />
                    </div>
                    <div className="label-uppercase text-muted-foreground mb-2">{item.label}</div>
                    <div className="text-sm font-medium text-foreground">{item.value}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1C2536] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Mountain className="w-6 h-6 text-steel-light" />
              <span className="heading-sm text-white">MPC-MV Company Ltd</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <Separator className="my-6 bg-white/10" />
          <p className="text-center text-sm text-gray-500">
            © 2026 MPC-MV Company Ltd. All rights reserved. Mining & Construction Management.
          </p>
        </div>
      </footer>
    </div>
  );
}
