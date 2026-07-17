import { InterviewsWorkspace } from "@/components/interviews/interviews-workspace";

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;
  return <InterviewsWorkspace initialJobId={jobId ?? null} />;
}
