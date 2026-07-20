'use strict';
// ============ LA CIUDAD — hub siempre abierto con 3 trabajos ============
// Pizzería (reparto en moto), Supermercado (reponer estantes), Gasolinera (llenar tanques).
// Trabajar paga MUCHAS monedas para la tienda de items, armas y mascotas.

const CITY = {
  doors: [],      // {x, w, id, label}
  npcs: [],
  job: null,      // estado del trabajo actual
};

const CITY_NPC_SPRITES = ['char_trampero_1', 'char_exploradora_7', 'char_tanque_4', 'char_cazador_5', 'char_francotirador_6'];

// ---------- NIVEL DE LA CIUDAD ----------
function _flatLevel(wT, hT, biome, groundRow) {
  const grid = new Uint8Array(wT * hT);
  for (let x = 0; x < wT; x++) for (let y = groundRow; y < hT; y++) grid[y * wT + x] = 1;
  return {
    idx: -1, world: -1, stage: -1, biome, wT, hT, grid,
    entities: [], decos: [], spawn: { x: 3 * TILE, y: groundRow * TILE - 40 },
    exitX: -999, isBoss: false, isCity: true,
  };
}

function genCityLevel() {
  const wT = 100, hT = 22, groundRow = hT - 5;
  const lvl = _flatLevel(wT, hT, 'ciudad', groundRow);
  const gy = groundRow * TILE;
  // decoraciones urbanas entre edificios
  const rnd = mulberry32(4242);
  for (const dx of [8, 24, 30, 46, 52, 68, 74, 90, 96]) {
    const d = DECOS.ciudad[Math.floor(rnd() * DECOS.ciudad.length)];
    lvl.decos.push({ img: d, x: dx * TILE, y: gy - d.height });
  }
  CITY.doors = [
    { x: 13 * TILE, w: 5 * TILE, id: 'pizza', label: 'PIZZERIA' },
    { x: 35 * TILE, w: 5 * TILE, id: 'super', label: 'SUPERMERCADO' },
    { x: 57 * TILE, w: 5 * TILE, id: 'gas',   label: 'GASOLINERA' },
    { x: 79 * TILE, w: 5 * TILE, id: 'shop',  label: 'TIENDA' },
    { x: 1 * TILE,  w: 2 * TILE, id: 'exit',  label: 'SALIR' },
  ];
  CITY.npcs = [];
  for (let i = 0; i < 5; i++) {
    CITY.npcs.push({
      x: (10 + Math.floor(rnd() * 80)) * TILE,
      dir: rnd() < 0.5 ? -1 : 1,
      spr: CITY_NPC_SPRITES[i % CITY_NPC_SPRITES.length],
      t: Math.floor(rnd() * 100),
    });
  }
  return lvl;
}

function enterCity() {
  const lvl = genCityLevel();
  game.level = lvl;
  setPhysicsWorld(lvl, game);
  game.bullets = []; game.eprojs = []; game.animals = []; game.drops = [];
  game.parts = []; game.floats = []; game.plats = []; game.springs = [];
  game.checkpoints = []; game.coinsE = []; game.ambient = [];
  game.boss = null; game.exitE = null;
  game.petsEntities = [];
  game.shake = 0; game.paused = false;
  CITY.job = null;

  const prevs = game.players;
  game.players = [];
  for (let i = 0; i < game.nPlayers; i++) {
    const p = new Player(i, game.charSel[i]);
    p.x = lvl.spawn.x + 20 + i * 18;
    p.y = lvl.spawn.y;
    const prev = prevs && prevs[i];
    if (prev && prev.charIdx === game.charSel[i]) p.hp = Math.max(1, Math.min(prev.hp, p.maxHp()));
    game.players.push(p);
  }
  game.camX = 0; game.camY = Math.max(0, lvl.hT * TILE - VH);
  game.state = 'city';
  game.levelTitleT = 0;
  game.msg = 'LA CIUDAD — TRABAJA PARA GANAR MONEDAS';
  game.msgT = 150;
  AudioSys.playMusic(11);
}

