"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Clock3,
  Edit3,
  Eye,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";
import { InterviewForm } from "./interview-form";
import { InterviewStatusBadge } from "./interview-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { copyToClipboard } from "@/lib/browser/copy-to-clipboard";
import { INTERVIEW_STATUSES, INTERVIEW_TYPES, interviewLabel } from "@/lib/interviews/constants";
import type { InterviewStatus, SerializedInterview } from "@/types/interview";

interface Result {
  interviews: SerializedInterview[];
  total: number;
  page: number;
  pages: number;
  summary: { total: number; upcoming: number; awaiting: number; offers: number };
}

const empty: Result = {
  interviews: [],
  total: 0,
  page: 1,
  pages: 0,
  summary: { total: 0, upcoming: 0, awaiting: 0, offers: 0 },
};

export function InterviewsWorkspace({ initialJobId = null }: { initialJobId?: string | null }) {
  const [result, setResult] = useState<Result>(empty);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [scope, setScope] = useState("");
  const [sort, setSort] = useState("scheduled:asc");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(Boolean(initialJobId));
  const [editing, setEditing] = useState<SerializedInterview | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const [sortBy, sortOrder] = sort.split(":");
    const query = new URLSearchParams({
      page: String(page),
      limit: "30",
      sortBy,
      sortOrder,
    });
    if (search.trim()) query.set("search", search.trim());
    if (status) query.set("status", status);
    if (type) query.set("type", type);
    if (scope) query.set("scope", scope);
    try {
      const response = await fetch(`/api/interviews?${query}`, { cache: "no-store" });
      const data = (await response.json()) as Result & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load interviews");
      setResult(data);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not load interviews", "error");
    } finally {
      setLoading(false);
    }
  }, [page, scope, search, sort, status, toast, type]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);

  function resetPage(change: () => void) {
    setPage(1);
    change();
  }

  async function changeStatus(interview: SerializedInterview, next: InterviewStatus) {
    const response = await fetch(`/api/interviews/${interview._id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (response.ok) {
      toast(`Status changed to ${interviewLabel(next)}`);
      void load();
    } else toast("Could not update status", "error");
  }

  async function remove(interview: SerializedInterview) {
    if (!confirm(`Delete the ${interview.company} interview record?`)) return;
    const response = await fetch(`/api/interviews/${interview._id}`, { method: "DELETE" });
    if (response.ok) {
      toast("Interview deleted");
      void load();
    } else toast("Could not delete interview", "error");
  }

  async function copyLink(interview: SerializedInterview) {
    const value = interview.meetingLink || interview.jobUrl;
    if (!value) return toast("No meeting or job link saved", "error");
    try {
      await copyToClipboard(value);
      toast(interview.meetingLink ? "Meeting link copied" : "Job link copied");
    } catch {
      toast("Could not copy link", "error");
    }
  }

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="mx-auto max-w-[1700px] p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" /> Interview command center
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Interview pipeline</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">Track every conversation, prepare with context, and keep outcomes and follow-ups moving.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="h-11 px-5"><Plus className="h-4 w-4" />Record interview</Button>
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<CalendarCheck2 />} label="All interviews" value={result.summary.total} color="blue" />
        <Metric icon={<CalendarClock />} label="Upcoming" value={result.summary.upcoming} color="amber" />
        <Metric icon={<Clock3 />} label="Awaiting feedback" value={result.summary.awaiting} color="violet" />
        <Metric icon={<Trophy />} label="Offers" value={result.summary.offers} color="green" />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-wrap gap-2">
            {[
              ["", "All"],
              ["upcoming", "Upcoming"],
            ].map(([value, label]) => (
              <button key={label} onClick={() => resetPage(() => setScope(value))} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${scope === value ? "border-orange-400/40 bg-orange-500/15 text-orange-300" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}>{label}</button>
            ))}
            {["preparing", "awaiting-feedback", "next-round", "offer"].map((value) => (
              <button key={value} onClick={() => resetPage(() => { setScope(""); setStatus(status === value ? "" : value); })} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${status === value ? "border-orange-400/40 bg-orange-500/15 text-orange-300" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}>{interviewLabel(value)}</button>
            ))}
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-[minmax(220px,1fr)_190px_190px_180px]">
            <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => resetPage(() => setSearch(event.target.value))} className={`${control} pl-9`} placeholder="Search company, role, client, interviewer…" /></label>
            <select value={status} onChange={(event) => resetPage(() => { setScope(""); setStatus(event.target.value); })} className={control}><option value="">Any status</option>{INTERVIEW_STATUSES.map((item) => <option value={item} key={item}>{interviewLabel(item)}</option>)}</select>
            <select value={type} onChange={(event) => resetPage(() => setType(event.target.value))} className={control}><option value="">Any interview type</option>{INTERVIEW_TYPES.map((item) => <option value={item} key={item}>{interviewLabel(item)}</option>)}</select>
            <select value={sort} onChange={(event) => resetPage(() => setSort(event.target.value))} className={control}><option value="scheduled:asc">Soonest first</option><option value="scheduled:desc">Latest scheduled</option><option value="updated:desc">Recently updated</option><option value="company:asc">Company A–Z</option></select>
          </div>
        </div>

        <div className="scrollbar overflow-x-auto">
          <table className="min-w-[1180px] w-full text-left">
            <thead className="sticky top-0 bg-[#182137] text-[11px] uppercase tracking-wide text-slate-500"><tr>{["Schedule", "Opportunity", "Type", "Round", "People / client", "Status", "Next steps", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-200/70">
              {loading ? Array.from({ length: 5 }).map((_, index) => <tr key={index}>{Array.from({ length: 8 }).map((__, cell) => <td className="px-4 py-4" key={cell}><div className="skeleton h-5 rounded" /></td>)}</tr>) : result.interviews.map((interview) => (
                <tr key={interview._id} className="group hover:bg-white/[.025]">
                  <td className="whitespace-nowrap px-4 py-4"><div className="font-semibold text-ink">{formatDate(interview.scheduledAt)}</div><div className="mt-1 text-xs text-slate-500">{interview.durationMinutes ? `${interview.durationMinutes} min` : "Duration not set"}</div></td>
                  <td className="max-w-72 px-4 py-4"><Link href={`/interviews/${interview._id}`} className="block truncate font-bold text-ink hover:text-amber-300">{interview.role}</Link><div className="mt-1 truncate text-xs text-slate-500">{interview.company}{interview.position ? ` · ${interview.position}` : ""}</div></td>
                  <td className="px-4 py-4 text-sm text-slate-600">{interviewLabel(interview.type)}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{interview.roundNumber ? `#${interview.roundNumber}` : "—"}</td>
                  <td className="max-w-52 px-4 py-4"><div className="truncate text-sm text-slate-600">{interview.interviewers.join(", ") || "No interviewer saved"}</div><div className="mt-1 truncate text-xs text-slate-500">{interview.clientName ? `Client: ${interview.clientName}` : interview.recruiterName || "No client / recruiter"}</div></td>
                  <td className="px-4 py-4"><select aria-label={`Status for ${interview.company}`} value={interview.status} onChange={(event) => void changeStatus(interview, event.target.value as InterviewStatus)} className="h-8 rounded-lg border border-slate-200 bg-[#182137] px-2 text-xs font-semibold"><option value={interview.status}>{interviewLabel(interview.status)}</option>{INTERVIEW_STATUSES.filter((item) => item !== interview.status).map((item) => <option value={item} key={item}>{interviewLabel(item)}</option>)}</select><div className="mt-1"><InterviewStatusBadge status={interview.status} /></div></td>
                  <td className="max-w-52 px-4 py-4 text-xs leading-5 text-slate-500"><p className="line-clamp-2">{interview.nextSteps || "No next steps recorded"}</p></td>
                  <td className="px-4 py-4"><div className="flex items-center gap-1"><Link href={`/interviews/${interview._id}`} title="View details" className={iconButton}><Eye className="h-4 w-4" /></Link><button onClick={() => void copyLink(interview)} title="Copy meeting or job link" className={iconButton}><ClipboardCopy className="h-4 w-4" /></button><button onClick={() => setEditing(interview)} title="Edit interview" className={iconButton}><Edit3 className="h-4 w-4" /></button><button onClick={() => void remove(interview)} title="Delete interview" className={`${iconButton} hover:text-red-300`}><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !result.interviews.length && <div className="px-6 py-16 text-center"><CalendarClock className="mx-auto h-10 w-10 text-slate-600" /><h3 className="mt-3 font-bold">No interviews found</h3><p className="mt-1 text-sm text-slate-500">Record your first interview or change the current filters.</p><Button className="mt-4" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Record interview</Button></div>}
        </div>
        {result.pages > 1 && <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500"><span>{result.total} matching interviews</span><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className={pager}><ChevronLeft className="h-4 w-4" /></button><span>Page {page} of {result.pages}</span><button disabled={page >= result.pages} onClick={() => setPage((value) => value + 1)} className={pager}><ChevronRight className="h-4 w-4" /></button></div></div>}
      </Card>

      {(showForm || editing) && <InterviewForm interview={editing} initialJobId={editing ? null : initialJobId} onClose={closeForm} onSaved={() => { closeForm(); toast(editing ? "Interview updated" : "Interview recorded"); void load(); }} />}
    </div>
  );
}

const control = "h-10 w-full rounded-lg border border-slate-200 bg-[#182137] px-3 text-sm text-ink outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15";
const iconButton = "inline-grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-amber-300";
const pager = "grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-100";

function formatDate(value: string | null): string {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function Metric({ icon, label, value, color }: { icon: React.ReactElement; label: string; value: number; color: "blue" | "amber" | "violet" | "green" }) {
  const colors = { blue: "from-blue-500/20 text-blue-300", amber: "from-amber-500/20 text-amber-300", violet: "from-violet-500/20 text-violet-300", green: "from-emerald-500/20 text-emerald-300" };
  return <Card className="relative overflow-hidden p-4"><div className={`absolute inset-y-0 left-0 w-24 bg-gradient-to-r ${colors[color]} to-transparent opacity-60`} /><div className="relative flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div><div className={`grid h-10 w-10 place-items-center rounded-xl bg-slate-50 ${colors[color].split(" ").at(-1)}`}>{icon}</div></div></Card>;
}
