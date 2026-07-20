'use strict';
// ============ SPRITES: pixel art dibujado a mano ============

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Paleta global (Sweetie-16 extendida)
const PAL = {
  ink: '#1a1c2c', purple: '#5d275d', red: '#b13e53', orange: '#ef7d57',
  yellow: '#ffcd75', lime: '#a7f070', green: '#38b764', dgreen: '#257179',
  navy: '#29366f', blue: '#3b5dc9', skyblue: '#41a6f6', cyan: '#73eff7',
  white: '#f4f4f4', lgray: '#94b0c2', gray: '#566c86', dgray: '#333c57',
  brown: '#7a4841', dbrown: '#4e2b23', tan: '#c98f5f', sand: '#e8c170',
  dsand: '#b8863e', skin: '#eeb98a', dskin: '#d68e5e', cream: '#f7e3c0',
  blood: '#8c2333', pink: '#e8a5b2', gold: '#f5b921', dgold: '#c1852a',
  snow: '#e9f4fa', ice: '#a8d8e8', dice: '#6fa8c8', fur: '#9b6a4f',
  black: '#0f0f1b', olive: '#6b7f3f', dolive: '#485c2b', khaki: '#c2b280',
};

const SPR = {};

function _padRows(rows) {
  const w = Math.max(...rows.map(r => r.length));
  return rows.map(r => r.padEnd(w, '.'));
}

function _canvasFrom(rows, pal) {
  rows = _padRows(rows);
  const w = rows[0].length, h = rows.length;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const col = pal[rows[y][x]];
    if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
  }
  return c;
}

function _flip(c) {
  const f = document.createElement('canvas');
  f.width = c.width; f.height = c.height;
  const g = f.getContext('2d');
  g.translate(c.width, 0); g.scale(-1, 1);
  g.drawImage(c, 0, 0);
  return f;
}

function _flipV(c) {
  const f = document.createElement('canvas');
  f.width = c.width; f.height = c.height;
  const g = f.getContext('2d');
  g.translate(0, c.height); g.scale(1, -1);
  g.drawImage(c, 0, 0);
  return f;
}

function defSprite(name, pal, ...framesRows) {
  const frames = framesRows.map(rows => _canvasFrom(rows, pal));
  SPR[name] = {
    frames,
    flip: frames.map(_flip),
    flipV: frames.map(_flipV),
    w: frames[0].width, h: frames[0].height,
  };
}

function drawSpr(g, name, frame, x, y, flip, scale) {
  const s = SPR[name];
  if (!s) return;
  const f = frame % s.frames.length;
  const img = flip ? s.flip[f] : s.frames[f];
  x = Math.round(x); y = Math.round(y);
  if (scale && scale !== 1) g.drawImage(img, x, y, Math.round(s.w * scale), Math.round(s.h * scale));
  else g.drawImage(img, x, y);
}

function drawSprV(g, name, frame, x, y, flip) {
  const s = SPR[name];
  if (!s) return;
  const f = frame % s.frames.length;
  const img = s.flipV[f];
  g.save();
  if (flip) { g.translate(Math.round(x) + s.w, 0); g.scale(-1, 1); g.drawImage(img, 0, Math.round(y)); }
  else g.drawImage(img, Math.round(x), Math.round(y));
  g.restore();
}

// ============ PERSONAJES (24x18, mirando a la derecha) ============
// El arma es un sprite aparte que se dibuja en la mano: ancla en (11,7).
const HAND = { x: 11, y: 7 };

const _CHAR_BODY = [
  '.......ssssssss.........', // 3 cara
  '.......sssKssKs.........', // 4 ojos
  '.......ssssssss.........', // 5
  '........dsssss..........', // 6 barbilla
  '.......cccccccc.........', // 7 hombros
  '......ccccccccaa........', // 8 brazo extendido
  '......cccccccca.........', // 9
  '......cccccccc..........', // 10
  '......pppppppp..........', // 11
  '......pppppppp..........', // 12
];
const _LEGS = {
  idle: [
    '......ppp..ppp..........',
    '......ppp..ppp..........',
    '......ppp..ppp..........',
    '......bbb..bbb..........',
    '......bbb..bbb..........',
  ],
  walk1: [
    '......ppp..ppp..........',
    '.....ppp....ppp.........',
    '.....ppp....ppp.........',
    '....bbb......bbb........',
    '....bbb......bbb........',
  ],
  walk2: [
    '......ppp.ppp...........',
    '......ppppppp...........',
    '.......ppppp............',
    '.......bbbb.............',
    '.......bbbb.............',
  ],
  jump: [
    '......ppp..ppp..........',
    '......ppp..ppp..........',
    '......bbb..bbb..........',
    '......bbb..bbb..........',
    '........................',
  ],
};

// Definiciones base de cada personaje (gorro + paleta propia)
const CHAR_SPRITE_DEFS = [
  { id: 'cazador', hat: [
    '........hhhhhhh.........',
    '.......hhhhhhhhhh.......',
    '.......hhhhhhhh.........',
  ], pal: { s: PAL.skin, d: PAL.dskin, K: PAL.ink, c: PAL.green, p: PAL.brown, b: PAL.dbrown, a: PAL.dskin, h: PAL.dgreen } },
  { id: 'exploradora', hat: [
    '........kkkkkkk.........',
    '.....kk.kkkkkkkk........',
    '....kkk.kkkkkkkk........',
  ], pal: { s: PAL.skin, d: PAL.dskin, K: PAL.ink, c: PAL.orange, p: PAL.khaki, b: PAL.brown, a: PAL.dskin, k: PAL.red, h: PAL.red } },
  { id: 'tanque', hat: [
    '.......iiiiiiiii........',
    '......iiiiiiiiiii.......',
    '......ii.......ii.......',
  ], pal: { s: PAL.dskin, d: PAL.brown, K: PAL.ink, c: PAL.olive, p: PAL.dolive, b: PAL.black, a: PAL.brown, i: PAL.gray, h: PAL.gray } },
  { id: 'francotirador', hat: [
    '........hhhhhh..........',
    '......hhhhhhhhhh........',
    '.....hhhhhhhhhhhh.......',
  ], pal: { s: PAL.skin, d: PAL.dskin, K: PAL.ink, c: PAL.navy, p: PAL.dgray, b: PAL.black, a: PAL.dskin, h: PAL.dolive } },
  { id: 'trampero', hat: [
    '.......iihhhhii.........',
    '......ihhhhhhhhi........',
    '......ihhhhhhhhi........',
  ], pal: { s: PAL.skin, d: PAL.dskin, K: PAL.ink, c: PAL.tan, p: PAL.brown, b: PAL.dbrown, a: PAL.dskin, h: PAL.fur, i: PAL.cream } },
];

// Skins: transforman la paleta de ropa (la cara y silueta se conservan)
const SKIN_MODS = [
  p => p,                                                                                              // 0 Clásico
  p => Object.assign({}, p, { c: PAL.navy, p: PAL.dgray, b: PAL.black, h: PAL.purple, i: PAL.dgray, k: PAL.blue }),   // 1 Nocturno
  p => Object.assign({}, p, { c: PAL.gold, p: PAL.dgold, b: PAL.brown, h: PAL.yellow, i: PAL.cream, k: PAL.gold }),   // 2 Dorado
  p => Object.assign({}, p, { c: PAL.cyan, p: PAL.purple, b: PAL.ink, h: PAL.lime, i: PAL.pink, k: PAL.pink }),       // 3 Neón
  p => Object.assign({}, p, { c: PAL.dolive, p: PAL.olive, b: PAL.dbrown, h: PAL.dgreen, i: PAL.olive, k: PAL.dgreen }), // 4 Camuflaje
  p => Object.assign({}, p, { c: PAL.blood, p: PAL.black, b: PAL.black, h: PAL.red, i: PAL.blood, k: PAL.blood }),       // 5 Sangre
  p => Object.assign({}, p, { c: PAL.lgray, p: PAL.white, b: PAL.gray, h: PAL.white, i: PAL.lgray, k: PAL.white, s: PAL.snow, d: PAL.lgray }), // 6 Fantasma
  p => Object.assign({}, p, { c: PAL.pink, p: PAL.skyblue, b: PAL.purple, h: PAL.lime, i: PAL.yellow, k: PAL.cyan }),    // 7 Fiesta
];

for (const cd of CHAR_SPRITE_DEFS) {
  const mk = legs => cd.hat.concat(_CHAR_BODY, _LEGS[legs]);
  for (let si = 0; si < SKIN_MODS.length; si++) {
    defSprite('char_' + cd.id + '_' + si, SKIN_MODS[si](cd.pal), mk('idle'), mk('walk1'), mk('walk2'), mk('jump'));
  }
}

// ============ ARMAS (sprites que van en la mano) ============
const _WPAL = { g: PAL.dgray, m: PAL.gray, w: PAL.brown, v: PAL.dbrown, r: PAL.red, y: PAL.yellow, c: PAL.cyan };
defSprite('w_pistola', _WPAL,
  ['.ggggggg', '.ggggggg', '.ww.....', '.ww.....']);
defSprite('w_rifle', _WPAL,
  ['wwwgggggggggggg', 'wwwwggg........', '.www...........']);
defSprite('w_escopeta', _WPAL,
  ['wwgggggggggg.', 'wwgggggggggg.', '.www.mm......']);
defSprite('w_auto', _WPAL,
  ['wwggggggggggg', 'wwwggggg.....', '..w..ggg.....', '.....gg......']);
defSprite('w_franco', _WPAL,
  ['....mmm.........', 'wwwggggggggggggg', 'wwwwgg..........', '..ww............']);
defSprite('w_rocket', _WPAL,
  ['mmmmmmmmmmmmrr.', 'mmyymmmmmmmmrrr', 'mmmmmmmmmmmmrr.', '...ww..........', '...ww..........']);

// Proyectil cohete + explosión se hacen con partículas
defSprite('rocket_p', { m: PAL.gray, r: PAL.red, y: PAL.yellow, o: PAL.orange },
  ['mmmmmmrr.', 'ymmmmmrrr', 'mmmmmmrr.']);

// Armas nuevas
defSprite('w_smg', _WPAL,
  ['.ggggggggg', '.gggggg...', '.ww.gg....', '....gg....']);
defSprite('w_magnum', _WPAL,
  ['mmmmmmmmm.', '.wwmmmm...', '.ww.......', '.ww.......']);
defSprite('w_ballesta', _WPAL,
  ['..v....v....', '.vv.mmmvv...', 'wwwwwwwwwwww', '.vv.mmmvv...', '..v....v....']);
