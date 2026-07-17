"use client";
import { useEffect, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { InputCard } from "./input-card";
import { ProgressCard, type RunState } from "./progress-card";
import { JobsTable } from "@/components/jobs/jobs-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
export function Dashboard({ jobsOnly = false }: { jobsOnly?: boolean }) {
  const [run, setRun] = useState<RunState | null>(null);
  const [refresh, setRefresh] = useState(0);
  const toast = useToast();
  async function start(links: string[]) {
    const response = await fetch("/api/jobs/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ links }),
    });
    const data = (await response.json()) as { runId?: string; error?: string };
    if (!response.ok || !data.runId)
      throw new Error(data.error ?? "Could not start analysis");
    setRun({
      _id: data.runId,
      totalLinks: links.length,
      completedCount: 0,
      failedCount: 0,
      status: "pending",
      currentJobs: [],
    });
    toast("Job analysis started");
  }
  const runId = run?._id;
  const runStatus = run?.status;
  useEffect(() => {
    if (!runId || runStatus === "completed") return;
    const timer = setInterval(async () => {
      const response = await fetch(`/api/runs/${runId}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const next = (await response.json()) as RunState;
      setRun(next);
      setRefresh((value) => value + 1);
      if (next.status === "completed")
        toast(
          `Analysis complete: ${next.completedCount} completed, ${next.failedCount} failed`,
          next.failedCount ? "error" : "success",
        );
    }, 1200);
    return () => clearInterval(timer);
  }, [runStatus, runId, toast]);
  async function deleteAll() {
    if (!confirm("Delete every saved job? This cannot be undone.")) return;
    const response = await fetch("/api/jobs", { method: "DELETE" });
    if (response.ok) {
      toast("All jobs deleted");
      setRefresh((v) => v + 1);
    } else toast("Could not delete jobs", "error");
  }
  return (
    <div className="mx-auto max-w-[1700px] p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
            Automated job intelligence
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {jobsOnly ? "Saved jobs" : "Find the roles that fit your stack"}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            {jobsOnly
              ? "Search and manage every analyzed opportunity."
              : "Turn a messy list of links into a ranked, searchable pipeline — without opening every tab."}
          </p>
        </div>
        {jobsOnly && (
          <Button variant="danger" onClick={deleteAll}>
            <Trash2 className="h-4 w-4" />
            Delete all jobs
          </Button>
        )}
      </header>
      <div className="space-y-5">
        {!jobsOnly && (
          <InputCard
            onRun={start}
            running={Boolean(run && run.status !== "completed")}
          />
        )}{" "}
        {run && <ProgressCard run={run} />}
        <JobsTable refreshKey={refresh} />
      </div>
    </div>
  );
}
