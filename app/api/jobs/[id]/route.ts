import { ObjectId } from "mongodb";
import { collections } from "@/lib/mongodb/collections";
import { serializeJob } from "@/lib/jobs/serialize";
import { apiError } from "@/lib/validation/schemas";
import { z } from "zod";
import { getDataOwner } from "@/lib/mongodb/tenant";
async function idOf(params: Promise<{ id: string }>) {
  const { id } = await params;
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await idOf(params);
    if (!id) return Response.json({ error: "Invalid job ID" }, { status: 400 });
    const owner = getDataOwner();
    const { jobs } = await collections();
    const job = await jobs.findOne({ _id: id, owner });
    return job
      ? Response.json(serializeJob(job))
      : Response.json({ error: "Job not found" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await idOf(params);
    if (!id) return Response.json({ error: "Invalid job ID" }, { status: 400 });
    const owner = getDataOwner();
    const { jobs } = await collections();
    const result = await jobs.deleteOne({ _id: id, owner });
    return Response.json({ deleted: result.deletedCount === 1 });
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
    if (!id) return Response.json({ error: "Invalid job ID" }, { status: 400 });
    const owner = getDataOwner();
    const { proposalStatus } = z
      .object({ proposalStatus: z.enum(["not-submitted", "submitted"]) })
      .parse(await request.json());
    const submittedAt = proposalStatus === "submitted" ? new Date() : null;
    const { jobs } = await collections();
    const job = await jobs.findOneAndUpdate(
      { _id: id, owner },
      {
        $set: {
          proposalStatus,
          proposalSubmittedAt: submittedAt,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
    return job
      ? Response.json(serializeJob(job))
      : Response.json({ error: "Job not found" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}