defSprite('w_laser', _WPAL,
  ['..cc.........', 'ggggcccccccc.', 'gggggggggggcc', '.ww..gg......']);
defSprite('w_minigun', _WPAL,
  ['ggmmmmmmmmmm.', 'ggmmmmmmmmmm.', 'ggmmmmmmmmmm.', '.wwgg........', '.ww..........']);

// Granada (proyectil e icono)
defSprite('granada_p', { g: PAL.dolive, d: PAL.dgreen, m: PAL.gray },
  ['..mm...', '..mm...', '.gggg..', 'gggggg.', 'gdgggg.', 'gggggg.', '.gggg..']);

// ============ ITEMS Y CIUDAD ============
defSprite('itm_moto', { r: PAL.red, m: PAL.gray, d: PAL.dgray, k: PAL.black, y: PAL.yellow },
  ['......rrrr......', '..y..rrrrrr.....', '..rrrrrrrrrr....', '.rrrrmmmmrrr....', '.kk.mmmm.kk.....', 'kkkk.....kkkk...', 'kkkk.....kkkk...', '.kk.......kk....']);
defSprite('itm_bebida', { c: PAL.cyan, y: PAL.yellow, w: PAL.white, d: PAL.blue },
  ['.wwww.', '.cccc.', 'cccccc', 'ccyycc', 'cyyyyc', 'ccyycc', 'cccccc', 'dddddd']);
defSprite('itm_granada', { g: PAL.dolive, d: PAL.dgreen, m: PAL.gray, y: PAL.yellow },
  ['..mm..', '.ymm..', '.gggg.', 'gggggg', 'gdgggg', 'gggggg', '.gggg.', '......']);

// Moto de reparto / turbo (se dibuja bajo el jugador, 2 frames de ruedas)
defSprite('moto', { r: PAL.red, m: PAL.lgray, d: PAL.dgray, k: PAL.black, y: PAL.yellow, w: PAL.white },
  [
    '.............mm.........',
    '......rrrrrrrmm.........',
    '..y.rrrrrrrrrrr.........',
    '.yyrrrrrrrrrrrrr........',
    '..kkk.mmmmmm.kkk........',
    '.kkkkk......kkkkk.......',
    '.kkwkk......kkwkk.......',
    '..kkk........kkk........',
  ],
  [
    '.............mm.........',
    '......rrrrrrrmm.........',
    '..y.rrrrrrrrrrr.........',
    '.yyrrrrrrrrrrrrr........',
    '..kkk.mmmmmm.kkk........',
    '.kkkkk......kkkkk.......',
    '.kwkkk......kwkkk.......',
    '..kkk........kkk........',
  ]);

// Caja del supermercado
defSprite('caja', { c: PAL.tan, d: PAL.brown, t: PAL.cream },
  ['cccccccccccc', 'cddccccccddc', 'ccddccccddcc', 'cccttttttccc', 'cccccccccccc', 'cddccccccddc', 'cccccccccccc', 'dddddddddddd']);

// Cono de tráfico
defSprite('cono', { o: PAL.orange, w: PAL.white },
  ['...oo...', '...oo...', '..wwww..', '..oooo..', '.oooooo.', '.wwwwww.', 'oooooooo', '........']);

// Autos (mismas filas, paletas distintas)
const _CAR_ROWS = [
  [
    '.........ccccccccc..........',
    '.......ccwwwwwwwwcc.........',
    '.....cccwwcccccwwccc........',
    '.ccccccccccccccccccccccc....',
    'cccccccccccccccccccccccccy..',
    'cccccccccccccccccccccccccy..',
    '..kkkk..............kkkk....',
    '.kkkkkk............kkkkkk...',
    '.kkwwkk............kkwwkk...',
    '..kkkk..............kkkk....',
  ],
];
defSprite('auto_rojo',  { c: PAL.red,    w: PAL.skyblue, k: PAL.black, y: PAL.yellow }, ..._CAR_ROWS);
defSprite('auto_azul',  { c: PAL.blue,   w: PAL.cyan,    k: PAL.black, y: PAL.yellow }, ..._CAR_ROWS);
defSprite('auto_verde', { c: PAL.green,  w: PAL.skyblue, k: PAL.black, y: PAL.yellow }, ..._CAR_ROWS);
defSprite('auto_lila',  { c: PAL.purple, w: PAL.pink,    k: PAL.black, y: PAL.yellow }, ..._CAR_ROWS);

// Surtidor de gasolina
defSprite('surtidor', { r: PAL.red, d: PAL.blood, w: PAL.white, k: PAL.black, m: PAL.gray },
  ['rrrrrrrrrr....', 'rrwwwwwwrr....', 'rrwkkkkwrr....', 'rrwwwwwwrr....', 'rrrrrrrrrr....', 'rrrrrrrrrrmm..', 'rrddddddrrmm..', 'rrddddddrr.m..', 'rrrrrrrrrr.m..', 'rrrrrrrrrr.m..', 'rrrrrrrrrrmm..', 'ddddddddddm...']);

// Caja de pizza
defSprite('pizza', { r: PAL.red, c: PAL.cream, d: PAL.tan },
  ['cccccccccc', 'crrrrrrrrc', 'cddddddddc', 'cccccccccc']);

// ============ ANIMALES (mirando a la derecha) ============

// VENADO 22x14 — bosque
defSprite('venado', { a: PAL.dbrown, h: PAL.tan, K: PAL.ink, c: PAL.tan, w: PAL.cream, d: PAL.dbrown, n: PAL.ink },
  [
    '..............a...a...',
    '..........a...a..a....',
    '..........aa..aaa.....',
    '...........aaaa.......',
    '...........hhhh.......',
    '...........hKhn.......',
    '....ccccccchhh........',
    '...ccccccccch.........',
    '..wcccccccccc.........',
    '..wccccccccc..........',
    '...cc......cc.........',
    '...cc......cc.........',
    '...cc......cc.........',
    '...dd......dd.........',
  ],
  [
    '..............a...a...',
    '..........a...a..a....',
    '..........aa..aaa.....',
    '...........aaaa.......',
    '...........hhhh.......',
    '...........hKhn.......',
    '....ccccccchhh........',
    '...ccccccccch.........',
    '..wcccccccccc.........',
    '..wccccccccc..........',
    '..cc........cc........',
    '..cc........cc........',
    '.cc..........cc.......',
    '.dd..........dd.......',
  ]);

// CONEJO 12x10
defSprite('conejo', { e: PAL.cream, h: PAL.cream, K: PAL.ink, c: PAL.cream, w: PAL.white, d: PAL.pink },
  [
    '..e...e.....',
    '..e...e.....',
    '..hhhhh.....',
    '..hhKhh.....',
    'cchhhhh.....',
    'ccccccc.....',
    'wcccccc.....',
    'wcccccc.....',
    '.cc..cc.....',
    '.dd..dd.....',
  ],
  [
    '..e...e.....',
    '..e...e.....',
    '..hhhhh.....',
    '..hhKhh.....',
    'cchhhhh.....',
    'ccccccc.....',
    'wcccccc.....',
    'wcccccc.....',
    'cc....cc....',
    'dd....dd....',
  ]);

// JABALÍ 18x11
defSprite('jabali', { c: PAL.dbrown, h: PAL.dbrown, K: PAL.red, t: PAL.cream, d: PAL.black, m: PAL.brown },
  [
    '.....mmmm.........',
    '...mmmmmmmm.......',
    '..ccccccccccchh...',
    '.cccccccccccchhh..',
    '.ccccccccccccKhh..',
    '.cccccccccccchht..',
    '.ccccccccccccht...',
    '.cccccccccccc.....',
    '..cc......cc......',
    '..cc......cc......',
    '..dd......dd......',
  ],
  [
    '.....mmmm.........',
    '...mmmmmmmm.......',
    '..ccccccccccchh...',
    '.cccccccccccchhh..',
    '.ccccccccccccKhh..',
    '.cccccccccccchht..',
    '.ccccccccccccht...',
    '.cccccccccccc.....',
    '.cc........cc.....',
    'cc..........cc....',
    'dd..........dd....',
  ]);

// OSO 22x16 (y OSO POLAR con paleta blanca)
const _BEAR_ROWS = [
  [
    '..............ee.ee...',
    '.............hhhhhh...',
    '.............hhKhhh...',
    '....ccccccccchhhhnn...',
    '...cccccccccchhhn.....',
    '..cccccccccccchh......',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..ccc.....cccc........',
    '..ccc.....cccc........',
    '..ccc.....cccc........',
    '..ddd.....dddd........',
    '..ddd.....dddd........',
  ],
  [
    '..............ee.ee...',
    '.............hhhhhh...',
    '.............hhKhhh...',
    '....ccccccccchhhhnn...',
    '...cccccccccchhhn.....',
    '..cccccccccccchh......',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..ccc......ccc........',
    '.ccc........ccc.......',
    '.ccc........ccc.......',
    '.ddd........ddd.......',
    'ddd..........ddd......',
  ],
];
defSprite('oso', { e: PAL.brown, h: PAL.brown, K: PAL.ink, c: PAL.brown, d: PAL.dbrown, n: PAL.ink }, ..._BEAR_ROWS);
defSprite('osopolar', { e: PAL.snow, h: PAL.snow, K: PAL.ink, c: PAL.snow, d: PAL.ice, n: PAL.ink }, ..._BEAR_ROWS);

// MONO 14x13 — jungla (lanza cocos)
defSprite('mono', { h: PAL.fur, K: PAL.ink, f: PAL.cream, c: PAL.fur, t: PAL.fur, n: PAL.dbrown, o: PAL.dbrown },
  [
    '....hhhh......',
    '...hhffff.....',
    '...hhfKfK.....',
    '...hhffff.....',
    '..t.hfff......',
    '.tt.cccc.oo...',
    '.t.ccccccooo..',
    '.t.cccccc.oo..',
    '.ttcccccc.....',
    '..tccccc......',
    '...cc.cc......',
    '...cc.cc......',
    '...nn.nn......',
  ],
  [
    '....hhhh......',
    '...hhffff.....',
    '...hhfKfK.....',
    '...hhffff.....',
    '..t.hfffoo....',
    '.tt.ccccooo...',
    '.t.cccccc.o...',
    '.t.cccccc.....',
    '.ttcccccc.....',
    '..tccccc......',
    '..cc...cc.....',
    '..cc...cc.....',
    '..nn...nn.....',
  ]);

