'use strict';
// ============ RIFLE QUEST — juego principal ============

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const VW = 480, VH = 270;

function fitCanvas() {
  const s = Math.max(1, Math.floor(Math.min(window.innerWidth / VW, window.innerHeight / VH)));
  canvas.style.width = (VW * s) + 'px';
  canvas.style.height = (VH * s) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// ---------- FUENTE PIXEL 3x5 ----------
const FONT = {
  A:['010','101','111','101','101'],B:['110','101','110','101','110'],C:['011','100','100','100','011'],
  D:['110','101','101','101','110'],E:['111','100','110','100','111'],F:['111','100','110','100','100'],
  G:['011','100','101','101','011'],H:['101','101','111','101','101'],I:['111','010','010','010','111'],
  J:['001','001','001','101','010'],K:['101','101','110','101','101'],L:['100','100','100','100','111'],
  M:['101','111','111','101','101'],N:['110','101','101','101','101'],O:['010','101','101','101','010'],
  P:['110','101','110','100','100'],Q:['010','101','101','010','001'],R:['110','101','110','101','101'],
  S:['011','100','010','001','110'],T:['111','010','010','010','010'],U:['101','101','101','101','111'],
  V:['101','101','101','101','010'],W:['101','101','111','111','101'],X:['101','101','010','101','101'],
  Y:['101','101','010','010','010'],Z:['111','001','010','100','111'],
  '0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],
  '3':['111','001','011','001','111'],'4':['101','101','111','001','001'],'5':['111','100','111','001','111'],
  '6':['111','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],
  '9':['111','101','111','001','111'],'-':['000','000','111','000','000'],'!':['010','010','010','000','010'],
  '¡':['010','000','010','010','010'],':':['000','010','000','010','000'],'.':['000','000','000','000','010'],
  ',':['000','000','000','010','100'],'+':['000','010','111','010','000'],'?':['110','001','010','000','010'],
  '¿':['010','000','010','100','011'],"'":['010','010','000','000','000'],'/':['001','001','010','100','100'],
  '<':['001','010','100','010','001'],'>':['100','010','001','010','100'],
};
function _norm(ch) {
  const map = { 'Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U','Ñ':'N','Ü':'U','—':'-' };
  return map[ch] || ch;
}
function pixTextW(text, s) { return text.length * 4 * s - s; }
function pixText(g, text, x, y, s, color, align) {
  text = text.toUpperCase();
  if (align === 'center') x -= Math.floor(pixTextW(text, s) / 2);
  else if (align === 'right') x -= pixTextW(text, s);
  g.fillStyle = color;
  for (const chRaw of text) {
    const ch = _norm(chRaw);
    const gl = FONT[ch];
    if (gl) {
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
        if (gl[r][c] === '1') g.fillRect(x + c * s, y + r * s, s, s);
      }
    }
    x += 4 * s;
  }
}
function uiText(g, text, x, y, color, size, align) {
  g.font = (size || 7) + 'px monospace';
  g.textAlign = align || 'left';
  g.textBaseline = 'top';
  g.fillStyle = color;
  g.fillText(text, x, y);
  g.textAlign = 'left';
}

// ---------- INPUT ----------
const keys = {}, pressed = {};
const GAME_KEYS = new Set(['KeyW','KeyA','KeyS','KeyD','KeyF','KeyL','KeyG','KeyK','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Minus','NumpadSubtract','Enter','Space','Escape','KeyP','KeyM','KeyR']);
window.addEventListener('keydown', e => {
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  if (!e.repeat) pressed[e.code] = true;
  keys[e.code] = true;
  AudioSys.ensure();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
function anyPressed(...codes) { return codes.some(c => pressed[c]); }

// P2 dispara con L (también sirve la tecla "-")
function p2FireHeld() { return keys.KeyL || keys.Minus || keys.NumpadSubtract; }
function p2FirePressed() { return pressed.KeyL || pressed.Minus || pressed.NumpadSubtract; }

function playerInput(idx, solo) {
  if (idx === 0) {
    const inp = {
      left: keys.KeyA, right: keys.KeyD, down: keys.KeyS,
      jump: keys.KeyW, jumpPressed: pressed.KeyW, fire: keys.KeyF,
      grenade: pressed.KeyG,
    };
    if (solo) { // en solitario también sirven las flechas
      inp.left = inp.left || keys.ArrowLeft;
      inp.right = inp.right || keys.ArrowRight;
      inp.down = inp.down || keys.ArrowDown;
      inp.jump = inp.jump || keys.ArrowUp;
      inp.jumpPressed = inp.jumpPressed || pressed.ArrowUp;
      inp.fire = inp.fire || p2FireHeld();
      inp.grenade = inp.grenade || pressed.KeyK;
    }
    return inp;
  }
  return {
    left: keys.ArrowLeft, right: keys.ArrowRight, down: keys.ArrowDown,
    jump: keys.ArrowUp, jumpPressed: pressed.ArrowUp,
    fire: p2FireHeld(),
    grenade: pressed.KeyK,
  };
}

// ---------- ESTADO GLOBAL ----------
const game = {
  state: 'title',
  time: 0,
  nPlayers: 1,
  charSel: [0, 1],
  selDone: [false, false],
  unlocked: 0,
  completed: new Array(TOTAL_LEVELS).fill(false),
  coins: 0,
  inv: {},
  upg: { dmg: 0, firerate: 0, hp: 0, speed: 0, djump: 0, iman: 0, chaleco: 0, suerte: 0, pierce: 0, vampiro: 0 },
  weaponsOwned: ['rifle_caza'],
  weaponEq: ['rifle_caza', 'rifle_caza'],
  skinsOwned: [0],
  skinEq: [0, 0],
  itemsOwned: [],
  itemSel: [null, null],
  itemCur: [0, 0],
  itemDone: [false, false],
  pets: [],            // [{species, hp, bonus, armor, turret}] máx 5
  petsEntities: [],
  bestiary: {},        // especies cazadas alguna vez
  hired: { pizza: false, super: false, gas: false },
  shopReturn: null,
  petMenu: null,
  pendingLevel: -1,
  curLevel: 0,
  worldCursor: 0,
  levelCursor: 0,
  shopTab: 0,
  shopCursor: 0,
  pauseCursor: 0,
  paused: false,
  level: null,
  players: [], bullets: [], eprojs: [], animals: [], drops: [], parts: [], floats: [],
  plats: [], springs: [], checkpoints: [], coinsE: [], ambient: [],
  boss: null, exitE: null,
  camX: 0, camY: 0, shake: 0,
  checkpointPos: { x: 0, y: 0 },
  snapshot: null,
  hunted: 0,
  levelTitleT: 0,
  soldTotal: 0,
  msg: '', msgT: 0,

  addParticle(x, y, vx, vy, color, life, grav = true) {
    this.parts.push({ x, y, vx, vy, color, life, maxLife: life, grav });
  },
  addFloat(x, y, text, color) {
    this.floats.push({ x, y, text, color: color || PAL.white, t: 60 });
  },
  onBossDead(boss) {
    const d = boss.def;
    this.inv[d.trophy] = (this.inv[d.trophy] || 0) + 1;
    this.addFloat(boss.x, boss.y - 20, '¡' + LOOT[d.trophy].label + '!', PAL.gold);
    const nCoins = Math.round(d.coins * (1 + 0.5 * (boss.tier - 1)));
    for (let i = 0; i < nCoins; i++) {
      this.drops.push({ type: 'coin', x: boss.x + boss.w / 2, y: boss.y + boss.h / 2, vx: (Math.random() - 0.5) * 5, vy: -3 - Math.random() * 3, t: 0 });
    }
    for (let i = 0; i < 30; i++) this.addParticle(boss.x + boss.w / 2, boss.y + boss.h / 2, (Math.random() - 0.5) * 5, -Math.random() * 4, [PAL.gold, PAL.orange, PAL.red][i % 3], 50);
    if (this.exitE) this.exitE.open = true;
    this.hunted++;
    setTimeout(() => SFX.win(), 800);
  },
  onPetDead(pet) {
    // pérdida permanente: la mascota y todo su equipo
    const i = this.pets.indexOf(pet.rec);
    if (i >= 0) this.pets.splice(i, 1);
    this.addFloat(pet.x, pet.y - 14, '¡' + pet.def.name + ' HA CAÍDO PARA SIEMPRE!', PAL.red);
    this.shake = 8;
    SFX.dead();
    saveGame();
  },
};

// ---------- GUARDADO (v2) ----------
function saveGame() {
  try {
    localStorage.setItem('rifleQuestSave2', JSON.stringify({
      unlocked: game.unlocked, completed: game.completed, coins: game.coins,
      upg: game.upg, inv: game.inv, nPlayers: game.nPlayers, charSel: game.charSel,
      weaponsOwned: game.weaponsOwned, weaponEq: game.weaponEq,
      skinsOwned: game.skinsOwned, skinEq: game.skinEq,
      itemsOwned: game.itemsOwned, pets: game.pets, bestiary: game.bestiary, hired: game.hired,
    }));
  } catch (e) { /* sin almacenamiento */ }
}
function loadSave() {
  try {
    const d = JSON.parse(localStorage.getItem('rifleQuestSave2'));
    if (d) {
      game.unlocked = Math.min(d.unlocked || 0, TOTAL_LEVELS - 1);
      if (Array.isArray(d.completed)) {
        game.completed = new Array(TOTAL_LEVELS).fill(false);
        d.completed.forEach((v, i) => { if (i < TOTAL_LEVELS) game.completed[i] = !!v; });
      }
      game.coins = d.coins || 0;
      game.upg = Object.assign(game.upg, d.upg);
      game.inv = d.inv || {};
      game.nPlayers = d.nPlayers || 1;
      game.charSel = d.charSel || [0, 1];
      game.weaponsOwned = d.weaponsOwned || ['rifle_caza'];
      game.weaponEq = d.weaponEq || ['rifle_caza', 'rifle_caza'];
      game.skinsOwned = d.skinsOwned || [0];
      game.skinEq = d.skinEq || [0, 0];
      game.itemsOwned = d.itemsOwned || [];
      game.pets = d.pets || [];
      game.bestiary = d.bestiary || {};
      game.hired = Object.assign(game.hired, d.hired);
      return;
    }
    // migración desde la versión anterior (20 niveles)
    const old = JSON.parse(localStorage.getItem('rifleQuestSave'));
    if (old) {
      game.coins = old.coins || 0;
      game.upg = Object.assign(game.upg, old.upg);
      game.nPlayers = old.nPlayers || 1;
      game.charSel = old.charSel || [0, 1];
      const ou = old.unlocked || 0;
      game.unlocked = Math.floor(ou / 4) * LEVELS_PER_WORLD + (ou % 4);
      saveGame();
    }
  } catch (e) { /* guardado corrupto */ }
}
function wipeSave() {
  localStorage.removeItem('rifleQuestSave');
  localStorage.removeItem('rifleQuestSave2');
  game.unlocked = 0; game.completed = new Array(TOTAL_LEVELS).fill(false);
  game.coins = 0; game.inv = {}; game.upg = { dmg: 0, firerate: 0, hp: 0, speed: 0, djump: 0, iman: 0, chaleco: 0, suerte: 0, pierce: 0, vampiro: 0 };
  game.weaponsOwned = ['rifle_caza']; game.weaponEq = ['rifle_caza', 'rifle_caza'];
  game.skinsOwned = [0]; game.skinEq = [0, 0];
  game.itemsOwned = []; game.itemSel = [null, null];
  game.pets = []; game.bestiary = {}; game.hired = { pizza: false, super: false, gas: false };
}

// ---------- CARGA DE NIVEL ----------
function loadLevel(idx) {
  const lvl = genLevel(idx);
  game.level = lvl;
  game.curLevel = idx;
  setPhysicsWorld(lvl, game);
  game.bullets = []; game.eprojs = []; game.animals = []; game.drops = [];
  game.parts = []; game.floats = []; game.plats = []; game.springs = [];
  game.checkpoints = []; game.coinsE = []; game.ambient = [];
  game.boss = null; game.exitE = null;
  game.hunted = 0;
  game.levelTitleT = 140;
  game.shake = 0;
  game.paused = false;

  for (const e of lvl.entities) {
    if (e.type === 'coin') game.coinsE.push({ x: e.x, y: e.y, w: 8, h: 8, gem: false, taken: false });
    else if (e.type === 'gem') game.coinsE.push({ x: e.x, y: e.y, w: 8, h: 8, gem: true, taken: false });
    else if (e.type === 'spring') game.springs.push({ x: e.x, y: e.y, w: 12, h: 8, anim: 0 });
    else if (e.type === 'mplat') game.plats.push({ x: e.x, y: e.y, x0: e.x, y0: e.y, w: e.w, h: 8, axis: e.axis, range: e.range, speed: e.speed, t: Math.random() * 6, solid: true, dx: 0, crumble: false });
    else if (e.type === 'cplat') game.plats.push({ x: e.x, y: e.y, x0: e.x, y0: e.y, w: e.w, h: 8, solid: true, dx: 0, crumble: true, cstate: 0, ctimer: 0, vy: 0 });
    else if (e.type === 'checkpoint') game.checkpoints.push({ x: e.x, y: e.y, w: 12, h: 36, active: false });
    else if (e.type === 'exit') game.exitE = { x: e.x, y: e.y, w: 42, h: 48, open: true };
    else if (e.type === 'animal') game.animals.push(new Animal(e.id, e.x, e.y));
    else if (e.type === 'boss') game.boss = new Boss(e.bossIdx, e.x, e.y, e.tier);
  }
  if (lvl.isBoss) {
    const gy = (lvl.hT - 5) * TILE;
    game.exitE = { x: lvl.exitX, y: gy - 48, w: 42, h: 48, open: false };
  }

  const prevs = game.players;
  game.players = [];
  for (let i = 0; i < game.nPlayers; i++) {
    const p = new Player(i, game.charSel[i]);
    p.x = lvl.spawn.x + i * 18;
    p.y = lvl.spawn.y;
    // la vida se conserva entre niveles (el Botiquín de la tienda cura)
    const prev = prevs && prevs[i];
    if (prev && prev.charIdx === game.charSel[i]) {
      p.hp = prev.dead ? Math.max(2, Math.ceil(p.maxHp() / 2)) : Math.max(1, Math.min(prev.hp, p.maxHp()));
    } else {
      p.hp = p.maxHp();
    }
    game.players.push(p);
  }
  // items elegidos al entrar
  for (const p of game.players) {
    const it = game.itemSel[p.idx];
    p.moto = it === 'moto';
    p.drink = it === 'bebida';
    p.grenades = it === 'granada' ? 3 : 0;
    p.shield = game.upg.chaleco || 0;
  }
  // mascotas equipadas (hasta 5, con su vida guardada)
  game.petsEntities = game.pets.map((rec, i) => new Pet(rec, lvl.spawn.x - 10 - i * 8, lvl.spawn.y));

  game.checkpointPos = { x: lvl.spawn.x, y: lvl.spawn.y };
  game.snapshot = { coins: game.coins, inv: JSON.parse(JSON.stringify(game.inv)) };
  game.camX = 0; game.camY = Math.max(0, lvl.hT * TILE - VH);
  AudioSys.playMusic(lvl.isBoss ? 10 : lvl.world);
}

function restartLevel(msg) {
  game.coins = game.snapshot.coins;
  game.inv = JSON.parse(JSON.stringify(game.snapshot.inv));
  game.players = []; // reinicio limpio: vida completa
  loadLevel(game.curLevel);
  if (msg) { game.msg = msg; game.msgT = 130; }
}

// ---------- EXPLOSIÓN DE COHETE ----------
function explodeRocket(b) {
  game.shake = Math.max(game.shake, 9);
  SFX.explosion();
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 3;
    game.addParticle(b.x, b.y, Math.cos(a) * sp, Math.sin(a) * sp - 0.5,
      [PAL.yellow, PAL.orange, PAL.red, PAL.lgray][i % 4], 20 + Math.random() * 18, i % 3 === 0);
  }
  for (const a of game.animals) {
    if (a.dead) continue;
    const d = Math.hypot(a.x + a.w / 2 - b.x, a.y + a.h / 2 - b.y);
    if (d < b.aoe) a.hit(b.aoeDmg, Math.sign(a.x - b.x) || 1);
  }
  if (game.boss && !game.boss.dead) {
    const bo = game.boss;
    const d = Math.hypot(bo.x + bo.w / 2 - b.x, bo.y + bo.h / 2 - b.y);
    if (d < b.aoe + Math.max(bo.w, bo.h) / 2) bo.hit(b.aoeDmg);
  }
}

// ---------- ACTUALIZACIÓN: JUEGO ----------
function updatePlay() {
  const lvl = game.level;

  if (anyPressed('Escape', 'KeyP')) {
    game.paused = !game.paused;
    game.pauseCursor = 0;
    SFX.select();
  }
  if (game.paused) { updatePause(); return; }

  const solo = game.nPlayers === 1;
  for (const p of game.players) p.update(playerInput(p.idx, solo));

  // muertes y reapariciones
  const alive = game.players.filter(p => !p.dead);
  if (alive.length === 0) {
    if (game.players.every(p => p.deadTimer < 170)) restartLevel('¡EQUIPO CAÍDO! NIVEL REINICIADO');
  } else {
    for (const p of game.players) {
      if (p.dead && p.deadTimer <= 0) {
        const buddy = alive[0];
        p.respawn(buddy.x, buddy.y - 10);
        game.addFloat(p.x, p.y - 10, '¡DE VUELTA!', PAL.lime);
      }
      if (!p.dead && p.y > lvl.hT * TILE + 30) {
        p.hp -= 1;
        SFX.hurt();
        if (p.hp <= 0) { p.dead = true; p.deadTimer = 240; SFX.dead(); }
        else {
          p.x = game.checkpointPos.x; p.y = game.checkpointPos.y;
          p.vx = 0; p.vy = 0; p.invuln = 90;
        }
      }
    }
  }

  // balas y cohetes del jugador
  for (const b of game.bullets) {
    b.x += b.vx;
    if (b.vy) b.y += b.vy;
    if (b.grav) b.vy = (b.vy || 0) + b.grav;
    b.dist += Math.abs(b.vx);
    if (b.rocket && Math.random() < 0.6) game.addParticle(b.x - Math.sign(b.vx) * 5, b.y + 1, -Math.sign(b.vx) * 0.5, (Math.random() - 0.5) * 0.6, Math.random() < 0.5 ? PAL.orange : PAL.lgray, 12, false);
    if (tileAt(b.x, b.y) === 1 || b.dist > b.range) {
      b.hit = true;
      if (b.rocket) explodeRocket(b);
      else game.addParticle(b.x, b.y, -Math.sign(b.vx), -0.5, PAL.yellow, 8);
      continue;
    }
    for (const a of game.animals) {
      if (a.dead || a.collected) continue;
      if (b.hitSet && b.hitSet.includes(a)) continue;
      if (b.x > a.x - 2 && b.x < a.x + a.w + 2 && b.y > a.y - 2 && b.y < a.y + a.h + 2) {
        a.hit(b.dmg, Math.sign(b.vx));
        if (b.rocket) { b.hit = true; explodeRocket(b); }
        else if (b.pierce > 0) {
          // balas perforantes: siguen su camino
          b.pierce--;
          (b.hitSet = b.hitSet || []).push(a);
          game.addParticle(b.x, b.y, 0, -1, PAL.red, 12);
        } else {
          b.hit = true;
          game.addParticle(b.x, b.y, 0, -1, PAL.red, 12);
        }
        break;
      }
    }
    if (!b.hit && game.boss && !game.boss.dead) {
      const bo = game.boss;
      if (b.x > bo.x && b.x < bo.x + bo.w && b.y > bo.y && b.y < bo.y + bo.h) {
        if (bo.hit(b.dmg)) {
          b.hit = true;
          if (b.rocket) explodeRocket(b);
        }
      }
    }
  }
  game.bullets = game.bullets.filter(b => !b.hit);

  // plataformas móviles y que se desmoronan
  for (const p of game.plats) {
    if (p.crumble) {
      const stood = game.players.some(pl => pl.groundPlat === p);
      if (p.cstate === 0 && stood) { p.cstate = 1; p.ctimer = 26; SFX.crumble(); }
      else if (p.cstate === 1) {
        p.ctimer--;
        if (p.ctimer <= 0) { p.cstate = 2; p.solid = false; p.vy = 0; }
      } else if (p.cstate === 2) {
        p.vy = Math.min(p.vy + 0.3, 6);
        p.y += p.vy;
        if (p.y > game.level.hT * TILE + 40) { p.cstate = 3; p.ctimer = 170; }
      } else if (p.cstate === 3) {
        p.ctimer--;
        if (p.ctimer <= 0) { p.cstate = 0; p.solid = true; p.y = p.y0; }
      }
      p.dx = 0;
    } else {
      p.t += 0.016 * p.speed * 3;
      const old = p.x;
      const off = (Math.sin(p.t) * 0.5 + 0.5) * p.range;
      if (p.axis === 'x') p.x = p.x0 + off; else p.y = p.y0 + off;
      p.dx = p.x - old;
    }
  }

  // animales
  for (const a of game.animals) a.update();
  for (const a of game.animals) {
    if (a.dead || a.def.dmg === 0) continue;
    for (const p of game.players) {
      if (!p.dead && aabb(p, a)) p.hurt(a.def.dmg, p.x < a.x ? -1 : 1);
    }
    // los animales agresivos también dañan a las mascotas
    for (const pet of game.petsEntities) {
      if (!pet.dead && aabb(pet, a)) pet.hurt(a.def.dmg);
    }
  }
  // mascotas
  for (const pet of game.petsEntities) pet.update();
  game.petsEntities = game.petsEntities.filter(p => !p.dead);
  // recoger presas (pisarlas)
  for (const a of game.animals) {
    if (!a.dead || a.collected) continue;
    for (const p of game.players) {
      if (p.dead) continue;
      const feet = p.y + p.h;
      if (p.x + p.w > a.x && p.x < a.x + a.w && feet > a.y - 2 && feet < a.y + a.h + 4 && (p.onGround || p.vy > 0.5)) {
        a.collected = true;
        game.hunted++;
        game.bestiary[a.id] = true; // ¡ya puedes reclutarlo como mascota!
        SFX.stomp();
        setTimeout(() => SFX.collect(), 90);
        // instinto vampiro: probabilidad de curarte
        if (game.upg.vampiro && Math.random() < 0.25 * game.upg.vampiro && p.hp < p.maxHp()) {
          p.hp++;
          game.addFloat(p.x, p.y - 18, '+1 VIDA', PAL.red);
        }
        let dy = 0;
        for (const [lootId, n] of a.def.loot) {
          game.inv[lootId] = (game.inv[lootId] || 0) + n;
          game.addFloat(a.x, a.y - 8 - dy, '+' + n + ' ' + LOOT[lootId].label, LOOT[lootId].icon === 'meat' ? PAL.pink : PAL.tan);
          dy += 10;
        }
        for (let i = 0; i < 8; i++) game.addParticle(a.x + a.w / 2, a.y + a.h / 2, (Math.random() - 0.5) * 2.5, -Math.random() * 2, PAL.cream, 20);
        if (p.vy > 0.5) p.vy = -4;
        break;
      }
    }
  }
  game.animals = game.animals.filter(a => !a.collected);

  // boss
  if (game.boss) {
    game.boss.update();
    const bo = game.boss;
    if (!bo.dead && !bo.underground && bo.state !== 'intro') {
      const bossDmg = (bo.tier >= 2 && bo.enraged) ? 2 : 1; // furia de tier alto pega doble
      for (const p of game.players) {
        if (!p.dead && aabb(p, bo)) p.hurt(bossDmg, p.x < bo.x ? -1 : 1);
      }
      for (const pet of game.petsEntities) {
        if (!pet.dead && aabb(pet, bo)) pet.hurt(1);
      }
    }
  }

  // proyectiles enemigos
  for (const pr of game.eprojs) {
    if (pr.grav) pr.vy = Math.min(pr.vy + 0.18, 6);
    pr.x += pr.vx; pr.y += pr.vy;
    const hitGround = tileAt(pr.x + pr.w / 2, pr.y + pr.h) === 1 && pr.vy > 0;
    const hitWall = !pr.grav && tileAt(pr.x + pr.w / 2, pr.y + pr.h / 2) === 1;
    if (hitGround || hitWall) {
      pr.gone = true;
      for (let i = 0; i < 4; i++) game.addParticle(pr.x + pr.w / 2, pr.y + pr.h, (Math.random() - 0.5) * 2, -Math.random() * 1.5, PAL.lgray, 15);
      continue;
    }
    if (pr.x < -20 || pr.x > lvl.wT * TILE + 20 || pr.y > lvl.hT * TILE + 40) { pr.gone = true; continue; }
    for (const p of game.players) {
      if (!p.dead && aabb(p, pr)) { p.hurt(pr.dmg, Math.sign(pr.vx) || -p.facing); pr.gone = true; break; }
    }
    if (!pr.gone) {
      for (const pet of game.petsEntities) {
        if (!pet.dead && aabb(pet, pr)) { pet.hurt(pr.dmg); pr.gone = true; break; }
      }
    }
  }
  game.eprojs = game.eprojs.filter(pr => !pr.gone);

  // monedas que caen de animales
  for (const d of game.drops) {
    d.t++;
    d.vy = Math.min(d.vy + 0.25, 6);
    d.x += d.vx; d.y += d.vy;
    if (tileAt(d.x, d.y + 4) === 1 && d.vy > 0) { d.vy *= -0.4; d.vx *= 0.7; d.y -= 1; }
    if (d.t > 15) {
      for (const p of game.players) {
        if (p.dead) continue;
        const dx = p.x + p.w / 2 - d.x, dy = p.y + p.h / 2 - d.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 14) {
          d.gone = true; game.coins++; SFX.coin();
          break;
        } else if (dist < 55 + (game.upg.iman || 0) * 35) {
          d.x += dx / dist * 2.2; d.y += dy / dist * 2.2; d.vy = 0;
        }
      }
    }
    if (d.t > 2100) d.gone = true;
  }
  game.drops = game.drops.filter(d => !d.gone);

  // monedas fijas del nivel
  for (const c of game.coinsE) {
    if (c.taken) continue;
    for (const p of game.players) {
      if (!p.dead && aabb(p, c)) {
        c.taken = true;
        game.coins += c.gem ? 5 : 1;
        game.addFloat(c.x, c.y - 6, c.gem ? '+5' : '+1', c.gem ? PAL.pink : PAL.gold);
        c.gem ? SFX.gem() : SFX.coin();
        break;
      }
    }
  }

  // resortes
  for (const s of game.springs) {
    if (s.anim > 0) s.anim--;
    for (const p of game.players) {
      if (p.dead || p.vy < 0) continue;
      const feet = p.y + p.h;
      if (p.x + p.w > s.x && p.x < s.x + s.w && feet > s.y && feet < s.y + s.h + 6) {
        p.vy = -10.8 * p.def.jump;
        p.jumpsLeft = game.upg.djump ? 1 : 0;
        s.anim = 12;
        SFX.spring();
      }
    }
  }

  // checkpoints
  for (const c of game.checkpoints) {
    if (c.active) continue;
    for (const p of game.players) {
      if (!p.dead && aabb(p, c)) {
        c.active = true;
        game.checkpointPos = { x: c.x, y: c.y };
        game.addFloat(c.x, c.y - 10, '¡CHECKPOINT!', PAL.lime);
        SFX.checkpoint();
        break;
      }
    }
  }

  // salida
  if (game.exitE && game.exitE.open) {
    for (const p of game.players) {
      if (!p.dead && aabb(p, game.exitE)) { completeLevel(); return; }
    }
  }

  // partículas y textos
  for (const pt of game.parts) {
    pt.life--;
    if (pt.grav) pt.vy += 0.12;
    pt.x += pt.vx; pt.y += pt.vy;
  }
  game.parts = game.parts.filter(p => p.life > 0);
  for (const f of game.floats) { f.t--; f.y -= 0.5; }
  game.floats = game.floats.filter(f => f.t > 0);

  // partículas ambientales (en el volcán suben brasas)
  if (game.time % 6 === 0 && game.ambient.length < 40) {
    const rising = lvl.biome === 'volcan';
    game.ambient.push({
      x: game.camX + Math.random() * (VW + 60) - 30,
      y: rising ? game.camY + VH + 10 : game.camY - 10,
      vx: (Math.random() - 0.5) * 0.5 - (lvl.biome === 'desierto' ? 0.8 : 0) + (lvl.biome === 'montana' ? 1.0 : 0),
      vy: rising ? -0.5 - Math.random() * 0.6 : 0.3 + Math.random() * 0.5,
      ph: Math.random() * 6,
    });
  }
  for (const am of game.ambient) {
    am.ph += 0.04;
    am.x += am.vx + Math.sin(am.ph) * 0.3;
    am.y += am.vy;
    if (am.y > game.camY + VH + 10 || am.y < game.camY - 20) am.gone = true;
  }
  game.ambient = game.ambient.filter(a => !a.gone);

  // cámara
  const targets = game.players.filter(p => !p.dead);
  if (targets.length) {
    const tx = targets.reduce((a, p) => a + p.x, 0) / targets.length - VW / 2;
    const ty = targets.reduce((a, p) => a + p.y, 0) / targets.length - VH / 2 - 20;
    game.camX += (Math.max(0, Math.min(lvl.wT * TILE - VW, tx)) - game.camX) * 0.12;
    game.camY += (Math.max(0, Math.min(lvl.hT * TILE - VH, ty)) - game.camY) * 0.12;
  }
  if (targets.length > 1) {
    for (const p of targets) {
      p.x = Math.max(game.camX + 2, Math.min(game.camX + VW - p.w - 2, p.x));
    }
  }
  if (game.shake > 0) game.shake--;
  if (game.levelTitleT > 0) game.levelTitleT--;
  if (game.msgT > 0) game.msgT--;
}

function updatePause() {
  const opts = 5;
  if (anyPressed('KeyW', 'ArrowUp')) { game.pauseCursor = (game.pauseCursor + opts - 1) % opts; SFX.select(); }
  if (anyPressed('KeyS', 'ArrowDown')) { game.pauseCursor = (game.pauseCursor + 1) % opts; SFX.select(); }
  if (anyPressed('KeyF', 'Enter', 'KeyL', 'Minus', 'NumpadSubtract', 'Space')) {
    const c = game.pauseCursor;
    if (c === 0) game.paused = false;
    else if (c === 1) { restartLevel('NIVEL REINICIADO'); }
    else if (c === 2) { game.state = 'levelsel'; AudioSys.playMusic(11); }
    else if (c === 3) { AudioSys.toggleSound(); }
    else if (c === 4) { AudioSys.toggleMusic(); if (AudioSys.musicOn) AudioSys.playMusic(game.level.isBoss ? 10 : game.level.world); }
    SFX.confirm();
  }
}

function completeLevel() {
  game.completed[game.curLevel] = true;
  game.unlocked = Math.max(game.unlocked, Math.min(TOTAL_LEVELS - 1, game.curLevel + 1));
  // las mascotas que sobrevivieron guardan su vida para la siguiente
  for (const pet of game.petsEntities) {
    if (!pet.dead) pet.rec.hp = Math.max(1, pet.hp);
  }
  game.state = 'shop';
  game.shopTab = 0;
  game.shopCursor = 0;
  game.soldTotal = 0;
  game.shopReturn = null;
  saveGame();
  SFX.win();
  AudioSys.playMusic(11);
}

// ---------- TIENDA (pestañas) ----------
const SHOP_TABS = ['VENDER', 'MEJORAS', 'ARMAS', 'SKINS', 'ITEMS', 'MASCOTAS'];

function bestiaryList() { return Object.keys(game.bestiary).filter(id => ANIMALS[id]); }

function shopRows() {
  // filas navegables por pestaña (la última siempre es CONTINUAR)
  if (game.shopTab === 0) return 2;
  if (game.shopTab === 1) return UPGRADES.length + 1;
  if (game.shopTab === 2) return WEAPONS.length + 1;
  if (game.shopTab === 3) return SKINS.length + 1;
  if (game.shopTab === 4) return ITEMS.length + 1;
  return bestiaryList().length + 1;
}
function sellValue() {
  let total = 0;
  const bonus = game.players.some(p => p.def.sellBonus) ? 1.5 : 1;
  for (const [id, n] of Object.entries(game.inv)) {
    if (LOOT[id]) total += Math.round(LOOT[id].price * n * bonus);
  }
  return total;
}

function shopContinue() {
  SFX.confirm();
  if (game.shopReturn === 'city') {
    game.shopReturn = null;
    enterCity();
    return;
  }
  if (game.curLevel === TOTAL_LEVELS - 1 && game.completed[TOTAL_LEVELS - 1]) { game.state = 'victory'; }
  else {
    game.state = 'levelsel';
    game.worldCursor = levelWorld(game.curLevel);
    game.levelCursor = Math.min(levelStage(game.curLevel) + 1, LEVELS_PER_WORLD - 1);
    if (levelStage(game.curLevel) === LEVELS_PER_WORLD - 1) game.state = 'worldsel';
  }
  AudioSys.playMusic(11);
}

// menú emergente de una mascota reclutada
function updatePetMenu() {
  const pm = game.petMenu;
  const rec = game.pets[pm.petIdx];
  if (!rec) { game.petMenu = null; return; }
  const opts = petMenuOptions(rec);
  if (anyPressed('KeyW', 'ArrowUp')) { pm.cursor = (pm.cursor + opts.length - 1) % opts.length; SFX.select(); }
  if (anyPressed('KeyS', 'ArrowDown')) { pm.cursor = (pm.cursor + 1) % opts.length; SFX.select(); }
  if (anyPressed('Escape')) { game.petMenu = null; SFX.select(); return; }
  if (!anyPressed('KeyF', 'Enter', 'Space', 'KeyL')) return;
  const o = opts[pm.cursor];
  if (o.id === 'cerrar') { game.petMenu = null; SFX.select(); return; }
  if (o.id === 'despedir') {
    game.pets.splice(pm.petIdx, 1);
    game.petMenu = null;
    saveGame();
    SFX.confirm();
    return;
  }
  if (o.disabled) { SFX.denied(); return; }
  if (game.coins < o.price) { SFX.denied(); return; }
  game.coins -= o.price;
  if (o.id === 'vida') { rec.bonus++; rec.hp = ANIMALS[rec.species].hp + rec.bonus; }
  else if (o.id === 'armadura') rec.armor = true;
  else if (o.id === 'torreta') rec.turret = true;
  else if (o.id === 'curar') rec.hp = ANIMALS[rec.species].hp + rec.bonus;
  SFX.buy();
  saveGame();
}

function petMenuOptions(rec) {
  const maxHp = ANIMALS[rec.species].hp + rec.bonus;
  return [
    { id: 'vida', label: '+1 VIDA MAXIMA', price: petVidaPrice(rec.bonus) },
    { id: 'armadura', label: rec.armor ? 'ARMADURA: YA TIENE' : 'ARMADURA (4 ESCUDOS)', price: PET_ARMOR_PRICE, disabled: rec.armor },
    { id: 'torreta', label: rec.turret ? 'TORRETA: YA TIENE' : 'TORRETA AUTOMATICA', price: PET_TURRET_PRICE, disabled: rec.turret },
    { id: 'curar', label: 'CURAR (' + rec.hp + '/' + maxHp + ')', price: PET_HEAL_PRICE, disabled: rec.hp >= maxHp },
    { id: 'despedir', label: 'DESPEDIR MASCOTA', price: 0 },
    { id: 'cerrar', label: 'CERRAR', price: 0 },
  ];
}

function updateShop() {
  if (game.petMenu) { updatePetMenu(); return; }
  const n = shopRows();
  if (anyPressed('KeyA', 'ArrowLeft')) { game.shopTab = (game.shopTab + SHOP_TABS.length - 1) % SHOP_TABS.length; game.shopCursor = 0; SFX.select(); }
  if (anyPressed('KeyD', 'ArrowRight')) { game.shopTab = (game.shopTab + 1) % SHOP_TABS.length; game.shopCursor = 0; SFX.select(); }
  if (anyPressed('KeyW', 'ArrowUp')) { game.shopCursor = (game.shopCursor + n - 1) % n; SFX.select(); }
  if (anyPressed('KeyS', 'ArrowDown')) { game.shopCursor = (game.shopCursor + 1) % n; SFX.select(); }
  if (anyPressed('Escape') && game.shopReturn === 'city') { shopContinue(); return; }

  const actP1 = anyPressed('KeyF', 'Enter', 'Space');
  const actP2 = p2FirePressed();
  if (!actP1 && !actP2) return;
  const c = game.shopCursor;

  if (c === n - 1) { shopContinue(); return; }

  if (game.shopTab === 0) {
    const v = sellValue();
    if (v > 0) {
      game.coins += v;
      game.soldTotal += v;
      game.inv = {};
      SFX.sell();
      saveGame();
    } else SFX.denied();

  } else if (game.shopTab === 1) {
    const u = UPGRADES[c];
    const lvl = u.id === 'heal' ? 0 : game.upg[u.id];
    const price = upgradePrice(u, lvl);
    if (u.id !== 'heal' && game.upg[u.id] >= u.max) { SFX.denied(); }
    else if (game.coins >= price) {
      game.coins -= price;
      if (u.id === 'heal') { for (const p of game.players) { p.dead = false; p.hp = p.maxHp(); } }
      else game.upg[u.id]++;
      if (u.id === 'hp') for (const p of game.players) p.hp = Math.min(p.hp + 1, p.maxHp());
      if (u.id === 'chaleco') for (const p of game.players) p.shield = game.upg.chaleco;
      SFX.buy();
      saveGame();
    } else SFX.denied();

  } else if (game.shopTab === 2) {
    const w = WEAPONS[c];
    const owned = game.weaponsOwned.includes(w.id);
    if (!owned) {
      if (game.coins >= w.price) {
        game.coins -= w.price;
        game.weaponsOwned.push(w.id);
        SFX.buy();
      } else { SFX.denied(); return; }
    }
    if (actP1) { game.weaponEq[0] = w.id; SFX.confirm(); }
    if (actP2 && game.nPlayers === 2) { game.weaponEq[1] = w.id; SFX.confirm(); }
    saveGame();

  } else if (game.shopTab === 3) {
    const sk = SKINS[c];
    const owned = game.skinsOwned.includes(sk.idx);
    if (!owned) {
      if (game.coins >= sk.price) {
        game.coins -= sk.price;
        game.skinsOwned.push(sk.idx);
        SFX.buy();
      } else { SFX.denied(); return; }
    }
    if (actP1) { game.skinEq[0] = sk.idx; SFX.confirm(); }
    if (actP2 && game.nPlayers === 2) { game.skinEq[1] = sk.idx; SFX.confirm(); }
    saveGame();

  } else if (game.shopTab === 4) {
    // items: se compran una vez, se eligen al entrar a un nivel
    const it = ITEMS[c];
    if (game.itemsOwned.includes(it.id)) { SFX.denied(); return; }
    if (game.coins >= it.price) {
      game.coins -= it.price;
      game.itemsOwned.push(it.id);
      SFX.buy();
      saveGame();
    } else SFX.denied();

  } else if (game.shopTab === 5) {
    // mascotas: reclutar del bestiario o abrir su menú
    const list = bestiaryList();
    const sp = list[c];
    if (!sp) { SFX.denied(); return; }
    const petIdx = game.pets.findIndex(r => r.species === sp);
    if (petIdx >= 0) {
      game.petMenu = { petIdx, cursor: 0 };
      SFX.select();
    } else {
      const price = petRecruitPrice(sp);
      if (game.pets.length >= 5) { SFX.denied(); game.addFloat(0, 0, '', PAL.red); return; }
      if (game.coins >= price) {
        game.coins -= price;
        game.pets.push({ species: sp, hp: ANIMALS[sp].hp, bonus: 0, armor: false, turret: false });
        SFX.buy();
        saveGame();
      } else SFX.denied();
    }
  }
}

// ---------- SELECTOR DE MUNDOS Y NIVELES ----------
function worldUnlocked(w) { return game.unlocked >= w * LEVELS_PER_WORLD; }
function worldProgress(w) {
  let n = 0;
  for (let i = 0; i < LEVELS_PER_WORLD; i++) if (game.completed[w * LEVELS_PER_WORLD + i]) n++;
  return n;
}

function updateWorldsel() {
  // 0-9 mundos, 10 = LA CIUDAD (siempre abierta)
  const c = game.worldCursor;
  if (anyPressed('KeyA', 'ArrowLeft')) { game.worldCursor = (c + 10) % 11; SFX.select(); }
  if (anyPressed('KeyD', 'ArrowRight')) { game.worldCursor = (c + 1) % 11; SFX.select(); }
  if (anyPressed('KeyW', 'ArrowUp')) {
    game.worldCursor = c === 10 ? 5 : c >= 5 ? c - 5 : 10;
    SFX.select();
  }
  if (anyPressed('KeyS', 'ArrowDown')) {
    game.worldCursor = c < 5 ? c + 5 : c < 10 ? 10 : 0;
    SFX.select();
  }
  if (anyPressed('KeyF', 'Enter', 'KeyL', 'Minus', 'NumpadSubtract', 'Space')) {
    if (game.worldCursor === 10) { enterCity(); SFX.confirm(); return; }
    if (worldUnlocked(game.worldCursor)) {
      game.state = 'levelsel';
      const base = game.worldCursor * LEVELS_PER_WORLD;
      game.levelCursor = Math.max(0, Math.min(LEVELS_PER_WORLD - 1, game.unlocked - base));
      SFX.confirm();
    } else SFX.denied();
  }
  if (anyPressed('Escape')) { game.state = 'charsel'; game.selDone = [false, false]; SFX.select(); }
}

function updateLevelsel() {
  if (anyPressed('KeyA', 'ArrowLeft')) { game.levelCursor = Math.max(0, game.levelCursor - 1); SFX.select(); }
  if (anyPressed('KeyD', 'ArrowRight')) { game.levelCursor = Math.min(LEVELS_PER_WORLD - 1, game.levelCursor + 1); SFX.select(); }
  if (anyPressed('KeyW', 'ArrowUp')) { game.levelCursor = Math.max(0, game.levelCursor - 10); SFX.select(); }
  if (anyPressed('KeyS', 'ArrowDown')) { game.levelCursor = Math.min(LEVELS_PER_WORLD - 1, game.levelCursor + 10); SFX.select(); }
  if (anyPressed('KeyF', 'Enter', 'KeyL', 'Minus', 'NumpadSubtract', 'Space')) {
    const flat = game.worldCursor * LEVELS_PER_WORLD + game.levelCursor;
    if (flat <= game.unlocked) {
      SFX.confirm();
      if (game.itemsOwned.length > 0) {
        // elegir item antes de entrar
        game.pendingLevel = flat;
        game.itemCur = [0, 0];
        game.itemDone = [false, false];
        game.state = 'itemsel';
      } else {
        game.itemSel = [null, null];
        loadLevel(flat);
        game.state = 'play';
      }
    } else SFX.denied();
  }
  if (anyPressed('Escape')) { game.state = 'worldsel'; SFX.select(); }
}

// ---------- SELECTOR DE ITEM ----------
function itemOptions() {
  return [{ id: null, name: 'Ninguno', desc: 'Solo tu rifle y tu valor', spr: null }]
    .concat(game.itemsOwned.map(id => ITEM_INDEX[id]));
}
function updateItemsel() {
  const opts = itemOptions();
  const nOpts = opts.length;
  if (!game.itemDone[0]) {
    if (pressed.KeyA) { game.itemCur[0] = (game.itemCur[0] + nOpts - 1) % nOpts; SFX.select(); }
    if (pressed.KeyD) { game.itemCur[0] = (game.itemCur[0] + 1) % nOpts; SFX.select(); }
    if (pressed.KeyF || pressed.Enter || pressed.Space) { game.itemDone[0] = true; SFX.confirm(); }
    if (game.nPlayers === 1) {
      if (pressed.ArrowLeft) { game.itemCur[0] = (game.itemCur[0] + nOpts - 1) % nOpts; SFX.select(); }
      if (pressed.ArrowRight) { game.itemCur[0] = (game.itemCur[0] + 1) % nOpts; SFX.select(); }
      if (p2FirePressed()) { game.itemDone[0] = true; SFX.confirm(); }
    }
  }
  if (game.nPlayers === 2 && !game.itemDone[1]) {
    if (pressed.ArrowLeft) { game.itemCur[1] = (game.itemCur[1] + nOpts - 1) % nOpts; SFX.select(); }
    if (pressed.ArrowRight) { game.itemCur[1] = (game.itemCur[1] + 1) % nOpts; SFX.select(); }
    if (p2FirePressed() || pressed.Enter) { game.itemDone[1] = true; SFX.confirm(); }
  }
  if (anyPressed('Escape')) { game.state = 'levelsel'; SFX.select(); return; }
  if (game.itemDone.slice(0, game.nPlayers).every(Boolean)) {
    for (let i = 0; i < game.nPlayers; i++) game.itemSel[i] = opts[game.itemCur[i]].id;
    loadLevel(game.pendingLevel);
    game.state = 'play';
  }
}
function renderItemsel() {
  drawBG(BIOMES[levelWorld(game.pendingLevel)], game.time * 0.3);
  ctx.fillStyle = 'rgba(15,15,27,0.65)';
  ctx.fillRect(0, 0, VW, VH);
  pixText(ctx, 'ELIGE TU ITEM', VW / 2, 16, 2, PAL.white, 'center');
  pixText(ctx, levelName(game.pendingLevel), VW / 2, 34, 1, PAL.yellow, 'center');
  const opts = itemOptions();
  const panels = game.nPlayers;
  for (let pi = 0; pi < panels; pi++) {
    const cx = panels === 1 ? VW / 2 : (pi === 0 ? VW / 4 : 3 * VW / 4);
    const sel = opts[game.itemCur[pi]];
    const done = game.itemDone[pi];
    ctx.fillStyle = done ? PAL.dgreen : PAL.dgray;
    ctx.fillRect(cx - 85, 56, 170, 150);
    ctx.strokeStyle = pi === 0 ? PAL.skyblue : PAL.orange;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 84, 57, 168, 148);
    pixText(ctx, 'JUGADOR ' + (pi + 1), cx, 64, 1, pi === 0 ? PAL.skyblue : PAL.orange, 'center');
    if (sel.spr) drawSpr(ctx, sel.spr, 0, cx - 16, 84, false, 2);
    else { pixText(ctx, 'X', cx, 92, 3, PAL.gray, 'center'); }
    pixText(ctx, sel.name, cx, 126, 1, PAL.yellow, 'center');
    uiText(ctx, sel.desc, cx, 140, PAL.cream, 7, 'center');
    // flechitas
    pixText(ctx, '<', cx - 70, 96, 2, PAL.white, 'center');
    pixText(ctx, '>', cx + 70, 96, 2, PAL.white, 'center');
    uiText(ctx, (game.itemCur[pi] + 1) + '/' + opts.length, cx, 158, PAL.lgray, 7, 'center');
    if (done) pixText(ctx, '¡LISTO!', cx, 186, 1, PAL.lime, 'center');
    else pixText(ctx, pi === 0 ? 'A-D ELIGE  F CONFIRMA' : 'FLECHAS  L CONFIRMA', cx, 186, 1, PAL.white, 'center');
  }
  pixText(ctx, 'ESC: VOLVER', VW / 2, 246, 1, PAL.dgray, 'center');
}

