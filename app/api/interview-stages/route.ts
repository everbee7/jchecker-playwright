import { randomUUID } from "node:crypto";
import { z } from "zod";
import { collections } from "@/lib/mongodb/collections";
import { getSettings } from "@/lib/mongodb/settings";
import { allInterviewStages } from "@/lib/interviews/constants";
import { apiError, interviewStatusSchema } from "@/lib/validation/schemas";
import type { InterviewStatus } from "@/types/interview";

const colorSchema = z.enum(["blue", "violet", "cyan", "green", "slate", "red", "amber", "orange", "fuchsia", "teal"]);
const stageDetailsSchema = z.object({
  label: z.string().trim().min(1).max(60),
  description: z.string().trim().max(120).default("Custom workflow step"),
  color: colorSchema.default("fuchsia"),
});
const idSchema = z.string().regex(/^custom-[a-z0-9][a-z0-9-]{0,79}$/).transform((value) => value as InterviewStatus);

export async function GET() {
  try {
    const settings = await getSettings();
    return Response.json({ stages: allInterviewStages(settings.interviewCustomStages, settings.interviewStageOrder) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { label, description, color } = stageDetailsSchema.parse(await request.json());
    const current = await getSettings();
    if (allInterviewStages(current.interviewCustomStages, current.interviewStageOrder).some((stage) => stage.label.toLowerCase() === label.toLowerCase())) {
      return Response.json({ error: "A stage with this name already exists" }, { status: 409 });
    }
    if (current.interviewCustomStages.length >= 20) {
      return Response.json({ error: "A maximum of 20 custom stages is supported" }, { status: 400 });
    }
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "stage";
    const stage = { id: `custom-${slug}-${randomUUID().slice(0, 6)}` as const, label, description, color, custom: true as const };
    const { settings } = await collections();
    await settings.updateOne(
      { _id: current._id, owner: current.owner },
      { $push: { interviewCustomStages: stage, interviewStageOrder: stage.id } },
    );
    return Response.json(stage, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const input = stageDetailsSchema.extend({ id: idSchema }).parse(await request.json());
    const current = await getSettings();
    if (allInterviewStages(current.interviewCustomStages, current.interviewStageOrder).some((stage) => stage.id !== input.id && stage.label.toLowerCase() === input.label.toLowerCase())) {
      return Response.json({ error: "A stage with this name already exists" }, { status: 409 });
    }
    const { settings } = await collections();
    const result = await settings.updateOne(
      { _id: current._id, owner: current.owner, "interviewCustomStages.id": input.id },
      { $set: {
        "interviewCustomStages.$.label": input.label,
        "interviewCustomStages.$.description": input.description,
        "interviewCustomStages.$.color": input.color,
      } },
    );
    return result.matchedCount
      ? Response.json({ ...input, custom: true })
      : Response.json({ error: "Custom stage not found" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { order } = z.object({ order: z.array(interviewStatusSchema).max(26) }).parse(await request.json());
    const current = await getSettings();
    const stages = allInterviewStages(current.interviewCustomStages, current.interviewStageOrder);
    const stageIds = stages.map((stage) => stage.id);
    const uniqueOrder = new Set(order);
    if (order.length !== stageIds.length || uniqueOrder.size !== stageIds.length || stageIds.some((id) => !uniqueOrder.has(id))) {
      return Response.json({ error: "Stage order must include every current interview stage exactly once" }, { status: 400 });
    }
    const { settings } = await collections();
    await settings.updateOne(
      { _id: current._id, owner: current.owner },
      { $set: { interviewStageOrder: order } },
    );
    return Response.json({ stages: allInterviewStages(current.interviewCustomStages, order) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const id = idSchema.parse(new URL(request.url).searchParams.get("id")) as InterviewStatus;
    const current = await getSettings();
    const { interviews, settings } = await collections();
    if (await interviews.countDocuments({ owner: current.owner, status: id })) {
      return Response.json({ error: "Move interviews out of this stage before deleting it" }, { status: 409 });
    }
    const result = await settings.updateOne(
      { _id: current._id, owner: current.owner },
      { $pull: { interviewCustomStages: { id }, interviewStageOrder: id } },
    );
    return result.modifiedCount
      ? Response.json({ deleted: true })
      : Response.json({ error: "Custom stage not found" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}
