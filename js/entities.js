'use strict';
// ============ ENTIDADES Y FÍSICA ============

const GRAV = 0.35;
const MAX_FALL = 7.5;

let LEVEL = null;   // nivel actual (lo fija game.js)
let GAME = null;    // estado global del juego (lo fija game.js)

function setPhysicsWorld(level, game) { LEVEL = level; GAME = game; }

function tileAt(px, py) {
  if (!LEVEL) return 0;
  const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
  if (tx < 0 || tx >= LEVEL.wT) return 1;      // paredes en los bordes
  if (ty < 0 || ty >= LEVEL.hT) return 0;      // cielo y abismo abiertos
  return LEVEL.grid[ty * LEVEL.wT + tx];
}

// Movimiento con colisión contra el grid + plataformas-entidad (GAME.plats)
function moveAndCollide(e) {
  e.hitWall = false;
  // --- horizontal ---
  e.x += e.vx;
  if (e.vx > 0) {
    const edge = e.x + e.w;
    for (const sy of [e.y + 1, e.y + e.h / 2, e.y + e.h - 1]) {
      if (tileAt(edge, sy) === 1) {
        e.x = Math.floor(edge / TILE) * TILE - e.w - 0.01;
        e.vx = 0; e.hitWall = true; break;
      }
    }
  } else if (e.vx < 0) {
    for (const sy of [e.y + 1, e.y + e.h / 2, e.y + e.h - 1]) {
      if (tileAt(e.x, sy) === 1) {
        e.x = (Math.floor(e.x / TILE) + 1) * TILE + 0.01;
        e.vx = 0; e.hitWall = true; break;
      }
    }
  }
  // --- vertical ---
  e.vy = Math.min(e.vy + GRAV, MAX_FALL);
  const oldFeet = e.y + e.h;
  e.y += e.vy;
  e.onGround = false;
  e.groundPlat = null;
  e.onIce = false;
  if (e.vy >= 0) {
    const feet = e.y + e.h;
    for (const sx of [e.x + 1, e.x + e.w - 1]) {
      const t = tileAt(sx, feet);
      const ty = Math.floor(feet / TILE);
      if (t === 1 || (t === 2 && !e.dropTimer && oldFeet <= ty * TILE + 4)) {
        e.y = ty * TILE - e.h;
        e.vy = 0; e.onGround = true;
        if (LEVEL.biome === 'artico' && t === 1) e.onIce = true;
        break;
      }
    }
    // plataformas móviles / que se desmoronan
    if (!e.onGround && GAME && GAME.plats) {
      for (const p of GAME.plats) {
        if (!p.solid) continue;
        const feet2 = e.y + e.h;
        if (e.x + e.w > p.x && e.x < p.x + p.w && oldFeet <= p.y + 5 && feet2 >= p.y && !e.dropTimer) {
          e.y = p.y - e.h;
          e.vy = 0; e.onGround = true; e.groundPlat = p;
          break;
        }
      }
    }
  } else {
    // cabeza contra el techo
    for (const sx of [e.x + 1, e.x + e.w - 1]) {
      if (tileAt(sx, e.y) === 1) {
        e.y = (Math.floor(e.y / TILE) + 1) * TILE + 0.01;
        e.vy = 0; break;
      }
    }
  }
  // picos
  e.touchSpike = false;
  for (const [sx, sy] of [[e.x + 2, e.y + e.h - 2], [e.x + e.w - 2, e.y + e.h - 2], [e.x + e.w / 2, e.y + e.h / 2]]) {
    if (tileAt(sx, sy) === 3) { e.touchSpike = true; break; }
  }
  if (e.dropTimer > 0) e.dropTimer--;
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ============ JUGADOR ============
class Player {
  constructor(idx, charIdx) {
    this.idx = idx;                  // 0 = P1 (WASD+F), 1 = P2 (flechas+L)
    this.charIdx = charIdx;
    this.def = CHARS[charIdx];
    this.w = 10; this.h = 17;
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.hp = this.maxHp();
    this.fireCd = 0;
    this.invuln = 0;
    this.dead = false;
    this.deadTimer = 0;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.jumpsLeft = 0;
    this.dropTimer = 0;
    this.animT = 0;
    this.muzzleT = 0;
    this.moto = false;       // item: moto turbo (absorbe un golpe)
    this.drink = false;      // item: bebida energética
    this.grenades = 0;       // item: granadas
    this.grenadeCd = 0;
    this.shield = 0;         // escudos del chaleco táctico
  }
  maxHp() { return this.def.hp + (GAME ? GAME.upg.hp : 0); }
  speed() {
    let s = 1.9 * this.def.speed * (1 + (GAME ? GAME.upg.speed : 0) * 0.08);
    if (this.moto) s *= 1.85;
    if (this.drink) s *= 1.6;
    return s;
  }
  jumpPow() { return 6.6 * this.def.jump * (this.moto ? 1.12 : 1); }
  weaponDef() {
    const id = GAME && GAME.weaponEq ? GAME.weaponEq[this.idx] : 'rifle_caza';
    return WEAPON_INDEX[id] || WEAPONS[0];
  }
  damage(wd) { return wd.dmg + (this.def.dmgBonus || 0) + (GAME ? GAME.upg.dmg : 0); }
  fireDelay(wd) { return Math.max(4, Math.round(wd.cd * (this.def.fireMod || 1) * Math.pow(0.85, GAME ? GAME.upg.firerate : 0))); }
  skin() { return GAME && GAME.skinEq ? (GAME.skinEq[this.idx] || 0) : 0; }

  // posición del arma y de la boca del cañón (según hacia dónde mira)
  muzzle() {
    const wd = this.weaponDef();
    const ws = SPR[wd.spr];
    const drawX = this.x - 7, drawY = this.y - 1;
    if (this.facing === 1) {
      const wx = drawX + HAND.x;
      return { x: wx + wd.mx, y: drawY + HAND.y + wd.my + 1, wx, wy: drawY + HAND.y };
    }
    const wx = drawX + 24 - HAND.x - ws.w;
    return { x: wx + (ws.w - 1 - wd.mx), y: drawY + HAND.y + wd.my + 1, wx, wy: drawY + HAND.y };
  }

  update(inp) {
    if (this.dead) { this.deadTimer--; return; }
    const acc = this.onIce ? 0.08 : 0.4;
    const fric = this.onIce ? 0.985 : (this.onGround ? 0.75 : 0.92);
    const top = this.speed();
    if (inp.left)  { this.vx -= acc; this.facing = -1; }
    if (inp.right) { this.vx += acc; this.facing = 1; }
    if (!inp.left && !inp.right) this.vx *= fric;
    this.vx = Math.max(-top, Math.min(top, this.vx));

    // salto con coyote time y buffer
    if (this.onGround) { this.coyote = 7; this.jumpsLeft = (GAME && GAME.upg.djump) ? 1 : 0; }
    else if (this.coyote > 0) this.coyote--;
    if (inp.jumpPressed) this.jumpBuf = 7;
    else if (this.jumpBuf > 0) this.jumpBuf--;

    if (this.jumpBuf > 0) {
      if (this.coyote > 0) {
        this.vy = -this.jumpPow(); this.coyote = 0; this.jumpBuf = 0;
        SFX.jump();
      } else if (this.jumpsLeft > 0) {
        this.vy = -this.jumpPow() * 0.92; this.jumpsLeft--; this.jumpBuf = 0;
        SFX.doubleJump();
        for (let i = 0; i < 6; i++) GAME.addParticle(this.x + this.w / 2, this.y + this.h, (Math.random() - 0.5) * 2, Math.random(), PAL.white, 20);
      }
    }
    if (!inp.jump && this.vy < -2.5) this.vy = -2.5;
    if (inp.down && inp.jumpPressed) this.dropTimer = 10;

    moveAndCollide(this);
    if (this.groundPlat) this.x += this.groundPlat.dx || 0;

    // disparo (según el arma equipada)
    if (this.fireCd > 0) this.fireCd--;
    if (inp.fire && this.fireCd <= 0 && !this.dead) {
      const wd = this.weaponDef();
      this.fireCd = this.fireDelay(wd);
      const dmg = this.damage(wd);
      const m = this.muzzle();
      if (wd.type === 'rocket') {
        GAME.bullets.push({
          x: m.x, y: m.y, vx: this.facing * wd.spd, vy: -1.2, grav: 0.09,
          rocket: true, aoe: wd.aoe, aoeDmg: wd.aoeDmg + GAME.upg.dmg,
          dmg, dist: 0, range: wd.range, owner: this.idx,
        });
        this.vx -= this.facing * 1.2;
        GAME.shake = Math.max(GAME.shake, 3);
        SFX.shootBig();
      } else {
        const n = wd.pellets || 1;
        for (let i = 0; i < n; i++) {
          const vy = (n > 1 ? (i - (n - 1) / 2) * 0.55 : 0) + (wd.grav ? -0.7 : 0);
          GAME.bullets.push({
            x: m.x, y: m.y, vx: this.facing * wd.spd, vy,
            grav: wd.grav || 0,
            pierce: (wd.pierce || 0) + (GAME.upg.pierce || 0),
            dmg, dist: 0, range: wd.range, owner: this.idx,
          });
        }
        this.vx -= this.facing * (n > 1 ? 0.8 : 0.3);
        wd.dmg >= 5 || n > 1 ? SFX.shootBig() : SFX.shoot();
      }
      this.muzzleT = 4;
      for (let i = 0; i < 3; i++) GAME.addParticle(m.x + this.facing * 2, m.y, this.facing * (1 + Math.random() * 2), (Math.random() - 0.5), PAL.yellow, 8);
    }
    if (this.muzzleT > 0) this.muzzleT--;
    if (this.invuln > 0) this.invuln--;
    if (this.touchSpike) this.hurt(1, -this.facing);

    // granadas (item): G para P1, K para P2
    if (this.grenadeCd > 0) this.grenadeCd--;
    if (inp.grenade && this.grenades > 0 && this.grenadeCd <= 0) {
      this.grenades--;
      this.grenadeCd = 45;
      const dmg = 6 + (GAME ? GAME.upg.dmg : 0);
      GAME.bullets.push({
        x: this.x + this.w / 2, y: this.y, vx: this.facing * 3.2, vy: -4.2, grav: 0.14,
        rocket: true, spr: 'granada_p', aoe: 60, aoeDmg: dmg, dmg,
        dist: 0, range: 9999, owner: this.idx,
      });
      SFX.throw_();
    }

    this.animT++;
  }

  hurt(dmg, dir) {
    if (this.invuln > 0 || this.dead) return;
    // la moto absorbe el golpe y escapa (como Yoshi)
    if (this.moto) {
      this.moto = false;
      this.invuln = 90;
      this.vx = (dir || -this.facing) * 2.2;
      GAME.addFloat(this.x, this.y - 12, '¡TU MOTO ESCAPÓ!', PAL.orange);
      for (let i = 0; i < 10; i++) GAME.addParticle(this.x + this.w / 2, this.y + this.h, (Math.random() - 0.5) * 3, -Math.random() * 2, PAL.gray, 25);
      SFX.crumble();
      return;
    }
    // el chaleco táctico absorbe golpes
    if (this.shield > 0) {
      this.shield--;
      this.invuln = 70;
      this.vx = (dir || -this.facing) * 2.4;
      this.vy = -2.5;
      GAME.addFloat(this.x, this.y - 12, '¡ESCUDO!', PAL.cyan);
      for (let i = 0; i < 6; i++) GAME.addParticle(this.x + this.w / 2, this.y + this.h / 2, (Math.random() - 0.5) * 3, -Math.random() * 2, PAL.cyan, 20);
      SFX.hitAnimal();
      return;
    }
    this.hp -= dmg;
    this.invuln = 80;
    this.vx = (dir || -this.facing) * 2.8;
    this.vy = -3;
    SFX.hurt();
    GAME.shake = 6;
    for (let i = 0; i < 8; i++) GAME.addParticle(this.x + this.w / 2, this.y + this.h / 2, (Math.random() - 0.5) * 3, -Math.random() * 2, PAL.red, 25);
    if (this.hp <= 0) {
      this.dead = true;
      this.deadTimer = 240;
      SFX.dead();
    }
  }

  respawn(x, y) {
    this.dead = false;
    this.hp = Math.max(2, Math.ceil(this.maxHp() / 2));
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.invuln = 120;
  }

  draw(g) {
    if (this.dead) return;
    if (this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0) return;
    let frame = 0;
    if (!this.onGround) frame = 3;
    else if (Math.abs(this.vx) > 0.4) frame = 1 + (Math.floor(this.animT / 7) % 2);
    const drawX = this.x - 7, drawY = this.y - 1 - (this.moto ? 5 : 0);
    if (this.moto) {
      drawSpr(g, 'moto', Math.abs(this.vx) > 0.4 ? Math.floor(this.animT / 5) % 2 : 0, this.x - 7, this.y + 3, this.facing === -1);
    }
    drawSpr(g, 'char_' + this.def.id + '_' + this.skin(), frame, drawX, drawY, this.facing === -1);
    // arma en la mano
    const wd = this.weaponDef();
    const m = this.muzzle();
    drawSpr(g, wd.spr, 0, m.wx, m.wy, this.facing === -1);
    if (this.muzzleT > 0) {
      g.fillStyle = PAL.yellow;
      g.fillRect(m.x - 1 + this.facing * 2, m.y - 2, 4, 4);
      g.fillStyle = PAL.white;
      g.fillRect(m.x + this.facing * 2, m.y - 1, 2, 2);
    }
  }
}

// ============ ANIMAL ============
class Animal {
  constructor(id, x, y) {
    this.id = id;
    this.def = ANIMALS[id];
    const s = SPR[this.def.spr];
    this.w = Math.max(8, s.w - 6);
    this.h = s.h;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.hp = this.def.hp;
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.dead = false;
    this.collected = false;
    this.flash = 0;
    this.animT = Math.floor(Math.random() * 60);
    this.stateT = 0;
    this.fleeing = 0;
    this.fly = this.def.behavior === 'fly' || this.def.behavior === 'dive';
    this.baseY = y;
    this.diving = 0;
    this.throwCd = 60 + Math.random() * 60;
  }

  nearestPlayer() {
    let best = null, bd = 1e9;
    for (const p of GAME.players) {
      if (p.dead) continue;
      const d = Math.abs(p.x - this.x) + Math.abs(p.y - this.y) * 0.5;
      if (d < bd) { bd = d; best = p; }
    }
    return { p: best, d: bd };
  }

  update() {
    this.animT++;
    if (this.flash > 0) this.flash--;
    if (this.dead) {
      if (!this.onGround) { this.vx *= 0.9; moveAndCollide(this); }
      return;
    }
    const { p, d } = this.nearestPlayer();
    const b = this.def.behavior;

    if (this.fly) {
      if (b === 'dive' && p) {
        if (this.diving > 0) {
          this.diving--;
          this.x += this.vx; this.y += this.vy;
          if (this.diving === 0 || this.y > this.baseY + 90) { this.vy = -1.2; }
        } else if (d < 110 && Math.abs(p.y - this.y) < 120 && Math.random() < 0.01) {
          this.diving = 50;
          const dx = (p.x - this.x), dy = (p.y - this.y);
          const len = Math.hypot(dx, dy) || 1;
          this.vx = dx / len * 2.2; this.vy = dy / len * 2.2;
          this.facing = dx > 0 ? 1 : -1;
        } else {
          if (this.y > this.baseY) this.y -= 0.8; else this.y = this.baseY + Math.sin(this.animT / 25) * 6;
          this.x += this.facing * this.def.speed * 0.6;
          if (this.x < 16 || this.x > LEVEL.wT * TILE - 32 || Math.random() < 0.004) this.facing *= -1;
        }
      } else {
        this.y = this.baseY + Math.sin(this.animT / 25) * 6;
        this.x += this.facing * this.def.speed * 0.6;
        if (this.x < 16 || this.x > LEVEL.wT * TILE - 32 || Math.random() < 0.004) this.facing *= -1;
      }
      return;
    }

    // la rana se mueve a saltos
    if (b === 'hop') {
      if (this.onGround) {
        this.vx = 0;
        if (this.stateT-- <= 0) {
          this.stateT = 40 + Math.random() * 60;
          const dir = (p && d < 90) ? (p.x > this.x ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
          this.facing = dir;
          this.vy = -4.2;
          this.vx = dir * this.def.speed * 1.7;
        }
      }
      moveAndCollide(this);
      if (this.hitWall) this.facing *= -1;
      return;
    }

    // terrestres
    let want = 0;
    if (this.fleeing > 0) {
      this.fleeing--;
      want = this.facing * this.def.speed * 1.9;
    } else if (b === 'flee') {
      if (p && d < 85) { this.facing = p.x > this.x ? -1 : 1; this.fleeing = 70; }
      else if (this.stateT-- <= 0) { this.stateT = 40 + Math.random() * 80; this.facing = Math.random() < 0.5 ? -1 : 1; if (Math.random() < 0.4) this.facing = 0; }
      want = this.facing * this.def.speed * 0.5;
    } else if (b === 'chase') {
      if (p && d < 130) {
        this.facing = p.x > this.x ? 1 : -1;
        want = this.facing * this.def.speed * 1.4;
        if (this.hitWall && this.onGround) this.vy = -5;
      } else {
        if (this.stateT-- <= 0) { this.stateT = 50 + Math.random() * 60; this.facing *= Math.random() < 0.6 ? -1 : 1; }
        want = this.facing * this.def.speed * 0.4;
      }
    } else if (b === 'patrol') {
      want = this.facing * this.def.speed * 0.6;
    } else if (b === 'throw') {
      if (p && d < 150) {
        this.facing = p.x > this.x ? 1 : -1;
        if (--this.throwCd <= 0) {
          this.throwCd = 110 + Math.random() * 50;
          const dx = p.x - this.x;
          GAME.eprojs.push({ x: this.x + this.w / 2, y: this.y, vx: dx / 60, vy: -4.5, w: 6, h: 6, spr: 'coco', grav: true, dmg: 1 });
          SFX.throw_();
        }
      }
      want = 0;
    }

    if (want !== 0 && this.onGround && this.fleeing <= 0) {
      const aheadX = want > 0 ? this.x + this.w + 4 : this.x - 4;
      if (tileAt(aheadX, this.y + this.h + 8) === 0 && tileAt(aheadX, this.y + this.h + 24) === 0) {
        this.facing *= -1; want = -want;
      }
    }
    this.vx = want;
    if (this.facing !== 0 && want !== 0) this.facing = want > 0 ? 1 : -1;
    moveAndCollide(this);
    if (this.hitWall) this.facing *= -1;
  }

  hit(dmg, fromDir) {
    if (this.dead) return;
    this.hp -= dmg;
    this.flash = 6;
    if (this.def.behavior === 'flee' || this.def.behavior === 'throw' || this.def.behavior === 'hop') {
      this.facing = fromDir > 0 ? 1 : -1;
      this.fleeing = 90;
    }
    if (this.hp <= 0) this.die();
    else SFX.hitAnimal();
  }

  die() {
    this.dead = true;
    this.vx = 0;
    SFX.animalDie();
    for (let i = 0; i < 10; i++) GAME.addParticle(this.x + this.w / 2, this.y + this.h / 2, (Math.random() - 0.5) * 3, -Math.random() * 2.5, Math.random() < 0.5 ? PAL.red : PAL.blood, 30);
    const nCoins = this.def.coins + (GAME.upg.suerte || 0); // pata de conejo
    for (let i = 0; i < nCoins; i++) {
      GAME.drops.push({ type: 'coin', x: this.x + this.w / 2, y: this.y, vx: (Math.random() - 0.5) * 2.5, vy: -2 - Math.random() * 2, t: 0 });
    }
  }

  draw(g) {
    const s = SPR[this.def.spr];
    const frame = Math.abs(this.vx) > 0.05 || this.fly ? Math.floor(this.animT / 9) % 2 : 0;
    const dx = this.x - (s.w - this.w) / 2, dy = this.y + this.h - s.h;
    if (this.dead) {
      g.save();
      g.globalAlpha = 0.9;
      drawSprV(g, this.def.spr, 0, dx, dy, this.facing === -1);
      g.restore();
      g.fillStyle = PAL.blood;
      g.fillRect(Math.round(dx + 2), Math.round(this.y + this.h - 1), s.w - 4, 1);
      const t = Math.floor(Date.now() / 300) % 2;
      if (t === 0) {
        g.fillStyle = PAL.yellow;
        const ax = Math.round(dx + s.w / 2);
        const ay = Math.round(dy - 8);
        g.fillRect(ax - 1, ay, 2, 4);
        g.fillRect(ax - 3, ay + 2, 6, 2);
        g.fillRect(ax - 2, ay + 4, 4, 1);
      }
      return;
    }
    if (this.flash > 0) {
      g.save();
      g.globalAlpha = 0.6;
      g.fillStyle = PAL.white;
      g.fillRect(Math.round(dx), Math.round(dy), s.w, s.h);
      g.restore();
    }
    drawSpr(g, this.def.spr, frame, dx, dy, this.facing === -1);
  }
}

// ============ BOSS ============
// tier 1-3: más vida, más velocidad, ataques extra. Bajo 50% de vida entra en FURIA.
class Boss {
  constructor(bossIdx, x, y, tier) {
    this.def = BOSSES[bossIdx];
    this.bossIdx = bossIdx;
    this.tier = tier || 1;
    this.w = this.def.w; this.h = this.def.h;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    const mult = (1 + 0.5 * (this.tier - 1)) * (GAME && GAME.players.length > 1 ? 1.4 : 1);
    this.hp = Math.round(this.def.hp * mult);
    this.maxHpV = this.hp;
    this.spd = this.def.speed + 0.3 * (this.tier - 1);
    this.fly = !!this.def.fly;
    this.attacks = this.def.attacks.slice();
    if (this.tier >= 2 && this.def.proj && !this.attacks.includes('volley')) this.attacks.push('volley');
    if (this.tier >= 3) this.attacks.push(this.def.minion ? 'summon' : (this.fly ? 'dive' : 'slam'));
    this.facing = -1;
    this.state = 'intro';
    this.stateT = 90;
    this.flash = 0;
    this.animT = 0;
    this.attackN = 0;
    this.dead = false;
    this.underground = false;
    this.dvx = 0; this.dvy = 0;
  }

  get enraged() { return this.hp < this.maxHpV * 0.5; }
  groundY() { return (LEVEL.hT - 5) * TILE; }

  target() {
    let best = null, bd = 1e9;
    for (const p of GAME.players) {
      if (p.dead) continue;
      const d = Math.abs(p.x - this.x);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  hover(t) {
    const targetY = this.groundY() - 125 + Math.sin(this.animT / 22) * 12;
    this.y += (targetY - this.y) * 0.06;
    if (t) {
      this.x += Math.sign(t.x - this.x) * this.spd * 0.6;
      this.facing = t.x > this.x ? 1 : -1;
    }
  }

  update() {
    this.animT++;
    if (this.flash > 0) this.flash--;
    if (this.dead) {
      this.deadT = (this.deadT || 0) + 1;
      // los voladores caen al morir
      if (this.fly && this.y + this.h < this.groundY()) this.y += 3;
      return;
    }
    this.x = Math.max(3 * TILE, Math.min((LEVEL.wT - 3) * TILE - this.w, this.x));
    const t = this.target();
    this.stateT--;
    const fury = this.enraged ? 1 : 0;

    switch (this.state) {
      case 'intro':
        if (this.fly) this.hover(null);
        else moveAndCollide(this);
        if (this.stateT <= 0) this.next();
        break;
      case 'idle':
        if (this.fly) this.hover(t);
        else { this.vx *= 0.8; moveAndCollide(this); if (t) this.facing = t.x > this.x ? 1 : -1; }
        if (this.stateT <= 0) this.pickAttack();
        break;
      case 'telegraph':
        if (this.fly) this.hover(null);
        else { this.vx = 0; moveAndCollide(this); }
        if (this.stateT <= 0) this.startAttack();
        break;
      case 'charge':
        if (this.fly) {
          this.x += this.facing * (2.4 + this.spd + fury * 0.8);
          if (this.x <= 3 * TILE + 1 || this.x + this.w >= (LEVEL.wT - 3) * TILE - 1 || this.stateT <= 0) { GAME.shake = 8; SFX.bossHit(); this.next(); }
        } else {
          this.vx = this.facing * (2.2 + this.spd + fury * 0.8);
          moveAndCollide(this);
          if (this.hitWall || this.stateT <= 0) { GAME.shake = 8; SFX.bossHit(); this.next(); }
        }
        break;
      case 'pounce':
        moveAndCollide(this);
        if (this.onGround && this.vy >= 0 && this.stateT < 40) { GAME.shake = 10; this.next(); }
        break;
      case 'dive': {
        this.x += this.dvx; this.y += this.dvy;
        if (this.y + this.h >= this.groundY()) {
          this.y = this.groundY() - this.h;
          if (this.dvy > 0) { GAME.shake = 10; SFX.bossHit(); }
          this.dvy = -Math.abs(this.dvy) * 0.9;
        }
        if (this.stateT <= 0) this.next();
        break;
      }
      case 'slamRise':
        this.vy = -7.5;
        this.x += this.facing * 2;
        this.y += this.vy;
        if (this.stateT <= 0) { this.state = 'slamFall'; this.stateT = 200; this.vy = 1; }
        break;
      case 'slamFall': {
        this.vy = Math.min(this.vy + 0.5, 9);
        this.y += this.vy;
        const gy = this.groundY();
        if (this.y + this.h >= gy) {
          this.y = gy - this.h;
          GAME.shake = 14;
          SFX.bossRoar();
          const n = 5 + this.bossIdx + this.tier + fury * 2;
          for (let i = 0; i < n; i++) {
            GAME.eprojs.push({
              x: 40 + Math.random() * (LEVEL.wT * TILE - 80),
              y: GAME.camY - 10 - Math.random() * 60,
              vx: 0, vy: 1 + Math.random(), w: 7, h: 7,
              spr: this.def.proj || 'rock', grav: true, dmg: 1,
            });
          }
          this.next();
        }
        break;
      }
      case 'volley': {
        if (this.fly) this.hover(null);
        else moveAndCollide(this);
        const interval = Math.max(10, 22 - this.tier * 3 - fury * 4);
        if (this.stateT % interval === 0 && t) {
          const dx = t.x - this.x, dist = Math.abs(dx) || 1;
          GAME.eprojs.push({
            x: this.x + this.w / 2, y: this.y + this.h * 0.3,
            vx: (dx / dist) * (2.6 + fury * 0.6), vy: this.fly ? 0.5 : -3 - Math.random() * 1.5,
            w: 7, h: 6, spr: this.def.proj || 'stinger', grav: !this.fly, dmg: 1,
          });
          SFX.throw_();
        }
        if (this.stateT <= 0) this.next();
        break;
      }
      case 'roar': {
        moveAndCollide(this);
        if (this.stateT % (30 - fury * 8) === 0 && t) {
          GAME.eprojs.push({
            x: this.x + (this.facing === 1 ? this.w : -10), y: this.y + this.h * 0.35,
            vx: this.facing * (2.2 + fury * 0.6), vy: 0, w: 10, h: 10, spr: 'roarwave', grav: false, dmg: 1,
          });
          SFX.bossRoar();
        }
        if (this.stateT <= 0) this.next();
        break;
      }
      case 'summon': {
        if (this.fly) this.hover(null);
        else { this.vx = 0; moveAndCollide(this); }
        if (this.stateT === 30 && this.def.minion) {
          SFX.bossRoar();
          const nMin = GAME.animals.filter(a => !a.dead && a.summoned).length;
          if (nMin < 2 + this.tier) {
            for (const off of [-50, 50]) {
              const a = new Animal(this.def.minion, this.x + off, this.y);
              a.summoned = true;
              if (a.fly) a.baseY = this.groundY() - 90;
              GAME.animals.push(a);
            }
          }
        }
        if (this.stateT <= 0) this.next();
        break;
      }
      case 'burrowDown':
        this.y += 1.5;
        this.underground = true;
        if (this.stateT <= 0) { this.state = 'burrowMove'; this.stateT = 60 - fury * 15; }
        break;
      case 'burrowMove':
        if (t) this.x += (t.x - this.w / 2 - this.x) * 0.06;
        if (this.stateT <= 0) { this.state = 'burrowUp'; this.stateT = 30; GAME.shake = 6; }
        break;
      case 'burrowUp': {
        const gy = this.groundY();
        this.y = Math.max(gy - this.h, this.y - 4);
        if (this.stateT <= 0) {
          this.underground = false;
          for (let i = -2 - fury; i <= 2 + fury; i++) {
            GAME.eprojs.push({ x: this.x + this.w / 2, y: this.y, vx: i * 1.2, vy: -4, w: 7, h: 6, spr: this.def.proj || 'stinger', grav: true, dmg: 1 });
          }
          this.next();
        }
        break;
      }
    }
  }

  next() {
    this.state = 'idle';
    let base = Math.max(18, 55 - this.tier * 8 - (this.enraged ? 14 : 0));
    if (this.hp < this.maxHpV * 0.25) base = Math.max(10, base - 10); // furia total
    this.stateT = base + Math.random() * 30;
  }

  pickAttack() {
    const atk = this.attacks[this.attackN % this.attacks.length];
    this.attackN++;
    this.pending = atk;
    this.state = 'telegraph';
    this.stateT = Math.max(14, 35 - 7 * (this.tier - 1) - (this.enraged ? 6 : 0));
    const t = this.target();
    if (t) this.facing = t.x > this.x ? 1 : -1;
  }

  startAttack() {
    const a = this.pending;
    const fury = this.enraged ? 1 : 0;
    if (a === 'charge')      { this.state = 'charge'; this.stateT = 90; SFX.bossRoar(); }
    else if (a === 'pounce') { this.state = 'pounce'; this.stateT = 120; this.vy = -8; this.vx = this.facing * (3 + fury); }
    else if (a === 'slam')   { this.state = 'slamRise'; this.stateT = 30; }
    else if (a === 'volley') { this.state = 'volley'; this.stateT = 88 + this.tier * 10; }
    else if (a === 'roar')   { this.state = 'roar'; this.stateT = 90; }
    else if (a === 'summon') { this.state = 'summon'; this.stateT = 60; }
    else if (a === 'burrow') { this.state = 'burrowDown'; this.stateT = 40; }
    else if (a === 'dive') {
      const t = this.target();
      const tx = t ? t.x : this.x, gy = this.groundY();
      this.state = 'dive';
      this.stateT = 70;
      this.dvx = (tx - this.x) / 32;
      this.dvy = Math.max(2.5, (gy - this.h - this.y) / 26 + fury);
      SFX.bossRoar();
    }
    else this.next();
  }

  hit(dmg) {
    if (this.dead || this.underground || this.state === 'intro') return false;
    this.hp -= dmg;
    this.flash = 5;
    SFX.bossHit();
    if (this.hp <= 0) {
      this.dead = true;
      SFX.bossDie();
      GAME.shake = 20;
      GAME.onBossDead(this);
    }
    return true;
  }

  draw(g) {
    if (this.underground) {
      g.fillStyle = PAL.dsand;
      for (let i = 0; i < 5; i++) {
        g.fillRect(Math.round(this.x + Math.random() * this.w), Math.round(this.groundY() - 3 - Math.random() * 4), 2, 2);
      }
      return;
    }
    if (this.dead && this.deadT > 90) return;
    const s = SPR[this.def.spr];
    const frame = (Math.abs(this.vx) > 0.3 || this.fly) ? Math.floor(this.animT / 8) % 2 : 0;
    const sc = this.def.scale;
    const dx = this.x - (s.w * sc - this.w) / 2;
    const dy = this.y + this.h - s.h * sc;
    const wob = this.state === 'telegraph' ? Math.round(Math.sin(this.animT * 1.6) * 2) : 0;
    if (this.flash > 0) g.globalAlpha = 0.55;
    if (this.dead) g.globalAlpha = Math.max(0, 1 - this.deadT / 90);
    // aura de furia
    if (this.enraged && !this.dead && this.animT % 6 < 3) {
      g.globalAlpha = 0.25;
      g.fillStyle = PAL.red;
      g.fillRect(Math.round(dx), Math.round(dy), Math.round(s.w * sc), Math.round(s.h * sc));
      g.globalAlpha = this.flash > 0 ? 0.55 : 1;
    }
    const img = this.facing === -1 ? s.flip[frame] : s.frames[frame];
    g.drawImage(img, Math.round(dx + wob), Math.round(dy), Math.round(s.w * sc), Math.round(s.h * sc));
    g.globalAlpha = 1;
  }
}

// ============ MASCOTA ============
// Sigue al equipo, ataca animales agresivos y jefes, nunca muere por caídas.
// rec: registro persistente {species, hp, bonus, armor, turret}
class Pet {
  constructor(rec, x, y) {
    this.rec = rec;
    this.species = rec.species;
    this.def = ANIMALS[rec.species];
    const s = SPR[this.def.spr];
    this.w = Math.max(8, s.w - 6);
    this.h = s.h;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.maxHp = this.def.hp + rec.bonus;
    this.hp = Math.max(1, Math.min(rec.hp, this.maxHp));
    this.shield = rec.armor ? 4 : 0;
    this.facing = 1;
    this.dead = false;
    this.invuln = 0;
    this.animT = Math.floor(Math.random() * 60);
    this.atkCd = 0;
    this.turretCd = 0;
    this.hurtShowT = 0;
    this.fly = this.def.behavior === 'fly' || this.def.behavior === 'dive';
  }

  owner() {
    let best = null, bd = 1e9;
    for (const p of GAME.players) {
      if (p.dead) continue;
      const d = Math.abs(p.x - this.x);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  targetEnemy() {
    let best = null, bd = 1e9;
    for (const a of GAME.animals) {
      if (a.dead || a.def.dmg === 0) continue;
      const d = Math.abs(a.x - this.x) + Math.abs(a.y - this.y);
      if (d < bd) { bd = d; best = a; }
    }
    if (GAME.boss && !GAME.boss.dead && !GAME.boss.underground && GAME.boss.state !== 'intro') {
      const b = GAME.boss;
      const d = Math.abs(b.x - this.x);
      if (d < bd) { bd = d; best = b; }
    }
    return bd < 150 ? best : null;
  }

  dmgOut() { return Math.max(1, Math.ceil(this.def.hp / 3)); }

  update() {
    this.animT++;
    if (this.invuln > 0) this.invuln--;
    if (this.atkCd > 0) this.atkCd--;
    if (this.turretCd > 0) this.turretCd--;
    if (this.hurtShowT > 0) this.hurtShowT--;
    if (this.dead) return;

    const own = this.owner();
    const enemy = this.targetEnemy();

    // torreta automática
    if (this.rec.turret && this.turretCd <= 0) {
      let tgt = null, bd = 1e9;
      for (const a of GAME.animals) {
        if (a.dead || a.def.dmg === 0) continue;
        const d = Math.hypot(a.x - this.x, a.y - this.y);
        if (d < bd && d < 210) { bd = d; tgt = a; }
      }
      if (!tgt && GAME.boss && !GAME.boss.dead && !GAME.boss.underground && GAME.boss.state !== 'intro') {
        const d = Math.hypot(GAME.boss.x - this.x, GAME.boss.y - this.y);
        if (d < 240) tgt = GAME.boss;
      }
      if (tgt) {
        this.turretCd = 45;
        const dx = (tgt.x + tgt.w / 2) - (this.x + this.w / 2);
        const dy = (tgt.y + tgt.h / 2) - (this.y);
        const len = Math.hypot(dx, dy) || 1;
        GAME.bullets.push({
          x: this.x + this.w / 2, y: this.y - 2,
          vx: dx / len * 7, vy: dy / len * 2.5,
          dmg: 1 + Math.floor(GAME.upg.dmg / 2), dist: 0, range: 260, owner: 'pet',
        });
        SFX.shoot();
      }
    }

    // decidir a dónde ir: al enemigo o al dueño
    let goal = null;
    if (enemy && this.atkCd <= 0) goal = enemy;
    else if (own) goal = own;

    if (this.fly) {
      // mascotas voladoras: flotan directo hacia el objetivo
      if (goal) {
        const tx = goal.x + goal.w / 2 - this.w / 2;
        const ty = goal.y - 14;
        this.x += Math.max(-2.2, Math.min(2.2, (tx - this.x) * 0.05));
        this.y += Math.max(-2, Math.min(2, (ty - this.y) * 0.05)) + Math.sin(this.animT / 18) * 0.4;
        this.facing = tx > this.x ? 1 : -1;
      }
    } else if (goal) {
      const dx = goal.x + goal.w / 2 - (this.x + this.w / 2);
      if (Math.abs(dx) > (goal === own ? 26 : 4)) {
        this.vx = Math.sign(dx) * this.def.speed * 1.5;
        this.facing = Math.sign(dx);
      } else this.vx *= 0.7;
      // salta obstáculos o para alcanzar al dueño
      if (this.onGround && (this.hitWall || (goal.y < this.y - 40 && Math.abs(dx) < 60))) this.vy = -6.2;
      moveAndCollide(this);
    } else {
      this.vx *= 0.8;
      moveAndCollide(this);
    }

    // nunca muere por caer: se teletransporta con su dueño
    if (own && (this.y > LEVEL.hT * TILE + 20 || Math.abs(own.x - this.x) > 340)) {
      this.x = own.x; this.y = own.y - 20; this.vx = 0; this.vy = 0;
    }

    // ataque de contacto al enemigo
    if (enemy && this.atkCd <= 0 && aabb(this, enemy)) {
      this.atkCd = 35;
      if (enemy instanceof Boss) enemy.hit(this.dmgOut());
      else enemy.hit(this.dmgOut(), this.facing);
      this.vx = -this.facing * 2;
      if (!this.fly) this.vy = -2.5;
      GAME.addParticle(this.x + this.w / 2, this.y, this.facing, -1, PAL.yellow, 15);
    }
  }

  hurt(dmg) {
    if (this.invuln > 0 || this.dead) return;
    this.invuln = 60;
    this.hurtShowT = 120;
    if (this.shield > 0) { this.shield--; SFX.hitAnimal(); return; }
    this.hp -= dmg;
    SFX.hitAnimal();
    for (let i = 0; i < 6; i++) GAME.addParticle(this.x + this.w / 2, this.y + this.h / 2, (Math.random() - 0.5) * 2.5, -Math.random() * 2, PAL.red, 20);
    if (this.hp <= 0) {
      this.dead = true;
      GAME.onPetDead(this);
    }
  }

  draw(g) {
    if (this.dead) return;
    if (this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0) return;
    const s = SPR[this.def.spr];
    const frame = (Math.abs(this.vx) > 0.05 || this.fly) ? Math.floor(this.animT / 8) % 2 : 0;
    const dx = this.x - (s.w - this.w) / 2, dy = this.y + this.h - s.h;
    drawSpr(g, this.def.spr, frame, dx, dy, this.facing === -1);
    // collar dorado para distinguirla
    g.fillStyle = PAL.gold;
    g.fillRect(Math.round(dx + s.w / 2 - 2), Math.round(dy - 3), 4, 2);
    // armadura: banda de metal
    if (this.rec.armor) {
      g.fillStyle = PAL.lgray;
      g.fillRect(Math.round(dx + 2), Math.round(dy + Math.floor(s.h / 2)), s.w - 4, 2);
    }
    // torreta montada
    if (this.rec.turret) {
      g.fillStyle = PAL.dgray;
      g.fillRect(Math.round(dx + s.w / 2 - 3), Math.round(dy - 8), 6, 4);
      g.fillRect(Math.round(dx + s.w / 2 + (this.facing === 1 ? 3 : -6)), Math.round(dy - 7), 3, 2);
    }
    // corazones cuando la lastiman
    if (this.hurtShowT > 0) {
      for (let i = 0; i < this.maxHp; i++) {
        drawSpr(g, i < this.hp ? 'heart' : 'heart_empty', 0, Math.round(dx + s.w / 2 - this.maxHp * 4 + i * 8), Math.round(dy - 16));
      }
    }
  }
}
