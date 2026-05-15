const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("node:path");

process.env.REMOTE_API_BASE = process.env.REMOTE_API_BASE || "https://malang-yeondoo-bot-lab.onrender.com";

const { startServer } = require("../lcu-proxy");

let localPort = 4173;
let localServer = null;
let mainWindow = null;
let overlayWindow = null;
let overlaySessionId = "";
let lastPhase = "";

function localUrl(route = "/") {
  return `http://127.0.0.1:${localPort}${route}`;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: "BotLane Analytics",
    icon: path.join(__dirname, "..", "assets", "site-icon.png"),
    backgroundColor: "#fffaf0",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(localUrl("/"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: 214,
    height: 104,
    x: 14,
    y: 14,
    frame: false,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    title: "짜증 카운트",
    backgroundColor: "#00000000",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.hide();
}

function newOverlaySession() {
  overlaySessionId = `game-${Date.now()}`;
  return overlaySessionId;
}

function showOverlay() {
  if (!overlayWindow || overlayWindow.isDestroyed()) createOverlayWindow();
  if (!overlaySessionId) newOverlaySession();
  overlayWindow.loadURL(localUrl(`/overlay.html?sessionId=${encodeURIComponent(overlaySessionId)}`));
  overlayWindow.setPosition(14, 14);
  overlayWindow.showInactive();
  overlayWindow.setAlwaysOnTop(true, "screen-saver");
}

function hideOverlay() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.hide();
  }
}

async function readLivePhase() {
  const response = await fetch(localUrl("/api/live"), { cache: "no-store" });
  if (!response.ok) return "Disconnected";
  const payload = await response.json();
  return payload.phase || "Disconnected";
}

function startOverlayWatcher() {
  setInterval(async () => {
    try {
      const phase = await readLivePhase();
      if (phase !== lastPhase) {
        if (phase === "InProgress") {
          newOverlaySession();
          showOverlay();
        }
        if (lastPhase === "InProgress" && phase !== "InProgress") {
          hideOverlay();
          overlaySessionId = "";
        }
        lastPhase = phase;
      }
      if (phase === "InProgress") showOverlay();
    } catch {
      if (lastPhase === "InProgress") hideOverlay();
      lastPhase = "Disconnected";
    }
  }, 2000);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  localServer = startServer(0, (port) => {
    localPort = port;
    createMainWindow();
    createOverlayWindow();
    startOverlayWatcher();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.on("before-quit", () => {
  if (localServer) localServer.close();
});