// TUCÁN 16x12 — volador jungla
defSprite('tucan', { b: PAL.black, w: PAL.white, o: PAL.orange, y: PAL.yellow, K: PAL.white, d: PAL.dgray },
  [
    '......bbb.......',
    '.....bbbbb......',
    '.....bbKbboooo..',
    '.bbbbbbbbbooooo.',
    'bbbbbbbbwwoooo..',
    'bbbbbbbbww......',
    '.bbbbbbbww......',
    '..bbbbbbw.......',
    '...bbbbb........',
    '....yy..........',
    '....yy..........',
    '................',
  ],
  [
    '......bbb.......',
    '.....bbbbb......',
    '.....bbKbboooo..',
    '.bbbbbbbbbooooo.',
    'dbbbbbbbwwoooo..',
    'ddbbbbbbww......',
    'dddbbbbww.......',
    '..dddbbw........',
    '....ddd.........',
    '....yy..........',
    '....yy..........',
    '................',
  ]);

// SERPIENTE 22x7 — jungla
defSprite('serpiente', { g: PAL.green, d: PAL.dgreen, K: PAL.red, t: PAL.red, y: PAL.yellow },
  [
    '..................gg..',
    '.................gggg.',
    '.gggg....gggg....gKgg.',
    'gggggg..gggggg..gggg.t',
    'ggydgggggydggggggggg.t',
    '.ggddggggggddgggggg...',
    '..gggg....gggg........',
  ],
  [
    '..................gg..',
    '.................gggg.',
    'g.gggg....gggg...gKgg.',
    'gggggg..gggggg..gggg.t',
    '.gydgggggydgggggggggt.',
    '..ddggggggddggggggg...',
    '...gg......gg.........',
  ]);

// JAGUAR 22x13 — jungla (y PANTERA para el boss via paleta)
const _JAG_ROWS = [
  [
    '..................ee..',
    '.............hhhhhhh..',
    '.............hhKhhh...',
    '....ccccccccchhhhnn...',
    '...ccocccoccchhh......',
    '..cccccoccccoch.......',
    '..cocccccoccccc.......',
    '..ccccoccccocc........',
    '..cccccccccccc........',
    '..ccc.....ccc.........',
    '..ccc.....ccc.........',
    '..ccc.....ccc.........',
    '..ddd.....ddd.........',
  ],
  [
    '..................ee..',
    '.............hhhhhhh..',
    '.............hhKhhh...',
    '....ccccccccchhhhnn...',
    '...ccocccoccchhh......',
    '..cccccoccccoch.......',
    '..cocccccoccccc.......',
    '..ccccoccccocc........',
    '..cccccccccccc........',
    '..cc.......cc.........',
    '.cc.........cc........',
    '.cc.........cc........',
    '.dd.........dd........',
  ],
];
defSprite('jaguar', { e: PAL.yellow, h: PAL.yellow, K: PAL.ink, c: PAL.yellow, o: PAL.dbrown, d: PAL.dsand, n: PAL.ink }, ..._JAG_ROWS);

// ESCORPIÓN 18x12 — desierto
defSprite('escorpion', { c: PAL.dsand, d: PAL.brown, K: PAL.red, s: PAL.red, p: PAL.brown },
  [
    '.......ss.........',
    '......sss.........',
    '......dd..........',
    '......dd..........',
    '.....ddd......pp..',
    '....ddd.....ppp...',
    '..ccccccccccpp....',
    '.cccccccccccpp....',
    '.ccccccccccKc.....',
    '..cccccccccc......',
    '..d.d.d..d.d.d....',
    '..d.d.d..d.d.d....',
  ],
  [
    '.......ss.........',
    '......sss.........',
    '......dd..........',
    '......dd..........',
    '.....ddd......pp..',
    '....ddd.....ppp...',
    '..ccccccccccpp....',
    '.cccccccccccpp....',
    '.ccccccccccKc.....',
    '..cccccccccc......',
    '.d.d.d....d.d.d...',
    '.d.d.d....d.d.d...',
  ]);

// BUITRE 16x12 — volador desierto
defSprite('buitre', { b: PAL.dbrown, w: PAL.brown, p: PAL.pink, K: PAL.ink, o: PAL.dsand },
  [
    '.....bbb........',
    '....bbbbb.......',
    '....bbbbb..pp...',
    '.bbbbbbbbbbppK..',
    'bbbbbbbbbbbpoo..',
    'bbbbbbbbbbb.....',
    '.bbbbbbbbb......',
    '..bbbbbbb.......',
    '...bbbbb........',
    '....ww..........',
    '................',
    '................',
  ],
  [
    '................',
    '................',
    '...........pp...',
    '.bbbbbbbbbbppK..',
    'bbbbbbbbbbbpoo..',
    'bbbbbbbbbbb.....',
    '.bbbbbbbbbb.....',
    '..bbbbbbbb......',
    '...bbbbbb.......',
    '....bbbb........',
    '.....ww.........',
    '................',
  ]);

// COYOTE 20x12 (LOBO y HIENA con paletas distintas; 'm' = lomo/manchas)
const _COYOTE_ROWS = [
  [
    '................ee..',
    '...........hhhhhh...',
    '...........hhKhhh...',
    '..mmmmmmmmmhhhhnn...',
    '.mmmmmmmmmmmhhh.....',
    'tcccccccccccch......',
    'ttcccccccccccc......',
    '.tccccccccccc.......',
    '..ccc.....ccc.......',
    '..ccc.....ccc.......',
    '..ccc.....ccc.......',
    '..ddd.....ddd.......',
  ],
  [
    '................ee..',
    '...........hhhhhh...',
    '...........hhKhhh...',
    '..mmmmmmmmmhhhhnn...',
    '.mmmmmmmmmmmhhh.....',
    'tcccccccccccch......',
    'ttcccccccccccc......',
    '.tccccccccccc.......',
    '..cc.......cc.......',
    '.cc.........cc......',
    '.cc.........cc......',
    '.dd.........dd......',
  ],
];
defSprite('coyote', { e: PAL.tan, h: PAL.tan, K: PAL.ink, c: PAL.tan, m: PAL.brown, t: PAL.brown, d: PAL.dbrown, n: PAL.ink }, ..._COYOTE_ROWS);
defSprite('lobo', { e: PAL.lgray, h: PAL.lgray, K: PAL.skyblue, c: PAL.lgray, m: PAL.gray, t: PAL.gray, d: PAL.dgray, n: PAL.ink }, ..._COYOTE_ROWS);
defSprite('hiena', { e: PAL.khaki, h: PAL.khaki, K: PAL.ink, c: PAL.khaki, m: PAL.dbrown, t: PAL.dbrown, d: PAL.dbrown, n: PAL.ink }, ..._COYOTE_ROWS);

// LAGARTO 16x8 — desierto
defSprite('lagarto', { g: PAL.olive, d: PAL.dolive, K: PAL.ink, t: PAL.olive },
  [
    '............gg..',
    '...........gggg',
    '.tt.ggggggggKgg.',
    'ttggggggggggg...',
    't.gggggggggg....',
    '..gg..gg..gg....',
    '.gg....gg..gg...',
    '................',
  ],
  [
    '............gg..',
    '...........gggg',
    'tt..ggggggggKgg.',
    '.ttgggggggggg...',
    't.gggggggggg....',
    '..gg...gg.gg....',
    '..gg..gg...gg...',
    '................',
  ]);

// GACELA 20x14 — sabana (cuernos curvos)
defSprite('gacela2', { a: PAL.dbrown, h: PAL.sand, K: PAL.ink, c: PAL.sand, w: PAL.cream, d: PAL.dsand, n: PAL.ink },
  [
    '.............a..a...',
    '............a..a....',
    '............aa.a....',
    '.............aaa....',
    '.............hhh....',
    '.............hKn....',
    '....ccccccccchh.....',
    '...ccccccccch.......',
    '..wccccccccc........',
    '..wcccccccc.........',
    '...cc.....cc........',
    '...cc.....cc........',
    '...cc.....cc........',
    '...dd.....dd........',
  ],
  [
    '.............a..a...',
    '............a..a....',
    '............aa.a....',
    '.............aaa....',
    '.............hhh....',
    '.............hKn....',
    '....ccccccccchh.....',
    '...ccccccccch.......',
    '..wccccccccc........',
    '..wcccccccc.........',
    '..cc.......cc.......',
    '..cc.......cc.......',
    '.cc.........cc......',
    '.dd.........dd......',
  ]);

// CEBRA 20x14 — sabana
defSprite('cebra', { w: PAL.white, k: PAL.black, K: PAL.ink, m: PAL.black, d: PAL.dgray, n: PAL.ink },
  [
    '...............mm...',
    '.............wwww...',
    '.............wKwn...',
    '..mkwkwkwkwkwwww....',
    '.mwkwkwkwkwkww......',
    '.wkwkwkwkwkwkw......',
    '.wwkwkwkwkwkww......',
    '.wkwkwkwkwkwkw......',
    '.wwwwwwwwwwwww......',
    '..ww......ww........',
    '..ww......ww........',
    '..ww......ww........',
    '..dd......dd........',
    '....................',
  ],
  [
    '...............mm...',
    '.............wwww...',
    '.............wKwn...',
    '..mkwkwkwkwkwwww....',
    '.mwkwkwkwkwkww......',
    '.wkwkwkwkwkwkw......',
    '.wwkwkwkwkwkww......',
    '.wkwkwkwkwkwkw......',
    '.wwwwwwwwwwwww......',
    '.ww........ww.......',
    'ww..........ww......',
    'ww..........ww......',
    'dd..........dd......',
    '....................',
  ]);

// LEÓN 22x14 — sabana
const _LION_ROWS = [
  [
    '.............mmmmm....',
    '............mmmmmmm...',
    '...........mmhhhhmm...',
    '...........mmhKhhnn...',
    '....ccccccmmmhhhmm....',
    '...cccccccmmmmmmm.....',
    '..cccccccccmmmm.......',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    'e.ccc.....ccc.........',
    'eeccc.....ccc.........',
    '.eccc.....ccc.........',
    '..ddd.....ddd.........',
  ],
  [
    '.............mmmmm....',
    '............mmmmmmm...',
    '...........mmhhhhmm...',
    '...........mmhKhhnn...',
    '....ccccccmmmhhhmm....',
    '...cccccccmmmmmmm.....',
    '..cccccccccmmmm.......',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    'e.cc.......cc.........',
    'eecc.......cc.........',
    '.ecc........cc........',
    '..dd........dd........',
  ],
];
defSprite('leon', { m: PAL.dsand, h: PAL.sand, K: PAL.ink, c: PAL.sand, e: PAL.dsand, d: PAL.dbrown, n: PAL.ink }, ..._LION_ROWS);

