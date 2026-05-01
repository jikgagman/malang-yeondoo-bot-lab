const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const https = require("node:https");
const os = require("node:os");
const { execFileSync } = require("node:child_process");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const CACHE_FILE = path.join(DATA_DIR, "duo-stats-cache.json");
const CHAMPION_TIER_CACHE_FILE = path.join(DATA_DIR, "champion-tiers-cache.json");
const DB_FILE = path.join(DATA_DIR, "duo.sqlite");
const SEED_FILE = path.join(ROOT, "seed", "duo-matches.json");
const RIOT_REGION = process.env.RIOT_REGION || "asia";
const RIOT_PLATFORM = process.env.RIOT_PLATFORM || "kr";
const STATS_WINDOW = 20;
const MATCH_SCAN_COUNT = 80;
const DUO_PLAYERS = [
  { key: "malang", gameName: "말랑말랑바우게", tagLine: "KR1" },
  { key: "yeondoo", gameName: "연두색연두", tagLine: "KR1" },
];
const TIER_SCORE = {
  IRON: 0,
  BRONZE: 400,
  SILVER: 800,
  GOLD: 1200,
  PLATINUM: 1600,
  EMERALD: 2000,
  DIAMOND: 2400,
  MASTER: 2800,
  GRANDMASTER: 3200,
  CHALLENGER: 3600,
};
const DIVISION_SCORE = { IV: 0, III: 100, II: 200, I: 300 };
const POSITION_COMPARISON_GROUPS = [
  { key: "bottomSupport", label: "원딜+서폿", carry: "BOTTOM" },
  { key: "middleSupport", label: "미드+서폿", carry: "MIDDLE" },
  { key: "topSupport", label: "탑+서폿", carry: "TOP" },
  { key: "jungleSupport", label: "정글+서폿", carry: "JUNGLE" },
];

loadEnvFile();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const championIdMap = {
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
  526: "렐",
  555: "파이크",
  902: "밀리오",
};

const championNameMap = {
  Alistar: "알리스타",
  Aphelios: "아펠리오스",
  Ashe: "애쉬",
  "Aurelion Sol": "아우렐리온 솔",
  AurelionSol: "아우렐리온 솔",
  Bard: "바드",
  Blitzcrank: "블리츠크랭크",
  Brand: "브랜드",
  Braum: "브라움",
  Caitlyn: "케이틀린",
  Corki: "코르키",
  Draven: "드레이븐",
  Ezreal: "이즈리얼",
  Janna: "잔나",
  Jhin: "진",
  Jinx: "징크스",
  Kalista: "칼리스타",
  Karma: "카르마",
  Karthus: "카서스",
  Katarina: "카타리나",
  Kaisa: "카이사",
  "Kai'Sa": "카이사",
  KogMaw: "코그모",
  "Kog'Maw": "코그모",
  LeeSin: "리 신",
  Leona: "레오나",
  Lux: "럭스",
  Lulu: "룰루",
  Malphite: "말파이트",
  Milio: "밀리오",
  MissFortune: "미스 포츈",
  "Miss Fortune": "미스 포츈",
  Morgana: "모르가나",
  Nautilus: "노틸러스",
  Nilah: "닐라",
  Nami: "나미",
  Poppy: "뽀삐",
  Pyke: "파이크",
  Rakan: "라칸",
  Rell: "렐",
  Samira: "사미라",
  Senna: "세나",
  Seraphine: "세라핀",
  Sivir: "시비르",
  Sion: "사이온",
  Smolder: "스몰더",
  Sona: "소나",
  Soraka: "소라카",
  Swain: "스웨인",
  Thresh: "쓰레쉬",
  Tristana: "트리스타나",
  Twitch: "트위치",
  Varus: "바루스",
  Vayne: "베인",
  Velkoz: "벨코즈",
  "Vel'Koz": "벨코즈",
  Vladimir: "블라디미르",
  Xerath: "제라스",
  Xayah: "자야",
  Yasuo: "야스오",
  Yone: "요네",
  Yuumi: "유미",
  Zac: "자크",
  Zeri: "제리",
  Ziggs: "직스",
  Zilean: "질리언",
  Syndra: "신드라",
  Zyra: "자이라",
};

