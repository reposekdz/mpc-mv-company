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

export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type MeetingPriority = "normal" | "important" | "urgent";

export interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  attendees: string[];
  status: MeetingStatus;
  priority: MeetingPriority;
  notes: string;
  agenda: string;
}

export type HomeworkStatus = "pending" | "in_progress" | "completed" | "submitted" | "reviewed" | "approved" | "rejected";
export type HomeworkPriority = "low" | "medium" | "high" | "urgent";
export type HomeworkCategory = "remote_work" | "field_work" | "site_visit" | "documentation" | "training" | "other";

export interface Homework {
  id: string;
  title: string;
  description: string;
  employeeId: string;
  employeeName: string;
  category: HomeworkCategory;
  status: HomeworkStatus;
  priority: HomeworkPriority;
  assignedDate: string;
  dueDate: string;
  completedDate?: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  attachments: { name: string; url: string; type: string }[];
  notes: string;
  supervisorNotes?: string;
  hoursWorked: number;
  approvedBy?: string;
  approvalDate?: string;
}
