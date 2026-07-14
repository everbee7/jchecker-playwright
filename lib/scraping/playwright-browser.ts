import { chromium, type Browser } from "playwright";
import { validatePublicUrl } from "@/lib/urls/validate-url";
import { assertPublicUrl } from "./fetch-page";

let browserPromise: Promise<Browser> | null = null;
async function browser() {
  browserPromise ??= chromium.launch({ headless: true });
  try {
    return await browserPromise;
  } catch (error) {
    browserPromise = null;
    throw error;
  }
}

export async function renderedHtml(
  url: string,
  timeoutMs: number,
): Promise<{ html: string; finalUrl: string }> {
  const checked = validatePublicUrl(url);
  if (!checked.valid) throw new Error(checked.reason);
  await assertPublicUrl(checked.url);
  const instance = await browser();
  const context = await instance.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    locale: "en-US",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(timeoutMs);
  await page.route("**/*", async (route) => {
    const target = validatePublicUrl(route.request().url());
    if (
      !target.valid ||
      ["image", "media", "font"].includes(route.request().resourceType())
    )
      return route.abort();
    if (route.request().resourceType() === "document") {
      try {
        await assertPublicUrl(target.url);
      } catch {
        return route.abort();
      }
    }
    return route.continue();
  });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForTimeout(1200);
    for (const label of [
      /accept all/i,
      /accept cookies/i,
      /agree/i,
      /got it/i,
    ]) {
      const button = page.getByRole("button", { name: label }).first();
      if (await button.isVisible().catch(() => false)) {
        await button.click({ timeout: 1000 }).catch(() => undefined);
        break;
      }
    }
    return { html: await page.content(), finalUrl: page.url() };
  } finally {
    await context.close();
  }
}
export async function closeBrowser() {
  if (browserPromise) {
    const instance = await browserPromise.catch(() => null);
    await instance?.close();
    browserPromise = null;
  }
}