const CHAMPION_TIERS = {
  low: {
    label: "브실골플",
    adc: [
      { champion: "미스 포츈", tier: 1, ps: 54.8, winRate: 52.4, pickRate: 10.6, banRate: 7.8, sample: 8420, delta: 3 },
      { champion: "징크스", tier: 1, ps: 54.1, winRate: 51.8, pickRate: 13.2, banRate: 9.1, sample: 10540, delta: 1 },
      { champion: "애쉬", tier: 1, ps: 53.7, winRate: 51.5, pickRate: 11.8, banRate: 6.4, sample: 9860, delta: 4 },
      { champion: "케이틀린", tier: 2, ps: 52.9, winRate: 50.7, pickRate: 14.4, banRate: 12.9, sample: 11220, delta: -1 },
      { champion: "진", tier: 2, ps: 52.5, winRate: 51.1, pickRate: 8.9, banRate: 3.2, sample: 7280, delta: 2 },
      { champion: "베인", tier: 2, ps: 51.8, winRate: 50.3, pickRate: 7.2, banRate: 8.4, sample: 6120, delta: 5 },
      { champion: "카이사", tier: 3, ps: 50.9, winRate: 49.8, pickRate: 15.1, banRate: 13.8, sample: 11900, delta: -2 },
      { champion: "자야", tier: 3, ps: 50.3, winRate: 50.1, pickRate: 5.1, banRate: 2.6, sample: 3880, delta: 0 },
    ],
    support: [
      { champion: "세라핀", tier: 1, ps: 55.1, winRate: 52.9, pickRate: 7.7, banRate: 4.3, sample: 6210, delta: 6 },
      { champion: "룰루", tier: 1, ps: 54.3, winRate: 51.7, pickRate: 10.4, banRate: 9.6, sample: 8440, delta: 2 },
      { champion: "노틸러스", tier: 1, ps: 53.8, winRate: 50.9, pickRate: 12.8, banRate: 15.5, sample: 9920, delta: -1 },
      { champion: "레오나", tier: 2, ps: 52.7, winRate: 51.2, pickRate: 8.1, banRate: 7.9, sample: 6900, delta: 4 },
      { champion: "밀리오", tier: 2, ps: 52.1, winRate: 51.6, pickRate: 5.6, banRate: 3.8, sample: 4740, delta: 1 },
      { champion: "블리츠크랭크", tier: 2, ps: 51.7, winRate: 50.4, pickRate: 11.2, banRate: 22.6, sample: 8700, delta: -3 },
      { champion: "라칸", tier: 3, ps: 50.8, winRate: 50.2, pickRate: 6.8, banRate: 4.9, sample: 5120, delta: 0 },
      { champion: "브라움", tier: 3, ps: 50.4, winRate: 50.6, pickRate: 3.1, banRate: 1.4, sample: 2380, delta: 3 },
    ],
  },
  emerald: {
    label: "에메+",
    adc: [
      { champion: "이즈리얼", tier: 1, ps: 54.6, winRate: 51.0, pickRate: 18.2, banRate: 11.4, sample: 7210, delta: 2 },
      { champion: "징크스", tier: 1, ps: 54.2, winRate: 51.4, pickRate: 12.6, banRate: 8.8, sample: 5050, delta: 1 },
      { champion: "루시안", tier: 1, ps: 53.4, winRate: 50.8, pickRate: 9.4, banRate: 9.9, sample: 3910, delta: 5 },
      { champion: "카이사", tier: 2, ps: 52.8, winRate: 50.1, pickRate: 16.7, banRate: 14.2, sample: 6590, delta: -1 },
      { champion: "케이틀린", tier: 2, ps: 52.2, winRate: 50.4, pickRate: 13.9, banRate: 12.1, sample: 5430, delta: -2 },
      { champion: "애쉬", tier: 2, ps: 51.6, winRate: 50.7, pickRate: 8.6, banRate: 5.8, sample: 3480, delta: 3 },
      { champion: "자야", tier: 3, ps: 50.9, winRate: 50.2, pickRate: 6.2, banRate: 3.7, sample: 2450, delta: 1 },
      { champion: "제리", tier: 3, ps: 50.1, winRate: 49.7, pickRate: 5.9, banRate: 6.1, sample: 2210, delta: -3 },
    ],
    support: [
      { champion: "라칸", tier: 1, ps: 54.9, winRate: 51.8, pickRate: 9.2, banRate: 6.4, sample: 3610, delta: 3 },
      { champion: "룰루", tier: 1, ps: 54.1, winRate: 51.2, pickRate: 10.8, banRate: 9.7, sample: 4300, delta: 0 },
      { champion: "렐", tier: 1, ps: 53.6, winRate: 51.4, pickRate: 6.4, banRate: 5.6, sample: 2560, delta: 4 },
      { champion: "노틸러스", tier: 2, ps: 52.5, winRate: 50.2, pickRate: 13.5, banRate: 16.2, sample: 5410, delta: -2 },
      { champion: "밀리오", tier: 2, ps: 52.0, winRate: 51.0, pickRate: 5.7, banRate: 3.2, sample: 2170, delta: 1 },
      { champion: "세라핀", tier: 2, ps: 51.7, winRate: 51.6, pickRate: 4.1, banRate: 2.5, sample: 1660, delta: 2 },
      { champion: "쓰레쉬", tier: 3, ps: 50.8, winRate: 49.9, pickRate: 12.1, banRate: 10.6, sample: 4750, delta: -1 },
      { champion: "브라움", tier: 3, ps: 50.5, winRate: 50.8, pickRate: 3.4, banRate: 1.7, sample: 1320, delta: 2 },
    ],
  },
  diamond: {
    label: "다이아",
    adc: [
      { champion: "이즈리얼", tier: 1, ps: 55.0, winRate: 51.3, pickRate: 19.4, banRate: 12.0, sample: 2880, delta: 1 },
      { champion: "루시안", tier: 1, ps: 54.3, winRate: 51.1, pickRate: 10.8, banRate: 11.7, sample: 1640, delta: 3 },
      { champion: "징크스", tier: 1, ps: 53.5, winRate: 50.8, pickRate: 11.1, banRate: 8.1, sample: 1800, delta: -1 },
      { champion: "카이사", tier: 2, ps: 52.9, winRate: 50.0, pickRate: 17.2, banRate: 14.8, sample: 2590, delta: 0 },
      { champion: "자야", tier: 2, ps: 52.0, winRate: 50.7, pickRate: 7.1, banRate: 4.2, sample: 980, delta: 2 },
      { champion: "케이틀린", tier: 2, ps: 51.4, winRate: 49.9, pickRate: 12.8, banRate: 11.4, sample: 1910, delta: -3 },
      { champion: "애쉬", tier: 3, ps: 50.9, winRate: 50.1, pickRate: 7.9, banRate: 5.0, sample: 1120, delta: 1 },
      { champion: "제리", tier: 3, ps: 50.2, winRate: 49.6, pickRate: 6.4, banRate: 6.8, sample: 860, delta: -1 },
    ],
    support: [
      { champion: "라칸", tier: 1, ps: 55.2, winRate: 52.0, pickRate: 10.1, banRate: 7.3, sample: 1490, delta: 2 },
      { champion: "렐", tier: 1, ps: 54.6, winRate: 51.9, pickRate: 7.6, banRate: 6.8, sample: 1080, delta: 4 },
      { champion: "룰루", tier: 1, ps: 53.8, winRate: 50.9, pickRate: 11.4, banRate: 10.2, sample: 1710, delta: -1 },
      { champion: "쓰레쉬", tier: 2, ps: 52.6, winRate: 50.3, pickRate: 13.2, banRate: 11.0, sample: 1980, delta: 1 },
      { champion: "노틸러스", tier: 2, ps: 52.0, winRate: 49.8, pickRate: 13.9, banRate: 16.8, sample: 2050, delta: -2 },
      { champion: "밀리오", tier: 2, ps: 51.5, winRate: 50.6, pickRate: 5.2, banRate: 3.1, sample: 720, delta: 0 },
      { champion: "브라움", tier: 3, ps: 50.9, winRate: 51.0, pickRate: 3.7, banRate: 1.9, sample: 520, delta: 3 },
      { champion: "세라핀", tier: 3, ps: 50.3, winRate: 50.7, pickRate: 3.1, banRate: 1.8, sample: 430, delta: -1 },
    ],
  },
  challenger: {
    label: "챌린저",
    adc: [
      { champion: "이즈리얼", tier: 1, ps: 55.7, winRate: 52.1, pickRate: 21.0, banRate: 13.4, sample: 390, delta: 1 },
      { champion: "루시안", tier: 1, ps: 54.8, winRate: 51.8, pickRate: 12.6, banRate: 15.2, sample: 234, delta: 2 },
      { champion: "카이사", tier: 1, ps: 53.9, winRate: 50.9, pickRate: 18.7, banRate: 16.5, sample: 344, delta: 0 },
      { champion: "자야", tier: 2, ps: 52.8, winRate: 51.4, pickRate: 8.2, banRate: 5.6, sample: 151, delta: 4 },
      { champion: "징크스", tier: 2, ps: 52.2, winRate: 50.6, pickRate: 10.4, banRate: 7.9, sample: 192, delta: -2 },
      { champion: "제리", tier: 2, ps: 51.6, winRate: 50.1, pickRate: 7.1, banRate: 8.2, sample: 118, delta: 3 },
      { champion: "케이틀린", tier: 3, ps: 50.8, winRate: 49.8, pickRate: 11.6, banRate: 12.8, sample: 210, delta: -1 },
      { champion: "칼리스타", tier: 3, ps: 50.1, winRate: 49.6, pickRate: 4.9, banRate: 7.0, sample: 88, delta: 2 },
    ],
    support: [
      { champion: "라칸", tier: 1, ps: 56.0, winRate: 52.8, pickRate: 11.9, banRate: 8.7, sample: 220, delta: 1 },
      { champion: "렐", tier: 1, ps: 55.1, winRate: 52.3, pickRate: 8.8, banRate: 7.6, sample: 164, delta: 3 },
      { champion: "쓰레쉬", tier: 1, ps: 54.2, winRate: 51.0, pickRate: 15.0, banRate: 12.2, sample: 278, delta: 2 },
      { champion: "룰루", tier: 2, ps: 52.9, winRate: 50.7, pickRate: 11.1, banRate: 10.8, sample: 206, delta: -1 },
      { champion: "노틸러스", tier: 2, ps: 52.0, winRate: 49.7, pickRate: 12.5, banRate: 15.9, sample: 232, delta: -3 },
      { champion: "밀리오", tier: 2, ps: 51.7, winRate: 50.9, pickRate: 5.9, banRate: 3.8, sample: 109, delta: 2 },
      { champion: "브라움", tier: 3, ps: 51.0, winRate: 51.2, pickRate: 4.1, banRate: 2.1, sample: 76, delta: 4 },
      { champion: "파이크", tier: 3, ps: 50.2, winRate: 49.5, pickRate: 5.2, banRate: 9.9, sample: 96, delta: -2 },
    ],
  },
};

