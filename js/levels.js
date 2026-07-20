'use strict';
// ============ NIVELES, ANIMALES, ECONOMÍA, BOSSES, ARMAS, SKINS ============

const TILE = 16;
const BIOMES = ['bosque', 'jungla', 'desierto', 'sabana', 'artico', 'volcan', 'pantano', 'montana', 'cueva', 'costa'];
const BIOME_LABEL = {
  bosque: 'Bosque', jungla: 'Jungla', desierto: 'Desierto', sabana: 'Sabana', artico: 'Ártico',
  volcan: 'Volcán', pantano: 'Pantano', montana: 'Montaña', cueva: 'Cueva', costa: 'Costa',
};
const WORLDS = 10;
const LEVELS_PER_WORLD = 30;
const TOTAL_LEVELS = WORLDS * LEVELS_PER_WORLD; // 300
const BOSS_EVERY = 10; // jefes en los niveles 10, 20 y 30 de cada mundo

// ---- Loot: id -> {label, price, icon} ----
const LOOT = {
  carne_conejo:   { label: 'Carne de conejo',    price: 3,  icon: 'meat' },
  carne_venado:   { label: 'Carne de venado',    price: 6,  icon: 'meat' },
  piel_venado:    { label: 'Piel de venado',     price: 9,  icon: 'pelt' },
  carne_jabali:   { label: 'Carne de jabalí',    price: 8,  icon: 'meat' },
  colmillo_jabali:{ label: 'Colmillo de jabalí', price: 10, icon: 'pelt' },
  carne_oso:      { label: 'Carne de oso',       price: 10, icon: 'meat' },
  piel_oso:       { label: 'Piel de oso',        price: 18, icon: 'pelt' },
  pluma_tucan:    { label: 'Pluma de tucán',     price: 7,  icon: 'pelt' },
  carne_mono:     { label: 'Carne de mono',      price: 5,  icon: 'meat' },
  piel_serpiente: { label: 'Piel de serpiente',  price: 12, icon: 'pelt' },
  carne_jaguar:   { label: 'Carne de jaguar',    price: 8,  icon: 'meat' },
  piel_jaguar:    { label: 'Piel de jaguar',     price: 20, icon: 'pelt' },
  piel_lagarto:   { label: 'Piel de lagarto',    price: 5,  icon: 'pelt' },
  pluma_buitre:   { label: 'Pluma de buitre',    price: 6,  icon: 'pelt' },
  aguijon:        { label: 'Aguijón',            price: 8,  icon: 'pelt' },
  carne_coyote:   { label: 'Carne de coyote',    price: 6,  icon: 'meat' },
  piel_coyote:    { label: 'Piel de coyote',     price: 10, icon: 'pelt' },
  carne_gacela:   { label: 'Carne de gacela',    price: 7,  icon: 'meat' },
  piel_gacela:    { label: 'Piel de gacela',     price: 10, icon: 'pelt' },
  carne_cebra:    { label: 'Carne de cebra',     price: 9,  icon: 'meat' },
  piel_cebra:     { label: 'Piel de cebra',      price: 14, icon: 'pelt' },
  piel_hiena:     { label: 'Piel de hiena',      price: 11, icon: 'pelt' },
  carne_leon:     { label: 'Carne de león',      price: 10, icon: 'meat' },
  piel_leon:      { label: 'Piel de león',       price: 24, icon: 'pelt' },
  carne_pinguino: { label: 'Carne de pingüino',  price: 6,  icon: 'meat' },
  carne_foca:     { label: 'Carne de foca',      price: 8,  icon: 'meat' },
  piel_foca:      { label: 'Piel de foca',       price: 12, icon: 'pelt' },
  carne_lobo:     { label: 'Carne de lobo',      price: 7,  icon: 'meat' },
  piel_lobo:      { label: 'Piel de lobo',       price: 16, icon: 'pelt' },
  carne_osopolar: { label: 'Carne de oso polar', price: 12, icon: 'meat' },
  piel_osopolar:  { label: 'Piel de oso polar',  price: 26, icon: 'pelt' },
  // mundos nuevos
  piel_salamandra:{ label: 'Piel de salamandra', price: 9,  icon: 'pelt' },
  ala_murcielago: { label: 'Ala de murciélago',  price: 5,  icon: 'pelt' },
  nucleo_magma:   { label: 'Núcleo de magma',    price: 16, icon: 'pelt' },
  anca_rana:      { label: 'Anca de rana',       price: 6,  icon: 'meat' },
  ala_libelula:   { label: 'Ala de libélula',    price: 5,  icon: 'pelt' },
  caparazon:      { label: 'Caparazón',          price: 12, icon: 'pelt' },
  carne_tortuga:  { label: 'Carne de tortuga',   price: 6,  icon: 'meat' },
  piel_caiman:    { label: 'Piel de caimán',     price: 20, icon: 'pelt' },
  carne_caiman:   { label: 'Carne de caimán',    price: 9,  icon: 'meat' },
  piel_marmota:   { label: 'Piel de marmota',    price: 6,  icon: 'pelt' },
  carne_cabra:    { label: 'Carne de cabra',     price: 8,  icon: 'meat' },
  cuerno_cabra:   { label: 'Cuerno de cabra',    price: 9,  icon: 'pelt' },
  pluma_aguila:   { label: 'Pluma de águila',    price: 11, icon: 'pelt' },
  piel_puma:      { label: 'Piel de puma',       price: 21, icon: 'pelt' },
  carne_puma:     { label: 'Carne de puma',      price: 8,  icon: 'meat' },
  piel_topo:      { label: 'Piel de topo',       price: 6,  icon: 'pelt' },
  seda_arana:     { label: 'Seda de araña',      price: 12, icon: 'pelt' },
  polvo_luz:      { label: 'Polvo de luz',       price: 9,  icon: 'pelt' },
  pinza_cangrejo: { label: 'Pinza de cangrejo',  price: 9,  icon: 'meat' },
  pluma_gaviota:  { label: 'Pluma de gaviota',   price: 5,  icon: 'pelt' },
  caparazon_marino:{ label: 'Caparazón marino',  price: 15, icon: 'pelt' },
  // trofeos de jefes
  trofeo_oso:     { label: 'Trofeo: Oso Ancestral',      price: 100, icon: 'pelt' },
  trofeo_jaguar:  { label: 'Trofeo: Jaguar Emperador',   price: 130, icon: 'pelt' },
  trofeo_escorpion:{ label: 'Trofeo: Escorpión Colosal', price: 160, icon: 'pelt' },
  trofeo_leon:    { label: 'Trofeo: León Dorado',        price: 190, icon: 'pelt' },
  trofeo_mamut:   { label: 'Trofeo: Mamut Ancestral',    price: 220, icon: 'pelt' },
  trofeo_dragon:  { label: 'Trofeo: Dragón de Magma',    price: 260, icon: 'pelt' },
  trofeo_caiman:  { label: 'Trofeo: Caimán Rey',         price: 300, icon: 'pelt' },
  trofeo_aguila:  { label: 'Trofeo: Águila Real',        price: 340, icon: 'pelt' },
  trofeo_arana:   { label: 'Trofeo: Araña Reina',        price: 380, icon: 'pelt' },
  trofeo_cangrejo:{ label: 'Trofeo: Cangrejo Colosal',   price: 420, icon: 'pelt' },
};