// ---------- ACTUALIZAR CIUDAD ----------
function updateCity() {
  if (anyPressed('Escape')) { game.state = 'worldsel'; SFX.select(); return; }
  const solo = game.nPlayers === 1;
  for (const p of game.players) {
    const inp = playerInput(p.idx, solo);
    inp.fire = false; inp.grenade = false; // en la ciudad no se dispara
    p.update(inp);
  }
  // NPCs paseando
  for (const n of CITY.npcs) {
    n.t++;
    n.x += n.dir * 0.4;
    if (n.x < 6 * TILE || n.x > 94 * TILE || (n.t % 300 === 0 && Math.random() < 0.4)) n.dir *= -1;
  }
  // entrar por puertas con S
  const down = pressed.KeyS || pressed.ArrowDown;
  if (down) {
    for (const p of game.players) {
      if (p.dead) continue;
      const cx = p.x + p.w / 2;
      for (const d of CITY.doors) {
        if (cx > d.x && cx < d.x + d.w) {
          if (d.id === 'exit') { game.state = 'worldsel'; SFX.select(); return; }
          if (d.id === 'shop') {
            game.state = 'shop'; game.shopTab = 4; game.shopCursor = 0; game.soldTotal = 0;
            game.shopReturn = 'city';
            SFX.confirm();
            return;
          }
          startJob(d.id);
          return;
        }
      }
    }
  }
  // cámara y extras
  const targets = game.players.filter(p => !p.dead);
  if (targets.length) {
    const tx = targets.reduce((a, p) => a + p.x, 0) / targets.length - VW / 2;
    game.camX += (Math.max(0, Math.min(game.level.wT * TILE - VW, tx)) - game.camX) * 0.12;
  }
  for (const f of game.floats) { f.t--; f.y -= 0.5; }
  game.floats = game.floats.filter(f => f.t > 0);
  if (game.msgT > 0) game.msgT--;
}

// ---------- DIBUJAR CIUDAD ----------
function _drawCityTiles(lvl) {
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
      } else if (v === 2) ctx.drawImage(T.plat, tx * TILE, ty * TILE);
    }
  }
}

function _drawBuilding(x, w, gy, color, dark, sign, icon) {
  const h = 74;
  ctx.fillStyle = dark; ctx.fillRect(x - 4, gy - h - 6, w + 8, 8);
  ctx.fillStyle = color; ctx.fillRect(x, gy - h, w, h);
  // ventanas
  ctx.fillStyle = PAL.yellow;
  for (let wy = gy - h + 12; wy < gy - 26; wy += 14) {
    for (let wx = x + 6; wx < x + w - 8; wx += 16) {
      ctx.fillRect(wx, wy, 7, 8);
    }
  }
  // puerta
  const dx = x + w / 2 - 9;
  ctx.fillStyle = dark; ctx.fillRect(dx - 2, gy - 26, 22, 26);
  ctx.fillStyle = PAL.ink; ctx.fillRect(dx, gy - 24, 18, 24);
  ctx.fillStyle = PAL.yellow; ctx.fillRect(dx + 13, gy - 14, 2, 3);
  // letrero
  ctx.fillStyle = PAL.ink; ctx.fillRect(x + 2, gy - h + 1, w - 4, 9);
  pixText(ctx, sign, x + w / 2, gy - h + 3, 1, PAL.yellow, 'center');
  if (icon) drawSpr(ctx, icon, 0, x + w / 2 - 5, gy - h - 16);
}