// ---------- SELECCIÓN ----------
function updateTitle() {
  if (anyPressed('KeyF', 'Enter', 'Space', 'KeyL', 'Minus', 'NumpadSubtract')) {
    game.state = 'players';
    SFX.confirm();
  }
  if (anyPressed('KeyR')) { wipeSave(); game.msg = 'PROGRESO BORRADO'; game.msgT = 100; }
  if (game.msgT > 0) game.msgT--;
}
function updatePlayers() {
  if (anyPressed('KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight')) { game.nPlayers = game.nPlayers === 1 ? 2 : 1; SFX.select(); }
  if (anyPressed('KeyF', 'Enter', 'Space', 'KeyL', 'Minus', 'NumpadSubtract')) {
    game.state = 'charsel';
    game.selDone = [false, false];
    SFX.confirm();
  }
  if (anyPressed('Escape')) game.state = 'title';
}
function updateCharsel() {
  // P1: A/D + F   P2: flechas + L
  if (!game.selDone[0]) {
    if (pressed.KeyA) { game.charSel[0] = (game.charSel[0] + CHARS.length - 1) % CHARS.length; SFX.select(); }
    if (pressed.KeyD) { game.charSel[0] = (game.charSel[0] + 1) % CHARS.length; SFX.select(); }
    if (pressed.KeyF) { game.selDone[0] = true; SFX.confirm(); }
    if (game.nPlayers === 1) {
      if (pressed.ArrowLeft) { game.charSel[0] = (game.charSel[0] + CHARS.length - 1) % CHARS.length; SFX.select(); }
      if (pressed.ArrowRight) { game.charSel[0] = (game.charSel[0] + 1) % CHARS.length; SFX.select(); }
      if (pressed.Enter || p2FirePressed()) { game.selDone[0] = true; SFX.confirm(); }
    }
  }
  if (game.nPlayers === 2 && !game.selDone[1]) {
    if (pressed.ArrowLeft) { game.charSel[1] = (game.charSel[1] + CHARS.length - 1) % CHARS.length; SFX.select(); }
    if (pressed.ArrowRight) { game.charSel[1] = (game.charSel[1] + 1) % CHARS.length; SFX.select(); }
    if (p2FirePressed() || pressed.Enter) { game.selDone[1] = true; SFX.confirm(); }
  }
  const need = game.nPlayers;
  const done = game.selDone.slice(0, need).every(Boolean);
  if (done) {
    game.state = 'worldsel';
    game.worldCursor = Math.min(levelWorld(game.unlocked), WORLDS - 1);
    saveGame();
  }
  if (anyPressed('Escape')) game.state = 'players';
}
function updateVictory() {
  if (anyPressed('KeyF', 'Enter', 'Space', 'KeyL', 'Minus', 'NumpadSubtract')) {
    game.state = 'worldsel';
    SFX.confirm();
  }
}