const CHAMPION_TIER_GROUPS = {
  low: { label: "브실골플", sourceTier: "gold_plus" },
  emerald: { label: "에메+", sourceTier: "emerald_plus" },
  diamond: { label: "다이아", sourceTier: "diamond" },
  challenger: { label: "챌린저", sourceTier: "challenger" },
};

const LOLALYTICS_LANES = {
  adc: "bottom",
  support: "support",
};

const CHAMPION_TIER_CACHE_MS = 6 * 60 * 60 * 1000;
const CHAMPION_TIER_CACHE_VERSION = 3;

const ROLE_CHAMPIONS = {
  adc: new Set([
    "아펠리오스",
    "애쉬",
    "케이틀린",
    "코르키",
    "드레이븐",
    "이즈리얼",
    "진",
    "징크스",
    "카이사",
    "칼리스타",
    "코그모",
    "루시안",
    "미스 포츈",
    "닐라",
    "사미라",
    "세나",
    "시비르",
    "스몰더",
    "트리스타나",
    "트위치",
    "바루스",
    "베인",
    "자야",
    "제리",
  ]),
  support: new Set([
    "알리스타",
    "바드",
    "블리츠크랭크",
    "브라움",
    "잔나",
    "카르마",
    "레오나",
    "럭스",
    "룰루",
    "밀리오",
    "모르가나",
    "나미",
    "노틸러스",
    "뽀삐",
    "파이크",
    "라칸",
    "렐",
    "세나",
    "세라핀",
    "소나",
    "소라카",
    "스웨인",
    "쓰레쉬",
    "벨코즈",
    "유미",
    "자이라",
  ]),
};

function loadEnvFile() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const separator = trimmed.indexOf("=");
      if (separator === -1) return;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    });
}

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqliteExec(sql) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  execFileSync("sqlite3", ["-bail", "-cmd", ".timeout 5000", DB_FILE], {
    input: sql,
    encoding: "utf8",
  });
}

function sqliteJson(sql) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const output = execFileSync("sqlite3", ["-json", "-cmd", ".timeout 5000", DB_FILE, sql], {
    encoding: "utf8",
  }).trim();
  return output ? JSON.parse(output) : [];
}

