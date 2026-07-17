import type { ObjectId } from "mongodb";

export type InterviewStatus =
  | "scheduled"
  | "preparing"
  | "completed"
  | "awaiting-feedback"
  | "next-round"
  | "offer"
  | "rejected"
  | "cancelled";

export type InterviewType =
  | "recruiter-screen"
  | "phone-screen"
  | "technical"
  | "coding"
  | "system-design"
  | "behavioral"
  | "hiring-manager"
  | "panel"
  | "client"
  | "final"
  | "other";

export interface InterviewStatusEvent {
  status: InterviewStatus;
  changedAt: Date;
}

export interface InterviewDocument {
  _id?: ObjectId;
  linkedJobId: ObjectId | null;
  jobUrl: string | null;
  company: string;
  role: string;
  position: string | null;
  clientName: string | null;
  type: InterviewType;
  status: InterviewStatus;
  roundNumber: number | null;
  scheduledAt: Date | null;
  timezone: string | null;
  durationMinutes: number | null;
  location: string | null;
  meetingLink: string | null;
  interviewers: string[];
  recruiterName: string | null;
  recruiterEmail: string | null;
  recruiterPhone: string | null;
  employmentType: string | null;
  salaryRange: string | null;
  notes: string;
  preparationNotes: string;
  questionsToAsk: string;
  followUpNotes: string;
  outcomeNotes: string;
  nextSteps: string;
  statusHistory: InterviewStatusEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SerializedInterview extends Omit<
  InterviewDocument,
  "_id" | "linkedJobId" | "scheduledAt" | "statusHistory" | "createdAt" | "updatedAt"
> {
  _id: string;
  linkedJobId: string | null;
  scheduledAt: string | null;
  statusHistory: Array<{ status: InterviewStatus; changedAt: string }>;
  createdAt: string;
  updatedAt: string;
}