// ---------- RENDER: FONDO ----------
function drawBG(biome, camX) {
  const bg = BGS[biome];
  const bandH = Math.ceil(VH / bg.sky.length);
  for (let i = 0; i < bg.sky.length; i++) {
    ctx.fillStyle = bg.sky[i];
    ctx.fillRect(0, i * bandH, VW, bandH);
  }
  ctx.fillStyle = bg.sun.color;
  const s = bg.sun;
  ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  if (bg.aurora) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    const t = game.time / 40;
    for (let band = 0; band < 3; band++) {
      ctx.fillStyle = [PAL.lime, PAL.cyan, PAL.pink][band];
      for (let x = 0; x < VW; x += 4) {
        const y = 24 + band * 14 + Math.sin((x + game.time * 0.8) / 44 + band * 2 + t) * 10;
        ctx.fillRect(x, y, 4, 8 + Math.sin(x / 30 + t) * 3);
      }
    }
    ctx.restore();
  }
  if (bg.cristales) {
    // destellos de cristales en la oscuridad
    const rnd = mulberry32(77);
    for (let i = 0; i < 24; i++) {
      const cx = Math.floor(rnd() * VW), cy = Math.floor(rnd() * 120);
      if ((game.time / 20 + i) % 8 < 5) {
        ctx.fillStyle = [PAL.cyan, PAL.purple, PAL.skyblue][i % 3];
        ctx.fillRect(cx, cy, 2, 2);
      }
    }
  }
  if (bg.mar) {
    // olas del mar en el horizonte
    ctx.fillStyle = '#2e6eae';
    for (let x = 0; x < VW; x += 8) {
      const y = 150 + Math.sin((x + game.time * 1.4) / 26) * 3;
      ctx.fillRect(x, y, 8, 4);
    }
  }
  const farX = Math.floor(camX * 0.2) % VW;
  ctx.drawImage(bg.far, -farX, VH - 170);
  ctx.drawImage(bg.far, -farX + VW, VH - 170);
  const nearX = Math.floor(camX * 0.45) % VW;
  ctx.drawImage(bg.near, -nearX, VH - 130);
  ctx.drawImage(bg.near, -nearX + VW, VH - 130);
}