// ---- Animales ----
// behavior: flee, chase, patrol, fly, dive, throw, hop (rana: salta)
const ANIMALS = {
  conejo:    { spr: 'conejo',    name: 'Conejo',     hp: 1, speed: 1.2, behavior: 'flee',   dmg: 0, loot: [['carne_conejo', 1]], coins: 1 },
  venado:    { spr: 'venado',    name: 'Venado',     hp: 3, speed: 1.0, behavior: 'flee',   dmg: 0, loot: [['carne_venado', 2], ['piel_venado', 1]], coins: 2 },
  jabali:    { spr: 'jabali',    name: 'Jabalí',     hp: 4, speed: 1.1, behavior: 'chase',  dmg: 1, loot: [['carne_jabali', 1], ['colmillo_jabali', 1]], coins: 2 },
  oso:       { spr: 'oso',       name: 'Oso',        hp: 8, speed: 0.7, behavior: 'chase',  dmg: 1, loot: [['carne_oso', 2], ['piel_oso', 1]], coins: 4 },
  tucan:     { spr: 'tucan',     name: 'Tucán',      hp: 2, speed: 0.8, behavior: 'fly',    dmg: 0, loot: [['pluma_tucan', 1]], coins: 1 },
  mono:      { spr: 'mono',      name: 'Mono',       hp: 2, speed: 0.9, behavior: 'throw',  dmg: 1, loot: [['carne_mono', 1]], coins: 2 },
  serpiente: { spr: 'serpiente', name: 'Serpiente',  hp: 2, speed: 0.5, behavior: 'patrol', dmg: 1, loot: [['piel_serpiente', 1]], coins: 2 },
  jaguar:    { spr: 'jaguar',    name: 'Jaguar',     hp: 6, speed: 1.4, behavior: 'chase',  dmg: 1, loot: [['carne_jaguar', 1], ['piel_jaguar', 1]], coins: 4 },
  lagarto:   { spr: 'lagarto',   name: 'Lagarto',    hp: 1, speed: 0.9, behavior: 'flee',   dmg: 0, loot: [['piel_lagarto', 1]], coins: 1 },
  buitre:    { spr: 'buitre',    name: 'Buitre',     hp: 2, speed: 1.0, behavior: 'dive',   dmg: 1, loot: [['pluma_buitre', 1]], coins: 2 },
  escorpion: { spr: 'escorpion', name: 'Escorpión',  hp: 2, speed: 0.5, behavior: 'patrol', dmg: 1, loot: [['aguijon', 1]], coins: 2 },
  coyote:    { spr: 'coyote',    name: 'Coyote',     hp: 4, speed: 1.3, behavior: 'chase',  dmg: 1, loot: [['carne_coyote', 1], ['piel_coyote', 1]], coins: 3 },
  gacela2:   { spr: 'gacela2',   name: 'Gacela',     hp: 3, speed: 1.5, behavior: 'flee',   dmg: 0, loot: [['carne_gacela', 2], ['piel_gacela', 1]], coins: 2 },
  cebra:     { spr: 'cebra',     name: 'Cebra',      hp: 5, speed: 1.2, behavior: 'flee',   dmg: 0, loot: [['carne_cebra', 2], ['piel_cebra', 1]], coins: 3 },
  hiena:     { spr: 'hiena',     name: 'Hiena',      hp: 4, speed: 1.3, behavior: 'chase',  dmg: 1, loot: [['piel_hiena', 1]], coins: 3 },
  leon:      { spr: 'leon',      name: 'León',       hp: 7, speed: 1.2, behavior: 'chase',  dmg: 1, loot: [['carne_leon', 2], ['piel_leon', 1]], coins: 5 },
  pinguino:  { spr: 'pinguino',  name: 'Pingüino',   hp: 1, speed: 0.7, behavior: 'flee',   dmg: 0, loot: [['carne_pinguino', 1]], coins: 1 },
  foca:      { spr: 'foca',      name: 'Foca',       hp: 2, speed: 0.6, behavior: 'flee',   dmg: 0, loot: [['carne_foca', 1], ['piel_foca', 1]], coins: 2 },
  lobo:      { spr: 'lobo',      name: 'Lobo',       hp: 5, speed: 1.4, behavior: 'chase',  dmg: 1, loot: [['carne_lobo', 1], ['piel_lobo', 1]], coins: 3 },
  osopolar:  { spr: 'osopolar',  name: 'Oso polar',  hp: 9, speed: 0.8, behavior: 'chase',  dmg: 1, loot: [['carne_osopolar', 2], ['piel_osopolar', 1]], coins: 5 },
  // volcán
  salamandra:{ spr: 'salamandra', name: 'Salamandra', hp: 2, speed: 1.0, behavior: 'flee',  dmg: 0, loot: [['piel_salamandra', 1]], coins: 2 },
  murcielago:{ spr: 'murcielago', name: 'Murciélago', hp: 1, speed: 1.1, behavior: 'dive',  dmg: 1, loot: [['ala_murcielago', 1]], coins: 1 },
  golem:     { spr: 'golem',      name: 'Gólem de magma', hp: 8, speed: 0.5, behavior: 'chase', dmg: 1, loot: [['nucleo_magma', 1]], coins: 4 },
  // pantano
  rana:      { spr: 'rana',      name: 'Rana',       hp: 2, speed: 1.0, behavior: 'hop',   dmg: 0, loot: [['anca_rana', 2]], coins: 1 },
  libelula:  { spr: 'libelula',  name: 'Libélula',   hp: 1, speed: 1.2, behavior: 'fly',   dmg: 0, loot: [['ala_libelula', 1]], coins: 1 },
  tortuga:   { spr: 'tortuga',   name: 'Tortuga',    hp: 5, speed: 0.3, behavior: 'flee',  dmg: 0, loot: [['caparazon', 1], ['carne_tortuga', 1]], coins: 2 },
  caiman:    { spr: 'caiman',    name: 'Caimán',     hp: 8, speed: 1.2, behavior: 'chase', dmg: 1, loot: [['piel_caiman', 1], ['carne_caiman', 1]], coins: 5 },
  // montaña
  marmota:   { spr: 'marmota',   name: 'Marmota',    hp: 1, speed: 1.0, behavior: 'flee',  dmg: 0, loot: [['piel_marmota', 1]], coins: 1 },
  cabra:     { spr: 'cabra',     name: 'Cabra montés', hp: 4, speed: 1.3, behavior: 'flee', dmg: 0, loot: [['carne_cabra', 1], ['cuerno_cabra', 1]], coins: 2 },
  aguila:    { spr: 'aguila',    name: 'Águila',     hp: 3, speed: 1.2, behavior: 'dive',  dmg: 1, loot: [['pluma_aguila', 1]], coins: 3 },
  puma:      { spr: 'puma',      name: 'Puma',       hp: 7, speed: 1.5, behavior: 'chase', dmg: 1, loot: [['piel_puma', 1], ['carne_puma', 1]], coins: 5 },
  // cueva
  topo:      { spr: 'topo',      name: 'Topo',       hp: 2, speed: 0.8, behavior: 'flee',  dmg: 0, loot: [['piel_topo', 1]], coins: 1 },
  arana:     { spr: 'arana',     name: 'Araña',      hp: 4, speed: 0.9, behavior: 'chase', dmg: 1, loot: [['seda_arana', 1]], coins: 3 },
  luciernaga:{ spr: 'luciernaga', name: 'Luciérnaga', hp: 1, speed: 0.9, behavior: 'fly',  dmg: 0, loot: [['polvo_luz', 1]], coins: 2 },
  // costa
  cangrejo:  { spr: 'cangrejo',  name: 'Cangrejo',   hp: 3, speed: 0.7, behavior: 'patrol', dmg: 1, loot: [['pinza_cangrejo', 1]], coins: 2 },
  gaviota:   { spr: 'gaviota',   name: 'Gaviota',    hp: 2, speed: 1.0, behavior: 'fly',   dmg: 0, loot: [['pluma_gaviota', 1]], coins: 1 },
  tortuga_marina: { spr: 'tortuga_marina', name: 'Tortuga marina', hp: 5, speed: 0.4, behavior: 'flee', dmg: 0, loot: [['caparazon_marino', 1], ['carne_tortuga', 1]], coins: 3 },
};

