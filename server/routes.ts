import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, updateJobSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
// WebSocket functionality removed to avoid conflicts with Vite dev server

// Import Python transcription modules (would be integrated via child process or API)
// For now, we'll simulate the transcription process

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10GB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Simulated transcription process
class TranscriptionSimulator {
  private activeJobs = new Map<number, NodeJS.Timeout>();
  
  startJob(jobId: number) {
    if (this.activeJobs.has(jobId)) return;
    
    const updateProgress = async (progress: number, message: string) => {
      await storage.updateJob(jobId, { 
        progress, 
        gpuUtilization: Math.floor(Math.random() * 30) + 70 // 70-100%
      });
    };
    
    let progress = 0;
    const interval = setInterval(async () => {
      progress += Math.floor(Math.random() * 10) + 5; // 5-15% increments
      
      if (progress >= 100) {
        clearInterval(interval);
        this.activeJobs.delete(jobId);
        
        // Complete the job
        const mockResults = {
          segments: [
            {
              start: 0,
              end: 5.2,
              text: "欢迎观看今天的节目，我是主持人张明。",
              confidence: 0.95
            },
            {
              start: 5.2,
              end: 12.8,
              text: "今天我们要讨论的话题是人工智能在现代社会中的应用。",
              confidence: 0.92
            },
            {
              start: 12.8,
              end: 20.5,
              text: "人工智能技术正在快速发展，它已经渗透到我们生活的各个方面。",
              confidence: 0.89
            }
          ],
          fullText: "欢迎观看今天的节目，我是主持人张明。今天我们要讨论的话题是人工智能在现代社会中的应用。人工智能技术正在快速发展，它已经渗透到我们生活的各个方面。",
          processingStats: {
            gpuAcceleration: true,
            tensorrtUsed: true,
            speedup: 2.4,
            accuracy: 94.2
          }
        };
        
        await storage.updateJob(jobId, {
          status: "completed",
          progress: 100,
          results: mockResults,
          processingTime: Math.floor(Math.random() * 120) + 60, // 1-3 minutes
          completedAt: new Date()
        });
        
        // Job completed - real-time updates would be handled by frontend polling
        
        return;
      }
      
      const messages = [
        "Extracting audio from video...",
        "Initializing GPU acceleration...",
        "Loading TensorRT optimized model...",
        "Processing audio segments...",
        "Applying Chinese text processing...",
        "Handling multi-pronunciation characters...",
        "Segmenting sentences with Jieba...",
        "Adding smart punctuation...",
        "Finalizing transcription..."
      ];
      
      const messageIndex = Math.floor((progress / 100) * messages.length);
      const message = messages[Math.min(messageIndex, messages.length - 1)];
      
      await updateProgress(Math.min(progress, 99), message);
    }, 2000); // Update every 2 seconds
    
    this.activeJobs.set(jobId, interval);
  }
  
  stopJob(jobId: number) {
    const interval = this.activeJobs.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.activeJobs.delete(jobId);
    }
  }
}

