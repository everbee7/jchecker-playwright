import { InterviewDetail } from "@/components/interviews/interview-detail";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InterviewDetail id={id} />;
}
