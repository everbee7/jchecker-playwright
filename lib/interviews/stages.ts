import type { InterviewPipelineStage, InterviewStatus } from "@/types/interview";
import { allInterviewStages } from "./constants";
import { getSettings } from "@/lib/mongodb/settings";

export async function getInterviewStages(): Promise<InterviewPipelineStage[]> {
  const settings = await getSettings();
  return allInterviewStages(settings.interviewCustomStages, settings.interviewStageOrder);
}

export async function assertInterviewStatus(status: InterviewStatus): Promise<void> {
  const stages = await getInterviewStages();
  if (!stages.some((stage) => stage.id === status)) {
    throw new Error("Interview stage does not exist");
  }
}
