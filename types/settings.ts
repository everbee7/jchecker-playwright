import type { ObjectId } from "mongodb";
import type { TechnologyCategory } from "./job";
import type { InterviewPipelineStage } from "./interview";
import type { InterviewStatus } from "./interview";

export interface TechnologyCatalogItem {
  name: string;
  category: TechnologyCategory;
  aliases: string[];
  patterns?: string[];
}

export interface AppSettings {
  _id?: ObjectId;
  owner: string;
  webAppUrl: string | null;
  wantedTechnologies: string[];
  unwantedTechnologies: string[];
  scrapingConcurrency: number;
  requestTimeoutMs: number;
  technologyCatalog: TechnologyCatalogItem[];
  interviewCustomStages: InterviewPipelineStage[];
  interviewStageOrder: InterviewStatus[];
}
export interface AnalysisRun {
  _id?: ObjectId;
  owner: string;
  totalLinks: number;
  completedCount: number;
  failedCount: number;
  status: "pending" | "processing" | "completed";
  jobIds: ObjectId[];
  currentJobs: string[];
  createdAt: Date;
  completedAt: Date | null;
}