const BIOME_ANIMALS = {
  bosque:   [['conejo', 3], ['venado', 3], ['jabali', 2], ['oso', 1]],
  jungla:   [['tucan', 3], ['mono', 2], ['serpiente', 2], ['jaguar', 1]],
  desierto: [['lagarto', 3], ['buitre', 2], ['escorpion', 2], ['coyote', 1]],
  sabana:   [['gacela2', 3], ['cebra', 2], ['hiena', 2], ['leon', 1]],
  artico:   [['pinguino', 3], ['foca', 2], ['lobo', 2], ['osopolar', 1]],
  volcan:   [['salamandra', 3], ['murcielago', 3], ['golem', 2], ['escorpion', 1]],
  pantano:  [['rana', 3], ['libelula', 3], ['tortuga', 2], ['caiman', 1]],
  montana:  [['marmota', 3], ['cabra', 3], ['aguila', 2], ['puma', 1]],
  cueva:    [['murcielago', 3], ['luciernaga', 3], ['topo', 2], ['arana', 2]],
  costa:    [['cangrejo', 3], ['gaviota', 3], ['tortuga_marina', 2], ['foca', 1]],
};

// ---- Bosses: uno por mundo, aparecen en los niveles 10, 20 y 30 (tier 1-3) ----
const BOSSES = [
  { spr: 'boss_oso',       name: 'OSO ANCESTRAL',     scale: 3,   hp: 100,  speed: 1.0, w: 66, h: 48, attacks: ['charge', 'slam', 'summon'],  minion: 'jabali',    proj: 'rock',     trophy: 'trofeo_oso',      coins: 30 },
  { spr: 'boss_jaguar',    name: 'JAGUAR EMPERADOR',  scale: 3,   hp: 130,  speed: 1.6, w: 66, h: 39, attacks: ['charge', 'pounce', 'summon'], minion: 'serpiente', proj: 'rock',    trophy: 'trofeo_jaguar',   coins: 40 },
  { spr: 'boss_escorpion', name: 'ESCORPIÓN COLOSAL', scale: 3,   hp: 160,  speed: 0.9, w: 54, h: 36, attacks: ['volley', 'charge', 'burrow'], minion: 'escorpion', proj: 'stinger', trophy: 'trofeo_escorpion', coins: 50 },
  { spr: 'boss_leon',      name: 'LEÓN DORADO',       scale: 3,   hp: 190, speed: 1.4, w: 66, h: 42, attacks: ['charge', 'roar', 'summon'],   minion: 'hiena',     proj: 'roarwave', trophy: 'trofeo_leon',    coins: 60 },
  { spr: 'mamut',          name: 'MAMUT ANCESTRAL',   scale: 2.5, hp: 230, speed: 1.1, w: 65, h: 50, attacks: ['charge', 'slam', 'volley'],   minion: 'lobo',      proj: 'icicle',   trophy: 'trofeo_mamut',   coins: 70 },
  { spr: 'boss_dragon',    name: 'DRAGÓN DE MAGMA',   scale: 2.5, hp: 270, speed: 1.3, w: 70, h: 50, fly: true, attacks: ['dive', 'volley', 'charge'], minion: 'murcielago', proj: 'fireball', trophy: 'trofeo_dragon', coins: 85 },
  { spr: 'boss_caiman',    name: 'CAIMÁN REY',        scale: 3,   hp: 310, speed: 1.2, w: 78, h: 27, attacks: ['charge', 'volley', 'summon'], minion: 'rana',      proj: 'burbuja',  trophy: 'trofeo_caiman',  coins: 100 },
  { spr: 'boss_aguila',    name: 'ÁGUILA REAL',       scale: 3,   hp: 350, speed: 1.5, w: 48, h: 36, fly: true, attacks: ['dive', 'charge', 'summon'], minion: 'aguila', proj: 'pluma', trophy: 'trofeo_aguila', coins: 115 },
  { spr: 'boss_arana',     name: 'ARAÑA REINA',       scale: 3,   hp: 390, speed: 1.1, w: 42, h: 30, attacks: ['volley', 'pounce', 'summon'], minion: 'arana',     proj: 'web',      trophy: 'trofeo_arana',   coins: 130 },
  { spr: 'boss_cangrejo',  name: 'CANGREJO COLOSAL',  scale: 3,   hp: 440, speed: 1.0, w: 48, h: 33, attacks: ['charge', 'slam', 'volley'],   minion: 'cangrejo',  proj: 'burbuja',  trophy: 'trofeo_cangrejo', coins: 150 },
];

