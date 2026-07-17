import type { JobRequirements } from "@/types/job";
export function detectRequirements(text: string, title = ""): JobRequirements {
  const all = `${title} ${text}`;
  const yearPatterns = [
    /(?:minimum(?: of)?|at least|over|more than)?\s*(\d{1,2})(?:\s*[-–]\s*\d{1,2})?\+?\s*(?:years?|yrs?)(?: of)?\s*(?:professional |relevant |hands-on |industry )?experience/gi,
    /\bexperience(?: of|:)?[^.!?\n]{0,35}?(\d{1,2})\+?\s*(?:years?|yrs?)/gi,
    /(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:using|with|in)\s+[A-Za-z+#.]/gi,
  ];
  const years = yearPatterns.flatMap((pattern) =>
    [...all.matchAll(pattern)].map((match) => Number(match[1])),
  );
  const seniority = ((): JobRequirements["seniority"] => {
    const entries: [JobRequirements["seniority"], RegExp][] = [
      ["intern", /\b(intern|internship)\b/i],
      ["principal", /\bprincipal\b/i],
      ["staff", /\bstaff\b/i],
      ["senior", /\b(senior|sr\.)\b/i],
      ["lead", /\b(team |technical )?lead\b/i],
      ["manager", /\bmanager\b/i],
      ["junior", /\b(junior|jr\.|entry.level)\b/i],
      ["mid-level", /\b(mid.level|intermediate)\b/i],
    ];
    return entries.find(([, r]) => r.test(all))?.[0] ?? "unknown";
  })();
  const auth =
    all.match(
      /(?:(?:legally )?authorized|authorization|eligible|right) to work (?:in|within) (?:the )?(?:US|U\.S\.|United States)[^.!?]*|(?:US|U\.S\.) (?:citizenship|citizen|work authorization) required[^.!?]*/i,
    )?.[0] ?? null;
  const visa =
    all.match(
      /(?:(?:no|not|unable to|cannot|we do not)\s+)?(?:offer|provide)?\s*(?:employment |work )?visa sponsorship(?: is available| available)?|(?:will|can) sponsor (?:a )?(?:work |employment )?visa/i,
    )?.[0] ?? null;
  const restriction =
    all.match(
      /(?:must (?:be|reside) (?:located )?in the United States|(?:US|U\.S\.) only|remote within (?:the )?(?:US|U\.S\.|United States)|worldwide remote|work from anywhere|remote (?:in|within|from) [^.!?]+)/i,
    )?.[0] ?? null;
  return {
    minimumYears: years.length ? Math.min(...years) : null,
    seniority,
    workAuthorization: auth,
    visaSponsorship: visa,
    locationRestriction: restriction,
  };
}