// PINGÜINO 10x12 — ártico
defSprite('pinguino', { b: PAL.black, w: PAL.white, o: PAL.orange, K: PAL.white },
  [
    '...bbbb...',
    '..bbbbbb..',
    '..bKbbbb..',
    '..bbbboo..',
    '..bwwbb...',
    '.bbwwwbb..',
    '.bbwwwbb..',
    '.bbwwwbb..',
    '.bbwwwbb..',
    '..bwwbb...',
    '..oo.oo...',
    '..........',
  ],
  [
    '...bbbb...',
    '..bbbbbb..',
    '..bKbbbb..',
    '..bbbboo..',
    '..bwwbb...',
    '.bbwwwbb..',
    '.bbwwwbb..',
    '.bbwwwbb..',
    '.bbwwwbb..',
    '..bwwbb...',
    '.oo...oo..',
    '..........',
  ]);

// FOCA 18x9 — ártico
defSprite('foca', { g: PAL.lgray, d: PAL.gray, K: PAL.ink, w: PAL.white },
  [
    '..............gg..',
    '.............gggg.',
    '.............gKgg.',
    '.gg.....gggggggg..',
    'gggg..gggggggggg..',
    'ggggggggggggggg...',
    '.ggggggggggggg....',
    '..ggwwggggggg.....',
    '....dd...dd.......',
  ],
  [
    '..............gg..',
    '.............gggg.',
    '.gg..........gKgg.',
    'gggg....gggggggg..',
    '.ggg..gggggggggg..',
    'ggggggggggggggg...',
    '.ggggggggggggg....',
    '..ggwwggggggg.....',
    '....dd....dd......',
  ]);

// MAMUT 26x20 — boss ártico
defSprite('mamut', { c: PAL.brown, d: PAL.dbrown, K: PAL.red, t: PAL.cream, h: PAL.fur },
  [
    '...................hhh....',
    '..............hhhhhhhhh...',
    '.....hhhhhhhhhhhhhhhhhh...',
    '....hhhhhhhhhhhhhhhKhh....',
    '...hhhhhhhhhhhhhhhhhhh....',
    '..cccccccccccccchhhhhd....',
    '..ccccccccccccccchhhdd....',
    '..cccccccccccccccc.tdd....',
    '..cccccccccccccc.ttddd....',
    '..cccccccccccccc.t.ddd....',
    '..cccccccccccccctt..dd....',
    '..cccccccccccccc....dd....',
    '..cccccccccccccc....dd....',
    '..ccccc....ccccc..........',
    '..ccccc....ccccc..........',
    '..ccccc....ccccc..........',
    '..ccccc....ccccc..........',
    '..ddddd....ddddd..........',
    '..........................',
    '..........................',
  ],
  [
    '...................hhh....',
    '..............hhhhhhhhh...',
    '.....hhhhhhhhhhhhhhhhhh...',
    '....hhhhhhhhhhhhhhhKhh....',
    '...hhhhhhhhhhhhhhhhhhh....',
    '..cccccccccccccchhhhhd....',
    '..ccccccccccccccchhhdd....',
    '..cccccccccccccccc.tdd....',
    '..cccccccccccccc.ttddd....',
    '..cccccccccccccc.t.ddd....',
    '..cccccccccccccctt..dd....',
    '..cccccccccccccc....dd....',
    '..cccccccccccccc....dd....',
    '..cccc......cccc..........',
    '..cccc......cccc..........',
    '.cccc........cccc.........',
    '.cccc........cccc.........',
    '.dddd........dddd.........',
    '..........................',
    '..........................',
  ]);

// Bosses con paleta especial (se dibujan escalados x3)
defSprite('boss_oso', { e: PAL.dbrown, h: PAL.dbrown, K: PAL.red, c: PAL.dbrown, d: PAL.black, n: PAL.red }, ..._BEAR_ROWS);
defSprite('boss_jaguar', { e: PAL.gold, h: PAL.dgray, K: PAL.gold, c: PAL.dgray, o: PAL.black, d: PAL.black, n: PAL.gold }, ..._JAG_ROWS);
defSprite('boss_leon', { m: PAL.dbrown, h: PAL.dsand, K: PAL.red, c: PAL.dsand, e: PAL.dbrown, d: PAL.black, n: PAL.red }, ..._LION_ROWS);
// boss escorpión: reusar filas del escorpión con paleta roja
(function () {
  const rows = [
    [
      '.......ss.........',
      '......sss.........',
      '......dd..........',
      '......dd..........',
      '.....ddd......pp..',
      '....ddd.....ppp...',
      '..ccccccccccpp....',
      '.cccccccccccpp....',
      '.ccccccccccKc.....',
      '..cccccccccc......',
      '..d.d.d..d.d.d....',
      '..d.d.d..d.d.d....',
    ],
    [
      '.......ss.........',
      '......sss.........',
      '......dd..........',
      '......dd..........',
      '.....ddd......pp..',
      '....ddd.....ppp...',
      '..ccccccccccpp....',
      '.cccccccccccpp....',
      '.ccccccccccKc.....',
      '..cccccccccc......',
      '.d.d.d....d.d.d...',
      '.d.d.d....d.d.d...',
    ],
  ];
  defSprite('boss_escorpion', { c: PAL.blood, d: PAL.dbrown, K: PAL.yellow, s: PAL.gold, p: PAL.dbrown }, ...rows);
})();

// ============ ANIMALES DE LOS MUNDOS NUEVOS ============

// MURCIÉLAGO 12x8 — cueva y volcán (volador)
defSprite('murcielago', { b: PAL.dgray, w: PAL.gray, K: PAL.red },
  [
    'b..........b',
    'bb...bb...bb',
    'bbb.bbbb.bbb',
    '.bbbbKKbbbb.',
    '..bbbbbbbb..',
    '...b....b...',
    '............',
    '............',
  ],
  [
    '............',
    '.....bb.....',
    '.bb.bbbb.bb.',
    'bbbbbKKbbbbb',
    '.b..bbbb..b.',
    '....b..b....',
    '............',
    '............',
  ]);

// SALAMANDRA — lagarto con paleta de fuego (volcán)
defSprite('salamandra', { g: PAL.orange, d: PAL.red, K: PAL.yellow, t: PAL.orange },
  [
    '............gg..',
    '...........gggg',
    '.tt.ggggggggKgg.',
    'ttggggggggggg...',
    't.gggggggggg....',
    '..gg..gg..gg....',
    '.gg....gg..gg...',
    '................',
  ],
  [
    '............gg..',
    '...........gggg',
    'tt..ggggggggKgg.',
    '.ttgggggggggg...',
    't.gggggggggg....',
    '..gg...gg.gg....',
    '..gg..gg...gg...',
    '................',
  ]);

// GÓLEM DE MAGMA 15x13 — volcán (camina, duele al contacto)
defSprite('golem', { r: PAL.dgray, d: PAL.black, l: PAL.orange, y: PAL.yellow, K: PAL.yellow },
  [
    '....rrrrrr.....',
    '...rrrrrrrr....',
    '...rrKrrKrr....',
    '...rrrrlrrr....',
    '.rrrrrlyrrrrr..',
    'rrrlrrrrrrlrrr.',
    'rrrrrylrrrrrrr.',
    'rrlrrrrrrylrrr.',
    '.rrrrrlrrrrrr..',
    '..rrrrrrrrrr...',
    '..rrr....rrr...',
    '..rrr....rrr...',
    '..ddd....ddd...',
  ],
  [
    '....rrrrrr.....',
    '...rrrrrrrr....',
    '...rrKrrKrr....',
    '...rrrrlrrr....',
    '.rrrrrlyrrrrr..',
    'rrrlrrrrrrlrrr.',
    'rrrrrylrrrrrrr.',
    'rrlrrrrrrylrrr.',
    '.rrrrrlrrrrrr..',
    '..rrrrrrrrrr...',
    '..rr......rr...',
    '.rrr......rrr..',
    '.ddd......ddd..',
  ]);

// RANA 12x10 — pantano (salta)
defSprite('rana', { g: PAL.green, d: PAL.dgreen, K: PAL.ink, w: PAL.lime },
  [
    '.gg....gg...',
    '.gK....Kg...',
    '.gggggggg...',
    'gggggggggg..',
    'ggwwwwwwgg..',
    'ggwwwwwwgg..',
    '.gggggggg...',
    '.gg....gg...',
    'ggg....ggg..',
    '............',
  ],
  [
    '............',
    '.gg....gg...',
    '.gK....Kg...',
    '.gggggggg...',
    'gggggggggg..',
    'ggwwwwwwgg..',
    'gggggggggg..',
    'g.gg..gg.g..',
    'g.g....g.g..',
    '............',
  ]);

// LIBÉLULA 13x8 — pantano (voladora)
defSprite('libelula', { b: PAL.dgreen, w: PAL.cyan, K: PAL.ink, t: PAL.blue },
  [
    '..ww..ww.....',
    '..www.www....',
    'ttttbbbbbKK..',
    '..www.www....',
    '..ww..ww.....',
    '.............',
    '.............',
    '.............',
  ],
  [
    '.............',
    '..ww..ww.....',
    'ttttbbbbbKK..',
    '..ww..ww.....',
    '.............',
    '.............',
    '.............',
    '.............',
  ]);

// TORTUGA 15x10 — pantano (y marina en costa)
const _TURTLE_ROWS = [
  [
    '...............',
    '....ccccccc....',
    '...ccdccdccc...',
    '..ccccdccdccc..',
    '..ccdccccdccc..',
    '.cccccccccccc..',
    '............gg.',
    '.ggggggggggggK.',
    '..gg..gg..gg...',
    '..gg..gg..gg...',
  ],
  [
    '...............',
    '....ccccccc....',
    '...ccdccdccc...',
    '..ccccdccdccc..',
    '..ccdccccdccc..',
    '.cccccccccccc..',
    '............gg.',
    '.ggggggggggggK.',
    '.gg..gg..gg....',
    '.gg..gg..gg....',
  ],
];
defSprite('tortuga', { c: PAL.dgreen, d: PAL.olive, g: PAL.olive, K: PAL.ink }, ..._TURTLE_ROWS);
defSprite('tortuga_marina', { c: PAL.blue, d: PAL.dice, g: PAL.ice, K: PAL.ink }, ..._TURTLE_ROWS);

