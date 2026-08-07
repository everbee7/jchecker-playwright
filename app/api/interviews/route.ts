import type { Filter, Sort } from "mongodb";
import type { InterviewDocument } from "@/types/interview";
import { collections } from "@/lib/mongodb/collections";
import { ensureIndexes } from "@/lib/mongodb/indexes";
import { interviewFields } from "@/lib/interviews/document";
import { serializeInterview } from "@/lib/interviews/serialize";
import { apiError, interviewInputSchema } from "@/lib/validation/schemas";
import { assertInterviewStatus } from "@/lib/interviews/stages";
import { getDataOwner } from "@/lib/mongodb/tenant";

const terminalStatuses = ["offer", "cancelled", "failed"] as const;
const sortFields: Record<string, keyof InterviewDocument> = {
  scheduled: "scheduledAt",
  updated: "updatedAt",
  company: "company",
  status: "status",
};

function escaped(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    await ensureIndexes();
    const query = new URL(request.url).searchParams;
    const page = Math.max(1, Number(query.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.get("limit")) || 30));
    const owner = getDataOwner();
    const filter: Filter<InterviewDocument> = { owner };
    const search = query.get("search")?.trim();
    if (search) {
      const pattern = { $regex: escaped(search), $options: "i" };
      filter.$or = [
        { company: pattern },
        { role: pattern },
        { position: pattern },
        { clientName: pattern },
        { "interviewers": pattern },
      ];
    }
    const status = query.get("status");
    const type = query.get("type");
    if (status) filter.status = status as InterviewDocument["status"];
    if (type) filter.type = type as InterviewDocument["type"];
    if (query.get("scope") === "upcoming") {
      filter.scheduledAt = { $gte: new Date() };
      filter.status = { $nin: [...terminalStatuses] };
    }
    const sortField = sortFields[query.get("sortBy") ?? ""] ?? "scheduledAt";
    const sortOrder = query.get("sortOrder") === "desc" ? -1 : 1;
    const { interviews } = await collections();
    const now = new Date();
    const [items, total, all, upcoming, awaiting, offers] = await Promise.all([
      interviews
        .find(filter)
        .sort({ [sortField]: sortOrder, updatedAt: -1 } as Sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      interviews.countDocuments(filter),
      interviews.countDocuments({ owner }),
      interviews.countDocuments({
        owner,
        scheduledAt: { $gte: now },
        status: { $nin: [...terminalStatuses] },
      }),
      interviews.countDocuments({ owner, status: "awaiting-feedback" }),
      interviews.countDocuments({ owner, status: "offer" }),
    ]);
    return Response.json({
      interviews: items.map(serializeInterview),
      total,
      page,
      pages: Math.ceil(total / limit),
      summary: { total: all, upcoming, awaiting, offers },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await ensureIndexes();
    const input = interviewInputSchema.parse(await request.json());
    const owner = getDataOwner();
    await assertInterviewStatus(input.status);
    const now = new Date();
    const document: InterviewDocument = {
      owner,
      ...interviewFields(input),
      statusHistory: [{ status: input.status, changedAt: now }],
      createdAt: now,
      updatedAt: now,
    };
    const { interviews } = await collections();
    const result = await interviews.insertOne(document);
    document._id = result.insertedId;
    return Response.json(serializeInterview(document), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