function initDb() {
  sqliteExec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS players (
      player_key TEXT PRIMARY KEY,
      game_name TEXT NOT NULL,
      tag_line TEXT NOT NULL,
      puuid TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS matches (
      match_id TEXT PRIMARY KEY,
      game_end_timestamp INTEGER NOT NULL,
      queue_id INTEGER NOT NULL,
      win INTEGER NOT NULL,
      pair TEXT NOT NULL,
      malang_champion TEXT NOT NULL,
      yeondoo_champion TEXT NOT NULL,
      kills INTEGER NOT NULL,
      deaths INTEGER NOT NULL,
      assists INTEGER NOT NULL,
      kill_participation INTEGER NOT NULL,
      first_dragon INTEGER NOT NULL,
      game_duration INTEGER NOT NULL,
      raw_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tilt_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_key TEXT NOT NULL,
      session_id TEXT NOT NULL,
      phase TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      note TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rank_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_key TEXT NOT NULL,
      queue_type TEXT NOT NULL,
      tier TEXT NOT NULL,
      rank_division TEXT,
      league_points INTEGER NOT NULL,
      wins INTEGER NOT NULL,
      losses INTEGER NOT NULL,
      score INTEGER NOT NULL,
      captured_at INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function upsertPlayers(accounts) {
  const now = new Date().toISOString();
  const values = DUO_PLAYERS.map((player, index) => {
    const account = accounts[index];
    return `(${sqlValue(player.key)}, ${sqlValue(player.gameName)}, ${sqlValue(player.tagLine)}, ${sqlValue(account.puuid)}, ${sqlValue(now)})`;
  }).join(",\n");

  sqliteExec(`
    INSERT INTO players (player_key, game_name, tag_line, puuid, updated_at)
    VALUES ${values}
    ON CONFLICT(player_key) DO UPDATE SET
      game_name = excluded.game_name,
      tag_line = excluded.tag_line,
      puuid = excluded.puuid,
      updated_at = excluded.updated_at;
  `);
}

function upsertMatches(matches) {
  if (!matches.length) return;
  const now = new Date().toISOString();
  const values = matches
    .map(
      (match) => `(
        ${sqlValue(match.matchId)},
        ${sqlValue(match.gameEndTimestamp)},
        ${sqlValue(match.queueId)},
        ${sqlValue(match.win)},
        ${sqlValue(match.pair)},
        ${sqlValue(match.malangChampion)},
        ${sqlValue(match.yeondooChampion)},
        ${sqlValue(match.duoKda.kills)},
        ${sqlValue(match.duoKda.deaths)},
        ${sqlValue(match.duoKda.assists)},
        ${sqlValue(match.duoKillParticipation)},
        ${sqlValue(match.firstDragon)},
        ${sqlValue(match.gameDuration)},
        ${sqlValue(JSON.stringify(match))},
        ${sqlValue(now)}
      )`,
    )
    .join(",\n");

  sqliteExec(`
    INSERT INTO matches (
      match_id, game_end_timestamp, queue_id, win, pair, malang_champion, yeondoo_champion,
      kills, deaths, assists, kill_participation, first_dragon, game_duration, raw_json, updated_at
    )
    VALUES ${values}
    ON CONFLICT(match_id) DO UPDATE SET
      game_end_timestamp = excluded.game_end_timestamp,
      queue_id = excluded.queue_id,
      win = excluded.win,
      pair = excluded.pair,
      malang_champion = excluded.malang_champion,
      yeondoo_champion = excluded.yeondoo_champion,
      kills = excluded.kills,
      deaths = excluded.deaths,
      assists = excluded.assists,
      kill_participation = excluded.kill_participation,
      first_dragon = excluded.first_dragon,
      game_duration = excluded.game_duration,
      raw_json = excluded.raw_json,
      updated_at = excluded.updated_at;
  `);
}

function rankScore(entry) {
  if (!entry?.tier) return 0;
  return (TIER_SCORE[entry.tier] || 0) + (DIVISION_SCORE[entry.rank] || 0) + Number(entry.leaguePoints || 0);
}

function normalizeRankEntry(player, entries) {
  const ranked = entries.find((entry) => entry.queueType === "RANKED_SOLO_5x5") || entries.find((entry) => entry.queueType === "RANKED_FLEX_SR");
  if (!ranked) {
    return {
      key: player.key,
      name: player.key === "malang" ? "말랑" : "연두",
      queueType: "UNRANKED",
      tier: "UNRANKED",
      rank: "",
      leaguePoints: 0,
      wins: 0,
      losses: 0,
      score: 0,
    };
  }

  return {
    key: player.key,
    name: player.key === "malang" ? "말랑" : "연두",
    queueType: ranked.queueType,
    tier: ranked.tier,
    rank: ranked.rank || "",
    leaguePoints: Number(ranked.leaguePoints || 0),
    wins: Number(ranked.wins || 0),
    losses: Number(ranked.losses || 0),
    score: rankScore(ranked),
  };
}

function insertRankSnapshots(ranks) {
  if (!ranks.length) return;
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const today = now.slice(0, 10);
  const values = ranks
    .map(
      (rank) =>
        `(${sqlValue(rank.key)}, ${sqlValue(rank.queueType)}, ${sqlValue(rank.tier)}, ${sqlValue(rank.rank)}, ${sqlValue(rank.leaguePoints)}, ${sqlValue(rank.wins)}, ${sqlValue(rank.losses)}, ${sqlValue(rank.score)}, ${sqlValue(nowMs)}, ${sqlValue(now)})`,
    )
    .join(",\n");

  sqliteExec(`
    DELETE FROM rank_snapshots
    WHERE substr(updated_at, 1, 10) = ${sqlValue(today)}
      AND player_key IN (${ranks.map((rank) => sqlValue(rank.key)).join(", ")});

    INSERT INTO rank_snapshots (player_key, queue_type, tier, rank_division, league_points, wins, losses, score, captured_at, updated_at)
    VALUES ${values};
  `);
}

function readRankSnapshots(limitPerPlayer = 12) {
  const rows = sqliteJson(`
    SELECT *
    FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY player_key ORDER BY captured_at DESC, id DESC) AS row_number
      FROM (
        SELECT *
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY player_key, substr(updated_at, 1, 10) ORDER BY captured_at DESC, id DESC) AS day_row_number
          FROM rank_snapshots
        )
        WHERE day_row_number = 1
      )
    )
    WHERE row_number <= ${Number(limitPerPlayer)}
    ORDER BY player_key, captured_at ASC, id ASC;
  `);
  return rows;
}

function buildRankSummary() {
  const rows = readRankSnapshots();
  const latestRows = new Map();
  rows.forEach((row) => latestRows.set(row.player_key, row));
  const latestAt = Math.max(0, ...rows.map((row) => Number(row.captured_at || 0)));

  return {
    updatedAt: latestAt ? new Date(latestAt).toISOString() : null,
    players: DUO_PLAYERS.map((player) => {
      const latest = latestRows.get(player.key);
      const trend = rows
        .filter((row) => row.player_key === player.key)
        .map((row) => ({
          tier: row.tier,
          rank: row.rank_division || "",
          leaguePoints: Number(row.league_points || 0),
          score: Number(row.score || 0),
          capturedAt: Number(row.captured_at || 0),
        }));
      return {
        key: player.key,
        name: player.key === "malang" ? "말랑" : "연두",
        queueType: latest?.queue_type || "UNRANKED",
        tier: latest?.tier || "UNRANKED",
        rank: latest?.rank_division || "",
        leaguePoints: Number(latest?.league_points || 0),
        wins: Number(latest?.wins || 0),
        losses: Number(latest?.losses || 0),
        score: Number(latest?.score || 0),
        trend,
      };
    }),
  };
}

function setSyncMeta(key, value) {
  sqliteExec(`
    INSERT INTO sync_meta (key, value)
    VALUES (${sqlValue(key)}, ${sqlValue(value)})
    ON CONFLICT(key) DO UPDATE SET value = excluded.value;
  `);
}

function getSyncMeta(key) {
  const rows = sqliteJson(`SELECT value FROM sync_meta WHERE key = ${sqlValue(key)} LIMIT 1;`);
  return rows[0]?.value || null;
}

function readMatchesFromDb(limit = STATS_WINDOW) {
  return sqliteJson(`
    SELECT raw_json
    FROM matches
    ORDER BY game_end_timestamp DESC
    LIMIT ${Number(limit)};
  `).map((row) => JSON.parse(row.raw_json));
}

function recordTiltEvent(payload) {
  initDb();
  const playerKey = payload?.player;
  if (!DUO_PLAYERS.some((player) => player.key === playerKey)) {
    throw new Error("알 수 없는 플레이어예요.");
  }
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const sessionId = String(payload.sessionId || `manual-${new Date(nowMs).toISOString().slice(0, 10)}`).slice(0, 80);
  const phase = String(payload.phase || "manual").slice(0, 40);
  const note = payload.note ? String(payload.note).slice(0, 120) : "";

  sqliteExec(`
    INSERT INTO tilt_events (player_key, session_id, phase, created_at, note, updated_at)
    VALUES (${sqlValue(playerKey)}, ${sqlValue(sessionId)}, ${sqlValue(phase)}, ${sqlValue(nowMs)}, ${sqlValue(note)}, ${sqlValue(now)});
  `);

  return buildTiltPayload(sessionId);
}

function readTiltCounts(sinceTimestamp = 0) {
  const rows = sqliteJson(`
    SELECT player_key, COUNT(*) AS count
    FROM tilt_events
    WHERE created_at >= ${sqlValue(Number(sinceTimestamp) || 0)}
    GROUP BY player_key;
  `);
  return rows.reduce(
    (acc, row) => {
      acc[row.player_key] = Number(row.count || 0);
      return acc;
    },
    { malang: 0, yeondoo: 0 },
  );
}

function buildTiltStats(matches) {
  const sinceTimestamp = matches.length ? Math.min(...matches.map((match) => Number(match.gameEndTimestamp || 0)).filter(Boolean)) : 0;
  const counts = readTiltCounts(sinceTimestamp);
  const total = counts.malang + counts.yeondoo;
  const gameCount = Math.max(matches.length, 1);
  const averagePerGame = Number((total / gameCount).toFixed(2));

  return {
    averagePerGame,
    total,
    players: [
      {
        key: "malang",
        name: "말랑",
        count: counts.malang,
        gauge: counts.malang % 20,
        snacksOwed: Math.floor(counts.malang / 20),
      },
      {
        key: "yeondoo",
        name: "연두",
        count: counts.yeondoo,
        gauge: counts.yeondoo % 20,
        snacksOwed: Math.floor(counts.yeondoo / 20),
      },
    ],
  };
}

function readTiltSession(sessionId) {
  const safeSessionId = String(sessionId || "").slice(0, 80);
  const emptyCounts = { malang: 0, yeondoo: 0 };
  const counts = safeSessionId
    ? sqliteJson(`
        SELECT player_key, COUNT(*) AS count
        FROM tilt_events
        WHERE session_id = ${sqlValue(safeSessionId)}
        GROUP BY player_key;
      `).reduce(
        (acc, row) => {
          acc[row.player_key] = Number(row.count || 0);
          return acc;
        },
        { ...emptyCounts },
      )
    : emptyCounts;

  return {
    sessionId: safeSessionId,
    total: counts.malang + counts.yeondoo,
    players: [
      { key: "malang", name: "말랑", count: counts.malang },
      { key: "yeondoo", name: "연두", count: counts.yeondoo },
    ],
  };
}

function buildTiltPayload(sessionId = "") {
  return {
    tilt: buildTiltStats(readMatchesFromDb()),
    session: readTiltSession(sessionId),
  };
}

function seedDbFromJsonCache() {
  const cached = readCachedStats();
  if (!cached?.matches?.length) return [];
  upsertMatches(cached.matches);
  setSyncMeta("last_match_sync", cached.updatedAt || new Date().toISOString());
  return cached.matches;
}

function readBundledSeed() {
  if (!fs.existsSync(SEED_FILE)) return [];
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
  return Array.isArray(seed.matches) ? seed.matches : [];
}

function seedDbFromBundledMatches() {
  const matches = readBundledSeed();
  if (!matches.length) return [];
  upsertMatches(matches);
  setSyncMeta("last_match_sync", new Date().toISOString());
  return matches;
}

function riotRequest(host, endpoint) {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    throw new Error(".env에 RIOT_API_KEY가 필요해요.");
  }

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: host,
        path: endpoint,
        method: "GET",
        headers: {
          "X-Riot-Token": apiKey,
          Accept: "application/json",
        },
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode >= 400) {
            const error = new Error(`Riot API ${response.statusCode}: ${body.slice(0, 140)}`);
            error.statusCode = response.statusCode;
            error.retryAfter = Number(response.headers["retry-after"] || 0);
            reject(error);
            return;
          }
          try {
            resolve(body ? JSON.parse(body) : null);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on("error", reject);
    request.end();
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function riotRequestWithRetry(host, endpoint, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await riotRequest(host, endpoint);
    } catch (error) {
      if (error.statusCode !== 429 || attempt === retries) throw error;
      await wait(Math.max(error.retryAfter * 1000, 1500 * (attempt + 1)));
    }
  }
  return null;
}

function textRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "malang-yeondoo-bot-lab/1.0",
        },
      },
      (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          resolve(textRequest(new URL(response.headers.location, url).toString()));
          return;
        }

        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode >= 400) {
            reject(new Error(`Tier source ${response.statusCode}: ${body.slice(0, 120)}`));
            return;
          }
          resolve(body);
        });
      },
    );
    request.on("error", reject);
    request.end();
  });
}