function renderCity() {
  const lvl = game.level;
  drawBG('ciudad', game.camX);
  ctx.save();
  ctx.translate(-Math.round(game.camX), -Math.round(game.camY));
  _drawCityTiles(lvl);

  const gy = (lvl.hT - 5) * TILE;
  _drawBuilding(11 * TILE, 9 * TILE, gy, PAL.red, PAL.blood, 'PIZZERIA', 'pizza');
  _drawBuilding(33 * TILE, 9 * TILE, gy, PAL.blue, PAL.navy, 'SUPER', 'caja');
  _drawBuilding(55 * TILE, 9 * TILE, gy, PAL.green, PAL.dgreen, 'GASOLINERA', 'surtidor');
  _drawBuilding(77 * TILE, 9 * TILE, gy, PAL.gold, PAL.dgold, 'TIENDA', 'coin');
  // cartel de salida
  ctx.fillStyle = PAL.dgray; ctx.fillRect(1 * TILE, gy - 30, 4, 30);
  ctx.fillStyle = PAL.green; ctx.fillRect(0, gy - 40, 40, 12);
  pixText(ctx, 'SALIR', 20, gy - 37, 1, PAL.white, 'center');

  // NPCs
  for (const n of CITY.npcs) {
    drawSpr(ctx, n.spr, Math.abs(n.dir) > 0 ? 1 + (Math.floor(n.t / 8) % 2) : 0, n.x, gy - 18, n.dir === -1);
  }
  for (const p of game.players) p.draw(ctx);

  // indicadores de puertas
  const bob = Math.sin(game.time / 12) * 2;
  for (const d of CITY.doors) {
    if (d.id === 'exit') continue;
    for (const p of game.players) {
      if (p.dead) continue;
      const cx = p.x + p.w / 2;
      if (cx > d.x - 30 && cx < d.x + d.w + 30) {
        pixText(ctx, 'S: ' + d.label, d.x + d.w / 2, gy - 96 + bob, 1, PAL.white, 'center');
        break;
      }
    }
  }
  for (const f of game.floats) uiText(ctx, f.text, Math.round(f.x), Math.round(f.y), f.color, 7, 'center');
  ctx.restore();

  // HUD ciudad
  drawSpr(ctx, 'coin', 0, VW / 2 - 30, 3);
  pixText(ctx, '' + game.coins, VW / 2 - 18, 5, 1, PAL.gold, 'left');
  if (game.msgT > 0) {
    ctx.globalAlpha = Math.min(1, game.msgT / 25);
    pixText(ctx, game.msg, VW / 2, 40, 1, PAL.orange, 'center');
    ctx.globalAlpha = 1;
  }
  pixText(ctx, 'S EN UNA PUERTA: ENTRAR   ESC: SALIR DE LA CIUDAD', VW / 2, 258, 1, PAL.dgray, 'center');
}

// ---------- TRABAJOS: infraestructura común ----------
const JOB_TIME = 75 * 60; // 75 segundos por turno

function startJob(id) {
  SFX.confirm();
  if (id === 'pizza') startJobPizza();
  else if (id === 'super') startJobSuper();
  else if (id === 'gas') startJobGas();
}

function _jobIntroOrRun(id, lines) {
  if (!game.hired[id]) {
    CITY.job.phase = 'intro';
    CITY.job.introLines = lines;
  } else {
    CITY.job.phase = 'run';
  }
}

function _jobCommonUpdate() {
  const j = CITY.job;
  if (j.phase === 'intro') {
    if (anyPressed('KeyF', 'Enter', 'Space', 'KeyL')) {
      game.hired[j.type] = true;
      saveGame();
      j.phase = 'run';
      SFX.confirm();
    }
    return false;
  }
  if (j.phase === 'done') {
    if (anyPressed('KeyF', 'Enter', 'Space', 'KeyL')) {
      game.coins += j.earned;
      saveGame();
      SFX.sell();
      enterCity();
    }
    return false;
  }
  if (anyPressed('Escape')) { // abandonar turno: te llevas lo ganado
    _jobFinish();
    return false;
  }
  j.t--;
  if (j.t <= 0) { _jobFinish(); return false; }
  return true;
}

function _jobFinish() {
  const j = CITY.job;
  j.phase = 'done';
  SFX.win();
}

function _jobHUD(title, extra) {
  const j = CITY.job;
  pixText(ctx, title, VW / 2, 4, 1, PAL.yellow, 'center');
  pixText(ctx, 'TIEMPO: ' + Math.ceil(j.t / 60), 8, 5, 1, j.t < 600 ? PAL.red : PAL.white, 'left');
  pixText(ctx, 'GANADO: ' + j.earned + '$', VW - 8, 5, 1, PAL.gold, 'right');
  if (extra) pixText(ctx, extra, VW / 2, 14, 1, PAL.lgray, 'center');
}

function _jobOverlays(title, doneLines) {
  const j = CITY.job;
  if (j.phase === 'intro') {
    ctx.fillStyle = 'rgba(15,15,27,0.85)';
    ctx.fillRect(30, 50, VW - 60, 170);
    pixText(ctx, title, VW / 2, 62, 2, PAL.gold, 'center');
    j.introLines.forEach((l, i) => pixText(ctx, l, VW / 2, 92 + i * 14, 1, PAL.white, 'center'));
    if (Math.floor(game.time / 25) % 2 === 0) pixText(ctx, 'F: EMPEZAR TURNO', VW / 2, 196, 1, PAL.lime, 'center');
  } else if (j.phase === 'done') {
    ctx.fillStyle = 'rgba(15,15,27,0.85)';
    ctx.fillRect(60, 60, VW - 120, 150);
    pixText(ctx, '¡TURNO TERMINADO!', VW / 2, 72, 2, PAL.gold, 'center');
    doneLines().forEach((l, i) => pixText(ctx, l, VW / 2, 100 + i * 14, 1, PAL.white, 'center'));
    pixText(ctx, 'PAGO TOTAL: ' + j.earned + ' MONEDAS', VW / 2, 160, 1, PAL.gold, 'center');
    if (Math.floor(game.time / 25) % 2 === 0) pixText(ctx, 'F: COBRAR Y VOLVER', VW / 2, 190, 1, PAL.lime, 'center');
  }
}