// ---------- RENDER: NIVEL ----------
function drawSpikes(x, y, biome) {
  const col = biome === 'artico' ? PAL.ice : biome === 'desierto' ? PAL.dsand : biome === 'volcan' ? PAL.orange : biome === 'cueva' ? PAL.purple : PAL.lgray;
  const dark = biome === 'artico' ? PAL.dice : biome === 'volcan' ? PAL.red : PAL.gray;
  for (let i = 0; i < 4; i++) {
    const bx = x + i * 4;
    ctx.fillStyle = col;
    ctx.fillRect(bx + 1, y + 8, 2, 8);
    ctx.fillRect(bx + 1, y + 4, 2, 4);
    ctx.fillStyle = dark;
    ctx.fillRect(bx + 1, y + 2, 1, 3);
  }
}

function drawCabin(e, open) {
  const x = Math.round(e.x), y = Math.round(e.y);
  ctx.fillStyle = PAL.dbrown; ctx.fillRect(x, y + 14, 42, 34);
  ctx.fillStyle = PAL.brown; ctx.fillRect(x + 2, y + 16, 38, 30);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = PAL.dbrown; ctx.fillRect(x + 2, y + 20 + i * 7, 38, 1); }
  ctx.fillStyle = PAL.red;
  ctx.fillRect(x - 3, y + 8, 48, 7);
  ctx.fillRect(x + 2, y + 3, 38, 6);
  ctx.fillRect(x + 8, y - 2, 26, 6);
  ctx.fillStyle = PAL.dbrown; ctx.fillRect(x + 16, y + 28, 12, 20);
  ctx.fillStyle = open ? PAL.yellow : PAL.dgray; ctx.fillRect(x + 18, y + 30, 8, 16);
  ctx.fillStyle = PAL.cream; ctx.fillRect(x + 5, y + 22, 8, 8);
  ctx.fillStyle = open ? PAL.yellow : PAL.dgray; ctx.fillRect(x + 6, y + 23, 6, 6);
  pixText(ctx, 'TIENDA', x + 21, y + 16, 1, PAL.cream, 'center');
}

