// farmer.js — the relentless farmer. Three states, one job: close the
// gap. Chase creeps forward, search freezes him at a haystack while he
// scans for the hidden turkey, sprint closes a big lead in a hurry.
// Gap 0 means caught: the run ends the moment he touches the turkey.

import { CAUGHT_GAP, GROUND_Y, MAX_GAP, START_GAP } from './config.js';

export class Farmer {
  constructor() {
    this.reset();
  }

  reset() {
    this.gap = START_GAP; // pixels behind the turkey
    this.state = 'chase';
    this.stateTimer = 0;
    this.runPhase = 0;
    this.scanPhase = 0;
    this.x = 0;
    this.y = GROUND_Y;
  }

  // Screen position, derived from the gap each frame.
  get screenX() {
    return this.x;
  }

  setGap(gap) {
    this.gap = Math.max(CAUGHT_GAP, Math.min(MAX_GAP, gap));
  }

  get caught() {
    return this.gap <= CAUGHT_GAP;
  }

  get isClose() {
    return this.gap < 130;
  }

  // The turkey just got hit: the stumble lets the farmer surge forward.
  onTurkeyHit() {
    this.setGap(this.gap - 50);
  }

  // The turkey dashed away: the gap opens up.
  onTurkeyDash() {
    this.setGap(this.gap + 90);
  }

  // The turkey hid in a hay bale: the farmer stops at the bale and scans.
  startSearch(baleX) {
    if (this.state === 'search') return;
    this.state = 'search';
    this.stateTimer = 2.6;
    this.searchBaleX = baleX;
  }

  update(dt, turkey) {
    this.runPhase += dt * (this.state === 'sprint' ? 30 : 17);
    this.x = turkey.x - this.gap;

    if (this.state === 'search') {
      this.scanPhase += dt * 4;
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        // He gives up the search and loses the trail: the gap opens.
        this.state = 'chase';
        this.setGap(this.gap + 150);
      }
      return;
    }

    if (turkey.hidden) {
      // The trail went cold right at a hay bale: go look.
      this.startSearch(turkey.hideBale ? turkey.hideBale.x : turkey.x);
      return;
    }

    if (this.gap > 380) {
      // Too far behind: break into a sprint to close the lead.
      this.state = 'sprint';
      this.setGap(this.gap - 95 * dt);
      if (this.gap <= 300) this.state = 'chase';
    } else {
      this.state = 'chase';
      // The chase is relentless: a slow, steady creep, faster the
      // further into the run the turkey gets.
      this.setGap(this.gap - 5 * dt);
    }
  }
}
// __NEXT__