function _jobPlayers(allowFire) {
  const solo = game.nPlayers === 1;
  for (const p of game.players) {
    const inp = playerInput(p.idx, solo);
    if (!allowFire) { inp.fire = false; inp.grenade = false; }
    p.update(inp);
  }
  const targets = game.players.filter(p => !p.dead);
  if (targets.length) {
    const tx = targets.reduce((a, p) => a + p.x, 0) / targets.length - VW / 2;
    game.camX += (Math.max(0, Math.min(game.level.wT * TILE - VW, tx)) - game.camX) * 0.14;
  }
  for (const f of game.floats) { f.t--; f.y -= 0.5; }
  game.floats = game.floats.filter(f => f.t > 0);
  for (const pt of game.parts) {
    pt.life--;
    if (pt.grav) pt.vy += 0.12;
    pt.x += pt.vx; pt.y += pt.vy;
  }
  game.parts = game.parts.filter(p => p.life > 0);
}

// ---------- TRABAJO 1: REPARTIDOR DE PIZZAS ----------
function startJobPizza() {
  const wT = 240, hT = 22, groundRow = hT - 5;
  const lvl = _flatLevel(wT, hT, 'ciudad', groundRow);
  game.level = lvl;
  setPhysicsWorld(lvl, game);
  game.parts = []; game.floats = []; game.bullets = []; game.animals = []; game.plats = [];
  const gy = groundRow * TILE;
  const rnd = mulberry32(Date.now() % 100000);

  const deliveries = [];
  for (let i = 0; i < 5; i++) {
    deliveries.push({ x: (34 + i * 42 + Math.floor(rnd() * 12)) * TILE, done: false, color: [PAL.blue, PAL.green, PAL.purple, PAL.tan, PAL.dgreen][i] });
  }
  const cones = [];
  for (let i = 0; i < 14; i++) {
    const cx = (18 + Math.floor(rnd() * (wT - 30))) * TILE;
    if (deliveries.some(d => Math.abs(d.x - cx) < 40)) continue;
    cones.push({ x: cx, y: gy - 8, w: 8, h: 8, cd: 0 });
  }
  CITY.job = { type: 'pizza', t: JOB_TIME, earned: 0, deliveries, cones, delivered: 0 };

  for (let i = 0; i < game.nPlayers; i++) {
    const p = game.players[i];
    p.x = (4 + i) * TILE; p.y = gy - 40; p.vx = 0; p.vy = 0;
    p.moto = true; // moto de reparto de la empresa
    p.dead = false;
  }
  game.camX = 0; game.camY = Math.max(0, hT * TILE - VH);
  game.state = 'jobPizza';
  _jobIntroOrRun('pizza', [
    '¡CONTRATADO EN LA PIZZERIA!',
    'TOMA TU MOTO DE REPARTO.',
    'ENTREGA 5 PIZZAS EN LAS CASAS',
    'MARCADAS CON LA FLECHA.',
    'PARA Y PULSA S EN LA PUERTA.',
    '¡CUIDADO CON LOS CONOS!',
  ]);
}

function updateJobPizza() {
  if (!_jobCommonUpdate()) return;
  const j = CITY.job;
  _jobPlayers(false);
  const down = pressed.KeyS || pressed.ArrowDown;
  for (const p of game.players) {
    if (p.dead) continue;
    // conos: chocar te frena
    for (const c of j.cones) {
      if (c.cd > 0) { c.cd--; continue; }
      if (aabb(p, c) && Math.abs(p.vx) > 1) {
        c.cd = 50;
        p.vx *= -0.5;
        game.shake = 3;
        game.addFloat(p.x, p.y - 12, '¡CONO!', PAL.orange);
        SFX.crumble();
      }
    }
    // entregas
    if (down) {
      for (const d of j.deliveries) {
        if (d.done) continue;
        if (Math.abs(p.x + p.w / 2 - (d.x + 20)) < 24 && Math.abs(p.vx) < 1.2) {
          d.done = true;
          j.delivered++;
          const bonus = Math.min(14, Math.floor(j.t / 350));
          const pay = 20 + bonus;
          j.earned += pay;
          game.addFloat(d.x + 20, (game.level.hT - 5) * TILE - 60, '+' + pay + '$ ¡PIZZA ENTREGADA!', PAL.lime);
          SFX.sell();
          if (j.delivered === 5) { j.earned += 40; _jobFinish(); return; }
        }
      }
    }
  }
}

