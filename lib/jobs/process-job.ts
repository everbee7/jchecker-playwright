import type { ObjectId } from "mongodb";
import { collections } from "@/lib/mongodb/collections";
import { ensureIndexes } from "@/lib/mongodb/indexes";
import { scrapeJob } from "@/lib/scraping/scrape-job";
import { sourceFromUrl } from "@/lib/scraping/text-utils";
import { normalizeUrl } from "@/lib/urls/normalize-url";
import { detectTechnologies } from "@/lib/detection/detect-technologies";
import { detectRequirements } from "@/lib/detection/detect-requirements";
import { calculateMatch } from "@/lib/detection/calculate-match";
import type { AppSettings } from "@/types/settings";
import type { JobDocument } from "@/types/job";
export async function processJob(
  url: string,
  settings: AppSettings,
  force = false,
): Promise<ObjectId> {
  await ensureIndexes();
  const { jobs } = await collections();
  const normalizedUrl = normalizeUrl(url);
  const existing = await jobs.findOne({ normalizedUrl });
  if (existing && !force) return existing._id!;
  const now = new Date();
  const base: Omit<JobDocument, "_id"> = {
    url,
    normalizedUrl,
    finalUrl: url,
    source: sourceFromUrl(url),
    title: null,
    company: null,
    location: null,
    remoteStatus: "unknown",
    employmentType: null,
    salary: null,
    descriptionText: "",
    descriptionHtml: null,
    technologies: [],
    match: {
      score: 0,
      level: "weak",
      wanted: [],
      unwanted: [],
      other: [],
      reasons: [],
    },
    requirements: {
      minimumYears: null,
      seniority: "unknown",
      workAuthorization: null,
      visaSponsorship: null,
      locationRestriction: null,
    },
    datePosted: null,
    validThrough: null,
    scrapeStatus: "processing",
    scrapingMethod: null,
    scrapeError: null,
    httpStatus: null,
    proposalStatus: existing?.proposalStatus ?? "not-submitted",
    proposalSubmittedAt: existing?.proposalSubmittedAt ?? null,
    scrapedAt: null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const result = await jobs.findOneAndUpdate(
    { normalizedUrl },
    { $set: { ...base, createdAt: existing?.createdAt ?? now } },
    { upsert: true, returnDocument: "after" },
  );
  if (!result?._id) throw new Error("Could not create job record");
  try {
    const { job, httpStatus } = await scrapeJob(url, settings.requestTimeoutMs);
    const technologies = detectTechnologies(
      job.descriptionText,
      settings.technologyCatalog,
    );
    const match = calculateMatch(
      technologies,
      settings.wantedTechnologies,
      settings.unwantedTechnologies,
    );
    const requirements = detectRequirements(
      job.descriptionText,
      job.title ?? "",
    );
    const duplicate = await jobs.findOne({
      _id: { $ne: result._id },
      title: job.title,
      company: job.company,
      location: job.location,
    });
    await jobs.updateOne(
      { _id: result._id },
      {
        $set: {
          ...job,
          technologies,
          match,
          requirements,
          httpStatus,
          scrapeStatus: "completed",
          scrapeError: null,
          scrapedAt: new Date(),
          updatedAt: new Date(),
          duplicateWarning: duplicate
            ? `Possible duplicate of ${duplicate._id?.toString()}`
            : null,
        },
      },
    );
    return result._id;
  } catch (error) {
    const httpStatus =
      typeof error === "object" &&
      error &&
      "httpStatus" in error &&
      typeof error.httpStatus === "number"
        ? error.httpStatus
        : null;
    await jobs.updateOne(
      { _id: result._id },
      {
        $set: {
          scrapeStatus: "failed",
          scrapeError:
            error instanceof Error ? error.message : "Unknown scraping error",
          httpStatus,
          scrapedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );
    return result._id;
  }
}
