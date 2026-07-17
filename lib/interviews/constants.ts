import type { InterviewStatus, InterviewType } from "@/types/interview";

export const INTERVIEW_STATUSES: InterviewStatus[] = [
  "scheduled",
  "preparing",
  "completed",
  "awaiting-feedback",
  "next-round",
  "offer",
  "rejected",
  "cancelled",
];

export const INTERVIEW_TYPES: InterviewType[] = [
  "recruiter-screen",
  "phone-screen",
  "technical",
  "coding",
  "system-design",
  "behavioral",
  "hiring-manager",
  "panel",
  "client",
  "final",
  "other",
];

export function interviewLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