function renderJobPizza() {
  const lvl = game.level;
  const j = CITY.job;
  drawBG('ciudad', game.camX);
  ctx.save();
  ctx.translate(-Math.round(game.camX), -Math.round(game.camY));
  _drawCityTiles(lvl);
  const gy = (lvl.hT - 5) * TILE;
  // casas de entrega
  for (const d of j.deliveries) {
    ctx.fillStyle = d.color; ctx.fillRect(d.x, gy - 44, 40, 44);
    ctx.fillStyle = PAL.dgray; ctx.fillRect(d.x - 3, gy - 52, 46, 9);
    ctx.fillStyle = PAL.ink; ctx.fillRect(d.x + 14, gy - 22, 12, 22);
    ctx.fillStyle = PAL.yellow; ctx.fillRect(d.x + 4, gy - 38, 8, 8); ctx.fillRect(d.x + 28, gy - 38, 8, 8);
    if (!d.done) {
      const bob = Math.sin(game.time / 10) * 3;
      pixText(ctx, '!', d.x + 20, gy - 66 + bob, 2, PAL.yellow, 'center');
      drawSpr(ctx, 'pizza', 0, d.x + 15, gy - 76 + bob);
    } else {
      pixText(ctx, 'OK', d.x + 20, gy - 60, 1, PAL.lime, 'center');
    }
  }
  for (const c of j.cones) drawSpr(ctx, 'cono', 0, c.x, c.y);
  for (const p of game.players) p.draw(ctx);
  for (const f of game.floats) uiText(ctx, f.text, Math.round(f.x), Math.round(f.y), f.color, 7, 'center');
  ctx.restore();

  _jobHUD('REPARTO DE PIZZAS', 'ENTREGAS: ' + j.delivered + '/5');
  // flecha hacia la siguiente entrega
  const next = j.deliveries.find(d => !d.done);
  if (next && j.phase === 'run') {
    const p = game.players[0];
    const dir = next.x > p.x ? 1 : -1;
    pixText(ctx, dir === 1 ? '>>>' : '<<<', VW / 2 + dir * 80, 26, 2, PAL.yellow, 'center');
  }
  _jobOverlays('PIZZERIA', () => [
    'PIZZAS ENTREGADAS: ' + j.delivered + '/5',
    j.delivered === 5 ? 'BONO TURNO PERFECTO: +40$' : 'ENTREGA TODAS PARA EL BONO',
  ]);
}

// ---------- TRABAJO 2: REPONEDOR DEL SUPERMERCADO ----------
function startJobSuper() {
  const wT = 68, hT = 22, groundRow = hT - 5;
  const lvl = _flatLevel(wT, hT, 'ciudad', groundRow);
  // paredes del local
  for (let y = 0; y < hT; y++) { lvl.grid[y * wT + 0] = 1; lvl.grid[y * wT + 1] = 1; lvl.grid[y * wT + (wT - 1)] = 1; lvl.grid[y * wT + (wT - 2)] = 1; }
  game.level = lvl;
  setPhysicsWorld(lvl, game);
  game.parts = []; game.floats = []; game.bullets = []; game.animals = []; game.plats = [];
  const gy = groundRow * TILE;
  const rnd = mulberry32(Date.now() % 99999);

  const shelves = [];
  for (let i = 0; i < 6; i++) {
    shelves.push({ x: (10 + i * 9) * TILE, stock: 3, max: 5 });
  }
  const shoppers = [];
  for (let i = 0; i < 4; i++) {
    shoppers.push({ x: (12 + Math.floor(rnd() * 48)) * TILE, dir: rnd() < 0.5 ? -1 : 1, spr: CITY_NPC_SPRITES[(i + 2) % CITY_NPC_SPRITES.length], t: Math.floor(rnd() * 100), takeCd: 120 + Math.floor(rnd() * 120) });
  }
  CITY.job = { type: 'super', t: JOB_TIME, earned: 0, shelves, shoppers, restocks: 0, carrying: [false, false] };

  for (let i = 0; i < game.nPlayers; i++) {
    const p = game.players[i];
    p.x = (5 + i) * TILE; p.y = gy - 40; p.vx = 0; p.vy = 0;
    p.moto = false; p.dead = false;
  }
  game.camX = 0; game.camY = Math.max(0, hT * TILE - VH);
  game.state = 'jobSuper';
  _jobIntroOrRun('super', [
    '¡CONTRATADO EN EL SUPER!',
    'TOMA CAJAS DE LA TARIMA (S)',
    'Y LLENA LOS ESTANTES VACIOS (S).',
    'LOS CLIENTES VACIAN LOS',
    'ESTANTES POCO A POCO.',
    '¡QUE NO LLEGUEN A CERO!',
  ]);
}