function decodeHtml(text) {
  return text
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function htmlTextLines(html) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "\n"),
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function percentNumber(value) {
  const parsed = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sourceTierToLocalTier(sourceTier) {
  if (/^S/i.test(sourceTier)) return 1;
  if (/^A/i.test(sourceTier)) return 2;
  if (/^B/i.test(sourceTier)) return 3;
  return 4;
}

function normalizeChampionName(name) {
  return championNameMap[name] || championNameMap[name.replace(/[^A-Za-z]/g, "")] || name;
}

function parseLolalyticsTierHtml(html, role) {
  const lines = htmlTextLines(html);
  let cursor = lines.indexOf("Elo") + 1;
  if (cursor <= 0) throw new Error("티어 테이블을 찾지 못했어요.");

  const rows = [];
  while (cursor < lines.length && rows.length < 8) {
    while (cursor < lines.length && !/^\d+$/.test(lines[cursor])) cursor += 1;
    if (cursor >= lines.length) break;

    const rank = Number(lines[cursor]);
    if (!Number.isFinite(rank) || rank <= 0 || rank > 300) {
      cursor += 1;
      continue;
    }

    const champion = lines[cursor + 1];
    const sourceTier = lines[cursor + 4];
    const winRate = percentNumber(lines[cursor + 6]);
    let next = cursor + 7;
    let delta = 0;

    if (lines[next] === "+" || lines[next] === "-") {
      const sign = lines[next] === "+" ? 1 : -1;
      delta = sign * percentNumber(lines[next + 1]);
      next += 2;
    } else if (/^-\d+(?:\.\d+)?$/.test(lines[next])) {
      delta = percentNumber(lines[next]);
      next += 1;
    }

    const pickRate = percentNumber(lines[next]);
    const banRate = percentNumber(lines[next + 1]);
    const sample = Number(String(lines[next + 3] || "").replace(/,/g, ""));

    const localChampionName = normalizeChampionName(champion);
    if (champion && sourceTier && winRate && Number.isFinite(sample) && ROLE_CHAMPIONS[role]?.has(localChampionName)) {
      rows.push({
        champion: localChampionName,
        tier: sourceTierToLocalTier(sourceTier),
        sourceTier,
        ps: Number((winRate + pickRate * 0.25 - banRate * 0.05).toFixed(2)),
        winRate,
        pickRate,
        banRate,
        sample,
        delta: Number(delta.toFixed(2)),
      });
    }

    cursor = next + 9;
  }

  if (!rows.length) throw new Error("티어 데이터를 읽지 못했어요.");
  return rows;
}

function readChampionTierCache() {
  if (!fs.existsSync(CHAMPION_TIER_CACHE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CHAMPION_TIER_CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeChampionTierCache(cache) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CHAMPION_TIER_CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function fetchLiveChampionTierLane(group, role) {
  const sourceTier = CHAMPION_TIER_GROUPS[group]?.sourceTier || CHAMPION_TIER_GROUPS.low.sourceTier;
  const lane = LOLALYTICS_LANES[role];
  const url = `https://lolalytics.com/lol/tierlist/?lane=${encodeURIComponent(lane)}&tier=${encodeURIComponent(sourceTier)}`;
  return parseLolalyticsTierHtml(await textRequest(url), role);
}

async function championTierPayload(group) {
  const safeGroup = CHAMPION_TIER_GROUPS[group] ? group : "low";
  const cached = readChampionTierCache();
  const cachedEntry = cached[safeGroup];
  const now = Date.now();
  if (cachedEntry?.version === CHAMPION_TIER_CACHE_VERSION && now - cachedEntry.fetchedAt < CHAMPION_TIER_CACHE_MS) {
    return { ...cachedEntry.payload, source: "lolalytics-cache" };
  }

  try {
    const [adc, support] = await Promise.all([fetchLiveChampionTierLane(safeGroup, "adc"), fetchLiveChampionTierLane(safeGroup, "support")]);
    const payload = {
      ok: true,
      group: safeGroup,
      label: CHAMPION_TIER_GROUPS[safeGroup].label,
      updatedAt: new Date().toISOString(),
      minPickRate: "0.5%",
      source: "lolalytics",
      tiers: { label: CHAMPION_TIER_GROUPS[safeGroup].label, adc, support },
    };
    cached[safeGroup] = { fetchedAt: now, version: CHAMPION_TIER_CACHE_VERSION, payload };
    writeChampionTierCache(cached);
    return payload;
  } catch (error) {
    if (cachedEntry?.payload) return { ...cachedEntry.payload, source: "lolalytics-cache", warning: error.message };
    const tiers = CHAMPION_TIERS[safeGroup] || CHAMPION_TIERS.low;
    return {
      ok: true,
      group: safeGroup,
      label: tiers.label,
      updatedAt: new Date().toISOString(),
      minPickRate: "0.5%",
      source: "fallback",
      warning: error.message,
      tiers,
    };
  }
}

function riotAccountEndpoint(player) {
  return `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(player.gameName)}/${encodeURIComponent(player.tagLine)}`;
}

async function fetchDuoMatches() {
  const regionalHost = `${RIOT_REGION}.api.riotgames.com`;
  const accounts = await Promise.all(DUO_PLAYERS.map((player) => riotRequestWithRetry(regionalHost, riotAccountEndpoint(player))));
  upsertPlayers(accounts);
  await syncRanksForAccounts(accounts);
  const [malangAccount, yeondooAccount] = accounts;
  const matchIds = await riotRequestWithRetry(
    regionalHost,
    `/lol/match/v5/matches/by-puuid/${encodeURIComponent(malangAccount.puuid)}/ids?start=0&count=${MATCH_SCAN_COUNT}`,
  );
  const summaries = [];
  for (const matchId of matchIds.slice(0, MATCH_SCAN_COUNT)) {
    const detail = await riotRequestWithRetry(regionalHost, `/lol/match/v5/matches/${matchId}`);
    const summary = summarizeMatch(detail, malangAccount.puuid, yeondooAccount.puuid);
    if (summary) summaries.push(summary);
    if (summaries.length >= STATS_WINDOW) break;
    await wait(140);
  }

  return summaries;
}

async function syncRanksForAccounts(accounts = null) {
  const regionalHost = `${RIOT_REGION}.api.riotgames.com`;
  const platformHost = `${RIOT_PLATFORM}.api.riotgames.com`;
  const nextAccounts = accounts || (await Promise.all(DUO_PLAYERS.map((player) => riotRequestWithRetry(regionalHost, riotAccountEndpoint(player)))));
  upsertPlayers(nextAccounts);
  const rankEntries = await Promise.all(
    nextAccounts.map((account) => riotRequestWithRetry(platformHost, `/lol/league/v4/entries/by-puuid/${encodeURIComponent(account.puuid)}`)),
  );
  const ranks = DUO_PLAYERS.map((player, index) => normalizeRankEntry(player, Array.isArray(rankEntries[index]) ? rankEntries[index] : []));
  insertRankSnapshots(ranks);
  setSyncMeta("last_rank_sync", new Date().toISOString());
  return ranks;
}

function summarizeMatch(match, malangPuuid, yeondooPuuid) {
  const participants = match?.info?.participants || [];
  const malang = participants.find((participant) => participant.puuid === malangPuuid);
  const yeondoo = participants.find((participant) => participant.puuid === yeondooPuuid);
  if (!malang || !yeondoo) return null;

  const sameTeam = malang.teamId === yeondoo.teamId;
  if (!sameTeam) return null;
  const malangPosition = malang.teamPosition || malang.individualPosition;
  const yeondooPosition = yeondoo.teamPosition || yeondoo.individualPosition;

  const duoKills = malang.kills + yeondoo.kills;
  const duoAssists = malang.assists + yeondoo.assists;
  const duoDeaths = malang.deaths + yeondoo.deaths;
  const pair = `${toKoreanChampion(malang.championName)}+${toKoreanChampion(yeondoo.championName)}`;
  const teamData = (match.info.teams || []).find((item) => item.teamId === malang.teamId);
  const malangKillParticipation = Number(malang.challenges?.killParticipation || 0);
  const yeondooKillParticipation = Number(yeondoo.challenges?.killParticipation || 0);

  return {
    matchId: match.metadata.matchId,
    gameEndTimestamp: match.info.gameEndTimestamp,
    win: Boolean(malang.win && yeondoo.win),
    pair,
    malangChampion: toKoreanChampion(malang.championName),
    yeondooChampion: toKoreanChampion(yeondoo.championName),
    malangPosition,
    yeondooPosition,
    positionGroup: duoPositionGroup(malangPosition, yeondooPosition),
    duoKda: {
      kills: duoKills,
      deaths: duoDeaths,
      assists: duoAssists,
    },
    duoKillParticipation: Math.round(((malangKillParticipation + yeondooKillParticipation) / 2) * 100),
    firstDragon: Boolean(teamData?.objectives?.dragon?.first),
    gameDuration: match.info.gameDuration,
    queueId: match.info.queueId,
  };
}

function duoPositionGroup(malangPosition, yeondooPosition) {
  const positions = [malangPosition, yeondooPosition];
  if (!positions.includes("UTILITY")) return "other";
  const carryPosition = positions.find((position) => position !== "UTILITY");
  return POSITION_COMPARISON_GROUPS.find((group) => group.carry === carryPosition)?.key || "other";
}

function isBottomDuoMatch(match) {
  if (match.positionGroup) return match.positionGroup === "bottomSupport";
  return true;
}

function toKoreanChampion(championName) {
  return championNameMap[championName] || championName || "알 수 없음";
}

function buildStats(matches, source) {
  const bottomMatches = matches.filter(isBottomDuoMatch);
  const wins = bottomMatches.filter((match) => match.win).length;
  const total = bottomMatches.length;
  const pairCounts = new Map();
  const pairWins = new Map();
  let killParticipation = 0;
  let kdaKills = 0;
  let kdaDeaths = 0;
  let kdaAssists = 0;
  let firstDragons = 0;

  bottomMatches.forEach((match) => {
    pairCounts.set(match.pair, (pairCounts.get(match.pair) || 0) + 1);
    if (match.win) pairWins.set(match.pair, (pairWins.get(match.pair) || 0) + 1);
    killParticipation += match.duoKillParticipation;
    kdaKills += match.duoKda.kills;
    kdaDeaths += match.duoKda.deaths;
    kdaAssists += match.duoKda.assists;
    if (match.firstDragon) firstDragons += 1;
  });

  const bestPair = [...pairCounts.entries()].sort((a, b) => {
    const aRate = (pairWins.get(a[0]) || 0) / a[1];
    const bRate = (pairWins.get(b[0]) || 0) / b[1];
    return bRate - aRate || b[1] - a[1];
  })[0];
  const kda = kdaDeaths ? ((kdaKills + kdaAssists) / kdaDeaths).toFixed(2) : (kdaKills + kdaAssists).toFixed(2);
  const recentFive = bottomMatches.slice(0, 5);
  const recentFiveWins = recentFive.filter((match) => match.win).length;
  const avgDuration = total ? Math.round(bottomMatches.reduce((sum, match) => sum + match.gameDuration, 0) / total / 60) : 0;
  const avgDuoKills = total ? (kdaKills / total).toFixed(1) : "-";
  const positionComparison = buildPositionComparison(matches);

  return {
    source,
    updatedAt: new Date().toISOString(),
    storage: "sqlite",
    matches: bottomMatches,
    allDuoMatches: matches,
    ranks: buildRankSummary(),
    bestPair: bestPair ? bestPair[0] : null,
    positionComparison,
    insights: buildDuoInsights(bottomMatches, bestPair?.[0], positionComparison),
    tilt: buildTiltStats(matches),
    cards: [
      ["최근 바텀 듀오 승률", total ? `${Math.round((wins / total) * 100)}%` : "-", `최근 바텀 듀오 ${total}게임 중 ${wins}승`],
      ["평균 듀오 KDA", kda, `합산 ${kdaKills}/${kdaDeaths}/${kdaAssists}`],
      ["킬 관여율", total ? `${Math.round(killParticipation / total)}%` : "-", "두 명 합산 평균"],
      ["첫 용 연결률", total ? `${Math.round((firstDragons / total) * 100)}%` : "-", "팀 첫 용 획득 기준"],
      ["베스트 조합", bestPair ? bestPair[0] : "-", bestPair ? `${bestPair[1]}게임 표본` : "데이터 수집 전"],
      ["최근 5게임 흐름", recentFive.length ? `${recentFiveWins}승 ${recentFive.length - recentFiveWins}패` : "-", "가장 최근 바텀 듀오 게임 기준"],
      ["평균 게임 시간", total ? `${avgDuration}분` : "-", "최근 바텀 듀오 게임 평균"],
      ["평균 듀오 킬", total ? `${avgDuoKills}킬` : "-", "두 명 합산 평균"],
    ],
  };
}

function buildPositionComparison(matches) {
  return POSITION_COMPARISON_GROUPS.map((group) => {
    const groupMatches = matches.filter((match) => {
      const key = match.positionGroup || (isBottomDuoMatch(match) ? "bottomSupport" : "other");
      return key === group.key;
    });
    const wins = groupMatches.filter((match) => match.win).length;
    return {
      key: group.key,
      label: group.label,
      games: groupMatches.length,
      wins,
      winRate: groupMatches.length ? Math.round((wins / groupMatches.length) * 100) : null,
    };
  });
}

function buildDuoInsights(matches, bestPairName, positionComparison = []) {
  const total = matches.length;
  if (!total) {
    return [
      ["동기화 상태", "대기", "Riot API에서 바텀 듀오 게임을 가져오는 중"],
      ["저장된 게임", "0", "아직 DB에 저장된 실제 듀오 게임이 없음"],
      ["추천 카드", "-", "첫 동기화 후 최고 조합 기준으로 자동 변경"],
      ["포지션 승률 비교", "대기", "동기화 후 원딜/미드/탑/정글+서폿 비교 표시"],
    ];
  }

  const wins = matches.filter((match) => match.win).length;
  const bestPairMatches = bestPairName ? matches.filter((match) => match.pair === bestPairName) : [];
  const bestPairWins = bestPairMatches.filter((match) => match.win).length;
  const recentFive = matches.slice(0, 5);
  const recentFiveWins = recentFive.filter((match) => match.win).length;
  const avgDuration = Math.round(matches.reduce((sum, match) => sum + match.gameDuration, 0) / total / 60);
  const avgKillParticipation = Math.round(matches.reduce((sum, match) => sum + match.duoKillParticipation, 0) / total);
  const firstDragonRate = Math.round((matches.filter((match) => match.firstDragon).length / total) * 100);
  const avgDuoDeaths = (matches.reduce((sum, match) => sum + match.duoKda.deaths, 0) / total).toFixed(1);

  const comparisonCards = positionComparison.map((group) => [
    group.label,
    group.games ? `${group.winRate}%` : "-",
    group.games ? `${group.games}게임 중 ${group.wins}승` : "표본 없음",
  ]);

  return [
    ["최근 5게임 흐름", `${recentFiveWins}승 ${recentFive.length - recentFiveWins}패`, "가장 최근 바텀 듀오 게임 기준"],
    ["최고 조합 승률", bestPairMatches.length ? `${Math.round((bestPairWins / bestPairMatches.length) * 100)}%` : "-", bestPairName || "데이터 수집 전"],
    ...comparisonCards,
    ["평균 게임 시간", `${avgDuration}분`, "저장된 바텀 듀오 게임 평균"],
    ["평균 킬 관여", `${avgKillParticipation}%`, "두 명의 killParticipation 평균"],
    ["첫 용 확보", `${firstDragonRate}%`, "우리 팀 첫 용 획득 비율"],
    ["평균 듀오 데스", `${avgDuoDeaths}데스`, "두 명 합산 평균"],
  ];
}

function fallbackStats(reason) {
  return {
    ...buildStats([], "pending"),
    error: reason,
    cards: [
      ["동기화 상태", "대기", "Riot API 제한이 풀리면 자동 갱신"],
      ["저장된 게임", "0", "아직 서버 DB에 실제 듀오 게임이 없음"],
      ["최근 5게임 흐름", "-", "동기화 후 표시"],
      ["최근 오류", reason.includes("429") ? "API 제한" : "확인 필요", "잠시 후 다시 갱신"],
    ],
  };
}

function readCachedStats() {
  if (!fs.existsSync(CACHE_FILE)) return null;
  return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
}

function writeCachedStats(stats) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(stats, null, 2));
}

async function statsPayload(forceRefresh = false) {
  initDb();
  const lastSync = getSyncMeta("last_match_sync");
  const lastRankSync = getSyncMeta("last_rank_sync");
  let dbMatches = readMatchesFromDb();
  if (!dbMatches.length) {
    seedDbFromJsonCache();
    dbMatches = readMatchesFromDb();
  }
  if (!dbMatches.length) {
    seedDbFromBundledMatches();
    dbMatches = readMatchesFromDb();
  }
  const cacheAge = lastSync ? Date.now() - new Date(lastSync).getTime() : Infinity;
  const rankCacheAge = lastRankSync ? Date.now() - new Date(lastRankSync).getTime() : Infinity;

  if (!forceRefresh && dbMatches.length && cacheAge < 1000 * 60 * 30) {
    if ((!buildRankSummary().updatedAt || rankCacheAge > 1000 * 60 * 30) && process.env.RIOT_API_KEY) {
      try {
        await syncRanksForAccounts();
      } catch (error) {
        console.error("rank sync failed:", error.message);
      }
    }
    return buildStats(dbMatches, "sqlite");
  }

  try {
    const matches = await fetchDuoMatches();
    upsertMatches(matches);
    setSyncMeta("last_match_sync", new Date().toISOString());
    const stats = buildStats(readMatchesFromDb(), "riot");
    writeCachedStats(stats);
    return stats;
  } catch (error) {
    console.error("stats sync failed:", error.message);
    const storedMatches = readMatchesFromDb();
    if (storedMatches.length) return { ...buildStats(storedMatches, "sqlite"), error: error.message };
    const cached = readCachedStats();
    return fallbackStats(error.message);
  }
}

function lockfileCandidates() {
  const home = os.homedir();
  return [
    "/Applications/League of Legends.app/Contents/LoL/lockfile",
    path.join(home, "Applications/League of Legends.app/Contents/LoL/lockfile"),
    path.join(home, "Library/Application Support/Riot Games/League of Legends/lockfile"),
    "C:/Riot Games/League of Legends/lockfile",
    "C:/Program Files/Riot Games/League of Legends/lockfile",
  ];
}

function readLockfile() {
  const explicitPath = process.env.LCU_LOCKFILE;
  const candidates = explicitPath ? [explicitPath] : lockfileCandidates();
  const lockfilePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!lockfilePath) {
    throw new Error("LoL lockfile을 찾지 못했어요. 클라이언트가 켜져 있는지 확인해주세요.");
  }

  const [name, pid, port, password, protocol] = fs.readFileSync(lockfilePath, "utf8").trim().split(":");
  return {
    name,
    pid,
    port,
    password,
    protocol,
  };
}

function lcuRequest(endpoint) {
  const lockfile = readLockfile();
  const auth = Buffer.from(`riot:${lockfile.password}`).toString("base64");

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: "127.0.0.1",
        port: lockfile.port,
        path: endpoint,
        method: "GET",
        rejectUnauthorized: false,
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode >= 400) {
            reject(new Error(`LCU ${endpoint} responded ${response.statusCode}`));
            return;
          }
          try {
            resolve(body ? JSON.parse(body) : null);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on("error", reject);
    request.end();
  });
}

