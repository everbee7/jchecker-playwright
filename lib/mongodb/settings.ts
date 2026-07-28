import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { AppSettings } from "@/types/settings";
import { collections } from "./collections";
import { allInterviewStages } from "@/lib/interviews/constants";
export async function getSettings(): Promise<AppSettings> {
  const { settings } = await collections();
  const current = await settings.findOne({});
  if (current) {
    const interviewCustomStages = (current.interviewCustomStages ?? []).map((stage) => ({
      ...stage,
      description: stage.description ?? "Custom workflow step",
      color: stage.color ?? "fuchsia",
      custom: true as const,
    }));
    const availableStageIds = allInterviewStages(interviewCustomStages).map((stage) => stage.id);
    const availableStageIdSet = new Set(availableStageIds);
    const savedOrder = current.interviewStageOrder ?? [];
    const interviewStageOrder = [
      ...new Set(savedOrder.filter((id) => availableStageIdSet.has(id))),
      ...availableStageIds.filter((id) => !savedOrder.includes(id)),
    ];
    const customStagesChanged = interviewCustomStages.some((stage, index) => stage.description !== current.interviewCustomStages?.[index]?.description || stage.color !== current.interviewCustomStages?.[index]?.color);
    const orderChanged = interviewStageOrder.length !== savedOrder.length || interviewStageOrder.some((id, index) => id !== savedOrder[index]);
    if (customStagesChanged || orderChanged) {
      await settings.updateOne({ _id: current._id }, { $set: { interviewCustomStages, interviewStageOrder } });
    }
    if (!current.technologyCatalog?.length) {
      const technologyCatalog = DEFAULT_SETTINGS.technologyCatalog.map(
        (technology) => ({ ...technology, aliases: [...technology.aliases] }),
      );
      await settings.updateOne(
        { _id: current._id },
        { $set: { technologyCatalog } },
      );
      return { ...current, webAppUrl: current.webAppUrl ?? null, technologyCatalog, interviewCustomStages, interviewStageOrder };
    }
    return { ...current, webAppUrl: current.webAppUrl ?? null, interviewCustomStages, interviewStageOrder };
  }
  const value: AppSettings = {
    ...DEFAULT_SETTINGS,
    technologyCatalog: DEFAULT_SETTINGS.technologyCatalog.map((technology) => ({
      ...technology,
      aliases: [...technology.aliases],
    })),
  };
  const result = await settings.insertOne(value);
  return { ...value, _id: result.insertedId };
}