// CAIMÁN 26x9 — pantano (peligroso)
const _CAIMAN_ROWS = [
  [
    '..........................',
    '.mm...mm...mm.............',
    '.gggggggggggggggg.KK......',
    'gggggggggggggggggggggggggg',
    'ggggggggggggggggggtwtwtwt.',
    '.gggggggggggggggggggggggg.',
    '..gg....gg....gg..........',
    '..gg....gg....gg..........',
    '..dd....dd....dd..........',
  ],
  [
    '..........................',
    '.mm...mm...mm.............',
    '.gggggggggggggggg.KK......',
    'gggggggggggggggggggg......',
    'ggggggggggggggggggggggggg.',
    '.ggggggggggggggggggtwtwtw.',
    '..gg....gg....gg..........',
    '.gg....gg....gg...........',
    '.dd....dd....dd...........',
  ],
];
defSprite('caiman', { g: PAL.dgreen, m: PAL.olive, d: PAL.dolive, K: PAL.yellow, t: PAL.white, w: PAL.white }, ..._CAIMAN_ROWS);

// CABRA MONTÉS 18x14 — montaña
defSprite('cabra', { a: PAL.dbrown, h: PAL.cream, K: PAL.ink, c: PAL.cream, w: PAL.white, d: PAL.gray, n: PAL.ink },
  [
    '...........aa.aa..',
    '..........a..aa...',
    '..........aaaa....',
    '...........hhh....',
    '...........hKn....',
    '....ccccccchhh....',
    '...cccccccchh.....',
    '..wcccccccch......',
    '..wccccccccw......',
    '...cc.....cc......',
    '...cc.....cc......',
    '...cc.....cc......',
    '...dd.....dd......',
    '..................',
  ],
  [
    '...........aa.aa..',
    '..........a..aa...',
    '..........aaaa....',
    '...........hhh....',
    '...........hKn....',
    '....ccccccchhh....',
    '...cccccccchh.....',
    '..wcccccccch......',
    '..wccccccccw......',
    '..cc.......cc.....',
    '..cc.......cc.....',
    '.cc.........cc....',
    '.dd.........dd....',
    '..................',
  ]);

// ÁGUILA 16x12 — montaña (se lanza en picada)
const _EAGLE_ROWS = [
  [
    '.....bbb........',
    '....bbbbb.......',
    '....bbbbb..hh...',
    '.bbbbbbbbbbhhK..',
    'bbbbbbbbbbbhoo..',
    'bbbbbbbbbbb.....',
    '.bbbbbbbbb......',
    '..bbbbbbb.......',
    '...bbbbb........',
    '....oo..........',
    '................',
    '................',
  ],
  [
    '................',
    '................',
    '...........hh...',
    '.bbbbbbbbbbhhK..',
    'bbbbbbbbbbbhoo..',
    'wbbbbbbbbbb.....',
    '.wwbbbbbbbb.....',
    '..wwbbbbbb......',
    '...wwbbbb.......',
    '....wwbb........',
    '.....oo.........',
    '................',
  ],
];
defSprite('aguila', { b: PAL.brown, w: PAL.dbrown, h: PAL.white, o: PAL.yellow, K: PAL.ink }, ..._EAGLE_ROWS);

// PUMA — jaguar sin manchas (montaña)
defSprite('puma', { e: PAL.tan, h: PAL.tan, K: PAL.ink, c: PAL.tan, o: PAL.tan, d: PAL.brown, n: PAL.ink }, ..._JAG_ROWS);

// MARMOTA — conejo con paleta café (montaña)
defSprite('marmota', { e: PAL.fur, h: PAL.fur, K: PAL.ink, c: PAL.fur, w: PAL.tan, d: PAL.dbrown },
  [
    '..e...e.....',
    '..e...e.....',
    '..hhhhh.....',
    '..hhKhh.....',
    'cchhhhh.....',
    'ccccccc.....',
    'wcccccc.....',
    'wcccccc.....',
    '.cc..cc.....',
    '.dd..dd.....',
  ],
  [
    '..e...e.....',
    '..e...e.....',
    '..hhhhh.....',
    '..hhKhh.....',
    'cchhhhh.....',
    'ccccccc.....',
    'wcccccc.....',
    'wcccccc.....',
    'cc....cc....',
    'dd....dd....',
  ]);

// ARAÑA 14x10 — cueva
const _SPIDER_ROWS = [
  [
    '..l...ll...l..',
    '.l.l.l..l.l.l.',
    '.l..bbbbbb..l.',
    'l...bKbbKb..l.',
    'l...bbbbbb...l',
    '.l..bbbbbb..l.',
    '.l.l.bbbb.l.l.',
    'l...l....l...l',
    '..............',
    '..............',
  ],
  [
    '..............',
    '.ll...ll...ll.',
    '.l.l.l..l.l.l.',
    '.l..bbbbbb..l.',
    'l...bKbbKb..l.',
    'l...bbbbbb...l',
    '.l..bbbbbb..l.',
    '.ll..bbbb..ll.',
    '..............',
    '..............',
  ],
];
defSprite('arana', { l: PAL.dgray, b: PAL.dgray, K: PAL.red }, ..._SPIDER_ROWS);

// TOPO 12x8 — cueva
defSprite('topo', { g: PAL.gray, d: PAL.dgray, p: PAL.pink, K: PAL.ink },
  [
    '............',
    '...gggg.....',
    '..gggggggg..',
    '.gggggggggpp',
    '.ggKggggggpp',
    '.gggggggggg.',
    '..pp.pp.pp..',
    '............',
  ],
  [
    '............',
    '...gggg.....',
    '..gggggggg..',
    '.gggggggggpp',
    '.ggKggggggpp',
    '.gggggggggg.',
    '.pp.pp..pp..',
    '............',
  ]);

// LUCIÉRNAGA 8x7 — cueva (brilla)
defSprite('luciernaga', { b: PAL.dgray, y: PAL.yellow, w: PAL.cream },
  [
    '..w..w..',
    '..bbbb..',
    '.bbbbbb.',
    '..yyyy..',
    '..wyyw..',
    '...yy...',
    '........',
  ],
  [
    '.w....w.',
    '..bbbb..',
    '.bbbbbb.',
    '..yyyy..',
    '..wyyw..',
    '...yy...',
    '........',
  ]);

// CANGREJO 16x11 — costa
const _CRAB_ROWS = [
  [
    '.pp........pp...',
    'ppp........ppp..',
    'p.p........p.p..',
    '...rrrrrrrr.....',
    '..rrKrrrrKrr....',
    '..rrrrrrrrrr....',
    '..rrrrrrrrrr....',
    '...rrrrrrrr.....',
    '..r.r.rr.r.r....',
    '..r.r....r.r....',
    '................',
  ],
  [
    '.pp........pp...',
    '.ppp......ppp...',
    '.p.p......p.p...',
    '...rrrrrrrr.....',
    '..rrKrrrrKrr....',
    '..rrrrrrrrrr....',
    '..rrrrrrrrrr....',
    '...rrrrrrrr.....',
    '.r.r..rr..r.r...',
    '.r.r......r.r...',
    '................',
  ],
];
defSprite('cangrejo', { p: PAL.orange, r: PAL.red, K: PAL.ink }, ..._CRAB_ROWS);

// GAVIOTA 14x10 — costa (voladora)
defSprite('gaviota', { w: PAL.white, g: PAL.lgray, o: PAL.orange, K: PAL.ink },
  [
    '....ggg.......',
    '...ggggg......',
    '...ggggg.ww...',
    '.gggggggwwwK..',
    'ggggggggwwoo..',
    'gggggggggw....',
    '.ggggggggw....',
    '..gggggg......',
    '...oo.........',
    '..............',
  ],
  [
    '..............',
    '..............',
    '.........ww...',
    '.gggggggwwwK..',
    'ggggggggwwoo..',
    'wggggggggw....',
    '.wwgggggw.....',
    '..wwggg.......',
    '....oo........',
    '..............',
  ]);

// DRAGÓN DE MAGMA 28x20 — boss volcán (volador)
const _DRAGON_ROWS = [
  [
    '.....ww......ww.............',
    '....wwww....wwww............',
    '...wwwwww..wwwwww...aa..aa..',
    '..wwwwwwwwwwwwwwww...a..a...',
    '..wwwwwwwwwwwwwwww...aaaa...',
    '.rrrrrrrrrrrrrrrrrr.hhhh....',
    'rrrrrrrrrrrrrrrrrrrrhKhh....',
    'trrrrrrrrrrrrrrrrrrrhhhy....',
    '.trrrrrrrrrrrrrrrrrrhhyy....',
    '..trrrrryyrrrrrrrrrrhh......',
    '...rrrryyyyrrrrrrrrr........',
    '...rrrrryyrrrrrrrrr.........',
    '....rrrrrrrrrrrrrr..........',
    '.....rrr.....rrr............',
    '.....rrr.....rrr............',
    '.....ddd.....ddd............',
    '............................',
    '............................',
    '............................',
    '............................',
  ],
  [
    '............................',
    '............................',
    '....................aa..aa..',
    '..ww........ww.......a..a...',
    '..wwww....wwww.......aaaa...',
    '.rwwwwwwwwwwwwwrrr..hhhh....',
    'rrwwwwwwwwwwwwwrrrrrhKhh....',
    'trrrrrrrrrrrrrrrrrrrhhhy....',
    '.trrrrrrrrrrrrrrrrrrhhyy....',
    '..trrrrryyrrrrrrrrrrhh......',
    '...rrrryyyyrrrrrrrrr........',
    '...rrrrryyrrrrrrrrr.........',
    '....rrrrrrrrrrrrrr..........',
    '.....rrr.....rrr............',
    '.....rrr.....rrr............',
    '.....ddd.....ddd............',
    '............................',
    '............................',
    '............................',
    '............................',
  ],
];
defSprite('dragon', { w: PAL.dbrown, r: PAL.red, y: PAL.yellow, h: PAL.red, K: PAL.yellow, a: PAL.cream, t: PAL.orange, d: PAL.blood }, ..._DRAGON_ROWS);

// Bosses nuevos: paleta intensificada, se dibujan escalados
defSprite('boss_caiman', { g: PAL.dolive, m: PAL.black, d: PAL.black, K: PAL.red, t: PAL.white, w: PAL.white }, ..._CAIMAN_ROWS);
defSprite('boss_aguila', { b: PAL.dsand, w: PAL.dbrown, h: PAL.white, o: PAL.gold, K: PAL.red }, ..._EAGLE_ROWS);
defSprite('boss_dragon', { w: PAL.black, r: PAL.blood, y: PAL.orange, h: PAL.blood, K: PAL.yellow, a: PAL.cream, t: PAL.red, d: PAL.black }, ..._DRAGON_ROWS);
defSprite('boss_arana', { l: PAL.black, b: PAL.black, K: PAL.red }, ..._SPIDER_ROWS);
defSprite('boss_cangrejo', { p: PAL.blood, r: PAL.blood, K: PAL.yellow }, ..._CRAB_ROWS);

