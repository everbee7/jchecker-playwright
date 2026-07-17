export function normalizeWebUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getEnvironmentWebAppUrl(): string | null {
  return (
    normalizeWebUrl(process.env.JOBCHECKER_WEB_URL) ??
    normalizeWebUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeWebUrl(process.env.VERCEL_URL)
  );
}
