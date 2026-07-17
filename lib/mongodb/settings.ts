import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { AppSettings } from "@/types/settings";
import { collections } from "./collections";
export async function getSettings(): Promise<AppSettings> {
  const { settings } = await collections();
  const current = await settings.findOne({});
  if (current) {
    if (!current.technologyCatalog?.length) {
      const technologyCatalog = DEFAULT_SETTINGS.technologyCatalog.map(
        (technology) => ({ ...technology, aliases: [...technology.aliases] }),
      );
      await settings.updateOne(
        { _id: current._id },
        { $set: { technologyCatalog } },
      );
      return { ...current, webAppUrl: current.webAppUrl ?? null, technologyCatalog };
    }
    return { ...current, webAppUrl: current.webAppUrl ?? null };
  }
  const value: AppSettings = {
    ...DEFAULT_SETTINGS,
    technologyCatalog: DEFAULT_SETTINGS.technologyCatalog.map((technology) => ({
      ...technology,
      aliases: [...technology.aliases],
    })),
  };
  await settings.insertOne(value);
  return value;
}
