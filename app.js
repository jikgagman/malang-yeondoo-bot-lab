const users = {
  malang: {
    label: "말랑말랑바우게#KR1",
    lane: "원딜",
    recommendRole: "adc",
    partner: "연두색연두#KR1",
  },
  yeondoo: {
    label: "연두색연두#KR1",
    lane: "서폿",
    recommendRole: "support",
    partner: "말랑말랑바우게#KR1",
  },
};

if (window.location.protocol === "file:") {
  window.location.replace(`http://localhost:4173/${window.location.search}${window.location.hash}`);
}

const API_BASE = window.location.protocol === "file:" ? "http://localhost:4173" : "";
const apiUrl = (path) => `${API_BASE}${path}`;

const championIdMap = {
  1: "애니",
  12: "알리스타",
  21: "미스 포츈",
  22: "애쉬",
  25: "모르가나",
  37: "소나",
  40: "잔나",
  51: "케이틀린",
  53: "블리츠크랭크",
  67: "베인",
  81: "이즈리얼",
  89: "레오나",
  99: "럭스",
  117: "룰루",
  119: "드레이븐",
  143: "자이라",
  145: "카이사",
  147: "세라핀",
  201: "브라움",
  202: "진",
  221: "제리",
  222: "징크스",
  235: "세나",
  236: "루시안",
  350: "유미",
  360: "사미라",
  412: "쓰레쉬",
  429: "칼리스타",
  497: "라칸",
  498: "자야",
  518: "니코",
  526: "렐",
  555: "파이크",
  902: "밀리오",
};

