import { create } from "zustand";
import type { Job, Truck, Employee, Report, ConsultingTopic, ConsultingReply, Meeting } from "@/types";
import {
  mockJobs,
  mockTrucks,
  mockEmployees,
  mockReports,
  mockConsultingTopics,
  mockAnalyticsData,
  mockMeetings,
} from "@/data/mock-data";
import type { AnalyticsData } from "@/types";

interface AppState {
  jobs: Job[];
  trucks: Truck[];
  employees: Employee[];
  reports: Report[];
  consultingTopics: ConsultingTopic[];
  analyticsData: AnalyticsData[];
  meetings: Meeting[];

  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;

  addTruck: (truck: Truck) => void;
  updateTruck: (id: string, updates: Partial<Truck>) => void;
  deleteTruck: (id: string) => void;

  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addReport: (report: Report) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  deleteReport: (id: string) => void;

  addConsultingTopic: (topic: ConsultingTopic) => void;
  addReply: (topicId: string, reply: ConsultingReply) => void;
  updateTopicStatus: (topicId: string, status: ConsultingTopic["status"]) => void;

  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  jobs: mockJobs,
  trucks: mockTrucks,
  employees: mockEmployees,
  reports: mockReports,
  consultingTopics: mockConsultingTopics,
  analyticsData: mockAnalyticsData,
  meetings: mockMeetings,

  addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs] })),
  updateJob: (id, updates) =>
    set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)) })),
  deleteJob: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),

  addTruck: (truck) => set((s) => ({ trucks: [truck, ...s.trucks] })),
  updateTruck: (id, updates) =>
    set((s) => ({ trucks: s.trucks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
  deleteTruck: (id) => set((s) => ({ trucks: s.trucks.filter((t) => t.id !== id) })),

  addEmployee: (employee) => set((s) => ({ employees: [employee, ...s.employees] })),
  updateEmployee: (id, updates) =>
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),
  deleteEmployee: (id) => set((s) => ({ employees: s.employees.filter((e) => e.id !== id) })),

  addReport: (report) => set((s) => ({ reports: [report, ...s.reports] })),
  updateReport: (id, updates) =>
    set((s) => ({ reports: s.reports.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),
  deleteReport: (id) => set((s) => ({ reports: s.reports.filter((r) => r.id !== id) })),

  addConsultingTopic: (topic) =>
    set((s) => ({ consultingTopics: [topic, ...s.consultingTopics] })),
  addReply: (topicId, reply) =>
    set((s) => ({
      consultingTopics: s.consultingTopics.map((t) =>
        t.id === topicId ? { ...t, replies: [...t.replies, reply] } : t
      ),
    })),
  updateTopicStatus: (topicId, status) =>
    set((s) => ({
      consultingTopics: s.consultingTopics.map((t) =>
        t.id === topicId ? { ...t, status } : t
      ),
    })),

  addMeeting: (meeting) => set((s) => ({ meetings: [meeting, ...s.meetings] })),
  updateMeeting: (id, updates) =>
    set((s) => ({ meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),
  deleteMeeting: (id) => set((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) })),
}));
