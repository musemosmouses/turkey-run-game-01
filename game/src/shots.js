// shots.js — staged screenshot states for ?shot=title|farm|kitchen|escaped.
// Each shot sets a fixed, seeded scene so the four screenshots are
// deterministic renders of the real game, not composited mock-ups.

import { GROUND_Y, zoneFor } from './config.js';

export const SHOT_NAMES = ['title', 'farm', 'kitchen', 'escaped'];

export function applyShot(game, name) {
  const world = game.world;
  const turkey = game.turkey;
  const farmer = game.farmer;

  if (name === 'title') {
    game.state = 'title';
    world.reset();
    turkey.reset();
    farmer.reset();
    return;
  }

  if (name === 'farm') {
    game.state = 'playing';
    world.reset();
    world.distance = 118;
    world.spawnTimer = 99;
    turkey.reset();
    turkey.y = GROUND_Y - 96; // mid-jump over the fence
    turkey.vy = -260;
    turkey.onGround = false;
    farmer.reset();
    farmer.setGap(170);
    game.score = 240;
    game.corn = 6;
    world.addHazard('fence', 330);
    world.addHazard('haybale', 620);
    world.addHazard('pumpkin', 830);
    world.addPickup('corn', 300, GROUND_Y - 150);
    world.addPickup('corn', 360, GROUND_Y - 150);
    world.addPickup('corn', 420, GROUND_Y - 130);
    world.addPickup('corn', 700, GROUND_Y - 34);
    return;
  }

  if (name === 'kitchen') {
    game.state = 'playing';
    world.reset();
    world.distance = 824;
    world.zone = zoneFor(world.distance);
    world.spawnTimer = 99;
    turkey.reset();
    turkey.hearts = 2;
    turkey.shield = true;
    farmer.reset();
    farmer.setGap(84); // close: the gap bar burns red
    game.score = 1980;
    game.corn = 31;
    const oven = world.addHazard('oven', 430);
    oven.jetOn = true;
    oven.jetTimer = 0.8;
    const knife = world.addHazard('knife', 640);
    knife.phase = 0.6;
    world.addHazard('pumpkin', 860);
    world.addPickup('golden', 540, GROUND_Y - 120);
    world.addPickup('corn', 760, GROUND_Y - 34);
    return;
  }

  if (name === 'escaped') {
    game.state = 'escaped';
    world.reset();
    world.distance = 1000;
    world.zone = zoneFor(world.distance);
    turkey.reset();
    farmer.reset();
    farmer.setGap(150);
    game.score = 4120;
    game.corn = 47;
    game.bestDistance = 1000;
    return;
  }
}
// __NEXT__