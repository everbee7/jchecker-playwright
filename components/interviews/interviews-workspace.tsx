"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type DragEvent } from "react";
import {
  CalendarCheck2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Columns3,
  ClipboardCopy,
  Clock3,
  Edit3,
  Eye,
  List,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { InterviewForm } from "./interview-form";
import { InterviewStatusBadge } from "./interview-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { copyToClipboard } from "@/lib/browser/copy-to-clipboard";
import { CORE_INTERVIEW_STAGES, INTERVIEW_TYPES, interviewLabel, interviewStatusLabel } from "@/lib/interviews/constants";
import type { InterviewPipelineStage, InterviewStageColor, InterviewStatus, SerializedInterview } from "@/types/interview";

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
  const [view, setView] = useState<"board" | "list">("board");
  const [showForm, setShowForm] = useState(Boolean(initialJobId));
  const [editing, setEditing] = useState<SerializedInterview | null>(null);
  const [stages, setStages] = useState<InterviewPipelineStage[]>(CORE_INTERVIEW_STAGES);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const [sortBy, sortOrder] = sort.split(":");
    const query = new URLSearchParams({
      page: String(page),
      limit: view === "board" ? "100" : "30",
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
  }, [page, scope, search, sort, status, toast, type, view]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    void fetch("/api/interview-stages", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { stages?: InterviewPipelineStage[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Could not load interview stages");
        setStages(data.stages ?? CORE_INTERVIEW_STAGES);
      })
      .catch((error: Error) => toast(error.message, "error"));
  }, [toast]);

  function resetPage(change: () => void) {
    setPage(1);
    change();
  }

  async function changeStatus(interview: SerializedInterview, next: InterviewStatus) {
    if (interview.status === next) return;
    const changedAt = new Date().toISOString();
    const optimistic = { ...interview, status: next, updatedAt: changedAt, statusHistory: [...interview.statusHistory, { status: next, changedAt }] };
    setResult((current) => replaceInterview(current, optimistic, interview));
    try {
      const response = await fetch(`/api/interviews/${interview._id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const saved = (await response.json()) as SerializedInterview & { error?: string };
      if (!response.ok) throw new Error(saved.error ?? "Could not update status");
      setResult((current) => replaceInterview(current, saved, optimistic));
      toast(`Moved to ${interviewStatusLabel(next, stages)}`);
    } catch (error) {
      setResult((current) => replaceInterview(current, interview, optimistic));
      toast(error instanceof Error ? error.message : "Could not update status", "error");
    }
  }

  async function remove(interview: SerializedInterview) {
    if (!confirm(`Delete the ${interview.company} interview record?`)) return;
    const response = await fetch(`/api/interviews/${interview._id}`, { method: "DELETE" });
    if (response.ok) {
      toast("Interview deleted");
      setResult((current) => removeInterview(current, interview));
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

  function saveInterview(saved: SerializedInterview) {
    const previous = result.interviews.find((item) => item._id === saved._id);
    setResult((current) => previous ? replaceInterview(current, saved, previous) : insertInterview(current, saved));
    closeForm();
    toast(previous ? "Interview updated" : "Interview recorded");
  }

  async function addStage(details: StageDetails) {
    const response = await fetch("/api/interview-stages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(details) });
    const data = (await response.json()) as InterviewPipelineStage & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Could not add stage");
    setStages((current) => [...current, data]);
    toast(`${data.label} stage added`);
  }

  async function updateStage(id: InterviewStatus, details: StageDetails) {
    const response = await fetch("/api/interview-stages", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, ...details }) });
    const data = (await response.json()) as InterviewPipelineStage & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Could not rename stage");
    setStages((current) => current.map((stage) => stage.id === id ? data : stage));
    toast("Stage updated");
  }

  async function deleteStage(id: InterviewStatus) {
    const response = await fetch(`/api/interview-stages?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Could not delete stage");
    setStages((current) => current.filter((stage) => stage.id !== id));
    toast("Stage deleted");
  }

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                ["", "All"],
                ["upcoming", "Upcoming"],
              ].map(([value, label]) => (
                <button key={label} onClick={() => resetPage(() => { setScope(value); setStatus(""); })} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${scope === value && status === "" ? "border-orange-400/40 bg-orange-500/15 text-orange-300" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}>{label}</button>
              ))}
              {["awaiting-feedback", "next-round", "offer", "failed"].map((value) => (
                <button key={value} onClick={() => resetPage(() => { setScope(""); setStatus(status === value ? "" : value); })} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${status === value ? "border-orange-400/40 bg-orange-500/15 text-orange-300" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}>{interviewLabel(value)}</button>
              ))}
            </div>
            <div className="flex rounded-lg border border-slate-200 bg-[#182137] p-1">
              <button onClick={() => { setView("board"); setPage(1); }} className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs font-semibold transition ${view === "board" ? "bg-orange-500 text-white" : "text-slate-500 hover:text-white"}`}><Columns3 className="h-3.5 w-3.5" />Board</button>
              <button onClick={() => { setView("list"); setPage(1); }} className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs font-semibold transition ${view === "list" ? "bg-orange-500 text-white" : "text-slate-500 hover:text-white"}`}><List className="h-3.5 w-3.5" />List</button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-[minmax(220px,1fr)_190px_190px_180px]">
            <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => resetPage(() => setSearch(event.target.value))} className={`${control} pl-9`} placeholder="Search company, role, client, interviewer…" /></label>
            <select value={status} onChange={(event) => resetPage(() => { setScope(""); setStatus(event.target.value); })} className={control}><option value="">Any status</option>{stages.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select>
            <select value={type} onChange={(event) => resetPage(() => setType(event.target.value))} className={control}><option value="">Any interview type</option>{INTERVIEW_TYPES.map((item) => <option value={item} key={item}>{interviewLabel(item)}</option>)}</select>
            <select value={sort} onChange={(event) => resetPage(() => setSort(event.target.value))} className={control}><option value="scheduled:asc">Soonest first</option><option value="scheduled:desc">Latest scheduled</option><option value="updated:desc">Recently updated</option><option value="company:asc">Company A–Z</option></select>
          </div>
        </div>

        {view === "board" ? (
          <PipelineBoard
            interviews={result.interviews}
            stages={stages}
            loading={loading}
            onStatus={changeStatus}
            onEdit={setEditing}
            onCopy={copyLink}
            onAddStage={addStage}
            onUpdateStage={updateStage}
            onDeleteStage={deleteStage}
          />
        ) : (
        <div className="scrollbar overflow-x-auto">
          <table className="min-w-[1180px] w-full text-left">
            <thead className="sticky top-0 bg-[#182137] text-[11px] uppercase tracking-wide text-slate-500"><tr>{["Schedule", "Opportunity", "Type", "Round", "People / client", "Status", "Next steps", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-200/70">
              {loading ? Array.from({ length: 5 }).map((_, index) => <tr key={index}>{Array.from({ length: 8 }).map((__, cell) => <td className="px-4 py-4" key={cell}><div className="skeleton h-5 rounded" /></td>)}</tr>) : result.interviews.map((interview) => (
                <tr key={interview._id} className={`group transition-colors hover:brightness-110 ${stageRowClass(stages.find((stage) => stage.id === interview.status)?.color)}`}>
                  <td className="whitespace-nowrap px-4 py-4"><div className="flex items-center gap-2"><div className="font-semibold text-ink">{formatDate(interview.scheduledAt)}</div>{isToday(interview.scheduledAt) && <TodayBadge />}</div><div className="mt-1 text-xs text-slate-500">{interview.durationMinutes ? `${interview.durationMinutes} min` : "Duration not set"}</div></td>
                  <td className="max-w-72 px-4 py-4"><Link href={`/interviews/${interview._id}`} className="block truncate font-bold text-ink hover:text-amber-300">{interview.role}</Link><div className="mt-1 truncate text-xs text-slate-500">{interview.company}{interview.position ? ` · ${interview.position}` : ""}</div></td>
                  <td className="px-4 py-4 text-sm text-slate-600">{interviewLabel(interview.type)}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{interview.roundNumber ? `#${interview.roundNumber}` : "—"}</td>
                  <td className="max-w-52 px-4 py-4"><div className="truncate text-sm text-slate-600">{interview.interviewers.join(", ") || "No interviewer saved"}</div><div className="mt-1 truncate text-xs text-slate-500">{interview.clientName ? `Client: ${interview.clientName}` : interview.recruiterName || "No client / recruiter"}</div></td>
                  <td className="px-4 py-4"><select aria-label={`Status for ${interview.company}`} value={interview.status} onChange={(event) => void changeStatus(interview, event.target.value as InterviewStatus)} className="h-8 rounded-lg border border-slate-200 bg-[#182137] px-2 text-xs font-semibold">{stages.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select><div className="mt-1"><InterviewStatusBadge status={interview.status} label={interviewStatusLabel(interview.status, stages)} /></div></td>
                  <td className="max-w-52 px-4 py-4 text-xs leading-5 text-slate-500"><p className="line-clamp-2">{interview.nextSteps || "No next steps recorded"}</p></td>
                  <td className="px-4 py-4"><div className="flex items-center gap-1"><Link href={`/interviews/${interview._id}`} title="View details" className={iconButton}><Eye className="h-4 w-4" /></Link><button onClick={() => void copyLink(interview)} title="Copy meeting or job link" className={iconButton}><ClipboardCopy className="h-4 w-4" /></button><button onClick={() => setEditing(interview)} title="Edit interview" className={iconButton}><Edit3 className="h-4 w-4" /></button><button onClick={() => void remove(interview)} title="Delete interview" className={`${iconButton} hover:text-red-300`}><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !result.interviews.length && <div className="px-6 py-16 text-center"><CalendarClock className="mx-auto h-10 w-10 text-slate-600" /><h3 className="mt-3 font-bold">No interviews found</h3><p className="mt-1 text-sm text-slate-500">Record your first interview or change the current filters.</p><Button className="mt-4" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Record interview</Button></div>}
        </div>
        )}
        {view === "list" && result.pages > 1 && <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500"><span>{result.total} matching interviews</span><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className={pager}><ChevronLeft className="h-4 w-4" /></button><span>Page {page} of {result.pages}</span><button disabled={page >= result.pages} onClick={() => setPage((value) => value + 1)} className={pager}><ChevronRight className="h-4 w-4" /></button></div></div>}
      </Card>

      {(showForm || editing) && <InterviewForm stages={stages} interview={editing} initialJobId={editing ? null : initialJobId} onClose={closeForm} onSaved={saveInterview} />}
    </div>
  );
}

const activeProgress: InterviewStatus[] = [
  "scheduled",
  "awaiting-feedback",
  "next-round",
  "offer",
];

interface StageDetails {
  label: string;
  description: string;
  color: InterviewStageColor;
}

const stageColors: InterviewStageColor[] = ["blue", "violet", "cyan", "green", "slate", "red", "amber", "orange", "fuchsia", "teal"];
const accentClasses: Record<InterviewStageColor, string> = {
  blue: "bg-blue-400", violet: "bg-violet-400", cyan: "bg-cyan-400", green: "bg-green-400", slate: "bg-slate-400",
  red: "bg-red-400", amber: "bg-amber-400", orange: "bg-orange-400", fuchsia: "bg-fuchsia-400", teal: "bg-teal-400",
};
const rowClasses: Record<InterviewStageColor, string> = {
  blue: "bg-blue-500/[.08]", violet: "bg-violet-500/[.08]", cyan: "bg-cyan-500/[.08]", green: "bg-green-500/[.08]", slate: "bg-slate-500/[.08]",
  red: "bg-red-500/[.08]", amber: "bg-amber-500/[.08]", orange: "bg-orange-500/[.08]", fuchsia: "bg-fuchsia-500/[.08]", teal: "bg-teal-500/[.08]",
};

function PipelineBoard({
  interviews,
  stages,
  loading,
  onStatus,
  onEdit,
  onCopy,
  onAddStage,
  onUpdateStage,
  onDeleteStage,
}: {
  interviews: SerializedInterview[];
  stages: InterviewPipelineStage[];
  loading: boolean;
  onStatus: (interview: SerializedInterview, status: InterviewStatus) => Promise<void>;
  onEdit: (interview: SerializedInterview) => void;
  onCopy: (interview: SerializedInterview) => Promise<void>;
  onAddStage: (details: StageDetails) => Promise<void>;
  onUpdateStage: (id: InterviewStatus, details: StageDetails) => Promise<void>;
  onDeleteStage: (id: InterviewStatus) => Promise<void>;
}) {
  const [addingStage, setAddingStage] = useState(false);
  const [stageName, setStageName] = useState("");
  const [stageDescription, setStageDescription] = useState("");
  const [stageColor, setStageColor] = useState<InterviewStageColor>("fuchsia");
  const [savingStage, setSavingStage] = useState(false);
  function drop(event: DragEvent, status: InterviewStatus) {
    event.preventDefault();
    const interview = interviews.find(
      (item) => item._id === event.dataTransfer.getData("text/interview-id"),
    );
    if (interview && interview.status !== status) void onStatus(interview, status);
  }

  async function createStage() {
    if (!stageName.trim()) return;
    setSavingStage(true);
    try {
      await onAddStage({ label: stageName.trim(), description: stageDescription.trim(), color: stageColor });
      setStageName("");
      setStageDescription("");
      setStageColor("fuchsia");
      setAddingStage(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not add stage");
    } finally {
      setSavingStage(false);
    }
  }

  return (
    <div className="scrollbar overflow-x-auto p-4">
      <div className="flex min-w-max items-start gap-3">
        {stages.map((stage) => {
          const items = interviews.filter((item) => item.status === stage.id);
          return (
            <section
              key={stage.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => drop(event, stage.id)}
              className="flex h-[min(680px,calc(100vh-22rem))] min-h-[390px] w-[285px] shrink-0 flex-col rounded-xl border border-slate-200 bg-[#182137]/70 p-3"
            >
              <header className="mb-3 flex shrink-0 items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${accentClasses[stage.color]}`} />
                  <div>
                    <h3 className="text-xs font-bold text-ink">{stage.label}</h3>
                    <p className="max-w-[180px] truncate text-[10px] text-slate-500" title={stage.description}>{stage.description || "No description"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="grid h-6 min-w-6 place-items-center rounded-md bg-slate-100 px-1.5 text-[11px] font-bold text-slate-600">{items.length}</span>
                  {stage.custom && <StageMenu stage={stage} onUpdate={onUpdateStage} onDelete={onDeleteStage} />}
                </div>
              </header>
              <div className="scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
                {loading ? (
                  <><div className="skeleton h-40 rounded-lg" /><div className="skeleton h-32 rounded-lg" /></>
                ) : items.length ? (
                  items.map((interview) => (
                    <PipelineCard
                      key={interview._id}
                      interview={interview}
                      stages={stages}
                      onStatus={onStatus}
                      onEdit={onEdit}
                      onCopy={onCopy}
                    />
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-500">
                    Drop an interview here
                  </div>
                )}
              </div>
            </section>
          );
        })}
        <section className="w-[285px] shrink-0 rounded-xl border border-dashed border-amber-400/30 bg-amber-500/[.04] p-3">
          {addingStage ? (
            <div>
              <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-amber-300">Add workflow step</h3><button onClick={() => { setAddingStage(false); setStageName(""); setStageDescription(""); }} className={iconButton}><X className="h-4 w-4" /></button></div>
              <input autoFocus maxLength={60} value={stageName} onChange={(event) => setStageName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && stageName.trim()) void createStage(); if (event.key === "Escape") setAddingStage(false); }} className={`${control} mt-3`} placeholder="GitHub project" />
              <input maxLength={120} value={stageDescription} onChange={(event) => setStageDescription(event.target.value)} className={`${control} mt-2`} placeholder="Description, e.g. Take-home project" />
              <ColorPicker value={stageColor} onChange={setStageColor} />
              <Button disabled={!stageName.trim() || savingStage} onClick={() => void createStage()} className="mt-2 w-full">{savingStage ? "Adding…" : "Add step"}</Button>
            </div>
          ) : (
            <button onClick={() => setAddingStage(true)} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-8 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/10"><Plus className="h-4 w-4" />Add step</button>
          )}
        </section>
      </div>
    </div>
  );
}

function PipelineCard({
  interview,
  stages,
  onStatus,
  onEdit,
  onCopy,
}: {
  interview: SerializedInterview;
  stages: InterviewPipelineStage[];
  onStatus: (interview: SerializedInterview, status: InterviewStatus) => Promise<void>;
  onEdit: (interview: SerializedInterview) => void;
  onCopy: (interview: SerializedInterview) => Promise<void>;
}) {
  const progressIndex = activeProgress.indexOf(interview.status);
  const progress = progressIndex < 0 ? 100 : ((progressIndex + 1) / activeProgress.length) * 100;
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/interview-id", interview._id);
      }}
      className="cursor-grab rounded-lg border border-slate-200 bg-[#202a44] p-3.5 shadow-lg shadow-black/10 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/interviews/${interview._id}`} className="block truncate text-sm font-bold text-ink hover:text-amber-300">
            {interview.role}
          </Link>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{interview.company}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">{isToday(interview.scheduledAt) && <TodayBadge />}{interview.roundNumber && <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[10px] font-bold text-slate-600">R{interview.roundNumber}</span>}</div>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${interview.status === "failed" ? "bg-red-400" : interview.status === "cancelled" ? "bg-slate-400" : "bg-gradient-to-r from-amber-400 to-orange-500"}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 space-y-1.5 text-[11px] text-slate-500">
        <p className="font-semibold text-slate-600">{formatDate(interview.scheduledAt)}</p>
        <p>{interviewLabel(interview.type)}{interview.durationMinutes ? ` · ${interview.durationMinutes} min` : ""}</p>
        {(interview.clientName || interview.interviewers.length > 0) && <p className="truncate">{interview.clientName ? `Client: ${interview.clientName}` : interview.interviewers.join(", ")}</p>}
      </div>
      {interview.nextSteps && <p className="mt-3 line-clamp-2 rounded-md border border-amber-400/15 bg-amber-500/[.06] px-2 py-1.5 text-[11px] leading-4 text-slate-600">{interview.nextSteps}</p>}
      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200 pt-3">
        <select
          aria-label={`Move ${interview.company} interview`}
          value={interview.status}
          onChange={(event) => void onStatus(interview, event.target.value as InterviewStatus)}
          className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 bg-[#182137] px-2 text-[11px] font-semibold"
        >
          {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
        </select>
        <button onClick={() => void onCopy(interview)} title="Copy link" className={iconButton}><ClipboardCopy className="h-3.5 w-3.5" /></button>
        <button onClick={() => onEdit(interview)} title="Edit" className={iconButton}><Edit3 className="h-3.5 w-3.5" /></button>
        <Link href={`/interviews/${interview._id}`} title="Open details" className={iconButton}><Eye className="h-3.5 w-3.5" /></Link>
      </div>
    </article>
  );
}

function StageMenu({ stage, onUpdate, onDelete }: {
  stage: InterviewPipelineStage;
  onUpdate: (id: InterviewStatus, details: StageDetails) => Promise<void>;
  onDelete: (id: InterviewStatus) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(stage.label);
  const [description, setDescription] = useState(stage.description);
  const [color, setColor] = useState<InterviewStageColor>(stage.color);
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!label.trim()) return;
    setSaving(true);
    try {
      await onUpdate(stage.id, { label: label.trim(), description: description.trim(), color });
      setEditing(false);
    } catch (error) { alert(error instanceof Error ? error.message : "Could not update stage"); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (!confirm(`Delete the “${stage.label}” step?`)) return;
    try { await onDelete(stage.id); }
    catch (error) { alert(error instanceof Error ? error.message : "Could not delete stage"); }
  }
  return <div className="flex"><button title="Edit step" onClick={() => setEditing(true)} className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:bg-slate-100 hover:text-amber-300"><Edit3 className="h-3 w-3" /></button><button title="Delete step" onClick={() => void remove()} className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-3 w-3" /></button>{editing && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1020]/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(false); }}><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-[#202a44] p-5 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="font-bold text-white">Edit workflow step</h2><p className="mt-1 text-xs text-slate-500">Update the title, description, and board color.</p></div><button onClick={() => setEditing(false)} className={iconButton}><X className="h-4 w-4" /></button></div><label className="mt-4 block text-xs font-semibold text-slate-500">Step name<input autoFocus maxLength={60} value={label} onChange={(event) => setLabel(event.target.value)} className={`${control} mt-1.5`} /></label><label className="mt-3 block text-xs font-semibold text-slate-500">Description<input maxLength={120} value={description} onChange={(event) => setDescription(event.target.value)} className={`${control} mt-1.5`} placeholder="What happens in this step?" /></label><ColorPicker value={color} onChange={setColor} /><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button disabled={!label.trim() || saving} onClick={() => void save()}>{saving ? "Saving…" : "Save step"}</Button></div></div></div>}</div>;
}

function ColorPicker({ value, onChange }: { value: InterviewStageColor; onChange: (color: InterviewStageColor) => void }) {
  return <fieldset className="mt-3"><legend className="mb-2 text-xs font-semibold text-slate-500">Color</legend><div className="flex flex-wrap gap-2">{stageColors.map((color) => <button type="button" key={color} onClick={() => onChange(color)} title={interviewLabel(color)} aria-label={`${interviewLabel(color)} stage color`} aria-pressed={value === color} className={`h-7 w-7 rounded-full ${accentClasses[color]} ring-offset-2 ring-offset-[#202a44] transition ${value === color ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`} />)}</div></fieldset>;
}

function stageRowClass(color: InterviewStageColor | undefined): string {
  return color ? rowClasses[color] : "bg-white/[.02]";
}

function summaryValue(interview: SerializedInterview) {
  const terminal = interview.status === "offer" || interview.status === "cancelled" || interview.status === "failed";
  return {
    upcoming: Boolean(interview.scheduledAt && new Date(interview.scheduledAt) >= new Date() && !terminal),
    awaiting: interview.status === "awaiting-feedback",
    offers: interview.status === "offer",
  };
}

function adjustSummary(summary: Result["summary"], next: SerializedInterview | null, previous: SerializedInterview | null): Result["summary"] {
  const before = previous ? summaryValue(previous) : { upcoming: false, awaiting: false, offers: false };
  const after = next ? summaryValue(next) : { upcoming: false, awaiting: false, offers: false };
  return {
    total: summary.total + (next && !previous ? 1 : !next && previous ? -1 : 0),
    upcoming: summary.upcoming + Number(after.upcoming) - Number(before.upcoming),
    awaiting: summary.awaiting + Number(after.awaiting) - Number(before.awaiting),
    offers: summary.offers + Number(after.offers) - Number(before.offers),
  };
}

function replaceInterview(result: Result, next: SerializedInterview, previous: SerializedInterview): Result {
  return { ...result, interviews: result.interviews.map((item) => item._id === next._id ? next : item), summary: adjustSummary(result.summary, next, previous) };
}

function insertInterview(result: Result, interview: SerializedInterview): Result {
  return { ...result, interviews: [interview, ...result.interviews], total: result.total + 1, summary: adjustSummary(result.summary, interview, null) };
}

function removeInterview(result: Result, interview: SerializedInterview): Result {
  return { ...result, interviews: result.interviews.filter((item) => item._id !== interview._id), total: Math.max(0, result.total - 1), summary: adjustSummary(result.summary, null, interview) };
}

const control = "h-10 w-full rounded-lg border border-slate-200 bg-[#182137] px-3 text-sm text-ink outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15";
const iconButton = "inline-grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-amber-300";
const pager = "grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-100";

function formatDate(value: string | null): string {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function isToday(value: string | null): boolean {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function TodayBadge() {
  return <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300/50 bg-gradient-to-r from-amber-400/25 to-orange-500/25 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-amber-200 shadow-[0_0_14px_rgba(251,146,60,.2)]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />Today</span>;
}

function Metric({ icon, label, value, color }: { icon: React.ReactElement; label: string; value: number; color: "blue" | "amber" | "violet" | "green" }) {
  const colors = { blue: "from-blue-500/20 text-blue-300", amber: "from-amber-500/20 text-amber-300", violet: "from-violet-500/20 text-violet-300", green: "from-emerald-500/20 text-emerald-300" };
  return <Card className="relative overflow-hidden p-4"><div className={`absolute inset-y-0 left-0 w-24 bg-gradient-to-r ${colors[color]} to-transparent opacity-60`} /><div className="relative flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div><div className={`grid h-10 w-10 place-items-center rounded-xl bg-slate-50 ${colors[color].split(" ").at(-1)}`}>{icon}</div></div></Card>;
}