const champions = [
  {
    name: "징크스",
    role: "adc",
    tags: ["후반", "한타", "포킹대응"],
    mastery: 92,
    synergy: { 룰루: 96, 밀리오: 92, 세라핀: 84, 노틸러스: 78, 라칸: 82 },
    strongInto: ["카이사", "자야", "브라움"],
    weakInto: ["드레이븐", "블리츠크랭크"],
    build: ["크라켄 학살자", "루난의 허리케인", "무한의 대검"],
    runes: ["정밀", "영감"],
    note: "연두가 보호형 서폿을 잡으면 후반 캐리 기대값이 가장 높아요.",
  },
  {
    name: "카이사",
    role: "adc",
    tags: ["돌진", "암살", "교전"],
    mastery: 86,
    synergy: { 노틸러스: 94, 라칸: 91, 렐: 88, 룰루: 76, 세라핀: 80 },
    strongInto: ["이즈리얼", "애쉬", "진"],
    weakInto: ["케이틀린", "바루스"],
    build: ["스태틱의 단검", "구인수의 격노검", "내셔의 이빨"],
    runes: ["정밀", "지배"],
    note: "상대가 물몸 조합이면 서폿 CC 한 번에 킬각을 만들기 좋아요.",
  },
  {
    name: "자야",
    role: "adc",
    tags: ["생존", "역이니시", "한타"],
    mastery: 81,
    synergy: { 라칸: 98, 렐: 84, 룰루: 80, 밀리오: 77, 세라핀: 79 },
    strongInto: ["카이사", "사미라", "노틸러스"],
    weakInto: ["케이틀린", "애쉬"],
    build: ["정수 약탈자", "나보리 명멸검", "필멸자의 운명"],
    runes: ["정밀", "영감"],
    note: "상대가 들어오는 조합일수록 궁과 깃부르미로 받아치기 좋아요.",
  },
  {
    name: "애쉬",
    role: "adc",
    tags: ["유틸", "시야", "라인전"],
    mastery: 79,
    synergy: { 밀리오: 88, 룰루: 83, 브라움: 86, 라칸: 76, 세라핀: 86 },
    strongInto: ["진", "제리", "라칸"],
    weakInto: ["사미라", "노틸러스"],
    build: ["삼위일체", "루난의 허리케인", "도미닉 경의 인사"],
    runes: ["정밀", "영감"],
    note: "상대 정글 위치를 밝히고 긴 사거리 궁으로 교전을 열 수 있어요.",
  },
  {
    name: "세라핀",
    role: "support",
    tags: ["포킹", "한타", "유틸"],
    mastery: 88,
    synergy: { 애쉬: 86, 징크스: 84, 자야: 79, 카이사: 80 },
    strongInto: ["브라움", "잔나", "소나"],
    weakInto: ["블리츠크랭크", "노틸러스"],
    build: ["월석 재생기", "흐르는 물의 지팡이", "구원"],
    runes: ["마법", "영감"],
    note: "라인을 밀면서 한타 궁극기 각을 만들기 좋아서 안정적인 듀오 운영에 맞아요.",
  },
  {
    name: "룰루",
    role: "support",
    tags: ["보호", "후반", "안정"],
    mastery: 91,
    synergy: { 징크스: 96, 코그모: 94, 애쉬: 83, 카이사: 76 },
    strongInto: ["라칸", "렐", "사미라"],
    weakInto: ["블리츠크랭크", "파이크"],
    build: ["월석 재생기", "불타는 향로", "미카엘의 축복"],
    runes: ["마법", "영감"],
    note: "말랑이 하이퍼캐리를 잡았을 때 생존과 딜 상승을 동시에 챙겨요.",
  },
  {
    name: "노틸러스",
    role: "support",
    tags: ["이니시", "CC", "킬각"],
    mastery: 84,
    synergy: { 카이사: 94, 사미라: 89, 징크스: 78, 자야: 75 },
    strongInto: ["유미", "소나", "이즈리얼"],
    weakInto: ["잔나", "모르가나"],
    build: ["솔라리의 펜던트", "기사의 맹세", "지크의 융합"],
    runes: ["결의", "영감"],
    note: "라인전 킬각이 필요할 때 가장 직관적이고, 카이사와 폭발력이 좋아요.",
  },
  {
    name: "라칸",
    role: "support",
    tags: ["이니시", "기동성", "역이니시"],
    mastery: 87,
    synergy: { 자야: 98, 카이사: 91, 징크스: 82, 애쉬: 76 },
    strongInto: ["애쉬", "바루스", "제리"],
    weakInto: ["쓰레쉬", "뽀삐"],
    build: ["슈렐리아의 군가", "제국의 명령", "구원"],
    runes: ["결의", "지배"],
    note: "한타 진입과 탈출이 부드러워서 둘이 같이 콜 맞추기 좋아요.",
  },
  {
    name: "밀리오",
    role: "support",
    tags: ["보호", "사거리", "정화"],
    mastery: 82,
    synergy: { 징크스: 92, 애쉬: 88, 코그모: 90, 자야: 77 },
    strongInto: ["애쉬", "세라핀", "렐"],
    weakInto: ["노틸러스", "블리츠크랭크"],
    build: ["꿈 생성기", "불타는 향로", "흐르는 물의 지팡이"],
    runes: ["마법", "결의"],
    note: "상대 CC가 많을 때 궁극기로 한 번 버티고 긴 사거리 싸움을 만들어요.",
  },
];

const fallbackDuoStats = [
  ["동기화 상태", "대기", "Riot API와 서버 DB를 확인 중"],
  ["저장된 게임", "-", "실제 듀오 게임만 표시"],
  ["최근 5게임 흐름", "-", "동기화 후 표시"],
  ["최근 오류", "-", "동기화 후 사라짐"],
];

const championVisuals = {
  직스: { label: "ZIGGS - BOMB LANE", className: "ziggs-card" },
  세라핀: { label: "SERAPHINE - STAR SONG", className: "sera-card" },
  애쉬: { label: "ASHE - FROST ARROW", className: "ashe-card" },
  징크스: { label: "JINX - DUO CARRY", className: "jinx-card" },
  레오나: { label: "LEONA - SUN GUARD", className: "leona-card" },
  룰루: { label: "LULU - PIX GUARD", className: "lulu-card" },
  "미스 포츈": { label: "MISS FORTUNE - DOUBLE UP", className: "mf-card" },
};

const state = {
  user: null,
  allyPicks: new Set(),
  enemyPicks: new Set(),
  phase: "None",
  localPlayerChampion: "",
  sessionId: `manual-${new Date().toISOString().slice(0, 10)}`,
};

const $ = (selector) => document.querySelector(selector);

function initUser() {
  const params = new URLSearchParams(window.location.search);
  const urlUser = params.get("user");
  const savedUser = localStorage.getItem("duo-user");
  const nextUser = users[urlUser] ? urlUser : savedUser;
  if (users[nextUser]) setUser(nextUser);
  if (!users[urlUser] && !savedUser) detectCurrentUser();
}

