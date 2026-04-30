const API_BASE = window.location.protocol === "file:" ? "http://localhost:4173" : "";
const SESSION_KEY = "duo-tilt-overlay-session";
const $ = (selector) => document.querySelector(selector);

function makeSessionId() {
  return `game-${Date.now()}`;
}

function getSessionId() {
  const params = new URLSearchParams(window.location.search);
  const urlSession = params.get("sessionId");
  if (urlSession) {
    localStorage.setItem(SESSION_KEY, urlSession);
    return urlSession;
  }

  const saved = localStorage.getItem(SESSION_KEY);
  if (saved) return saved;

  const next = makeSessionId();
  localStorage.setItem(SESSION_KEY, next);
  return next;
}

let sessionId = getSessionId();

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function renderSession(session) {
  const players = session?.players || [];
  const malang = players.find((player) => player.key === "malang")?.count || 0;
  const yeondoo = players.find((player) => player.key === "yeondoo")?.count || 0;
  $("#malangCount").textContent = malang;
  $("#yeondooCount").textContent = yeondoo;
}

async function loadCounts() {
  try {
    const response = await fetch(apiUrl(`/api/tilt?sessionId=${encodeURIComponent(sessionId)}`), { cache: "no-store" });
    if (!response.ok) throw new Error("tilt unavailable");
    const payload = await response.json();
    renderSession(payload.session);
  } catch (error) {
    console.warn("Tilt overlay load failed:", error.message);
  }
}

async function addCount(player) {
  try {
    const response = await fetch(apiUrl("/api/tilt"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player,
        phase: "game-overlay",
        sessionId,
      }),
    });
    if (!response.ok) throw new Error("tilt unavailable");
    const payload = await response.json();
    renderSession(payload.session);
  } catch (error) {
    console.warn("Tilt overlay save failed:", error.message);
  }
}

function startNewSession() {
  sessionId = makeSessionId();
  localStorage.setItem(SESSION_KEY, sessionId);
  renderSession({ players: [] });
}

document.querySelectorAll("[data-player]").forEach((button) => {
  button.addEventListener("click", () => addCount(button.dataset.player));
});

$("#newSession").addEventListener("click", startNewSession);
loadCounts();
