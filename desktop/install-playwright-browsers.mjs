import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const browserPath = path.join(projectRoot, "desktop-browsers");
const playwrightCli = path.join(path.dirname(require.resolve("playwright")), "cli.js");

const child = spawn(
  process.execPath,
  [playwrightCli, "install", "--only-shell", "chromium"],
  {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browserPath },
  },
);

child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
