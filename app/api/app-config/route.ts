import { getSettings } from "@/lib/mongodb/settings";
import {
  getEnvironmentWebAppUrl,
  normalizeWebUrl,
} from "@/lib/web-app-url";

export const dynamic = "force-dynamic";

export async function GET() {
  const environmentUrl = getEnvironmentWebAppUrl();
  if (environmentUrl) return Response.json({ webAppUrl: environmentUrl });
  try {
    const settings = await getSettings();
    return Response.json({ webAppUrl: normalizeWebUrl(settings.webAppUrl) });
  } catch {
    return Response.json({ webAppUrl: null });
  }
}
