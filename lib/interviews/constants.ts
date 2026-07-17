import type { CoreInterviewStatus, InterviewPipelineStage, InterviewStageColor, InterviewStatus, InterviewType } from "@/types/interview";

export const INTERVIEW_STATUSES: CoreInterviewStatus[] = [
  "scheduled",
  "awaiting-feedback",
  "next-round",
  "offer",
  "cancelled",
  "failed",
];

const CORE_LABELS: Record<CoreInterviewStatus, string> = {
  scheduled: "New Scheduled",
  "awaiting-feedback": "Awaiting Feedback",
  "next-round": "Next Round",
  offer: "Offer",
  cancelled: "Cancelled",
  failed: "Failed",
};

const CORE_STAGE_META: Record<CoreInterviewStatus, { description: string; color: InterviewStageColor }> = {
  scheduled: { description: "Interview booked", color: "blue" },
  "awaiting-feedback": { description: "Waiting on response", color: "violet" },
  "next-round": { description: "Moving forward", color: "cyan" },
  offer: { description: "Offer received", color: "green" },
  cancelled: { description: "Closed — cancelled", color: "slate" },
  failed: { description: "Closed — unsuccessful", color: "red" },
};

export const CORE_INTERVIEW_STAGES: InterviewPipelineStage[] = INTERVIEW_STATUSES.map((id) => ({
  id,
  label: CORE_LABELS[id],
  ...CORE_STAGE_META[id],
  custom: false,
}));

export function allInterviewStages(custom: InterviewPipelineStage[] = []): InterviewPipelineStage[] {
  return [...CORE_INTERVIEW_STAGES, ...custom];
}

export function interviewStatusLabel(status: InterviewStatus, stages?: InterviewPipelineStage[]): string {
  return stages?.find((stage) => stage.id === status)?.label ??
    (status in CORE_LABELS ? CORE_LABELS[status as CoreInterviewStatus] : interviewLabel(status.replace(/^custom-/, "")));
}

export const INTERVIEW_TYPES: InterviewType[] = [
  "recruiter-screen",
  "phone-screen",
  "technical",
  "coding",
  "system-design",
  "behavioral",
  "hiring-manager",
  "panel",
  "client",
  "final",
  "other",
];

export function interviewLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