// Proyectiles nuevos
defSprite('fireball', { r: PAL.red, o: PAL.orange, y: PAL.yellow },
  ['..oo...', '.oyyor.', 'oyyyyor', 'oyyyyor', '.oyyo..', '..oo...']);
defSprite('web', { w: PAL.white, g: PAL.lgray },
  ['w..w..w', '.wgwgw.', 'w.gwg.w', '.wgwgw.', 'w..w..w']);
defSprite('burbuja', { c: PAL.cyan, w: PAL.white },
  ['.cccc.', 'cwcccc', 'cccccc', 'cccccc', '.cccc.']);
defSprite('pluma', { w: PAL.white, g: PAL.lgray },
  ['....ww..', '..wwwwg.', 'wwwwwwgg', '..wwwwg.']);

// ============ OBJETOS ============

// Moneda 8x8 (3 frames de giro)
defSprite('coin', { g: PAL.gold, d: PAL.dgold, w: PAL.cream },
  ['..gggg..', '.gggggg.', 'ggwwggdg', 'ggwggggd', 'ggwggggd', 'ggggggdd', '.gggggg.', '..gggg..'],
  ['...gg...', '..gggg..', '..gwgd..', '..gwgd..', '..gwgd..', '..gggd..', '..gggg..', '...gg...'],
  ['....g...', '...gg...', '...gd...', '...gd...', '...gd...', '...gd...', '...gg...', '....g...']);

// Gema 8x8 (vale 5)
defSprite('gem', { r: PAL.red, p: PAL.pink, d: PAL.blood },
  ['..rrrr..', '.rpprrd.', 'rpprrrdd', 'rprrrrdd', '.rrrrdd.', '..rrdd..', '...rd...', '........']);

