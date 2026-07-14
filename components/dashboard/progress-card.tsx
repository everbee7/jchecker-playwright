import { Activity, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
export interface RunState {
  _id: string;
  totalLinks: number;
  completedCount: number;
  failedCount: number;
  status: "pending" | "processing" | "completed";
  currentJobs: string[];
}
export function ProgressCard({ run }: { run: RunState }) {
  const done = run.completedCount + run.failedCount;
  const percent = run.totalLinks
    ? Math.round((done / run.totalLinks) * 100)
    : 0;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <Activity className="h-4 w-4 text-brand-600" />
            Analysis progress
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {run.status === "completed"
              ? "Batch complete"
              : `Checking ${Math.min(done + run.currentJobs.length, run.totalLinks)} of ${run.totalLinks} jobs`}
          </p>
        </div>
        <span className="text-2xl font-bold text-brand-600">{percent}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Clock3} label="Total" value={run.totalLinks} />
        <Stat
          icon={CheckCircle2}
          label="Completed"
          value={run.completedCount}
          color="text-emerald-600"
        />
        <Stat
          icon={XCircle}
          label="Failed"
          value={run.failedCount}
          color="text-red-600"
        />
        <Stat
          icon={Activity}
          label="Processing"
          value={run.currentJobs.length}
          color="text-brand-600"
        />
      </div>
      {run.currentJobs[0] && (
        <div className="mt-3 truncate rounded-lg bg-brand-50 px-3 py-2 font-mono text-xs text-brand-700">
          Now: {run.currentJobs[0]}
        </div>
      )}
    </Card>
  );
}
function Stat({
  icon: Icon,
  label,
  value,
  color = "text-slate-600",
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <div className={`flex items-center gap-1.5 text-xs ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
