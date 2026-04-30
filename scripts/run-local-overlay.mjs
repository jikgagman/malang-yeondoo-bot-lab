import { spawn } from "node:child_process";

const children = [];

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...options.env,
    },
  });
  children.push(child);
  return child;
}

const server = run(process.execPath, ["lcu-proxy.js"]);
const launcher = run("swift", ["scripts/TiltOverlayLauncher.swift"], {
  env: {
    OVERLAY_URL: process.env.OVERLAY_URL || "https://malang-yeondoo-bot-lab.onrender.com/overlay.html",
  },
});

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

server.on("exit", (code) => shutdown(code ?? 0));
launcher.on("exit", (code) => shutdown(code ?? 0));

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
