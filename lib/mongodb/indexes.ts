import { collections } from "./collections";
import type { Collection, Document } from "mongodb";
import { LEGACY_DATA_OWNER } from "./tenant";
let initialized: Promise<void> | null = null;
export function ensureIndexes() {
  initialized ??= (async () => {
    const { jobs, settings, runs, interviews } = await collections();
    const legacyJobs = jobs as unknown as Collection<Document>;
    const legacySettings = settings as unknown as Collection<Document>;
    const legacyRuns = runs as unknown as Collection<Document>;
    const legacyInterviews = interviews as unknown as Collection<Document>;
    await Promise.all([
      legacyJobs.updateMany({ owner: { $exists: false } }, { $set: { owner: LEGACY_DATA_OWNER } }),
      legacySettings.updateMany({ owner: { $exists: false } }, { $set: { owner: LEGACY_DATA_OWNER } }),
      legacyRuns.updateMany({ owner: { $exists: false } }, { $set: { owner: LEGACY_DATA_OWNER } }),
      legacyInterviews.updateMany({ owner: { $exists: false } }, { $set: { owner: LEGACY_DATA_OWNER } }),
      legacySettings.updateMany(
        { webAppUrl: { $exists: true } },
        { $unset: { webAppUrl: "" } },
      ),
    ]);
    const legacyInterviewStatuses = [
      ["preparing", "scheduled"],
      ["completed", "awaiting-feedback"],
      ["rejected", "failed"],
    ] as const;
    for (const [legacy, current] of legacyInterviewStatuses) {
      await legacyInterviews.updateMany(
        { status: legacy },
        { $set: { status: current } },
      );
      await legacyInterviews.updateMany(
        { "statusHistory.status": legacy },
        { $set: { "statusHistory.$[event].status": current } },
        { arrayFilters: [{ "event.status": legacy }] },
      );
    }
    await jobs.updateMany(
      { proposalStatus: { $exists: false } },
      { $set: { proposalStatus: "not-submitted", proposalSubmittedAt: null } },
    );
    const jobIndexes = await jobs.indexes();
    const oldNormalizedUrlIndex = jobIndexes.find(
      (index) => index.unique && Object.keys(index.key).length === 1 && index.key.normalizedUrl === 1,
    );
    if (oldNormalizedUrlIndex?.name) await jobs.dropIndex(oldNormalizedUrlIndex.name);
    const oldTextIndex = jobIndexes.find(
      (index) => Object.values(index.key).includes("text") && !("owner" in index.key),
    );
    if (oldTextIndex?.name) await jobs.dropIndex(oldTextIndex.name);
    await Promise.all([
      jobs.createIndex({ owner: 1, normalizedUrl: 1 }, { unique: true }),
      jobs.createIndex({ owner: 1, "match.score": -1 }),
      jobs.createIndex({ owner: 1, title: "text", company: "text", location: "text" }),
      jobs.createIndex({ owner: 1, scrapeStatus: 1, updatedAt: -1 }),
      jobs.createIndex({ owner: 1, proposalStatus: 1, proposalSubmittedAt: -1 }),
      settings.createIndex({ owner: 1 }, { unique: true }),
      runs.createIndex({ owner: 1, createdAt: -1 }),
      interviews.createIndex({ owner: 1, scheduledAt: 1, status: 1 }),
      interviews.createIndex({ owner: 1, company: 1, updatedAt: -1 }),
      interviews.createIndex({ owner: 1, linkedJobId: 1 }),
      interviews.createIndex({ owner: 1, status: 1, updatedAt: -1 }),
    ]);
  })();
  return initialized;
}
