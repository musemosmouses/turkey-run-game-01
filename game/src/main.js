// main.js — the game itself: state machine, loop, scoring and wiring.
// Title → playing → paused / caught / escaped, driven by Input, Turkey,
// Farmer and World, drawn by Renderer. Also exposes a small debug handle
// (window.TurkeyTrouble) so automated tests can read the live state.

import { CORN_SCORE, GOLDEN_CORN_SCORE, RUN_LENGTH_M, VIEW_H, VIEW_W } from './config.js';
import { SoundFX } from './audio.js';
import { Input, KEYS, hitButton } from './input.js';
import { Turkey } from './turkey.js';
import { Farmer } from './farmer.js';
import { World } from './world.js';
import { Renderer } from './render.js';
import { applyShot, SHOT_NAMES } from './shots.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.renderer = new Renderer(this.ctx);
    this.input = new Input(canvas);
    this.sfx = new SoundFX();
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.world = new World(20261127);
    this.state = 'title';
    this.score = 0;
    this.corn = 0;
    this.bestDistance = 0;
    this.startButton = { x: VIEW_W / 2 - 170, y: 398, w: 340, h: 54 };
    this.restartButton = { x: VIEW_W / 2 - 150, y: 398, w: 300, h: 54 };
    this.lastTime = 0;
    this.shot = null;

    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot && SHOT_NAMES.includes(shot)) this.shot = shot;
  }

  resetRun() {
    this.turkey.reset();
    this.farmer.reset();
    this.world.reset();
    this.score = 0;
    this.corn = 0;
    this.state = 'playing';
  }

  start() {
    this.sfx.ensure();
    this.sfx.click();
    this.resetRun();
    this.sfx.gobble();
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'playing';
    }
  }

  endRun(escaped) {
    this.state = escaped ? 'escaped' : 'caught';
    this.bestDistance = Math.max(this.bestDistance, this.world.distance);
    if (escaped) this.sfx.victory();
    else this.sfx.caught();
  }

  // Score the events world.collide reported this frame.
  applyEvents(events) {
    for (const event of events) {
      if (event === 'corn') {
        this.score += CORN_SCORE;
        this.corn += 1;
        this.sfx.pickup();
      } else if (event === 'golden') {
        this.score += GOLDEN_CORN_SCORE;
        this.corn += 1;
        this.sfx.golden();
      } else if (event === 'feather') {
        this.turkey.shield = true;
        this.sfx.shield();
      } else if (event === 'hit') {
        const result = this.turkey.takeHit(this.sfx);
        if (result === 'hurt' || result === 'dead') {
          this.farmer.onTurkeyHit();
        }
        if (result === 'dead') this.endRun(false);
      }
    }
  }

  update(dt) {
    const input = this.input;

    if (input.justPressed(KEYS.mute)) {
      const muted = this.sfx.toggleMute();
      void muted;
    }

    if (this.state === 'title') {
      for (const click of input.takeClicks()) {
        if (hitButton(click, this.startButton)) this.start();
      }
      if (input.justPressed(KEYS.confirm)) this.start();
      return;
    }

    if (this.state === 'paused') {
      if (input.justPressed(KEYS.pause) || input.justPressed(KEYS.confirm)) {
        this.togglePause();
      }
      return;
    }

    if (this.state === 'caught' || this.state === 'escaped') {
      for (const click of input.takeClicks()) {
        if (hitButton(click, this.restartButton)) this.start();
      }
      if (input.justPressed(KEYS.confirm)) this.start();
      return;
    }

    // Playing.
    if (input.justPressed(KEYS.pause)) {
      this.togglePause();
      return;
    }

    // Hide first: sliding down next to a hay bale tucks the turkey away.
    if (input.justPressed(KEYS.slide)) {
      const bale = this.world.hayBaleNear(this.turkey);
      if (bale && this.turkey.onGround) {
        this.turkey.hideIn(bale);
        this.sfx.hide();
      } else {
        this.turkey.startSlide(this.sfx);
      }
    }
    if (input.justPressed(KEYS.jump)) this.turkey.jump(this.sfx);
    if (input.justPressed(KEYS.dash)) {
      if (this.turkey.dash(this.sfx)) this.farmer.onTurkeyDash();
    }

    // A hidden turkey that leaves its bale is found again at once.
    if (this.turkey.hidden && this.turkey.hideBale) {
      const bale = this.turkey.hideBale;
      if (bale.x < this.turkey.x - 90) this.turkey.comeOut();
    }

    this.turkey.update(dt, input, this.sfx);
    this.world.update(dt, this.turkey, this.farmer, this.sfx);
    this.farmer.update(dt, this.turkey);

    // The farmer's alarm: a warning while he is breathing down the
    // turkey's neck.
    if (this.farmer.isClose && this.farmer.state !== 'search') {
      this.sfx.alarm();
    }

    const events = this.world.collide(this.turkey, this.farmer);
    this.applyEvents(events);

    // Distance itself scores: one point per metre survived.
    this.score += Math.floor(this.world.distance) - Math.floor(this.world.distance - this.world.speed * dt / 12);

    if (this.world.finished) {
      this.endRun(true);
      return;
    }
    if (this.farmer.caught && this.state === 'playing') {
      this.endRun(false);
    }
  }

  frame(time) {
    const dt = Math.min(0.05, (time - this.lastTime) / 1000 || 0.016);
    this.lastTime = time;
    this.update(dt);
    this.renderer.draw(this);
    this.input.endFrame();
  }

  run() {
    // A staged screenshot starts from its fixed scene and holds it: the
    // capture is a deterministic live render of the real game, not a
    // still image, and the staged numbers never drift while it is taken.
    if (this.shot) {
      applyShot(this, this.shot);
      this.renderer.draw(this);
      return;
    }
    this.renderer.draw(this);
    const loop = (time) => {
      this.frame(time);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
window.TurkeyTrouble = game;
game.run();
// __NEXT__