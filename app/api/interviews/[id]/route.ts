import { ObjectId } from "mongodb";
import { collections } from "@/lib/mongodb/collections";
import { interviewFields } from "@/lib/interviews/document";
import { serializeInterview } from "@/lib/interviews/serialize";
import {
  apiError,
  interviewInputSchema,
  interviewStatusSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";
import { assertInterviewStatus } from "@/lib/interviews/stages";
import { getDataOwner } from "@/lib/mongodb/tenant";

async function idOf(params: Promise<{ id: string }>): Promise<ObjectId | null> {
  const { id } = await params;
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await idOf(params);
    if (!id) return Response.json({ error: "Invalid interview ID" }, { status: 400 });
    const owner = getDataOwner();
    const { interviews } = await collections();
    const interview = await interviews.findOne({ _id: id, owner });
    return interview
      ? Response.json(serializeInterview(interview))
      : Response.json({ error: "Interview not found" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await idOf(params);
    if (!id) return Response.json({ error: "Invalid interview ID" }, { status: 400 });
    const input = interviewInputSchema.parse(await request.json());
    const owner = getDataOwner();
    await assertInterviewStatus(input.status);
    const { interviews } = await collections();
    const current = await interviews.findOne({ _id: id, owner });
    if (!current) return Response.json({ error: "Interview not found" }, { status: 404 });
    const now = new Date();
    const statusHistory =
      current.status === input.status
        ? current.statusHistory
        : [...current.statusHistory, { status: input.status, changedAt: now }];
    const interview = await interviews.findOneAndUpdate(
      { _id: id, owner },
      {
        $set: {
          ...interviewFields(input),
          statusHistory,
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );
    return interview
      ? Response.json(serializeInterview(interview))
      : Response.json({ error: "Interview not found" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await idOf(params);
    if (!id) return Response.json({ error: "Invalid interview ID" }, { status: 400 });
    const { status } = z
      .object({ status: interviewStatusSchema })
      .parse(await request.json());
    await assertInterviewStatus(status);
    const owner = getDataOwner();
    const now = new Date();
    const { interviews } = await collections();
    const current = await interviews.findOne({ _id: id, owner });
    if (!current) return Response.json({ error: "Interview not found" }, { status: 404 });
    const update =
      current.status === status
        ? { $set: { updatedAt: now } }
        : {
            $set: { status, updatedAt: now },
            $push: { statusHistory: { status, changedAt: now } },
          };
    const interview = await interviews.findOneAndUpdate(
      { _id: id, owner },
      update,
      { returnDocument: "after" },
    );
    return interview
      ? Response.json(serializeInterview(interview))
      : Response.json({ error: "Interview not found" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await idOf(params);
    if (!id) return Response.json({ error: "Invalid interview ID" }, { status: 400 });
    const owner = getDataOwner();
    const { interviews } = await collections();
    const result = await interviews.deleteOne({ _id: id, owner });
    return Response.json({ deleted: result.deletedCount === 1 });
  } catch (error) {
    return apiError(error);
  }
}