function renderPlay() {
  const lvl = game.level;
  drawBG(lvl.biome, game.camX);

  ctx.save();
  const shx = game.shake > 0 ? Math.round((Math.random() - 0.5) * game.shake) : 0;
  const shy = game.shake > 0 ? Math.round((Math.random() - 0.5) * game.shake) : 0;
  ctx.translate(-Math.round(game.camX) + shx, -Math.round(game.camY) + shy);

  const x0 = Math.floor(game.camX / TILE) - 1, x1 = x0 + Math.ceil(VW / TILE) + 2;
  const y0 = Math.floor(game.camY / TILE) - 1, y1 = y0 + Math.ceil(VH / TILE) + 2;
  const T = TILES[lvl.biome];

  for (const d of lvl.decos) {
    if (d.x + d.img.width < game.camX - 20 || d.x > game.camX + VW + 20) continue;
    ctx.drawImage(d.img, Math.round(d.x), Math.round(d.y));
  }

  for (let ty = Math.max(0, y0); ty < Math.min(lvl.hT, y1); ty++) {
    for (let tx = Math.max(0, x0); tx < Math.min(lvl.wT, x1); tx++) {
      const v = lvl.grid[ty * lvl.wT + tx];
      if (v === 1) {
        const above = ty > 0 ? lvl.grid[(ty - 1) * lvl.wT + tx] : 0;
        ctx.drawImage(above === 1 ? T.fill : T.top, tx * TILE, ty * TILE);
      } else if (v === 2) {
        ctx.drawImage(T.plat, tx * TILE, ty * TILE);
      } else if (v === 3) {
        drawSpikes(tx * TILE, ty * TILE, lvl.biome);
      }
    }
  }

  if (game.exitE && (game.exitE.open || !lvl.isBoss)) drawCabin(game.exitE, game.exitE.open);

  for (const c of game.checkpoints) {
    drawSpr(ctx, c.active ? 'flag_on' : 'flag_off', 0, c.x, c.y);
  }
  for (const s of game.springs) drawSpr(ctx, 'spring', s.anim > 6 ? 1 : 0, s.x, s.y);
  for (const p of game.plats) {
    if (p.crumble && p.cstate === 3) { ctx.globalAlpha = 0.25; }
    if (!(p.crumble && p.cstate === 2 && p.y > lvl.hT * TILE)) {
      const wob = p.crumble && p.cstate === 1 ? Math.round((Math.random() - 0.5) * 2) : 0;
      for (let i = 0; i < p.w; i += TILE) {
        ctx.drawImage(TILES[lvl.biome].plat, Math.round(p.x + i + wob), Math.round(p.y));
      }
    }
    ctx.globalAlpha = 1;
  }
  for (const c of game.coinsE) {
    if (c.taken) continue;
    const bob = Math.sin((game.time + c.x) / 20) * 2;
    if (c.gem) drawSpr(ctx, 'gem', 0, c.x, c.y + bob);
    else drawSpr(ctx, 'coin', [0, 1, 2, 1][Math.floor(game.time / 8) % 4], c.x, c.y + bob);
  }
  for (const d of game.drops) drawSpr(ctx, 'coin', [0, 1, 2, 1][Math.floor((game.time + d.t) / 6) % 4], d.x - 4, d.y - 4);
  for (const a of game.animals) {
    if (a.x + a.w < game.camX - 40 || a.x > game.camX + VW + 40) continue;
    a.draw(ctx);
  }
  if (game.boss) game.boss.draw(ctx);
  for (const pet of game.petsEntities) pet.draw(ctx);
  for (const p of game.players) p.draw(ctx);
  for (const b of game.bullets) {
    if (b.rocket) {
      drawSpr(ctx, b.spr || 'rocket_p', 0, b.x - 4, b.y - 1, b.vx < 0);
    } else {
      ctx.fillStyle = PAL.yellow;
      ctx.fillRect(Math.round(b.x - Math.sign(b.vx) * 4), Math.round(b.y - 1), 4, 2);
      ctx.fillStyle = PAL.white;
      ctx.fillRect(Math.round(b.x), Math.round(b.y - 1), 2, 2);
    }
  }
  for (const pr of game.eprojs) drawSpr(ctx, pr.spr, 0, pr.x, pr.y);
  for (const pt of game.parts) {
    ctx.globalAlpha = Math.min(1, pt.life / (pt.maxLife * 0.5));
    ctx.fillStyle = pt.color;
    ctx.fillRect(Math.round(pt.x), Math.round(pt.y), 2, 2);
  }
  ctx.globalAlpha = 1;
  const ambCol = {
    bosque: PAL.lime, jungla: PAL.yellow, desierto: PAL.sand, sabana: PAL.khaki, artico: PAL.white,
    volcan: PAL.orange, pantano: PAL.lime, montana: PAL.white, cueva: PAL.cyan, costa: PAL.white,
  }[lvl.biome];
  ctx.fillStyle = ambCol;
  for (const am of game.ambient) {
    ctx.globalAlpha = 0.7;
    ctx.fillRect(Math.round(am.x), Math.round(am.y), lvl.biome === 'artico' ? 2 : 1, lvl.biome === 'artico' ? 2 : 2);
  }
  ctx.globalAlpha = 1;
  for (const f of game.floats) {
    uiText(ctx, f.text, Math.round(f.x), Math.round(f.y), f.color, 7, 'center');
  }

  ctx.restore();

  renderHUD();

  if (game.levelTitleT > 0) {
    const a = Math.min(1, game.levelTitleT / 30);
    ctx.globalAlpha = a * 0.75;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(0, 100, VW, 46);
    ctx.globalAlpha = a;
    pixText(ctx, levelName(game.curLevel), VW / 2, 110, 2, PAL.white, 'center');
    pixText(ctx, 'NIVEL ' + (levelStage(game.curLevel) + 1) + '/30 — MUNDO ' + (levelWorld(game.curLevel) + 1) + '/10', VW / 2, 130, 1, PAL.yellow, 'center');
    ctx.globalAlpha = 1;
  }
  if (game.msgT > 0) {
    ctx.globalAlpha = Math.min(1, game.msgT / 25);
    pixText(ctx, game.msg, VW / 2, 80, 1, PAL.orange, 'center');
    ctx.globalAlpha = 1;
  }

  if (game.boss && !game.boss.dead) {
    const bo = game.boss;
    const bw = 180;
    ctx.fillStyle = PAL.ink; ctx.fillRect(VW / 2 - bw / 2 - 2, VH - 24, bw + 4, 12);
    ctx.fillStyle = PAL.blood; ctx.fillRect(VW / 2 - bw / 2, VH - 22, bw, 8);
    ctx.fillStyle = bo.enraged ? PAL.orange : PAL.red;
    ctx.fillRect(VW / 2 - bw / 2, VH - 22, Math.max(0, bw * bo.hp / bo.maxHpV), 8);
    const tierTxt = ' ' + ['I', 'II', 'III'][bo.tier - 1] + (bo.enraged ? ' ¡FURIA!' : '');
    pixText(ctx, bo.def.name + tierTxt, VW / 2, VH - 34, 1, bo.enraged ? PAL.orange : PAL.white, 'center');
  }

  if (game.paused) renderPause();
}

