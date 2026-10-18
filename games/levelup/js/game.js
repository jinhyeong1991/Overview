/* 루미나 어드벤처 — original side-scrolling action RPG. */
(function () {
  const SAVE_KEY = "lumina-adventure-v1";
  const MUTE_KEY = "lumina-muted";
  const GRAVITY = 1450;
  const JUMP_V = -620;
  const MAX_FALL = 620;
  const GROUND = 328;
  const WORLD_H = 440;
  const MAX_LEVEL = 30;

  const SKILLS = [
    { id: "wave", name: "검기", short: "검기", level: 3, mp: 8, cd: 3.1, desc: "전방으로 날아가는 검기" },
    { id: "dash", name: "질풍참", short: "질풍", level: 6, mp: 12, cd: 4.8, desc: "빠르게 돌진하며 벤다" },
    { id: "spin", name: "회오리", short: "회오", level: 10, mp: 16, cd: 7.2, desc: "주변을 휩쓰는 회전베기" },
    { id: "nova", name: "성광파", short: "성광", level: 15, mp: 28, cd: 12, desc: "거대한 빛의 폭발" },
  ];

  const HEROES = {
    male: { name: "카이", title: "푸른 검사", hp: 130, mp: 56, atk: 16, speed: 112, atkCd: 0.4, atkDur: 0.34 },
    female: { name: "리아", title: "새벽 검사", hp: 104, mp: 80, atk: 13, speed: 128, atkCd: 0.3, atkDur: 0.26 },
  };

  const BESTIARY = {
    slime: { name: "말랑 슬라임", hp: 22, atk: 6, exp: 20, gold: 5, w: 20, h: 16, speed: 40 },
    mushroom: { name: "뿔버섯", hp: 40, atk: 11, exp: 28, gold: 8, w: 20, h: 24, speed: 34 },
    wolf: { name: "숲늑대", hp: 54, atk: 14, exp: 36, gold: 11, w: 26, h: 22, speed: 36, run: 128 },
    bat: { name: "밤박쥐", hp: 32, atk: 12, exp: 32, gold: 9, w: 28, h: 18, flying: true },
    golem: { name: "돌골렘", hp: 96, atk: 18, exp: 58, gold: 18, w: 28, h: 32, speed: 28 },
    imp: { name: "불꽃정령", hp: 44, atk: 15, exp: 46, gold: 13, w: 18, h: 22, flying: true },
    boss: { name: "네로스", hp: 480, atk: 20, exp: 360, gold: 160, w: 44, h: 56, speed: 50 },
  };

  const STAGE_MUL = [
    { hp: 1, atk: 1, exp: 1 },
    { hp: 1.4, atk: 1.18, exp: 1.25 },
    { hp: 1.85, atk: 1.4, exp: 1.5 },
    { hp: 2.15, atk: 1.55, exp: 1.7 },
  ];

  const THEMES = {
    meadow: { sky: ["#8fd4ff", "#e7f8ff"], sun: "#fff3b0", far: "#9dcf86", near: "#67b85a", music: "meadow", fog: 0 },
    forest: { sky: ["#6d9084", "#d5e4cf"], sun: "#e7f0d0", far: "#3e5c48", near: "#2f4a38", music: "forest", fog: 0.16 },
    cave: { sky: ["#140e22", "#3a2458"], sun: null, far: "#2a2044", near: "#1a142c", music: "cave", fog: 0.08, stars: true },
    boss: { sky: ["#14060e", "#4a1424"], sun: "#ff6a3a", far: "#3a1020", near: "#240810", music: "boss", fog: 0.12, stars: true },
  };

  function P(x, y, w, h, type, oneWay) {
    return { x, y, w, h, type, oneWay: !!oneWay };
  }

  const MAPS = [
    {
      name: "푸른 초원", theme: "meadow", width: 2100, seed: 11, rec: "추천 Lv.1",
      enter: "푸른 초원에 도착했습니다",
      goal: "포탈을 찾아 다음 지역으로 가세요",
      shopX: 130, chestX: 1960, portalX: 2020,
      platforms: [
        P(0, GROUND, 2100, 110, "grass"),
        P(280, GROUND - 48, 120, 12, "grass", true),
        P(470, GROUND - 86, 96, 12, "grass", true),
        P(680, GROUND - 46, 160, 12, "wood", true),
        P(940, GROUND - 78, 90, 12, "grass", true),
        P(1120, GROUND - 110, 110, 12, "grass", true),
        P(1340, GROUND - 42, 170, 14, "stone", true),
        P(1600, GROUND - 74, 100, 12, "grass", true),
        P(1780, GROUND - 46, 120, 12, "wood", true),
      ],
      spawns: [
        ["slime", 430], ["slime", 560], ["slime", 700], ["slime", 860],
        ["mushroom", 1020], ["slime", 1160], ["mushroom", 1300], ["slime", 1460],
        ["mushroom", 1600], ["slime", 1720], ["mushroom", 1840], ["slime", 1940],
      ],
    },
    {
      name: "안개 숲", theme: "forest", width: 2200, seed: 29, rec: "추천 Lv.5",
      enter: "안개 숲에 도착했습니다",
      goal: "숲을 지나 포탈로 가세요",
      shopX: 130, chestX: 2060, portalX: 2120,
      platforms: [
        P(0, GROUND, 760, 110, "moss"),
        P(760, GROUND + 42, 280, 80, "moss"),
        P(740, GROUND - 8, 110, 12, "wood", true),
        P(888, GROUND - 8, 110, 12, "wood", true),
        P(1040, GROUND, 1160, 110, "moss"),
        P(1240, GROUND - 56, 100, 12, "wood", true),
        P(1460, GROUND - 96, 90, 12, "moss", true),
        P(1680, GROUND - 48, 140, 12, "wood", true),
        P(1900, GROUND - 78, 100, 12, "moss", true),
      ],
      spawns: [
        ["wolf", 240], ["bat", 340], ["wolf", 460], ["bat", 560],
        ["wolf", 820], ["bat", 980], ["wolf", 1140], ["bat", 1280],
        ["wolf", 1420], ["bat", 1560], ["wolf", 1700], ["bat", 1840], ["wolf", 1980],
      ],
    },
    {
      name: "용암 동굴", theme: "cave", width: 2100, seed: 47, rec: "추천 Lv.8",
      enter: "용암 동굴에 도착했습니다",
      goal: "용암을 뛰어넘어 포탈로 가세요",
      shopX: 120, chestX: 1960, portalX: 2020,
      platforms: [
        P(0, GROUND, 2100, 110, "stone"),
        P(360, GROUND - 52, 110, 14, "stone", true),
        P(620, GROUND - 90, 90, 14, "stone", true),
        P(900, GROUND - 48, 140, 14, "stone", true),
        P(1180, GROUND - 86, 100, 14, "stone", true),
        P(1460, GROUND - 46, 120, 14, "stone", true),
        P(1720, GROUND - 78, 110, 14, "stone", true),
      ],
      lava: [
        { x: 430, y: GROUND - 6, w: 52, h: 16, dmg: 12 },
        { x: 760, y: GROUND - 6, w: 64, h: 16, dmg: 12 },
        { x: 1080, y: GROUND - 6, w: 56, h: 16, dmg: 14 },
        { x: 1360, y: GROUND - 6, w: 70, h: 16, dmg: 14 },
        { x: 1640, y: GROUND - 6, w: 52, h: 16, dmg: 16 },
      ],
      spawns: [
        ["golem", 260], ["imp", 420], ["golem", 560], ["imp", 740],
        ["golem", 980], ["imp", 1140], ["golem", 1320], ["imp", 1500],
        ["golem", 1680], ["imp", 1860],
      ],
    },
    {
      name: "심연의 왕좌", theme: "boss", width: 760, seed: 73, rec: "추천 Lv.12",
      enter: "심연의 수호자 네로스가 깨어납니다",
      goal: "네로스를 쓰러뜨리세요",
      boss: true,
      platforms: [P(0, GROUND, 760, 110, "throne")],
      spawns: [["boss", 500]],
    },
  ];

  const $ = (id) => document.getElementById(id);
  const Audio = () => window.LuminaAudio;
  const Art = () => window.LuminaArt;

  const view = $("view");
  const vctx = view.getContext("2d");
  const off = document.createElement("canvas");
  const octx = off.getContext("2d", { alpha: false });
  const portrait = $("portrait");
  const pctx = portrait.getContext("2d");

  const keys = {};
  const held = { attack: false, jump: false };
  const joy = { active: false, id: null, x: 0 };

  let cssW = 800, cssH = 400, dpr = 1, viewW = 400, viewH = 200;
  let mode = "title";
  let heroId = null;
  let level = 1, exp = 0, gold = 0, atkBonus = 0, hpBonus = 0;
  let potions = { hp: 0, mp: 0 };
  let stageIndex = 0, unlocked = 0, cleared = [0, 0, 0, 0], bossCleared = false;
  let map = null, player = null, monsters = [], drops = [], shots = [], particles = [], arcs = [], floaters = [], ghosts = [], rings = [];
  let camX = 0, camY = 0, snapCam = true, drawCamX = 0, drawCamY = 0;
  let shake = 0, hitstop = 0, busy = 0, busyQueue = [], bannerSkills = [];
  let animClock = 0, titleT = 0, saveTick = 0;
  let jumpBuffer = 0, attackQueue = 0, combo = 0, lastComboAt = 0, kills = 0;
  let paused = false, shopOn = false, mapOn = false, victoryOn = false, confirmOn = false;
  let shopFrom = "play", deadTimer = 0, victoryQueued = false, playedLevel = false;
  let interactKind = null;
  let ambients = [];
  let confirmYes = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hash(x, y) {
    let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return (n ^ (n >>> 16)) >>> 0;
  }
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function expNeed(lv) { return 20 + lv * 12; }
  function theme() { return THEMES[(map && map.theme) || "meadow"]; }
  function hero() { return HEROES[heroId] || HEROES.male; }
  function gameplay() {
    return mode === "play" && player && !player.dead && !paused && !shopOn && !mapOn && !victoryOn && !confirmOn && busy <= 0;
  }

  function toast(msg) {
    const box = $("toasts");
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(() => el.remove(), 2200);
  }

  function flashScreen(color, amount) {
    const el = $("flash");
    el.style.background = color;
    el.style.opacity = String(amount);
    el.style.transition = "none";
    requestAnimationFrame(() => {
      el.style.transition = "opacity .45s ease";
      el.style.opacity = "0";
    });
  }

  function vibrate(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ }
  }

  function readSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d || d.v !== 1 || !d.hero || !HEROES[d.hero]) return null;
      d.level = clamp(d.level | 0, 1, MAX_LEVEL);
      d.exp = Math.max(0, d.exp | 0);
      d.gold = Math.max(0, d.gold | 0);
      d.stage = clamp(d.stage | 0, 0, MAPS.length - 1);
      d.unlocked = clamp(d.unlocked | 0, 0, MAPS.length - 1);
      if (d.unlocked < d.stage) d.unlocked = d.stage;
      d.cleared = Array.isArray(d.cleared) ? d.cleared.slice(0, 4) : [0, 0, 0, 0];
      while (d.cleared.length < 4) d.cleared.push(0);
      d.potions = d.potions || { hp: 0, mp: 0 };
      d.potions.hp = clamp(d.potions.hp | 0, 0, 5);
      d.potions.mp = clamp(d.potions.mp | 0, 0, 5);
      d.atkBonus = clamp(d.atkBonus | 0, 0, 15);
      d.hpBonus = clamp(d.hpBonus | 0, 0, 100);
      return d;
    } catch (e) { return null; }
  }

  function writeSave() {
    if (!heroId) return;
    const data = {
      v: 1, hero: heroId, level, exp, gold, stage: stageIndex, unlocked, cleared, bossCleared,
      potions, atkBonus, hpBonus,
      hp: player ? Math.round(player.hp) : 0,
      mp: player ? Math.round(player.mp) : 0,
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
  }

  function applySave(d) {
    heroId = d.hero;
    level = d.level;
    exp = d.exp;
    gold = d.gold;
    stageIndex = d.stage;
    unlocked = d.unlocked;
    cleared = d.cleared.slice();
    bossCleared = !!d.bossCleared;
    potions = { hp: d.potions.hp, mp: d.potions.mp };
    atkBonus = d.atkBonus;
    hpBonus = d.hpBonus;
  }

  function freshProgress() {
    heroId = null;
    level = 1; exp = 0; gold = 0; atkBonus = 0; hpBonus = 0;
    potions = { hp: 0, mp: 0 };
    stageIndex = 0; unlocked = 0; cleared = [0, 0, 0, 0]; bossCleared = false;
    player = null;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  }

  function recalc() {
    if (!player) return;
    const h = hero();
    player.hpMax = h.hp + (level - 1) * 12 + hpBonus;
    player.mpMax = h.mp + (level - 1) * 5;
    player.atk = h.atk + (level - 1) * 2 + atkBonus;
    player.speed = h.speed;
    player.hp = clamp(player.hp, 0, player.hpMax);
    player.mp = clamp(player.mp, 0, player.mpMax);
  }

  function makePlayer() {
    const h = hero();
    player = {
      x: 56, y: 0, w: 18, h: 34, vx: 0, vy: 0,
      facing: 1, onGround: false, coyote: 0, jumpCut: false,
      state: "idle", stateT: 0, hp: 1, mp: 1, hpMax: 1, mpMax: 1, atk: 1, speed: h.speed,
      atkCd: 0, atkDur: h.atkDur, invuln: 0, controlLock: 0, sinceHit: 10,
      hitSet: new Set(), spinTick: 0, novaBoom: false, dead: false,
    };
    recalc();
    player.hp = player.hpMax;
    player.mp = player.mpMax;
  }

  function standY(x) {
    if (!map) return GROUND;
    let y = null;
    for (const p of map.platforms) {
      if (x >= p.x && x <= p.x + p.w) {
        if (y === null || p.y < y) y = p.y;
      }
    }
    return y == null ? GROUND : y;
  }

  function spawnMonster(type, x) {
    const base = BESTIARY[type];
    const mul = STAGE_MUL[stageIndex];
    const elite = type !== "boss" && stageIndex > 0 && Math.random() < 0.12;
    const sc = elite ? 1.28 : 1;
    const w = Math.round(base.w * sc);
    const h = Math.round(base.h * sc);
    const ground = standY(x + w / 2);
    const flying = !!base.flying;
    const m = {
      type, name: base.name, elite, flying,
      x, y: ground - h - (flying ? 30 + Math.random() * 16 : 0), w, h,
      vx: 0, vy: 0, facing: -1, onGround: false,
      hp: Math.round(base.hp * mul.hp * (elite ? 2.15 : 1)),
      atk: Math.round(base.atk * mul.atk * (elite ? 1.35 : 1)),
      exp: Math.round(base.exp * mul.exp * (elite ? 2 : 1)),
      gold: Math.round(base.gold * (elite ? 2 : 1) * (1 + stageIndex * 0.2)),
      flash: 0, touchCd: 0, stun: 0, dead: false,
      aiT: Math.random() * 1.2, shotCd: 1 + Math.random(), slamCd: 1.5, windup: 0,
      mode: "idle", anim: Math.random() * 4, phase: Math.random() * 6,
      homeX: x, homeY: 0, p2: false, p3: false,
    };
    m.hpMax = m.hp;
    m.homeY = m.y;
    return m;
  }

  function buildDecor(def) {
    const rand = mulberry32(def.seed);
    const list = [];
    const themeName = def.theme;
    for (let x = 180; x < def.width - 40; x += 26) {
      if (def.portalX && Math.abs(x - def.portalX) < 46) continue;
      if (def.chestX && Math.abs(x - def.chestX) < 36) continue;
      if (def.shopX && Math.abs(x - def.shopX) < 46) continue;
      const lava = (def.lava || []).some((l) => x > l.x - 10 && x < l.x + l.w + 10);
      if (lava) continue;
      const y = standY(x);
      if (y > GROUND + 8) continue;
      if (themeName === "meadow" || themeName === "forest") {
        if (rand() < 0.55) list.push({ kind: "tree", v: (rand() * 3) | 0, x, y });
        else if (rand() < 0.5) list.push({ kind: "bush", v: (rand() * 2) | 0, x, y });
        if (rand() < 0.45) list.push({ kind: "flower", v: (rand() * 3) | 0, x: x + 12, y });
      } else if (themeName === "cave") {
        if (rand() < 0.4) list.push({ kind: "crystal", v: (rand() * 2) | 0, x, y });
        else if (rand() < 0.5) list.push({ kind: "rock", v: (rand() * 2) | 0, x, y });
      } else if (rand() < 0.35) {
        list.push({ kind: "candle", v: 0, x, y });
      }
    }
    return list;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildCache(def, decor) {
    const c = document.createElement("canvas");
    c.width = def.width;
    c.height = WORLD_H;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    for (const p of def.platforms) drawPlatform(g, p);
    for (const d of decor) {
      const spr = Art().getProp(d.kind, d.v);
      g.drawImage(spr.img, Math.round(d.x - spr.ax), Math.round(d.y - spr.ay));
    }
    return c;
  }

  function drawPlatform(g, p) {
    const { x, y, w, h, type } = p;
    if (type === "grass" || type === "moss" || type === "dirt") {
      g.fillStyle = type === "moss" ? "#4a3428" : "#8a5a34";
      g.fillRect(x, y, w, h);
      for (let i = x; i < x + w; i += 4) {
        for (let j = y + 6; j < y + h; j += 5) {
          if ((hash(i, j) & 7) === 0) {
            g.fillStyle = type === "moss" ? "#3a281c" : "#6e4428";
            g.fillRect(i, j, 2, 2);
          }
        }
      }
      if (type === "grass") {
        g.fillStyle = "#2f7a34";
        g.fillRect(x, y, w, 5);
        g.fillStyle = "#8ee07a";
        g.fillRect(x, y, w, 2);
        g.fillStyle = "#1f5a28";
        for (let i = x + 2; i < x + w; i += 7) if (hash(i, 3) & 1) g.fillRect(i, y - 3, 2, 3);
      } else if (type === "moss") {
        g.fillStyle = "#245c34";
        g.fillRect(x, y, w, 5);
        g.fillStyle = "#6db85a";
        g.fillRect(x, y, w, 2);
      }
    } else if (type === "wood") {
      g.fillStyle = "#6a4024";
      g.fillRect(x, y, w, h);
      g.fillStyle = "#c48a52";
      g.fillRect(x, y, w, 4);
      g.fillStyle = "#5a3418";
      for (let i = x; i < x + w; i += 8) g.fillRect(i, y, 1, h);
    } else if (type === "throne") {
      g.fillStyle = "#241830";
      g.fillRect(x, y, w, h);
      g.fillStyle = "#8a1e32";
      g.fillRect(x + w * 0.28, y, w * 0.44, 10);
      g.fillStyle = "#f0c14a";
      g.fillRect(x, y, w, 2);
      g.fillStyle = "#3a2850";
      for (let i = x + 8; i < x + w; i += 18) g.fillRect(i, y + 14, 8, 4);
    } else {
      g.fillStyle = "#4a4658";
      g.fillRect(x, y, w, h);
      g.fillStyle = "#8e8aa0";
      g.fillRect(x, y, w, 4);
      g.fillStyle = "#3a3648";
      for (let j = y + 10; j < y + h; j += 10) g.fillRect(x, j, w, 1);
      for (let i = x; i < x + w; i += 12) g.fillRect(i, y, 1, h);
    }
  }

  function loadStage(index) {
    stageIndex = clamp(index, 0, MAPS.length - 1);
    if (unlocked < stageIndex) unlocked = stageIndex;
    const def = MAPS[stageIndex];
    const decor = buildDecor(def);
    map = {
      name: def.name, theme: def.theme, width: def.width, seed: def.seed,
      goal: def.goal, boss: !!def.boss,
      platforms: def.platforms, lava: def.lava || [],
      portalX: def.portalX || 0, shopX: def.shopX || 0, chestX: def.chestX || 0,
      cache: buildCache(def, decor),
    };
    monsters = def.spawns.map(([t, x]) => spawnMonster(t, x));
    drops = []; shots = []; particles = []; arcs = []; floaters = []; ghosts = []; rings = [];
    victoryQueued = false;
    ambients = makeAmbients(def);
    if (player) {
      player.x = 52;
      player.y = standY(70) - player.h;
      player.vx = 0; player.vy = 0;
      player.dead = false;
      player.state = "idle";
      player.invuln = 1.4;
      player.sinceHit = 0;
    }
    snapCam = true;
    Audio().playTrack(THEMES[def.theme].music);
    toast(def.enter);
    if (def.boss) {
      Audio().sfx("roar");
      flashScreen("#ff5a6a", 0.28);
    }
    writeSave();
    syncLayers();
  }

  function makeAmbients(def) {
    const list = [];
    const n = def.theme === "meadow" ? 5 : def.theme === "forest" ? 7 : def.theme === "cave" ? 8 : 4;
    for (let i = 0; i < n; i++) {
      list.push({
        kind: def.theme === "forest" || def.theme === "cave" ? "spark" : "butterfly",
        x: 80 + Math.random() * (def.width - 160),
        y: 120 + Math.random() * 140,
        s: 0.4 + Math.random(),
        p: Math.random() * 6,
        color: def.theme === "cave" ? "#ffb15a" : def.theme === "forest" ? "#d8ffb0" : (i % 2 ? "#ff8ab8" : "#fff"),
      });
    }
    return list;
  }

  function axisX() {
    if (joy.active) {
      const v = joy.x;
      return Math.abs(v) < 0.18 ? 0 : v;
    }
    let x = 0;
    if (keys.ArrowLeft || keys.KeyA) x -= 1;
    if (keys.ArrowRight || keys.KeyD) x += 1;
    return x;
  }
  function attackHeld() { return held.attack || keys.KeyJ || keys.KeyZ; }
  function jumpHeld() { return held.jump || keys.Space || keys.ArrowUp || keys.KeyW || keys.KeyK; }

  function queueJump() { jumpBuffer = 0.14; }

  function tryJump(force) {
    if (!player || jumpBuffer <= 0) return;
    if (!force && (player.state === "attack" && player.stateT < player.atkDur * 0.4)) return;
    if (["dash", "nova", "spin", "hurt"].includes(player.state)) return;
    const can = force || player.onGround || player.coyote > 0;
    if (!can) return;
    player.vy = JUMP_V;
    player.onGround = false;
    player.coyote = 0;
    player.jumpCut = false;
    jumpBuffer = 0;
    player.state = "jump";
    player.stateT = 0;
    Audio().sfx("jump");
    burst(player.x + player.w / 2, player.y + player.h, 5, "#fff", 40, 0.25);
  }

  function canAct() {
    return ["idle", "walk", "jump", "fall"].includes(player.state);
  }

  function startAttack() {
    player.state = "attack";
    player.stateT = 0;
    player.atkCd = hero().atkCd;
    player.atkDur = hero().atkDur;
    player.hitSet = new Set();
    Audio().sfx("attack");
    arcs.push({ kind: "slash", x: player.x + player.w / 2, y: player.y + 12, dir: player.facing, life: 0.16, max: 0.16 });
  }

  function trySkill(i) {
    if (!gameplay()) return;
    const sk = SKILLS[i];
    if (level < sk.level) { toast("Lv." + sk.level + "에 해금됩니다"); Audio().sfx("deny"); return; }
    if (skillCd[i] > 0) return;
    if (player.mp < sk.mp) { toast("마나가 부족합니다"); Audio().sfx("deny"); return; }
    if (!canAct() && player.state !== "attack") return;
    player.mp -= sk.mp;
    skillCd[i] = sk.cd;
    spawnFloater(player.x + player.w / 2, player.y - 4, sk.name, "#fff3b0");
    castSkill(sk.id);
  }

  const skillCd = [0, 0, 0, 0];

  function castSkill(id) {
    Audio().sfx(id === "nova" ? "nova" : "skill");
    const ax = axisX();
    if (Math.abs(ax) > 0.2) player.facing = Math.sign(ax);
    player.hitSet = new Set();
    player.stateT = 0;
    if (id === "wave") {
      player.state = "cast";
      const y = player.y + 8;
      const dir = player.facing;
      shots.push({
        friendly: true, kind: "wave", x: player.x + (dir > 0 ? player.w : -22), y: y - 4, w: 30, h: 26,
        vx: dir * 240, vy: 0, life: 0.85, dmg: player.atk * 1.7, pierce: true, hit: new Set(),
      });
      burst(player.x + player.w / 2 + dir * 12, y + 8, 12, "#fff3c0", 120, 0.35);
      rings.push({ x: player.x + player.w / 2 + dir * 16, y: y + 8, r: 6, vr: 70, life: 0.28, color: "#fff6c0" });
    } else if (id === "dash") {
      player.state = "dash";
      player.invuln = Math.max(player.invuln, 0.22);
    } else if (id === "spin") {
      player.state = "spin";
      player.spinTick = 0;
      rings.push({ x: player.x + player.w / 2, y: player.y + player.h / 2, r: 8, vr: 90, life: 0.45, color: "#d8fff4" });
    } else if (id === "nova") {
      player.state = "nova";
      player.novaBoom = false;
    }
  }

  function usePotion(kind) {
    if (!gameplay()) return;
    if (potions[kind] <= 0) { toast("물약이 없습니다"); Audio().sfx("deny"); return; }
    if (kind === "hp" && player.hp >= player.hpMax - 0.5) { toast("체력이 가득합니다"); return; }
    if (kind === "mp" && player.mp >= player.mpMax - 0.5) { toast("마나가 가득합니다"); return; }
    potions[kind]--;
    if (kind === "hp") {
      const heal = Math.round(player.hpMax * 0.45);
      player.hp = Math.min(player.hpMax, player.hp + heal);
      spawnFloater(player.x + 8, player.y, "+" + heal, "#8ee07a");
    } else {
      const heal = Math.round(player.mpMax * 0.45);
      player.mp = Math.min(player.mpMax, player.mp + heal);
      spawnFloater(player.x + 8, player.y, "+" + heal, "#8ad4ff");
    }
    Audio().sfx("heal");
    burst(player.x + player.w / 2, player.y + 10, 10, kind === "hp" ? "#ff8b98" : "#8ad4ff", 70, 0.4);
    writeSave();
  }

  function gainExp(n) {
    exp += Math.round(n);
    let gained = 0;
    const first = busy <= 0;
    while (level < MAX_LEVEL && exp >= expNeed(level)) {
      exp -= expNeed(level);
      level++;
      gained++;
      const sk = SKILLS.find((s) => s.level === level);
      if (sk && bannerSkills.indexOf(sk.name) < 0) bannerSkills.push(sk.name);
    }
    if (!gained) return;
    recalc();
    player.hp = player.hpMax;
    player.mp = player.mpMax;
    showLevelBanner();
    levelUpFx();
    if (first) Audio().sfx("level");
    playedLevel = true;
    busy = Math.max(busy, 1.55);
    writeSave();
  }

  function showLevelBanner() {
    $("lv-num").textContent = "Lv. " + level;
    $("lv-skill").textContent = bannerSkills.length ? "새로운 기술 「" + bannerSkills.join(" · ") + "」 습득!" : "능력이 성장했습니다";
    const ul = $("lv-stats");
    ul.replaceChildren();
    ["최대 체력 +12", "공격력 +2", "최대 마나 +5"].forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      ul.appendChild(li);
    });
    $("modal-levelup").classList.remove("hidden");
  }

  function levelUpFx() {
    const x = player.x + player.w / 2;
    const y = player.y + 8;
    burst(x, y, 28, "#fff1a8", 160, 0.7);
    burst(x, y, 16, "#fff", 90, 0.5);
    rings.push({ x, y, r: 6, vr: 140, life: 0.6, color: "#ffe08a" });
    rings.push({ x, y: y + 10, r: 4, vr: 90, life: 0.5, color: "#fff" });
    flashScreen("#fff6d0", 0.55);
    shake = Math.min(1, shake + 0.45);
  }

  function damageMonster(m, raw, opts) {
    if (!m || m.dead) return;
    opts = opts || {};
    const crit = !opts.noCrit && Math.random() < 0.14;
    let dmg = raw * (0.92 + Math.random() * 0.16);
    if (crit) dmg *= 1.72;
    if (combo > 1) dmg *= Math.min(1.22, 1 + combo * 0.02);
    dmg = Math.max(1, Math.round(dmg));
    m.hp -= dmg;
    m.flash = 0.1;
    const dir = (m.x + m.w / 2) >= (player.x + player.w / 2) ? 1 : -1;
    const kb = m.type === "boss" ? 16 : (opts.kb || 110);
    m.vx = dir * kb;
    if (!m.flying) m.vy = -80;
    if (m.type !== "boss") m.stun = Math.max(m.stun, 0.32);
    spawnFloater(m.x + m.w / 2, m.y, String(dmg), crit ? "#ffd24a" : "#ffffff");
    if (crit) spawnFloater(m.x + m.w / 2, m.y - 12, "치명타", "#ff9a3c");
    hitstop = Math.max(hitstop, opts.noStop ? 0 : 0.03);
    shake = Math.min(1, shake + 0.16);
    Audio().sfx("hit");
    registerCombo();
    burst(m.x + m.w / 2, m.y + m.h * 0.4, 6, "#fff6e4", 90, 0.3);
    if (m.hp <= 0) killMonster(m);
  }

  function killMonster(m) {
    if (m.dead) return;
    m.dead = true;
    m.hp = 0;
    kills++;
    burst(m.x + m.w / 2, m.y + m.h / 2, m.type === "boss" ? 36 : 16, m.type === "boss" ? "#ffd56a" : "#fff", 160, 0.55);
    rings.push({ x: m.x + m.w / 2, y: m.y + m.h / 2, r: 4, vr: 80, life: 0.35, color: "#fff" });
    spawnFloater(m.x + m.w / 2, m.y - 8, "+" + m.exp + " 경험치", "#c8ff9a");
    dropLoot(m);
    gainExp(m.exp);
    if (m.type === "boss") onBossDown();
  }

  function dropLoot(m) {
    const coins = 1 + (Math.random() < 0.5 ? 1 : 0) + (m.elite ? 2 : 0);
    for (let i = 0; i < coins; i++) {
      drops.push({
        type: "coin", x: m.x + m.w / 2, y: m.y + 6,
        vx: (Math.random() - 0.5) * 90, vy: -120 - Math.random() * 40,
        w: 10, h: 10, life: 12, val: Math.max(1, Math.round(m.gold / coins)),
      });
    }
    if (Math.random() < (m.elite ? 0.55 : 0.14)) {
      const type = Math.random() < 0.5 ? "hp" : "mp";
      drops.push({
        type, x: m.x + 4, y: m.y, vx: (Math.random() - 0.5) * 40, vy: -90,
        w: 12, h: 14, life: 14, val: 1,
      });
    }
  }

  function onBossDown() {
    if (victoryQueued) return;
    victoryQueued = true;
    grantClear();
    gold += 120;
    gainExp(200);
    busyQueue.push(openVictory);
    busy = Math.max(busy, 1.45);
    flashScreen("#fff6d0", 0.65);
    shake = 1;
    Audio().sfx("portal");
  }

  function grantClear() {
    if (cleared[stageIndex]) return;
    cleared[stageIndex] = 1;
    if (stageIndex === 3) bossCleared = true;
    gold += 25 + stageIndex * 20;
    const bonus = [80, 140, 220, 260][stageIndex] || 0;
    toast("지역을 클리어했습니다!");
    if (bonus) gainExp(bonus);
    writeSave();
  }

  function hurtPlayer(dmg, srcX) {
    if (!player || player.dead || player.invuln > 0) return;
    if (player.state === "dash") return;
    const dealt = Math.max(1, Math.round(dmg));
    player.hp -= dealt;
    player.invuln = 0.85;
    player.sinceHit = 0;
    player.controlLock = 0.2;
    const dir = (player.x + player.w / 2) < srcX ? -1 : 1;
    if (!["nova", "spin"].includes(player.state)) {
      player.state = "hurt";
      player.stateT = 0;
      player.vx = dir * 160;
      player.vy = -180;
    }
    spawnFloater(player.x + 8, player.y, String(dealt), "#ff6a7a");
    Audio().sfx("hurt");
    shake = Math.min(1, shake + 0.4);
    flashScreen("#ff3a4a", 0.22);
    vibrate(16);
    if (player.hp <= 0) {
      player.hp = 0;
      die();
    }
  }

  function die() {
    if (!player || player.dead) return;
    player.dead = true;
    player.hp = 0;
    const loss = Math.ceil(gold * 0.08);
    gold = Math.max(0, gold - loss);
    $("death-text").textContent = loss > 0
      ? "골드 " + loss + "을 잃었습니다. 잠시 후 입구에서 다시 일어납니다."
      : "잠시 후 지역 입구에서 다시 일어납니다.";
    $("modal-death").classList.remove("hidden");
    deadTimer = 1.15;
    Audio().sfx("death");
    writeSave();
    syncLayers();
  }

  function respawn() {
    $("modal-death").classList.add("hidden");
    player.dead = false;
    player.hp = player.hpMax;
    player.mp = Math.max(player.mp, player.mpMax * 0.35);
    player.x = 52;
    player.y = standY(70) - player.h;
    player.vx = 0; player.vy = 0;
    player.state = "idle";
    player.invuln = 2.4;
    const boss = monsters.find((m) => m.type === "boss" && !m.dead);
    if (boss) boss.x = map.width * 0.62;
    monsters.forEach((m) => {
      if (m.dead || m.type === "boss") return;
      if (m.x < 320) m.x = Math.max(m.homeX || 340, 360);
      m.vx = 0;
      m.stun = 1.2;
      m.touchCd = 1.2;
    });
    toast("다시 도전하세요");
    syncLayers();
  }

  function openVictory() {
    victoryOn = true;
    paused = true;
    const lines = [
      "심연의 수호자 네로스를 물리쳤습니다.",
      hero().name + " · Lv." + level + " · " + gold + " 골드",
      bossCleared ? "별빛이 다시 마을을 비춥니다." : "",
    ];
    $("victory-text").textContent = lines.filter(Boolean).join(" ");
    $("modal-victory").classList.remove("hidden");
    $("modal-levelup").classList.add("hidden");
    writeSave();
    syncLayers();
  }

  function meleeBox() {
    const reach = 40;
    return {
      x: player.facing > 0 ? player.x + player.w - 4 : player.x - reach,
      y: player.y + 2,
      w: reach + 6,
      h: player.h,
    };
  }

  function doMelee(mult) {
    const hb = meleeBox();
    monsters.forEach((m) => {
      if (m.dead || player.hitSet.has(m)) return;
      if (!overlap(hb, m)) return;
      player.hitSet.add(m);
      damageMonster(m, player.atk * mult);
    });
  }

  function doSpin() {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    monsters.forEach((m) => {
      if (m.dead) return;
      const dx = m.x + m.w / 2 - cx;
      const dy = m.y + m.h / 2 - cy;
      if (dx * dx + dy * dy < 54 * 54) damageMonster(m, player.atk * 0.55, { noCrit: true, kb: 70, noStop: true });
    });
    burst(cx, cy, 8, "#d8fff4", 70, 0.25);
  }

  function doNova() {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    monsters.forEach((m) => {
      if (m.dead) return;
      const dx = m.x + m.w / 2 - cx;
      const dy = m.y + m.h / 2 - cy;
      if (dx * dx + dy * dy < 92 * 92) {
        damageMonster(m, player.atk * 3.3, { kb: 180 });
        m.stun = Math.max(m.stun, 0.85);
      }
    });
    rings.push({ x: cx, y: cy, r: 8, vr: 220, life: 0.45, color: "#fff6c8" });
    rings.push({ x: cx, y: cy, r: 4, vr: 140, life: 0.55, color: "#ffd0f0" });
    burst(cx, cy, 40, "#fff6c8", 220, 0.6);
    burst(cx, cy, 20, "#ffffff", 120, 0.45);
    shake = 0.85;
    flashScreen("#fff8e0", 0.7);
  }

  function burst(x, y, n, color, speed, life) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 380) particles.shift();
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.75);
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 15,
        life, max: life, color, size: 1 + (Math.random() * 2 | 0), g: 280,
      });
    }
  }

  function spawnFloater(x, y, text, color) {
    floaters.push({ x, y, vy: -32, text, color, life: 0.75 });
    if (floaters.length > 40) floaters.shift();
  }

  function registerCombo() {
    const now = performance.now();
    if (now - lastComboAt > 1500) combo = 0;
    combo++;
    lastComboAt = now;
  }

  function moveActor(body, dt, gravity) {
    if (gravity) {
      body.vy += GRAVITY * dt;
      if (body.vy > MAX_FALL) body.vy = MAX_FALL;
    }
    body.x += body.vx * dt;
    resolveX(body);
    const prevBottom = body.y + body.h;
    body.y += body.vy * dt;
    body.onGround = false;
    resolveY(body, prevBottom);
    if (body.x < 0) { body.x = 0; if (body.vx < 0) body.vx = 0; }
    if (body.x + body.w > map.width) { body.x = map.width - body.w; if (body.vx > 0) body.vx = 0; }
  }

  function resolveX(body) {
    for (const p of map.platforms) {
      if (p.oneWay || !overlap(body, p)) continue;
      if (body.y + body.h <= p.y + 5) continue;
      if (body.x + body.w / 2 < p.x + p.w / 2) body.x = p.x - body.w;
      else body.x = p.x + p.w;
      body.vx = 0;
    }
  }

  function resolveY(body, prevBottom) {
    for (const p of map.platforms) {
      if (!overlap(body, p)) continue;
      if (body.vy >= 0 && prevBottom <= p.y + 12) {
        body.y = p.y - body.h;
        body.vy = 0;
        body.onGround = true;
      } else if (!p.oneWay && body.vy < 0) {
        body.y = p.y + p.h;
        body.vy = 0;
      }
    }
  }

  function updatePlayer(dt) {
    player.atkCd = Math.max(0, player.atkCd - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.controlLock = Math.max(0, player.controlLock - dt);
    player.sinceHit += dt;
    player.stateT += dt;
    for (let i = 0; i < skillCd.length; i++) skillCd[i] = Math.max(0, skillCd[i] - dt);
    if (player.sinceHit > 4 && player.hp < player.hpMax) player.hp = Math.min(player.hpMax, player.hp + 2.1 * dt);
    player.mp = Math.min(player.mpMax, player.mp + (3.2 + level * 0.12) * dt);

    if (player.state === "attack" && player.stateT >= player.atkDur) player.state = player.onGround ? "idle" : "fall";
    if (player.state === "hurt" && player.stateT >= 0.26) player.state = "idle";
    if (player.state === "dash" && player.stateT >= 0.17) player.state = player.onGround ? "idle" : "fall";
    if (player.state === "spin" && player.stateT >= 0.56) player.state = player.onGround ? "idle" : "fall";
    if (player.state === "cast" && player.stateT >= 0.28) player.state = player.onGround ? "idle" : "fall";
    if (player.state === "nova") {
      if (!player.novaBoom && player.stateT >= 0.28) { player.novaBoom = true; doNova(); }
      if (player.stateT >= 0.52) player.state = player.onGround ? "idle" : "fall";
    }

    const ax = axisX();
    if (canAct() && Math.abs(ax) > 0.2) player.facing = Math.sign(ax);
    attackQueue = Math.max(0, attackQueue - dt);
    if ((attackHeld() || attackQueue > 0) && player.atkCd <= 0 && canAct()) {
      attackQueue = 0;
      startAttack();
    }
    jumpBuffer = Math.max(0, jumpBuffer - dt);
    tryJump(false);

    if (player.state === "dash") {
      player.vx = player.facing * 330;
      player.invuln = Math.max(player.invuln, 0.05);
      if ((animClock * 20 | 0) % 2 === 0) {
        ghosts.push({ x: player.x, y: player.y, facing: player.facing, life: 0.18, state: "dash", frame: (animClock * 12) | 0 });
      }
      const hb = { x: player.x - 6, y: player.y + 2, w: player.w + 12, h: player.h };
      monsters.forEach((m) => {
        if (m.dead || player.hitSet.has(m) || !overlap(hb, m)) return;
        player.hitSet.add(m);
        damageMonster(m, player.atk * 1.4);
      });
    } else if (player.controlLock > 0) {
      player.vx *= Math.max(0, 1 - dt * 3);
    } else {
      let move = ax * player.speed;
      if (player.state === "attack" || player.state === "spin" || player.state === "nova" || player.state === "cast") move *= 0.28;
      const accel = (player.onGround ? 1700 : 820) * dt;
      const diff = move - player.vx;
      if (Math.abs(diff) <= accel) player.vx = move;
      else player.vx += Math.sign(diff) * accel;
      if (player.onGround && Math.abs(ax) < 0.1) player.vx *= Math.max(0, 1 - dt * 10);
    }

    if (!jumpHeld() && player.vy < 0 && !player.jumpCut && player.state !== "hurt") {
      player.vy *= 0.7;
      player.jumpCut = true;
    }

    const wasGround = player.onGround;
    const prevVy = player.vy;
    moveActor(player, dt, true);
    if (!wasGround && player.onGround && prevVy > 180) {
      Audio().sfx("land");
      burst(player.x + player.w / 2, player.y + player.h, 4, "#e7d2b0", 30, 0.2);
    }
    if (player.onGround) player.coyote = 0.1;
    else player.coyote = Math.max(0, player.coyote - dt);

    if (player.state === "attack") {
      const u = player.stateT / player.atkDur;
      if (u > 0.22 && u < 0.62) doMelee(heroId === "male" ? 1.12 : 1);
    }
    if (player.state === "spin") {
      player.spinTick -= dt;
      if (player.spinTick <= 0) { player.spinTick = 0.1; doSpin(); }
      rings.push({ x: player.x + player.w / 2, y: player.y + 14, r: 16 + Math.random() * 8, vr: 40, life: 0.18, color: "#e8fff8" });
    }

    if (canAct()) {
      if (!player.onGround) player.state = player.vy < 40 ? "jump" : "fall";
      else player.state = Math.abs(player.vx) > 22 ? "walk" : "idle";
    }

    const lava = map.lava.find((l) => overlap(player, l));
    if (lava) hurtPlayer(lava.dmg, player.x + (player.facing > 0 ? 30 : -10));

    if (player.y > WORLD_H + 20) {
      player.hp = 0;
      die();
    }
  }

  function updateMonster(m, dt) {
    if (m.dead) return;
    m.flash = Math.max(0, m.flash - dt);
    m.touchCd = Math.max(0, m.touchCd - dt);
    m.anim += dt;
    if (m.stun > 0) {
      m.stun -= dt;
      m.vx *= Math.max(0, 1 - dt * 4);
      if (!m.flying) moveActor(m, dt, true);
      return;
    }
    const pcx = player.x + player.w / 2;
    const mcx = m.x + m.w / 2;
    const dist = Math.abs(pcx - mcx);
    const dir = pcx < mcx ? -1 : 1;
    const home = m.homeX || m.x;
    const stray = Math.abs(m.x - home) > 340 && dist > 110;
    if (m.type !== "boss" && (player.dead || stray)) {
      const back = home - m.x;
      m.facing = back < 0 ? -1 : 1;
      m.vx = Math.abs(back) < 8 ? 0 : m.facing * 70;
      m.vy = m.flying ? 0 : m.vy;
      if (!m.flying) moveActor(m, dt, true);
      else m.x += m.vx * dt;
      return;
    }
    if (m.type === "boss") updateBoss(m, dt, dist, dir);
    else if (m.type === "slime") updateSlime(m, dt, dist, dir);
    else if (m.type === "mushroom") updateMushroom(m, dt, dist, dir);
    else if (m.type === "wolf") updateWolf(m, dt, dist, dir);
    else if (m.type === "golem") updateGolem(m, dt, dist, dir);
    else if (m.type === "bat") updateBat(m, dt, dist, dir);
    else if (m.type === "imp") updateImp(m, dt, dist, dir);

    if (!m.flying) moveActor(m, dt, true);
    else {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      const floor = standY(m.x + m.w / 2) - m.h - 8;
      if (m.y > floor) m.y = floor;
      if (m.x < 8) m.x = 8;
      if (m.x + m.w > map.width - 8) m.x = map.width - 8 - m.w;
    }
    if (!m.flying) {
      if (m.x < 8) m.facing = 1;
      if (m.x + m.w > map.width - 8) m.facing = -1;
    }
    if (!player.dead && m.touchCd <= 0 && overlap(m, player)) {
      const justHit = player.hitSet && player.hitSet.has(m);
      if (!justHit) hurtPlayer(m.atk, mcx);
      m.touchCd = 0.75;
    }
  }

  function updateSlime(m, dt, dist, dir) {
    m.aiT -= dt;
    if (m.onGround) m.vx *= Math.max(0, 1 - dt * 3);
    if (m.aiT <= 0) {
      m.aiT = 0.85 + Math.random() * 0.5;
      m.facing = dist < 180 ? dir : (Math.random() < 0.5 ? -1 : 1);
      m.vx = m.facing * (dist < 180 ? 78 : 42);
      if (m.onGround) m.vy = dist < 180 ? -250 : -210;
    }
  }

  function updateMushroom(m, dt, dist, dir) {
    m.facing = dist < 200 ? dir : m.facing;
    m.vx = m.facing * 32;
    m.shotCd -= dt;
    if (dist < 190 && m.shotCd <= 0 && m.onGround) {
      m.shotCd = 1.7;
      shots.push({
        friendly: false, kind: "spore", x: m.x + m.w / 2, y: m.y + 6, w: 10, h: 10,
        vx: m.facing * 110, vy: -160, life: 2.2, dmg: m.atk, gravity: true, dieOnGround: true,
      });
    }
  }

  function updateWolf(m, dt, dist, dir) {
    if (dist < 210) {
      m.facing = dir;
      m.vx = dir * BESTIARY.wolf.run;
    } else {
      m.aiT -= dt;
      if (m.aiT <= 0) { m.aiT = 1.4; m.facing *= -1; }
      m.vx = m.facing * BESTIARY.wolf.speed;
    }
  }

  function updateGolem(m, dt, dist, dir) {
    m.slamCd -= dt;
    if (m.windup > 0) {
      m.windup -= dt;
      m.vx = 0;
      m.mode = "slam";
      m.flash = 0.05;
      if (m.windup <= 0) {
        shockwave(m, -1);
        shockwave(m, 1);
        if (dist < 62) hurtPlayer(m.atk * 1.2, m.x + m.w / 2);
        shake = Math.min(1, shake + 0.35);
        Audio().sfx("hit");
      }
      return;
    }
    m.mode = "idle";
    if (dist < 170) { m.facing = dir; m.vx = dir * 30; }
    else m.vx *= Math.max(0, 1 - dt * 2);
    if (dist < 48 && m.slamCd <= 0) { m.windup = 0.5; m.slamCd = 2.8; }
  }

  function updateBat(m, dt, dist, dir) {
    m.shotCd -= dt;
    const hover = m.homeY + Math.sin(animClock * 2 + m.phase) * 10;
    if (dist < 170 && m.shotCd <= 0) {
      m.shotCd = 1.3;
      m.vx = dir * 90;
      m.vy = 70;
    } else {
      m.vx *= Math.max(0, 1 - dt * 2);
      m.vy += (hover - m.y) * dt * 2;
    }
    m.facing = dir;
  }

  function updateImp(m, dt, dist, dir) {
    const hover = m.homeY + Math.sin(animClock * 3 + m.phase) * 8;
    m.vy += (hover - m.y) * dt * 2.2;
    const prefer = 100;
    if (dist < prefer) m.vx = -dir * 70;
    else if (dist < 230) m.vx = dir * 55;
    else m.vx *= Math.max(0, 1 - dt * 2);
    m.facing = dir;
    m.shotCd -= dt;
    if (dist < 250 && m.shotCd <= 0) {
      m.shotCd = 1.45;
      const dx = player.x - m.x;
      const dy = (player.y + 8) - m.y;
      const len = Math.hypot(dx, dy) || 1;
      shots.push({
        friendly: false, kind: "fire", x: m.x + m.w / 2, y: m.y + 8, w: 10, h: 10,
        vx: dx / len * 130, vy: dy / len * 130, life: 2.4, dmg: m.atk,
      });
    }
  }

  function updateBoss(m, dt, dist, dir) {
    const ratio = m.hp / m.hpMax;
    if (!m.p2 && ratio < 0.62) {
      m.p2 = true;
      toast("네로스가 분노합니다!");
      Audio().sfx("roar");
      shake = 0.7;
      flashScreen("#ff3a4a", 0.35);
    }
    if (!m.p3 && ratio < 0.32) {
      m.p3 = true;
      toast("네로스가 광폭해집니다!");
      Audio().sfx("roar");
      summonAdds(m);
      shake = 0.8;
    }
    m.facing = dir;
    m.slamCd -= dt;
    m.shotCd -= dt;
    if (m.windup > 0) {
      m.windup -= dt;
      m.vx = 0;
      m.mode = "slam";
      if (m.windup <= 0) {
        shockwave(m, -1);
        shockwave(m, 1);
        if (dist < 78) hurtPlayer(m.atk * 1.25, m.x + m.w / 2);
        shake = 0.6;
        Audio().sfx("hit");
        m.mode = "idle";
      }
      return;
    }
    if (dist < 58 && m.slamCd <= 0) {
      m.windup = m.p3 ? 0.36 : 0.52;
      m.slamCd = m.p3 ? 2.1 : 3.1;
      m.mode = "slam";
      return;
    }
    m.mode = dist < 50 ? "attack" : "idle";
    const speed = m.p3 ? 86 : m.p2 ? 66 : 48;
    m.vx = dist < 34 ? 0 : dir * speed;
    if (m.shotCd <= 0 && dist > 36 && dist < 320) {
      const n = m.p3 ? 5 : m.p2 ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const spreadY = (i - (n - 1) / 2) * 28;
        const dx = player.x - m.x;
        const dy = (player.y + spreadY) - (m.y + 16);
        const len = Math.hypot(dx, dy) || 1;
        shots.push({
          friendly: false, kind: "dark", x: m.x + m.w / 2, y: m.y + 18, w: 12, h: 12,
          vx: dx / len * 150, vy: dy / len * 150, life: 2.6, dmg: Math.round(m.atk * 0.85),
        });
      }
      m.shotCd = m.p3 ? 1.05 : 1.65;
    }
  }

  function shockwave(m, dir) {
    const y = standY(m.x + m.w / 2) - 14;
    shots.push({
      friendly: false, kind: "shock", x: m.x + m.w / 2, y, w: 18, h: 12,
      vx: dir * 170, vy: 0, life: 0.85, dmg: Math.round(m.atk * 0.9),
    });
  }

  function summonAdds(m) {
    const live = monsters.filter((x) => !x.dead).length;
    if (live > 8) return;
    monsters.push(spawnMonster("slime", m.x - 30));
    monsters.push(spawnMonster("imp", m.x + m.w + 10));
    toast("부하가 소환되었습니다!");
  }

  function updateShots(dt) {
    for (let i = shots.length - 1; i >= 0; i--) {
      const p = shots[i];
      if (p.gravity) p.vy += 520 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.dieOnGround) {
        const gy = standY(p.x);
        if (p.vy > 0 && p.y + p.h >= gy) p.life = 0;
      }
      if (p.kind === "wave" && Math.random() < 0.45) {
        burst(p.x + 12, p.y + 12, 2, "#fff6c0", 40, 0.25);
      }
      if (p.friendly) {
        monsters.forEach((m) => {
          if (m.dead || (p.hit && p.hit.has(m))) return;
          if (!overlap(p, m)) return;
          if (p.hit) p.hit.add(m);
          damageMonster(m, p.dmg);
          if (!p.pierce) p.life = 0;
        });
      } else if (overlap(p, player)) {
        hurtPlayer(p.dmg, p.x);
        p.life = 0;
      }
      if (p.x < -40 || p.x > map.width + 40 || p.life <= 0) shots.splice(i, 1);
    }
  }

  function updateDrops(dt) {
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.life -= dt;
      d.vy += 780 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      const gy = standY(d.x + 4);
      if (d.y + d.h > gy && d.vy > 0) {
        d.y = gy - d.h;
        d.vy *= -0.35;
        d.vx *= 0.7;
        if (Math.abs(d.vy) < 40) d.vy = 0;
      }
      const dx = px - (d.x + 4);
      const dy = py - (d.y + 4);
      const dist = Math.hypot(dx, dy);
      if (dist < 78 && !player.dead) {
        d.x += (dx / dist) * 200 * dt;
        d.y += (dy / dist) * 200 * dt;
      }
      if (dist < 16 && !player.dead) {
        collectDrop(d);
        drops.splice(i, 1);
        continue;
      }
      if (d.life <= 0) drops.splice(i, 1);
    }
    if (drops.length > 40) {
      const old = drops.shift();
      if (old.type === "coin") gold += old.val;
    }
  }

  function collectDrop(d) {
    if (d.type === "coin") {
      gold += d.val;
      Audio().sfx("coin");
      spawnFloater(d.x, d.y, "+" + d.val + " 골드", "#ffe08a");
    } else if (potions[d.type] < 5) {
      potions[d.type]++;
      toast((d.type === "hp" ? "체력 물약" : "마나 물약") + " +1");
      Audio().sfx("heal");
    } else if (d.type === "hp") {
      player.hp = Math.min(player.hpMax, player.hp + Math.round(player.hpMax * 0.3));
      Audio().sfx("heal");
    } else {
      player.mp = Math.min(player.mpMax, player.mp + Math.round(player.mpMax * 0.3));
      Audio().sfx("heal");
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life -= dt;
      r.r += r.vr * dt;
      if (r.life <= 0) rings.splice(i, 1);
    }
    for (let i = arcs.length - 1; i >= 0; i--) {
      arcs[i].life -= dt;
      if (arcs[i].life <= 0) arcs.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].life -= dt;
      if (ghosts[i].life <= 0) ghosts.splice(i, 1);
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.life -= dt;
      f.y += f.vy * dt;
      if (f.life <= 0) floaters.splice(i, 1);
    }
  }

  function updateAmbients(dt) {
    ambients.forEach((a) => {
      a.p += dt;
      a.x += Math.sin(a.p * a.s) * 12 * dt;
      a.y += Math.cos(a.p * 1.3) * 10 * dt;
    });
  }

  function updateCamera(dt) {
    if (!player || !map) return;
    const look = player.facing * 24;
    let tx = player.x + player.w / 2 - viewW * 0.4 + look;
    let ty = player.y + player.h * 0.3 - viewH * 0.62;
    if (viewW >= map.width) tx = (map.width - viewW) / 2;
    else tx = clamp(tx, 0, map.width - viewW);
    if (viewH >= WORLD_H) ty = (WORLD_H - viewH) * 0.42;
    else ty = clamp(ty, 0, WORLD_H - viewH);
    if (snapCam) { camX = tx; camY = ty; snapCam = false; return; }
    const k = 1 - Math.pow(0.0015, dt);
    camX += (tx - camX) * Math.min(1, k);
    camY += (ty - camY) * Math.min(1, k);
  }

  function nearestInteract() {
    if (!player || !map || player.dead) return null;
    const cx = player.x + player.w / 2;
    const feet = player.y + player.h;
    if (map.portalX) {
      const py = standY(map.portalX);
      if (Math.abs(cx - map.portalX) < 30 && Math.abs(feet - py) < 28) return { kind: "portal", label: "입장" };
    }
    if (map.shopX) {
      const sy = standY(map.shopX);
      if (Math.abs(cx - map.shopX) < 32 && Math.abs(feet - sy) < 30) return { kind: "shop", label: "상점" };
    }
    if (map.chest && !map.chest.open) {
      if (Math.abs(cx - map.chest.x) < 28 && Math.abs(feet - map.chest.y) < 26) return { kind: "chest", label: "열기" };
    }
    return null;
  }

  function interact() {
    const it = nearestInteract();
    if (!it || !gameplay()) return;
    if (it.kind === "portal") {
      if (stageIndex >= MAPS.length - 1) return;
      Audio().sfx("portal");
      grantClear();
      const next = stageIndex + 1;
      if (unlocked < next) unlocked = next;
      fadeTo(() => loadStage(next));
    } else if (it.kind === "shop") openShop("play");
    else if (it.kind === "chest") openChest();
  }

  function openChest() {
    if (!map.chest || map.chest.open) return;
    map.chest.open = true;
    const g = map.chest.gold;
    gold += g;
    const pot = map.chest.potion;
    if (potions[pot] < 5) potions[pot]++;
    Audio().sfx("coin");
    toast("상자에서 " + g + " 골드와 물약을 찾았습니다");
    burst(map.chest.x, map.chest.y - 10, 16, "#ffe08a", 100, 0.45);
    writeSave();
  }

  function ensureChest() {
    const def = MAPS[stageIndex];
    if (!def.chestX) { map.chest = null; return; }
    map.chest = { x: def.chestX, y: standY(def.chestX), open: false, gold: 28 + stageIndex * 18, potion: stageIndex % 2 ? "mp" : "hp" };
  }

  function updatePlay(dt) {
    if (player.dead) {
      deadTimer -= dt;
      updateParticles(dt);
      animClock += dt;
      monsters.forEach((m) => updateMonster(m, dt));
      if (deadTimer <= 0) respawn();
      return;
    }
    if (paused || shopOn || mapOn || victoryOn || confirmOn) return;
    if (busy > 0) {
      busy -= dt;
      animClock += dt;
      updateParticles(dt);
      updateAmbients(dt);
      if (busy <= 0) {
        $("modal-levelup").classList.add("hidden");
        bannerSkills = [];
        playedLevel = false;
        const q = busyQueue.splice(0, busyQueue.length);
        q.forEach((fn) => fn());
      }
      return;
    }
    animClock += dt;
    updatePlayer(dt);
    if (player.dead) return;
    monsters.forEach((m) => updateMonster(m, dt));
    separateMonsters(dt);
    updateShots(dt);
    updateDrops(dt);
    updateParticles(dt);
    updateAmbients(dt);
    if (!map.chest && MAPS[stageIndex].chestX) ensureChest();
    if (map.chest && !map.chest.open) {
      const cx = player.x + player.w / 2;
      if (Math.abs(cx - map.chest.x) < 26 && Math.abs(player.y + player.h - map.chest.y) < 24) openChest();
    }
    saveTick += dt;
    if (saveTick > 5) { saveTick = 0; writeSave(); }
    if (performance.now() - lastComboAt > 1500) combo = 0;
  }

  function separateMonsters() {
    for (let i = 0; i < monsters.length; i++) {
      for (let j = i + 1; j < monsters.length; j++) {
        const a = monsters[i], b = monsters[j];
        if (a.dead || b.dead || a.flying || b.flying) continue;
        if (!overlap(a, b)) continue;
        const push = a.x <= b.x ? -1 : 1;
        a.x += push * 0.4;
        b.x -= push * 0.4;
      }
    }
  }

  function fillEllipse(ctx, cx, cy, rx, ry, color) {
    if (rx <= 0 || ry <= 0) return;
    ctx.fillStyle = color;
    cx = Math.round(cx); cy = Math.round(cy);
    const rxi = Math.max(1, Math.round(rx));
    const ryi = Math.max(1, Math.round(ry));
    for (let y = -ryi; y <= ryi; y++) {
      const v = 1 - (y / ryi) * (y / ryi);
      if (v <= 0) continue;
      const hw = Math.max(1, Math.round(rxi * Math.sqrt(v)));
      ctx.fillRect(cx - hw, cy + y, hw * 2, 1);
    }
  }

  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
    const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return "rgb(" + r + "," + g + "," + bl + ")";
  }

  function renderBackdrop(title) {
    const th = THEMES.meadow;
    drawSky(th);
    drawMountains(th, title ? titleT * 8 : camX);
    const ground = viewH - 24;
    octx.fillStyle = "#2f7a34";
    octx.fillRect(0, ground, viewW, 6);
    octx.fillStyle = "#8a5a34";
    octx.fillRect(0, ground + 6, viewW, 30);
    octx.fillStyle = "#8ee07a";
    octx.fillRect(0, ground, viewW, 2);
    if (!title) return;
    const male = Art().getHero("male", "idle", (titleT * 4) % 4 | 0);
    const female = Art().getHero("female", "walk", (titleT * 10) % 6 | 0);
    const slime = Art().getMonster("slime", (titleT * 6) % 4 | 0);
    const hop = Math.abs(Math.sin(titleT * 3)) * 8;
    blitSprite(slime, viewW * 0.58, ground - hop, 1, false);
    blitSprite(male, viewW * 0.72, ground, 1, false);
    blitSprite(female, viewW * 0.86, ground, -1, false);
  }

  function drawSky(th) {
    for (let y = 0; y < viewH; y += 2) {
      octx.fillStyle = mix(th.sky[0], th.sky[1], y / viewH);
      octx.fillRect(0, y, viewW, 2);
    }
    if (th.stars) {
      octx.fillStyle = "#fff";
      for (let i = 0; i < 28; i++) {
        const sx = (hash(i, 2) % viewW + animClock * 4) % viewW;
        const sy = hash(i, 5) % Math.floor(viewH * 0.55);
        octx.fillRect(sx, sy, 1 + (hash(i, 1) & 1), 1);
      }
    }
    if (th.sun) {
      fillEllipse(octx, viewW * 0.78, 36, 14, 14, th.sun);
    }
  }

  function drawMountains(th, scroll) {
    octx.fillStyle = th.far;
    for (let x = 0; x < viewW; x += 3) {
      const wx = x + scroll * 0.25;
      const h = 28 + Math.abs(Math.sin(wx * 0.02)) * 34 + Math.abs(Math.sin(wx * 0.008 + 1)) * 18;
      octx.fillRect(x, Math.floor(viewH * 0.42 - h), 3, h + 40);
    }
    octx.fillStyle = th.near;
    for (let x = 0; x < viewW; x += 3) {
      const wx = x + scroll * 0.45;
      const h = 16 + Math.abs(Math.sin(wx * 0.03 + 2)) * 26;
      octx.fillRect(x, Math.floor(viewH * 0.58 - h), 3, h + 30);
    }
  }

  function renderWorld() {
    const th = theme();
    const shx = shake > 0.03 ? (Math.random() - 0.5) * shake * 6 : 0;
    const shy = shake > 0.03 ? (Math.random() - 0.5) * shake * 4 : 0;
    drawCamX = Math.round(camX + shx);
    drawCamY = Math.round(camY + shy);
    drawSky(th);
    drawMountains(th, drawCamX);
    const cloud = Art().getProp("cloud", 0);
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 180 - drawCamX * 0.2) % (viewW + 80) + viewW + 80) % (viewW + 80) - 40;
      octx.globalAlpha = 0.9;
      octx.drawImage(cloud.img, cx, 18 + (i % 3) * 10);
      octx.globalAlpha = 1;
    }
    octx.drawImage(map.cache, -drawCamX, -drawCamY);
    map.lava.forEach((l) => {
      const x = Math.round(l.x - drawCamX);
      const y = Math.round(l.y - drawCamY);
      octx.fillStyle = "#c2410c";
      octx.fillRect(x, y, l.w, l.h);
      const wob = Math.sin(animClock * 6 + l.x) * 2;
      octx.fillStyle = "#ffb020";
      octx.fillRect(x, y + wob, l.w, 4);
      octx.fillStyle = "#fff1a0";
      octx.fillRect(x + 4, y + 2, 6, 2);
    });
    if (th.fog) {
      octx.fillStyle = "rgba(230,240,230," + th.fog + ")";
      octx.fillRect(0, Math.floor(viewH * 0.35), viewW, viewH);
    }
    if (map.portalX) drawPortal(map.portalX, standY(map.portalX));
    if (map.shopX) {
      const spr = Art().getProp("shop", 0);
      octx.drawImage(spr.img, Math.round(map.shopX - spr.ax - drawCamX), Math.round(standY(map.shopX) - spr.ay - drawCamY));
    }
    if (map.chest) {
      const spr = Art().getProp("chest", map.chest.open ? 1 : 0);
      octx.drawImage(spr.img, Math.round(map.chest.x - spr.ax - drawCamX), Math.round(map.chest.y - spr.ay - drawCamY));
    }

    ghosts.forEach((g) => {
      const spr = Art().getHero(heroId, "dash", g.frame);
      octx.globalAlpha = Math.max(0, g.life * 2);
      blitSprite(spr, g.x + player.w / 2 - drawCamX, g.y + player.h - drawCamY, g.facing, false);
      octx.globalAlpha = 1;
    });

    const queue = [];
    monsters.forEach((m) => { if (!m.dead) queue.push({ y: m.y + m.h, draw: () => drawMonster(m) }); });
    drops.forEach((d) => queue.push({ y: d.y + d.h, draw: () => drawDrop(d) }));
    if (!player.dead) queue.push({ y: player.y + player.h, draw: drawPlayer });
    queue.sort((a, b) => a.y - b.y);
    queue.forEach((item) => item.draw());

    shots.forEach(drawShot);
    arcs.forEach(drawArc);
    rings.forEach((r) => {
      octx.globalAlpha = Math.max(0, r.life * 2);
      octx.strokeStyle = r.color;
      octx.lineWidth = 2;
      octx.beginPath();
      octx.ellipse(r.x - drawCamX, r.y - drawCamY, Math.max(1, r.r), Math.max(1, r.r * 0.55), 0, 0, Math.PI * 2);
      octx.stroke();
      octx.globalAlpha = 1;
    });
    particles.forEach((p) => {
      octx.globalAlpha = Math.max(0, p.life / p.max);
      octx.fillStyle = p.color;
      octx.fillRect(Math.round(p.x - drawCamX), Math.round(p.y - drawCamY), p.size, p.size);
      octx.globalAlpha = 1;
    });
    ambients.forEach((a) => {
      const x = Math.round(a.x - drawCamX);
      const y = Math.round(a.y - drawCamY + Math.sin(a.p * 4) * 2);
      if (a.kind === "butterfly") {
        const wing = (Math.sin(a.p * 12) > 0) ? 3 : 1;
        octx.fillStyle = a.color;
        octx.fillRect(x - wing, y, wing, 2);
        octx.fillRect(x + 1, y, wing, 2);
        octx.fillStyle = "#241830";
        octx.fillRect(x, y, 1, 2);
      } else {
        octx.fillStyle = a.color;
        octx.globalAlpha = 0.5 + Math.sin(a.p * 5) * 0.4;
        octx.fillRect(x, y, 2, 2);
        octx.globalAlpha = 1;
      }
    });
    drawPortalArrow();
  }

  function drawPortal(x, y) {
    const pulse = 0.55 + Math.sin(animClock * 4) * 0.2;
    octx.fillStyle = "#6a4a28";
    octx.fillRect(Math.round(x - 14 - drawCamX), Math.round(y - 40 - drawCamY), 5, 40);
    octx.fillRect(Math.round(x + 8 - drawCamX), Math.round(y - 40 - drawCamY), 5, 40);
    octx.fillRect(Math.round(x - 16 - drawCamX), Math.round(y - 44 - drawCamY), 30, 6);
    octx.fillStyle = "rgba(120,220,255," + pulse + ")";
    fillEllipse(octx, x - drawCamX, y - 20 - drawCamY, 8, 14, octx.fillStyle);
    fillEllipse(octx, x - drawCamX, y - 20 - drawCamY, 3, 7, "#f4fdff");
  }

  function drawPortalArrow() {
    if (!map.portalX) return;
    const sx = map.portalX - drawCamX;
    if (sx > 12 && sx < viewW - 12) return;
    const x = clamp(sx, 12, viewW - 16);
    octx.fillStyle = "#ffe08a";
    octx.beginPath();
    if (sx >= viewW) {
      octx.moveTo(x, 28); octx.lineTo(x - 8, 22); octx.lineTo(x - 8, 34);
    } else {
      octx.moveTo(x, 28); octx.lineTo(x + 8, 22); octx.lineTo(x + 8, 34);
    }
    octx.fill();
  }

  function blitSprite(spr, centerX, feetY, facing, flash) {
    octx.save();
    octx.translate(Math.round(centerX), Math.round(feetY));
    octx.scale(facing < 0 ? -1 : 1, 1);
    octx.drawImage(flash ? spr.flash : spr.img, Math.round(-spr.ax), Math.round(-spr.ay));
    octx.restore();
  }

  function drawShadow(centerX, feetY, rw) {
    octx.fillStyle = "rgba(20,10,30,0.28)";
    fillEllipse(octx, centerX, feetY, rw, 3, "rgba(20,10,30,0.28)");
  }

  function drawPlayer() {
    const feet = player.y + player.h - drawCamY;
    const cx = player.x + player.w / 2 - drawCamX;
    drawShadow(cx, feet, player.onGround ? 10 : 7);
    const st = { idle: "idle", walk: "walk", jump: "jump", fall: "fall", attack: "attack", hurt: "hurt", dash: "dash", spin: "attack", nova: "cast", cast: "cast" }[player.state] || "idle";
    let frame = 0;
    if (player.state === "attack") frame = Math.min(4, (player.stateT * 16) | 0);
    else if (player.state === "spin") frame = (animClock * 18) | 0;
    else frame = animClock * (st === "walk" || st === "dash" ? 10 : 5);
    const spr = Art().getHero(heroId, st, frame | 0);
    const blink = player.invuln > 0 && ((animClock * 16) | 0) % 2 === 0;
    if (!blink) blitSprite(spr, cx, feet, player.facing, player.state === "hurt");
  }

  function drawMonster(m) {
    const feet = m.y + m.h - drawCamY;
    const cx = m.x + m.w / 2 - drawCamX;
    if (!m.flying) drawShadow(cx, m.onGround ? feet : standY(m.x) - drawCamY, m.w * 0.35);
    else drawShadow(cx, standY(m.x + m.w / 2) - drawCamY, 6);
    const frame = m.anim * (m.type === "bat" ? 8 : 6);
    const spr = Art().getMonster(m.type, frame | 0, m.mode || "idle");
    octx.save();
    if (m.elite) octx.translate(0, 0);
    blitSprite(spr, cx, feet, m.facing || 1, m.flash > 0);
    if (m.elite) {
      octx.globalAlpha = 0.28;
      blitSprite(spr, cx, feet, m.facing || 1, true);
      octx.globalAlpha = 1;
    }
    octx.restore();
    const bw = Math.max(16, m.w);
    const bx = Math.round(cx - bw / 2);
    const by = Math.round(feet - spr.img.height - 4);
    octx.fillStyle = "#241830";
    octx.fillRect(bx, by, bw, 3);
    octx.fillStyle = m.type === "boss" ? "#ff5a6a" : "#ff5a6a";
    octx.fillRect(bx, by, Math.max(0, bw * clamp(m.hp / m.hpMax, 0, 1)), 3);
  }

  function drawDrop(d) {
    if (d.life < 2 && (animClock * 8 | 0) % 2 === 0) return;
    const spr = Art().getDrop(d.type === "coin" ? "coin" : d.type, d.type === "coin" ? animClock * 8 : 0);
    octx.drawImage(spr.img, Math.round(d.x - drawCamX - 2), Math.round(d.y - drawCamY - 2));
  }

  function drawShot(p) {
    const x = Math.round(p.x - drawCamX);
    const y = Math.round(p.y - drawCamY);
    if (p.kind === "wave") {
      octx.save();
      octx.translate(x + 14, y + 12);
      octx.scale(p.vx >= 0 ? 1 : -1, 1);
      octx.lineCap = "round";
      octx.strokeStyle = "#ffffff";
      octx.lineWidth = 4;
      octx.beginPath();
      octx.arc(0, 0, 16, -1.25, 1.25);
      octx.stroke();
      octx.strokeStyle = "#ffd56a";
      octx.lineWidth = 2;
      octx.beginPath();
      octx.arc(-5, 0, 11, -1.15, 1.15);
      octx.stroke();
      octx.fillStyle = "#fffbe8";
      octx.fillRect(-3, -2, 10, 4);
      octx.restore();
    } else if (p.kind === "spore") {
      fillEllipse(octx, x + 4, y + 4, 4, 4, "#c6f08a");
    } else if (p.kind === "fire") {
      fillEllipse(octx, x + 4, y + 4, 4, 4, "#ff7a3a");
      fillEllipse(octx, x + 4, y + 4, 2, 2, "#ffe08a");
    } else if (p.kind === "dark") {
      fillEllipse(octx, x + 5, y + 5, 5, 5, "#7a4ad0");
      fillEllipse(octx, x + 5, y + 5, 2, 2, "#ff8ad8");
    } else if (p.kind === "shock") {
      octx.fillStyle = "#ffd0a0";
      octx.fillRect(x, y + 6, p.w, 4);
      octx.fillStyle = "#fff";
      octx.fillRect(x + 2, y + 4, 4, 3);
    }
  }

  function drawArc(a) {
    const t = 1 - a.life / a.max;
    octx.globalAlpha = a.life / a.max;
    octx.strokeStyle = "#fff8e0";
    octx.lineWidth = 2;
    octx.beginPath();
    const cx = a.x - drawCamX + a.dir * 8;
    const cy = a.y - drawCamY;
    const a0 = a.dir > 0 ? -2.2 + t * 2.4 : Math.PI + 2.2 - t * 2.4;
    const a1 = a0 + a.dir * 1.1;
    octx.arc(cx, cy, 16, Math.min(a0, a1), Math.max(a0, a1));
    octx.stroke();
    octx.globalAlpha = 1;
  }

  function renderFloaters() {
    vctx.save();
    vctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    vctx.font = '800 15px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';
    vctx.textAlign = "center";
    vctx.lineWidth = 3;
    floaters.forEach((f) => {
      const x = (f.x - drawCamX) / viewW * cssW;
      const y = (f.y - drawCamY) / viewH * cssH;
      vctx.globalAlpha = clamp(f.life * 1.6, 0, 1);
      vctx.strokeStyle = "#241830";
      vctx.fillStyle = f.color;
      vctx.strokeText(f.text, x, y);
      vctx.fillText(f.text, x, y);
    });
    if (map && map.portalX) {
      const sx = map.portalX - drawCamX;
      if (sx <= 12 || sx >= viewW - 12) {
        const x = clamp(sx, 16, viewW - 16) / viewW * cssW;
        vctx.globalAlpha = 1;
        vctx.fillStyle = "#ffe08a";
        vctx.strokeStyle = "#241830";
        vctx.strokeText("포탈", x, 78);
        vctx.fillText("포탈", x, 78);
      }
    }
    vctx.restore();
  }

  function render() {
    if (mode === "title" || mode === "select") {
      octx.imageSmoothingEnabled = false;
      renderBackdrop(true);
      blit();
      drawCards();
      return;
    }
    if (!map || !player) return;
    octx.imageSmoothingEnabled = false;
    renderWorld();
    blit();
    renderFloaters();
    drawPortrait();
    syncHud();
  }

  function blit() {
    vctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    vctx.imageSmoothingEnabled = false;
    vctx.clearRect(0, 0, cssW, cssH);
    vctx.drawImage(off, 0, 0, cssW, cssH);
  }

  function drawCards() {
    [["pick-male", "male"], ["pick-female", "female"]].forEach(([id, gender]) => {
      const c = $(id);
      const g = c.getContext("2d");
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, c.width, c.height);
      const spr = Art().getHero(gender, "idle", (titleT * 4) % 4 | 0);
      const sc = 2;
      g.drawImage(spr.img, (c.width - spr.img.width * sc) / 2, c.height - spr.img.height * sc - 4, spr.img.width * sc, spr.img.height * sc);
    });
  }

  function drawPortrait() {
    pctx.imageSmoothingEnabled = false;
    pctx.clearRect(0, 0, 48, 48);
    const spr = Art().getHero(heroId, "idle", (animClock * 4) % 4 | 0);
    pctx.drawImage(spr.img, spr.ax - 22, spr.ay - 46, 44, 48, 2, 0, 44, 48);
  }

  function syncHud() {
    if (mode !== "play" || !player) return;
    $("pname").textContent = hero().name;
    $("plevel").textContent = "Lv." + level;
    $("hp-fill").style.width = (100 * player.hp / player.hpMax) + "%";
    $("mp-fill").style.width = (100 * player.mp / player.mpMax) + "%";
    const need = expNeed(level);
    $("exp-fill").style.width = (level >= MAX_LEVEL ? 100 : 100 * exp / need) + "%";
    $("hp-text").textContent = Math.ceil(player.hp) + "/" + player.hpMax;
    $("mp-text").textContent = Math.ceil(player.mp) + "/" + player.mpMax;
    $("exptext").textContent = level >= MAX_LEVEL ? "최대 레벨" : "경험치 " + exp + "/" + need;
    $("gold").textContent = gold + " 골드";
    $("stagename").textContent = map.name;
    $("objective").textContent = map.goal;
    $("progress-bar").style.width = (100 * clamp((player.x) / map.width, 0, 1)) + "%";
    $("vignette").classList.toggle("low", player.hp / player.hpMax < 0.3);
    $("php-count").textContent = String(potions.hp);
    $("pmp-count").textContent = String(potions.mp);
    $("btn-php").classList.toggle("empty", potions.hp <= 0);
    $("btn-pmp").classList.toggle("empty", potions.mp <= 0);
    const boss = monsters.find((m) => m.type === "boss" && !m.dead);
    $("boss-wrap").classList.toggle("hidden", !boss);
    if (boss) {
      $("boss-name").textContent = "심연의 수호자 네로스";
      $("boss-fill").style.width = (100 * clamp(boss.hp / boss.hpMax, 0, 1)) + "%";
      $("boss-text").textContent = Math.ceil(boss.hp) + "/" + boss.hpMax;
    }
    SKILLS.forEach((sk, i) => {
      const btn = $("skill-" + i);
      const locked = level < sk.level;
      btn.classList.toggle("locked", locked);
      btn.querySelector(".sub").textContent = locked ? "Lv" + sk.level : (skillCd[i] > 0 ? Math.ceil(skillCd[i]) : sk.mp + "MP");
    });
    const it = gameplay() ? nearestInteract() : null;
    interactKind = it && it.kind;
    const ib = $("btn-interact");
    if (it && it.kind !== "chest") {
      ib.textContent = it.label;
      ib.classList.remove("hidden");
    } else ib.classList.add("hidden");
    const comboEl = $("combo");
    if (combo >= 2 && performance.now() - lastComboAt < 1500) {
      comboEl.textContent = combo + "연속!";
      comboEl.classList.add("show");
    } else comboEl.classList.remove("show");
    $("btn-mute").textContent = Audio().muted ? "꺼짐" : "소리";
    $("btn-mute").setAttribute("aria-label", Audio().muted ? "소리 켜기" : "소리 끄기");
  }

  function syncLayers() {
    const showHud = mode === "play";
    $("hud").classList.toggle("hidden", !showHud);
    const showTouch = gameplay();
    $("touch").classList.toggle("hidden", !showTouch);
    $("screen-title").classList.toggle("hidden", mode !== "title");
    $("screen-select").classList.toggle("hidden", mode !== "select");
  }

  function resize() {
    const rect = $("app").getBoundingClientRect();
    cssW = Math.max(280, rect.width);
    cssH = Math.max(180, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const prevW = viewW;
    const prevH = viewH;
    view.width = Math.round(cssW * dpr);
    view.height = Math.round(cssH * dpr);
    const scale = Math.max(1, Math.round(cssH / 208));
    viewW = Math.max(180, Math.round(cssW / scale));
    viewH = Math.max(120, Math.round(cssH / scale));
    off.width = viewW;
    off.height = viewH;
    if (prevW && (Math.abs(viewW - prevW) > 12 || Math.abs(viewH - prevH) > 12)) snapCam = true;
  }

  function fadeTo(fn) {
    $("fade").classList.add("on");
    setTimeout(() => {
      fn();
      $("fade").classList.remove("on");
    }, 380);
  }

  function showTitle() {
    mode = "title";
    paused = false; shopOn = false; mapOn = false; victoryOn = false;
    $("modal-pause").classList.add("hidden");
    $("modal-shop").classList.add("hidden");
    $("modal-map").classList.add("hidden");
    $("modal-victory").classList.add("hidden");
    $("modal-death").classList.add("hidden");
    refreshTitle();
    Audio().playTrack("meadow");
    syncLayers();
  }

  function refreshTitle() {
    const save = readSave();
    const has = !!save;
    $("btn-start").classList.toggle("hidden", has);
    $("btn-continue").classList.toggle("hidden", !has);
    $("btn-new").classList.toggle("hidden", !has);
    if (has) {
      const h = HEROES[save.hero];
      $("save-summary").textContent = h.name + " · Lv." + save.level + " · " + MAPS[save.stage].name + (save.bossCleared ? " · 심연 정복" : "");
    } else $("save-summary").textContent = "기록을 남기며 성장하는 모험";
    $("btn-title-mute").textContent = Audio().muted ? "소리 꺼짐" : "소리 켜짐";
  }

  function startNew(gender) {
    freshProgress();
    heroId = gender;
    level = 1; exp = 0; gold = 0;
    potions = { hp: 1, mp: 1 };
    unlocked = 0; cleared = [0, 0, 0, 0]; bossCleared = false;
    makePlayer();
    mode = "play";
    kills = 0;
    skillCd.fill(0);
    loadStage(0);
    toast("오른쪽으로 이동해 몬스터를 처치하세요");
    syncLayers();
  }

  function continueGame() {
    const save = readSave();
    if (!save) { showTitle(); return; }
    applySave(save);
    makePlayer();
    if (save.hp > 0) player.hp = clamp(save.hp, 1, player.hpMax);
    if (save.mp > 0) player.mp = clamp(save.mp, 0, player.mpMax);
    mode = "play";
    kills = 0;
    skillCd.fill(0);
    loadStage(stageIndex);
    syncLayers();
  }

  function togglePause(force) {
    if (mode !== "play" || victoryOn || (player && player.dead)) return;
    if (shopOn || mapOn || confirmOn) return;
    paused = typeof force === "boolean" ? force : !paused;
    $("modal-pause").classList.toggle("hidden", !paused);
    if (paused) {
      releaseHold();
      fillSkillHelp();
      Audio().duck(0.01);
      writeSave();
    }
    syncLayers();
  }

  function fillSkillHelp() {
    const ul = $("skill-help");
    ul.replaceChildren();
    SKILLS.forEach((sk) => {
      const li = document.createElement("li");
      const on = level >= sk.level;
      li.textContent = sk.name + " · Lv." + sk.level + " · " + sk.desc + (on ? " (습득)" : "");
      if (on) li.className = "on";
      ul.appendChild(li);
    });
  }

  function openShop(from) {
    shopFrom = from || "play";
    shopOn = true;
    paused = true;
    $("modal-pause").classList.add("hidden");
    renderShop();
    $("modal-shop").classList.remove("hidden");
    releaseHold();
    syncLayers();
  }

  function closeShop() {
    shopOn = false;
    $("modal-shop").classList.add("hidden");
    if (shopFrom === "pause") {
      paused = true;
      $("modal-pause").classList.remove("hidden");
    } else paused = false;
    writeSave();
    syncLayers();
  }

  function renderShop() {
    $("shop-gold").textContent = "보유 " + gold + " 골드";
    const list = $("shop-list");
    list.replaceChildren();
    const atkRank = atkBonus / 3;
    const hpRank = hpBonus / 20;
    const items = [
      { id: "hp", name: "빨간 물약", desc: "사용 시 체력 45% · 보유 " + potions.hp + "/5", price: 20, off: potions.hp >= 5 },
      { id: "mp", name: "파란 물약", desc: "사용 시 마나 45% · 보유 " + potions.mp + "/5", price: 16, off: potions.mp >= 5 },
      { id: "atk", name: "힘의 반지", desc: "공격력 +3 (현재 +" + atkBonus + ")", price: 50 + atkRank * 40, off: atkBonus >= 15 },
      { id: "vit", name: "생명의 부적", desc: "최대 체력 +20 (현재 +" + hpBonus + ")", price: 50 + hpRank * 40, off: hpBonus >= 100 },
    ];
    items.forEach((it) => {
      const row = document.createElement("div");
      row.className = "item";
      const meta = document.createElement("div");
      const title = document.createElement("div");
      title.textContent = it.name;
      const sub = document.createElement("div");
      sub.className = "meta";
      sub.textContent = it.desc;
      meta.append(title, sub);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "buy";
      btn.textContent = it.off ? "최대" : it.price + "G";
      btn.disabled = it.off || gold < it.price;
      btn.addEventListener("pointerdown", (e) => { e.preventDefault(); buy(it.id, it.price); });
      row.append(meta, btn);
      list.appendChild(row);
    });
  }

  function buy(id, price) {
    if (gold < price) { toast("골드가 부족합니다"); Audio().sfx("deny"); return; }
    if (id === "hp" && potions.hp >= 5) return;
    if (id === "mp" && potions.mp >= 5) return;
    if (id === "atk" && atkBonus >= 15) return;
    if (id === "vit" && hpBonus >= 100) return;
    gold -= price;
    if (id === "hp") potions.hp++;
    else if (id === "mp") potions.mp++;
    else if (id === "atk") { atkBonus += 3; recalc(); }
    else if (id === "vit") { hpBonus += 20; recalc(); if (player) player.hp += 20; recalc(); }
    Audio().sfx("coin");
    toast("구매했습니다");
    renderShop();
    writeSave();
  }

  function openMap() {
    mapOn = true;
    paused = true;
    $("modal-pause").classList.add("hidden");
    const list = $("map-list");
    list.replaceChildren();
    MAPS.forEach((m, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "map-btn" + (cleared[i] ? " cleared" : "") + (i === stageIndex ? " current" : "");
      btn.disabled = i > unlocked;
      const name = document.createElement("div");
      name.textContent = (cleared[i] ? "★ " : "") + m.name + (i > unlocked ? " (잠김)" : "");
      const sub = document.createElement("span");
      sub.className = "sub";
      sub.textContent = m.rec + (i === stageIndex ? " · 현재 위치" : "");
      btn.append(name, sub);
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (i > unlocked) return;
        mapOn = false;
        paused = false;
        $("modal-map").classList.add("hidden");
        fadeTo(() => { mode = "play"; loadStage(i); syncLayers(); });
      });
      list.appendChild(btn);
    });
    $("modal-map").classList.remove("hidden");
    releaseHold();
    syncLayers();
  }

  function closeMap() {
    mapOn = false;
    $("modal-map").classList.add("hidden");
    paused = true;
    $("modal-pause").classList.remove("hidden");
    syncLayers();
  }

  function ask(text, yes) {
    confirmOn = true;
    confirmYes = yes;
    $("confirm-text").textContent = text;
    $("modal-confirm").classList.remove("hidden");
  }

  function closeConfirm(ok) {
    confirmOn = false;
    $("modal-confirm").classList.add("hidden");
    const fn = confirmYes;
    confirmYes = null;
    if (ok && fn) fn();
  }

  function knobHome() {
    const joyEl = $("joy");
    const knob = $("knob");
    const p = Math.max(0, Math.round((joyEl.clientWidth - knob.clientWidth) / 2));
    knob.style.left = p + "px";
    knob.style.top = p + "px";
    return p;
  }

  function releaseHold() {
    held.attack = false;
    held.jump = false;
    joy.active = false;
    joy.id = null;
    joy.x = 0;
    knobHome();
  }

  function toggleMute() {
    const a = Audio();
    a.setMuted(!a.muted);
    try { localStorage.setItem(MUTE_KEY, a.muted ? "1" : "0"); } catch (e) { /* ignore */ }
    $("btn-title-mute").textContent = a.muted ? "소리 꺼짐" : "소리 켜짐";
    if ($("btn-mute")) $("btn-mute").textContent = a.muted ? "꺼짐" : "소리";
  }

  function bindHold(el, down, up) {
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      Audio().unlock();
      down();
    });
    const release = () => up();
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
  }

  function bindUI() {
    document.addEventListener("pointerdown", () => Audio().unlock(), { passive: true });
    document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", (e) => {
      keys[e.code] = false;
      if (e.code === "KeyJ" || e.code === "KeyZ") held.attack = false;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW" || e.code === "KeyK") held.jump = false;
    });
    window.addEventListener("blur", () => { Object.keys(keys).forEach((k) => { keys[k] = false; }); releaseHold(); });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && mode === "play" && !paused && !victoryOn) togglePause(true);
      if (document.hidden) writeSave();
    });
    window.addEventListener("resize", resize);
    window.visualViewport && window.visualViewport.addEventListener("resize", resize);

    $("btn-start").addEventListener("pointerdown", (e) => { e.preventDefault(); Audio().unlock(); mode = "select"; syncLayers(); });
    $("btn-continue").addEventListener("pointerdown", (e) => { e.preventDefault(); Audio().unlock(); continueGame(); });
    $("btn-new").addEventListener("pointerdown", (e) => {
      e.preventDefault();
      ask("새 게임을 시작하면 기존 기록이 사라집니다.", () => { freshProgress(); mode = "select"; refreshTitle(); syncLayers(); });
    });
    $("btn-title-mute").addEventListener("pointerdown", (e) => { e.preventDefault(); toggleMute(); });
    $("btn-back").addEventListener("pointerdown", (e) => { e.preventDefault(); showTitle(); });
    $("btn-pick-male").addEventListener("pointerdown", (e) => { e.preventDefault(); Audio().sfx("ui"); startNew("male"); });
    $("btn-pick-female").addEventListener("pointerdown", (e) => { e.preventDefault(); Audio().sfx("ui"); startNew("female"); });
    $("btn-pause").addEventListener("pointerdown", (e) => { e.preventDefault(); togglePause(); });
    $("btn-mute").addEventListener("pointerdown", (e) => { e.preventDefault(); toggleMute(); });
    $("btn-resume").addEventListener("pointerdown", (e) => { e.preventDefault(); togglePause(false); });
    $("btn-restart").addEventListener("pointerdown", (e) => {
      e.preventDefault();
      paused = false;
      $("modal-pause").classList.add("hidden");
      if (player) { player.hp = player.hpMax; player.mp = player.mpMax; }
      fadeTo(() => loadStage(stageIndex));
    });
    $("btn-open-shop").addEventListener("pointerdown", (e) => { e.preventDefault(); openShop("pause"); });
    $("btn-open-map").addEventListener("pointerdown", (e) => { e.preventDefault(); openMap(); });
    $("btn-to-title").addEventListener("pointerdown", (e) => {
      e.preventDefault();
      ask("타이틀로 돌아갈까요? 진행 상황은 저장됩니다.", () => { writeSave(); showTitle(); });
    });
    $("btn-shop-close").addEventListener("pointerdown", (e) => { e.preventDefault(); closeShop(); });
    $("btn-map-close").addEventListener("pointerdown", (e) => { e.preventDefault(); closeMap(); });
    $("btn-vic-map").addEventListener("pointerdown", (e) => {
      e.preventDefault();
      victoryOn = false;
      $("modal-victory").classList.add("hidden");
      openMap();
    });
    $("btn-vic-title").addEventListener("pointerdown", (e) => { e.preventDefault(); writeSave(); showTitle(); });
    $("btn-yes").addEventListener("pointerdown", (e) => { e.preventDefault(); closeConfirm(true); });
    $("btn-no").addEventListener("pointerdown", (e) => { e.preventDefault(); closeConfirm(false); });
    $("btn-interact").addEventListener("pointerdown", (e) => { e.preventDefault(); interact(); });
    bindHold($("btn-attack"), () => { held.attack = true; }, () => { held.attack = false; });
    bindHold($("btn-jump"), () => { held.jump = true; queueJump(); }, () => { held.jump = false; });
    $("btn-php").addEventListener("pointerdown", (e) => { e.preventDefault(); usePotion("hp"); });
    $("btn-pmp").addEventListener("pointerdown", (e) => { e.preventDefault(); usePotion("mp"); });
    SKILLS.forEach((_, i) => {
      $("skill-" + i).addEventListener("pointerdown", (e) => { e.preventDefault(); trySkill(i); });
    });

    const joyEl = $("joy");
    const knob = $("knob");
    joyEl.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      joy.active = true;
      joy.id = e.pointerId;
      try { joyEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      moveJoy(e);
    });
    joyEl.addEventListener("pointermove", (e) => { if (e.pointerId === joy.id) moveJoy(e); });
    const endJoy = (e) => {
      if (e.pointerId !== joy.id && joy.id !== null) return;
      joy.active = false; joy.id = null; joy.x = 0;
      knobHome();
    };
    joyEl.addEventListener("pointerup", endJoy);
    joyEl.addEventListener("pointercancel", endJoy);
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  function moveJoy(e) {
    const rect = $("joy").getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const max = rect.width * 0.34;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    joy.x = dx / max;
    const knob = $("knob");
    const home = Math.max(0, (rect.width - knob.offsetWidth) / 2);
    knob.style.left = (home + dx * 0.72) + "px";
    knob.style.top = (home + dy * 0.72) + "px";
  }

  function onKey(e) {
    keys[e.code] = true;
    const prevent = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (prevent.indexOf(e.code) >= 0) e.preventDefault();
    Audio().unlock();
    if (e.repeat) return;
    if (e.code === "Escape") {
      if (confirmOn) { closeConfirm(false); return; }
      if (shopOn) { closeShop(); return; }
      if (mapOn) { closeMap(); return; }
      if (mode === "select") { showTitle(); return; }
      if (mode === "play") togglePause();
      return;
    }
    if (e.code === "KeyM") { toggleMute(); return; }
    if (!gameplay()) return;
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW" || e.code === "KeyK") { held.jump = true; queueJump(); }
    if (e.code === "KeyJ" || e.code === "KeyZ") { held.attack = true; attackQueue = 0.28; }
    if (e.code === "Digit1" || e.code === "KeyU") trySkill(0);
    if (e.code === "Digit2" || e.code === "KeyI") trySkill(1);
    if (e.code === "Digit3" || e.code === "KeyO") trySkill(2);
    if (e.code === "Digit4" || e.code === "KeyL") trySkill(3);
    if (e.code === "KeyQ") usePotion("hp");
    if (e.code === "KeyE") usePotion("mp");
    if (e.code === "KeyF" || e.code === "Enter") interact();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - (loop.last || now)) / 1000);
    loop.last = now;
    if (hitstop > 0) {
      hitstop -= dt;
      render();
      requestAnimationFrame(loop);
      return;
    }
    if (mode === "title" || mode === "select") titleT += dt;
    else updatePlay(dt);
    shake = Math.max(0, shake - dt * 1.6);
    updateCamera(dt);
    render();
    requestAnimationFrame(loop);
  }

  function drawPreview() {
    document.body.style.position = "static";
    document.body.style.overflow = "auto";
    view.style.position = "relative";
    const W = 1200, H = 2200;
    view.style.width = W + "px";
    view.style.height = H + "px";
    view.width = W; view.height = H;
    const ctx = view.getContext("2d");
    ctx.fillStyle = "#79c8f2";
    ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;
    let y = 12;
    Art().catalog.forEach((group) => {
      ctx.fillStyle = "#241830";
      ctx.font = "14px sans-serif";
      ctx.fillText(group.label, 8, y + 12);
      y += 18;
      let x = 8;
      let row = 0;
      group.frames.forEach((fr) => {
        const sc = 3;
        const w = fr.img.width * sc;
        const h = fr.img.height * sc;
        if (x + w > W - 8) { x = 8; y += row + 8; row = 0; }
        ctx.drawImage(fr.img, x, y, w, h);
        row = Math.max(row, h);
        x += w + 8;
      });
      y += row + 22;
    });
  }

  function boot() {
    try { localStorage.getItem(MUTE_KEY) === "1" && Audio().setMuted(true); } catch (e) { /* ignore */ }
    resize();
    Art().init();
    if (new URLSearchParams(location.search).has("preview")) {
      drawPreview();
      return;
    }
    bindUI();
    refreshTitle();
    syncLayers();
    requestAnimationFrame(loop);
    window.__LUMINA = {
      snapshot() {
        return {
          mode, hero: heroId, level, exp, gold, stage: stageIndex, unlocked,
          hp: player && Math.round(player.hp),
          mp: player && Math.round(player.mp),
          hpMax: player && player.hpMax,
          x: player && Math.round(player.x),
          y: player && Math.round(player.y),
          facing: player && player.facing,
          state: player && player.state,
          skills: SKILLS.map((s) => level >= s.level),
          skillCd: skillCd.slice(),
          monsters: monsters.filter((m) => !m.dead).length,
          kills,
          bossHp: (monsters.find((m) => m.type === "boss" && !m.dead) || {}).hp || 0,
          potions: { ...potions },
          bossCleared,
        };
      },
      debug: {
        exp(n) { if (player) gainExp(n); },
        stage(i) { if (player) { mode = "play"; loadStage(i); syncLayers(); } },
        gold(n) { gold += n; },
        x(n) { if (player) { player.x = n; snapCam = true; } },
      },
    };
  }

  boot();
})();
