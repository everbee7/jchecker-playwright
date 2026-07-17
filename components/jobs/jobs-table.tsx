"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  Eye,
  RefreshCw,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Flag,
} from "lucide-react";
import type { SerializedJob } from "@/types/job";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/ui";
interface Result {
  jobs: SerializedJob[];
  total: number;
  page: number;
  pages: number;
}
const empty: Result = { jobs: [], total: 0, page: 1, pages: 0 };
export function JobsTable({ refreshKey = 0 }: { refreshKey?: number }) {
  const [result, setResult] = useState<Result>(empty);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [matchLevel, setMatchLevel] = useState("");
  const [technology, setTechnology] = useState("");
  const [source, setSource] = useState("");
  const [remote, setRemote] = useState("");
  const [status, setStatus] = useState("");
  const [unwanted, setUnwanted] = useState("");
  const [proposalStatus, setProposalStatus] = useState("");
  const [sort, setSort] = useState("score:desc");
  const [page, setPage] = useState(1);
  const toast = useToast();
  const load = useCallback(async () => {
    void refreshKey;
    setLoading(true);
    const [sortBy, sortOrder] = sort.split(":");
    const params = new URLSearchParams({
      page: String(page),
      limit: "25",
      sortBy,
      sortOrder,
    });
    if (search) params.set("search", search);
    if (matchLevel) params.set("matchLevel", matchLevel);
    if (technology) params.set("technology", technology);
    if (source) params.set("source", source);
    if (remote) params.set("remoteStatus", remote);
    if (status) params.set("scrapeStatus", status);
    if (unwanted) params.set("hasUnwanted", unwanted);
    if (proposalStatus) params.set("proposalStatus", proposalStatus);
    try {
      const response = await fetch(`/api/jobs?${params}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as Result & { error?: string };
      if (!response.ok) throw new Error(data.error);
      setResult(data);
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not load jobs",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    matchLevel,
    technology,
    source,
    remote,
    status,
    unwanted,
    proposalStatus,
    sort,
    refreshKey,
    toast,
  ]);
  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);
  useEffect(
    () => setPage(1),
    [
      search,
      matchLevel,
      technology,
      source,
      remote,
      status,
      unwanted,
      proposalStatus,
      sort,
    ],
  );
  function quick(type: string) {
    setMatchLevel(type === "strong" ? "strong" : "");
    setTechnology(["React", "Python", "Java", "Go"].includes(type) ? type : "");
    setStatus(type === "failed" ? "failed" : "");
    setProposalStatus(type === "submitted" ? "submitted" : "");
    setUnwanted("");
  }
  async function remove(id: string) {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    const response = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (response.ok) {
      toast("Job deleted");
      load();
    } else toast("Could not delete job", "error");
  }
  async function recheck(id: string) {
    toast("Rechecking job…");
    const response = await fetch(`/api/jobs/${id}/recheck`, { method: "POST" });
    if (response.ok) {
      toast("Job rechecked");
      load();
    } else {
      const data = (await response.json()) as { error?: string };
      toast(data.error ?? "Recheck failed", "error");
    }
  }
  async function toggleProposal(
    id: string,
    current: SerializedJob["proposalStatus"],
  ) {
    const proposalStatus =
      current === "submitted" ? "not-submitted" : "submitted";
    const response = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ proposalStatus }),
    });
    if (response.ok) {
      toast(
        proposalStatus === "submitted"
          ? "Proposal marked as submitted"
          : "Proposal flag cleared",
      );
      load();
    } else {
      const data = (await response.json()) as { error?: string };
      toast(data.error ?? "Could not update proposal status", "error");
    }
  }
  const filtered = Boolean(
    search ||
    matchLevel ||
    technology ||
    source ||
    remote ||
    status ||
    unwanted ||
    proposalStatus,
  );
  return (
    <Card className="overflow-hidden border-t-2 border-t-red-500/70">
      <div className="border-b border-slate-100 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-semibold">
              Job results{" "}
              <span className="ml-1 text-sm font-normal text-slate-400">
                {result.total.toLocaleString()}
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Review, filter, and compare analyzed roles.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All Jobs"],
              ["strong", "Strong Matches"],
              ["React", "React Jobs"],
              ["Python", "Python Jobs"],
              ["Java", "Java Jobs"],
              ["Go", "Go Jobs"],
              ["failed", "Failed Jobs"],
              ["submitted", "Submitted"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => quick(value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-700"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-8">
          <label className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, company, location…"
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <Select
            value={matchLevel}
            onChange={setMatchLevel}
            label="All matches"
            options={["strong", "good", "possible", "weak"]}
          />
          <Select
            value={technology}
            onChange={setTechnology}
            label="Any stack"
            options={[
              "React",
              "Next.js",
              "Node.js",
              "Python",
              "Java",
              "Go",
              "Angular",
              "Vue",
              "GitHub",
              "AI",
              "OpenAI",
              "AWS",
              "Docker",
              "Kubernetes",
              "PostgreSQL",
              "MongoDB",
            ]}
          />
          <Select
            value={remote}
            onChange={setRemote}
            label="Any location"
            options={["remote", "hybrid", "onsite", "unknown"]}
          />
          <Select
            value={status}
            onChange={setStatus}
            label="Any status"
            options={["completed", "processing", "failed"]}
          />
          <Select
            value={source}
            onChange={setSource}
            label="Any source"
            options={[
              "Lever",
              "Greenhouse",
              "Ashby",
              "Workday",
              "BambooHR",
              "Teamtailor",
              "Rippling",
              "Paylocity",
              "JobRight",
            ]}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
          >
            <option value="score:desc">Score ↓</option>
            <option value="score:asc">Score ↑</option>
            <option value="title:asc">Title A–Z</option>
            <option value="company:asc">Company A–Z</option>
            <option value="checked:desc">Recently checked</option>
            <option value="posted:desc">Date posted</option>
            <option value="source:asc">Source</option>
          </select>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <select
            value={unwanted}
            onChange={(e) => setUnwanted(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
          >
            <option value="">Any unwanted stack</option>
            <option value="true">Has unwanted technologies</option>
            <option value="false">No unwanted technologies</option>
          </select>
          <select
            value={proposalStatus}
            onChange={(event) => setProposalStatus(event.target.value)}
            className="h-8 w-44 rounded-lg border border-slate-200 bg-white px-2 pr-8 text-xs"
          >
            <option value="">Any proposal status</option>
            <option value="not-submitted">Not submitted</option>
            <option value="submitted">Submitted</option>
          </select>
          {filtered && (
            <button
              onClick={() => {
                setSearch("");
                setMatchLevel("");
                setTechnology("");
                setSource("");
                setRemote("");
                setStatus("");
                setUnwanted("");
                setProposalStatus("");
              }}
              className="flex items-center gap-1 text-xs font-semibold text-brand-600"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>
      <div className="scrollbar max-h-[650px] overflow-auto">
        <table className="min-w-[1320px] w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              {[
                "Score",
                "Job",
                "Location",
                "Remote",
                "Wanted stack",
                "Unwanted",
                "Other",
                "Source",
                "Flag",
                "Status",
                "Checked",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className={cn(
                    "border-b border-slate-200 px-4 py-3 font-semibold",
                    h === "Flag" && "text-center",
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 12 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="skeleton h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : result.jobs.map((job) => (
                  <JobRow
                    key={job._id}
                    job={job}
                    onDelete={remove}
                    onRecheck={recheck}
                    onToggleProposal={toggleProposal}
                  />
                ))}
          </tbody>
        </table>
        {!loading && !result.jobs.length && (
          <div className="grid place-items-center px-6 py-20 text-center">
            <div className="mb-3 rounded-full bg-slate-100 p-4">
              <Search className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="font-semibold">No jobs found</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {filtered
                ? "Try clearing a filter or using a broader search."
                : "Paste and analyze job links to populate your dashboard."}
            </p>
          </div>
        )}
      </div>
      {result.pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          <span>
            Page {result.page} of {result.pages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={page >= result.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
function Select({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
function JobRow({
  job,
  onDelete,
  onRecheck,
  onToggleProposal,
}: {
  job: SerializedJob;
  onDelete: (id: string) => void;
  onRecheck: (id: string) => void;
  onToggleProposal: (
    id: string,
    current: SerializedJob["proposalStatus"],
  ) => void;
}) {
  const tones = {
    strong: "green",
    good: "blue",
    possible: "amber",
    weak: "slate",
  } as const;
  return (
    <tr className="group hover:bg-brand-50/30">
      <td className="px-4 py-3">
        <div className="text-lg font-bold">{job.match.score}</div>
        <Badge
          tone={job.scrapeStatus === "failed" ? "red" : tones[job.match.level]}
        >
          {job.scrapeStatus === "failed"
            ? "Failed"
            : `${job.match.level[0].toUpperCase() + job.match.level.slice(1)} match`}
        </Badge>
      </td>
      <td className="max-w-64 px-4 py-3">
        <Link
          href={`/jobs/${job._id}`}
          className="block truncate font-semibold text-ink hover:text-brand-600"
        >
          {job.title || "Untitled job"}
        </Link>
        <div className="mt-1 truncate text-xs text-slate-500">
          {job.company || "Unknown company"}
        </div>
      </td>
      <td className="max-w-40 truncate px-4 py-3 text-xs text-slate-600">
        {job.location || "—"}
      </td>
      <td className="px-4 py-3">
        <Badge
          tone={
            job.remoteStatus === "remote"
              ? "green"
              : job.remoteStatus === "hybrid"
                ? "violet"
                : "slate"
          }
        >
          {job.remoteStatus}
        </Badge>
      </td>
      <td className="max-w-56 px-4 py-3">
        <Stacks values={job.match.wanted} tone="green" />
      </td>
      <td className="max-w-48 px-4 py-3">
        <Stacks values={job.match.unwanted} tone="red" />
      </td>
      <td className="max-w-48 px-4 py-3">
        <Stacks values={job.match.other} tone="slate" />
      </td>
      <td className="px-4 py-3 text-xs font-medium">{job.source}</td>
      <td className="w-16 px-3 py-3 text-center">
        <button
          onClick={() => onToggleProposal(job._id, job.proposalStatus)}
          aria-pressed={job.proposalStatus === "submitted"}
          aria-label={
            job.proposalStatus === "submitted"
              ? "Proposal submitted; click to clear"
              : "Proposal not submitted; click to mark submitted"
          }
          title={
            job.proposalStatus === "submitted"
              ? `Submitted${job.proposalSubmittedAt ? ` on ${new Date(job.proposalSubmittedAt).toLocaleDateString()}` : ""} — click to clear`
              : "Not submitted — click to mark submitted"
          }
          className={cn(
            "inline-grid h-8 w-8 place-items-center rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-amber-400/40",
            job.proposalStatus === "submitted"
              ? "border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-950/30"
              : "border-slate-200 bg-slate-50/60 text-slate-400 hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-300",
          )}
        >
          <Flag
            className={cn(
              "h-[17px] w-[17px]",
              job.proposalStatus === "submitted" && "fill-current",
            )}
          />
        </button>
      </td>
      <td className="px-4 py-3">
        <Badge
          tone={
            job.scrapeStatus === "completed"
              ? "green"
              : job.scrapeStatus === "failed"
                ? "red"
                : "blue"
          }
        >
          {job.scrapeStatus}
        </Badge>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
        {job.scrapedAt ? new Date(job.scrapedAt).toLocaleDateString() : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <Link
            href={`/jobs/${job._id}`}
            title="Open details"
            className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-brand-600"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <a
            href={job.finalUrl || job.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open original"
            className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-brand-600"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={() => onRecheck(job._id)}
            title="Recheck"
            className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-brand-600"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(job._id)}
            title="Delete"
            className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
function Stacks({
  values,
  tone,
}: {
  values: string[];
  tone: "green" | "red" | "slate";
}) {
  if (!values.length) return <span className="text-xs text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {values.slice(0, 3).map((v) => (
        <Badge key={v} tone={tone}>
          {v}
        </Badge>
      ))}
      {values.length > 3 && <Badge>+{values.length - 3}</Badge>}
    </div>
  );
}
