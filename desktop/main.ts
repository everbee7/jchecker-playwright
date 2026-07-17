import { app, BrowserWindow, dialog, shell } from "electron";
import dotenv from "dotenv";
import dns from "node:dns";
import net from "node:net";
import http, { type Server } from "node:http";
import path from "node:path";
import next from "next";

let window: BrowserWindow | null = null;
let httpServer: Server | null = null;
let nextApplication: ReturnType<typeof next> | null = null;
let applicationUrl: string | null = null;

function applicationRoot(): string {
  return app.getAppPath();
}

function portableDirectory(): string {
  return process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
}

function loadRuntimeEnvironment(): void {
  const bundledEnvironment = app.isPackaged
    ? path.join(process.resourcesPath, "JobChecker.env")
    : path.join(applicationRoot(), ".env");
  dotenv.config({
    path: bundledEnvironment,
    quiet: true,
    override: true,
  });

  const overrideCandidates = [
    path.join(portableDirectory(), "JobChecker.env"),
    path.join(portableDirectory(), ".env"),
    path.join(app.getPath("userData"), "jobchecker.env"),
  ];
  for (const candidate of overrideCandidates) {
    if (path.resolve(candidate) !== path.resolve(bundledEnvironment)) {
      dotenv.config({ path: candidate, quiet: true, override: true });
    }
  }
  const currentDnsServers = dns.getServers();
  const hasUsableDnsServer = currentDnsServers.some(
    (server) => server !== "127.0.0.1" && server !== "::1",
  );
  if (!hasUsableDnsServer) {
    const configuredDnsServers = (process.env.JOBCHECKER_DNS_SERVERS || "")
      .split(",")
      .map((server) => server.trim())
      .filter((server) => net.isIP(server) !== 0);
    if (configuredDnsServers.length) {
      dns.setServers(configuredDnsServers);
      console.log(
        `[JobChecker] Replaced loopback DNS with ${configuredDnsServers.length} build-time resolver(s)`,
      );
    }
  }
  process.env.MONGODB_URI ||= "mongodb://localhost:27017";
  process.env.MONGODB_DB_NAME ||= "jobchecker";
  Object.assign(process.env, { NODE_ENV: "production" });
  if (app.isPackaged) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(
      process.resourcesPath,
      "playwright-browsers",
    );
  }
}

function createWindow(): BrowserWindow {
  const browserWindow = new BrowserWindow({
    width: 1450,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: "#171d34",
    icon: path.join(applicationRoot(), "desktop", "icon.png"),
    title: "JobChecker",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  browserWindow.once("ready-to-show", () => browserWindow.show());
  browserWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  browserWindow.webContents.on("will-navigate", (event, url) => {
    if (applicationUrl && url.startsWith(applicationUrl)) return;
    if (url.startsWith("file:")) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
  });
  browserWindow.on("closed", () => {
    window = null;
  });
  return browserWindow;
}

async function startNextServer(): Promise<string> {
  if (applicationUrl) return applicationUrl;
  const root = applicationRoot();
  process.chdir(root);
  nextApplication = next({ dev: false, dir: root, hostname: "127.0.0.1" });
  await nextApplication.prepare();
  const handler = nextApplication.getRequestHandler();
  httpServer = http.createServer((request, response) =>
    handler(request, response),
  );
  await new Promise<void>((resolve, reject) => {
    httpServer?.once("error", reject);
    httpServer?.listen(0, "127.0.0.1", resolve);
  });
  const address = httpServer.address();
  if (!address || typeof address === "string")
    throw new Error("Could not allocate a desktop server port");
  applicationUrl = `http://127.0.0.1:${address.port}`;
  return applicationUrl;
}

async function openApplication(): Promise<void> {
  window ??= createWindow();
  const url = await startNextServer();
  await window.loadURL(url);
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
console.log(`[JobChecker] main started; packaged=${app.isPackaged}; lock=${hasSingleInstanceLock}`);
if (!hasSingleInstanceLock) app.quit();
else {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });
  app.whenReady().then(async () => {
    console.log("[JobChecker] Electron ready; loading runtime environment");
    loadRuntimeEnvironment();
    try {
      console.log("[JobChecker] Starting local application server");
      await openApplication();
      console.log(`[JobChecker] Application ready at ${applicationUrl}`);
    } catch (error) {
      console.error(
        "[JobChecker] Startup failed:",
        error instanceof Error ? error.message : "Unknown startup error",
      );
      await dialog.showMessageBox({
        type: "error",
        title: "JobChecker could not start",
        message:
          error instanceof Error ? error.message : "Unknown startup error",
      });
      app.quit();
    }
  });
  app.on("activate", () => {
    if (!window) void openApplication();
  });
  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", () => {
    httpServer?.close();
    void nextApplication?.close();
  });
}