function updateJobSuper() {
  if (!_jobCommonUpdate()) return;
  const j = CITY.job;
  _jobPlayers(false);
  // cargar caja = más lento
  for (const p of game.players) {
    if (j.carrying[p.idx]) p.vx *= 0.82;
  }
  // clientes toman productos
  for (const s of j.shoppers) {
    s.t++;
    s.x += s.dir * 0.5;
    if (s.x < 4 * TILE || s.x > (game.level.wT - 5) * TILE) s.dir *= -1;
    else if (s.t % 240 === 0 && Math.random() < 0.5) s.dir *= -1;
    if (s.takeCd > 0) { s.takeCd--; continue; }
    for (const sh of j.shelves) {
      if (sh.stock > 0 && Math.abs(s.x - (sh.x + 20)) < 14) {
        sh.stock--;
        s.takeCd = 200 + Math.random() * 200;
        game.addFloat(sh.x + 20, (game.level.hT - 5) * TILE - 58, '-1', PAL.red);
        break;
      }
    }
  }
  // agarrar y reponer con S
  const down = pressed.KeyS || pressed.ArrowDown;
  if (down) {
    const gy = (game.level.hT - 5) * TILE;
    for (const p of game.players) {
      if (p.dead) continue;
      const cx = p.x + p.w / 2;
      if (!j.carrying[p.idx] && cx < 8 * TILE) {
        j.carrying[p.idx] = true;
        game.addFloat(p.x, p.y - 14, '¡CAJA!', PAL.tan);
        SFX.collect();
      } else if (j.carrying[p.idx]) {
        for (const sh of j.shelves) {
          if (Math.abs(cx - (sh.x + 20)) < 22 && sh.stock < sh.max) {
            sh.stock = Math.min(sh.max, sh.stock + 2);
            j.carrying[p.idx] = false;
            j.restocks++;
            j.earned += 6;
            game.addFloat(sh.x + 20, gy - 58, '+6$', PAL.lime);
            SFX.buy();
            break;
          }
        }
      }
    }
  }
}

