import { MongoClient } from "mongodb";
import dns from "node:dns";
import net from "node:net";

function configureMongoDns(): void {
  const hasUsableDnsServer = dns
    .getServers()
    .some((server) => server !== "127.0.0.1" && server !== "::1");
  if (hasUsableDnsServer) return;

  const configuredDnsServers = (process.env.JOBCHECKER_DNS_SERVERS || "")
    .split(",")
    .map((server) => server.trim())
    .filter((server) => net.isIP(server) !== 0);
  if (configuredDnsServers.length) dns.setServers(configuredDnsServers);
}

configureMongoDns();

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
