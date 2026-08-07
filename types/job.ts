import type { ObjectId } from "mongodb";
import type { RemoteStatus } from "./scraping";
export type TechnologyCategory =
  | "frontend"
  | "backend"
  | "language"
  | "database"
  | "cloud"
  | "devops"
  | "mobile"
  | "testing"
  | "architecture"
  | "other";
export type TechnologyImportance =
  "required" | "preferred" | "nice-to-have" | "mentioned";
export interface DetectedTechnology {
  name: string;
  normalizedName: string;
  category: TechnologyCategory;
  importance: TechnologyImportance;
  mentionCount: number;
  evidence: string[];
}
export interface JobMatch {
  score: number;
  level: "strong" | "good" | "possible" | "weak";
  wanted: string[];
  unwanted: string[];
  other: string[];
  reasons: string[];
}
export interface JobRequirements {
  minimumYears: number | null;
  seniority:
    | "intern"
    | "junior"
    | "mid-level"
    | "senior"
    | "staff"
    | "principal"
    | "lead"
    | "manager"
    | "unknown";
  workAuthorization: string | null;
  visaSponsorship: string | null;
  locationRestriction: string | null;
}
export interface JobDocument {
  _id?: ObjectId;
  owner: string;
  url: string;
  normalizedUrl: string;
  finalUrl: string;
  source: string;
  title: string | null;
  company: string | null;
  location: string | null;
  remoteStatus: RemoteStatus;
  employmentType: string | null;
  salary: string | null;
  descriptionText: string;
  descriptionHtml: string | null;
  technologies: DetectedTechnology[];
  match: JobMatch;
  requirements: JobRequirements;
  datePosted: string | null;
  validThrough: string | null;
  scrapeStatus: "pending" | "processing" | "completed" | "failed";
  scrapingMethod: string | null;
  scrapeError: string | null;
  httpStatus: number | null;
  duplicateWarning?: string | null;
  proposalStatus: "not-submitted" | "submitted";
  proposalSubmittedAt: Date | null;
  scrapedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface SerializedJob extends Omit<
  JobDocument,
  "_id" | "createdAt" | "updatedAt" | "scrapedAt" | "proposalSubmittedAt"
> {
  _id: string;
  createdAt: string;
  updatedAt: string;
  scrapedAt: string | null;
  proposalSubmittedAt: string | null;
}
