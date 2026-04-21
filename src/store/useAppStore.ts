import { create } from "zustand";
import type { Job, Truck, Employee, Report, ConsultingTopic, ConsultingReply, Meeting, ContactMessage } from "@/types";
import type { AnalyticsData, DashboardStats } from "@/types";
import {
  jobsApi,
  trucksApi,
  employeesApi,
  reportsApi,
  consultingApi,
  meetingsApi,
  analyticsApi,
  contactApi
} from "@/lib/api";

interface LoadingState {
  jobs: boolean;
  trucks: boolean;
  employees: boolean;
  reports: boolean;
  consultingTopics: boolean;
  analyticsData: boolean;
  meetings: boolean;
  [key: string]: boolean;
}

interface AppState {
  jobs: Job[];
  trucks: Truck[];
  employees: Employee[];
  reports: Report[];
  consultingTopics: ConsultingTopic[];
  analyticsData: AnalyticsData[];
  meetings: Meeting[];
  contactMessages: ContactMessage[];
  loading: LoadingState;
  error: string | null;

  // Jobs
  fetchJobs: (params?: any) => Promise<void>;
  addJob: (job: Partial<Job>) => Promise<Job>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<Job>;
  deleteJob: (id: string) => Promise<void>;

  // Trucks
  fetchTrucks: (params?: any) => Promise<void>;
  addTruck: (truck: Partial<Truck>) => Promise<Truck>;
  updateTruck: (id: string, updates: Partial<Truck>) => Promise<Truck>;
  deleteTruck: (id: string) => Promise<void>;