// ---- Personajes jugables (las armas ahora son aparte) ----
const CHARS = [
  { id: 'cazador',       name: 'CAZADOR',       desc: 'Equilibrado en todo',           hp: 6, speed: 1.0,  jump: 1.0,  dmgBonus: 0, fireMod: 1.0 },
  { id: 'exploradora',   name: 'EXPLORADORA',   desc: 'Rápida y salta más alto',       hp: 4, speed: 1.25, jump: 1.1,  dmgBonus: 0, fireMod: 0.9 },
  { id: 'tanque',        name: 'TANQUE',        desc: 'Mucha vida y +1 daño',          hp: 9, speed: 0.8,  jump: 0.94, dmgBonus: 1, fireMod: 1.2 },
  { id: 'francotirador', name: 'FRANCOTIRADOR', desc: '+2 daño, dispara más lento',    hp: 4, speed: 0.95, jump: 1.0,  dmgBonus: 2, fireMod: 1.3 },
  { id: 'trampero',      name: 'TRAMPERO',      desc: '+50% al vender pieles y carne', hp: 5, speed: 1.0,  jump: 1.0,  dmgBonus: 0, fireMod: 1.0, sellBonus: 1.5 },
];

// ---- Armas (se compran en la tienda; F equipa a P1, L equipa a P2) ----
// type: 'bullet' | 'rocket' (el cohete cae con gravedad y explota en área)
const WEAPONS = [
  { id: 'rifle_caza', name: 'Rifle de caza',   desc: 'El clásico de siempre',           price: 0,   spr: 'w_rifle',    mx: 14, my: 0, dmg: 2, cd: 18, spd: 7,   range: 380, type: 'bullet' },
  { id: 'pistola',    name: 'Pistola',         desc: 'Rápida pero débil',               price: 60,  spr: 'w_pistola',  mx: 7,  my: 0, dmg: 1, cd: 9,  spd: 8,   range: 240, type: 'bullet' },
  { id: 'escopeta',   name: 'Escopeta',        desc: '3 perdigones, corto alcance',     price: 160, spr: 'w_escopeta', mx: 11, my: 0, dmg: 2, cd: 32, spd: 6,   range: 150, type: 'bullet', pellets: 3 },
  { id: 'auto',       name: 'Rifle automático', desc: 'Ráfaga continua',                price: 280, spr: 'w_auto',     mx: 12, my: 0, dmg: 1, cd: 6,  spd: 8,   range: 320, type: 'bullet' },
  { id: 'franco',     name: 'Rifle francotirador', desc: 'Daño enorme y largo alcance', price: 420, spr: 'w_franco',   mx: 16, my: 1, dmg: 7, cd: 45, spd: 12,  range: 560, type: 'bullet' },
  { id: 'smg',        name: 'Subfusil',        desc: 'Ligero y rapidísimo',             price: 220, spr: 'w_smg',      mx: 9,  my: 0, dmg: 1, cd: 5,  spd: 8,   range: 260, type: 'bullet' },
  { id: 'magnum',     name: 'Magnum',          desc: 'Revólver de gran calibre',        price: 350, spr: 'w_magnum',   mx: 9,  my: 0, dmg: 4, cd: 22, spd: 10,  range: 340, type: 'bullet' },
  { id: 'ballesta',   name: 'Ballesta',        desc: 'Flechas con caída, daño alto',    price: 300, spr: 'w_ballesta', mx: 11, my: 2, dmg: 5, cd: 30, spd: 9,   range: 440, type: 'bullet', grav: 0.045 },
  { id: 'laser',      name: 'Rifle láser',     desc: '¡Atraviesa a todos los animales!', price: 900, spr: 'w_laser',   mx: 12, my: 1, dmg: 4, cd: 14, spd: 16,  range: 620, type: 'bullet', pierce: 99 },
  { id: 'minigun',    name: 'Minigun',         desc: 'Lluvia infinita de balas',        price: 1200, spr: 'w_minigun', mx: 12, my: 1, dmg: 1, cd: 3,  spd: 9,   range: 300, type: 'bullet' },
  { id: 'rocket',     name: 'Lanzacohetes',    desc: 'Cohete con gravedad, ¡BUM en área!', price: 650, spr: 'w_rocket', mx: 14, my: 1, dmg: 6, cd: 55, spd: 5.5, range: 900, type: 'rocket', aoe: 42, aoeDmg: 4 },
];
const WEAPON_INDEX = {};
for (const w of WEAPONS) WEAPON_INDEX[w.id] = w;

