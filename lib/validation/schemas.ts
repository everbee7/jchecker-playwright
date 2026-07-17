import { z } from "zod";
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
export const settingsSchema = z.object({
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
