export type JobStatus = "pending" | "in_progress" | "completed" | "on_hold" | "cancelled";
export type JobPriority = "low" | "medium" | "high" | "critical";
export type TruckStatus = "available" | "in_use" | "maintenance" | "out_of_service";
export type PaymentStatus = "paid" | "pending" | "overdue";

export interface Job {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  priority: JobPriority;
  assignedTo: string;
  location: string;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  type: "mining" | "construction";
}

export interface Truck {
  id: string;
  name: string;
  plateNumber: string;
  model: string;
  year: number;
  status: TruckStatus;
  driver: string;
  assignedJob: string;
  fuelLevel: number;
  mileage: number;
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  baseSalary: number;
  deductions: number;
  bonuses: number;
  netPay: number;
  paymentStatus: PaymentStatus;
  paymentDate: string;
  payPeriod: "monthly" | "weekly";
}

export interface Report {
  id: string;
  title: string;
  type: "financial" | "operational" | "safety" | "performance";
  date: string;
  status: "draft" | "published";
  summary: string;
  author: string;
}

export interface ConsultingTopic {
  id: string;
  title: string;
  description: string;
  author: string;
  date: string;
  category: "performance" | "strategy" | "operations" | "finance";
  replies: ConsultingReply[];
  status: "open" | "resolved" | "in_discussion";
}

export interface ConsultingReply {
  id: string;
  author: string;
  content: string;
  date: string;
}

export interface AnalyticsData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  jobsCompleted: number;
}