// ---- Skins (paletas alternativas para todos los personajes) ----
const SKINS = [
  { idx: 0, name: 'Clásico',   desc: 'El look original',          price: 0 },
  { idx: 1, name: 'Nocturno',  desc: 'Sigilo azul medianoche',    price: 200 },
  { idx: 2, name: 'Dorado',    desc: 'Para presumir monedas',     price: 500 },
  { idx: 3, name: 'Neón',      desc: 'Imposible no verte',        price: 350 },
  { idx: 4, name: 'Camuflaje', desc: 'El bosque es tu aliado',    price: 150 },
  { idx: 5, name: 'Sangre',    desc: 'Los jefes te temerán',      price: 300 },
  { idx: 6, name: 'Fantasma',  desc: 'Pálido como la niebla',     price: 450 },
  { idx: 7, name: 'Fiesta',    desc: '¡Confeti andante!',         price: 600 },
];

// ---- Mejoras de la tienda ----
const UPGRADES = [
  { id: 'dmg',      name: 'Munición pesada',      desc: '+1 daño por bala',            base: 50,  scale: 1.7, max: 5 },
  { id: 'firerate', name: 'Cerrojo rápido',       desc: 'Disparas 15% más rápido',     base: 45,  scale: 1.7, max: 4 },
  { id: 'hp',       name: 'Corazón extra',        desc: '+1 vida máxima',              base: 40,  scale: 1.6, max: 5 },
  { id: 'speed',    name: 'Botas ligeras',        desc: '+8% velocidad',               base: 35,  scale: 1.7, max: 3 },
  { id: 'djump',    name: 'Botas de doble salto', desc: '¡Salto extra en el aire!',    base: 120, scale: 1,   max: 1 },
  { id: 'iman',     name: 'Imán de monedas',      desc: 'Atrae monedas desde más lejos', base: 40, scale: 1.6, max: 3 },
  { id: 'chaleco',  name: 'Chaleco táctico',      desc: '+1 escudo por nivel (absorbe golpes)', base: 80, scale: 1.7, max: 3 },
  { id: 'suerte',   name: 'Pata de conejo',       desc: 'Los animales sueltan +1 moneda', base: 60, scale: 1.6, max: 3 },
  { id: 'pierce',   name: 'Balas perforantes',    desc: 'Tus balas atraviesan +1 animal', base: 130, scale: 1.8, max: 2 },
  { id: 'vampiro',  name: 'Instinto vampiro',     desc: '25% de curarte al recoger presas', base: 70, scale: 1.7, max: 3 },
  { id: 'heal',     name: 'Botiquín',             desc: 'Cura toda la vida ya mismo',  base: 25,  scale: 1,   max: 99 },
];

