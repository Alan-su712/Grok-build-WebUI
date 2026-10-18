#!/usr/bin/env node

const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const override = (process.env.GROK_BUILD_PYTHON || "").trim();
const candidates = override
  ? [[override, []]]
  : process.platform === "win32"
    ? [["py", ["-3"]], ["python", []]]
    : [["python3", []], ["python", []]];

function findPython() {
  for (const [command, prefix] of candidates) {
    const result = spawnSync(command, [...prefix, "--version"], {
      encoding: "utf8",
      windowsHide: true,
    });
    if (result.error || result.status !== 0) continue;
    const version = `${result.stdout || ""} ${result.stderr || ""}`.match(/Python\s+(\d+)\.(\d+)/i);
    if (!version || Number(version[1]) < 3 || (Number(version[1]) === 3 && Number(version[2]) < 10)) continue;
    return { command, prefix };
  }
  return null;
}

const python = findPython();
if (!python) {
  console.error("找不到 Python 3.10 或更新版本。请安装 Python，或设置 GROK_BUILD_PYTHON 指向 python.exe。");
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const server = path.join(root, "server.py");
const stateDir = process.env.GROK_WEBUI_STATE_DIR || path.join(os.homedir(), ".grok", "webui");
const child = spawn(
  python.command,
  [...python.prefix, "-u", server, "--host", "127.0.0.1", "--port", "3088", ...process.argv.slice(2)],
  {
    cwd: root,
    env: {
      ...process.env,
      GROK_WEBUI_STATE_DIR: stateDir,
      PYTHONUTF8: process.env.PYTHONUTF8 || "1",
      PYTHONIOENCODING: process.env.PYTHONIOENCODING || "utf-8",
    },
    stdio: "inherit",
    windowsHide: false,
  },
);

child.on("error", () => {
  console.error("无法启动本地服务。请确认 Python 3.10 或更新版本可正常运行。");
  process.exitCode = 1;
});

child.on("exit", (code) => {
  process.exitCode = code === null ? 1 : code;
});
