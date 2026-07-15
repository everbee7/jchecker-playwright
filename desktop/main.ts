import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import dotenv from "dotenv";
import { promises as fs } from "node:fs";
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
  const candidates = [
    path.join(portableDirectory(), "JobChecker.env"),
    path.join(portableDirectory(), ".env"),
    path.join(app.getPath("userData"), "jobchecker.env"),
    path.join(applicationRoot(), ".env"),
  ];
  for (const candidate of candidates)
    dotenv.config({ path: candidate, quiet: true });
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
  const preload = path.join(applicationRoot(), "desktop-dist", "preload.js");
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
      preload,
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
  if (!process.env.MONGODB_URI) {
    await window.loadFile(
      path.join(applicationRoot(), "desktop", "config.html"),
    );
    return;
  }
  const url = await startNextServer();
  await window.loadURL(url);
}

ipcMain.handle("save-mongo-uri", async (_event, value: unknown) => {
  try {
    if (
      typeof value !== "string" ||
      value.includes("\n") ||
      value.includes("\r")
    ) {
      throw new Error("Enter a valid MongoDB connection string.");
    }
    const uri = value.trim();
    if (!/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
      throw new Error(
        "The connection must begin with mongodb:// or mongodb+srv://.",
      );
    }
    const configuration = `MONGODB_URI=${JSON.stringify(uri)}\nMONGODB_DB_NAME=jobchecker\n`;
    await fs.writeFile(
      path.join(app.getPath("userData"), "jobchecker.env"),
      configuration,
      {
        encoding: "utf8",
        mode: 0o600,
      },
    );
    process.env.MONGODB_URI = uri;
    process.env.MONGODB_DB_NAME = "jobchecker";
    const url = await startNextServer();
    await window?.loadURL(url);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not save configuration.",
    };
  }
});

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });
  app.whenReady().then(async () => {
    loadRuntimeEnvironment();
    try {
      await openApplication();
    } catch (error) {
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
