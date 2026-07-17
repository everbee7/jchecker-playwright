import type { ObjectId } from "mongodb";
import type { TechnologyCategory } from "./job";

export interface TechnologyCatalogItem {
  name: string;
  category: TechnologyCategory;
  aliases: string[];
  patterns?: string[];
}

export interface AppSettings {
  _id?: ObjectId;
  webAppUrl: string | null;
  wantedTechnologies: string[];
  unwantedTechnologies: string[];
  scrapingConcurrency: number;
  requestTimeoutMs: number;
  technologyCatalog: TechnologyCatalogItem[];
}
export interface AnalysisRun {
  _id?: ObjectId;
  totalLinks: number;
  completedCount: number;
  failedCount: number;
  status: "pending" | "processing" | "completed";
  jobIds: ObjectId[];
  currentJobs: string[];
  createdAt: Date;
  completedAt: Date | null;
}
