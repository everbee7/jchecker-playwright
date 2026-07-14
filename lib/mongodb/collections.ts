import type { AppSettings,AnalysisRun } from "@/types/settings";import type { JobDocument } from "@/types/job";import { getDb } from "./client";
export async function collections(){const db=await getDb();return{jobs:db.collection<JobDocument>("jobs"),settings:db.collection<AppSettings>("settings"),runs:db.collection<AnalysisRun>("analysis_runs")};}
