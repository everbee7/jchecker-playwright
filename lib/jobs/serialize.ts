import type { JobDocument, SerializedJob } from "@/types/job";
export function serializeJob(job: JobDocument): SerializedJob {
  return {
    ...job,
    _id: job._id?.toString() ?? "",
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    scrapedAt: job.scrapedAt?.toISOString() ?? null,
    proposalStatus: job.proposalStatus ?? "not-submitted",
    proposalSubmittedAt: job.proposalSubmittedAt?.toISOString() ?? null,
  };
}
