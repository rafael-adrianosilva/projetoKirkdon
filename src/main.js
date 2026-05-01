(function () {
  const data = window.KIRKDON_DATA;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const intro = document.getElementById("intro");
  const nameInput = document.getElementById("playerName");
  const startButton = document.getElementById("startGame");
  const starterGrid = document.getElementById("starterGrid");
  const saveGrid = document.getElementById("saveGrid");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const gameWrap = document.querySelector(".game-wrap");

  const LOGICAL_W = 480;
  const LOGICAL_H = 270;
  const RENDER_SCALE = 4;
  const TILE = 16;
  const VIEW_W = 30;
  const VIEW_H = 16;
  const BOX_SIZE = 30;
  const SAVE_VERSION = 1;
  const SAVE_PREFIX = "kirkdon-save-";
  const SAVE_SLOT_COUNT = 3;
  const STAT_KEYS = ["hp", "atk", "def", "spa", "spdef", "speed"];
  const NATURES = [
    { id: "Hardy" },
    { id: "Brave", up: "atk", down: "speed" },
    { id: "Bold", up: "def", down: "atk" },
    { id: "Modest", up: "spa", down: "atk" },
    { id: "Calm", up: "spdef", down: "atk" },
    { id: "Timid", up: "speed", down: "atk" },
  ];
  const DIRS = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };
  const SPIN_DIRS = ["up", "right", "down", "left"];
  const POCKETS = [
    { id: "general", label: "ITEMS" },
    { id: "balls", label: "BALLS" },
    { id: "keyItems", label: "KEY" },
    { id: "tmsHms", label: "TM/HM" },
  ];

  const keyState = new Set();
  const images = {};
  let uidSeed = 1;

  const state = {
    ready: false,
    mode: "intro",
    previousMode: null,
    frame: 0,
    selectedStarter: data.starters[0],
    playerName: data.defaultName,
    uiName: "Matheus B.",
    region: "votuporanga",
    px: 14,
    py: 9,
    facing: "down",
    walking: false,
    party: [],
    boxes: [[]],
    collection: [],
    badges: [],
    money: 2500,
    balls: clone(data.balls),
    inventory: clone(data.items),
    fieldFlags: [],
    defeatedTrainers: [],
    trainerRuntime: {},
    menuPocket: 0,
    menuIndex: 0,
    partyIndex: 0,
    saveIndex: 0,
    shopIndex: 0,
    screenShake: 0,
    message: "Bem-vindo a KirkDon.",
    battle: null,
    cutscene: null,
    inputCooldown: 0,
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function prepareCanvas() {
    canvas.width = LOGICAL_W * RENDER_SCALE;
    canvas.height = LOGICAL_H * RENDER_SCALE;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  }

  function byId(id) {
    return data.persodons.find((p) => p.id === id);
  }

  function moveKey(name) {
    return String(name)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }

  function moveData(id) {
    const key = moveKey(id);
    if (data.moves[key]) return data.moves[key];
    return { name: String(id).replace(/_/g, " "), type: "Impacto", power: 45, accuracy: 95, pp: 20, category: "physical" };
  }

  function imagePaths() {
    const paths = new Set([
      "assets/tilesets/overworld-tiles.png",
      "assets/sprites/player/matheus-benevides.png",
    ]);
    data.persodons.forEach((p) => paths.add(p.sprite));
    data.gyms.forEach((g) => paths.add(g.sprite));
    Object.values(data.regions).forEach((region) => {
      (region.objects || []).forEach((obj) => paths.add(obj.sprite));
    });
    return [...paths].filter(Boolean);
  }

  function loadImages(paths) {
    return Promise.all(
      paths.map((path) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            images[path] = img;
            resolve();
          };
          img.onerror = () => {
            images[path] = null;
            resolve();
          };
          img.src = path;
        });
      })
    );
  }

  function resolvePlayerName(input) {
    const fullName = (input || "").trim() || data.defaultName;
    const parts = fullName.split(/\s+/);
    let uiName = fullName;
    if (uiName.length > 12) {
      uiName = `${parts[0]} ${parts.length > 1 ? parts[parts.length - 1][0] + "." : ""}`.trim();
    }
    return {
      fullName: fullName.slice(0, 24),
      uiName: uiName.slice(0, 12),
    };
  }

  function makeMon(id, level) {
    const base = byId(id);
    const mon = {
      uid: uidSeed++,
      id: base.id,
      name: base.name,
      types: [...base.types],
      sprite: base.sprite,
      catchRate: base.catchRate,
      level,
      exp: 0,
      expToNext: expForLevel(level),
      ivs: randomIvs(),
      evs: zeroEvs(),
      nature: randomNature(),
      hp: 1,
      maxHp: 1,
      atk: 1,
      def: 1,
      spa: 1,
      spdef: 1,
      speed: 1,
      spd: 1,
      status: null,
      statusTurns: 0,
      confusion: 0,
      moves: chooseMoves(base, level).map((move) => {
        const details = moveData(move);
        return { id: moveKey(move), pp: details.pp, maxPp: details.pp };
      }),
    };
    applyStats(mon, true);
    mon.hp = mon.maxHp;
    return mon;
  }

  function applyStats(mon, preserveHp) {
    const base = byId(mon.id);
    const oldMax = mon.maxHp || 1;
    const oldHp = mon.hp || oldMax;
    mon.ivs = mon.ivs || randomIvs();
    mon.evs = mon.evs || zeroEvs();
    mon.nature = mon.nature || "Hardy";
    mon.name = base.name;
    mon.types = [...base.types];
    mon.sprite = base.sprite;
    mon.catchRate = base.catchRate;
    mon.maxHp = calcHpStat(base.hp, mon.level, mon.ivs.hp, mon.evs.hp);
    mon.atk = calcBattleStat(base.atk, mon.level, mon.ivs.atk, mon.evs.atk, natureModifier(mon.nature, "atk"));
    mon.def = calcBattleStat(base.def, mon.level, mon.ivs.def, mon.evs.def, natureModifier(mon.nature, "def"));
    mon.spa = calcBattleStat(base.spa ?? base.atk, mon.level, mon.ivs.spa, mon.evs.spa, natureModifier(mon.nature, "spa"));
    mon.spdef = calcBattleStat(base.spdef ?? base.def, mon.level, mon.ivs.spdef, mon.evs.spdef, natureModifier(mon.nature, "spdef"));
    mon.speed = calcBattleStat(base.speed ?? base.spd ?? 10, mon.level, mon.ivs.speed, mon.evs.speed, natureModifier(mon.nature, "speed"));
    mon.spd = mon.speed;
    mon.expToNext = expForLevel(mon.level);
    if (preserveHp) {
      mon.hp = Math.max(1, Math.min(mon.maxHp, Math.ceil((oldHp / oldMax) * mon.maxHp)));
    }
  }

  function calcHpStat(base, level, iv, ev) {
    return Math.max(1, Math.floor(((iv + 2 * base + Math.floor(ev / 4) + 100) * level) / 100 + 10));
  }

  function calcBattleStat(base, level, iv, ev, natureMod) {
    return Math.max(1, Math.floor((Math.floor(((iv + 2 * base + Math.floor(ev / 4)) * level) / 100) + 5) * natureMod));
  }

  function randomIvs() {
    return STAT_KEYS.reduce((ivs, stat) => {
      ivs[stat] = random(0, 31);
      return ivs;
    }, {});
  }

  function zeroEvs() {
    return STAT_KEYS.reduce((evs, stat) => {
      evs[stat] = 0;
      return evs;
    }, {});
  }

  function randomNature() {
    return NATURES[random(0, NATURES.length - 1)].id;
  }

  function natureModifier(natureId, stat) {
    const nature = NATURES.find((item) => item.id === natureId);
    if (!nature) return 1;
    if (nature.up === stat) return 1.1;
    if (nature.down === stat) return 0.9;
    return 1;
  }

  function expForLevel(level) {
    return Math.floor(24 + level * level * 1.35);
  }

  function chooseMoves(base, level) {
    const learned = [];
    (base.learnset || []).forEach((entry) => {
      if (entry.level <= level && !learned.includes(entry.move)) learned.push(entry.move);
    });
    if (!learned.length) learned.push(moveKey(base.move));
    return learned.slice(-4);
  }

  function setupStarterCards() {
    starterGrid.innerHTML = "";
    data.starters.forEach((id) => {
      const base = byId(id);
      const button = document.createElement("button");
      button.className = `starter-card${id === state.selectedStarter ? " is-selected" : ""}`;
      button.type = "button";
      button.innerHTML = `<img alt="" src="${base.sprite}"><strong>${base.name}</strong><small>${base.types[0]}</small>`;
      button.addEventListener("click", () => {
        state.selectedStarter = id;
        setupStarterCards();
      });
      starterGrid.appendChild(button);
    });
  }

  function startGame() {
    const name = resolvePlayerName(nameInput.value);
    state.playerName = name.fullName;
    state.uiName = name.uiName;
    state.party = [makeMon(state.selectedStarter, 5)];
    state.collection = [state.selectedStarter];
    state.message = `${state.uiName} recebeu ${byId(state.selectedStarter).name}!`;
    intro.classList.add("is-hidden");
    state.mode = "overworld";
  }

  function setupSaveLoadButtons() {
    if (!saveGrid) return;
    saveGrid.innerHTML = "";
    for (let slot = 1; slot <= SAVE_SLOT_COUNT; slot++) {
      const save = readSaveSlot(slot);
      const button = document.createElement("button");
      button.className = "save-slot";
      button.type = "button";
      button.disabled = !save;
      button.innerHTML = save ? `SLOT ${slot}<br>${shorten(save.playerName || "Save", 14)}<br>${saveBadgeCount(save)}/7 BADGES` : `SLOT ${slot}<br>VAZIO`;
      button.addEventListener("click", () => loadGameFromSlot(slot));
      saveGrid.appendChild(button);
    }
  }

  function saveKey(slot) {
    return `${SAVE_PREFIX}${slot}`;
  }

  function readSaveSlot(slot) {
    try {
      const raw = window.localStorage?.getItem(saveKey(slot));
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeSaveSlot(slot, payload) {
    try {
      window.localStorage?.setItem(saveKey(slot), JSON.stringify(payload));
      return true;
    } catch (error) {
      return false;
    }
  }

  function createSavePayload(slot) {
    normalizeBoxes();
    return {
      version: SAVE_VERSION,
      slot,
      savedAt: new Date().toISOString(),
      playerName: state.playerName,
      uiName: state.uiName,
      selectedStarter: state.selectedStarter,
      region: state.region,
      px: state.px,
      py: state.py,
      facing: state.facing,
      party: clone(state.party),
      boxes: clone(state.boxes),
      collection: clone(state.collection),
      badges: clone(state.badges),
      money: state.money,
      balls: clone(state.balls),
      inventory: clone(state.inventory),
      fieldFlags: clone(state.fieldFlags),
      defeatedTrainers: clone(state.defeatedTrainers),
      trainerRuntime: clone(state.trainerRuntime),
      uidSeed,
    };
  }

  function saveGameToSlot(slot) {
    if (state.mode === "battle" || state.battle) {
      state.message = "Nao da para salvar durante batalha.";
      return false;
    }
    if (!writeSaveSlot(slot, createSavePayload(slot))) {
      state.message = "Nao foi possivel salvar neste navegador.";
      return false;
    }
    setupSaveLoadButtons();
    state.message = `Jogo salvo no Slot ${slot}.`;
    return true;
  }

  function loadGameFromSlot(slot) {
    const payload = readSaveSlot(slot);
    if (!payload) {
      state.message = `Slot ${slot} vazio.`;
      return false;
    }
    state.playerName = payload.playerName || data.defaultName;
    state.uiName = payload.uiName || resolvePlayerName(state.playerName).uiName;
    state.selectedStarter = payload.selectedStarter || data.starters[0];
    state.region = data.regions[payload.region] ? payload.region : "votuporanga";
    state.px = payload.px ?? 14;
    state.py = payload.py ?? 9;
    state.facing = payload.facing || "down";
    state.party = (payload.party || []).map(hydrateMon).filter(Boolean).slice(0, 6);
    state.boxes = hydrateBoxes(payload.boxes || [[]]);
    state.collection = payload.collection || state.party.map((mon) => mon.id);
    state.badges = payload.badges || [];
    state.money = payload.money ?? 2500;
    state.balls = payload.balls || clone(data.balls);
    state.inventory = payload.inventory || clone(data.items);
    mergeInventoryDefaults();
    state.fieldFlags = payload.fieldFlags || [];
    state.defeatedTrainers = payload.defeatedTrainers || [];
    state.trainerRuntime = payload.trainerRuntime || {};
    uidSeed = Math.max(payload.uidSeed || 1, maxSavedUid() + 1);
    state.mode = "overworld";
    state.previousMode = null;
    state.battle = null;
    state.cutscene = null;
    state.inputCooldown = 0;
    state.saveIndex = slot - 1;
    state.message = `Save Slot ${slot} carregado.`;
    intro.classList.add("is-hidden");
    return true;
  }

  function mergeInventoryDefaults() {
    state.inventory.general = mergeItemList(state.inventory.general, data.items.general, "id");
    state.inventory.keyItems = mergeItemList(state.inventory.keyItems, data.items.keyItems, "id");
    state.inventory.tmsHms = mergeItemList(state.inventory.tmsHms, data.items.tmsHms, "id");
    Object.entries(data.balls).forEach(([id, ball]) => {
      if (!state.balls[id]) state.balls[id] = clone(ball);
    });
  }

  function mergeItemList(current, defaults, key) {
    const merged = clone(current || []);
    (defaults || []).forEach((item) => {
      if (!merged.some((entry) => entry[key] === item[key])) merged.push(clone(item));
    });
    return merged;
  }

  function hydrateBoxes(savedBoxes) {
    const boxes = Array.isArray(savedBoxes[0]) ? savedBoxes : [savedBoxes];
    return boxes.map((box) => (box || []).map(hydrateMon).filter(Boolean));
  }

  function hydrateMon(mon) {
    if (!mon || !byId(mon.id)) return null;
    const hydrated = { ...mon };
    hydrated.level = hydrated.level || 1;
    hydrated.uid = hydrated.uid || uidSeed++;
    hydrated.ivs = hydrated.ivs || randomIvs();
    hydrated.evs = hydrated.evs || zeroEvs();
    hydrated.nature = hydrated.nature || "Hardy";
    hydrated.status = hydrated.status || null;
    hydrated.statusTurns = hydrated.statusTurns || 0;
    hydrated.confusion = hydrated.confusion || 0;
    hydrated.moves = (hydrated.moves || chooseMoves(byId(hydrated.id), hydrated.level || 1).map((move) => ({ id: moveKey(move) }))).slice(0, 4);
    hydrated.moves = hydrated.moves.map((slot) => {
      const move = moveData(slot.id);
      const maxPp = slot.maxPp || move.pp;
      return { id: moveKey(slot.id), pp: Math.min(slot.pp ?? maxPp, maxPp), maxPp };
    });
    applyStats(hydrated, true);
    hydrated.hp = Math.max(0, Math.min(hydrated.hp ?? hydrated.maxHp, hydrated.maxHp));
    return hydrated;
  }

  function maxSavedUid() {
    return [...state.party, ...allBoxMons()].reduce((max, mon) => Math.max(max, mon.uid || 0), 0);
  }

  function openSaveMenu(previousMode) {
    state.previousMode = previousMode || state.mode;
    state.mode = "save";
    state.saveIndex = 0;
  }

  function saveBadgeCount(save) {
    if (Array.isArray(save?.badges)) return save.badges.length;
    return Number(save?.badges || 0);
  }

  function currentRegion() {
    return data.regions[state.region];
  }

  function mapWidth() {
    return currentRegion().width || VIEW_W;
  }

  function mapHeight() {
    return currentRegion().height || VIEW_H;
  }

  function camera() {
    return {
      x: Math.max(0, Math.min(mapWidth() - VIEW_W, state.px - Math.floor(VIEW_W / 2))),
      y: Math.max(0, Math.min(mapHeight() - VIEW_H, state.py - Math.floor(VIEW_H / 2))),
    };
  }

  function gymsInRegion() {
    return data.gyms.filter((gym) => gym.region === state.region);
  }

  function drawTile(index, x, y) {
    const tiles = images["assets/tilesets/overworld-tiles.png"];
    if (!tiles) return;
    const sx = (index % 8) * TILE;
    const sy = Math.floor(index / 8) * TILE;
    ctx.drawImage(tiles, sx, sy, TILE, TILE, x, y, TILE, TILE);
  }

  function rectContains(rect, x, y) {
    return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
  }

  function encounterZoneAt(x, y) {
    const region = currentRegion();
    const zones = region.encounterZones || region.wildRects || [];
    return zones.find((rect) => rectContains(rect, x, y));
  }

  function isWildTile(x, y) {
    return Boolean(encounterZoneAt(x, y));
  }

  function isRoadTile(x, y) {
    const region = currentRegion();
    return (region.roads || []).some((rect) => rectContains(rect, x, y));
  }

  function tileAt(x, y) {
    const region = currentRegion();
    if (isWallTile(x, y)) return region.wallTile ?? region.baseTile;
    if (isWildTile(x, y)) return region.wildTile;
    if (isRoadTile(x, y)) return region.roadTile;
    if (isIslandGlitched()) return (x + y + Math.floor(state.frame / 18)) % 3 === 0 ? 12 : region.baseTile;
    return region.baseTile;
  }

  function isIslandGlitched() {
    return state.region === "ilha" && Math.floor(state.frame / 360) % 2 === 1;
  }

  function isWallTile(x, y) {
    const region = currentRegion();
    return (region.wallRects || []).some((rect) => rectContains(rect, x, y));
  }

  function drawWorld() {
    const region = currentRegion();
    const cam = camera();
    for (let y = 0; y < VIEW_H; y++) {
      for (let x = 0; x < VIEW_W; x++) {
        const wx = cam.x + x;
        const wy = cam.y + y;
        drawTile(tileAt(wx, wy), x * TILE, y * TILE);
      }
    }

    drawFieldObstacles(cam);
    (region.objects || []).forEach((obj) => drawMapObject(obj, cam));
    gymsInRegion().forEach((obj) => drawMapObject(obj, cam));
    drawTrainers(cam);
    drawPlayer(cam);
    drawVotuporangaTopLayers(cam);
    drawGlitchWeather();
    drawTopBanner(region.name);
    drawDialog(state.message);
  }

  function drawGlitchWeather() {
    if (!isIslandGlitched()) return;
    for (let i = 0; i < 18; i++) {
      const x = (i * 37 + state.frame * 3) % LOGICAL_W;
      const y = (i * 19 + state.frame * 2) % LOGICAL_H;
      ctx.fillStyle = i % 2 === 0 ? "#e03228" : "#4890f8";
      ctx.fillRect(x, y, 10 + (i % 4) * 6, 2);
    }
    drawText("GLITCH", LOGICAL_W - 62, 30, "#f8d030", true);
  }

  function drawMapObject(obj, cam) {
    const img = images[obj.sprite];
    const dx = (obj.x - cam.x) * TILE - 8;
    const dy = (obj.y - cam.y) * TILE - 16;
    if (dx < -48 || dy < -48 || dx > LOGICAL_W + 48 || dy > LOGICAL_H + 48) return;
    if (!img && currentRegion().interior) {
      drawInteriorObject(obj, cam);
      return;
    }
    if (!img && obj.type === "healer") {
      drawHealingMachine(dx, dy);
      return;
    }
    if (!img && (obj.type === "fanNpc" || obj.type === "fanLeader")) {
      drawFanNpc(dx, dy, obj.type === "fanLeader");
      return;
    }
    if (!img && obj.type === "finalBoss") {
      drawAlgorithmBoss(dx, dy);
      return;
    }
    if (img) {
      ctx.drawImage(img, dx, dy, 32, 32);
    } else {
      ctx.fillStyle = obj.type === "pc" ? "#4890f8" : "#e03228";
      ctx.fillRect(dx, dy, 32, 32);
    }
    if (obj.badge && state.badges.includes(obj.id)) {
      ctx.fillStyle = "#f8d030";
      ctx.fillRect((obj.x - cam.x) * TILE + 14, (obj.y - cam.y) * TILE - 16, 4, 4);
    }
  }

  function drawInteriorObject(obj, cam) {
    const x = (obj.x - cam.x) * TILE;
    const y = (obj.y - cam.y) * TILE;
    if (obj.type === "pc") {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(x + 2, y + 2, 12, 12);
      ctx.fillStyle = "#4890f8";
      ctx.fillRect(x + 4, y + 4, 8, 5);
      ctx.fillStyle = "#b8b8b8";
      ctx.fillRect(x + 5, y + 11, 6, 2);
      return;
    }
    if (obj.type === "healer") {
      drawHealingMachine(x - 8, y - 16);
      return;
    }
    if (obj.type === "warp") {
      ctx.fillStyle = "#704820";
      ctx.fillRect(x + 2, y, 12, 16);
      ctx.fillStyle = "#b87838";
      ctx.fillRect(x + 4, y + 2, 8, 14);
      ctx.fillStyle = "#f8d030";
      ctx.fillRect(x + 10, y + 8, 2, 2);
      return;
    }
    if (obj.type === "decor") {
      ctx.fillStyle = "#4890f8";
      ctx.fillRect(x + 1, y + 4, 14, 10);
      ctx.fillStyle = "#f0e8c8";
      ctx.fillRect(x + 2, y + 2, 7, 5);
      return;
    }
    ctx.fillStyle = "#707070";
    ctx.fillRect(x + 2, y + 2, 12, 12);
  }

  function drawHealingMachine(dx, dy) {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(dx + 7, dy + 6, 18, 24);
    ctx.fillStyle = "#e03228";
    ctx.fillRect(dx + 9, dy + 8, 14, 18);
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(dx + 14, dy + 11, 4, 10);
    ctx.fillRect(dx + 11, dy + 14, 10, 4);
    ctx.fillStyle = "#4890f8";
    ctx.fillRect(dx + 11, dy + 24, 10, 3);
  }

  function drawFanNpc(dx, dy, leader) {
    ctx.fillStyle = "#181818";
    ctx.fillRect(dx + 10, dy + 7, 12, 22);
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(dx + 11, dy + 12, 10, 4);
    ctx.fillStyle = leader ? "#f8d030" : "#b8b8b8";
    ctx.fillRect(dx + 11, dy + 3, 10, 7);
    ctx.fillStyle = "#181818";
    ctx.fillRect(dx + 13, dy + 5, 6, 2);
  }

  function drawAlgorithmBoss(dx, dy) {
    const glitch = Math.floor(state.frame / 8) % 2;
    ctx.fillStyle = glitch ? "#4890f8" : "#e03228";
    ctx.fillRect(dx + 5, dy + 4, 22, 22);
    ctx.fillStyle = "#101018";
    ctx.fillRect(dx + 10, dy + 9, 12, 4);
    ctx.fillStyle = glitch ? "#f8d030" : "#f8f8f8";
    ctx.fillRect(dx + 8, dy + 24, 16, 3);
    ctx.fillRect(dx + 3, dy + 14, 4, 2);
    ctx.fillRect(dx + 25, dy + 18, 4, 2);
  }

  function drawFieldObstacles(cam) {
    fieldObstacles().forEach((obstacle) => {
      if (isFieldFlagSet(obstacle.id)) return;
      const x = (obstacle.x - cam.x) * TILE;
      const y = (obstacle.y - cam.y) * TILE;
      if (x < -16 || y < -16 || x > LOGICAL_W || y > LOGICAL_H) return;
      if (obstacle.type === "tree") {
        ctx.fillStyle = "#186838";
        ctx.fillRect(x + 3, y + 1, 10, 10);
        ctx.fillStyle = "#704820";
        ctx.fillRect(x + 6, y + 9, 4, 7);
      } else if (obstacle.type === "boulder") {
        ctx.fillStyle = "#484848";
        ctx.fillRect(x + 2, y + 4, 12, 10);
        ctx.fillStyle = "#b8b8b8";
        ctx.fillRect(x + 4, y + 2, 8, 4);
      } else {
        ctx.fillStyle = "#2078b8";
        ctx.fillRect(x, y + 2, 16, 12);
        ctx.fillStyle = "#78c8f8";
        ctx.fillRect(x + 2, y + 5, 12, 2);
      }
    });
  }

  function drawVotuporangaTopLayers(cam) {
    if (state.region !== "votuporanga") return;
    [...objectsInRegion(), ...gymsInRegion()].forEach((obj) => drawMapObjectTop(obj, cam));
    fieldObstacles().forEach((obstacle) => {
      if (isFieldFlagSet(obstacle.id) || obstacle.type !== "tree") return;
      const x = (obstacle.x - cam.x) * TILE;
      const y = (obstacle.y - cam.y) * TILE;
      if (x < -16 || y < -16 || x > LOGICAL_W || y > LOGICAL_H) return;
      ctx.fillStyle = "#186838";
      ctx.fillRect(x + 3, y + 1, 10, 8);
      ctx.fillStyle = "#40b840";
      ctx.fillRect(x + 5, y + 2, 6, 3);
    });
  }

  function drawMapObjectTop(obj, cam) {
    const img = images[obj.sprite];
    const dx = (obj.x - cam.x) * TILE - 8;
    const dy = (obj.y - cam.y) * TILE - 16;
    if (dx < -48 || dy < -48 || dx > LOGICAL_W + 48 || dy > LOGICAL_H + 48) return;
    if (img) {
      const sourceHeight = Math.max(1, Math.floor(img.height / 2));
      ctx.drawImage(img, 0, 0, img.width, sourceHeight, dx, dy, 32, 16);
      return;
    }
    ctx.fillStyle = obj.type === "pc" ? "#4890f8" : "#e03228";
    ctx.fillRect(dx, dy, 32, 16);
  }

  function drawTrainers(cam) {
    trainersInRegion().forEach((trainer) => {
      const runtime = trainerState(trainer);
      const x = (runtime.x - cam.x) * TILE;
      const y = (runtime.y - cam.y) * TILE - 10;
      if (x < -16 || y < -28 || x > LOGICAL_W || y > LOGICAL_H) return;
      const defeated = state.defeatedTrainers.includes(trainerKey(trainer));
      ctx.fillStyle = defeated ? "#707070" : "#705898";
      ctx.fillRect(x + 3, y + 8, 10, 18);
      ctx.fillStyle = defeated ? "#b8b8b8" : "#f8d030";
      ctx.fillRect(x + 4, y + 4, 8, 7);
      ctx.fillStyle = "#181818";
      const facing = runtime.facing || trainer.facing || "down";
      if (facing === "up") ctx.fillRect(x + 5, y + 4, 6, 2);
      if (facing === "down") ctx.fillRect(x + 5, y + 8, 6, 2);
      if (facing === "left") ctx.fillRect(x + 3, y + 6, 2, 4);
      if (facing === "right") ctx.fillRect(x + 11, y + 6, 2, 4);
      if (state.cutscene?.kind === "trainer" && state.cutscene.key === trainerKey(trainer) && state.cutscene.phase === "alert") {
        drawText("!", x + 5, y - 7, "#f8d030", true);
      }
    });
  }

  function drawPlayer(cam) {
    const img = images["assets/sprites/player/matheus-benevides.png"];
    const walkFrame = state.walking ? 1 + (Math.floor(state.frame / 10) % 2) : 0;
    const sideFrame = state.walking ? Math.floor(state.frame / 10) % 2 : 0;
    let sx = walkFrame * 16;
    let sy = 0;
    let flip = false;
    if (state.facing === "up") {
      sy = 32;
    } else if (state.facing === "right" || state.facing === "left") {
      sx = 48;
      sy = sideFrame === 0 ? 0 : 32;
      flip = state.facing === "left";
    }
    const dx = (state.px - cam.x) * TILE;
    const dy = (state.py - cam.y) * TILE - 16;
    if (img && flip) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, 16, 32, -dx - 16, dy, 16, 32);
      ctx.restore();
    } else if (img) {
      ctx.drawImage(img, sx, sy, 16, 32, dx, dy, 16, 32);
    } else {
      ctx.fillStyle = "#f8f8f8";
      ctx.fillRect(dx + 4, dy + 8, 8, 20);
      ctx.fillStyle = "#4090f0";
      ctx.fillRect(dx + 3, dy + 22, 10, 8);
    }
  }

  function drawTopBanner(text) {
    drawWindow(4, 4, 132, 28);
    drawText(text, 12, 13, "#181818");
    drawText(`${state.badges.length}/7 BADGES`, 146, 13, "#f8f8f8", true);
    if (isRunning()) drawText("RUN", 202, 26, "#f8d030", true);
  }

  function drawBattle(showMenu = true) {
    const battle = state.battle;
    ctx.fillStyle = regionBattleColor();
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    drawBattleGround();

    const enemyImg = images[battle.enemy.sprite];
    const playerImg = images[battle.player.sprite];
    if (enemyImg) {
      const enemySize = battle.enemy.id === 29 ? 112 : battle.enemy.id === 51 ? 78 : 64;
      const enemyX = battle.enemy.id === 29 ? 188 : battle.enemy.id === 51 ? 214 : 224;
      const enemyY = battle.enemy.id === 29 ? 34 : 68;
      ctx.drawImage(enemyImg, enemyX, enemyY, enemySize, enemySize);
    }
    if (playerImg) {
      const playerSize = battle.player.id === 29 ? 94 : 64;
      const playerX = battle.player.id === 29 ? 24 : 42;
      const playerY = battle.player.id === 29 ? 142 : 170;
      ctx.drawImage(playerImg, playerX, playerY, playerSize, playerSize);
    }

    drawHudBox(12, 18, 142, 38, battle.enemy, false);
    drawHudBox(152, 168, 158, 42, battle.player, true);

    if (!showMenu) return;
    if (battle.turnLock || battle.finished) {
      drawDialog(battle.message);
    } else if (battle.menu === "fight") {
      drawFightMenu();
    } else {
      drawBattleDialogAndMenu();
    }
  }

  function regionBattleColor() {
    if (isIslandGlitched()) return Math.floor(state.frame / 12) % 2 === 0 ? "#101018" : "#705898";
    const colors = {
      votuporanga: "#78c850",
      texas: "#c8a868",
      fronteira: "#e8d070",
      metro: "#707090",
      ilha: "#705898",
    };
    return colors[state.region] || "#78c850";
  }

  function drawBattleGround() {
    ctx.fillStyle = "#f0e8c8";
    ctx.fillRect(198, 142, 104, 10);
    ctx.fillRect(28, 230, 104, 10);
    ctx.fillStyle = "#484848";
    ctx.fillRect(0, LOGICAL_H - 46, LOGICAL_W, 1);
  }

  function drawBattleDialogAndMenu() {
    const y = LOGICAL_H - 42;
    drawWindow(4, y, 252, 38);
    const lines = wrap(state.battle.message, 36).slice(0, 2);
    lines.forEach((line, i) => drawText(line, 12, y + 11 + i * 12, "#181818"));
    drawWindow(262, y, 214, 38);
    const idx = state.battle.actionIndex || 0;
    drawText(`${idx === 0 ? ">" : " "} LUTA`, 272, y + 10, idx === 0 ? "#e03228" : "#181818");
    drawText(`${idx === 1 ? ">" : " "} MOCHILA`, 350, y + 10, idx === 1 ? "#e03228" : "#181818");
    drawText(`${idx === 2 ? ">" : " "} PARTY`, 272, y + 25, idx === 2 ? "#e03228" : "#181818");
    drawText(`${idx === 3 ? ">" : " "} FUGA`, 350, y + 25, idx === 3 ? "#e03228" : "#181818");
  }

  function drawFightMenu() {
    const mon = state.battle.player;
    const y0 = LOGICAL_H - 42;
    drawWindow(4, y0, LOGICAL_W - 8, 38);
    mon.moves.forEach((slot, index) => {
      const move = moveData(slot.id);
      const x = index % 2 === 0 ? 14 : 248;
      const y = y0 + 9 + Math.floor(index / 2) * 15;
      const selected = index === (state.battle.moveIndex || 0);
      const label = `${selected ? ">" : " "} ${shorten(move.name, 17)}`;
      drawText(label, x, y, selected ? "#e03228" : "#181818");
      drawText(`${slot.pp}/${slot.maxPp}`, x + 142, y, "#181818");
    });
    drawText("X: VOLTA", LOGICAL_W - 54, y0 - 14, "#f8f8f8", true);
  }

  function drawHudBox(x, y, w, h, mon, showHpText) {
    drawWindow(x, y, w, h);
    drawText(`${shorten(mon.name, 12)} L${mon.level}`, x + 8, y + 9, "#181818");
    const status = statusLabel(mon);
    if (status) drawText(status, x + w - 28, y + 9, "#e03228");
    const ratio = Math.max(0, mon.hp / mon.maxHp);
    ctx.fillStyle = "#181818";
    ctx.fillRect(x + 8, y + 20, 84, 5);
    ctx.fillStyle = ratio > 0.5 ? "#40b840" : ratio > 0.2 ? "#f8d030" : "#e03228";
    ctx.fillRect(x + 9, y + 21, Math.floor(82 * ratio), 3);
    if (showHpText) {
      drawText(`${Math.max(0, mon.hp)}/${mon.maxHp}`, x + 88, y + 20, "#181818");
      ctx.fillStyle = "#181818";
      ctx.fillRect(x + 8, y + 31, 86, 3);
      ctx.fillStyle = "#4890f8";
      ctx.fillRect(x + 9, y + 32, Math.floor(84 * (mon.exp / mon.expToNext)), 1);
      drawText(`A${mon.atk} D${mon.def} S${mon.speed}`, x + 8, y + 30, "#181818");
    }
  }

  function drawWindow(x, y, w, h) {
    ctx.fillStyle = "#484848";
    ctx.fillRect(x + 3, y + 3, w, h);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#707070";
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = "#b8b8b8";
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    ctx.fillStyle = "#f0e8c8";
    ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
  }

  function drawDialog(text) {
    const y = LOGICAL_H - 40;
    drawWindow(4, y, LOGICAL_W - 8, 36);
    const lines = wrap(text, 68).slice(0, 2);
    lines.forEach((line, i) => drawText(line, 12, y + 10 + i * 12, "#181818"));
  }

  function drawText(text, x, y, color, shadow) {
    ctx.font = "bold 9px Verdana, Arial, sans-serif";
    ctx.textBaseline = "top";
    ctx.lineWidth = 2;
    ctx.strokeStyle = color === "#f8f8f8" || color === "#f8d030" ? "#181818" : "#f8f8f8";
    ctx.strokeText(String(text), x, y);
    if (shadow) {
      ctx.fillStyle = "#181818";
      ctx.fillText(String(text), x + 1, y + 1);
    }
    ctx.fillStyle = color;
    ctx.fillText(String(text), x, y);
  }

  function wrap(text, max) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      if (`${line} ${word}`.trim().length > max) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = `${line} ${word}`.trim();
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function shorten(text, max) {
    const str = String(text);
    return str.length > max ? `${str.slice(0, Math.max(1, max - 1))}.` : str;
  }

  function frontTile() {
    const dir = DIRS[state.facing] || DIRS.down;
    return { x: state.px + dir.dx, y: state.py + dir.dy };
  }

  function objectsInRegion() {
    return currentRegion().objects || [];
  }

  function fieldObstacles() {
    return currentRegion().fieldObstacles || [];
  }

  function trainersInRegion() {
    return currentRegion().trainers || [];
  }

  function objectAt(x, y) {
    return objectsInRegion().find((obj) => obj.x === x && obj.y === y);
  }

  function gymAt(x, y) {
    return gymsInRegion().find((gym) => gym.x === x && gym.y === y);
  }

  function fieldObstacleAt(x, y) {
    return fieldObstacles().find((obstacle) => obstacle.x === x && obstacle.y === y && !isFieldFlagSet(obstacle.id));
  }

  function trainerAt(x, y) {
    return trainersInRegion().find((trainer) => {
      if (state.defeatedTrainers.includes(trainerKey(trainer))) return false;
      const runtime = trainerState(trainer);
      return runtime.x === x && runtime.y === y;
    });
  }

  function trainerKey(trainer) {
    return `${state.region}:${trainer.id}`;
  }

  function trainerState(trainer) {
    const key = trainerKey(trainer);
    if (!state.trainerRuntime[key]) {
      state.trainerRuntime[key] = { x: trainer.x, y: trainer.y, facing: trainer.facing || "down" };
    }
    const runtime = state.trainerRuntime[key];
    if (trainer.spin && !state.cutscene && !state.defeatedTrainers.includes(key)) {
      runtime.facing = SPIN_DIRS[(Math.floor(state.frame / 50) + trainer.id.length) % SPIN_DIRS.length];
    }
    return runtime;
  }

  function isFieldFlagSet(id) {
    return state.fieldFlags.includes(id);
  }

  function setFieldFlag(id) {
    if (!state.fieldFlags.includes(id)) state.fieldFlags.push(id);
  }

  function canUseFieldAbility(abilityId) {
    const ability = data.fieldAbilities[abilityId];
    if (!ability) return false;
    const hasBadge = state.badges.includes(ability.badge);
    const keyItem = (state.inventory.keyItems || []).find((item) => item.id === ability.item);
    return hasBadge && keyItem?.owned;
  }

  function interact() {
    if (state.cutscene) return;
    const target = frontTile();
    const obstacle = fieldObstacleAt(target.x, target.y);
    if (obstacle) {
      useFieldObstacle(obstacle);
      return;
    }

    const trainer = trainerAt(target.x, target.y);
    if (trainer) {
      startTrainerBattle(trainer);
      return;
    }

    const obj = objectAt(target.x, target.y) || gymAt(target.x, target.y);
    if (!obj) {
      const zone = encounterZoneAt(state.px, state.py);
      state.message = zone ? `${zone.name}: Persodons podem aparecer.` : "Nada para interagir aqui.";
      return;
    }

    if (obj.type === "warp") {
      state.region = obj.to;
      state.px = obj.toX ?? 7;
      state.py = obj.toY ?? 7;
      state.facing = obj.toFacing || "down";
      state.message = obj.text;
      return;
    }
    if (obj.type === "pc") {
      if (obj.heals !== false) healParty();
      openPc();
      state.message = obj.heals === false ? obj.text || "PC de Caixas aberto." : "Party curada. PC de Caixas aberto.";
      return;
    }
    if (obj.type === "healer") {
      healParty();
      state.message = obj.text || "Todos os Persodons foram curados.";
      return;
    }
    if (obj.type === "shop") {
      openShop();
      state.message = obj.text || "Loja aberta.";
      return;
    }
    if (obj.type === "fanLeader") {
      handleFanLeader(obj);
      return;
    }
    if (obj.type === "fanNpc") {
      state.message = obj.text || obj.name;
      return;
    }
    if (obj.type === "finalBoss") {
      if (state.badges.length < 7) {
        state.message = "O Algoritmo so aparece para quem tem 7 badges.";
        return;
      }
      if (state.fieldFlags.includes("algorithm-defeated")) {
        state.message = "O vazio digital esta sob controle.";
        return;
      }
      startBattle(makeMon(51, 34), { finalBoss: true });
      return;
    }
    if (obj.type === "mythic") {
      if (state.badges.length < 7) {
        state.message = "O palco esta trancado. Reuna 7 badges.";
        return;
      }
      startBattle(makeMon(29, 30), { mythic: true });
      return;
    }
    if (obj.leader) {
      if (state.badges.includes(obj.id)) {
        state.message = `${obj.leader} ja entregou ${obj.badge}.`;
        return;
      }
      startBattle(makeMon(obj.persodon, obj.level), { gym: obj });
      return;
    }
    state.message = obj.text || obj.name;
  }

  function handleFanLeader(obj) {
    if (state.fieldFlags.includes("sacred-mantle-earned")) {
      state.message = "Lider da Torcida: o Manto Sagrado ja e seu.";
      return;
    }
    if (!partyHasType("Texano")) {
      state.message = obj.text || "Traga uma Persona Texano.";
      return;
    }
    startBattle(makeMon(18, Math.max(10, 8 + state.badges.length * 2)), {
      trainer: { title: "TORCIDA", name: "Lider da Torcida", defeatedText: "Respeito em preto e branco.", rewardItem: "sacredMantle" },
      trainerKey: "event:lider-torcida",
    });
  }

  function partyHasType(type) {
    return state.party.some((mon) => mon.types.includes(type));
  }

  function useFieldObstacle(obstacle) {
    const ability = data.fieldAbilities[obstacle.ability];
    if (!ability) {
      state.message = `${obstacle.name} bloqueia o caminho.`;
      return;
    }
    if (!canUseFieldAbility(obstacle.ability)) {
      state.message = `${obstacle.name}: precisa de ${ability.name} e Badge ${ability.badge}.`;
      return;
    }
    setFieldFlag(obstacle.id);
    state.message = obstacle.text || `${ability.name} abriu caminho.`;
  }

  function tryMove(dx, dy) {
    state.facing = dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down";
    const nx = state.px + dx;
    const ny = state.py + dy;
    if (nx < 0 || ny < 1 || nx >= mapWidth() || ny >= mapHeight()) return false;
    const block = blockingAt(nx, ny);
    if (block) {
      state.message = `${block} bloqueia o caminho.`;
      return false;
    }
    state.px = nx;
    state.py = ny;
    afterPlayerStep(nx, ny);
    return true;
  }

  function blockingAt(x, y, ignoreTrainerKey) {
    if (isWallTile(x, y)) return "Parede";
    const obstacle = fieldObstacleAt(x, y);
    if (obstacle) return obstacle.name;
    const obj = objectAt(x, y);
    if (obj) return obj.name;
    const gym = gymAt(x, y);
    if (gym) return gym.name;
    const trainer = trainersInRegion().find((candidate) => {
      const key = trainerKey(candidate);
      if (key === ignoreTrainerKey || state.defeatedTrainers.includes(key)) return false;
      const runtime = trainerState(candidate);
      return runtime.x === x && runtime.y === y;
    });
    if (trainer) return trainer.name;
    return "";
  }

  function afterPlayerStep(x, y) {
    const zone = encounterZoneAt(x, y);
    if (zone && Math.random() < (zone.chance ?? 0.16)) {
      const ids = zone.encounters || currentRegion().encounters || [];
      const id = ids[Math.floor(Math.random() * ids.length)];
      startBattle(makeMon(id, 3 + state.badges.length * 3 + Math.floor(Math.random() * 3)), { wild: true });
      return;
    }
    const front = frontTile();
    const near =
      fieldObstacleAt(front.x, front.y) ||
      trainerAt(front.x, front.y) ||
      objectAt(front.x, front.y) ||
      gymAt(front.x, front.y);
    state.message = near ? `${near.name}: pressione ENTER.` : zone ? `${zone.name}: area de encontro.` : currentRegion().name;
  }

  function scanTrainerSight() {
    if (state.mode !== "overworld" || state.cutscene || state.battle) return;
    for (const trainer of trainersInRegion()) {
      const key = trainerKey(trainer);
      if (state.defeatedTrainers.includes(key)) continue;
      const runtime = trainerState(trainer);
      if (canTrainerSeePlayer(trainer, runtime, key)) {
        state.cutscene = { kind: "trainer", key, phase: "alert", timer: 28 };
        state.message = "!";
        return;
      }
    }
  }

  function canTrainerSeePlayer(trainer, runtime, key) {
    const facing = runtime.facing || trainer.facing || "down";
    const dir = DIRS[facing];
    if (!dir) return false;
    const dx = state.px - runtime.x;
    const dy = state.py - runtime.y;
    const aligned = dir.dx !== 0 ? dy === 0 && Math.sign(dx) === dir.dx : dx === 0 && Math.sign(dy) === dir.dy;
    const distance = Math.abs(dx) + Math.abs(dy);
    if (!aligned || distance === 0 || distance > (trainer.los || 5)) return false;
    for (let step = 1; step < distance; step++) {
      const tx = runtime.x + dir.dx * step;
      const ty = runtime.y + dir.dy * step;
      if (blockingAt(tx, ty, key)) return false;
    }
    return true;
  }

  function updateCutscene() {
    const cutscene = state.cutscene;
    if (!cutscene || cutscene.kind !== "trainer") return;
    const trainer = trainersInRegion().find((item) => trainerKey(item) === cutscene.key);
    if (!trainer) {
      state.cutscene = null;
      return;
    }
    const runtime = trainerState(trainer);
    if (cutscene.phase === "alert") {
      cutscene.timer--;
      if (cutscene.timer <= 0) {
        cutscene.phase = "approach";
        cutscene.timer = 0;
        state.message = `${trainer.title}: ${trainer.text}`;
      }
      return;
    }
    cutscene.timer--;
    if (cutscene.timer > 0) return;
    cutscene.timer = 10;
    const distance = Math.abs(runtime.x - state.px) + Math.abs(runtime.y - state.py);
    if (distance <= 1) {
      startTrainerBattle(trainer);
      return;
    }
    const step = trainerStepToward(runtime, cutscene.key);
    if (!step) {
      startTrainerBattle(trainer);
      return;
    }
    runtime.x += step.dx;
    runtime.y += step.dy;
    runtime.facing = step.facing;
  }

  function trainerStepToward(runtime, key) {
    const candidates = [];
    const dx = state.px - runtime.x;
    const dy = state.py - runtime.y;
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) candidates.push({ dx: Math.sign(dx), dy: 0, facing: dx < 0 ? "left" : "right" });
    if (dy !== 0) candidates.push({ dx: 0, dy: Math.sign(dy), facing: dy < 0 ? "up" : "down" });
    if (Math.abs(dx) < Math.abs(dy) && dx !== 0) candidates.push({ dx: Math.sign(dx), dy: 0, facing: dx < 0 ? "left" : "right" });
    return candidates.find((step) => {
      const nx = runtime.x + step.dx;
      const ny = runtime.y + step.dy;
      if (nx === state.px && ny === state.py) return false;
      return !blockingAt(nx, ny, key);
    });
  }

  function startTrainerBattle(trainer) {
    const runtime = trainerState(trainer);
    const dx = state.px - runtime.x;
    const dy = state.py - runtime.y;
    if (Math.abs(dx) > Math.abs(dy)) runtime.facing = dx < 0 ? "left" : "right";
    else runtime.facing = dy < 0 ? "up" : "down";
    state.cutscene = null;
    startBattle(makeMon(trainer.persodon, trainer.level), { trainer, trainerKey: trainerKey(trainer) });
  }

  function startBattle(enemy, options = {}) {
    const player = firstUsablePartyMon();
    if (!player) {
      healParty();
      state.message = "Sua party foi curada de emergencia.";
      return;
    }
    state.mode = "battle";
    state.previousMode = null;
    state.battle = {
      enemy,
      player,
      gym: options.gym || null,
      trainer: options.trainer || null,
      trainerKey: options.trainerKey || null,
      mythic: Boolean(options.mythic),
      finalBoss: Boolean(options.finalBoss),
      wild: Boolean(options.wild) || (!options.gym && !options.trainer && !options.mythic && !options.finalBoss),
      aiTier: options.gym || options.elite || options.finalBoss ? "elite" : "standard",
      enemyItemsUsed: 0,
      message: battleIntro(enemy, options),
      finished: false,
      turnLock: false,
      menu: "action",
      actionIndex: 0,
      moveIndex: 0,
      turn: 1,
      participants: [player.uid],
    };
  }

  function battleIntro(enemy, options) {
    if (options.finalBoss) return `O ${enemy.name} corrompeu a Ilha Tein!`;
    if (options.gym) return `${options.gym.leader} chamou ${enemy.name}!`;
    if (options.trainer) return `${options.trainer.title} ${options.trainer.name} quer batalha!`;
    return `${enemy.name} apareceu!`;
  }

  function firstUsablePartyMon() {
    return state.party.find((mon) => mon.hp > 0) || null;
  }

  function handleBattleKey(key) {
    const battle = state.battle;
    if (!battle || battle.finished || battle.turnLock) return;
    
    if (battle.menu === "fight") {
      if (key === "x" || key === "escape") {
        battle.menu = "action";
        return;
      }
      
      const moveCount = battle.player.moves.length;
      if (key === "arrowup" || key === "w") battle.moveIndex = Math.max(0, battle.moveIndex - 2);
      if (key === "arrowdown" || key === "s") battle.moveIndex = Math.min(moveCount - 1, battle.moveIndex + 2);
      if (key === "arrowleft" || key === "a") battle.moveIndex = Math.max(0, battle.moveIndex - 1);
      if (key === "arrowright" || key === "d") battle.moveIndex = Math.min(moveCount - 1, battle.moveIndex + 1);
      
      if (key === "enter" || key === " ") chooseBattleMove(battle.moveIndex);
      
      const index = Number(key) - 1;
      if (index >= 0 && index < 4) chooseBattleMove(index);
      return;
    }
    
    if (key === "arrowup" || key === "w") battle.actionIndex = Math.max(0, battle.actionIndex - 2);
    if (key === "arrowdown" || key === "s") battle.actionIndex = Math.min(3, battle.actionIndex + 2);
    if (key === "arrowleft" || key === "a") battle.actionIndex = Math.max(0, battle.actionIndex - 1);
    if (key === "arrowright" || key === "d") battle.actionIndex = Math.min(3, battle.actionIndex + 1);
    
    if (key === "enter" || key === " ") {
      if (battle.actionIndex === 0) battle.menu = "fight";
      if (battle.actionIndex === 1) openBag("battle", "balls");
      if (battle.actionIndex === 2) openParty("battle");
      if (battle.actionIndex === 3) runBattle();
      return;
    }

    if (key === "1") battle.menu = "fight";
    if (key === "2") openBag("battle", "balls");
    if (key === "3" || key === "p") openParty("battle");
    if (key === "4" || key === "r") runBattle();
  }

  function chooseBattleMove(index) {
    const battle = state.battle;
    const slot = battle.player.moves[index];
    if (!slot) {
      battle.message = "Nao ha golpe nesse espaco.";
      battle.menu = "action";
      return;
    }
    if (slot.pp <= 0) {
      battle.message = `${moveData(slot.id).name} esta sem PP.`;
      battle.menu = "action";
      return;
    }
    battle.menu = "action";
    executeTurn(slot);
  }

  function executeTurn(playerSlot) {
    const battle = state.battle;
    if (!battle || battle.finished) return;
    battle.turnLock = true;
    const enemyAction = chooseEnemyAction(battle);
    const playerAction = { kind: "move", user: battle.player, target: battle.enemy, slot: playerSlot, player: true };
    const playerFirst = enemyAction.kind !== "item" && effectiveSpeed(battle.player) >= effectiveSpeed(battle.enemy);
    const first = playerFirst ? playerAction : enemyAction;
    const second = playerFirst ? enemyAction : playerAction;

    performBattleAction(first);
    if (checkBattleFaint()) return;
    setTimeout(() => {
      if (!state.battle || state.battle.finished) return;
      performBattleAction(second);
      if (checkBattleFaint()) return;
      setTimeout(() => {
        if (!state.battle || state.battle.finished) return;
        applyEndTurnStatuses();
        if (checkBattleFaint()) return;
        state.battle.turn++;
        state.battle.turnLock = false;
        state.battle.menu = "action";
      }, 500);
    }, 650);
  }

  function chooseEnemyAction(battle) {
    if (battle.aiTier === "elite") {
      const lowHp = battle.enemy.hp / battle.enemy.maxHp < 0.2;
      if (lowHp && battle.enemyItemsUsed < 1 && Math.random() < 0.5) {
        return { kind: "item", user: battle.enemy, target: battle.enemy, item: "Full Restore", player: false };
      }
    }
    return { kind: "move", user: battle.enemy, target: battle.player, slot: chooseEnemyMove(battle), player: false };
  }

  function chooseEnemyMove(battle) {
    const mon = battle.enemy;
    const usable = mon.moves.filter((slot) => slot.pp > 0);
    if (!usable.length) return { id: "STRUGGLE", pp: 1, maxPp: 1 };
    if (battle.aiTier !== "elite") {
      return usable[Math.floor(Math.random() * usable.length)];
    }
    let candidates = usable;
    if (battle.player.status || battle.player.confusion > 0) {
      const nonStatus = candidates.filter((slot) => !moveData(slot.id).status);
      if (nonStatus.length) candidates = nonStatus;
    }
    const ranked = candidates
      .map((slot) => {
        const move = moveData(slot.id);
        return { slot, multiplier: typeMultiplier(move.type, battle.player.types), power: move.power || 0 };
      })
      .sort((a, b) => b.multiplier - a.multiplier || b.power - a.power);
    const bestMultiplier = ranked[0]?.multiplier || 1;
    if (bestMultiplier > 1) {
      const best = ranked.filter((entry) => entry.multiplier === bestMultiplier);
      return best[Math.floor(Math.random() * best.length)].slot;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function effectiveSpeed(mon) {
    const speed = mon.status === "paralyze" ? Math.floor(mon.speed / 2) : mon.speed;
    return Math.max(1, speed);
  }

  function performBattleAction(action) {
    const { user, target, slot } = action;
    const battle = state.battle;
    if (action.kind === "item") {
      user.hp = user.maxHp;
      user.status = null;
      user.statusTurns = 0;
      user.confusion = 0;
      battle.enemyItemsUsed++;
      battle.message = `${battle.gym?.leader || battle.trainer?.name || "O rival"} usou ${action.item}!`;
      return;
    }
    const canAct = resolveCanAct(user);
    if (!canAct.ok) {
      battle.message = canAct.message;
      return;
    }

    const move = moveData(slot.id);
    if (slot.id !== "STRUGGLE") slot.pp = Math.max(0, slot.pp - 1);
    if (Math.random() * 100 >= move.accuracy) {
      battle.message = `${user.name} usou ${move.name}, mas errou!`;
      return;
    }
    if (move.shake) state.screenShake = Math.max(state.screenShake, move.shake);

    const result = calculateDamage(user, target, move);
    target.hp = Math.max(0, target.hp - result.damage);
    const effectText = effectivenessText(result.multiplier);
    const criticalText = result.critical ? "Golpe critico!" : "";
    battle.message = `${user.name} usou ${move.name}! ${criticalText} ${effectText}`.trim();

    if (result.damage > 0 && target.hp > 0) {
      const statusText = tryApplyMoveStatus(target, move);
      if (statusText) battle.message = `${battle.message} ${statusText}`;
    }
  }

  function resolveCanAct(mon) {
    if (mon.status === "sleep") {
      mon.statusTurns = Math.max(0, mon.statusTurns - 1);
      if (mon.statusTurns > 0) return { ok: false, message: `${mon.name} esta dormindo.` };
      mon.status = null;
      return { ok: true, message: `${mon.name} acordou.` };
    }
    if (mon.status === "freeze") {
      if (Math.random() < 0.2) {
        mon.status = null;
      } else {
        return { ok: false, message: `${mon.name} esta congelado.` };
      }
    }
    if (mon.status === "paralyze" && Math.random() < 0.25) {
      return { ok: false, message: `${mon.name} travou de paralisia.` };
    }
    if (mon.confusion > 0) {
      mon.confusion--;
      if (Math.random() < 0.5) {
        const damage = Math.max(1, Math.floor(mon.maxHp / 10));
        mon.hp = Math.max(0, mon.hp - damage);
        return { ok: false, message: `${mon.name} se confundiu e tomou dano.` };
      }
    }
    return { ok: true };
  }

  function calculateDamage(user, target, move) {
    if (move.power <= 0) return { damage: 0, multiplier: 1, critical: false };
    let attack = move.category === "special" ? user.spa : user.atk;
    const defense = effectiveDefense(target, move.category);
    if (user.status === "burn" && move.category === "physical") attack = Math.max(1, Math.floor(attack / 2));
    const base = (((2 * user.level) / 5 + 2) * move.power * (attack / Math.max(1, defense))) / 50 + 2;
    const stab = user.types.includes(move.type) ? 1.5 : 1;
    const multiplier = typeMultiplier(move.type, target.types);
    const critical = Math.random() < 0.0625;
    const criticalMod = critical ? 2 : 1;
    const variance = random(85, 100) / 100;
    const modifier = stab * multiplier * criticalMod * variance;
    const damage = multiplier === 0 ? 0 : Math.max(1, Math.floor(base * modifier));
    return { damage, multiplier, critical };
  }

  function effectiveDefense(mon, category) {
    const baseDefense = category === "special" ? mon.spdef : mon.def;
    if (state.party.some((partyMon) => partyMon.uid === mon.uid) && hasKeyItem("sacredMantle")) {
      return Math.floor(baseDefense * 1.2);
    }
    return baseDefense;
  }

  function hasKeyItem(id) {
    return Boolean((state.inventory.keyItems || []).find((item) => item.id === id && item.owned));
  }

  function typeMultiplier(attackType, targetTypes) {
    const chart = data.typeChart[attackType] || {};
    return targetTypes.reduce((total, type) => total * (chart[type] ?? 1), 1);
  }

  function effectivenessText(multiplier) {
    if (multiplier === 0) return "Nao afetou.";
    if (multiplier >= 2) return "Super efetivo!";
    if (multiplier > 0 && multiplier < 1) return "Pouco efetivo.";
    return "";
  }

  function tryApplyMoveStatus(target, move) {
    if (!move.status || Math.random() * 100 >= (move.statusChance || 0)) return "";
    if (move.status === "confusion") {
      if (target.confusion > 0) return "";
      target.confusion = random(2, 4);
      return `${target.name} ficou confuso.`;
    }
    if (target.status) return "";
    target.status = move.status;
    target.statusTurns = move.status === "sleep" ? random(2, 4) : 0;
    return `${target.name} sofreu ${statusLabel(target)}.`;
  }

  function applyEndTurnStatuses() {
    const battle = state.battle;
    [battle.player, battle.enemy].forEach((mon) => {
      if (mon.hp <= 0) return;
      if (mon.status === "poison" || mon.status === "burn") {
        const damage = Math.max(1, Math.floor(mon.maxHp / 12));
        mon.hp = Math.max(0, mon.hp - damage);
        battle.message = `${mon.name} sofreu dano de ${statusLabel(mon)}.`;
      }
    });
    if (battle.finalBoss && battle.enemy.hp > 0) {
      scrambleAlgorithmType(battle.enemy);
      battle.message = `${battle.message} O Algoritmo virou ${battle.enemy.types.join("/")}.`.trim();
    }
  }

  function scrambleAlgorithmType(mon) {
    const types = ["Civico", "Midia", "Culto", "Texano", "Petroleo", "Neve", "Fronteira", "Conspiracao", "Som", "Mito", "Illuminatiano"];
    const primary = types[random(0, types.length - 1)];
    let secondary = types[random(0, types.length - 1)];
    if (secondary === primary) secondary = "Som";
    mon.types = [primary, secondary];
  }

  function checkBattleFaint() {
    const battle = state.battle;
    if (!battle || battle.finished) return true;
    if (battle.enemy.hp <= 0) {
      winBattle();
      return true;
    }
    if (battle.player.hp <= 0) {
      const next = firstUsablePartyMon();
      if (next && next !== battle.player) {
        battle.player = next;
        if (!battle.participants.includes(next.uid)) battle.participants.push(next.uid);
        battle.message = `${next.name}, vai!`;
        battle.turnLock = false;
        battle.menu = "action";
        return true;
      }
      loseBattle();
      return true;
    }
    return false;
  }

  function throwBall(kind) {
    const battle = state.battle;
    if (!battle || battle.finished) return;
    if (battle.gym || battle.trainer || battle.finalBoss) {
      battle.message = "Nao da para capturar esta batalha.";
      closeOverlayToBattle();
      return;
    }
    const ball = state.balls[kind];
    if (!ball || ball.count <= 0) {
      battle.message = "Voce nao tem essa Ball.";
      closeOverlayToBattle();
      return;
    }
    ball.count--;
    closeOverlayToBattle();
    const result = captureCheck(battle.enemy, ball);
    if (result.caught) {
      addCaptured(battle.enemy);
      battle.message = `Gotcha! ${battle.enemy.name} foi capturado.`;
      finishBattle(false);
    } else {
      battle.message = captureFailMessage(ball.name, result.shakes);
      battle.turnLock = true;
      setTimeout(() => {
        if (!state.battle || state.battle.finished) return;
        performBattleAction(chooseEnemyAction(state.battle));
        if (!checkBattleFaint()) {
          state.battle.turnLock = false;
          state.battle.menu = "action";
        }
      }, 650);
    }
  }

  function captureCheck(mon, ball) {
    const statusMultiplier = captureStatusMultiplier(mon);
    const a = ((3 * mon.maxHp - 2 * mon.hp) * mon.catchRate * ball.multiplier * statusMultiplier) / (3 * mon.maxHp);
    if (a >= 255) return { caught: true, shakes: 4, a, b: 65536 };
    if (a <= 0) return { caught: false, shakes: 0, a, b: 0 };
    const b = Math.floor(65536 / Math.sqrt(Math.sqrt(255 / a)));
    let shakes = 0;
    for (let i = 0; i < 4; i++) {
      if (random(0, 65535) < b) shakes++;
      else break;
    }
    return { caught: shakes === 4, shakes, a, b };
  }

  function captureStatusMultiplier(mon) {
    if (mon.status === "sleep" || mon.status === "freeze") return 2;
    if (mon.status === "paralyze" || mon.status === "burn" || mon.status === "poison") return 1.5;
    return 1;
  }

  function captureFailMessage(ballName, shakes) {
    if (shakes === 0) return `${ballName} abriu sem tremer.`;
    if (shakes === 1) return `${ballName} tremeu uma vez.`;
    if (shakes === 2) return `${ballName} tremeu duas vezes.`;
    return `${ballName} quase capturou!`;
  }

  function addCaptured(mon) {
    if (!state.collection.includes(mon.id)) state.collection.push(mon.id);
    const captured = copyMonForStorage(mon);
    if (state.party.length < 6) {
      state.party.push(captured);
      state.message = `${mon.name} entrou na Party.`;
    } else {
      const boxNumber = storeInPc(captured);
      state.message = `${mon.name} foi enviado ao PC Box ${boxNumber}.`;
    }
  }

  function normalizeBoxes() {
    if (!Array.isArray(state.boxes[0])) {
      const flat = state.boxes.slice();
      state.boxes = [];
      for (let i = 0; i < flat.length; i += BOX_SIZE) state.boxes.push(flat.slice(i, i + BOX_SIZE));
    }
    if (!state.boxes.length) state.boxes.push([]);
  }

  function allBoxMons() {
    normalizeBoxes();
    return state.boxes.reduce((mons, box) => mons.concat(box), []);
  }

  function boxCount() {
    return allBoxMons().length;
  }

  function storeInPc(mon) {
    normalizeBoxes();
    let box = state.boxes.find((candidate) => candidate.length < BOX_SIZE);
    if (!box) {
      box = [];
      state.boxes.push(box);
    }
    box.push(mon);
    return state.boxes.indexOf(box) + 1;
  }

  function withdrawFirstFromPc() {
    normalizeBoxes();
    for (const box of state.boxes) {
      if (box.length) return box.shift();
    }
    return null;
  }

  function copyMonForStorage(mon) {
    return {
      ...clone(mon),
      uid: uidSeed++,
      hp: Math.max(1, mon.hp),
    };
  }

  function runBattle() {
    const battle = state.battle;
    if (!battle || battle.finished) return;
    if (battle.gym || battle.trainer || battle.mythic) {
      battle.message = "Nao da para correr desta batalha.";
      return;
    }
    battle.message = "Voce escapou.";
    finishBattle(false);
  }

  function winBattle() {
    const battle = state.battle;
    battle.turnLock = true;
    const expText = grantBattleExp(battle.enemy);
    if (battle.gym) {
      state.badges.push(battle.gym.id);
      const reward = gainMoney(battle.enemy.level * 160);
      battle.message = `${battle.gym.leader} entregou ${battle.gym.badge}! +CK$${reward}. ${expText}`;
    } else if (battle.trainer) {
      if (!state.defeatedTrainers.includes(battle.trainerKey)) state.defeatedTrainers.push(battle.trainerKey);
      const reward = gainMoney(battle.enemy.level * 90);
      battle.message = `${battle.trainer.name}: ${battle.trainer.defeatedText} +CK$${reward}. ${expText}`;
      if (battle.trainer.rewardItem) {
        awardKeyItem(battle.trainer.rewardItem);
        if (battle.trainer.rewardItem === "sacredMantle") setFieldFlag("sacred-mantle-earned");
        battle.message = `${battle.message} Recebeu ${keyItemName(battle.trainer.rewardItem)}!`;
      }
    } else if (battle.finalBoss) {
      setFieldFlag("algorithm-defeated");
      battle.message = `O Algoritmo foi depurado. ${expText}`;
    } else if (battle.mythic) {
      battle.message = `O mito recuou. ${expText}`;
    } else {
      battle.message = `${battle.enemy.name} caiu. ${expText}`;
    }
    finishBattle(true);
  }

  function gainMoney(amount) {
    const reward = Math.max(0, Math.floor(amount));
    state.money += reward;
    return reward;
  }

  function awardKeyItem(id) {
    const item = (state.inventory.keyItems || []).find((entry) => entry.id === id);
    if (item) item.owned = true;
  }

  function keyItemName(id) {
    return (state.inventory.keyItems || []).find((entry) => entry.id === id)?.name || id;
  }

  function grantBattleExp(enemy) {
    const battle = state.battle;
    const gained = Math.max(8, Math.floor(enemy.level * 9 + enemy.maxHp / 3));
    const messages = [];
    battle.participants.forEach((uid) => {
      const mon = state.party.find((item) => item.uid === uid);
      if (!mon) return;
      messages.push(grantExp(mon, gained));
    });
    return messages.filter(Boolean).join(" ");
  }

  function grantExp(mon, amount) {
    mon.exp += amount;
    const lines = [`${mon.name} +${amount}EXP.`];
    while (mon.exp >= mon.expToNext) {
      mon.exp -= mon.expToNext;
      mon.level++;
      const oldMax = mon.maxHp;
      applyStats(mon, true);
      mon.hp = Math.min(mon.maxHp, mon.hp + (mon.maxHp - oldMax));
      lines.push(`L${mon.level}!`);
      const learned = learnMovesForLevel(mon);
      if (learned) lines.push(learned);
      const evo = tryEvolution(mon);
      if (evo) lines.push(evo);
    }
    return lines.join(" ");
  }

  function learnMovesForLevel(mon) {
    const base = byId(mon.id);
    const candidates = (base.learnset || []).filter((entry) => entry.level <= mon.level).map((entry) => moveKey(entry.move));
    const nextMove = candidates.find((move) => !mon.moves.some((slot) => slot.id === move));
    if (!nextMove) return "";
    const details = moveData(nextMove);
    if (mon.moves.length >= 4) {
      const forgotten = moveData(mon.moves[0].id).name;
      mon.moves.shift();
      mon.moves.push({ id: nextMove, pp: details.pp, maxPp: details.pp });
      return `Aprendeu ${details.name}, esqueceu ${forgotten}.`;
    }
    mon.moves.push({ id: nextMove, pp: details.pp, maxPp: details.pp });
    return `Aprendeu ${details.name}.`;
  }

  function tryEvolution(mon, itemId) {
    const evolution = data.evolutions[mon.id];
    if (!evolution) return "";
    const levelOk = evolution.level && mon.level >= evolution.level;
    const itemOk = itemId && evolution.item === itemId;
    if (!levelOk && !itemOk) return "";
    const from = mon.name;
    mon.id = evolution.to;
    applyStats(mon, true);
    const base = byId(mon.id);
    const current = new Set(mon.moves.map((slot) => slot.id));
    chooseMoves(base, mon.level).forEach((move) => {
      const id = moveKey(move);
      if (current.has(id)) return;
      const details = moveData(id);
      if (mon.moves.length >= 4) mon.moves.shift();
      mon.moves.push({ id, pp: details.pp, maxPp: details.pp });
      current.add(id);
    });
    if (!state.collection.includes(mon.id)) state.collection.push(mon.id);
    return `${from} evoluiu para ${mon.name}!`;
  }

  function loseBattle() {
    healParty();
    state.region = "votuporanga";
    state.px = 14;
    state.py = 9;
    state.battle.message = "Voce apagou e voltou para Votuporanga.";
    finishBattle(false);
  }

  function finishBattle(healAfter) {
    const battle = state.battle;
    battle.finished = true;
    setTimeout(() => {
      state.mode = "overworld";
      state.previousMode = null;
      state.battle = null;
      if (healAfter) restorePpForParty();
      state.message = state.message.includes("foi enviado") || state.message.includes("entrou na Party")
        ? state.message
        : state.badges.length === 7
          ? "7 badges! A Ilha Tein esta chamando."
          : "A jornada continua.";
    }, 1200);
  }

  function healParty() {
    state.party.forEach((mon) => {
      mon.hp = mon.maxHp;
      mon.status = null;
      mon.statusTurns = 0;
      mon.confusion = 0;
      mon.moves.forEach((slot) => {
        slot.pp = slot.maxPp;
      });
    });
  }

  function restorePpForParty() {
    state.party.forEach((mon) => {
      mon.moves.forEach((slot) => {
        slot.pp = Math.max(slot.pp, Math.ceil(slot.maxPp / 3));
      });
    });
  }

  function statusLabel(mon) {
    if (mon.status) return data.statusNames[mon.status] || mon.status.toUpperCase();
    if (mon.confusion > 0) return data.statusNames.confusion;
    return "";
  }

  function openBag(previousMode, pocketId) {
    state.previousMode = previousMode || state.mode;
    state.mode = "bag";
    state.menuPocket = Math.max(0, POCKETS.findIndex((pocket) => pocket.id === pocketId));
    if (state.menuPocket < 0) state.menuPocket = 0;
    state.menuIndex = 0;
  }

  function openParty(previousMode) {
    state.previousMode = previousMode || state.mode;
    state.mode = "party";
    state.partyIndex = 0;
  }

  function openPc() {
    state.previousMode = "overworld";
    state.mode = "pc";
  }

  function openShop() {
    state.previousMode = "overworld";
    state.mode = "shop";
    state.shopIndex = 0;
  }

  function closeOverlay() {
    if (state.previousMode === "battle") {
      closeOverlayToBattle();
    } else {
      state.mode = state.previousMode || "overworld";
      state.previousMode = null;
    }
  }

  function closeOverlayToBattle() {
    state.mode = "battle";
    state.previousMode = null;
    if (state.battle) {
      state.battle.menu = "action";
      state.battle.turnLock = false;
    }
  }

  function activePocket() {
    return POCKETS[state.menuPocket] || POCKETS[0];
  }

  function pocketItems() {
    const pocket = activePocket().id;
    if (pocket === "balls") {
      return Object.entries(state.balls).map(([id, ball]) => ({ ...ball, id, pocket: "balls" }));
    }
    return (state.inventory[pocket] || []).map((item) => ({ ...item, pocket }));
  }

  function handleBagKey(key) {
    if (key === "x" || key === "escape") {
      closeOverlay();
      return;
    }
    if (["1", "2", "3", "4"].includes(key)) {
      state.menuPocket = Number(key) - 1;
      state.menuIndex = 0;
      return;
    }
    const items = pocketItems();
    if (key === "arrowup" || key === "w") state.menuIndex = Math.max(0, state.menuIndex - 1);
    if (key === "arrowdown" || key === "s") state.menuIndex = Math.min(Math.max(0, items.length - 1), state.menuIndex + 1);
    if (key === "enter" || key === " ") useSelectedBagItem(items[state.menuIndex]);
  }

  function useSelectedBagItem(item) {
    if (!item) return;
    if (item.pocket === "balls") {
      if (state.previousMode !== "battle") {
        state.message = "Balls so podem ser usadas em batalha.";
        closeOverlay();
        return;
      }
      throwBall(item.id);
      return;
    }
    if (item.pocket === "general") {
      useGeneralItem(item);
      return;
    }
    if (item.pocket === "tmsHms" && item.move) {
      if (state.previousMode === "battle") {
        state.message = "TM/HM nao pode ser usado no turno.";
        closeOverlayToBattle();
        return;
      }
      teachMoveToLead(item);
      return;
    }
    state.message = item.description || `${item.name} esta na mochila.`;
    closeOverlay();
  }

  function useGeneralItem(item) {
    const stored = (state.inventory.general || []).find((entry) => entry.id === item.id);
    if (!stored || stored.count <= 0) {
      state.message = "Item indisponivel.";
      return;
    }
    const target = state.previousMode === "battle" && state.battle ? state.battle.player : state.party[0];
    if (!target) return;
    if (item.heal) {
      if (target.hp >= target.maxHp) {
        state.message = `${target.name} ja esta com HP cheio.`;
        return;
      }
      stored.count--;
      target.hp = Math.min(target.maxHp, target.hp + item.heal);
      state.message = `${item.name} curou ${target.name}.`;
      if (state.previousMode === "battle") enemyTurnAfterItem();
      else closeOverlay();
      return;
    }
    if (item.cures) {
      stored.count--;
      if (target.status && item.cures.includes(target.status)) target.status = null;
      if (target.confusion > 0 && item.cures.includes("confusion")) target.confusion = 0;
      state.message = `${target.name} voltou ao normal.`;
      if (state.previousMode === "battle") enemyTurnAfterItem();
      else closeOverlay();
      return;
    }
    if (item.evolveItem) {
      const evolved = tryEvolution(target, item.evolveItem);
      if (!evolved) {
        state.message = "Nada aconteceu.";
        return;
      }
      stored.count--;
      state.message = evolved;
      closeOverlay();
      return;
    }
  }

  function teachMoveToLead(item) {
    const stored = (state.inventory.tmsHms || []).find((entry) => entry.id === item.id);
    const target = state.party[0];
    if (!stored || !target) return;
    const move = moveData(item.move);
    if (target.moves.some((slot) => slot.id === moveKey(item.move))) {
      state.message = `${target.name} ja conhece ${move.name}.`;
      return;
    }
    if (target.moves.length >= 4) target.moves.shift();
    target.moves.push({ id: moveKey(item.move), pp: move.pp, maxPp: move.pp });
    if (!item.fieldAbility) stored.count = Math.max(0, stored.count - 1);
    state.message = `${target.name} aprendeu ${move.name}.`;
    closeOverlay();
  }

  function handlePartyKey(key) {
    if (key === "x" || key === "escape") {
      closeOverlay();
      return;
    }
    if (["1", "2", "3", "4", "5", "6"].includes(key)) {
      state.partyIndex = Math.min(Number(key) - 1, state.party.length - 1);
      if (state.previousMode === "battle") switchBattleMon(state.partyIndex);
      else setLeadMon(state.partyIndex);
      return;
    }
    if (key === "arrowup" || key === "w") state.partyIndex = Math.max(0, state.partyIndex - 1);
    if (key === "arrowdown" || key === "s") state.partyIndex = Math.min(Math.max(0, state.party.length - 1), state.partyIndex + 1);
    if (key === "enter" || key === " ") {
      if (state.previousMode === "battle") switchBattleMon(state.partyIndex);
      else setLeadMon(state.partyIndex);
    }
  }

  function setLeadMon(index) {
    if (index <= 0 || index >= state.party.length) return;
    const [mon] = state.party.splice(index, 1);
    state.party.unshift(mon);
    state.partyIndex = 0;
    state.message = `${mon.name} lidera a party.`;
  }

  function switchBattleMon(index) {
    const battle = state.battle;
    const mon = state.party[index];
    if (!battle || !mon || mon.hp <= 0) {
      state.message = "Esse Persodon nao pode lutar.";
      return;
    }
    if (mon === battle.player) {
      closeOverlayToBattle();
      return;
    }
    setLeadMon(index);
    battle.player = state.party[0];
    if (!battle.participants.includes(battle.player.uid)) battle.participants.push(battle.player.uid);
    closeOverlayToBattle();
    battle.turnLock = true;
    battle.message = `${battle.player.name}, vai!`;
    setTimeout(() => {
      if (!state.battle || state.battle.finished) return;
      performBattleAction(chooseEnemyAction(state.battle));
      if (!checkBattleFaint()) {
        state.battle.turnLock = false;
        state.battle.menu = "action";
      }
    }, 650);
  }

  function enemyTurnAfterItem() {
    closeOverlayToBattle();
    const battle = state.battle;
    if (!battle || battle.finished) return;
    battle.turnLock = true;
    battle.message = state.message;
    setTimeout(() => {
      if (!state.battle || state.battle.finished) return;
      performBattleAction(chooseEnemyAction(state.battle));
      if (checkBattleFaint()) return;
      applyEndTurnStatuses();
      if (checkBattleFaint()) return;
      state.battle.turn++;
      state.battle.turnLock = false;
      state.battle.menu = "action";
    }, 650);
  }

  function handlePcKey(key) {
    if (key === "x" || key === "escape") {
      closeOverlay();
      return;
    }
    if (key === "1" || key === "enter" || key === " ") {
      withdrawFromPcToParty();
      return;
    }
    if (key === "2" || key === "shift" || key === "b") {
      depositPartyMonToPc();
    }
  }

  function withdrawFromPcToParty() {
    if (state.party.length >= 6 || boxCount() === 0) {
      state.message = "Nao da para retirar agora.";
      return;
    }
    const mon = withdrawFirstFromPc();
    if (!mon) {
      state.message = "Box vazia.";
      return;
    }
    state.party.push(mon);
    state.message = `${mon.name} saiu do PC.`;
  }

  function depositPartyMonToPc() {
    if (state.party.length <= 1) {
      state.message = "Voce precisa manter 1 Persodon.";
      return;
    }
    const mon = state.party.pop();
    const boxNumber = storeInPc(mon);
    state.message = `${mon.name} foi para o PC Box ${boxNumber}.`;
  }

  function handleShopKey(key) {
    const catalog = data.shopCatalog || [];
    if (key === "x" || key === "escape") {
      closeOverlay();
      return;
    }
    if (key === "arrowup" || key === "w") state.shopIndex = Math.max(0, state.shopIndex - 1);
    if (key === "arrowdown" || key === "s") state.shopIndex = Math.min(Math.max(0, catalog.length - 1), state.shopIndex + 1);
    if (["1", "2", "3", "4"].includes(key)) state.shopIndex = Math.min(Number(key) - 1, Math.max(0, catalog.length - 1));
    if (key === "enter" || key === " ") buyShopItem(catalog[state.shopIndex]);
  }

  function buyShopItem(item) {
    if (!item) return;
    if (state.money < item.price) {
      state.message = "CK$ insuficiente.";
      return;
    }
    state.money -= item.price;
    if (item.pocket === "balls") {
      if (!state.balls[item.id]) return;
      state.balls[item.id].count++;
      state.message = `Comprou ${item.name}.`;
      return;
    }
    const stored = (state.inventory[item.pocket] || []).find((entry) => entry.id === item.id);
    if (!stored) return;
    stored.count = (stored.count || 0) + 1;
    state.message = `Comprou ${item.name}.`;
  }

  function handleSaveKey(key) {
    if (key === "x" || key === "escape") {
      closeOverlay();
      return;
    }
    if (["1", "2", "3"].includes(key)) {
      state.saveIndex = Number(key) - 1;
      return;
    }
    if (key === "arrowup" || key === "w" || key === "arrowleft" || key === "a") {
      state.saveIndex = Math.max(0, state.saveIndex - 1);
      return;
    }
    if (key === "arrowdown" || key === "s" || key === "arrowright" || key === "d") {
      state.saveIndex = Math.min(SAVE_SLOT_COUNT - 1, state.saveIndex + 1);
      return;
    }
    if (key === "enter" || key === " ") {
      saveGameToSlot(state.saveIndex + 1);
      return;
    }
    if (key === "l") {
      loadGameFromSlot(state.saveIndex + 1);
    }
  }

  function drawBagOverlay() {
    drawOverlayBase("BAG");
    POCKETS.forEach((pocket, index) => {
      const x = 12 + index * 54;
      drawText(`${index + 1} ${pocket.label}`, x, 24, index === state.menuPocket ? "#e03228" : "#181818");
    });
    const items = pocketItems();
    if (!items.length) {
      drawText("Vazio.", 18, 48, "#181818");
    }
    items.slice(0, 6).forEach((item, index) => {
      const y = 48 + index * 14;
      const selected = index === state.menuIndex;
      const count = item.count !== undefined ? ` x${item.count}` : item.owned ? " OK" : "";
      drawText(`${selected ? ">" : " "} ${shorten(item.name, 18)}${count}`, 18, y, selected ? "#e03228" : "#181818");
    });
    drawText(shorten(state.message, 32), 18, 130, "#181818");
    drawText("A: USE  X: VOLTA", 72, 144, "#181818");
  }

  function drawPartyOverlay() {
    drawOverlayBase("PARTY");
    for (let i = 0; i < 6; i++) {
      const mon = state.party[i];
      const y = 28 + i * 16;
      if (!mon) {
        drawText(`${i + 1} --`, 14, y, "#707070");
        continue;
      }
      const selected = i === state.partyIndex;
      drawText(`${selected ? ">" : " "}${i + 1} ${shorten(mon.name, 10)} L${mon.level}`, 14, y, selected ? "#e03228" : "#181818");
      drawText(`${mon.hp}/${mon.maxHp} ${statusLabel(mon) || "OK"}`, 118, y, "#181818");
    }
    const selected = state.party[state.partyIndex] || state.party[0];
    if (selected) {
      drawWindow(126, 28, 106, 76);
      drawText(shorten(selected.name, 12), 134, 38, "#181818");
      drawText(selected.types.join("/"), 134, 51, "#181818");
      drawText(`HP ${selected.hp}/${selected.maxHp}`, 134, 64, "#181818");
      drawText(`ATK ${selected.atk} DEF ${selected.def}`, 134, 77, "#181818");
      drawText(`SPA ${selected.spa} SDF ${selected.spdef}`, 134, 90, "#181818");
      drawText(`SPD ${selected.speed}`, 134, 103, "#181818");
    }
    drawText(state.previousMode === "battle" ? "A: TROCA  X: VOLTA" : "A: LIDER  X: VOLTA", 54, 144, "#181818");
  }

  function drawPcOverlay() {
    drawOverlayBase("PC BOX");
    drawText(`PARTY ${state.party.length}/6`, 16, 32, "#181818");
    state.party.slice(0, 6).forEach((mon, index) => drawText(`${index + 1} ${shorten(mon.name, 12)} L${mon.level}`, 18, 48 + index * 12, "#181818"));
    const boxMons = allBoxMons();
    const firstBox = state.boxes[0] || [];
    drawText(`BOXES ${state.boxes.length}`, 128, 32, "#181818");
    drawText(`BOX1 ${firstBox.length}/${BOX_SIZE}`, 128, 44, "#181818");
    boxMons.slice(0, 6).forEach((mon, index) => drawText(`${shorten(mon.name, 12)} L${mon.level}`, 128, 58 + index * 12, "#181818"));
    drawText(shorten(state.message, 42), 18, 146, "#181818");
    drawText("A/1 RETIRA  B/2 DEPOSITA", 24, 162, "#181818");
    drawText("X: VOLTA", 98, 176, "#181818");
  }

  function drawShopOverlay() {
    const catalog = data.shopCatalog || [];
    drawOverlayBase("LOJA");
    drawText(`CK$ ${state.money}`, 154, 14, "#181818");
    drawText("CURA / KIRK BALL", 18, 30, "#e03228");
    catalog.forEach((item, index) => {
      const y = 48 + index * 18;
      const selected = index === state.shopIndex;
      drawText(`${selected ? ">" : " "}${index + 1} ${shorten(item.name, 14)}`, 18, y, selected ? "#e03228" : "#181818");
      drawText(`CK$${item.price}`, 152, y, "#181818");
    });
    drawText(shorten(state.message, 32), 18, 124, "#181818");
    drawText("A: COMPRA  X: VOLTA", 62, 144, "#181818");
  }

  function drawSaveOverlay() {
    drawOverlayBase("SAVE/LOAD");
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
      const slot = i + 1;
      const save = readSaveSlot(slot);
      const y = 36 + i * 30;
      const selected = i === state.saveIndex;
      drawWindow(18, y - 4, 204, 26);
      drawText(`${selected ? ">" : " "} SLOT ${slot}`, 28, y + 2, selected ? "#e03228" : "#181818");
      if (save) {
        drawText(`${shorten(save.playerName || "Save", 13)} ${saveBadgeCount(save)}/7`, 88, y + 2, "#181818");
        drawText(formatSaveDate(save.savedAt), 88, y + 14, "#181818");
      } else {
        drawText("VAZIO", 88, y + 8, "#707070");
      }
    }
    drawText("A: SALVA  L: CARREGA", 54, 132, "#181818");
    drawText("1-3 SLOT  X: VOLTA", 62, 144, "#181818");
  }

  function formatSaveDate(savedAt) {
    if (!savedAt) return "--";
    const date = new Date(savedAt);
    if (Number.isNaN(date.getTime())) return "--";
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  function drawOverlayBase(title) {
    ctx.fillStyle = "#101018";
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    drawWindow(4, 4, LOGICAL_W - 8, LOGICAL_H - 8);
    drawText(title, 14, 13, "#e03228");
  }

  function isRunning() {
    return state.mode === "overworld" && hasRunningShoes() && (keyState.has("shift") || keyState.has("b"));
  }

  function hasRunningShoes() {
    return Boolean((state.inventory.keyItems || []).find((item) => item.id === "runningShoes" && item.owned));
  }

  function random(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function handleKeydown(event) {
    const key = event.key.toLowerCase();

    // Don't prevent default if we're typing in an input
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
      return;
    }

    if (
      [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "w",
        "a",
        "d",
        " ",
        "enter",
        "shift",
      ].includes(key)
    ) {
      event.preventDefault();
    }
    keyState.add(key);


    if (state.mode === "overworld") {
      if (key === " " || key === "enter") interact();
      if (key === "i") openBag("overworld");
      if (key === "p") openParty("overworld");
      if (key === "m") openSaveMenu("overworld");
      return;
    }
    if (state.mode === "battle") {
      handleBattleKey(key);
      return;
    }
    if (state.mode === "bag") {
      handleBagKey(key);
      return;
    }
    if (state.mode === "party") {
      handlePartyKey(key);
      return;
    }
    if (state.mode === "pc") {
      handlePcKey(key);
      return;
    }
    if (state.mode === "shop") {
      handleShopKey(key);
      return;
    }
    if (state.mode === "save") {
      handleSaveKey(key);
    }
  }

  function handleKeyup(event) {
    keyState.delete(event.key.toLowerCase());
  }

  function movementVector() {
    if (keyState.has("arrowup") || keyState.has("w")) return [0, -1];
    if (keyState.has("arrowdown") || keyState.has("s")) return [0, 1];
    if (keyState.has("arrowleft") || keyState.has("a")) return [-1, 0];
    if (keyState.has("arrowright") || keyState.has("d")) return [1, 0];
    return [0, 0];
  }

  function update() {
    state.frame++;
    if (state.inputCooldown > 0) state.inputCooldown--;
    if (state.screenShake > 0) state.screenShake--;
    updateCutscene();
    const [mx, my] = movementVector();
    state.walking = state.mode === "overworld" && !state.cutscene && (mx !== 0 || my !== 0);
    if (state.mode === "overworld" && !state.cutscene && state.inputCooldown === 0) {
      if (mx !== 0 || my !== 0) {
        const moved = tryMove(mx, my);
        state.inputCooldown = moved ? (isRunning() ? 4 : 8) : 5;
        scanTrainerSight();
      } else {
        scanTrainerSight();
      }
    }
  }

  function render() {
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    if (state.screenShake > 0) {
      const offset = state.screenShake % 2 === 0 ? 2 : -2;
      ctx.translate(offset, 0);
    }
    if (!state.ready) {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      drawDialog("CARREGANDO ASSETS...");
    } else if (state.mode === "battle") {
      drawBattle();
    } else if (state.mode === "bag") {
      drawBagOverlay();
    } else if (state.mode === "party") {
      drawPartyOverlay();
    } else if (state.mode === "pc") {
      drawPcOverlay();
    } else if (state.mode === "shop") {
      drawShopOverlay();
    } else if (state.mode === "save") {
      drawSaveOverlay();
    } else {
      drawWorld();
    }
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  prepareCanvas();
  setupStarterCards();
  setupSaveLoadButtons();
  startButton.addEventListener("click", startGame);
  fullscreenButton?.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    (gameWrap || document.documentElement).requestFullscreen?.();
  });
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("keyup", handleKeyup);

  function setupMobileControls() {
    const buttons = {
      btnUp: "w",
      btnDown: "s",
      btnLeft: "a",
      btnRight: "d",
      btnA: "enter",
      btnB: "shift",
      btnMenu: "m",
      btnBag: "i",
      btnParty: "p",
      btnX: "x",
    };

    Object.entries(buttons).forEach(([id, key]) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      let pressed = false;
      let pointerId = null;

      const start = (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        if (pressed) return;
        pressed = true;
        pointerId = e.pointerId ?? null;
        if (pointerId !== null) {
          try {
            btn.setPointerCapture?.(pointerId);
          } catch (error) {
            // Programmatic pointer events may not have an active capture target.
          }
        }
        handleKeydown({ key, target: btn, preventDefault: () => {} });
      };
      const end = (e) => {
        e.preventDefault();
        if (!pressed) return;
        if (pointerId !== null && e.pointerId !== undefined && e.pointerId !== pointerId) return;
        pressed = false;
        if (pointerId !== null && btn.hasPointerCapture?.(pointerId)) btn.releasePointerCapture(pointerId);
        pointerId = null;
        handleKeyup({ key: key.toLowerCase() });
      };

      if (window.PointerEvent) {
        btn.addEventListener("pointerdown", start);
        btn.addEventListener("pointerup", end);
        btn.addEventListener("pointercancel", end);
        btn.addEventListener("lostpointercapture", end);
      } else {
        btn.addEventListener("touchstart", start, { passive: false });
        btn.addEventListener("touchend", end, { passive: false });
        btn.addEventListener("touchcancel", end, { passive: false });
        btn.addEventListener("mousedown", start);
        btn.addEventListener("mouseup", end);
        btn.addEventListener("mouseleave", end);
      }
    });
  }
  setupMobileControls();


  loadImages(imagePaths()).then(() => {
    state.ready = true;
  });
  loop();
})();
