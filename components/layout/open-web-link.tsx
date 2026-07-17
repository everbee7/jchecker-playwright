"use client";

import { ExternalLink, Globe2 } from "lucide-react";
import { useEffect, useState } from "react";

export function OpenWebLink() {
  const [webAppUrl, setWebAppUrl] = useState<string | null | undefined>();

  useEffect(() => {
    const controller = new AbortController();
    const load = () => {
      void fetch("/api/app-config", {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Could not load web app URL");
          return (await response.json()) as { webAppUrl: string | null };
        })
        .then(({ webAppUrl: value }) => setWebAppUrl(value))
        .catch(() => setWebAppUrl(null));
    };
    load();
    window.addEventListener("jobchecker:web-url-updated", load);
    return () => {
      controller.abort();
      window.removeEventListener("jobchecker:web-url-updated", load);
    };
  }, []);

  if (webAppUrl === undefined)
    return <div className="h-11 animate-pulse rounded-lg border border-white/10 bg-white/5" />;

  const configured = Boolean(webAppUrl);
  return (
    <a
      href={webAppUrl ?? "/settings#web-app"}
      target={configured ? "_blank" : undefined}
      rel={configured ? "noreferrer" : undefined}
      aria-label={configured ? "Open the hosted JobChecker web app" : "Configure the hosted JobChecker web app"}
      className="group flex items-center justify-between rounded-lg border border-amber-400/20 bg-gradient-to-r from-amber-500/10 to-red-500/10 px-3 py-3 text-xs font-semibold text-amber-200 transition hover:border-amber-300/40 hover:from-amber-500/20 hover:to-red-500/20 hover:text-white"
    >
      <span className="flex items-center gap-2.5">
        <Globe2 className="h-4 w-4 text-amber-400" />
        {configured ? "Open Web" : "Set Web URL"}
      </span>
      <ExternalLink className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-amber-300" />
    </a>
  );
}
