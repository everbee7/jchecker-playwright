export const DEFAULT_WANTED = [
  "React",
  "Next.js",
  "JavaScript",
  "TypeScript",
  "Node.js",
  "Python",
  "Django",
  "Flask",
  "FastAPI",
  "Java",
  "Spring",
  "Spring Boot",
  "Go",
];
export const DEFAULT_UNWANTED = [
  "Angular",
  "Vue",
  "Vue.js",
  "PHP",
  "Laravel",
  "C#",
  ".NET",
  "ASP.NET",
  "Ruby",
  "Ruby on Rails",
];
export const DEFAULT_SETTINGS = {
  webAppUrl: null,
  wantedTechnologies: DEFAULT_WANTED,
  unwantedTechnologies: DEFAULT_UNWANTED,
  scrapingConcurrency: 3,
  requestTimeoutMs: 15000,
  technologyCatalog: DEFAULT_TECHNOLOGY_CATALOG,
  interviewCustomStages: [],
};
export const MAX_DESCRIPTION_LENGTH = 250_000;
export const MAX_RESPONSE_BYTES = 5_000_000;
import { DEFAULT_TECHNOLOGY_CATALOG } from "@/lib/detection/technology-catalog";
