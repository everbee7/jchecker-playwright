import { ObjectId } from "mongodb";
import { collections } from "@/lib/mongodb/collections";
import { getSettings } from "@/lib/mongodb/settings";
import { getDataOwner } from "@/lib/mongodb/tenant";
import { closeBrowser } from "@/lib/scraping/playwright-browser";
import { mapConcurrent } from "./concurrency";
import { processJob } from "./process-job";

export async function createRun(links: string[]): Promise<ObjectId> {
  const owner = getDataOwner();
  const { runs } = await collections();
  const result = await runs.insertOne({
    owner,
    totalLinks: links.length,
    completedCount: 0,
    failedCount: 0,
    status: "pending",
    jobIds: [],
    currentJobs: [],
    createdAt: new Date(),
    completedAt: null,
  });
  return result.insertedId;
}

export async function processBatch(runId: ObjectId, links: string[]): Promise<void> {
  const { runs, jobs } = await collections();
  const settings = await getSettings();
  const owner = settings.owner;
  const runFilter = { _id: runId, owner };
  await runs.updateOne(runFilter, { $set: { status: "processing" } });
  try {
    await mapConcurrent(links, settings.scrapingConcurrency, async (link) => {
      await runs.updateOne(runFilter, { $addToSet: { currentJobs: link } });
      try {
        const jobId = await processJob(link, settings);
        const job = await jobs.findOne({ _id: jobId, owner });
        await runs.updateOne(runFilter, {
          $inc: job?.scrapeStatus === "failed" ? { failedCount: 1 } : { completedCount: 1 },
          $addToSet: { jobIds: jobId },
          $pull: { currentJobs: link },
        });
      } catch {
        await runs.updateOne(runFilter, {
          $inc: { failedCount: 1 },
          $pull: { currentJobs: link },
        });
      }
    });
  } finally {
    await closeBrowser().catch(() => undefined);
    await runs.updateOne(runFilter, {
      $set: { status: "completed", currentJobs: [], completedAt: new Date() },
    });
  }
}
