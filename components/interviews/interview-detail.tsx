"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardCopy,
  Contact,
  Edit3,
  ExternalLink,
  FileText,
  History,
  MapPin,
  Trash2,
} from "lucide-react";
import { InterviewForm } from "./interview-form";
import { InterviewStatusBadge } from "./interview-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { copyToClipboard } from "@/lib/browser/copy-to-clipboard";
import { CORE_INTERVIEW_STAGES, interviewLabel, interviewStatusLabel } from "@/lib/interviews/constants";
import type { InterviewPipelineStage, InterviewStatus, SerializedInterview } from "@/types/interview";

export function InterviewDetail({ id }: { id: string }) {
  const [interview, setInterview] = useState<SerializedInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [stages, setStages] = useState<InterviewPipelineStage[]>(CORE_INTERVIEW_STAGES);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    void fetch(`/api/interviews/${id}`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as SerializedInterview & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Interview not found");
        setInterview(data);
      })
      .catch((error: Error) => toast(error.message, "error"))
      .finally(() => setLoading(false));
  }, [id, toast]);

  useEffect(() => {
    void fetch("/api/interview-stages", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { stages?: InterviewPipelineStage[] }) => setStages(data.stages ?? CORE_INTERVIEW_STAGES));
  }, []);

  async function updateStatus(status: InterviewStatus) {
    if (!interview) return;
    const response = await fetch(`/api/interviews/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json()) as SerializedInterview & { error?: string };
    if (response.ok) {
      setInterview(data);
      toast(`Status changed to ${interviewStatusLabel(status, stages)}`);
    } else toast(data.error ?? "Could not update status", "error");
  }

  async function copy(value: string | null, label: string) {
    if (!value) return;
    try {
      await copyToClipboard(value);
      toast(`${label} copied`);
    } catch {
      toast(`Could not copy ${label.toLowerCase()}`, "error");
    }
  }

  async function remove() {
    if (!interview || !confirm(`Delete the ${interview.company} interview record?`)) return;
    const response = await fetch(`/api/interviews/${id}`, { method: "DELETE" });
    if (response.ok) {
      toast("Interview deleted");
      router.push("/interviews");
      router.refresh();
    } else toast("Could not delete interview", "error");
  }

  if (loading) return <div className="mx-auto max-w-6xl space-y-4 p-6 lg:p-8"><div className="skeleton h-10 w-80 rounded" /><div className="skeleton h-44 rounded-xl" /><div className="grid gap-4 md:grid-cols-2"><div className="skeleton h-72 rounded-xl" /><div className="skeleton h-72 rounded-xl" /></div></div>;
  if (!interview) return <div className="p-8"><Card className="p-10 text-center"><h1 className="text-xl font-bold">Interview not found</h1><Link href="/interviews" className="mt-4 inline-block text-amber-300">Back to interviews</Link></Card></div>;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <Link href="/interviews" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-amber-300"><ArrowLeft className="h-4 w-4" />Interview pipeline</Link>
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2"><InterviewStatusBadge status={interview.status} label={interviewStatusLabel(interview.status, stages)} />{isToday(interview.scheduledAt) && <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/50 bg-gradient-to-r from-amber-400/25 to-orange-500/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-amber-200 shadow-[0_0_14px_rgba(251,146,60,.2)]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />Today</span>}<span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{interviewLabel(interview.type)}{interview.roundNumber ? ` · Round ${interview.roundNumber}` : ""}</span></div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{interview.role}</h1>
          <p className="mt-1 text-base text-slate-500">{interview.company}{interview.position ? ` · ${interview.position}` : ""}{interview.clientName ? ` · Client: ${interview.clientName}` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2"><select aria-label="Interview status" value={interview.status} onChange={(event) => void updateStatus(event.target.value as InterviewStatus)} className="h-9 rounded-lg border border-slate-200 bg-[#182137] px-3 text-sm font-semibold">{stages.map((stage) => <option value={stage.id} key={stage.id}>{stage.label}</option>)}</select><Button variant="secondary" onClick={() => setEditing(true)}><Edit3 className="h-4 w-4" />Edit</Button><Button variant="danger" onClick={() => void remove()}><Trash2 className="h-4 w-4" /></Button></div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden"><SectionTitle icon={<CalendarClock />} title="Schedule" /><div className="grid gap-px bg-slate-200 sm:grid-cols-2"><Info label="Date and time" value={formatDate(interview.scheduledAt)} /><Info label="Timezone" value={interview.timezone} /><Info label="Duration" value={interview.durationMinutes ? `${interview.durationMinutes} minutes` : null} /><Info label="Location" value={interview.location} /><Info label="Meeting link" value={interview.meetingLink} action={interview.meetingLink ? <div className="flex gap-1"><button onClick={() => void copy(interview.meetingLink, "Meeting link")} className={smallAction}><ClipboardCopy className="h-3.5 w-3.5" /></button><a href={interview.meetingLink} target="_blank" rel="noreferrer" className={smallAction}><ExternalLink className="h-3.5 w-3.5" /></a></div> : null} /><Info label="Interview type" value={interviewLabel(interview.type)} /></div></Card>

          <Card className="overflow-hidden"><SectionTitle icon={<BriefcaseBusiness />} title="Opportunity" /><div className="grid gap-px bg-slate-200 sm:grid-cols-2"><Info label="Company" value={interview.company} /><Info label="Role" value={interview.role} /><Info label="Position / level" value={interview.position} /><Info label="Client" value={interview.clientName} /><Info label="Employment type" value={interview.employmentType} /><Info label="Salary / rate" value={interview.salaryRange} /><Info wide={!interview.linkedJobId} label="Job link" value={interview.jobUrl} action={interview.jobUrl ? <div className="flex gap-1"><button onClick={() => void copy(interview.jobUrl, "Job link")} className={smallAction}><ClipboardCopy className="h-3.5 w-3.5" /></button><a href={interview.jobUrl} target="_blank" rel="noreferrer" className={smallAction}><ExternalLink className="h-3.5 w-3.5" /></a></div> : null} />{interview.linkedJobId && <Info label="Saved job" value="Open linked JobChecker record" action={<Link href={`/jobs/${interview.linkedJobId}`} className={smallAction}><ExternalLink className="h-3.5 w-3.5" /></Link>} />}</div></Card>

          <Card className="overflow-hidden"><SectionTitle icon={<FileText />} title="Notes, preparation, and outcomes" /><div className="grid gap-4 p-4 sm:p-5"><Note title="General notes" value={interview.notes} /><Note title="Preparation notes" value={interview.preparationNotes} /><Note title="Questions to ask" value={interview.questionsToAsk} /><Note title="Follow-up notes" value={interview.followUpNotes} /><Note title="Outcome" value={interview.outcomeNotes} /><Note title="Next steps" value={interview.nextSteps} accent /></div></Card>
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden"><SectionTitle icon={<Contact />} title="People" /><div className="space-y-4 p-4 sm:p-5"><InfoList label="Interviewers" values={interview.interviewers} /><ContactLine label="Recruiter" value={interview.recruiterName} /><ContactLine label="Email" value={interview.recruiterEmail} href={interview.recruiterEmail ? `mailto:${interview.recruiterEmail}` : undefined} /><ContactLine label="Phone" value={interview.recruiterPhone} href={interview.recruiterPhone ? `tel:${interview.recruiterPhone}` : undefined} /></div></Card>
          <Card className="overflow-hidden"><SectionTitle icon={<History />} title="Status history" /><div className="p-5">{[...interview.statusHistory].reverse().map((event, index) => <div key={`${event.changedAt}-${event.status}`} className="relative flex gap-3 pb-5 last:pb-0"><div className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-red-500 ring-4 ring-[#202a44]" />{index < interview.statusHistory.length - 1 && <div className="absolute bottom-0 left-[4px] top-3 w-px bg-slate-200" />}<div><p className="text-sm font-semibold text-ink">{interviewStatusLabel(event.status, stages)}</p><p className="mt-0.5 text-xs text-slate-500">{new Date(event.changedAt).toLocaleString()}</p></div></div>)}</div></Card>
          <Card className="p-4 text-xs leading-5 text-slate-500"><MapPin className="mb-2 h-4 w-4 text-amber-300" />Created {new Date(interview.createdAt).toLocaleString()}<br />Last updated {new Date(interview.updatedAt).toLocaleString()}</Card>
        </div>
      </div>
      {editing && <InterviewForm stages={stages} interview={interview} onClose={() => setEditing(false)} onSaved={(saved) => { setInterview(saved); setEditing(false); toast("Interview updated"); }} />}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) { return <div className="flex items-center gap-2 border-b border-slate-200 bg-[#1a233a] px-4 py-3.5 text-sm font-bold text-ink"><span className="text-amber-300 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>{title}</div>; }
function Info({ label, value, action, wide }: { label: string; value: string | null; action?: ReactNode; wide?: boolean }) { return <div className={`min-w-0 bg-[#202a44] p-4 ${wide ? "sm:col-span-2" : ""}`}><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p><div className="mt-1.5 flex min-w-0 items-center justify-between gap-2"><p className="truncate text-sm font-medium text-slate-700">{value || "Not recorded"}</p>{action}</div></div>; }
function Note({ title, value, accent }: { title: string; value: string; accent?: boolean }) { return <div className={`rounded-lg border p-4 ${accent ? "border-amber-400/25 bg-amber-500/[.07]" : "border-slate-200 bg-[#182137]/60"}`}><h3 className={`text-xs font-bold uppercase tracking-wider ${accent ? "text-amber-300" : "text-slate-500"}`}>{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{value || "Nothing recorded yet."}</p></div>; }
function InfoList({ label, values }: { label: string; values: string[] }) { return <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p><div className="mt-2 flex flex-wrap gap-2">{values.length ? values.map((value) => <span key={value} className="rounded-lg border border-slate-200 bg-[#182137] px-2.5 py-1.5 text-xs font-semibold text-slate-600">{value}</span>) : <span className="text-sm text-slate-500">Not recorded</span>}</div></div>; }
function ContactLine({ label, value, href }: { label: string; value: string | null; href?: string }) { return <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>{href && value ? <a href={href} className="mt-1 block text-sm font-medium text-amber-300 hover:underline">{value}</a> : <p className="mt-1 text-sm text-slate-600">{value || "Not recorded"}</p>}</div>; }
function formatDate(value: string | null): string { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(new Date(value)) : "Not scheduled"; }
function isToday(value: string | null): boolean { if (!value) return false; const date = new Date(value); const today = new Date(); return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate(); }
const smallAction = "grid h-7 w-7 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-500 hover:border-amber-400/40 hover:text-amber-300";
