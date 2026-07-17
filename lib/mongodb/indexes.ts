import { collections } from "./collections";
let initialized: Promise<void> | null = null;
export function ensureIndexes() {
  initialized ??= (async () => {
    const { jobs, runs } = await collections();
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
    ]);
  })();
  return initialized;
}
