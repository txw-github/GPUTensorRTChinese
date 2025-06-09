import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const transcriptionJobs = pgTable("transcription_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  originalPath: text("original_path").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  progress: integer("progress").default(0),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  resolution: text("resolution"),
  language: text("language").default("zh"),
  settings: jsonb("settings"), // Chinese processing settings
  results: jsonb("results"), // transcription results
  outputFormats: text("output_formats").array(),
  gpuUtilization: integer("gpu_utilization"),
  processingTime: integer("processing_time"), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  gpuUtilization: integer("gpu_utilization"),
  vramUsage: integer("vram_usage"), // in MB
  temperature: integer("temperature"),
  activeJobs: integer("active_jobs"),
  tensorrtStatus: boolean("tensorrt_status").default(true),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertJobSchema = createInsertSchema(transcriptionJobs).pick({
  filename: true,
  originalPath: true,
  duration: true,
  fileSize: true,
  resolution: true,
  language: true,
  settings: true,
  outputFormats: true,
});

export const updateJobSchema = createInsertSchema(transcriptionJobs).pick({
  status: true,
  progress: true,
  results: true,
  gpuUtilization: true,
  processingTime: true,
  completedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type TranscriptionJob = typeof transcriptionJobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type UpdateJob = z.infer<typeof updateJobSchema>;
export type SystemMetrics = typeof systemMetrics.$inferSelect;

export interface ChineseSettings {
  variant: 'simplified' | 'traditional' | 'auto';
  multiPronunciation: boolean;
  smartPunctuation: boolean;
  segmentationMethod: 'jieba' | 'ai' | 'basic';
}

export interface TranscriptionResults {
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
  fullText: string;
  processingStats: {
    gpuAcceleration: boolean;
    tensorrtUsed: boolean;
    speedup: number;
    accuracy: number;
  };
}