function normalizeChampSelect(session) {
  if (!session) return null;
  const normalizeMember = (member) => ({
    cellId: member.cellId,
    championId: member.championId,
    championName: championIdMap[member.championId] || "",
    assignedPosition: member.assignedPosition,
    summonerId: member.summonerId,
  });

  return {
    localPlayerCellId: session.localPlayerCellId,
    actions: session.actions,
    myTeam: Array.isArray(session.myTeam) ? session.myTeam.map(normalizeMember) : [],
    theirTeam: Array.isArray(session.theirTeam) ? session.theirTeam.map(normalizeMember) : [],
  };
}

async function livePayload() {
  const phase = await lcuRequest("/lol-gameflow/v1/gameflow-phase");
  let champSelect = null;

  if (phase === "ChampSelect") {
    champSelect = normalizeChampSelect(await lcuRequest("/lol-champ-select/v1/session"));
  }

  return {
    ok: true,
    phase,
    champSelect,
    updatedAt: new Date().toISOString(),
  };
}

async function currentUserPayload() {
  const summoner = await lcuRequest("/lol-summoner/v1/current-summoner");
  const displayName = summoner.gameName || summoner.displayName || "";
  const tagLine = summoner.tagLine || "";
  const known = DUO_PLAYERS.find((player) => {
    const sameName = player.gameName === displayName || `${player.gameName}#${player.tagLine}` === displayName;
    const sameTag = !tagLine || player.tagLine === tagLine;
    return sameName && sameTag;
  });

  return {
    ok: true,
    user: known?.key || null,
    gameName: displayName,
    tagLine,
    updatedAt: new Date().toISOString(),
  };
}