const transcriptionSimulator = new TranscriptionSimulator();

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Get all transcription jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const jobs = await storage.getJobs(status);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Get specific job
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // Upload video file and create transcription job
  app.post("/api/upload", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const settings = req.body.settings ? JSON.parse(req.body.settings) : {
        variant: 'simplified',
        multiPronunciation: true,
        smartPunctuation: true,
        segmentationMethod: 'jieba'
      };

      const model = req.body.model || 'whisper-large-v3';
      const tensorrtEnabled = req.body.tensorrtEnabled === 'true';
      const gpuOptimization = req.body.gpuOptimization === 'true';

      const outputFormats = req.body.outputFormats 
        ? req.body.outputFormats.split(',')
        : ['srt', 'vtt'];

      // Get video metadata using ffprobe (simulated)
      const stats = fs.statSync(req.file.path);
      
      const jobData = {
        filename: req.file.originalname,
        originalPath: req.file.path,
        fileSize: stats.size,
        resolution: "1920x1080", // Would be extracted from video
        duration: Math.floor(Math.random() * 7200) + 600, // 10min - 2hr (simulated)
        language: req.body.language || "zh",
        model,
        settings,
        outputFormats
      };

      const job = await storage.createJob(jobData);
      
      res.json(job);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Update job status/progress
  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = updateJobSchema.parse(req.body);
      
      const job = await storage.updateJob(id, updates);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // Delete job
  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Stop transcription if running
      transcriptionSimulator.stopJob(id);
      
      const deleted = await storage.deleteJob(id);
      if (!deleted) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Get available models
  app.get("/api/models", async (req, res) => {
    try {
      const { AVAILABLE_MODELS } = await import("@shared/schema");
      
      // Simulate GPU compatibility check for RTX 3060 Ti
      const modelsWithCompatibility = AVAILABLE_MODELS.map(model => ({
        ...model,
        available: true,
        memoryUsage: model.gpuMemoryRequired,
        estimatedSpeed: model.name.includes('large') ? 'slow' : model.name.includes('medium') ? 'medium' : 'fast',
        rtx3060tiOptimized: true
      }));
      
      res.json({
        models: modelsWithCompatibility,
        gpuInfo: {
          name: "NVIDIA GeForce RTX 3060 Ti",
          memoryTotal: 8192,
          memoryAvailable: 6144,
          cudaVersion: "12.1",
          tensorrtSupported: true
        }
      });
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });

  // Get system metrics
  app.get("/api/system/metrics", async (req, res) => {
    try {
      const metrics = await storage.getLatestSystemMetrics();
      
      if (!metrics) {
        // Return simulated metrics
        const simulatedMetrics = {
          gpuUtilization: Math.floor(Math.random() * 30) + 70, // 70-100%
          vramUsage: Math.floor(Math.random() * 2000) + 5000, // 5-7GB in MB
          temperature: Math.floor(Math.random() * 15) + 65, // 65-80°C
          activeJobs: await storage.getJobs("processing").then(jobs => jobs.length),
          tensorrtStatus: true,
          timestamp: new Date()
        };
        
        // Store the simulated metrics
        await storage.addSystemMetrics(simulatedMetrics);
        return res.json(simulatedMetrics);
      }
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  // Get system metrics history
  app.get("/api/system/metrics/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const history = await storage.getSystemMetricsHistory(limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching metrics history:", error);
      res.status(500).json({ message: "Failed to fetch metrics history" });
    }
  });

  // Start transcription job
  app.post("/api/jobs/:id/start", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.status !== "pending") {
        return res.status(400).json({ message: "Job is not in pending status" });
      }

      // Update job status to processing
      await storage.updateJob(id, { status: "processing", progress: 0 });
      
      // Start the simulated transcription process
      transcriptionSimulator.startJob(id);
      
      res.json({ message: "Transcription started", jobId: id });
    } catch (error) {
      console.error("Error starting transcription:", error);
      res.status(500).json({ message: "Failed to start transcription" });
    }
  });

  // Download transcription results
  app.get("/api/jobs/:id/download/:format", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const format = req.params.format.toLowerCase();
      
      const job = await storage.getJob(id);
      if (!job || job.status !== "completed") {
        return res.status(404).json({ message: "Job not found or not completed" });
      }

      if (!job.results || typeof job.results !== 'object' || !('segments' in job.results)) {
        return res.status(404).json({ message: "No transcription results available" });
      }

      const results = job.results as any;
      if (!results.segments) {
        return res.status(404).json({ message: "No transcription segments available" });
      }

      // Generate subtitle content based on format
      let content = "";
      const segments = results.segments;

      if (format === "srt") {
        content = generateSRT(segments);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      } else if (format === "vtt") {
        content = generateVTT(segments);
        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
      } else if (format === "txt") {
        content = results.fullText || segments.map((s: any) => s.text).join(" ");
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      } else {
        return res.status(400).json({ message: "Unsupported format" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${job.filename}.${format}"`);
      res.send(content);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Simulate periodic system metrics updates
  setInterval(async () => {
    try {
      const metrics = {
        gpuUtilization: Math.floor(Math.random() * 30) + 70,
        vramUsage: Math.floor(Math.random() * 2000) + 5000,
        temperature: Math.floor(Math.random() * 15) + 65,
        activeJobs: await storage.getJobs("processing").then(jobs => jobs.length),
        tensorrtStatus: true
      };
      
      await storage.addSystemMetrics(metrics);
      
      // System metrics updated - real-time updates handled by frontend polling
    } catch (error) {
      console.error("Error updating system metrics:", error);
    }
  }, 3000); // Every 3 seconds

  return httpServer;
}

function formatTime(seconds: number, useComma: boolean = true): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  
  const separator = useComma ? ',' : '.';
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}${separator}${millis.toString().padStart(3, '0')}`;
}

function generateSRT(segments: any[]): string {
  return segments.map((segment, index) => {
    const startTime = formatTime(segment.start, true);
    const endTime = formatTime(segment.end, true);
    
    return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
  }).join('\n');
}

function generateVTT(segments: any[]): string {
  let content = "WEBVTT\n\n";
  
  content += segments.map(segment => {
    const startTime = formatTime(segment.start, false);
    const endTime = formatTime(segment.end, false);
    
    return `${startTime} --> ${endTime}\n${segment.text}\n`;
  }).join('\n');
  
  return content;
}
