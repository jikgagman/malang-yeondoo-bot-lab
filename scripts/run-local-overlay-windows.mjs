import { spawn } from "node:child_process";

const children = [];

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      ...options.env,
    },
  });
  children.push(child);
  return child;
}

const server = run(process.execPath, ["lcu-proxy.js"]);
const launcher = run("powershell", ["-ExecutionPolicy", "Bypass", "-File", "scripts\\TiltOverlayLauncher.ps1"], {
  env: {
    TILT_API_URL: process.env.TILT_API_URL || "https://malang-yeondoo-bot-lab.onrender.com/api/tilt",
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