function setUser(userKey) {
  state.user = userKey;
  localStorage.setItem("duo-user", userKey);
  $("#identityGate").classList.add("is-hidden");
  $("#activeUserLabel").textContent = `${users[userKey].label} · ${users[userKey].lane} 기준`;
  renderRecommendations();
}

function resolveChampionName(value) {
  if (!value) return "";
  if (typeof value === "string" && Number.isNaN(Number(value))) return value;
  return championIdMap[Number(value)] || `챔피언 ${value}`;
}

function setLiveStatus(status, title, detail) {
  $("#liveBadge").className = `status-badge ${status}`;
  $("#liveBadge").textContent = status === "active" ? "픽창 감지" : status === "error" ? "연결 필요" : "대기";
  $("#liveStatusTitle").textContent = title;
  $("#liveStatusDetail").textContent = detail;
}

function updateLiveSession(payload) {
  const inChampionSelect = payload?.phase === "ChampSelect" && payload?.champSelect;
  state.phase = payload?.phase || "None";
  state.sessionId = payload?.champSelect
    ? `champselect-${JSON.stringify(payload.champSelect.myTeam || []).length}-${payload.updatedAt || Date.now()}`
    : `manual-${new Date().toISOString().slice(0, 10)}`;

  if (!inChampionSelect) {
    setLiveStatus(
      "idle",
      payload?.ok ? "LoL 클라이언트 대기 중" : "픽창 신호 대기 중",
      payload?.ok ? `현재 상태: ${state.phase}` : "아직 픽창 신호가 없어요. 실제 게임에서 픽창에 들어가면 자동 분석 화면으로 전환됩니다.",
    );
    $("#livePanel").classList.add("is-sleeping");
    $("#phaseLabel").textContent = state.phase;
    return;
  }

  const session = payload.champSelect;
  const localCellId = session.localPlayerCellId;
  const myTeam = Array.isArray(session.myTeam) ? session.myTeam : [];
  const theirTeam = Array.isArray(session.theirTeam) ? session.theirTeam : [];
  const localPlayer = myTeam.find((member) => member.cellId === localCellId);
  const completedActions = (session.actions || [])
    .flat()
    .filter((action) => action && action.completed && action.championId);

  state.allyPicks = new Set(myTeam.map((member) => resolveChampionName(member.championId)).filter(Boolean));
  state.enemyPicks = new Set(theirTeam.map((member) => resolveChampionName(member.championId)).filter(Boolean));
  state.localPlayerChampion = resolveChampionName(localPlayer?.championId);

  completedActions.forEach((action) => {
    const name = resolveChampionName(action.championId);
    if (!name) return;
    const isAlly = myTeam.some((member) => member.cellId === action.actorCellId);
    const targetSet = isAlly ? state.allyPicks : state.enemyPicks;
    targetSet.add(name);
  });

  setLiveStatus("active", "픽창을 감지했어요", "현재 팀/상대 픽을 자동으로 읽어서 추천을 갱신 중입니다.");
  $("#livePanel").classList.remove("is-sleeping");
  $("#phaseLabel").textContent = "Champion Select";
  $("#recommendContext").textContent = `${users[state.user || "malang"].lane} 기준 자동 추천`;
  renderPickLists();
  renderRecommendations();
  renderAutoBuild();
}

function renderPickLists() {
  const render = (target, collection, emptyText) => {
    const picks = [...collection];
    target.innerHTML = picks.length
      ? picks.map((pick) => `<span class="pick-pill">${pick}</span>`).join("")
      : `<span class="pick-empty">${emptyText}</span>`;
  };
  render($("#allyPicks"), state.allyPicks, "아직 감지된 우리 픽이 없어요");
  render($("#enemyPicks"), state.enemyPicks, "아직 감지된 상대 픽이 없어요");
}