// ---- Items de La Ciudad (elige uno al entrar a un nivel) ----
const ITEMS = [
  { id: 'moto',    name: 'Moto Turbo',       desc: 'Corre +85% y absorbe un golpe (¡escapa al chocar!)', price: 800, spr: 'itm_moto' },
  { id: 'bebida',  name: 'Bebida Energética', desc: 'Corres MUCHO más rápido todo el nivel',             price: 400, spr: 'itm_bebida' },
  { id: 'granada', name: 'Granadas x3',       desc: 'Lanza con G (P1) o K (P2). ¡Gran explosión!',       price: 300, spr: 'itm_granada' },
];
const ITEM_INDEX = {};
for (const it of ITEMS) ITEM_INDEX[it.id] = it;

// ---- Mascotas: precios ----
function petRecruitPrice(speciesId) { return 40 + ANIMALS[speciesId].hp * 12; }
function petVidaPrice(bonus) { return Math.round(30 * Math.pow(1.5, bonus)); }
const PET_ARMOR_PRICE = 150;   // 4 puntos de escudo cada nivel
const PET_TURRET_PRICE = 250;  // torreta automática
const PET_HEAL_PRICE = 20;

function upgradePrice(u, lvl) { return Math.round(u.base * Math.pow(u.scale, lvl)); }

// ============ GENERADOR DE NIVELES ============
// idx plano 0..299: mundo = idx/30, etapa = idx%30. Jefe si (etapa+1)%10==0.

function levelWorld(idx) { return Math.floor(idx / LEVELS_PER_WORLD); }
function levelStage(idx) { return idx % LEVELS_PER_WORLD; }
function isBossLevel(idx) { return (levelStage(idx) + 1) % BOSS_EVERY === 0; }
function bossTier(idx) { return Math.floor(levelStage(idx) / BOSS_EVERY) + 1; } // 1..3

function levelName(idx) {
  const w = levelWorld(idx), s = levelStage(idx);
  let n = BIOME_LABEL[BIOMES[w]] + ' ' + (s + 1);
  if (isBossLevel(idx)) n += ' — JEFE ' + ['I', 'II', 'III'][bossTier(idx) - 1];
  return n;
}