function renderJobSuper() {
  const lvl = game.level;
  const j = CITY.job;
  // interior del súper
  ctx.fillStyle = '#3a4466'; ctx.fillRect(0, 0, VW, VH);
  ctx.save();
  ctx.translate(-Math.round(game.camX), -Math.round(game.camY));
  const gy = (lvl.hT - 5) * TILE;
  // piso y pared del fondo
  ctx.fillStyle = '#4e5a82'; ctx.fillRect(2 * TILE, gy - 120, (lvl.wT - 4) * TILE, 120);
  _drawCityTiles(lvl);
  // tarima de cajas
  for (let i = 0; i < 3; i++) for (let k = 0; k <= i; k++) drawSpr(ctx, 'caja', 0, 3 * TILE + k * 13, gy - 10 - (2 - i) * 10);
  pixText(ctx, 'CAJAS', 4 * TILE + 12, gy - 48, 1, PAL.tan, 'center');
  // estantes
  for (const sh of j.shelves) {
    ctx.fillStyle = PAL.brown; ctx.fillRect(sh.x, gy - 46, 40, 46);
    ctx.fillStyle = PAL.dbrown;
    for (let lvl2 = 0; lvl2 < 3; lvl2++) ctx.fillRect(sh.x + 2, gy - 40 + lvl2 * 14, 36, 3);
    // productos según stock
    for (let s = 0; s < sh.stock; s++) {
      const row = Math.floor(s / 2), col = s % 2;
      ctx.fillStyle = [PAL.red, PAL.yellow, PAL.cyan, PAL.lime, PAL.pink][s];
      ctx.fillRect(sh.x + 5 + col * 18, gy - 37 + row * 14, 12, 9);
    }
    if (sh.stock === 0 && Math.floor(game.time / 20) % 2 === 0) {
      pixText(ctx, '¡VACIO!', sh.x + 20, gy - 56, 1, PAL.red, 'center');
    }
  }
  // clientes
  for (const s of j.shoppers) {
    drawSpr(ctx, s.spr, 1 + (Math.floor(s.t / 8) % 2), s.x, gy - 18, s.dir === -1);
  }
  for (const p of game.players) {
    p.draw(ctx);
    if (j.carrying[p.idx] && !p.dead) drawSpr(ctx, 'caja', 0, p.x - 1, p.y - 12);
  }
  for (const f of game.floats) uiText(ctx, f.text, Math.round(f.x), Math.round(f.y), f.color, 7, 'center');
  ctx.restore();

  _jobHUD('REPONEDOR DEL SUPER', 'REPUESTOS: ' + j.restocks);
  _jobOverlays('SUPERMERCADO', () => {
    const avg = j.shelves.reduce((a, s) => a + s.stock, 0) / j.shelves.length;
    const bonus = Math.round(avg * 8);
    if (j.phase === 'done' && !j._bonusGiven) { j._bonusGiven = true; j.earned += bonus; }
    return ['CAJAS REPUESTAS: ' + j.restocks, 'BONO POR ESTANTES LLENOS: +' + bonus + '$'];
  });
}

// ---------- TRABAJO 3: GASOLINERA ----------
function startJobGas() {
  const wT = 64, hT = 22, groundRow = hT - 5;
  const lvl = _flatLevel(wT, hT, 'ciudad', groundRow);
  game.level = lvl;
  setPhysicsWorld(lvl, game);
  game.parts = []; game.floats = []; game.bullets = []; game.animals = []; game.plats = [];
  const gy = groundRow * TILE;

  CITY.job = {
    type: 'gas', t: JOB_TIME, earned: 0, served: 0,
    pumps: [{ x: 20 * TILE, car: null, next: 30 }, { x: 38 * TILE, car: null, next: 120 }],
  };

  for (let i = 0; i < game.nPlayers; i++) {
    const p = game.players[i];
    p.x = (12 + i * 2) * TILE; p.y = gy - 40; p.vx = 0; p.vy = 0;
    p.moto = false; p.dead = false;
  }
  game.camX = Math.max(0, 18 * TILE - 100); game.camY = Math.max(0, hT * TILE - VH);
  game.state = 'jobGas';
  _jobIntroOrRun('gas', [
    '¡CONTRATADO EN LA GASOLINERA!',
    'ACERCATE AL AUTO Y MANTEN S',
    'PARA LLENAR EL TANQUE.',
    'SUELTA EN LA ZONA VERDE',
    'PARA GANAR PROPINA.',
    '¡NO LOS HAGAS ESPERAR!',
  ]);
}

const _CAR_SPRITES = ['auto_rojo', 'auto_azul', 'auto_verde', 'auto_lila'];

