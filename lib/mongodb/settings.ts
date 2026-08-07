import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { AppSettings } from "@/types/settings";
import { collections } from "./collections";
import { allInterviewStages } from "@/lib/interviews/constants";
import { ensureIndexes } from "./indexes";
import { getDataOwner, LEGACY_DATA_OWNER } from "./tenant";
export async function getSettings(): Promise<AppSettings> {
  await ensureIndexes();
  const { settings } = await collections();
  const owner = getDataOwner();
  await settings.updateMany(
    { owner: { $exists: false } },
    { $set: { owner: LEGACY_DATA_OWNER } },
  );
  const current = await settings.findOne({ owner });
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
      await settings.updateOne({ _id: current._id, owner }, { $set: { interviewCustomStages, interviewStageOrder } });
    }
    if (!current.technologyCatalog?.length) {
      const technologyCatalog = DEFAULT_SETTINGS.technologyCatalog.map(
        (technology) => ({ ...technology, aliases: [...technology.aliases] }),
      );
      await settings.updateOne(
        { _id: current._id, owner },
        { $set: { technologyCatalog } },
      );
      return { ...current, webAppUrl: current.webAppUrl ?? null, technologyCatalog, interviewCustomStages, interviewStageOrder };
    }
    return { ...current, webAppUrl: current.webAppUrl ?? null, interviewCustomStages, interviewStageOrder };
  }
  const value: AppSettings = {
    ...DEFAULT_SETTINGS,
    owner,
    technologyCatalog: DEFAULT_SETTINGS.technologyCatalog.map((technology) => ({
      ...technology,
      aliases: [...technology.aliases],
    })),
  };
  const created = await settings.findOneAndUpdate(
    { owner },
    { $setOnInsert: value },
    { upsert: true, returnDocument: "after" },
  );
  if (!created) {
    throw new Error(`Unable to initialize settings for ${owner}`);
  }
  return created;
}