// Corazón 8x7
defSprite('heart', { r: PAL.red, p: PAL.pink },
  ['.rr.rr..', 'rprrrrr.', 'rrrrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '...r....']);
defSprite('heart_empty', { r: PAL.dgray, p: PAL.gray },
  ['.rr.rr..', 'rprrrrr.', 'rrrrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '...r....']);

// Carne 9x8
defSprite('meat', { m: PAL.red, d: PAL.blood, b: PAL.cream, h: PAL.pink },
  ['..mmmm...', '.mmhmmm..', '.mmmmmm..', '.mmmmmb..', '..mmmbbb.', '...mbb.b.', '....b....', '.........']);

// Piel 9x8
defSprite('pelt', { p: PAL.fur, d: PAL.brown, c: PAL.cream },
  ['p.ppppp.p', 'ppcccccpp', '.pcccccp.', '.pcccccp.', '.pcccccp.', 'ppcccccpp', 'p.ppppp.p', '.........']);

// Resorte 12x8 (2 frames)
defSprite('spring', { m: PAL.gray, d: PAL.dgray, r: PAL.red },
  ['..rrrrrrrr..', '..rrrrrrrr..', '...m.mm.m...', '...mm..mm...', '...m.mm.m...', '...mm..mm...', '..dddddddd..', '..dddddddd..'],
  ['............', '............', '............', '..rrrrrrrr..', '..rrrrrrrr..', '...mmmmmm...', '..dddddddd..', '..dddddddd..']);

// Bandera checkpoint 12x20 (2 frames: gris / verde activada)
defSprite('flag_off', { p: PAL.gray, f: PAL.lgray, b: PAL.dgray },
  [
    'pp..........', 'pp..........', 'ppffff......', 'ppffffff....', 'ppffffff....', 'ppffff......',
    'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........',
    'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........',
    'bbbb........', 'bbbb........',
  ]);
defSprite('flag_on', { p: PAL.gray, f: PAL.green, b: PAL.dgray },
  [
    'pp..........', 'pp..........', 'ppffff......', 'ppffffff....', 'ppffffff....', 'ppffff......',
    'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........',
    'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........',
    'bbbb........', 'bbbb........',
  ]);

// Coco 6x6 (proyectil del mono)
defSprite('coco', { c: PAL.dbrown, d: PAL.black },
  ['.cccc.', 'cccccc', 'ccdccc', 'cccccc', 'cccccc', '.cccc.']);

// Aguijón 8x4 (proyectil del escorpión boss)
defSprite('stinger', { s: PAL.gold, d: PAL.red },
  ['....ss..', '..ssssd.', 'ssssssdd', '..ssssd.']);

// Carámbano 6x10 (ártico / boss mamut)
defSprite('icicle', { i: PAL.ice, w: PAL.snow, d: PAL.dice },
  ['iwiiid', 'iwiiid', '.wiid.', '.wiid.', '.wid..', '.wid..', '..wd..', '..wd..', '..w...', '..w...']);

// Roca 8x7 (boss oso)
defSprite('rock', { r: PAL.gray, d: PAL.dgray, l: PAL.lgray },
  ['..rrrr..', '.rlrrrd.', 'rrlrrrdd', 'rrrrrrdd', 'rrrrrdd.', '.rrrdd..', '..ddd...']);

// Onda de rugido 12x12 (boss león)
defSprite('roarwave', { o: PAL.orange, y: PAL.yellow },
  ['....oo......', '..oo..o.....', '.o.....o....', 'o..yy...o...', 'o.y..y..o...', 'o.y...y.o...',
   'o.y...y.o...', 'o.y..y..o...', 'o..yy...o...', '.o.....o....', '..oo..o.....', '....oo......']);

// ============ TILES por bioma (16x16 pre-renderizados) ============
const TILES = {}; // TILES[bioma] = {top, fill, plat}

function _makeTile(fn) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  fn(c.getContext('2d'));
  return c;
}

function _dither(g, x, y, w, h, colA, colB, rnd, prob) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    g.fillStyle = rnd() < prob ? colB : colA;
    g.fillRect(i, j, 1, 1);
  }
}

function buildTiles() {
  const defs = {
    bosque:  { grass: PAL.green,  grass2: PAL.lime,  dirt: PAL.brown, dirt2: PAL.dbrown, plat: PAL.brown, plat2: PAL.dbrown },
    jungla:  { grass: PAL.dgreen, grass2: PAL.green, dirt: PAL.dbrown, dirt2: PAL.black, plat: PAL.olive, plat2: PAL.dolive },
    desierto:{ grass: PAL.sand,   grass2: PAL.khaki, dirt: PAL.dsand, dirt2: PAL.brown, plat: PAL.dsand, plat2: PAL.brown },
    sabana:  { grass: PAL.khaki,  grass2: PAL.sand,  dirt: PAL.tan,  dirt2: PAL.brown, plat: PAL.tan,  plat2: PAL.brown },
    artico:  { grass: PAL.snow,   grass2: PAL.white, dirt: PAL.ice,  dirt2: PAL.dice,  plat: PAL.ice,  plat2: PAL.dice },
    volcan:  { grass: PAL.dgray,  grass2: PAL.red,   dirt: PAL.black, dirt2: PAL.dgray, plat: PAL.dgray, plat2: PAL.black },
    pantano: { grass: PAL.dgreen, grass2: PAL.olive, dirt: PAL.dbrown, dirt2: PAL.dolive, plat: PAL.dolive, plat2: PAL.dbrown },
    montana: { grass: PAL.lime,   grass2: PAL.green, dirt: PAL.gray, dirt2: PAL.dgray, plat: PAL.gray, plat2: PAL.dgray },
    cueva:   { grass: PAL.purple, grass2: PAL.dgray, dirt: PAL.dgray, dirt2: PAL.black, plat: PAL.purple, plat2: PAL.dgray },
    costa:   { grass: PAL.sand,   grass2: PAL.cream, dirt: PAL.dsand, dirt2: PAL.tan,  plat: PAL.brown, plat2: PAL.dbrown },
    ciudad:  { grass: PAL.lgray,  grass2: PAL.gray,  dirt: PAL.dgray, dirt2: PAL.black, plat: PAL.gray, plat2: PAL.dgray },
  };
  for (const [name, d] of Object.entries(defs)) {
    const rnd = mulberry32(name.length * 999 + 5);
    TILES[name] = {
      top: _makeTile(g => {
        _dither(g, 0, 0, 16, 4, d.grass, d.grass2, rnd, 0.35);
        _dither(g, 0, 4, 16, 12, d.dirt, d.dirt2, rnd, 0.15);
        g.fillStyle = d.grass2;
        for (let i = 0; i < 4; i++) g.fillRect(Math.floor(rnd() * 15), 4, 1, 1);
      }),
      fill: _makeTile(g => _dither(g, 0, 0, 16, 16, d.dirt, d.dirt2, rnd, 0.12)),
      plat: _makeTile(g => {
        _dither(g, 0, 0, 16, 6, d.plat, d.plat2, rnd, 0.2);
        g.fillStyle = d.plat2;
        g.fillRect(0, 5, 16, 1); g.fillRect(5, 0, 1, 6); g.fillRect(11, 0, 1, 6);
        g.clearRect(0, 6, 16, 10);
      }),
    };
  }
}

// ============ DECORACIONES por bioma (pre-renderizadas) ============
const DECOS = {}; // DECOS[bioma] = [canvas,...]

function _decoCanvas(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  fn(g);
  return c;
}

function _px(g, color) { g.fillStyle = color; return (x, y, w = 1, h = 1) => g.fillRect(x, y, w, h); }

function buildDecos() {
  DECOS.bosque = [
    // pino grande
    _decoCanvas(24, 40, g => {
      const t = _px(g, PAL.dbrown); t(10, 30, 4, 10);
      g.fillStyle = PAL.dgreen;
      for (let i = 0; i < 5; i++) g.fillRect(2 + i * 2, 6 + i * 6, 20 - i * 4, 6);
      g.fillStyle = PAL.green;
      for (let i = 0; i < 5; i++) g.fillRect(3 + i * 2, 6 + i * 6, 8 - i, 2);
      g.fillStyle = PAL.dgreen; g.fillRect(10, 0, 4, 8);
    }),
    // arbusto
    _decoCanvas(16, 10, g => {
      g.fillStyle = PAL.dgreen; g.fillRect(1, 3, 14, 7);
      g.fillStyle = PAL.green; g.fillRect(3, 1, 10, 6); g.fillRect(0, 5, 16, 3);
      g.fillStyle = PAL.lime; g.fillRect(4, 2, 2, 2); g.fillRect(9, 3, 2, 1);
    }),
    // hongo
    _decoCanvas(8, 8, g => {
      g.fillStyle = PAL.cream; g.fillRect(3, 4, 2, 4);
      g.fillStyle = PAL.red; g.fillRect(1, 1, 6, 3); g.fillRect(2, 0, 4, 1);
      g.fillStyle = PAL.white; g.fillRect(2, 1, 1, 1); g.fillRect(5, 2, 1, 1);
    }),
  ];
  DECOS.jungla = [
    // árbol de jungla con lianas
    _decoCanvas(28, 44, g => {
      g.fillStyle = PAL.brown; g.fillRect(12, 24, 4, 20);
      g.fillStyle = PAL.dgreen; g.fillRect(0, 4, 28, 14);
      g.fillStyle = PAL.green; g.fillRect(2, 0, 22, 10); g.fillRect(4, 12, 8, 4);
      g.fillStyle = PAL.lime; g.fillRect(4, 2, 4, 2); g.fillRect(16, 4, 5, 2);
      g.fillStyle = PAL.dgreen; g.fillRect(4, 18, 2, 14); g.fillRect(22, 18, 2, 10);
    }),
    // helecho grande
    _decoCanvas(18, 14, g => {
      g.fillStyle = PAL.green;
      g.fillRect(8, 6, 2, 8);
      for (let i = 0; i < 4; i++) { g.fillRect(2 + i, 8 - i * 2, 6, 2); g.fillRect(10 - i, 8 - i * 2, 6, 2); }
      g.fillStyle = PAL.lime; g.fillRect(8, 0, 2, 4);
    }),
    // flor tropical
    _decoCanvas(8, 10, g => {
      g.fillStyle = PAL.green; g.fillRect(3, 5, 2, 5);
      g.fillStyle = PAL.red; g.fillRect(1, 1, 6, 4);
      g.fillStyle = PAL.pink; g.fillRect(2, 0, 4, 2);
      g.fillStyle = PAL.yellow; g.fillRect(3, 2, 2, 2);
    }),
  ];
  DECOS.desierto = [
    // saguaro
    _decoCanvas(20, 32, g => {
      g.fillStyle = PAL.green; g.fillRect(8, 4, 5, 28);
      g.fillRect(2, 10, 4, 3); g.fillRect(2, 6, 3, 7);
      g.fillRect(15, 14, 4, 3); g.fillRect(16, 9, 3, 8);
      g.fillStyle = PAL.dgreen; g.fillRect(9, 4, 1, 28); g.fillRect(12, 4, 1, 28);
      g.fillStyle = PAL.lime; g.fillRect(10, 4, 1, 3);
    }),
    // cráneo de vaca
    _decoCanvas(12, 8, g => {
      g.fillStyle = PAL.cream; g.fillRect(3, 1, 6, 5); g.fillRect(1, 0, 3, 3); g.fillRect(8, 0, 3, 3);
      g.fillStyle = PAL.black; g.fillRect(4, 3, 1, 1); g.fillRect(7, 3, 1, 1);
      g.fillStyle = PAL.khaki; g.fillRect(4, 6, 4, 2);
    }),
    // roca del desierto
    _decoCanvas(14, 8, g => {
      g.fillStyle = PAL.dsand; g.fillRect(1, 2, 12, 6);
      g.fillStyle = PAL.sand; g.fillRect(3, 0, 6, 4);
      g.fillStyle = PAL.brown; g.fillRect(9, 4, 4, 4);
    }),
  ];
  DECOS.sabana = [
    // acacia
    _decoCanvas(32, 30, g => {
      g.fillStyle = PAL.dbrown; g.fillRect(14, 14, 3, 16); g.fillRect(10, 10, 3, 6); g.fillRect(19, 11, 3, 5);
      g.fillStyle = PAL.dolive; g.fillRect(0, 4, 32, 7);
      g.fillStyle = PAL.olive; g.fillRect(2, 2, 28, 5);
      g.fillStyle = PAL.khaki; g.fillRect(6, 2, 4, 2); g.fillRect(20, 3, 6, 2);
    }),
    // pasto alto
    _decoCanvas(14, 10, g => {
      g.fillStyle = PAL.khaki;
      for (let i = 0; i < 7; i++) g.fillRect(i * 2, 2 + (i % 3), 1, 8 - (i % 3));
      g.fillStyle = PAL.sand;
      for (let i = 0; i < 4; i++) g.fillRect(1 + i * 3, i % 2, 1, 9);
    }),
    // termitero
    _decoCanvas(12, 14, g => {
      g.fillStyle = PAL.tan; g.fillRect(4, 0, 4, 14); g.fillRect(2, 4, 8, 10); g.fillRect(1, 9, 10, 5);
      g.fillStyle = PAL.brown; g.fillRect(5, 2, 1, 12); g.fillRect(8, 6, 1, 8);
    }),
  ];
  DECOS.artico = [
    // pino nevado
    _decoCanvas(24, 36, g => {
      g.fillStyle = PAL.dbrown; g.fillRect(10, 28, 4, 8);
      g.fillStyle = PAL.dgreen;
      for (let i = 0; i < 4; i++) g.fillRect(2 + i * 2, 6 + i * 6, 20 - i * 4, 6);
      g.fillStyle = PAL.snow;
      for (let i = 0; i < 4; i++) g.fillRect(2 + i * 2, 6 + i * 6, 20 - i * 4, 2);
      g.fillRect(10, 0, 4, 7);
    }),
    // cristal de hielo
    _decoCanvas(12, 14, g => {
      g.fillStyle = PAL.ice; g.fillRect(4, 2, 4, 12); g.fillRect(1, 6, 3, 8); g.fillRect(8, 5, 3, 9);
      g.fillStyle = PAL.cyan; g.fillRect(5, 2, 1, 12); g.fillRect(2, 6, 1, 8);
      g.fillStyle = PAL.white; g.fillRect(4, 2, 1, 3);
    }),
    // muñeco de nieve
    _decoCanvas(10, 12, g => {
      g.fillStyle = PAL.snow; g.fillRect(2, 6, 6, 6); g.fillRect(3, 1, 4, 5);
      g.fillStyle = PAL.black; g.fillRect(4, 2, 1, 1); g.fillRect(6, 2, 1, 1);
      g.fillStyle = PAL.orange; g.fillRect(5, 3, 3, 1);
      g.fillStyle = PAL.dgray; g.fillRect(3, 0, 4, 1);
    }),
  ];
  DECOS.volcan = [
    // géiser de lava
    _decoCanvas(14, 22, g => {
      g.fillStyle = PAL.dgray; g.fillRect(2, 12, 10, 10); g.fillRect(4, 8, 6, 6);
      g.fillStyle = PAL.orange; g.fillRect(5, 2, 4, 10); g.fillRect(6, 0, 2, 4);
      g.fillStyle = PAL.yellow; g.fillRect(6, 4, 2, 6);
      g.fillStyle = PAL.red; g.fillRect(4, 10, 6, 2);
    }),
    // roca volcánica con grietas
    _decoCanvas(16, 10, g => {
      g.fillStyle = PAL.black; g.fillRect(1, 2, 14, 8);
      g.fillStyle = PAL.dgray; g.fillRect(3, 0, 8, 5);
      g.fillStyle = PAL.orange; g.fillRect(5, 4, 5, 1); g.fillRect(8, 5, 1, 4);
    }),
    // huesos chamuscados
    _decoCanvas(12, 6, g => {
      g.fillStyle = PAL.lgray; g.fillRect(1, 4, 10, 2); g.fillRect(0, 3, 2, 4); g.fillRect(10, 3, 2, 4);
      g.fillStyle = PAL.gray; g.fillRect(4, 2, 2, 4);
    }),
  ];
  DECOS.pantano = [
    // sauce llorón
    _decoCanvas(28, 36, g => {
      g.fillStyle = PAL.dbrown; g.fillRect(12, 18, 4, 18);
      g.fillStyle = PAL.dolive; g.fillRect(2, 2, 24, 10);
      g.fillStyle = PAL.olive; g.fillRect(4, 0, 20, 7);
      g.fillStyle = PAL.dolive;
      for (let i = 0; i < 6; i++) g.fillRect(2 + i * 4, 10, 2, 12 + (i % 3) * 4);
    }),
    // juncos (totora)
    _decoCanvas(14, 14, g => {
      g.fillStyle = PAL.green;
      for (let i = 0; i < 5; i++) g.fillRect(i * 3, 4 + (i % 2) * 2, 1, 10);
      g.fillStyle = PAL.dbrown;
      g.fillRect(0, 2, 2, 4); g.fillRect(6, 0, 2, 4); g.fillRect(12, 3, 2, 4);
    }),
    // seta del pantano
    _decoCanvas(10, 9, g => {
      g.fillStyle = PAL.cream; g.fillRect(4, 5, 2, 4);
      g.fillStyle = PAL.purple; g.fillRect(1, 1, 8, 4); g.fillRect(2, 0, 6, 1);
      g.fillStyle = PAL.pink; g.fillRect(3, 1, 2, 2); g.fillRect(6, 2, 2, 1);
    }),
  ];
  DECOS.montana = [
    // pino alpino
    _decoCanvas(20, 34, g => {
      g.fillStyle = PAL.dbrown; g.fillRect(8, 26, 4, 8);
      g.fillStyle = PAL.dgreen;
      for (let i = 0; i < 4; i++) g.fillRect(2 + i * 2, 5 + i * 6, 16 - i * 4, 6);
      g.fillStyle = PAL.green;
      for (let i = 0; i < 4; i++) g.fillRect(3 + i * 2, 5 + i * 6, 6 - i, 2);
      g.fillStyle = PAL.dgreen; g.fillRect(8, 0, 4, 6);
    }),
    // roca de granito
    _decoCanvas(16, 10, g => {
      g.fillStyle = PAL.gray; g.fillRect(1, 3, 14, 7);
      g.fillStyle = PAL.lgray; g.fillRect(3, 0, 7, 5);
      g.fillStyle = PAL.dgray; g.fillRect(10, 5, 5, 5);
    }),
    // flores alpinas
    _decoCanvas(12, 7, g => {
      g.fillStyle = PAL.green; g.fillRect(2, 4, 1, 3); g.fillRect(7, 3, 1, 4);
      g.fillStyle = PAL.white; g.fillRect(1, 2, 3, 2); g.fillRect(6, 1, 3, 2);
      g.fillStyle = PAL.yellow; g.fillRect(2, 2, 1, 1); g.fillRect(7, 1, 1, 1);
    }),
  ];
  DECOS.cueva = [
    // cristal grande
    _decoCanvas(16, 20, g => {
      g.fillStyle = PAL.cyan; g.fillRect(6, 2, 4, 18); g.fillRect(2, 8, 3, 12); g.fillRect(11, 6, 3, 14);
      g.fillStyle = PAL.white; g.fillRect(7, 2, 1, 18); g.fillRect(3, 8, 1, 12);
      g.fillStyle = PAL.blue; g.fillRect(9, 4, 1, 16); g.fillRect(13, 8, 1, 12);
    }),
    // estalagmita
    _decoCanvas(12, 16, g => {
      g.fillStyle = PAL.dgray; g.fillRect(4, 2, 4, 14); g.fillRect(2, 8, 8, 8); g.fillRect(1, 13, 10, 3);
      g.fillStyle = PAL.gray; g.fillRect(5, 2, 1, 14);
    }),
    // seta luminosa
    _decoCanvas(10, 9, g => {
      g.fillStyle = PAL.cream; g.fillRect(4, 5, 2, 4);
      g.fillStyle = PAL.skyblue; g.fillRect(1, 1, 8, 4); g.fillRect(2, 0, 6, 1);
      g.fillStyle = PAL.cyan; g.fillRect(3, 1, 2, 2); g.fillRect(6, 2, 2, 1);
    }),
  ];
  DECOS.costa = [
    // palmera
    _decoCanvas(26, 34, g => {
      g.fillStyle = PAL.brown; g.fillRect(12, 8, 3, 26); g.fillRect(11, 16, 2, 10);
      g.fillStyle = PAL.green;
      g.fillRect(2, 4, 10, 3); g.fillRect(15, 4, 10, 3);
      g.fillRect(5, 1, 8, 3); g.fillRect(14, 1, 8, 3);
      g.fillRect(0, 7, 8, 2); g.fillRect(19, 7, 7, 2);
      g.fillStyle = PAL.dgreen; g.fillRect(10, 6, 7, 3);
      g.fillStyle = PAL.dbrown; g.fillRect(11, 9, 2, 2); g.fillRect(15, 9, 2, 2);
    }),
    // castillo de arena
    _decoCanvas(16, 12, g => {
      g.fillStyle = PAL.sand; g.fillRect(2, 6, 12, 6); g.fillRect(4, 2, 3, 5); g.fillRect(9, 2, 3, 5);
      g.fillStyle = PAL.dsand; g.fillRect(4, 1, 1, 2); g.fillRect(6, 1, 1, 2); g.fillRect(9, 1, 1, 2); g.fillRect(11, 1, 1, 2);
      g.fillStyle = PAL.red; g.fillRect(5, 0, 1, 2);
      g.fillStyle = PAL.dsand; g.fillRect(7, 8, 2, 4);
    }),
    // concha y estrella de mar
    _decoCanvas(14, 7, g => {
      g.fillStyle = PAL.pink; g.fillRect(1, 2, 4, 4); g.fillRect(2, 1, 2, 1);
      g.fillStyle = PAL.cream; g.fillRect(2, 3, 1, 3);
      g.fillStyle = PAL.orange; g.fillRect(9, 3, 4, 2); g.fillRect(10, 1, 2, 5); g.fillRect(8, 4, 1, 1); g.fillRect(13, 4, 1, 1);
    }),
  ];
  DECOS.ciudad = [
    // farola encendida
    _decoCanvas(12, 28, g => {
      g.fillStyle = PAL.dgray; g.fillRect(5, 4, 2, 24);
      g.fillRect(3, 2, 6, 2);
      g.fillStyle = PAL.yellow; g.fillRect(4, 0, 4, 3);
      g.fillStyle = PAL.cream; g.fillRect(5, 1, 2, 1);
    }),
    // hidrante
    _decoCanvas(8, 10, g => {
      g.fillStyle = PAL.red; g.fillRect(2, 2, 4, 8); g.fillRect(1, 4, 6, 2);
      g.fillStyle = PAL.blood; g.fillRect(3, 0, 2, 2);
    }),
    // semáforo
    _decoCanvas(10, 26, g => {
      g.fillStyle = PAL.dgray; g.fillRect(4, 10, 2, 16);
      g.fillStyle = PAL.black; g.fillRect(2, 0, 6, 11);
      g.fillStyle = PAL.red; g.fillRect(4, 1, 2, 2);
      g.fillStyle = PAL.yellow; g.fillRect(4, 4, 2, 2);
      g.fillStyle = PAL.green; g.fillRect(4, 7, 2, 2);
    }),
  ];
}

// ============ FONDOS PARALLAX por bioma ============
const BGS = {}; // BGS[bioma] = {sky:[colores], far:canvas, near:canvas, sun, aurora}

function _silhouette(w, h, color, color2, seed, jag, base) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const rnd = mulberry32(seed);
  let y = base;
  for (let x = 0; x < w; x += 4) {
    y += Math.floor((rnd() - 0.5) * jag * 2);
    y = Math.max(6, Math.min(h - 4, y));
    g.fillStyle = color;
    g.fillRect(x, y, 4, h - y);
    if (rnd() < 0.3) { g.fillStyle = color2; g.fillRect(x, y, 4, 2); }
  }
  return c;
}

