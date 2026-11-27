// turkey.js — the player: a turkey that auto-runs to the right. Jump,
// slide, dash and hide are its whole moveset; hearts, shield and stamina
// are its whole defence. All physics here, all drawing in render.js.

import {
  GRAVITY,
  GROUND_Y,
  INVULN_TIME,
  JUMP_VELOCITY,
  PLAYER_X,
  SLIDE_TIME,
  STAMINA_MAX,
  STAMINA_REGEN,
  DASH_COST,
  START_HEARTS,
} from './config.js';

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = PLAYER_X;
    this.y = GROUND_Y; // feet position
    this.vy = 0;
    this.onGround = true;
    this.sliding = false;
    this.slideTimer = 0;
    this.hidden = false;
    this.hideBale = null;
    this.hearts = START_HEARTS;
    this.shield = false;
    this.stamina = STAMINA_MAX;
    this.dashing = false;
    this.dashTimer = 0;
    this.invuln = 0;
    this.runPhase = 0;
    this.dead = false;
  }

  // Standing hitbox: 54 wide, 62 tall. Sliding shrinks it to 34 tall.
  get height() {
    return this.sliding ? 34 : 62;
  }

  get width() {
    return 54;
  }

  get box() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      w: this.width,
      h: this.height,
    };
  }

  get speedBonus() {
    return this.dashing ? 1 : 0;
  }

  jump(sfx) {
    if (!this.onGround || this.hidden) return false;
    this.vy = -JUMP_VELOCITY;
    this.onGround = false;
    this.sliding = false;
    if (sfx) sfx.jump();
    return true;
  }

  startSlide(sfx) {
    if (!this.onGround || this.hidden) return false;
    this.sliding = true;
    this.slideTimer = SLIDE_TIME;
    if (sfx) sfx.slide();
    return true;
  }

  dash(sfx) {
    if (this.stamina < DASH_COST || this.dashing || this.hidden) return false;
    this.stamina -= DASH_COST;
    this.dashing = true;
    this.dashTimer = 0.28;
    if (sfx) sfx.dash();
    return true;
  }

  // Hide inside a hay bale: the farmer cannot see the turkey while it is
  // tucked away, but it cannot move either.
  hideIn(bale) {
    if (!this.onGround) return false;
    this.hidden = true;
    this.hideBale = bale;
    this.sliding = false;
    return true;
  }

  comeOut() {
    this.hidden = false;
    this.hideBale = null;
  }

  // Returns 'shield' when the feather shield eats the hit, 'hurt' when a
  // heart is lost, 'dead' when the last heart is gone.
  takeHit(sfx) {
    if (this.invuln > 0 || this.dead) return 'none';
    if (this.shield) {
      this.shield = false;
      this.invuln = INVULN_TIME;
      if (sfx) sfx.shield();
      return 'shield';
    }
    this.hearts -= 1;
    this.invuln = INVULN_TIME;
    if (sfx) sfx.hit();
    if (this.hearts <= 0) {
      this.dead = true;
      return 'dead';
    }
    return 'hurt';
  }

  update(dt, input, sfx) {
    this.runPhase += dt * (this.dashing ? 26 : 15);

    if (this.invuln > 0) this.invuln -= dt;
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) this.dashing = false;
    } else if (this.stamina < STAMINA_MAX) {
      this.stamina = Math.min(STAMINA_MAX, this.stamina + STAMINA_REGEN * dt);
    }

    if (this.hidden) {
      // Hiding is a stand-still: slide key or jump leaves the bale.
      if (input.justPressed(['Space', 'ArrowUp', 'KeyW', 'ArrowDown', 'KeyS'])) {
        this.comeOut();
      }
      return;
    }

    if (this.sliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.sliding = false;
    }

    // Gravity and landing.
    if (!this.onGround) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.vy = 0;
        this.onGround = true;
      }
    }
  }
}
// __NEXT__