function genLevel(idx) {
  const world = levelWorld(idx), stage = levelStage(idx);
  const biome = BIOMES[world];
  const rnd = mulberry32(9000 + idx * 613);
  if (isBossLevel(idx)) return genBossLevel(idx, world, biome, rnd);

  const diff = Math.min(1, (world * 0.55 + (stage / (LEVELS_PER_WORLD - 1)) * 4.5) / 10); // 0..1
  const wT = Math.min(240, 120 + stage * 4 + world * 8);
  const hT = 34;
  const grid = new Uint8Array(wT * hT);
  const gh = new Int16Array(wT).fill(-1);
  const entities = [], decos = [];

  const G = (x, y) => (y >= 0 && y < hT && x >= 0 && x < wT) ? grid[y * wT + x] : 1;
  const S = (x, y, v) => { if (y >= 0 && y < hT && x >= 0 && x < wT) grid[y * wT + x] = v; };

  let curH = hT - 6;
  let x = 0;
  const flatCols = [];

  const setGround = (col, h) => { gh[col] = h; };
  const flat = len => { for (let i = 0; i < len && x < wT; i++, x++) { setGround(x, curH); flatCols.push(x); } };

  flat(10);

  const gapMax = 3 + Math.floor(diff * 2.5); // 3..5

  while (x < wT - 16) {
    const roll = rnd();
    let f;
    if (roll < 0.20) f = 'flat';
    else if (roll < 0.36) f = 'step';
    else if (roll < 0.51) f = 'gap';
    else if (roll < 0.61) f = 'platforms';
    else if (roll < 0.70) f = 'spikes';
    else if (roll < 0.78) f = 'tower';
    else if (roll < 0.86) f = 'mplat';
    else if (roll < 0.93) f = 'cplat';
    else f = 'spring';

    if (f === 'flat') {
      flat(4 + Math.floor(rnd() * 6));

    } else if (f === 'step') {
      const dh = (rnd() < 0.5 ? -1 : 1) * (1 + Math.floor(rnd() * 2));
      curH = Math.max(hT - 18, Math.min(hT - 4, curH + dh));
      flat(4 + Math.floor(rnd() * 4));

    } else if (f === 'gap') {
      const gw = 2 + Math.floor(rnd() * (gapMax - 1));
      for (let i = 0; i < gw; i++) {
        entities.push({ type: 'coin', x: (x + i) * TILE + 4, y: (curH - 3 - Math.floor(Math.sin((i + 0.5) / gw * Math.PI) * 2)) * TILE });
      }
      if (gw >= 4) {
        const px = x + Math.floor(gw / 2);
        S(px, curH - 1 + Math.floor(rnd() * 2), 2);
      }
      x += gw;
      flat(3 + Math.floor(rnd() * 3));

    } else if (f === 'platforms') {
      const n = 2 + Math.floor(rnd() * 3);
      let ph = curH - 4;
      for (let i = 0; i < n && x < wT - 16; i++) {
        const pw = 2 + Math.floor(rnd() * 2);
        for (let j = 0; j < pw; j++) { S(x + j, ph, 2); entities.push({ type: 'coin', x: (x + j) * TILE + 4, y: (ph - 2) * TILE }); }
        for (let j = 0; j < pw + 1; j++) { if (x < wT) { setGround(x, curH); x++; } }
        ph = Math.max(hT - 22, ph - (rnd() < 0.5 ? 2 : 0) + (rnd() < 0.3 ? 2 : 0));
      }
      flat(2);

    } else if (f === 'spikes') {
      const sw = 2 + Math.floor(rnd() * 2 + diff * 2.5);
      if (sw >= 3) { for (let j = 0; j < 3; j++) S(x + Math.floor(sw / 2) - 1 + j, curH - 4, 2); }
      for (let i = 0; i < sw && x < wT - 16; i++) {
        setGround(x, curH);
        S(x, curH - 1, 3);
        x++;
      }
      flat(3 + Math.floor(rnd() * 3));

    } else if (f === 'tower') {
      const steps = 3 + Math.floor(rnd() * 3);
      const baseX = x;
      flat(3);
      let ph = curH - 4, px = baseX + 1, dir = 1;
      for (let i = 0; i < steps; i++) {
        for (let j = 0; j < 2; j++) S(px + j, ph, 2);
        entities.push({ type: 'coin', x: px * TILE + 8, y: (ph - 2) * TILE });
        px += dir * 3; dir = -dir;
        ph -= 3;
        if (ph < 4) break;
      }
      entities.push({ type: 'gem', x: (px - dir * 3) * TILE + 8, y: (ph + 1) * TILE });
      flat(3 + Math.floor(rnd() * 3));

    } else if (f === 'mplat') {
      const gw = 6 + Math.floor(rnd() * 3);
      entities.push({ type: 'mplat', x: x * TILE, y: (curH - 1) * TILE, w: 3 * TILE, axis: 'x', range: (gw - 3) * TILE, speed: 0.6 + diff * 0.6 });
      for (let i = 0; i < 3; i++) entities.push({ type: 'coin', x: (x + gw / 2 - 1 + i) * TILE, y: (curH - 4) * TILE });
      x += gw;
      flat(3 + Math.floor(rnd() * 3));

    } else if (f === 'cplat') {
      const gw = 4 + Math.floor(rnd() * 3);
      for (let i = 0; i < gw; i += 2) {
        entities.push({ type: 'cplat', x: (x + i) * TILE, y: (curH - 1) * TILE, w: 2 * TILE });
      }
      x += gw;
      flat(3 + Math.floor(rnd() * 3));

    } else if (f === 'spring') {
      setGround(x, curH); flatCols.push(x);
      entities.push({ type: 'spring', x: x * TILE + 2, y: (curH - 1) * TILE + 8 });
      x++;
      const wallH = 5 + Math.floor(rnd() * 2);
      curH = Math.max(hT - 18, curH - wallH);
      flat(5 + Math.floor(rnd() * 3));
      for (let i = 0; i < 3; i++) entities.push({ type: 'coin', x: (x - 4 + i) * TILE, y: (curH - 2) * TILE });
    }
  }
  curH = Math.max(curH, hT - 8);
  while (x < wT) { setGround(x, curH); x++; }
  const exitX = (wT - 5) * TILE;
  entities.push({ type: 'exit', x: exitX, y: (curH - 3) * TILE });

  for (let cx = 0; cx < wT; cx++) {
    if (gh[cx] < 0) continue;
    for (let cy = gh[cx]; cy < hT; cy++) if (G(cx, cy) === 0) S(cx, cy, 1);
  }

  for (const frac of [0.4, 0.7]) {
    let cx = Math.floor(wT * frac);
    while (cx < wT - 10 && gh[cx] < 0) cx++;
    if (gh[cx] >= 0) entities.push({ type: 'checkpoint', x: cx * TILE + 2, y: (gh[cx] - 2) * TILE - 4 });
  }

  const pool = BIOME_ANIMALS[biome];
  const totalW = pool.reduce((a, p) => a + p[1], 0);
  const nAnimals = 8 + Math.floor(stage / 3) + world * 2;
  const usable = flatCols.filter(c => c > 16 && c < wT - 8);
  for (let i = 0; i < nAnimals && usable.length; i++) {
    const c = usable[Math.floor(rnd() * usable.length)];
    let r = rnd() * totalW, id = pool[0][0];
    for (const [aid, w] of pool) { r -= w; if (r <= 0) { id = aid; break; } }
    const a = ANIMALS[id];
    const fly = a.behavior === 'fly' || a.behavior === 'dive';
    entities.push({ type: 'animal', id, x: c * TILE, y: (gh[c] - (fly ? 8 : 1)) * TILE - SPR[a.spr].h + (fly ? 0 : TILE) });
  }

  for (let i = 0; i < 14; i++) {
    const c = usable[Math.floor(rnd() * usable.length)] || 12;
    entities.push({ type: 'coin', x: c * TILE + 4, y: (gh[c] - 2) * TILE });
  }

  const decoList = DECOS[biome];
  for (const c of flatCols) {
    if (rnd() < 0.09 && c > 2 && c < wT - 6 && gh[c] >= 0) {
      const d = decoList[Math.floor(rnd() * decoList.length)];
      decos.push({ img: d, x: c * TILE, y: gh[c] * TILE - d.height });
    }
  }

  return {
    idx, world, stage, biome, wT, hT, grid, entities, decos,
    spawn: { x: 3 * TILE, y: (hT - 6) * TILE - 40 },
    exitX, isBoss: false,
  };
}