// Silueta de rascacielos con ventanas iluminadas
function _skyline(w, h, color, winColor, seed) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const rnd = mulberry32(seed);
  let x = 0;
  while (x < w) {
    const bw = 14 + Math.floor(rnd() * 26);
    const bh = 20 + Math.floor(rnd() * (h - 26));
    const y = h - bh;
    g.fillStyle = color;
    g.fillRect(x, y, bw, bh);
    // antena ocasional
    if (rnd() < 0.3) g.fillRect(x + Math.floor(bw / 2), y - 6, 2, 6);
    // ventanas
    g.fillStyle = winColor;
    for (let wy = y + 3; wy < h - 4; wy += 5) {
      for (let wx = x + 2; wx < x + bw - 3; wx += 5) {
        if (rnd() < 0.55) g.fillRect(wx, wy, 2, 3);
      }
    }
    x += bw + 2 + Math.floor(rnd() * 4);
  }
  return c;
}

function buildBGs() {
  BGS.bosque = {
    sky: ['#8bd0ba', '#a8dcc8', '#c8ead8'],
    far: _silhouette(480, 100, '#5ba88f', '#6fbfa2', 11, 6, 40),
    near: _silhouette(480, 120, '#3d8a72', '#4d9d82', 22, 10, 50),
    sun: { x: 400, y: 40, r: 14, color: '#fff7d6' },
  };
  BGS.jungla = {
    sky: ['#7ec850', '#9fd86a', '#c0e88a'],
    far: _silhouette(480, 110, '#4a9440', '#5aa850', 33, 4, 30),
    near: _silhouette(480, 130, '#2e6e30', '#3c8040', 44, 8, 45),
    sun: { x: 90, y: 35, r: 12, color: '#fffbe0' },
  };
  BGS.desierto = {
    sky: ['#ffce8a', '#ffb570', '#ff9c5c'],
    far: _silhouette(480, 90, '#d89050', '#e8a060', 55, 3, 50),
    near: _silhouette(480, 110, '#b87038', '#c88048', 66, 5, 55),
    sun: { x: 240, y: 45, r: 18, color: '#fff2c0' },
  };
  BGS.sabana = {
    sky: ['#ff9a56', '#ff7e4a', '#e86a48'],
    far: _silhouette(480, 85, '#a04830', '#b05838', 77, 2, 55),
    near: _silhouette(480, 105, '#703020', '#804028', 88, 4, 58),
    sun: { x: 150, y: 55, r: 22, color: '#ffdca0' },
  };
  BGS.artico = {
    sky: ['#1a2c50', '#243a64', '#31497a'],
    far: _silhouette(480, 100, '#4a6a9a', '#5a7aaa', 99, 8, 45),
    near: _silhouette(480, 120, '#33507e', '#40608e', 110, 12, 55),
    sun: { x: 380, y: 35, r: 10, color: '#e8f0ff' },
    aurora: true,
  };
  BGS.volcan = {
    sky: ['#2c0f1e', '#4a1420', '#6e2020'],
    far: _silhouette(480, 100, '#4a2028', '#5c2830', 121, 9, 40),
    near: _silhouette(480, 120, '#301418', '#3c1a20', 132, 12, 50),
    sun: { x: 240, y: 40, r: 16, color: '#ff6a3c' },
  };
  BGS.pantano = {
    sky: ['#3c4c30', '#4c5c38', '#5c6c44'],
    far: _silhouette(480, 100, '#2c3c24', '#38482c', 143, 5, 38),
    near: _silhouette(480, 120, '#1e2c18', '#28381e', 154, 8, 48),
    sun: { x: 100, y: 40, r: 11, color: '#d8e0a0' },
  };
  BGS.montana = {
    sky: ['#5c8ac8', '#78a2d8', '#98bce8'],
    far: _silhouette(480, 110, '#8898b8', '#a8b8d0', 165, 14, 35),
    near: _silhouette(480, 130, '#5c6c8c', '#6c7ca0', 176, 16, 45),
    sun: { x: 400, y: 30, r: 13, color: '#fffbe8' },
  };
  BGS.cueva = {
    sky: ['#12101e', '#1a1628', '#241e34'],
    far: _silhouette(480, 100, '#2c2444', '#38305a', 187, 10, 40),
    near: _silhouette(480, 120, '#1e1830', '#282040', 198, 14, 50),
    sun: { x: 240, y: 30, r: 6, color: '#4a4468' },
    cristales: true,
  };
  BGS.costa = {
    sky: ['#68c8e8', '#8cd8f0', '#b0e8f8'],
    far: _silhouette(480, 70, '#3878b8', '#4888c8', 209, 1, 30),
    near: _silhouette(480, 90, '#2860a0', '#3070b0', 220, 2, 35),
    sun: { x: 380, y: 40, r: 18, color: '#fff8d0' },
    mar: true,
  };
  BGS.ciudad = {
    sky: ['#241a3e', '#41284e', '#6e3652'],
    far: _skyline(480, 110, '#1a1430', '#e8c86a', 301),
    near: _skyline(480, 130, '#100c22', '#f5b921', 302),
    sun: { x: 396, y: 34, r: 11, color: '#e8e8f8' },
  };
}

function initSprites() {
  buildTiles();
  buildDecos();
  buildBGs();
}