function mockChampSelectPayload() {
  return {
    ok: true,
    phase: "ChampSelect",
    champSelect: {
      localPlayerCellId: 1,
      actions: [
        [
          { actorCellId: 0, championId: 222, completed: true },
          { actorCellId: 1, championId: 147, completed: false },
          { actorCellId: 5, championId: 145, completed: true },
          { actorCellId: 6, championId: 53, completed: true },
        ],
      ],
      myTeam: [
        { cellId: 0, championId: 222, championName: "징크스", assignedPosition: "bottom" },
        { cellId: 1, championId: 0, championName: "", assignedPosition: "utility" },
      ],
      theirTeam: [
        { cellId: 5, championId: 145, championName: "카이사", assignedPosition: "bottom" },
        { cellId: 6, championId: 53, championName: "블리츠크랭크", assignedPosition: "utility" },
      ],
    },
    updatedAt: new Date().toISOString(),
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload));
}

function readRequestJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000) {
        reject(new Error("요청이 너무 커요."));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("JSON 형식이 올바르지 않아요."));
      }
    });
    request.on("error", reject);
  });
}

function serveStatic(request, response) {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.join(ROOT, requestedPath);

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  if (request.url.startsWith("/api/health")) {
    sendJson(response, 200, {
      ok: true,
      storage: "sqlite",
      database: DB_FILE,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  if (request.url.startsWith("/api/current-user")) {
    try {
      sendJson(response, 200, await currentUserPayload());
    } catch (error) {
      sendJson(response, 503, {
        ok: false,
        user: null,
        error: error.message,
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  }

  if (request.url.startsWith("/api/stats")) {
    try {
      const url = new URL(request.url, `http://localhost:${PORT}`);
      sendJson(response, 200, await statsPayload(url.searchParams.get("refresh") === "1"));
    } catch (error) {
      sendJson(response, 503, {
        ok: false,
        error: error.message,
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  }

  if (request.url.startsWith("/api/champion-tiers")) {
    try {
      const url = new URL(request.url, `http://localhost:${PORT}`);
      const group = url.searchParams.get("group") || "low";
      sendJson(response, 200, await championTierPayload(group));
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        error: error.message,
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  }

  if (request.url.startsWith("/api/tilt")) {
    try {
      initDb();
      const url = new URL(request.url, `http://localhost:${PORT}`);
      if (request.method === "POST") {
        const payload = await readRequestJson(request);
        const tiltPayload = recordTiltEvent(payload);
        sendJson(response, 200, {
          ok: true,
          ...tiltPayload,
          updatedAt: new Date().toISOString(),
        });
        return;
      }
      sendJson(response, 200, {
        ok: true,
        ...buildTiltPayload(url.searchParams.get("sessionId")),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        error: error.message,
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  }

  if (request.url.startsWith("/api/live")) {
    try {
      const url = new URL(request.url, `http://localhost:${PORT}`);
      if (url.searchParams.get("mock") === "champselect") {
        sendJson(response, 200, mockChampSelectPayload());
        return;
      }
      sendJson(response, 200, await livePayload());
    } catch (error) {
      sendJson(response, 503, {
        ok: false,
        phase: "Disconnected",
        error: error.message,
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  }

  serveStatic(request, response);
});

server.listen(PORT, () => {
  console.log(`말랑연두 바텀 연구소: http://localhost:${PORT}`);
  console.log("LoL 클라이언트를 켠 뒤 픽창에 들어가면 자동 추천이 표시됩니다.");
});
