"use client";
import { useState } from "react";
import { ClipboardPaste, Link2, Play, X, Trash2, ScanLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
export interface LinkStats {
  links: string[];
  duplicateCount: number;
  invalidCount: number;
}
export function InputCard({
  onRun,
  running,
}: {
  onRun: (links: string[]) => Promise<void>;
  running: boolean;
}) {
  const [text, setText] = useState("");
  const [stats, setStats] = useState<LinkStats>({
    links: [],
    duplicateCount: 0,
    invalidCount: 0,
  });
  const [extracting, setExtracting] = useState(false);
  const toast = useToast();
  async function extract() {
    setExtracting(true);
    try {
      const response = await fetch("/api/links/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as LinkStats & { error?: string };
      if (!response.ok) throw new Error(data.error);
      setStats(data);
      if (!data.links.length) toast("No valid public job URLs found", "error");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not extract links",
        "error",
      );
    } finally {
      setExtracting(false);
    }
  }
  function clear() {
    setText("");
    setStats({ links: [], duplicateCount: 0, invalidCount: 0 });
  }
  return (
    <Card className="overflow-hidden border-t-2 border-t-orange-500/80">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2 font-semibold">
          <span className="rounded-lg bg-brand-50 p-2 text-brand-600">
            <ClipboardPaste className="h-4 w-4" />
          </span>
          Paste job links
        </div>
        <p className="mt-1 pl-10 text-sm text-slate-500">
          Names, timestamps, and chat messages are okay — only valid public URLs
          are kept.
        </p>
      </div>
      <div className="p-5">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            maxLength={1_000_000}
            placeholder={
              "https://jobs.lever.co/company/role[3:38 AM]\nMessage from Danny\nhttps://boards.greenhouse.io/company/jobs/123"
            }
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 p-4 pb-9 font-mono text-sm outline-none transition placeholder:text-slate-400 hover:bg-slate-50 focus:border-amber-500 focus:bg-slate-50 focus:ring-4 focus:ring-orange-500/10"
          />
          <span className="absolute bottom-3 right-3 text-xs text-slate-400">
            {text.length.toLocaleString()} characters
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={extract} disabled={!text.trim() || extracting}>
            <ScanLine className="h-4 w-4" />
            {extracting ? "Extracting…" : "Extract links"}
          </Button>
          <Button
            variant="secondary"
            onClick={clear}
            disabled={!text && !stats.links.length}
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
        {(stats.links.length > 0 ||
          stats.invalidCount > 0 ||
          stats.duplicateCount > 0) && (
          <div className="mt-5 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex gap-4 text-sm">
                <span>
                  <b className="text-ink">{stats.links.length}</b>{" "}
                  <span className="text-slate-500">valid</span>
                </span>
                <span>
                  <b className="text-amber-600">{stats.duplicateCount}</b>{" "}
                  <span className="text-slate-500">duplicates</span>
                </span>
                <span>
                  <b className="text-red-600">{stats.invalidCount}</b>{" "}
                  <span className="text-slate-500">invalid</span>
                </span>
              </div>
              {stats.links.length > 0 && (
                <button
                  onClick={() => setStats((s) => ({ ...s, links: [] }))}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600"
                >
                  Remove all
                </button>
              )}
            </div>
            {stats.links.length > 0 && (
              <div className="scrollbar max-h-48 divide-y divide-slate-100 overflow-auto">
                {stats.links.map((link) => (
                  <div
                    key={link}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm"
                  >
                    <Link2 className="h-4 w-4 shrink-0 text-brand-500" />
                    <span
                      className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600"
                      title={link}
                    >
                      {link}
                    </span>
                    <button
                      onClick={() =>
                        setStats((s) => ({
                          ...s,
                          links: s.links.filter((item) => item !== link),
                        }))
                      }
                      aria-label="Remove link"
                      className="rounded p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end bg-slate-50/70 p-3">
              <Button
                onClick={() => onRun(stats.links)}
                disabled={!stats.links.length || running}
              >
                <Play className="h-4 w-4 fill-current" />
                {running
                  ? "Checking jobs…"
                  : `Check ${stats.links.length} job${stats.links.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
