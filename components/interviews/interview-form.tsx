"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { BriefcaseBusiness, CalendarClock, Contact, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INTERVIEW_STATUSES, INTERVIEW_TYPES, interviewLabel } from "@/lib/interviews/constants";
import type { InterviewStatus, InterviewType, SerializedInterview } from "@/types/interview";

interface JobOption {
  _id: string;
  title: string | null;
  company: string | null;
  finalUrl: string;
  url: string;
  employmentType: string | null;
  salary: string | null;
}

interface FormState {
  linkedJobId: string;
  jobUrl: string;
  company: string;
  role: string;
  position: string;
  clientName: string;
  type: InterviewType;
  status: InterviewStatus;
  roundNumber: string;
  scheduledAt: string;
  timezone: string;
  durationMinutes: string;
  location: string;
  meetingLink: string;
  interviewers: string;
  recruiterName: string;
  recruiterEmail: string;
  recruiterPhone: string;
  employmentType: string;
  salaryRange: string;
  notes: string;
  preparationNotes: string;
  questionsToAsk: string;
  followUpNotes: string;
  outcomeNotes: string;
  nextSteps: string;
}

const emptyForm: FormState = {
  linkedJobId: "",
  jobUrl: "",
  company: "",
  role: "",
  position: "",
  clientName: "",
  type: "recruiter-screen",
  status: "scheduled",
  roundNumber: "1",
  scheduledAt: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  durationMinutes: "30",
  location: "",
  meetingLink: "",
  interviewers: "",
  recruiterName: "",
  recruiterEmail: "",
  recruiterPhone: "",
  employmentType: "",
  salaryRange: "",
  notes: "",
  preparationNotes: "",
  questionsToAsk: "",
  followUpNotes: "",
  outcomeNotes: "",
  nextSteps: "",
};

function localDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromInterview(value: SerializedInterview): FormState {
  return {
    linkedJobId: value.linkedJobId ?? "",
    jobUrl: value.jobUrl ?? "",
    company: value.company,
    role: value.role,
    position: value.position ?? "",
    clientName: value.clientName ?? "",
    type: value.type,
    status: value.status,
    roundNumber: value.roundNumber?.toString() ?? "",
    scheduledAt: localDateTime(value.scheduledAt),
    timezone: value.timezone ?? "",
    durationMinutes: value.durationMinutes?.toString() ?? "",
    location: value.location ?? "",
    meetingLink: value.meetingLink ?? "",
    interviewers: value.interviewers.join(", "),
    recruiterName: value.recruiterName ?? "",
    recruiterEmail: value.recruiterEmail ?? "",
    recruiterPhone: value.recruiterPhone ?? "",
    employmentType: value.employmentType ?? "",
    salaryRange: value.salaryRange ?? "",
    notes: value.notes,
    preparationNotes: value.preparationNotes,
    questionsToAsk: value.questionsToAsk,
    followUpNotes: value.followUpNotes,
    outcomeNotes: value.outcomeNotes,
    nextSteps: value.nextSteps,
  };
}

