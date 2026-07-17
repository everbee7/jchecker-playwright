"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  RefreshCw,
  Trash2,
  MapPin,
  Building2,
  Wallet,
  Clock3,
  ShieldCheck,
  AlertTriangle,
  Flag,
  CalendarCheck2,
} from "lucide-react";
import type { SerializedJob, DetectedTechnology } from "@/types/job";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/ui";
import { copyToClipboard } from "@/lib/browser/copy-to-clipboard";
const tabs = [
  "Overview",
  "Stack Analysis",
  "Requirements",
  "Description",
  "Scraping Information",
] as const;
type Tab = (typeof tabs)[number];
export function JobDetail({ id }: { id: string }) {
  const [job, setJob] = useState<SerializedJob | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("Overview");
  const [busy, setBusy] = useState(false);
  const [flagBusy, setFlagBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const copyJobLink = async () => {
    if (!job) return;
    try {
      await copyToClipboard(job.finalUrl || job.url);
      toast("Job link copied");
    } catch {
      toast("Could not copy the job link", "error");
    }
  };
  useEffect(() => {
    void (async () => {
      const response = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
      const data = (await response.json()) as SerializedJob & {
        error?: string;
      };
      if (response.ok) setJob(data);
      else setError(data.error ?? "Job not found");
    })();
  }, [id]);
  async function recheck() {
    setBusy(true);
    const response = await fetch(`/api/jobs/${id}/recheck`, { method: "POST" });
    const data = (await response.json()) as SerializedJob & { error?: string };
    setBusy(false);
    if (response.ok) {
      setJob(data);
      toast("Job rechecked");
    } else toast(data.error ?? "Recheck failed", "error");
  }
  async function remove() {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    const response = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (response.ok) {
      toast("Job deleted");
      router.push("/jobs");
      router.refresh();
    } else toast("Could not delete job", "error");
  }
  async function toggleProposal() {
    if (!job) return;
    setFlagBusy(true);
    const proposalStatus =
      job.proposalStatus === "submitted" ? "not-submitted" : "submitted";
    const response = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ proposalStatus }),
    });
    const data = (await response.json()) as SerializedJob & { error?: string };
    setFlagBusy(false);
    if (response.ok) {
      setJob(data);
      toast(
        proposalStatus === "submitted"
          ? "Proposal marked as submitted"
          : "Proposal flag cleared",
      );
    } else toast(data.error ?? "Could not update proposal status", "error");
  }
  if (error)
    return (
      <div className="grid min-h-[70vh] place-items-center p-8">
        <Card className="max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto h-9 w-9 text-red-500" />
          <h1 className="mt-3 text-xl font-bold">Couldn’t load this job</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <Link
            href="/jobs"
            className="mt-5 inline-block text-sm font-semibold text-brand-600"
          >
            Back to jobs
          </Link>
        </Card>
      </div>
    );
  if (!job)
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-8">
        <div className="skeleton h-9 w-1/2 rounded-lg" />
        <div className="skeleton h-44 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  const levelTone =
    job.match.level === "strong"
      ? "green"
      : job.match.level === "good"
        ? "blue"
        : job.match.level === "possible"
          ? "amber"
          : "slate";
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <Link
        href="/jobs"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone={levelTone}>
              {job.match.score}/100 · {job.match.level} match
            </Badge>
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
            {job.duplicateWarning && (
              <Badge tone="amber">Possible duplicate</Badge>
            )}
            <Badge
              tone={job.proposalStatus === "submitted" ? "amber" : "slate"}
            >
              {job.proposalStatus === "submitted"
                ? "Proposal submitted"
                : "Proposal not submitted"}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {job.title || "Untitled job"}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {job.company || "Unknown company"}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {job.location || "Location unavailable"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/interviews?jobId=${job._id}`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/20"
          >
            <CalendarCheck2 className="h-4 w-4" />
            Record interview
          </Link>
          <Button
            variant={
              job.proposalStatus === "submitted" ? "secondary" : "primary"
            }
            onClick={toggleProposal}
            disabled={flagBusy}
          >
            <Flag
              className={cn(
                "h-4 w-4",
                job.proposalStatus === "submitted" && "fill-current",
              )}
            />
            {flagBusy
              ? "Saving…"
              : job.proposalStatus === "submitted"
                ? "Submitted"
                : "Mark submitted"}
          </Button>
          <Button variant="secondary" onClick={copyJobLink}>
            <Copy className="h-4 w-4" />
            Copy link
          </Button>
          <Button variant="secondary" onClick={recheck} disabled={busy}>
            <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />
            {busy ? "Checking…" : "Recheck"}
          </Button>
          <Button variant="danger" onClick={remove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="scrollbar flex overflow-x-auto border-b border-slate-200 bg-slate-50/70 px-2">
          {tabs.map((value) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                "whitespace-nowrap border-b-2 border-transparent px-4 py-3.5 text-sm font-semibold text-slate-500",
                tab === value && "border-brand-600 text-brand-700",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="p-5 sm:p-7">
          {tab === "Overview" && <Overview job={job} />}{" "}
          {tab === "Stack Analysis" && <Stack job={job} />}{" "}
          {tab === "Requirements" && <Requirements job={job} />}{" "}
          {tab === "Description" && <Description job={job} />}{" "}
          {tab === "Scraping Information" && (
            <Scraping job={job} onRetry={recheck} />
          )}
        </div>
      </Card>
    </div>
  );
}
function Overview({ job }: { job: SerializedJob }) {
  return (
    <div>
      <SectionTitle
        title="Role overview"
        subtitle="Key details collected from the listing."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Info icon={Building2} label="Company" value={job.company} />
        <Info icon={MapPin} label="Location" value={job.location} />
        <Info icon={Wallet} label="Salary" value={job.salary} />
        <Info
          icon={ShieldCheck}
          label="Remote status"
          value={job.remoteStatus}
        />
        <Info
          icon={Clock3}
          label="Employment type"
          value={job.employmentType}
        />
        <Info icon={ExternalLink} label="Source" value={job.source} />
        <Info
          icon={Flag}
          label="Proposal status"
          value={
            job.proposalStatus === "submitted" ? "Submitted" : "Not submitted"
          }
        />
        <Info
          icon={Clock3}
          label="Submitted at"
          value={
            job.proposalSubmittedAt
              ? new Date(job.proposalSubmittedAt).toLocaleString()
              : null
          }
        />
      </div>
      <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
        <div className="text-sm font-bold text-brand-800">
          Why this scored {job.match.score}
        </div>
        <ul className="mt-2 space-y-1.5 text-sm text-brand-900/80">
          {job.match.reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
function Stack({ job }: { job: SerializedJob }) {
  const groups = [
    {
      title: "Wanted technologies",
      names: job.match.wanted,
      tone: "green" as const,
    },
    {
      title: "Unwanted technologies",
      names: job.match.unwanted,
      tone: "red" as const,
    },
    {
      title: "Other technologies",
      names: job.match.other,
      tone: "slate" as const,
    },
  ];
  return (
    <div>
      <SectionTitle
        title="Stack analysis"
        subtitle={`${job.technologies.length} technologies detected with contextual importance and evidence.`}
      />
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.title}
            className="rounded-xl border border-slate-200 p-4"
          >
            <h3 className="text-sm font-bold">{group.title}</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {group.names.length ? (
                group.names.map((name) => (
                  <Badge key={name} tone={group.tone}>
                    {name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-400">None detected</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {job.technologies.map((tech) => (
          <Technology key={tech.name} tech={tech} />
        ))}
      </div>
    </div>
  );
}
function Technology({ tech }: { tech: DetectedTechnology }) {
  const tone =
    tech.importance === "required"
      ? "red"
      : tech.importance === "preferred"
        ? "blue"
        : tech.importance === "nice-to-have"
          ? "violet"
          : "slate";
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold">{tech.name}</span>
        <Badge tone={tone}>{tech.importance}</Badge>
        <span className="text-xs text-slate-400">
          {tech.category} · {tech.mentionCount} mention
          {tech.mentionCount === 1 ? "" : "s"}
        </span>
      </div>
      {tech.evidence.length > 0 && (
        <div className="mt-3 space-y-2">
          {tech.evidence.map((e, i) => (
            <blockquote
              key={i}
              className="border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-600"
            >
              {e}
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}
function Requirements({ job }: { job: SerializedJob }) {
  const r = job.requirements;
  return (
    <div>
      <SectionTitle
        title="Role requirements"
        subtitle="Experience, seniority, location, and authorization signals."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Value
          label="Minimum experience"
          value={r.minimumYears === null ? null : `${r.minimumYears} years`}
        />
        <Value label="Seniority" value={r.seniority} />
        <Value label="Work authorization" value={r.workAuthorization} />
        <Value label="Visa sponsorship" value={r.visaSponsorship} />
        <Value label="Location restrictions" value={r.locationRestriction} />
        <Value label="Work arrangement" value={job.remoteStatus} />
        <Value label="Employment type" value={job.employmentType} />
      </div>
    </div>
  );
}
function Description({ job }: { job: SerializedJob }) {
  return (
    <div>
      <SectionTitle
        title="Complete description"
        subtitle="Cleaned and sanitized from the original job page."
      />
      {job.descriptionHtml ? (
        <div
          className="description mt-5 max-w-none text-sm leading-7 text-slate-700"
          dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
        />
      ) : (
        <pre className="mt-5 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">
          {job.descriptionText || "No description was extracted."}
        </pre>
      )}
    </div>
  );
}
function Scraping({
  job,
  onRetry,
}: {
  job: SerializedJob;
  onRetry: () => void;
}) {
  return (
    <div>
      <SectionTitle
        title="Scraping information"
        subtitle="Source, redirects, timestamps, and diagnostic details."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Value label="Source platform" value={job.source} />
        <Value label="Scraping method" value={job.scrapingMethod} />
        <Value label="HTTP status" value={job.httpStatus?.toString()} />
        <Value
          label="Last checked"
          value={
            job.scrapedAt ? new Date(job.scrapedAt).toLocaleString() : null
          }
        />
        <Value label="Original URL" value={job.url} />
        <Value label="Final redirected URL" value={job.finalUrl} />
      </div>
      {job.scrapeError && (
        <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          <b>Scraping error:</b> {job.scrapeError}
        </div>
      )}
      <Button className="mt-5" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Retry scraping
      </Button>
    </div>
  );
}
function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 p-4">
      <Icon className="mt-0.5 h-4 w-4 text-brand-600" />
      <div>
        <div className="text-xs font-medium text-slate-400">{label}</div>
        <div className="mt-1 text-sm font-semibold capitalize">
          {value || "Not available"}
        </div>
      </div>
    </div>
  );
}
function Value({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1.5 break-words text-sm font-medium capitalize">
        {value || "Not detected"}
      </div>
    </div>
  );
}
