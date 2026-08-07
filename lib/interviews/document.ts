import { ObjectId } from "mongodb";
import type { z } from "zod";
import type { InterviewDocument } from "@/types/interview";
import type { interviewInputSchema } from "@/lib/validation/schemas";

type InterviewInput = z.infer<typeof interviewInputSchema>;

export function interviewFields(
  input: InterviewInput,
): Omit<InterviewDocument, "_id" | "owner" | "statusHistory" | "createdAt" | "updatedAt"> {
  return {
    ...input,
    linkedJobId: input.linkedJobId ? new ObjectId(input.linkedJobId) : null,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
  };
}