export function InterviewForm({
  interview,
  initialJobId,
  onClose,
  onSaved,
}: {
  interview?: SerializedInterview | null;
  initialJobId?: string | null;
  onClose: () => void;
  onSaved: (interview: SerializedInterview) => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    interview ? fromInterview(interview) : emptyForm,
  );
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/jobs?limit=100&sortBy=checked&sortOrder=desc", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { jobs?: JobOption[] }) => {
        const options = data.jobs ?? [];
        setJobs(options);
        if (!interview && initialJobId) {
          const job = options.find((item) => item._id === initialJobId);
          if (job)
            setForm((current) => ({
              ...current,
              linkedJobId: job._id,
              jobUrl: job.finalUrl || job.url,
              company: job.company || current.company,
              role: job.title || current.role,
              employmentType: job.employmentType || current.employmentType,
              salaryRange: job.salary || current.salaryRange,
            }));
        }
      });
  }, [initialJobId, interview]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function linkJob(id: string) {
    set("linkedJobId", id);
    const job = jobs.find((item) => item._id === id);
    if (!job) return;
    setForm((current) => ({
      ...current,
      linkedJobId: id,
      jobUrl: job.finalUrl || job.url,
      company: job.company || current.company,
      role: job.title || current.role,
      employmentType: job.employmentType || current.employmentType,
      salaryRange: job.salary || current.salaryRange,
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const nullable = (value: string) => value.trim() || null;
    const payload = {
      ...form,
      linkedJobId: nullable(form.linkedJobId),
      jobUrl: nullable(form.jobUrl),
      position: nullable(form.position),
      clientName: nullable(form.clientName),
      roundNumber: form.roundNumber ? Number(form.roundNumber) : null,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      timezone: nullable(form.timezone),
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
      location: nullable(form.location),
      meetingLink: nullable(form.meetingLink),
      interviewers: form.interviewers.split(/[,\n]/).map((item) => item.trim()).filter(Boolean),
      recruiterName: nullable(form.recruiterName),
      recruiterEmail: nullable(form.recruiterEmail),
      recruiterPhone: nullable(form.recruiterPhone),
      employmentType: nullable(form.employmentType),
      salaryRange: nullable(form.salaryRange),
    };
    try {
      const response = await fetch(
        interview ? `/api/interviews/${interview._id}` : "/api/interviews",
        {
          method: interview ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as SerializedInterview & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save interview");
      onSaved(data);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save interview");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0b1020]/80 p-3 backdrop-blur-sm sm:p-6">
      <form onSubmit={submit} className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-[#202a44] shadow-2xl shadow-black/50">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-[#202a44]/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold">{interview ? "Edit interview" : "Record an interview"}</h2>
            <p className="mt-1 text-xs text-slate-500">Keep the opportunity, people, schedule, preparation, and outcome in one place.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-white" aria-label="Close form"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[calc(100vh-11rem)] space-y-7 overflow-y-auto p-5 sm:p-6">
          <Section icon={<BriefcaseBusiness className="h-4 w-4" />} title="Opportunity">
            <Field label="Linked saved job" wide><select value={form.linkedJobId} onChange={(event) => linkJob(event.target.value)} className={control}><option value="">No linked job</option>{jobs.map((job) => <option value={job._id} key={job._id}>{job.company || "Unknown"} — {job.title || "Untitled"}</option>)}</select></Field>
            <Field label="Company" required><input required value={form.company} onChange={(event) => set("company", event.target.value)} className={control} /></Field>
            <Field label="Role" required><input required value={form.role} onChange={(event) => set("role", event.target.value)} className={control} placeholder="Senior Software Engineer" /></Field>
            <Field label="Position / level"><input value={form.position} onChange={(event) => set("position", event.target.value)} className={control} placeholder="Full-time · Senior" /></Field>
            <Field label="Client name"><input value={form.clientName} onChange={(event) => set("clientName", event.target.value)} className={control} /></Field>
            <Field label="Job URL" wide><input type="url" value={form.jobUrl} onChange={(event) => set("jobUrl", event.target.value)} className={control} placeholder="https://…" /></Field>
            <Field label="Employment type"><input value={form.employmentType} onChange={(event) => set("employmentType", event.target.value)} className={control} placeholder="Full-time, contract…" /></Field>
            <Field label="Salary / rate"><input value={form.salaryRange} onChange={(event) => set("salaryRange", event.target.value)} className={control} placeholder="$140k–$170k or $80/hr" /></Field>
          </Section>

          <Section icon={<CalendarClock className="h-4 w-4" />} title="Interview schedule">
            <Field label="Interview type" required><select value={form.type} onChange={(event) => set("type", event.target.value as InterviewType)} className={control}>{INTERVIEW_TYPES.map((type) => <option value={type} key={type}>{interviewLabel(type)}</option>)}</select></Field>
            <Field label="Status" required><select value={form.status} onChange={(event) => set("status", event.target.value as InterviewStatus)} className={control}>{INTERVIEW_STATUSES.map((status) => <option value={status} key={status}>{interviewLabel(status)}</option>)}</select></Field>
            <Field label="Date and time"><input type="datetime-local" value={form.scheduledAt} onChange={(event) => set("scheduledAt", event.target.value)} className={control} /></Field>
            <Field label="Timezone"><input value={form.timezone} onChange={(event) => set("timezone", event.target.value)} className={control} /></Field>
            <Field label="Round"><input type="number" min="1" max="30" value={form.roundNumber} onChange={(event) => set("roundNumber", event.target.value)} className={control} /></Field>
            <Field label="Duration (minutes)"><input type="number" min="5" max="1440" step="5" value={form.durationMinutes} onChange={(event) => set("durationMinutes", event.target.value)} className={control} /></Field>
            <Field label="Location"><input value={form.location} onChange={(event) => set("location", event.target.value)} className={control} placeholder="Remote, office address…" /></Field>
            <Field label="Meeting link"><input type="url" value={form.meetingLink} onChange={(event) => set("meetingLink", event.target.value)} className={control} placeholder="https://zoom.us/…" /></Field>
          </Section>

          <Section icon={<Contact className="h-4 w-4" />} title="People and contacts">
            <Field label="Interviewers" wide><input value={form.interviewers} onChange={(event) => set("interviewers", event.target.value)} className={control} placeholder="Alex Smith, Jamie Lee" /><p className="mt-1 text-[11px] text-slate-500">Separate multiple names with commas.</p></Field>
            <Field label="Recruiter name"><input value={form.recruiterName} onChange={(event) => set("recruiterName", event.target.value)} className={control} /></Field>
            <Field label="Recruiter email"><input type="email" value={form.recruiterEmail} onChange={(event) => set("recruiterEmail", event.target.value)} className={control} /></Field>
            <Field label="Recruiter phone"><input value={form.recruiterPhone} onChange={(event) => set("recruiterPhone", event.target.value)} className={control} /></Field>
          </Section>

          <Section icon={<FileText className="h-4 w-4" />} title="Preparation and follow-up">
            <TextField label="General notes" value={form.notes} onChange={(value) => set("notes", value)} placeholder="Context, responsibilities, important details…" />
            <TextField label="Preparation notes" value={form.preparationNotes} onChange={(value) => set("preparationNotes", value)} placeholder="Topics to review, stories to prepare, technical focus…" />
            <TextField label="Questions to ask" value={form.questionsToAsk} onChange={(value) => set("questionsToAsk", value)} placeholder="Team, product, expectations, engineering practices…" />
            <TextField label="Follow-up notes" value={form.followUpNotes} onChange={(value) => set("followUpNotes", value)} placeholder="Thank-you sent, people to contact, dates…" />
            <TextField label="Outcome" value={form.outcomeNotes} onChange={(value) => set("outcomeNotes", value)} placeholder="How it went, feedback, decisions…" />
            <TextField label="Next steps" value={form.nextSteps} onChange={(value) => set("nextSteps", value)} placeholder="Next round, assignment, follow-up date…" />
          </Section>
          {error && <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-[#1a233a] px-5 py-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : interview ? "Save changes" : "Add interview"}</Button></div>
      </form>
    </div>
  );
}

const control = "h-10 w-full rounded-lg border border-slate-200 bg-[#182137] px-3 text-sm text-ink outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15";

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <section><div className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-300">{icon}{title}</div><div className="grid gap-4 sm:grid-cols-2">{children}</div></section>;
}
function Field({ label, required, wide, children }: { label: string; required?: boolean; wide?: boolean; children: ReactNode }) {
  return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}{required && <span className="text-orange-400"> *</span>}</span>{children}</label>;
}
function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <Field label={label}><textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${control} h-28 resize-y py-2.5`} placeholder={placeholder} /></Field>;
}
