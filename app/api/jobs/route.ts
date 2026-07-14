import type { Filter, Sort } from "mongodb";
import type { JobDocument } from "@/types/job";
import { collections } from "@/lib/mongodb/collections";
import { ensureIndexes } from "@/lib/mongodb/indexes";
import { serializeJob } from "@/lib/jobs/serialize";
import { apiError } from "@/lib/validation/schemas";
const allowedSort: Record<string, string> = {
  score: "match.score",
  title: "title",
  company: "company",
  checked: "scrapedAt",
  posted: "datePosted",
  source: "source",
};
export async function GET(request: Request) {
  try {
    await ensureIndexes();
    const query = new URL(request.url).searchParams;
    const page = Math.max(1, Number(query.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.get("limit")) || 25));
    const filter: Filter<JobDocument> = {};
    const search = query.get("search")?.trim();
    if (search)
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    const exact: [string, keyof JobDocument][] = [
      ["matchLevel", "match"],
      ["source", "source"],
      ["remoteStatus", "remoteStatus"],
      ["scrapeStatus", "scrapeStatus"],
      ["proposalStatus", "proposalStatus"],
    ];
    for (const [param] of exact) {
      const value = query.get(param);
      if (value)
        (filter as Record<string, unknown>)[
          param === "matchLevel" ? "match.level" : param
        ] = value;
    }
    const technology = query.get("technology");
    if (technology)
      filter["technologies.name"] = {
        $regex: `^${technology.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      };
    const wantedTechnology = query.get("wantedTechnology");
    if (wantedTechnology) filter["match.wanted"] = wantedTechnology;
    const unwantedTechnology = query.get("unwantedTechnology");
    if (unwantedTechnology) filter["match.unwanted"] = unwantedTechnology;
    const unwanted = query.get("hasUnwanted");
    if (unwanted === "true") filter["match.unwanted.0"] = { $exists: true };
    if (unwanted === "false") filter["match.unwanted.0"] = { $exists: false };
    const sortBy = allowedSort[query.get("sortBy") ?? ""] ?? "match.score";
    const sortOrder = query.get("sortOrder") === "asc" ? 1 : -1;
    const { jobs } = await collections();
    const [items, total] = await Promise.all([
      jobs
        .find(filter)
        .sort({ [sortBy]: sortOrder } as Sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      jobs.countDocuments(filter),
    ]);
    return Response.json({
      jobs: items.map(serializeJob),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE() {
  try {
    const { jobs } = await collections();
    const result = await jobs.deleteMany({});
    return Response.json({ deletedCount: result.deletedCount });
  } catch (error) {
    return apiError(error);
  }
}
