import { collections } from "./collections";
import type { Collection, Document } from "mongodb";
let initialized: Promise<void> | null = null;
export function ensureIndexes() {
  initialized ??= (async () => {
    const { jobs, runs, interviews } = await collections();
    const legacyInterviews = interviews as unknown as Collection<Document>;
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
    await Promise.all([
      jobs.createIndex({ normalizedUrl: 1 }, { unique: true }),
      jobs.createIndex({ "match.score": -1 }),
      jobs.createIndex({ title: "text", company: "text", location: "text" }),
      jobs.createIndex({ scrapeStatus: 1, updatedAt: -1 }),
      jobs.createIndex({ proposalStatus: 1, proposalSubmittedAt: -1 }),
      runs.createIndex({ createdAt: -1 }),
      interviews.createIndex({ scheduledAt: 1, status: 1 }),
      interviews.createIndex({ company: 1, updatedAt: -1 }),
      interviews.createIndex({ linkedJobId: 1 }),
      interviews.createIndex({ status: 1, updatedAt: -1 }),
    ]);
  })();
  return initialized;
}
