import fs from "node:fs";
import path from "node:path";
import dns from "node:dns";
import dotenv from "dotenv";

const sourcePath = path.resolve(".env");
const outputDirectory = path.resolve("desktop-runtime");
const outputPath = path.join(outputDirectory, "JobChecker.env");
const allowedKeys = [
  "MONGODB_URI",
  "MONGODB_DB_NAME",
  "JOBCHECKER_USER",
  "user",
  "JOBCHECKER_WEB_URL",
  "JOBCHECKER_DNS_SERVERS",
];

if (!fs.existsSync(sourcePath)) {
  throw new Error("Desktop builds require a local .env file");
}

const source = dotenv.parse(fs.readFileSync(sourcePath));
if (!source.MONGODB_URI?.trim()) {
  throw new Error("MONGODB_URI is missing from .env");
}

async function resolveMongoSrv(uri) {
  if (!uri.toLowerCase().startsWith("mongodb+srv://")) return uri;
  const parsed = new URL(uri);
  const records = await dns.promises.resolveSrv(`_mongodb._tcp.${parsed.hostname}`);
  if (!records.length) throw new Error("MongoDB SRV lookup returned no hosts");

  const parameters = new URLSearchParams(parsed.search);
  try {
    const txtRecords = await dns.promises.resolveTxt(parsed.hostname);
    for (const txtRecord of txtRecords) {
      for (const [key, value] of new URLSearchParams(txtRecord.join(""))) {
        if (!parameters.has(key)) parameters.set(key, value);
      }
    }
  } catch (error) {
    if (error?.code !== "ENODATA" && error?.code !== "ENOTFOUND") throw error;
  }
  if (!parameters.has("tls") && !parameters.has("ssl")) {
    parameters.set("tls", "true");
  }

  const credentials = parsed.username
    ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ""}@`
    : "";
  const hosts = records
    .sort((left, right) => left.priority - right.priority)
    .map((record) => `${record.name.replace(/\.$/, "")}:${record.port}`)
    .join(",");
  const query = parameters.toString();
  return `mongodb://${credentials}${hosts}${parsed.pathname || "/"}${query ? `?${query}` : ""}`;
}

source.MONGODB_URI = await resolveMongoSrv(source.MONGODB_URI.trim());

source.JOBCHECKER_DNS_SERVERS ||= dns
  .getServers()
  .filter((server) => server !== "127.0.0.1" && server !== "::1")
  .join(",");

const runtimeValues = allowedKeys.flatMap((key) => {
  const value = source[key]?.trim();
  return value ? [`${key}=${JSON.stringify(value)}`] : [];
});

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(outputPath, `${runtimeValues.join("\n")}\n`, {
  encoding: "utf8",
  mode: 0o600,
});
console.log(`Prepared desktop runtime environment (${runtimeValues.length} keys)`);