function updateJobGas() {
  if (!_jobCommonUpdate()) return;
  const j = CITY.job;
  _jobPlayers(false);
  const gy = (game.level.hT - 5) * TILE;
  const holdS = keys.KeyS || keys.ArrowDown;

  for (const pump of j.pumps) {
    // llega un auto nuevo
    if (!pump.car) {
      if (--pump.next <= 0) {
        pump.car = {
          x: game.level.wT * TILE + 20, y: gy - 24,
          state: 'arriving', need: 40 + Math.floor(Math.random() * 60), fill: 0,
          patience: 12 * 60, spr: _CAR_SPRITES[Math.floor(Math.random() * _CAR_SPRITES.length)],
          filling: false,
        };
      }
      continue;
    }
    const car = pump.car;
    if (car.state === 'arriving') {
      car.x -= 2.6;
      if (car.x <= pump.x + 18) { car.x = pump.x + 18; car.state = 'waiting'; }
    } else if (car.state === 'waiting' || car.state === 'filling') {
      car.patience--;
      if (car.patience <= 0 && car.fill === 0) {
        car.state = 'leaving';
        game.addFloat(car.x + 14, car.y - 14, '¡SE FUE ENOJADO!', PAL.red);
        SFX.denied();
      }
      // ¿algún jugador llenando?
      let filling = false;
      for (const p of game.players) {
        if (p.dead) continue;
        if (Math.abs(p.x + p.w / 2 - (car.x + 14)) < 30 && holdS && p.onGround) filling = true;
      }
      if (filling) {
        car.state = 'filling';
        car.filling = true;
        car.fill += 1.15;
        if (game.time % 12 === 0) SFX.select();
        // derrame por sobrellenado
        if (car.fill > car.need + 10) {
          const pay = Math.max(4, Math.round(car.need / 4) - 5);
          j.earned += pay;
          j.served++;
          game.addFloat(car.x + 14, car.y - 14, '¡DERRAME! +' + pay + '$', PAL.orange);
          car.state = 'leaving';
          SFX.crumble();
        }
      } else if (car.filling) {
        // soltó la manguera: evaluar
        car.filling = false;
        if (car.fill >= car.need) {
          const tip = car.fill <= car.need + 6 ? 8 : 0;
          const pay = Math.round(car.need / 4) + tip;
          j.earned += pay;
          j.served++;
          game.addFloat(car.x + 14, car.y - 14, '+' + pay + '$' + (tip ? ' ¡PROPINA!' : ''), tip ? PAL.lime : PAL.gold);
          car.state = 'leaving';
          SFX.sell();
        }
      }
    } else if (car.state === 'leaving') {
      car.x -= 3.4;
      if (car.x < -60) { pump.car = null; pump.next = 60 + Math.floor(Math.random() * 80); }
    }
  }
}

function renderJobGas() {
  const lvl = game.level;
  const j = CITY.job;
  drawBG('ciudad', game.camX);
  ctx.save();
  ctx.translate(-Math.round(game.camX), -Math.round(game.camY));
  _drawCityTiles(lvl);
  const gy = (lvl.hT - 5) * TILE;
  // techo de la gasolinera
  ctx.fillStyle = PAL.red; ctx.fillRect(16 * TILE, gy - 92, 28 * TILE, 8);
  ctx.fillStyle = PAL.white; ctx.fillRect(16 * TILE, gy - 84, 28 * TILE, 4);
  ctx.fillStyle = PAL.gray;
  ctx.fillRect(17 * TILE, gy - 84, 4, 84); ctx.fillRect(43 * TILE - 4, gy - 84, 4, 84);
  pixText(ctx, 'GASOLINERA', 30 * TILE, gy - 90, 1, PAL.white, 'center');
  // surtidores
  for (const pump of j.pumps) {
    drawSpr(ctx, 'surtidor', 0, pump.x, gy - 24);
    const car = pump.car;
    if (car && car.state !== 'gone') {
      drawSpr(ctx, car.spr, 0, car.x, car.y + 4);
      if (car.state === 'waiting' || car.state === 'filling') {
        // medidor de tanque con zona verde
        const bw = 40;
        const bx = car.x + 14 - bw / 2, by = car.y - 16;
        ctx.fillStyle = PAL.ink; ctx.fillRect(bx - 1, by - 1, bw + 2, 7);
        // zona verde (need..need+6)
        const gx = bx + (car.need / (car.need + 15)) * bw;
        const gw = (6 / (car.need + 15)) * bw;
        ctx.fillStyle = PAL.dgreen; ctx.fillRect(Math.round(gx), by, Math.ceil(gw), 5);
        // llenado
        const fw = Math.min(bw, (car.fill / (car.need + 15)) * bw);
        ctx.fillStyle = car.fill > car.need + 6 ? PAL.red : PAL.cyan;
        ctx.fillRect(bx, by, Math.round(fw), 5);
        // paciencia
        if (car.fill === 0) {
          ctx.fillStyle = car.patience < 300 ? PAL.red : PAL.lgray;
          ctx.fillRect(bx, by - 5, Math.round(bw * car.patience / (12 * 60)), 2);
        }
      }
    }
  }
  for (const p of game.players) p.draw(ctx);
  for (const f of game.floats) uiText(ctx, f.text, Math.round(f.x), Math.round(f.y), f.color, 7, 'center');
  ctx.restore();

  _jobHUD('DESPACHADOR DE GASOLINA', 'AUTOS ATENDIDOS: ' + j.served);
  _jobOverlays('GASOLINERA', () => ['AUTOS ATENDIDOS: ' + j.served, 'LAS PROPINAS SON DE LA ZONA VERDE']);
}
