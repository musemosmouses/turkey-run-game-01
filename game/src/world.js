// world.js — the road itself: zones, scrolling, spawning and collisions.
// Hazards and pickups scroll left past the turkey; the world owns their
// lists, their timers and every hit test against the turkey.

import {
  BASE_SPEED,
  DASH_SPEED,
  GROUND_Y,
  HAZARDS,
  MAX_SPEED,
  METERS_PER_PIXEL,
  RUN_LENGTH_M,
  VIEW_W,
  zoneFor,
} from './config.js';
import { Rng } from './rng.js';

const SPAWN_X = VIEW_W + 80;

export class World {
  constructor(seed) {
    this.rng = new Rng(seed || 20261127);
    this.reset();
  }

  reset() {
    this.distance = 0;
    this.speed = BASE_SPEED;
    this.hazards = [];
    this.pickups = [];
    this.particles = [];
    this.spawnTimer = 1.1;
    this.zone = zoneFor(0);
    this.zoneBanner = '';
    this.bannerTimer = 0;
    this.time = 0;
    this.finished = false;
  }

  get zoneName() {
    return this.zone.name;
  }

  // World speed grows with distance, and a dash doubles it briefly.
  currentSpeed(turkey) {
    const progress = Math.min(1, this.distance / RUN_LENGTH_M);
    let speed = BASE_SPEED + (MAX_SPEED - BASE_SPEED) * progress;
    if (turkey && turkey.dashing) speed = DASH_SPEED;
    return speed;
  }

  showBanner(text) {
    this.zoneBanner = text;
    this.bannerTimer = 2.4;
  }

  burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x,
        y,
        vx: this.rng.range(-160, 60),
        vy: this.rng.range(-260, -40),
        life: this.rng.range(0.4, 0.9),
        max: 0.9,
        color,
        size: this.rng.range(3, 7),
      });
    }
  }

  addHazard(kind, x) {
    const def = HAZARDS[kind];
    const hazard = {
      kind,
      x: x === undefined ? SPAWN_X : x,
      y: GROUND_Y,
      w: def.w,
      h: def.h,
      passed: false,
      phase: this.rng.range(0, Math.PI * 2),
      // Ovens breathe fire on a cycle: jet on, then off.
      jetOn: false,
      jetTimer: this.rng.range(0.4, 1.4),
      roll: 0,
    };
    this.hazards.push(hazard);
    return hazard;
  }

  addPickup(kind, x, y) {
    const pickup = {
      kind,
      x: x === undefined ? SPAWN_X : x,
      y: y === undefined ? GROUND_Y - 34 : y,
      taken: false,
      bob: this.rng.range(0, Math.PI * 2),
    };
    this.pickups.push(pickup);
    return pickup;
  }

  spawnPattern() {
    const zone = this.zone;
    const kind = this.rng.pick(zone.hazards);
    this.addHazard(kind);

    // Corn trails reward the jump arc over a fence or pumpkin.
    if (kind === 'fence' || kind === 'pumpkin') {
      const base = SPAWN_X + 30;
      this.addPickup('corn', base - 40, GROUND_Y - 130);
      this.addPickup('corn', base, GROUND_Y - 150);
      this.addPickup('corn', base + 40, GROUND_Y - 130);
    } else if (this.rng.chance(0.55)) {
      this.addPickup('corn', SPAWN_X + this.rng.range(0, 120), GROUND_Y - 34);
    }

    // Rare treats: a golden corn or a feather shield, never both at once.
    const roll = this.rng.float();
    if (roll < 0.08) {
      this.addPickup('golden', SPAWN_X + 180, GROUND_Y - 120);
    } else if (roll < 0.16) {
      this.addPickup('feather', SPAWN_X + 180, GROUND_Y - 110);
    }
  }

  // The nearest hay bale the turkey could dive into right now, if any.
  hayBaleNear(turkey) {
    for (const hazard of this.hazards) {
      if (hazard.kind !== 'haybale') continue;
      const dx = Math.abs(hazard.x - turkey.x);
      if (dx < 70 && turkey.onGround) return hazard;
    }
    return null;
  }

  update(dt, turkey, farmer, sfx) {
    this.time += dt;
    const speed = this.currentSpeed(turkey);
    this.speed = speed;
    this.distance += speed * dt * METERS_PER_PIXEL;

    // Zone change: announce it and re-skin the world.
    const nextZone = zoneFor(this.distance);
    if (nextZone.id !== this.zone.id) {
      this.zone = nextZone;
      this.showBanner(nextZone.banner);
      if (sfx) sfx.gobble();
    }
    if (this.bannerTimer > 0) this.bannerTimer -= dt;

    if (this.distance >= RUN_LENGTH_M) {
      this.finished = true;
      return;
    }

    // Spawning: faster as the run goes on, but never a wall of hazards.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnPattern();
      const progress = Math.min(1, this.distance / RUN_LENGTH_M);
      this.spawnTimer = this.rng.range(1.3, 1.9) - progress * 0.35;
    }

    // Scroll everything left at world speed.
    for (const hazard of this.hazards) {
      hazard.x -= speed * dt;
      if (hazard.kind === 'pumpkin') hazard.roll += (speed * dt) / 28;
      if (hazard.kind === 'knife') hazard.phase += dt * 3.2;
      if (hazard.kind === 'oven') {
        hazard.jetTimer -= dt;
        if (hazard.jetTimer <= 0) {
          hazard.jetOn = !hazard.jetOn;
          hazard.jetTimer = hazard.jetOn ? 1.1 : 1.5;
          if (hazard.jetOn && sfx) sfx.hiss();
        }
      }
      // A hazard safely passed is a small breather: the gap opens a touch.
      if (!hazard.passed && hazard.x + hazard.w < turkey.x - 40) {
        hazard.passed = true;
        farmer.setGap(farmer.gap + 6);
      }
    }
    this.hazards = this.hazards.filter((h) => h.x > -160);

    for (const pickup of this.pickups) {
      pickup.x -= speed * dt;
      pickup.bob += dt * 5;
    }
    this.pickups = this.pickups.filter((p) => p.x > -60 && !p.taken);

    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 900 * dt;
      particle.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  // Hit tests for one frame. Returns a list of events for main.js to
  // score: 'corn', 'golden', 'feather', 'hit', 'hide'. A hidden turkey
  // cannot be hit and cannot collect.
  collide(turkey, farmer) {
    const events = [];
    if (turkey.hidden) return events;
    const box = turkey.box;

    for (const pickup of this.pickups) {
      if (pickup.taken) continue;
      const px = pickup.x;
      const py = pickup.y + Math.sin(pickup.bob) * 4;
      if (
        px > box.x - 16 && px < box.x + box.w + 16 &&
        py > box.y - 16 && py < box.y + box.h + 16
      ) {
        pickup.taken = true;
        if (pickup.kind === 'corn') events.push('corn');
        else if (pickup.kind === 'golden') events.push('golden');
        else if (pickup.kind === 'feather') events.push('feather');
        this.burst(px, py, pickup.kind === 'golden' ? '#ffd60a' : '#ffe08a', 8);
      }
    }

    for (const hazard of this.hazards) {
      if (this.hitHazard(hazard, box)) {
        events.push('hit');
        this.burst(box.x + box.w / 2, box.y + 20, '#ffffff', 14);
        break;
      }
    }
    return events;
  }

  // Per-hazard hit shape. Fences and pumpkins are jumped, hay bales are
  // jumped or hidden in, knives swing, ovens breathe fire.
  hitHazard(hazard, box) {
    const hx = hazard.x;
    const hy = hazard.y;
    if (hazard.kind === 'fence' || hazard.kind === 'pumpkin') {
      return this.overlap(box, { x: hx - hazard.w / 2, y: hy - hazard.h, w: hazard.w, h: hazard.h });
    }
    if (hazard.kind === 'haybale') {
      return this.overlap(box, { x: hx - hazard.w / 2, y: hy - hazard.h, w: hazard.w, h: hazard.h });
    }
    if (hazard.kind === 'knife') {
      // The blade tip sweeps an arc: dangerous only when it swings low.
      const angle = Math.sin(hazard.phase) * 0.95;
      const tipX = hx + Math.sin(angle) * 62;
      const tipY = hy - 150 + Math.cos(angle) * 62;
      const dx = tipX - (box.x + box.w / 2);
      const dy = tipY - (box.y + box.h / 2);
      return dx * dx + dy * dy < 34 * 34;
    }
    if (hazard.kind === 'oven') {
      // The oven body always hurts; the fire jet hurts only while it is on.
      const bodyHit = this.overlap(box, { x: hx - hazard.w / 2, y: hy - hazard.h, w: hazard.w, h: hazard.h });
      if (bodyHit) return true;
      if (hazard.jetOn) {
        const jet = { x: hx - 22, y: hy - hazard.h - 120, w: 44, h: 120 };
        return this.overlap(box, jet);
      }
      return false;
    }
    return false;
  }

  overlap(a, b) {
    return (
      a.x < b.x + b.w && a.x + a.w > b.x &&
      a.y < b.y + b.h && a.y + a.h > b.y
    );
  }
}
// __NEXT__