function renderHUD() {
  for (let i = 0; i < game.players.length; i++) {
    const p = game.players[i];
    const right = i === 1;
    const bx = right ? VW - 6 : 6;
    pixText(ctx, 'P' + (i + 1), right ? bx - 118 : bx, 5, 1, i === 0 ? PAL.skyblue : PAL.orange, 'left');
    const max = p.maxHp();
    for (let h = 0; h < max; h++) {
      const hx = right ? bx - 8 - h * 8 : bx + 12 + h * 8;
      drawSpr(ctx, h < p.hp ? 'heart' : 'heart_empty', 0, hx, 3);
    }
    // escudos del chaleco
    for (let s = 0; s < p.shield; s++) {
      const sx = right ? bx - 8 - (max + s) * 8 : bx + 12 + (max + s) * 8;
      ctx.fillStyle = PAL.cyan;
      ctx.fillRect(sx + 1, 4, 5, 5);
      ctx.fillStyle = PAL.white;
      ctx.fillRect(sx + 2, 5, 2, 2);
    }
    // arma equipada
    const wd = p.weaponDef();
    drawSpr(ctx, wd.spr, 0, right ? bx - SPR[wd.spr].w : bx, 13, right);
    // granadas
    for (let gi = 0; gi < p.grenades; gi++) {
      drawSpr(ctx, 'itm_granada', 0, right ? bx - 24 - gi * 7 : bx + 20 + gi * 7, 12, false);
    }
    if (p.dead) {
      uiText(ctx, 'Reapareces en ' + Math.max(0, Math.ceil(p.deadTimer / 60)) + '...', right ? bx - 60 : bx, 22, PAL.lgray, 7, right ? 'center' : 'left');
    }
  }
  // mascotas del equipo (abajo a la izquierda)
  for (let i = 0; i < game.petsEntities.length; i++) {
    const pet = game.petsEntities[i];
    const px = 6 + i * 34;
    const s = SPR[pet.def.spr];
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.drawImage(s.frames[0], px, VH - 16, Math.max(8, Math.round(s.w * 12 / s.h)), 12);
    ctx.restore();
    pixText(ctx, pet.hp + '/' + pet.maxHp, px + 14, VH - 8, 1, pet.hp <= 2 ? PAL.red : PAL.lime, 'left');
  }
  drawSpr(ctx, 'coin', 0, VW / 2 - 40, 3);
  pixText(ctx, '' + game.coins, VW / 2 - 28, 5, 1, PAL.gold, 'left');
  let meat = 0, pelt = 0;
  for (const [id, n] of Object.entries(game.inv)) {
    if (!LOOT[id]) continue;
    if (LOOT[id].icon === 'meat') meat += n; else pelt += n;
  }
  drawSpr(ctx, 'meat', 0, VW / 2, 3);
  pixText(ctx, '' + meat, VW / 2 + 11, 5, 1, PAL.pink, 'left');
  drawSpr(ctx, 'pelt', 0, VW / 2 + 28, 3);
  pixText(ctx, '' + pelt, VW / 2 + 39, 5, 1, PAL.tan, 'left');
}

function renderPause() {
  ctx.fillStyle = 'rgba(15,15,27,0.82)';
  ctx.fillRect(0, 0, VW, VH);
  pixText(ctx, 'PAUSA', VW / 2, 50, 3, PAL.white, 'center');
  const opts = [
    'REANUDAR',
    'REINICIAR NIVEL',
    'SALIR AL MAPA',
    'SONIDO: ' + (AudioSys.soundOn ? 'SI' : 'NO'),
    'MUSICA: ' + (AudioSys.musicOn ? 'SI' : 'NO'),
  ];
  for (let i = 0; i < opts.length; i++) {
    const sel = i === game.pauseCursor;
    pixText(ctx, (sel ? '> ' : '') + opts[i], VW / 2, 100 + i * 18, sel ? 2 : 1, sel ? PAL.yellow : PAL.lgray, 'center');
  }
}

// ---------- RENDER: PANTALLAS ----------
function renderTitle() {
  drawBG('bosque', game.time * 0.4);
  ctx.fillStyle = 'rgba(15,15,27,0.45)';
  ctx.fillRect(0, 0, VW, VH);
  drawSpr(ctx, 'venado', Math.floor(game.time / 10) % 2, ((game.time * 0.5) % (VW + 60)) - 40, 208);

  pixText(ctx, 'RIFLE QUEST', VW / 2 + 2, 52, 5, PAL.ink, 'center');
  pixText(ctx, 'RIFLE QUEST', VW / 2, 50, 5, PAL.gold, 'center');
  pixText(ctx, 'CAZADORES DE MUNDOS', VW / 2, 88, 1, PAL.cream, 'center');

  if (Math.floor(game.time / 30) % 2 === 0) {
    pixText(ctx, 'PULSA F O ENTER', VW / 2, 150, 2, PAL.white, 'center');
  }
  pixText(ctx, '10 MUNDOS - 300 NIVELES - 30 JEFES', VW / 2, 185, 1, PAL.lgray, 'center');
  pixText(ctx, 'P1: WASD + F     P2: FLECHAS + L', VW / 2, 200, 1, PAL.lgray, 'center');
  pixText(ctx, 'R: BORRAR PROGRESO', VW / 2, 240, 1, PAL.dgray, 'center');
  if (game.msgT > 0) pixText(ctx, game.msg, VW / 2, 225, 1, PAL.orange, 'center');
}

function renderPlayers() {
  drawBG('sabana', game.time * 0.3);
  ctx.fillStyle = 'rgba(15,15,27,0.55)';
  ctx.fillRect(0, 0, VW, VH);
  pixText(ctx, '¿CUANTOS CAZADORES?', VW / 2, 50, 2, PAL.white, 'center');
  const opts = ['1 JUGADOR', '2 JUGADORES'];
  for (let i = 0; i < 2; i++) {
    const sel = game.nPlayers === i + 1;
    const x = VW / 2 + (i === 0 ? -90 : 90);
    ctx.fillStyle = sel ? PAL.dgreen : PAL.dgray;
    ctx.fillRect(x - 70, 100, 140, 60);
    if (sel) { ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 2; ctx.strokeRect(x - 70 + 1, 101, 138, 58); }
    pixText(ctx, opts[i], x, 115, 1, sel ? PAL.yellow : PAL.lgray, 'center');
    drawSpr(ctx, 'char_cazador_0', 0, x - (i === 1 ? 26 : 12), 128);
    if (i === 1) drawSpr(ctx, 'char_exploradora_0', 0, x + 4, 128);
  }
  pixText(ctx, 'A - D PARA ELEGIR, F PARA SEGUIR', VW / 2, 200, 1, PAL.lgray, 'center');
}

function renderCharsel() {
  drawBG('artico', game.time * 0.3);
  ctx.fillStyle = 'rgba(15,15,27,0.6)';
  ctx.fillRect(0, 0, VW, VH);
  pixText(ctx, 'ELIGE TU CAZADOR', VW / 2, 14, 2, PAL.white, 'center');

  const panels = game.nPlayers;
  for (let pi = 0; pi < panels; pi++) {
    const cx = panels === 1 ? VW / 2 : (pi === 0 ? VW / 4 : 3 * VW / 4);
    const ci = game.charSel[pi];
    const ch = CHARS[ci];
    const done = game.selDone[pi];
    ctx.fillStyle = done ? PAL.dgreen : PAL.dgray;
    ctx.fillRect(cx - 90, 38, 180, 190);
    ctx.strokeStyle = pi === 0 ? PAL.skyblue : PAL.orange;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 89, 39, 178, 188);
    pixText(ctx, 'JUGADOR ' + (pi + 1), cx, 46, 1, pi === 0 ? PAL.skyblue : PAL.orange, 'center');
    const s = SPR['char_' + ch.id + '_' + (game.skinEq[pi] || 0)];
    ctx.drawImage(s.frames[game.time % 60 < 30 ? 0 : 1], Math.round(cx - 36), 60, 72, 54);
    pixText(ctx, ch.name, cx, 120, 1, PAL.yellow, 'center');
    uiText(ctx, ch.desc, cx, 132, PAL.cream, 7, 'center');
    const stats = [
      ['VIDA', ch.hp / 9], ['VEL', ch.speed / 1.25], ['DAÑO', (2 + ch.dmgBonus) / 4], ['CADENCIA', (1.5 - ch.fireMod) / 0.6],
    ];
    for (let si = 0; si < stats.length; si++) {
      const [label, v] = stats[si];
      pixText(ctx, label, cx - 78, 148 + si * 14, 1, PAL.lgray, 'left');
      ctx.fillStyle = PAL.ink; ctx.fillRect(cx - 30, 148 + si * 14, 100, 5);
      ctx.fillStyle = [PAL.red, PAL.skyblue, PAL.orange, PAL.lime][si];
      ctx.fillRect(cx - 30, 148 + si * 14, Math.round(100 * Math.max(0.1, Math.min(1, v))), 5);
    }
    if (done) pixText(ctx, '¡LISTO!', cx, 212, 1, PAL.lime, 'center');
    else pixText(ctx, pi === 0 ? 'A-D  ELIGE   F  CONFIRMA' : 'FLECHAS ELIGEN  L CONFIRMA', cx, 212, 1, PAL.white, 'center');
  }
}

const BIOME_COLORS = {
  bosque: PAL.green, jungla: PAL.dgreen, desierto: PAL.sand, sabana: PAL.orange, artico: PAL.ice,
  volcan: PAL.red, pantano: PAL.olive, montana: PAL.lgray, cueva: PAL.purple, costa: PAL.skyblue,
};
// animal representativo de cada mundo para su tarjeta
const WORLD_ICON = ['venado', 'jaguar', 'escorpion', 'leon', 'pinguino', 'salamandra', 'rana', 'cabra', 'arana', 'cangrejo'];

