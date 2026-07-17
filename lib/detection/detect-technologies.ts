import type { DetectedTechnology, TechnologyImportance } from "@/types/job";
import type { TechnologyCatalogItem } from "@/types/settings";
import { detectImportance, importanceRank } from "./detect-importance";
import { DEFAULT_TECHNOLOGY_CATALOG } from "./technology-catalog";
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sentences = (text: string) =>
  text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.replace(/^[•*\-–—]\s*/, "").trim())
    .filter(Boolean);
function compilePatterns(technology: TechnologyCatalogItem): RegExp[] {
  if (technology.patterns?.length) {
    const compiled = technology.patterns.flatMap((source) => {
      try {
        return [new RegExp(source, "gi")];
      } catch {
        return [];
      }
    });
    if (compiled.length) return compiled;
  }
  const terms = [technology.name, ...technology.aliases].filter(
    (term, index, all) =>
      all.findIndex(
        (candidate) => candidate.toLowerCase() === term.toLowerCase(),
      ) === index,
  );
  return terms.map(
    (alias) => new RegExp(`(?<![\\w+#.])${escape(alias)}(?![\\w+#])`, "gi"),
  );
}

export function detectTechnologies(
  text: string,
  catalog: TechnologyCatalogItem[] = DEFAULT_TECHNOLOGY_CATALOG,
): DetectedTechnology[] {
  const chunks = sentences(text);
  const results: DetectedTechnology[] = [];
  for (const tech of catalog) {
    const patterns = compilePatterns(tech);
    let count = 0;
    let importance: TechnologyImportance = "mentioned";
    const evidence: string[] = [];
    for (const sentence of chunks) {
      let matches = 0;
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        matches += (sentence.match(pattern) || []).length;
      }
      if (matches) {
        count += matches;
        const level = detectImportance(sentence);
        if (importanceRank[level] > importanceRank[importance])
          importance = level;
        if (evidence.length < 3 && !evidence.includes(sentence.trim()))
          evidence.push(sentence.trim().slice(0, 500));
      }
    }
    if (count)
      results.push({
        name: tech.name,
        normalizedName: tech.name.toLowerCase(),
        category: tech.category,
        importance,
        mentionCount: count,
        evidence,
      });
  }
  return results;
}