function genBossLevel(idx, world, biome, rnd) {
  const tier = bossTier(idx);
  const wT = 60, hT = 22;
  const grid = new Uint8Array(wT * hT);
  const entities = [], decos = [];
  const gh = hT - 5;
  const S = (x, y, v) => { if (y >= 0 && y < hT && x >= 0 && x < wT) grid[y * wT + x] = v; };

  for (let x = 0; x < wT; x++) for (let y = gh; y < hT; y++) S(x, y, 1);
  for (let x = 0; x < 2; x++) for (let y = gh - 14; y < gh; y++) S(x, y, 1);
  for (let x = wT - 2; x < wT; x++) for (let y = gh - 14; y < gh; y++) S(x, y, 1);
  for (const [px, py, pw] of [[12, gh - 4, 4], [28, gh - 6, 5], [44, gh - 4, 4]]) {
    for (let i = 0; i < pw; i++) S(px + i, py, 2);
  }
  const decoList = DECOS[biome];
  for (const dx of [4, 8, 50, 54]) {
    const d = decoList[Math.floor(rnd() * decoList.length)];
    decos.push({ img: d, x: dx * TILE, y: gh * TILE - d.height });
  }

  entities.push({ type: 'boss', bossIdx: world, tier, x: (wT - 12) * TILE, y: gh * TILE - 150 });

  return {
    idx, world, stage: levelStage(idx), biome, wT, hT, grid, entities, decos,
    spawn: { x: 5 * TILE, y: gh * TILE - 60 },
    exitX: Math.floor(wT / 2) * TILE, isBoss: true, tier,
  };
}