function renderWorldsel() {
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(0, 0, VW, VH);
  const rnd = mulberry32(42);
  ctx.fillStyle = PAL.dgray;
  for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(rnd() * VW), Math.floor(rnd() * VH), 1, 1);

  pixText(ctx, 'ELIGE TU MUNDO', VW / 2, 10, 2, PAL.white, 'center');
  drawSpr(ctx, 'coin', 0, VW - 90, 8);
  pixText(ctx, '' + game.coins, VW - 78, 10, 1, PAL.gold, 'left');

  for (let w = 0; w < WORLDS; w++) {
    const col = w % 5, row = Math.floor(w / 5);
    const x = 14 + col * 92, y = 26 + row * 96;
    const unlocked = worldUnlocked(w);
    const prog = worldProgress(w);
    const sel = w === game.worldCursor;
    const biome = BIOMES[w];
    ctx.fillStyle = unlocked ? BIOME_COLORS[biome] : PAL.dgray;
    ctx.globalAlpha = unlocked ? 0.32 : 0.18;
    ctx.fillRect(x, y, 84, 88);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = sel ? PAL.yellow : (unlocked ? BIOME_COLORS[biome] : PAL.dgray);
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, 83, 87);
    pixText(ctx, BIOME_LABEL[biome], x + 42, y + 5, 1, unlocked ? PAL.white : PAL.gray, 'center');
    if (unlocked) {
      const icon = SPR[WORLD_ICON[w]];
      ctx.drawImage(icon.frames[game.time % 50 < 25 || !sel ? 0 : 1], Math.round(x + 42 - icon.w / 2), Math.round(y + 30 - icon.h / 2));
    } else {
      ctx.fillStyle = PAL.gray;
      ctx.fillRect(x + 36, y + 28, 12, 9);
      ctx.fillRect(x + 39, y + 23, 2, 6); ctx.fillRect(x + 43, y + 23, 2, 6);
    }
    pixText(ctx, prog + '/30', x + 42, y + 50, 1, prog === 30 ? PAL.lime : PAL.lgray, 'center');
    for (let b = 0; b < 3; b++) {
      const done = game.completed[w * LEVELS_PER_WORLD + (b + 1) * BOSS_EVERY - 1];
      const sx = x + 26 + b * 12;
      ctx.fillStyle = done ? PAL.gold : (unlocked ? PAL.gray : PAL.dgray);
      ctx.fillRect(sx, y + 62, 7, 5);
      ctx.fillRect(sx + 1, y + 67, 5, 2);
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(sx + 1, y + 64, 2, 2); ctx.fillRect(sx + 4, y + 64, 2, 2);
    }
    if (prog === 30) pixText(ctx, '¡COMPLETO!', x + 42, y + 78, 1, PAL.lime, 'center');
  }
  // LA CIUDAD: siempre abierta
  const citySel = game.worldCursor === 10;
  ctx.fillStyle = PAL.navy;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(14, 220, 452, 24);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = citySel ? PAL.yellow : PAL.skyblue;
  ctx.lineWidth = citySel ? 2 : 1;
  ctx.strokeRect(14.5, 220.5, 451, 23);
  // edificios mini
  for (let b = 0; b < 6; b++) {
    ctx.fillStyle = PAL.dgray;
    ctx.fillRect(30 + b * 14, 228 - (b % 3) * 3, 9, 14 + (b % 3) * 3);
    ctx.fillStyle = PAL.yellow;
    ctx.fillRect(32 + b * 14, 231 - (b % 3) * 3, 2, 2);
    ctx.fillRect(35 + b * 14, 235 - (b % 3) * 3, 2, 2);
  }
  pixText(ctx, 'LA CIUDAD — ¡TRABAJA Y GANA MONEDAS!', 250, 226, 1, citySel ? PAL.yellow : PAL.skyblue, 'center');
  pixText(ctx, 'PIZZERIA · SUPER · GASOLINERA · TIENDA', 250, 236, 1, PAL.lgray, 'center');
  drawSpr(ctx, 'itm_moto', 0, 420, 224);
  pixText(ctx, 'WASD-FLECHAS: MOVER   F: ENTRAR   ESC: PERSONAJES', VW / 2, 256, 1, PAL.lgray, 'center');
}

function renderLevelsel() {
  const w = game.worldCursor;
  const biome = BIOMES[w];
  drawBG(biome, game.time * 0.2);
  ctx.fillStyle = 'rgba(15,15,27,0.6)';
  ctx.fillRect(0, 0, VW, VH);

  pixText(ctx, 'MUNDO ' + (w + 1) + ': ' + BIOME_LABEL[biome], VW / 2, 12, 2, BIOME_COLORS[biome], 'center');
  drawSpr(ctx, 'coin', 0, VW - 90, 10);
  pixText(ctx, '' + game.coins, VW - 78, 12, 1, PAL.gold, 'left');
  pixText(ctx, worldProgress(w) + '/30 COMPLETADOS', VW / 2, 32, 1, PAL.lgray, 'center');

  for (let s = 0; s < LEVELS_PER_WORLD; s++) {
    const col = s % 10, row = Math.floor(s / 10);
    const x = 26 + col * 44, y = 58 + row * 56;
    const flat = w * LEVELS_PER_WORLD + s;
    const unlocked = flat <= game.unlocked;
    const done = game.completed[flat];
    const sel = s === game.levelCursor;
    const isBoss = (s + 1) % BOSS_EVERY === 0;
    ctx.fillStyle = !unlocked ? PAL.dgray : done ? PAL.dgreen : PAL.navy;
    const bw = 36, bh = isBoss ? 42 : 36;
    ctx.fillRect(x, y, bw, bh);
    if (sel) {
      ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 2;
      ctx.strokeRect(x - 2, y - 2, bw + 4, bh + 4);
    }
    if (isBoss) {
      ctx.fillStyle = unlocked ? PAL.cream : PAL.gray;
      ctx.fillRect(x + 13, y + 4, 10, 8);
      ctx.fillRect(x + 15, y + 12, 6, 3);
      ctx.fillStyle = !unlocked ? PAL.dgray : done ? PAL.dgreen : PAL.navy;
      ctx.fillRect(x + 15, y + 7, 2, 2); ctx.fillRect(x + 19, y + 7, 2, 2);
      pixText(ctx, 'JEFE', x + 18, y + 17, 1, unlocked ? PAL.red : PAL.gray, 'center');
      pixText(ctx, ['I', 'II', 'III'][Math.floor(s / 10)], x + 18, y + 26, 1, unlocked ? PAL.orange : PAL.gray, 'center');
    } else {
      pixText(ctx, '' + (s + 1), x + 18, y + 8, isBoss ? 1 : 2, unlocked ? PAL.white : PAL.gray, 'center');
    }
    if (done) pixText(ctx, '+', x + bw - 7, y + 2, 1, PAL.gold, 'center');
    if (!unlocked) {
      ctx.fillStyle = PAL.gray;
      ctx.fillRect(x + 15, y + bh - 11, 6, 5);
      ctx.fillRect(x + 16, y + bh - 13, 1, 3); ctx.fillRect(x + 19, y + bh - 13, 1, 3);
    }
  }
  pixText(ctx, 'F: JUGAR   ESC: MUNDOS', VW / 2, 250, 1, PAL.lgray, 'center');
}

