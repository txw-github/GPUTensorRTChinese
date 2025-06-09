import { 
  users, 
  transcriptionJobs, 
  systemMetrics,
  type User, 
  type InsertUser, 
  type TranscriptionJob, 
  type InsertJob, 
  type UpdateJob,
  type SystemMetrics 
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Job operations
  createJob(job: InsertJob): Promise<TranscriptionJob>;
  getJob(id: number): Promise<TranscriptionJob | undefined>;
  updateJob(id: number, updates: Partial<UpdateJob>): Promise<TranscriptionJob | undefined>;
  getJobs(status?: string): Promise<TranscriptionJob[]>;
  getUserJobs(userId: number): Promise<TranscriptionJob[]>;
  deleteJob(id: number): Promise<boolean>;
  
  // System metrics
  addSystemMetrics(metrics: Omit<SystemMetrics, 'id' | 'timestamp'>): Promise<SystemMetrics>;
  getLatestSystemMetrics(): Promise<SystemMetrics | undefined>;
  getSystemMetricsHistory(limit?: number): Promise<SystemMetrics[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobs: Map<number, TranscriptionJob>;
  private metrics: Map<number, SystemMetrics>;
  private currentUserId: number;
  private currentJobId: number;
  private currentMetricsId: number;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.metrics = new Map();
    this.currentUserId = 1;
    this.currentJobId = 1;
    this.currentMetricsId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createJob(insertJob: InsertJob): Promise<TranscriptionJob> {
    const id = this.currentJobId++;
    const job: TranscriptionJob = {
      ...insertJob,
      id,
      userId: null,
      status: "pending",
      progress: 0,
      duration: insertJob.duration || null,
      fileSize: insertJob.fileSize || null,
      resolution: insertJob.resolution || null,
      language: insertJob.language || "zh",
      settings: insertJob.settings || null,
      results: null,
      outputFormats: insertJob.outputFormats || null,
      gpuUtilization: null,
      processingTime: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.jobs.set(id, job);
    return job;
  }

  async getJob(id: number): Promise<TranscriptionJob | undefined> {
    return this.jobs.get(id);
  }

  async updateJob(id: number, updates: Partial<UpdateJob>): Promise<TranscriptionJob | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, ...updates };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async getJobs(status?: string): Promise<TranscriptionJob[]> {
    const allJobs = Array.from(this.jobs.values());
    if (status) {
      return allJobs.filter(job => job.status === status);
    }
    return allJobs.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getUserJobs(userId: number): Promise<TranscriptionJob[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async addSystemMetrics(metricsData: Omit<SystemMetrics, 'id' | 'timestamp'>): Promise<SystemMetrics> {
    const id = this.currentMetricsId++;
    const metrics: SystemMetrics = {
      ...metricsData,
      id,
      timestamp: new Date(),
    };
    this.metrics.set(id, metrics);
    return metrics;
  }

  async getLatestSystemMetrics(): Promise<SystemMetrics | undefined> {
    const allMetrics = Array.from(this.metrics.values());
    if (allMetrics.length === 0) return undefined;
    
    return allMetrics.sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())[0];
  }

  async getSystemMetricsHistory(limit: number = 100): Promise<SystemMetrics[]> {
    const allMetrics = Array.from(this.metrics.values());
    return allMetrics
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
