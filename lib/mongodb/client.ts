import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_URI;
if (!uri)
  console.warn(
    "MONGODB_URI is not configured. Database requests will fail until it is set.",
  );
declare global {
  // `var` is required for a reusable global declaration across Next.js reloads.
  // eslint-disable-next-line no-var
  var __jobCheckerMongo: Promise<MongoClient> | undefined;
}
export function getMongoClient(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI is not configured");
  global.__jobCheckerMongo ??= new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 10,
  }).connect();
  return global.__jobCheckerMongo;
}
export async function getDb() {
  return (await getMongoClient()).db(
    process.env.MONGODB_DB_NAME || "jobchecker",
  );
}