// ---------- RENDER: TIENDA ----------
function renderShop() {
  drawBG(game.level ? game.level.biome : 'bosque', 30);
  ctx.fillStyle = 'rgba(15,15,27,0.8)';
  ctx.fillRect(0, 0, VW, VH);

  pixText(ctx, 'TIENDA DEL CAZADOR', VW / 2, 6, 2, PAL.gold, 'center');
  if (game.shopReturn === 'city') pixText(ctx, 'SUCURSAL DE LA CIUDAD — ¡BIENVENIDO!', VW / 2, 22, 1, PAL.skyblue, 'center');
  else pixText(ctx, levelName(game.curLevel) + ' COMPLETADO — CAZADOS: ' + game.hunted, VW / 2, 22, 1, PAL.lime, 'center');

  // pestañas (6)
  for (let i = 0; i < SHOP_TABS.length; i++) {
    const x = 8 + i * 78;
    const sel = i === game.shopTab;
    ctx.fillStyle = sel ? PAL.dgreen : PAL.dgray;
    ctx.fillRect(x, 32, 74, 14);
    if (sel) { ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, 32.5, 73, 13); }
    pixText(ctx, SHOP_TABS[i], x + 37, 36, 1, sel ? PAL.yellow : PAL.lgray, 'center');
  }

  const n = shopRows();
  const contSel = game.shopCursor === n - 1;
  // ventana con scroll para listas largas
  const scrollWin = (total, visible) => {
    let off = 0;
    if (game.shopCursor >= visible) off = Math.min(game.shopCursor - visible + 1, total - visible);
    return Math.max(0, off);
  };

  if (game.shopTab === 0) {
    ctx.fillStyle = 'rgba(51,60,87,0.6)';
    ctx.fillRect(8, 52, 464, 158);
    const entries = Object.entries(game.inv).filter(([id]) => LOOT[id]);
    const bonus = game.players.some(p => p.def.sellBonus) ? 1.5 : 1;
    if (entries.length === 0) {
      uiText(ctx, '(botín vacío... ¡sal a cazar!)', VW / 2, 110, PAL.lgray, 7, 'center');
    }
    // dos columnas
    for (let i = 0; i < Math.min(entries.length, 26); i++) {
      const [id, cnt] = entries[i];
      const col = i % 2, row = Math.floor(i / 2);
      const x = 14 + col * 232, y = 58 + row * 11;
      drawSpr(ctx, LOOT[id].icon, 0, x, y - 1);
      uiText(ctx, LOOT[id].label + ' x' + cnt, x + 12, y, PAL.cream, 7);
      uiText(ctx, Math.round(LOOT[id].price * cnt * bonus) + '$', x + 222, y, PAL.gold, 7, 'right');
    }
    if (bonus > 1) uiText(ctx, '¡Bono de trampero +50%!', VW / 2, 198, PAL.lime, 7, 'center');
    const sellSel = game.shopCursor === 0;
    ctx.fillStyle = sellSel ? PAL.dgreen : PAL.dgray;
    ctx.fillRect(120, 214, 240, 13);
    pixText(ctx, (sellSel ? '> ' : '') + 'VENDER TODO: ' + sellValue() + ' MONEDAS', VW / 2, 217, 1, sellSel ? PAL.yellow : PAL.lgray, 'center');
    if (game.soldTotal > 0) uiText(ctx, '¡Vendido por ' + game.soldTotal + ' monedas!', VW / 2, 204, PAL.lime, 7, 'center');

  } else if (game.shopTab === 1) {
    // mejoras en dos columnas
    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i];
      const sel = game.shopCursor === i;
      const lvl = u.id === 'heal' ? 0 : game.upg[u.id];
      const maxed = u.id !== 'heal' && lvl >= u.max;
      const price = upgradePrice(u, lvl);
      const col = i % 2, row = Math.floor(i / 2);
      const x = 10 + col * 234, y = 52 + row * 29;
      ctx.fillStyle = sel ? 'rgba(37,113,121,0.85)' : 'rgba(26,28,44,0.7)';
      ctx.fillRect(x, y, 226, 26);
      if (sel) { ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, 225, 25); }
      uiText(ctx, (sel ? '> ' : '') + u.name, x + 5, y + 3, maxed ? PAL.gray : PAL.cream, 7);
      uiText(ctx, u.desc, x + 5, y + 14, PAL.lgray, 7);
      if (maxed) uiText(ctx, 'MAX', x + 221, y + 3, PAL.lime, 7, 'right');
      else uiText(ctx, price + '$', x + 221, y + 3, game.coins >= price ? PAL.gold : PAL.red, 7, 'right');
      if (u.max > 1 && u.max < 90) {
        for (let d = 0; d < u.max; d++) {
          ctx.fillStyle = d < lvl ? PAL.lime : PAL.dgray;
          ctx.fillRect(x + 196 + d * 6, y + 17, 4, 4);
        }
      }
    }

  } else if (game.shopTab === 2) {
    const vis = 6;
    const off = scrollWin(WEAPONS.length, vis);
    for (let vi = 0; vi < Math.min(vis, WEAPONS.length); vi++) {
      const i = off + vi;
      const wp = WEAPONS[i];
      if (!wp) break;
      const sel = game.shopCursor === i;
      const owned = game.weaponsOwned.includes(wp.id);
      const y = 52 + vi * 29;
      ctx.fillStyle = sel ? 'rgba(37,113,121,0.85)' : 'rgba(26,28,44,0.7)';
      ctx.fillRect(40, y, 400, 26);
      if (sel) { ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 1; ctx.strokeRect(40.5, y + 0.5, 399, 25); }
      drawSpr(ctx, wp.spr, 0, 46, y + 8);
      uiText(ctx, (sel ? '> ' : '') + wp.name, 68, y + 3, owned ? PAL.cream : PAL.lgray, 7);
      uiText(ctx, wp.desc + '  (daño ' + wp.dmg + (wp.pellets ? 'x' + wp.pellets : '') + ')', 68, y + 14, PAL.lgray, 7);
      if (game.weaponEq[0] === wp.id) { ctx.fillStyle = PAL.skyblue; ctx.fillRect(330, y + 4, 18, 9); pixText(ctx, 'P1', 339, y + 6, 1, PAL.ink, 'center'); }
      if (game.nPlayers === 2 && game.weaponEq[1] === wp.id) { ctx.fillStyle = PAL.orange; ctx.fillRect(352, y + 4, 18, 9); pixText(ctx, 'P2', 361, y + 6, 1, PAL.ink, 'center'); }
      if (owned) uiText(ctx, 'TUYA', 434, y + 3, PAL.lime, 7, 'right');
      else uiText(ctx, wp.price + '$', 434, y + 3, game.coins >= wp.price ? PAL.gold : PAL.red, 7, 'right');
    }
    if (off > 0) pixText(ctx, '- MAS ARRIBA -', VW / 2, 48, 1, PAL.lgray, 'center');
    if (off + vis < WEAPONS.length) pixText(ctx, '- MAS ABAJO -', VW / 2, 228, 1, PAL.lgray, 'center');

  } else if (game.shopTab === 3) {
    const vis = 5;
    const off = scrollWin(SKINS.length, vis);
    for (let vi = 0; vi < Math.min(vis, SKINS.length); vi++) {
      const i = off + vi;
      const sk = SKINS[i];
      if (!sk) break;
      const sel = game.shopCursor === i;
      const owned = game.skinsOwned.includes(sk.idx);
      const y = 50 + vi * 35;
      ctx.fillStyle = sel ? 'rgba(37,113,121,0.85)' : 'rgba(26,28,44,0.7)';
      ctx.fillRect(60, y, 360, 32);
      if (sel) { ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 1; ctx.strokeRect(60.5, y + 0.5, 359, 31); }
      const chId = CHARS[game.charSel[0]].id;
      drawSpr(ctx, 'char_' + chId + '_' + sk.idx, 0, 68, y + 6);
      uiText(ctx, (sel ? '> ' : '') + sk.name, 100, y + 5, owned ? PAL.cream : PAL.lgray, 7);
      uiText(ctx, sk.desc, 100, y + 17, PAL.lgray, 7);
      if (game.skinEq[0] === sk.idx) { ctx.fillStyle = PAL.skyblue; ctx.fillRect(330, y + 6, 18, 9); pixText(ctx, 'P1', 339, y + 8, 1, PAL.ink, 'center'); }
      if (game.nPlayers === 2 && game.skinEq[1] === sk.idx) { ctx.fillStyle = PAL.orange; ctx.fillRect(352, y + 6, 18, 9); pixText(ctx, 'P2', 361, y + 8, 1, PAL.ink, 'center'); }
      if (owned) uiText(ctx, 'TUYO', 414, y + 5, PAL.lime, 7, 'right');
      else uiText(ctx, sk.price + '$', 414, y + 5, game.coins >= sk.price ? PAL.gold : PAL.red, 7, 'right');
    }
    if (off + vis < SKINS.length) pixText(ctx, '- MAS ABAJO -', VW / 2, 228, 1, PAL.lgray, 'center');

  } else if (game.shopTab === 4) {
    // items para los mundos
    for (let i = 0; i < ITEMS.length; i++) {
      const it = ITEMS[i];
      const sel = game.shopCursor === i;
      const owned = game.itemsOwned.includes(it.id);
      const y = 56 + i * 50;
      ctx.fillStyle = sel ? 'rgba(37,113,121,0.85)' : 'rgba(26,28,44,0.7)';
      ctx.fillRect(50, y, 380, 44);
      if (sel) { ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 1; ctx.strokeRect(50.5, y + 0.5, 379, 43); }
      drawSpr(ctx, it.spr, 0, 60, y + 14, false, 2);
      uiText(ctx, (sel ? '> ' : '') + it.name, 100, y + 8, owned ? PAL.cream : PAL.lgray, 7);
      uiText(ctx, it.desc, 100, y + 20, PAL.lgray, 7);
      uiText(ctx, 'Elígelo al entrar a un nivel', 100, y + 31, PAL.dgreen, 7);
      if (owned) uiText(ctx, 'TUYO', 424, y + 8, PAL.lime, 7, 'right');
      else uiText(ctx, it.price + '$', 424, y + 8, game.coins >= it.price ? PAL.gold : PAL.red, 7, 'right');
    }

  } else {
    // mascotas: bestiario y equipo
    const list = bestiaryList();
    pixText(ctx, 'MASCOTAS: ' + game.pets.length + '/5 EQUIPADAS', VW / 2, 50, 1, PAL.cream, 'center');
    if (list.length === 0) {
      uiText(ctx, 'Caza y recoge animales para poder reclutarlos', VW / 2, 120, PAL.lgray, 7, 'center');
    }
    const vis = 5;
    const off = scrollWin(list.length, vis);
    for (let vi = 0; vi < Math.min(vis, list.length); vi++) {
      const i = off + vi;
      const sp = list[i];
      if (!sp) break;
      const a = ANIMALS[sp];
      const sel = game.shopCursor === i;
      const rec = game.pets.find(r => r.species === sp);
      const y = 60 + vi * 33;
      ctx.fillStyle = sel ? 'rgba(37,113,121,0.85)' : 'rgba(26,28,44,0.7)';
      ctx.fillRect(40, y, 400, 30);
      if (sel) { ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 1; ctx.strokeRect(40.5, y + 0.5, 399, 29); }
      const s = SPR[a.spr];
      const sc = Math.min(1, 24 / s.h);
      ctx.drawImage(s.frames[0], 46, y + 3, Math.round(s.w * sc), Math.round(s.h * sc));
      uiText(ctx, (sel ? '> ' : '') + a.name, 88, y + 4, PAL.cream, 7);
      if (rec) {
        const maxHp = a.hp + rec.bonus;
        uiText(ctx, 'EQUIPADA — vida ' + rec.hp + '/' + maxHp + (rec.armor ? '  [ARMADURA]' : '') + (rec.turret ? '  [TORRETA]' : ''), 88, y + 16, PAL.lime, 7);
        uiText(ctx, 'F: MEJORAR', 434, y + 4, PAL.skyblue, 7, 'right');
      } else {
        uiText(ctx, 'Vida ' + a.hp + ' — daño ' + Math.max(1, Math.ceil(a.hp / 3)), 88, y + 16, PAL.lgray, 7);
        const price = petRecruitPrice(sp);
        uiText(ctx, 'RECLUTAR ' + price + '$', 434, y + 4, game.coins >= price && game.pets.length < 5 ? PAL.gold : PAL.red, 7, 'right');
      }
    }
    if (off + vis < list.length) pixText(ctx, '- MAS ABAJO -', VW / 2, 228, 1, PAL.lgray, 'center');
  }

  // menú emergente de mascota
  if (game.petMenu) {
    const rec = game.pets[game.petMenu.petIdx];
    if (rec) {
      const opts = petMenuOptions(rec);
      ctx.fillStyle = 'rgba(15,15,27,0.92)';
      ctx.fillRect(130, 60, 220, 140);
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 1; ctx.strokeRect(130.5, 60.5, 219, 139);
      pixText(ctx, ANIMALS[rec.species].name, VW / 2, 68, 1, PAL.gold, 'center');
      for (let i = 0; i < opts.length; i++) {
        const o = opts[i];
        const sel = game.petMenu.cursor === i;
        const y = 84 + i * 17;
        pixText(ctx, (sel ? '> ' : '') + o.label, 142, y, 1, o.disabled ? PAL.gray : sel ? PAL.yellow : PAL.lgray, 'left');
        if (o.price > 0 && !o.disabled) uiText(ctx, o.price + '$', 342, y - 1, game.coins >= o.price ? PAL.gold : PAL.red, 7, 'right');
      }
    }
  }

  // pie
  drawSpr(ctx, 'coin', 0, 40, 236);
  pixText(ctx, '' + game.coins + ' MONEDAS', 52, 238, 1, PAL.gold, 'left');
  ctx.fillStyle = contSel ? PAL.dgreen : PAL.dgray;
  ctx.fillRect(VW - 150, 234, 120, 14);
  pixText(ctx, (contSel ? '> ' : '') + 'CONTINUAR', VW - 90, 238, 1, contSel ? PAL.yellow : PAL.lgray, 'center');
  const hint = game.shopTab >= 2 ? 'A-D: PESTAÑA  W-S: MOVER  F: COMPRA-EQUIPA P1  L: EQUIPA P2' : 'A-D: PESTAÑA   W-S: MOVER   F: ELEGIR';
  pixText(ctx, hint, VW / 2, 258, 1, PAL.dgray, 'center');
}

function renderVictory() {
  drawBG('artico', game.time * 0.2);
  ctx.fillStyle = 'rgba(15,15,27,0.6)';
  ctx.fillRect(0, 0, VW, VH);
  pixText(ctx, '¡VICTORIA!', VW / 2, 60, 4, PAL.gold, 'center');
  pixText(ctx, 'CONQUISTASTE LOS 10 MUNDOS', VW / 2, 100, 1, PAL.white, 'center');
  pixText(ctx, 'MONEDAS: ' + game.coins, VW / 2, 130, 1, PAL.gold, 'center');
  const trophies = Object.keys(game.inv).filter(k => k.startsWith('trofeo_')).length;
  pixText(ctx, 'TROFEOS DE JEFE: ' + trophies, VW / 2, 145, 1, PAL.orange, 'center');
  pixText(ctx, 'GRACIAS POR JUGAR', VW / 2, 180, 1, PAL.lime, 'center');
  if (Math.floor(game.time / 30) % 2 === 0) pixText(ctx, 'F PARA VOLVER A LOS MUNDOS', VW / 2, 220, 1, PAL.lgray, 'center');
  const parade = ['venado', 'oso', 'jaguar', 'cebra', 'pinguino', 'leon', 'rana', 'cabra', 'cangrejo', 'golem'];
  for (let i = 0; i < parade.length; i++) {
    const px = ((game.time * 0.8 + i * 60) % (VW + 120)) - 60;
    drawSpr(ctx, parade[i], Math.floor(game.time / 9) % 2, px, 232);
  }
}

// ---------- BUCLE PRINCIPAL ----------
let lastT = 0, acc = 0;
function step(t) {
  const dt = Math.min(50, t - lastT);
  lastT = t;
  acc += dt;
  while (acc >= 1000 / 60) {
    acc -= 1000 / 60;
    tick();
    for (const k in pressed) pressed[k] = false;
  }
  render();
}
function frame(t) {
  requestAnimationFrame(frame);
  step(t);
}
// respaldo: con la pestaña oculta requestAnimationFrame se pausa
setInterval(() => { if (document.hidden) step(performance.now()); }, 1000 / 60);

function tick() {
  game.time++;
  switch (game.state) {
    case 'title': updateTitle(); break;
    case 'players': updatePlayers(); break;
    case 'charsel': updateCharsel(); break;
    case 'worldsel': updateWorldsel(); break;
    case 'levelsel': updateLevelsel(); break;
    case 'itemsel': updateItemsel(); break;
    case 'play': updatePlay(); break;
    case 'shop': updateShop(); break;
    case 'victory': updateVictory(); break;
    case 'city': updateCity(); break;
    case 'jobPizza': updateJobPizza(); break;
    case 'jobSuper': updateJobSuper(); break;
    case 'jobGas': updateJobGas(); break;
  }
}

function render() {
  ctx.clearRect(0, 0, VW, VH);
  switch (game.state) {
    case 'title': renderTitle(); break;
    case 'players': renderPlayers(); break;
    case 'charsel': renderCharsel(); break;
    case 'worldsel': renderWorldsel(); break;
    case 'levelsel': renderLevelsel(); break;
    case 'itemsel': renderItemsel(); break;
    case 'play': renderPlay(); break;
    case 'shop': renderShop(); break;
    case 'victory': renderVictory(); break;
    case 'city': renderCity(); break;
    case 'jobPizza': renderJobPizza(); break;
    case 'jobSuper': renderJobSuper(); break;
    case 'jobGas': renderJobGas(); break;
  }
}

// ---------- ARRANQUE ----------
initSprites();
loadSave();
AudioSys.playMusic(11);
requestAnimationFrame(frame);