  // Employees
  fetchEmployees: (params?: any) => Promise<void>;
  addEmployee: (employee: Partial<Employee>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  processPayroll: () => Promise<void>;

  // Reports
  fetchReports: (params?: any) => Promise<void>;
  addReport: (report: Partial<Report>) => Promise<Report>;
  updateReport: (id: string, updates: Partial<Report>) => Promise<Report>;
  deleteReport: (id: string) => Promise<void>;

  // Consulting
  fetchConsultingTopics: (params?: any) => Promise<void>;
  addConsultingTopic: (topic: Partial<ConsultingTopic>) => Promise<ConsultingTopic>;
  addReply: (topicId: string, reply: Partial<ConsultingReply>) => Promise<ConsultingReply>;
  updateTopicStatus: (topicId: string, status: ConsultingTopic["status"]) => Promise<ConsultingTopic>;

  // Meetings
  fetchMeetings: (params?: any) => Promise<void>;
  addMeeting: (meeting: Partial<Meeting>) => Promise<Meeting>;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<Meeting>;
  deleteMeeting: (id: string) => Promise<void>;

  // Analytics
  fetchAnalyticsData: () => Promise<void>;
  fetchDashboardStats: () => Promise<any>;
  fetchTrends: () => Promise<any>;

  // Utils
  clearError: () => void;
  fetchAllData: () => Promise<void>;
}

const createLoadingState = (): LoadingState => ({
  jobs: false,
  trucks: false,
  employees: false,
  reports: false,
  consultingTopics: false,
  analyticsData: false,
  meetings: false,
  contactMessages: false,
});

export const useAppStore = create<AppState>((set, get) => ({
  jobs: [],
  trucks: [],
  employees: [],
  reports: [],
  consultingTopics: [],
  analyticsData: [],
  meetings: [],
  contactMessages: [],
  loading: createLoadingState(),
  error: null,

  // JOBS
  fetchJobs: async (params) => {
    set({ loading: { ...get().loading, jobs: true }, error: null });
    try {
      const jobs = await jobsApi.getAll(params);
      set({ jobs });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: { ...get().loading, jobs: false } });
    }
  },
  addJob: async (job) => {
    set({ loading: { ...get().loading, jobs: true }, error: null });
    try {
      const newJob = await jobsApi.create(job);
      set({ jobs: [newJob, ...get().jobs] });
      return newJob;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, jobs: false } });
    }
  },
  updateJob: async (id, updates) => {
    set({ loading: { ...get().loading, jobs: true }, error: null });
    try {
      const updatedJob = await jobsApi.update(id, updates);
      set({
        jobs: get().jobs.map(j => j.id === id ? updatedJob : j)
      });
      return updatedJob;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, jobs: false } });
    }
  },
  deleteJob: async (id) => {
    set({ loading: { ...get().loading, jobs: true }, error: null });
    try {
      await jobsApi.delete(id);
      set({ jobs: get().jobs.filter(j => j.id !== id) });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, jobs: false } });
    }
  },

  // TRUCKS
  fetchTrucks: async (params) => {
    set({ loading: { ...get().loading, trucks: true }, error: null });
    try {
      const trucks = await trucksApi.getAll(params);
      set({ trucks });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: { ...get().loading, trucks: false } });
    }
  },
  addTruck: async (truck) => {
    set({ loading: { ...get().loading, trucks: true }, error: null });
    try {
      const newTruck = await trucksApi.create(truck);
      set({ trucks: [newTruck, ...get().trucks] });
      return newTruck;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, trucks: false } });
    }
  },
  updateTruck: async (id, updates) => {
    set({ loading: { ...get().loading, trucks: true }, error: null });
    try {
      const updatedTruck = await trucksApi.update(id, updates);
      set({
        trucks: get().trucks.map(t => t.id === id ? updatedTruck : t)
      });
      return updatedTruck;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, trucks: false } });
    }
  },
  deleteTruck: async (id) => {
    set({ loading: { ...get().loading, trucks: true }, error: null });
    try {
      await trucksApi.delete(id);
      set({ trucks: get().trucks.filter(t => t.id !== id) });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, trucks: false } });
    }
  },

  // EMPLOYEES
  fetchEmployees: async (params) => {
    set({ loading: { ...get().loading, employees: true }, error: null });
    try {
      const employees = await employeesApi.getAll(params);
      set({ employees });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: { ...get().loading, employees: false } });
    }
  },
  addEmployee: async (employee) => {
    set({ loading: { ...get().loading, employees: true }, error: null });
    try {
      const newEmployee = await employeesApi.create(employee);
      set({ employees: [newEmployee, ...get().employees] });
      return newEmployee;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, employees: false } });
    }
  },
  updateEmployee: async (id, updates) => {
    set({ loading: { ...get().loading, employees: true }, error: null });
    try {
      const updatedEmployee = await employeesApi.update(id, updates);
      set({
        employees: get().employees.map(e => e.id === id ? updatedEmployee : e)
      });
      return updatedEmployee;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, employees: false } });
    }
  },
  deleteEmployee: async (id) => {
    set({ loading: { ...get().loading, employees: true }, error: null });
    try {
      await employeesApi.delete(id);
      set({ employees: get().employees.filter(e => e.id !== id) });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, employees: false } });
    }
  },
  processPayroll: async () => {
    set({ loading: { ...get().loading, employees: true }, error: null });
    try {
      await employeesApi.processPayroll();
      await get().fetchEmployees();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, employees: false } });
    }
  },

  // REPORTS
  fetchReports: async (params) => {
    set({ loading: { ...get().loading, reports: true }, error: null });
    try {
      const reports = await reportsApi.getAll(params);
      set({ reports });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: { ...get().loading, reports: false } });
    }
  },
  addReport: async (report) => {
    set({ loading: { ...get().loading, reports: true }, error: null });
    try {
      const newReport = await reportsApi.create(report);
      set({ reports: [newReport, ...get().reports] });
      return newReport;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, reports: false } });
    }
  },
  updateReport: async (id, updates) => {
    set({ loading: { ...get().loading, reports: true }, error: null });
    try {
      const updatedReport = await reportsApi.update(id, updates);
      set({
        reports: get().reports.map(r => r.id === id ? updatedReport : r)
      });
      return updatedReport;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, reports: false } });
    }
  },
  deleteReport: async (id) => {
    set({ loading: { ...get().loading, reports: true }, error: null });
    try {
      await reportsApi.delete(id);
      set({ reports: get().reports.filter(r => r.id !== id) });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, reports: false } });
    }
  },

  // CONSULTING
  fetchConsultingTopics: async (params) => {
    set({ loading: { ...get().loading, consultingTopics: true }, error: null });
    try {
      const topics = await consultingApi.getAll(params);
      set({ consultingTopics: topics });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: { ...get().loading, consultingTopics: false } });
    }
  },
  addConsultingTopic: async (topic) => {
    set({ loading: { ...get().loading, consultingTopics: true }, error: null });
    try {
      const newTopic = await consultingApi.create(topic);
      set({ consultingTopics: [newTopic, ...get().consultingTopics] });
      return newTopic;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, consultingTopics: false } });
    }
  },
  addReply: async (topicId, reply) => {
    set({ loading: { ...get().loading, consultingTopics: true }, error: null });
    try {
      const newReply = await consultingApi.addReply(topicId, reply);
      set({
        consultingTopics: get().consultingTopics.map(t =>
          t.id === topicId ? { ...t, replies: [...t.replies, newReply] } : t
        )
      });
      return newReply;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, consultingTopics: false } });
    }
  },
  updateTopicStatus: async (topicId, status) => {
    set({ loading: { ...get().loading, consultingTopics: true }, error: null });
    try {
      const updatedTopic = await consultingApi.update(topicId, { status });
      set({
        consultingTopics: get().consultingTopics.map(t =>
          t.id === topicId ? updatedTopic : t
        )
      });
      return updatedTopic;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, consultingTopics: false } });
    }
  },

  // MEETINGS
  fetchMeetings: async (params) => {
    set({ loading: { ...get().loading, meetings: true }, error: null });
    try {
      const meetings = await meetingsApi.getAll(params);
      set({ meetings });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: { ...get().loading, meetings: false } });
    }
  },
  addMeeting: async (meeting) => {
    set({ loading: { ...get().loading, meetings: true }, error: null });
    try {
      const newMeeting = await meetingsApi.create(meeting);
      set({ meetings: [newMeeting, ...get().meetings] });
      return newMeeting;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, meetings: false } });
    }
  },
  updateMeeting: async (id, updates) => {
    set({ loading: { ...get().loading, meetings: true }, error: null });
    try {
      const updatedMeeting = await meetingsApi.update(id, updates);
      set({
        meetings: get().meetings.map(m => m.id === id ? updatedMeeting : m)
      });
      return updatedMeeting;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, meetings: false } });
    }
  },
  deleteMeeting: async (id) => {
    set({ loading: { ...get().loading, meetings: true }, error: null });
    try {
      await meetingsApi.delete(id);
      set({ meetings: get().meetings.filter(m => m.id !== id) });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, meetings: false } });
    }
  },

  // ANALYTICS
  fetchAnalyticsData: async () => {
    set({ loading: { ...get().loading, analyticsData: true }, error: null });
    try {
      const data = await analyticsApi.getAll();
      set({ analyticsData: data });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: { ...get().loading, analyticsData: false } });
    }
  },
  fetchDashboardStats: async () => {
    return await analyticsApi.getDashboard();
  },
  fetchTrends: async () => {
    return await analyticsApi.getTrends();
  },

  // Contact Messages
  fetchContactMessages: async () => {
    set({ loading: { ...get().loading, contactMessages: true }, error: null });
    try {
      const messages = await contactApi.getAll();
      set({ contactMessages: messages });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: { ...get().loading, contactMessages: false } });
    }
  },
  markMessageAsRead: async (id: string) => {
    set({ loading: { ...get().loading, contactMessages: true }, error: null });
    try {
      const updated = await contactApi.markAsRead(id);
      set({
        contactMessages: get().contactMessages.map(m =>
          m.id === id ? updated : m
        )
      });
      return updated;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, contactMessages: false } });
    }
  },
  deleteMessage: async (id: string) => {
    set({ loading: { ...get().loading, contactMessages: true }, error: null });
    try {
      await contactApi.delete(id);
      set({
        contactMessages: get().contactMessages.filter(m => m.id !== id)
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: { ...get().loading, contactMessages: false } });
    }
  },

  // UTILS
  clearError: () => set({ error: null }),
  fetchAllData: async () => {
    await Promise.all([
      get().fetchJobs(),
      get().fetchTrucks(),
      get().fetchEmployees(),
      get().fetchReports(),
      get().fetchConsultingTopics(),
      get().fetchMeetings(),
      get().fetchAnalyticsData(),
      get().fetchContactMessages(),
    ]);
  }
}));