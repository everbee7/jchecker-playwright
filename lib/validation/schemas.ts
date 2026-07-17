import { z } from "zod";
import type { InterviewStatus } from "@/types/interview";
export const extractLinksSchema = z.object({ text: z.string().max(1_000_000) });
export const checkJobsSchema = z.object({
  links: z.array(z.string().url()).min(1).max(500),
});
const technologyCategorySchema = z.enum([
  "frontend",
  "backend",
  "language",
  "database",
  "cloud",
  "devops",
  "mobile",
  "testing",
  "architecture",
  "other",
]);
const technologyCatalogItemSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: technologyCategorySchema,
  aliases: z.array(z.string().trim().min(1).max(100)).max(30),
  patterns: z.array(z.string().min(1).max(500)).max(10).optional(),
});
const interviewPipelineStageSchema = z.object({
  id: z.string().regex(/^custom-[a-z0-9][a-z0-9-]{0,79}$/).transform((value) => value as InterviewStatus),
  label: z.string().trim().min(1).max(60),
  description: z.string().trim().max(120).default("Custom workflow step"),
  color: z.enum(["blue", "violet", "cyan", "green", "slate", "red", "amber", "orange", "fuchsia", "teal"]).default("fuchsia"),
  custom: z.literal(true),
});
export const settingsSchema = z.object({
  webAppUrl: z.string().trim().url().max(500).nullable().optional().default(null),
  wantedTechnologies: z.array(z.string().trim().min(1).max(60)).max(100),
  unwantedTechnologies: z.array(z.string().trim().min(1).max(60)).max(100),
  scrapingConcurrency: z.number().int().min(1).max(10),
  requestTimeoutMs: z.number().int().min(3000).max(60000),
  technologyCatalog: z
    .array(technologyCatalogItemSchema)
    .min(1)
    .max(500)
    .refine(
      (items) =>
        new Set(items.map((item) => item.name.toLowerCase())).size ===
        items.length,
      "Technology names must be unique",
    ),
  interviewCustomStages: z.array(interviewPipelineStageSchema).max(20).optional().default([]),
});
const nullableText = (max: number) =>
  z.string().trim().max(max).nullable().optional().default(null);
export const interviewStatusSchema = z.union([
  z.enum(["scheduled", "awaiting-feedback", "next-round", "offer", "cancelled", "failed"]),
  z.string().regex(/^custom-[a-z0-9][a-z0-9-]{0,79}$/),
]).transform((value) => value as InterviewStatus);
export const interviewTypeSchema = z.enum([
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
]);
export const interviewInputSchema = z.object({
  linkedJobId: nullableText(24).refine(
    (value) => !value || /^[a-f\d]{24}$/i.test(value),
    "Invalid linked job ID",
  ),
  jobUrl: z.string().trim().url().nullable().optional().default(null),
  company: z.string().trim().min(1).max(150),
  role: z.string().trim().min(1).max(180),
  position: nullableText(120),
  clientName: nullableText(150),
  type: interviewTypeSchema,
  status: interviewStatusSchema,
  roundNumber: z.number().int().min(1).max(30).nullable().optional().default(null),
  scheduledAt: z.string().datetime().nullable().optional().default(null),
  timezone: nullableText(80),
  durationMinutes: z.number().int().min(5).max(1440).nullable().optional().default(null),
  location: nullableText(250),
  meetingLink: z.string().trim().url().nullable().optional().default(null),
  interviewers: z.array(z.string().trim().min(1).max(150)).max(30).default([]),
  recruiterName: nullableText(150),
  recruiterEmail: z.string().trim().email().nullable().optional().default(null),
  recruiterPhone: nullableText(80),
  employmentType: nullableText(100),
  salaryRange: nullableText(120),
  notes: z.string().max(20_000).default(""),
  preparationNotes: z.string().max(20_000).default(""),
  questionsToAsk: z.string().max(20_000).default(""),
  followUpNotes: z.string().max(20_000).default(""),
  outcomeNotes: z.string().max(20_000).default(""),
  nextSteps: z.string().max(20_000).default(""),
});
export function apiError(error: unknown, status = 500) {
  if (error instanceof z.ZodError)
    return Response.json(
      { error: "Invalid request", details: error.flatten() },
      { status: 400 },
    );
  return Response.json(
    { error: error instanceof Error ? error.message : "Unexpected error" },
    { status },
  );
}
