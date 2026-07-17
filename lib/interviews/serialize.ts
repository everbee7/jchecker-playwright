import type { InterviewDocument, SerializedInterview } from "@/types/interview";

export function serializeInterview(
  interview: InterviewDocument,
): SerializedInterview {
  return {
    ...interview,
    _id: interview._id?.toString() ?? "",
    linkedJobId: interview.linkedJobId?.toString() ?? null,
    scheduledAt: interview.scheduledAt?.toISOString() ?? null,
    statusHistory: interview.statusHistory.map((event) => ({
      status: event.status,
      changedAt: event.changedAt.toISOString(),
    })),
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
  };
}
