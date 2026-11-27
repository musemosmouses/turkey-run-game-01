// config.js — every tunable number for Turkey Trouble lives here, so the
// rest of the game reads plain constants instead of magic numbers.

export const VIEW_W = 960;
export const VIEW_H = 540;
export const GROUND_Y = 470;
export const PLAYER_X = 190;
export const RUN_LENGTH_M = 1000;
export const GRAVITY = 2300;
export const JUMP_VELOCITY = 980;
export const BASE_SPEED = 265;
export const MAX_SPEED = 430;
export const DASH_SPEED = 640;
export const DASH_COST = 38;
export const STAMINA_MAX = 100;
export const STAMINA_REGEN = 16;
export const SLIDE_TIME = 0.62;
export const INVULN_TIME = 1.6;
export const START_GAP = 330;
export const MAX_GAP = 480;
export const CAUGHT_GAP = 0;
export const START_HEARTS = 3;
export const CORN_SCORE = 10;
export const GOLDEN_CORN_SCORE = 50;
export const METERS_PER_PIXEL = 1 / 12;

// Zones keyed by distance in metres. Each zone re-skins the world: its own
// sky, ground, background silhouette and hazard menu.
export const ZONES = [
  {
    id: 'farmyard',
    name: 'FARMYARD',
    from: 0,
    to: 350,
    skyTop: '#f7b267',
    skyMid: '#f4845f',
    skyBot: '#e76f51',
    ground: '#7a5230',
    groundTop: '#a4713e',
    far: '#8d5a2b',
    near: '#5d3a1a',
    hazards: ['fence', 'pumpkin', 'haybale'],
    banner: 'FARMYARD — 0m',
  },
  {
    id: 'barn',
    name: 'BARN',
    from: 350,
    to: 700,
    skyTop: '#5b4a68',
    skyMid: '#8c5a6e',
    skyBot: '#c97b5a',
    ground: '#4c3423',
    groundTop: '#6b4a2f',
    far: '#3e2a1c',
    near: '#2c1d12',
    hazards: ['fence', 'pumpkin', 'haybale', 'knife'],
    banner: 'BARN — 350m',
  },
  {
    id: 'kitchen',
    name: 'KITCHEN',
    from: 700,
    to: 1000,
    skyTop: '#3a2b3d',
    skyMid: '#7a3b2e',
    skyBot: '#c96f2e',
    ground: '#3d2b26',
    groundTop: '#5a4038',
    far: '#2a1d1a',
    near: '#1c1210',
    hazards: ['oven', 'knife', 'pumpkin', 'haybale'],
    banner: 'KITCHEN — 700m',
  },
];

export function zoneFor(distanceM) {
  for (const zone of ZONES) {
    if (distanceM < zone.to) return zone;
  }
  return ZONES[ZONES.length - 1];
}

// Hazard blueprints: width/height in pixels and the score-free behaviour
// each one needs. All five are drawn in render.js, all five are spawned
// and collided in world.js.
export const HAZARDS = {
  fence: { w: 24, h: 66, kind: 'fence' },
  pumpkin: { w: 56, h: 56, kind: 'pumpkin' },
  haybale: { w: 74, h: 62, kind: 'haybale' },
  knife: { w: 90, h: 150, kind: 'knife' },
  oven: { w: 96, h: 110, kind: 'oven' },
};

export const PICKUPS = {
  corn: { w: 30, h: 34, score: CORN_SCORE },
  golden: { w: 34, h: 38, score: GOLDEN_CORN_SCORE },
  feather: { w: 34, h: 30, score: 0 },
};
// __NEXT__