function scoreChampion(champion, role) {
  const allies = [...state.allyPicks];
  const enemies = [...state.enemyPicks];
  let score = champion.mastery * 0.42;
  let reason = champion.note;

  allies.forEach((ally) => {
    if (champion.synergy[ally]) score += champion.synergy[ally] * 0.34;
  });

  enemies.forEach((enemy) => {
    if (champion.strongInto.includes(enemy)) score += 12;
    if (champion.weakInto.includes(enemy)) score -= 15;
  });

  if (role === "adc" && allies.some((ally) => ["룰루", "밀리오", "세라핀"].includes(ally)) && champion.tags.includes("후반")) {
    score += 9;
    reason = "보호형/유틸 서폿과 붙으면 후반 캐리 지표가 안정적으로 올라가요.";
  }

  if (role === "support" && allies.some((ally) => ["카이사", "자야", "징크스"].includes(ally)) && champion.tags.includes("이니시")) {
    score += 10;
    reason = "원딜의 딜 타이밍에 맞춰 첫 CC 이후 킬각을 만들기 좋아요.";
  }

  return {
    ...champion,
    score: Math.max(0, Math.min(99, Math.round(score))),
    reason,
  };
}

function renderRecommendations() {
  const role = users[state.user || "malang"].recommendRole;
  const picks = champions
    .filter((champion) => champion.role === role && !state.allyPicks.has(champion.name) && !state.enemyPicks.has(champion.name))
    .map((champion) => scoreChampion(champion, role))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  $("#recommendations").innerHTML = picks
    .map((pick, index) => {
      const best = index === 0 ? " best" : "";
      return `
        <article class="recommend-card${best}">
          <div class="score-ring">${pick.score}</div>
          <h3>${index + 1}. ${pick.name}</h3>
          <p>${pick.reason}</p>
          <div class="meta-row">
            <span class="role-chip">숙련도 ${pick.mastery}</span>
            ${pick.tags.map((tag) => `<span class="role-chip">${tag}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAutoBuild() {
  const champion = champions.find((item) => item.name === state.localPlayerChampion);
  if (!champion) {
    $("#buildCard").innerHTML = `<p>내 챔피언이 아직 확정되지 않았거나, 현재 샘플 빌드 목록에 없는 챔피언이에요.</p>`;
    return;
  }

  $("#autoBuildHint").textContent = `${champion.name} 픽 기준 추천 빌드`;
  $("#buildCard").innerHTML = `
    <div class="item-track">
      ${champion.build
        .map(
          (item, index) => `
            <div class="item">
              <b>${index + 1}</b>
              <strong>${item}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
    <div class="rune-line">
      <span>주룬 ${champion.runes[0]}</span>
      <span>부룬 ${champion.runes[1]}</span>
    </div>
    <p>${champion.note}</p>
  `;
}

function renderStats() {
  renderStatCards(fallbackDuoStats);
  renderRecentMatches([]);
  renderDuoInsights([]);
  renderTiltStats(null);
}

async function detectCurrentUser() {
  try {
    const response = await fetch(apiUrl("/api/current-user"), { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    if (users[payload.user]) setUser(payload.user);
  } catch (error) {
    console.warn("Current LoL user detection skipped:", error.message);
  }
}

function renderStatCards(cards) {
  $("#statsGrid").innerHTML = cards
    .map(
      ([label, value, hint]) => `
        <article class="stat-card">
          <small>${label}</small>
          <strong>${value}</strong>
          <small>${hint}</small>
        </article>
      `,
    )
    .join("");
}

async function loadRiotStats() {
  try {
    const response = await fetch(apiUrl("/api/stats"), { cache: "no-store" });
    if (!response.ok) throw new Error("stats unavailable");
    const payload = await response.json();
    if (Array.isArray(payload.cards)) {
      renderStatCards(payload.cards);
    }
    if (Array.isArray(payload.matches)) {
      renderRecentMatches(payload.matches);
    }
    if (Array.isArray(payload.insights)) {
      renderDuoInsights(payload.insights);
    }
    if (payload.bestPair) {
      updateHeroDuo(payload.bestPair);
    }
    renderTiltStats(payload.tilt);
  } catch (error) {
    console.warn("Using fallback duo stats:", error.message);
  }
}

function renderTiltStats(tilt) {
  const fallback = {
    averagePerGame: 0,
    players: [
      { key: "malang", name: "말랑", count: 0, gauge: 0, snacksOwed: 0 },
      { key: "yeondoo", name: "연두", count: 0, gauge: 0, snacksOwed: 0 },
    ],
  };
  const data = tilt || fallback;
  $("#tiltAverage").textContent = `게임당 평균 ${Number(data.averagePerGame || 0).toFixed(2)}회`;
  $("#tiltGauges").innerHTML = data.players
    .map((player) => {
      const gauge = Math.min(20, Number(player.gauge || 0));
      const percent = Math.round((gauge / 20) * 100);
      const snackText = player.snacksOwed ? `간식 ${player.snacksOwed}번 확정` : `간식까지 ${20 - gauge}회`;
      return `
        <article class="tilt-gauge-card ${player.key}">
          <div class="tilt-gauge-top">
            <strong>${player.name}</strong>
            <span>${player.count}회</span>
          </div>
          <div class="tilt-track" aria-label="${player.name} 짜증 게이지 ${gauge}/20">
            <span style="width: ${percent}%"></span>
            <b>🍪</b>
          </div>
          <small>${gauge}/20 · ${snackText}</small>
        </article>
      `;
    })
    .join("");
}

function renderDuoInsights(insights) {
  const cards = insights.length
    ? insights
    : [
        ["동기화 상태", "대기", "Riot API와 서버 DB를 확인 중"],
        ["저장된 게임", "-", "실제 듀오 게임만 표시"],
      ];
  $("#ideaList").innerHTML = cards
    .map(
      ([title, value, hint]) => `
        <article class="idea">
          <small>${title}</small>
          <strong>${value}</strong>
          <span>${hint}</span>
        </article>
      `,
    )
    .join("");
}

function updateHeroDuo(pair) {
  const [carry, support] = pair.split("+");
  const carryVisual = championVisuals[carry] || { label: `${carry.toUpperCase()} - DUO CARRY`, className: "jinx-card" };
  const supportVisual = championVisuals[support] || { label: `${support.toUpperCase()} - DUO SUPPORT`, className: "sera-card" };
  $("#carryCard").className = `toon-card ${carryVisual.className}`;
  $("#supportCard").className = `toon-card ${supportVisual.className}`;
  $("#carryCardLabel").textContent = carryVisual.label;
  $("#supportCardLabel").textContent = supportVisual.label;
  $("#championArt").setAttribute("aria-label", `현재 최고 듀오 조합 ${pair}`);
}

function renderRecentMatches(matches) {
  const target = $("#recentMatches");
  const latest = matches.slice(0, 6);
  target.innerHTML = latest.length
    ? latest
        .map((match) => {
          const result = match.win ? "승" : "패";
          const resultClass = match.win ? "win" : "loss";
          const date = match.gameEndTimestamp ? new Date(match.gameEndTimestamp).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) : "";
          return `
            <article class="match-row">
              <span class="match-result ${resultClass}">${result}</span>
              <strong>${match.pair}</strong>
              <small>${match.duoKda.kills}/${match.duoKda.deaths}/${match.duoKda.assists}</small>
              <small>KP ${match.duoKillParticipation}%</small>
              <small>${date}</small>
            </article>
          `;
        })
        .join("")
    : `<p class="match-empty">Riot API 동기화가 끝나면 최근 듀오 게임이 표시돼요.</p>`;
}

async function pollLiveClient() {
  try {
    const params = new URLSearchParams(window.location.search);
    const mock = params.get("mock");
    const endpoint = mock ? `/api/live?mock=${encodeURIComponent(mock)}` : "/api/live";
    const response = await fetch(apiUrl(endpoint), { cache: "no-store" });
    if (!response.ok) throw new Error("proxy unavailable");
    const payload = await response.json();
    updateLiveSession(payload);
  } catch (error) {
    updateLiveSession({
      ok: false,
      phase: "Waiting",
      error: error.message,
    });
  }
}

function bindEvents() {
  document.querySelectorAll("[data-login]").forEach((button) => {
    button.addEventListener("click", () => setUser(button.dataset.login));
  });

  $("#switchUser").addEventListener("click", () => {
    localStorage.removeItem("duo-user");
    $("#identityGate").classList.remove("is-hidden");
  });

}

bindEvents();
initUser();
renderStats();
loadRiotStats();
renderPickLists();
renderRecommendations();
renderAutoBuild();
pollLiveClient();
setInterval(pollLiveClient, 2500);
