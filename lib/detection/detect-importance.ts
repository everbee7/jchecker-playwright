import type { TechnologyImportance } from "@/types/job";
const NICE=/\b(nice[- ]to[- ]have|bonus|a plus|helpful|optional|advantage|not required)\b/i;
const PREFERRED=/\b(preferred|ideally|we would like|experience is preferred|strong plus|highly desirable)\b/i;
const REQUIRED=/\b(required|must have|must be|strong experience|proficient in|expertise in|minimum experience|you have|we require|essential|core requirement)\b/i;
export function detectImportance(context:string):TechnologyImportance{if(NICE.test(context))return"nice-to-have";if(PREFERRED.test(context))return"preferred";if(REQUIRED.test(context))return"required";return"mentioned";}
export const importanceRank:Record<TechnologyImportance,number>={required:4,preferred:3,"nice-to-have":2,mentioned:1};
