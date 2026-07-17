import { Badge } from "@/components/ui/badge";
import { interviewLabel } from "@/lib/interviews/constants";
import type { InterviewStatus } from "@/types/interview";

const tones: Record<
  string,
  "slate" | "blue" | "green" | "amber" | "red" | "violet"
> = {
  scheduled: "blue",
  "awaiting-feedback": "violet",
  "next-round": "blue",
  offer: "green",
  cancelled: "slate",
  failed: "red",
};

export function InterviewStatusBadge({ status, label }: { status: InterviewStatus; label?: string }) {
  return <Badge tone={tones[status] ?? "amber"}>{label ?? interviewLabel(status.replace(/^custom-/, ""))}</Badge>;
}
