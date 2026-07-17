import { Badge } from "@/components/ui/badge";
import { interviewLabel } from "@/lib/interviews/constants";
import type { InterviewStatus } from "@/types/interview";

const tones: Record<
  InterviewStatus,
  "slate" | "blue" | "green" | "amber" | "red" | "violet"
> = {
  scheduled: "blue",
  preparing: "amber",
  completed: "green",
  "awaiting-feedback": "violet",
  "next-round": "blue",
  offer: "green",
  rejected: "red",
  cancelled: "slate",
};

export function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  return <Badge tone={tones[status]}>{interviewLabel(status)}</Badge>;
}
