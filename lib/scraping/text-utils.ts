import * as cheerio from "cheerio";
export function cleanDescriptionText(value: string): string {
  const $ = cheerio.load(`<div>${value}</div>`);
  $("br").replaceWith("\n");
  $("li").each((_, element) => {
    $(element).prepend("• ").append("\n");
  });
  $("p,h1,h2,h3,h4,h5,h6,section,article,blockquote,tr").each((_, element) => {
    $(element).append("\n");
  });
  const decoded = $.root().text().replace(/\r/g, "");
  const lines = decoded
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
  const unique: string[] = [];
  for (const line of lines) if (unique.at(-1) !== line) unique.push(line);
  return unique
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
export function remoteFromText(
  value: string,
): "remote" | "hybrid" | "onsite" | "unknown" {
  if (
    /\b(hybrid|flexible hybrid|partly remote|partially remote|remote.{0,20}(?:days?|week).{0,20}(?:office|on[- ]?site))\b/i.test(
      value,
    )
  )
    return "hybrid";
  if (
    /\b(on[- ]?site|in[- ]office|in person|office[- ]based|work from (?:the |our )?office|not (?:a )?remote|no remote)\b/i.test(
      value,
    )
  )
    return "onsite";
  if (
    /\b(remote|fully remote|remote[- ]first|work from home|work from anywhere|home[- ]based|telecommut(?:e|ing)|distributed team|wfh|virtual role)\b/i.test(
      value,
    )
  )
    return "remote";
  return "unknown";
}
export function sourceFromUrl(url: string): string {
  const host = new URL(url).hostname.toLowerCase();
  const sources: [[string, string]] | [string, string][] = [
    ["lever.co", "Lever"],
    ["greenhouse.io", "Greenhouse"],
    ["ashbyhq.com", "Ashby"],
    ["myworkdayjobs.com", "Workday"],
    ["bamboohr.com", "BambooHR"],
    ["teamtailor.com", "Teamtailor"],
    ["rippling.com", "Rippling"],
    ["paylocity.com", "Paylocity"],
    ["jobright.ai", "JobRight"],
  ];
  return (
    sources.find(([domain]) => host.includes(domain))?.[1] ??
    host.replace(/^www\./, "")
  );
}
