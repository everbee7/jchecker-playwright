import { promises as dns } from "node:dns";
import { isIP } from "node:net";
import { MAX_RESPONSE_BYTES } from "@/lib/constants";
import type { FetchedPage } from "@/types/scraping";
import { validatePublicUrl } from "@/lib/urls/validate-url";
function publicAddress(address: string): boolean {
  const checked = validatePublicUrl(
    `http://${isIP(address) === 6 ? `[${address}]` : address}`,
  );
  return checked.valid;
}
export async function assertPublicUrl(url: URL) {
  const valid = validatePublicUrl(url.toString());
  if (!valid.valid) throw new Error(valid.reason);
  const addresses = await dns.lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
    throw new Error("Hostname resolves to a private or internal address");
}
const assertPublic = assertPublicUrl;
export async function fetchPage(
  input: string,
  timeoutMs: number,
): Promise<FetchedPage> {
  let current = new URL(input);
  for (let redirects = 0; redirects <= 5; redirects++) {
    await assertPublic(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location)
          throw new Error(`Redirect ${response.status} missing location`);
        current = new URL(location, current);
        continue;
      }
      if (!response.ok)
        throw Object.assign(
          new Error(`HTTP ${response.status}: ${response.statusText}`),
          { httpStatus: response.status },
        );
      const length = Number(response.headers.get("content-length") ?? 0);
      if (length > MAX_RESPONSE_BYTES)
        throw new Error("Response exceeds maximum size");
      if (!response.body)
        return {
          html: "",
          finalUrl: current.toString(),
          status: response.status,
        };
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          throw new Error("Response exceeds maximum size");
        }
        chunks.push(value);
      }
      const all = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        all.set(chunk, offset);
        offset += chunk.length;
      }
      return {
        html: new TextDecoder().decode(all),
        finalUrl: current.toString(),
        status: response.status,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError")
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Too many redirects");
}
