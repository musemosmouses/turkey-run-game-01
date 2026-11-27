// render.js — every pixel of Turkey Trouble is drawn here in canvas
// code: the turkey, the farmer, the farm, the barn, the kitchen, the
// hazards, the HUD and all four screens. No image files, no fonts from
// the network: system fonts only, autumn palette only.

import { GROUND_Y, VIEW_H, VIEW_W } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function outlineText(ctx, str, x, y, size, color, align, weight) {
  ctx.font = `${weight || 'bold'} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(40, 16, 8, 0.85)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  // Full frame: background, world objects, characters, HUD, then the
  // screen overlay for the current state (title / pause / end).
  draw(game) {
    const ctx = this.ctx;
    this.drawBackground(game);
    this.drawPickups(game);
    this.drawHazards(game);
    this.drawParticles(game);
    if (game.state !== 'title') {
      this.drawFarmer(game);
      this.drawTurkey(game);
    }
    this.drawHud(game);
    if (game.state === 'title') this.drawTitle(game);
    if (game.state === 'paused') this.drawPaused(game);
    if (game.state === 'caught') this.drawEnd(game, false);
    if (game.state === 'escaped') this.drawEnd(game, true);
  }

  drawBackground(game) {
    const ctx = this.ctx;
    const zone = game.world.zone;
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, zone.skyTop);
    grad.addColorStop(0.55, zone.skyMid);
    grad.addColorStop(1, zone.skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);

    // Low autumn sun and drifting clouds.
    ctx.fillStyle = 'rgba(255, 236, 180, 0.95)';
    ellipse(ctx, 800, 84, 42, 42);
    ctx.fillStyle = 'rgba(255, 244, 214, 0.75)';
    const cloudX = (game.world.time * 12) % (VIEW_W + 320) - 160;
    ellipse(ctx, cloudX, 70, 66, 18);
    ellipse(ctx, cloudX + 44, 62, 48, 16);
    ellipse(ctx, (cloudX + 520) % (VIEW_W + 320) - 160, 110, 58, 15);

    this.drawFarSilhouette(game, zone);
    this.drawGround(game, zone);
  }

  drawFarSilhouette(game, zone) {
    const ctx = this.ctx;
    const scroll = (game.world.distance * 12) % 480;
    ctx.fillStyle = zone.far;
    if (zone.id === 'farmyard') {
      // A red barn, a windmill and a fence line on the horizon.
      ctx.fillRect(120 - scroll, 330, 150, 140);
      ctx.beginPath();
      ctx.moveTo(105 - scroll, 332);
      ctx.lineTo(195 - scroll, 268);
      ctx.lineTo(285 - scroll, 332);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = zone.near;
      ctx.fillRect(640 - scroll, 300, 16, 170);
      ctx.fillRect(560 - scroll, 380, 180, 12);
      ctx.fillRect(560 - scroll, 420, 180, 12);
    } else if (zone.id === 'barn') {
      // Barn interior: big beams, hanging lanterns, stacked crates.
      ctx.fillRect(0, 150, VIEW_W, 14);
      ctx.fillRect(90, 150, 18, 320);
      ctx.fillRect(480, 150, 18, 320);
      ctx.fillRect(850, 150, 18, 320);
      ctx.fillStyle = '#ffb347';
      ellipse(ctx, 300, 210, 10, 14);
      ellipse(ctx, 700, 210, 10, 14);
      ctx.fillStyle = zone.near;
      ctx.fillRect(60, 400, 90, 70);
      ctx.fillRect(820, 410, 80, 60);
    } else {
      // Kitchen: a big window, hanging pans and a tiled wall edge.
      ctx.fillStyle = 'rgba(255, 220, 150, 0.9)';
      ctx.fillRect(90, 120, 220, 190);
      ctx.fillStyle = zone.far;
      ctx.fillRect(195, 120, 12, 190);
      ctx.fillRect(90, 210, 220, 12);
      ctx.fillStyle = '#2b2b2b';
      ellipse(ctx, 620, 200, 34, 8);
      ctx.fillRect(616, 200, 8, 42);
      ellipse(ctx, 720, 200, 28, 7);
      ctx.fillRect(716, 200, 8, 36);
    }
  }

  drawGround(game, zone) {
    const ctx = this.ctx;
    ctx.fillStyle = zone.groundTop;
    ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
    ctx.fillStyle = zone.ground;
    ctx.fillRect(0, GROUND_Y + 10, VIEW_W, VIEW_H - GROUND_Y - 10);
    // Scrolling ground texture: tufts, planks or tiles per zone.
    const offset = (game.world.distance * 12) % 64;
    ctx.fillStyle = zone.near;
    for (let x = -offset; x < VIEW_W; x += 64) {
      if (zone.id === 'kitchen') {
        ctx.fillRect(x, GROUND_Y + 34, 60, 4);
        ctx.fillRect(x, GROUND_Y + 56, 60, 4);
      } else {
        ctx.beginPath();
        ctx.moveTo(x + 10, GROUND_Y + 26);
        ctx.lineTo(x + 16, GROUND_Y + 14);
        ctx.lineTo(x + 22, GROUND_Y + 26);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  drawParticles(game) {
    const ctx = this.ctx;
    for (const p of game.world.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ellipse(ctx, p.x, p.y, p.size, p.size * 0.6);
    }
    ctx.globalAlpha = 1;
  }

  drawPickups(game) {
    const ctx = this.ctx;
    for (const pickup of game.world.pickups) {
      const bobY = pickup.y + Math.sin(pickup.bob) * 4;
      if (pickup.kind === 'corn') {
        ctx.fillStyle = '#7a5a1e';
        ctx.fillRect(pickup.x - 3, bobY - 14, 6, 28);
        ctx.fillStyle = '#ffd60a';
        ellipse(ctx, pickup.x, bobY, 11, 15);
        ctx.fillStyle = '#e0a800';
        ctx.fillRect(pickup.x - 6, bobY - 8, 12, 2);
        ctx.fillRect(pickup.x - 6, bobY - 1, 12, 2);
        ctx.fillRect(pickup.x - 6, bobY + 6, 12, 2);
      } else if (pickup.kind === 'golden') {
        ctx.fillStyle = '#fff3a0';
        ellipse(ctx, pickup.x, bobY, 17, 19);
        ctx.fillStyle = '#ffd60a';
        ellipse(ctx, pickup.x, bobY, 12, 15);
        ctx.fillStyle = '#fff';
        text(ctx, '★', pickup.x, bobY - 2, 16, '#fff', 'center');
      } else {
        // Feather shield: a soft white feather with a glow ring.
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pickup.x, bobY, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(pickup.x, bobY, 6, 13, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c9c9c9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pickup.x - 4, bobY + 11);
        ctx.lineTo(pickup.x + 4, bobY - 11);
        ctx.stroke();
      }
    }
  }

  drawHazards(game) {
    const ctx = this.ctx;
    for (const hazard of game.world.hazards) {
      const x = hazard.x;
      const y = hazard.y;
      if (hazard.kind === 'fence') {
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(x - 15, y - 66, 8, 66);
        ctx.fillRect(x + 7, y - 66, 8, 66);
        ctx.fillRect(x - 22, y - 60, 44, 8);
        ctx.fillRect(x - 22, y - 34, 44, 8);
        ctx.fillStyle = '#a06a35';
        ctx.fillRect(x - 22, y - 60, 44, 3);
      } else if (hazard.kind === 'pumpkin') {
        ctx.save();
        ctx.translate(x, y - 28);
        ctx.rotate(hazard.roll);
        ctx.fillStyle = '#e8590c';
        ellipse(ctx, 0, 0, 28, 25);
        ctx.fillStyle = '#d9480f';
        ctx.fillRect(-4, -25, 8, 50);
        ctx.fillRect(-18, -22, 6, 44);
        ctx.fillRect(12, -22, 6, 44);
        ctx.fillStyle = '#2f9e44';
        ctx.fillRect(-3, -34, 6, 12);
        ctx.restore();
        ctx.fillStyle = '#000';
        ellipse(ctx, x - 9, y - 30, 3, 4);
        ellipse(ctx, x + 9, y - 30, 3, 4);
      } else if (hazard.kind === 'haybale') {
        ctx.fillStyle = '#d9a441';
        roundRect(ctx, x - 37, y - 62, 74, 62, 10);
        ctx.fill();
        ctx.strokeStyle = '#b07f2a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 37, y - 42);
        ctx.lineTo(x + 37, y - 42);
        ctx.moveTo(x - 37, y - 22);
        ctx.lineTo(x + 37, y - 22);
        ctx.stroke();
        ctx.fillStyle = '#f2c14e';
        ctx.fillRect(x - 30, y - 56, 60, 5);
        if (game.turkey.hidden && game.turkey.hideBale === hazard) {
          // Two worried eyes peeking out of the hay.
          ctx.fillStyle = '#fff';
          ellipse(ctx, x - 8, y - 46, 6, 7);
          ellipse(ctx, x + 8, y - 46, 6, 7);
          ctx.fillStyle = '#000';
          ellipse(ctx, x - 8, y - 45, 3, 3);
          ellipse(ctx, x + 8, y - 45, 3, 3);
        }
      } else if (hazard.kind === 'knife') {
        // A carving knife on a pivot, swinging over a chopping block.
        const angle = Math.sin(hazard.phase) * 0.95;
        ctx.fillStyle = '#6b4226';
        ctx.fillRect(x - 42, y - 26, 84, 26);
        ctx.save();
        ctx.translate(x, y - 150);
        ctx.rotate(angle);
        ctx.fillStyle = '#4a2c14';
        ellipse(ctx, 0, 0, 7, 7);
        ctx.fillStyle = '#3b2312';
        ctx.fillRect(-5, 0, 10, 26);
        ctx.fillStyle = '#dfe6ea';
        ctx.beginPath();
        ctx.moveTo(-6, 24);
        ctx.lineTo(6, 24);
        ctx.lineTo(2, 66);
        ctx.lineTo(-2, 66);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#aab4bb';
        ctx.fillRect(-6, 24, 12, 4);
        ctx.restore();
      } else if (hazard.kind === 'oven') {
        // A squat oven with a round window; the jet is a column of flame.
        if (hazard.jetOn) {
          const flick = Math.sin(game.world.time * 28) * 6;
          ctx.fillStyle = 'rgba(255, 120, 20, 0.85)';
          ctx.beginPath();
          ctx.moveTo(x - 22, y - 110);
          ctx.quadraticCurveTo(x - 30 - flick, y - 180, x, y - 228);
          ctx.quadraticCurveTo(x + 30 + flick, y - 180, x + 22, y - 110);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffd60a';
          ctx.beginPath();
          ctx.moveTo(x - 12, y - 110);
          ctx.quadraticCurveTo(x - 16, y - 165, x, y - 195);
          ctx.quadraticCurveTo(x + 16, y - 165, x + 12, y - 110);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = '#343a40';
        roundRect(ctx, x - 48, y - 110, 96, 110, 8);
        ctx.fill();
        ctx.fillStyle = '#212529';
        ctx.fillRect(x - 48, y - 110, 96, 14);
        ctx.fillStyle = '#ff922b';
        ellipse(ctx, x, y - 62, 20, 20);
        ctx.fillStyle = '#ffe8cc';
        ellipse(ctx, x, y - 62, 12, 12);
        ctx.fillStyle = '#868e96';
        ctx.fillRect(x - 34, y - 26, 68, 6);
      }
    }
  }

  drawTurkey(game) {
    const ctx = this.ctx;
    const t = game.turkey;
    if (t.hidden) return; // tucked inside the hay bale: only eyes show.
    // Brief flashing while invulnerable after a hit.
    if (t.invuln > 0 && Math.floor(t.invuln * 12) % 2 === 0) return;

    const x = t.x;
    const y = t.y;
    const legSwing = Math.sin(t.runPhase) * (t.onGround ? 10 : 4);
    ctx.save();
    if (t.sliding) ctx.translate(0, 14);

    // Tail feathers, fanned behind.
    ctx.fillStyle = '#8d5a2b';
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.translate(x - 20, y - 46);
      ctx.rotate(i * 0.38);
      ctx.beginPath();
      ctx.ellipse(0, -26, 9, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#e8590c';
    for (let i = -1; i <= 1; i += 1) {
      ctx.save();
      ctx.translate(x - 20, y - 46);
      ctx.rotate(i * 0.5);
      ctx.beginPath();
      ctx.ellipse(0, -24, 6, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Legs: a running scissor, tucked up while jumping.
    ctx.strokeStyle = '#e8590c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 22);
    ctx.lineTo(x - 4 + legSwing, y);
    ctx.moveTo(x + 6, y - 22);
    ctx.lineTo(x + 6 - legSwing, y);
    ctx.stroke();

    // Body: a plump brown oval with a cream belly.
    ctx.fillStyle = '#7a4a21';
    ellipse(ctx, x, y - 34, 30, 26);
    ctx.fillStyle = '#e9c46a';
    ellipse(ctx, x + 6, y - 28, 20, 16);

    // Head, beak, wattle and one very worried eye.
    ctx.fillStyle = '#a4713e';
    ellipse(ctx, x + 26, y - 58, 13, 12);
    ctx.fillStyle = '#f4a259';
    ctx.beginPath();
    ctx.moveTo(x + 36, y - 60);
    ctx.lineTo(x + 52, y - 55);
    ctx.lineTo(x + 36, y - 51);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d90429';
    ellipse(ctx, x + 32, y - 46, 5, 8);
    ctx.fillStyle = '#fff';
    ellipse(ctx, x + 28, y - 62, 5, 5);
    ctx.fillStyle = '#000';
    ellipse(ctx, x + 29, y - 62, 2.5, 2.5);

    // Feather shield ring.
    if (t.shield) {
      ctx.strokeStyle = 'rgba(180, 230, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 34, 44, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawFarmer(game) {
    const ctx = this.ctx;
    const f = game.farmer;
    // Position is derived from the live gap every frame, never from a
    // stored x: staged screenshots freeze the loop, so a stored value
    // would leave the farmer stuck at the screen edge.
    const x = game.turkey.x - f.gap;
    const y = f.y;
    if (x < -120 || x > VIEW_W + 120) return;
    const legSwing = Math.sin(f.runPhase) * 12;
    const near = f.isClose;

    // Pitchfork, held high and glinting when he is close.
    ctx.strokeStyle = near ? '#ffd60a' : '#8d6b3d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 26, y - 96);
    ctx.lineTo(x + 26, y - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 18, y - 96);
    ctx.lineTo(x + 18, y - 112);
    ctx.moveTo(x + 26, y - 96);
    ctx.lineTo(x + 26, y - 114);
    ctx.moveTo(x + 34, y - 96);
    ctx.lineTo(x + 34, y - 112);
    ctx.stroke();

    // Legs and boots.
    ctx.strokeStyle = '#2b3a67';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 44);
    ctx.lineTo(x - 6 + legSwing, y - 2);
    ctx.moveTo(x + 8, y - 44);
    ctx.lineTo(x + 8 - legSwing, y - 2);
    ctx.stroke();

    // Overalls and red shirt.
    ctx.fillStyle = '#c1121f';
    ctx.fillRect(x - 16, y - 92, 34, 30);
    ctx.fillStyle = '#2b3a67';
    ctx.fillRect(x - 16, y - 66, 34, 26);
    ctx.fillRect(x - 16, y - 66, 8, 14);
    ctx.fillRect(x + 10, y - 66, 8, 14);

    // Head, straw hat, beard and a very determined moustache.
    ctx.fillStyle = '#f2c89b';
    ellipse(ctx, x + 2, y - 102, 13, 12);
    ctx.fillStyle = '#e9c46a';
    ellipse(ctx, x + 2, y - 112, 22, 6);
    ctx.fillRect(x - 10, y - 128, 24, 12);
    ctx.fillStyle = '#fff';
    ellipse(ctx, x - 8, y - 92, 11, 7);
    ctx.fillStyle = '#000';
    ellipse(ctx, x + 6, y - 104, 2, 2);
    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 2, y - 98);
    ctx.lineTo(x + 12, y - 98);
    ctx.stroke();

    // Comic "?!" bubble while he searches a haystack.
    if (f.state === 'search') {
      const bob = Math.sin(f.scanPhase) * 3;
      ctx.fillStyle = '#fff';
      roundRect(ctx, x - 12, y - 178 + bob, 52, 34, 10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 6, y - 144 + bob);
      ctx.lineTo(x + 14, y - 132 + bob);
      ctx.lineTo(x + 18, y - 144 + bob);
      ctx.closePath();
      ctx.fill();
      text(ctx, '?!', x + 14, y - 160 + bob, 22, '#c1121f', 'center');
    }
  }

  drawHud(game) {
    const ctx = this.ctx;
    if (game.state === 'title') return;
    // Top bar.
    ctx.fillStyle = 'rgba(30, 12, 6, 0.55)';
    roundRect(ctx, 12, 10, 330, 62, 10);
    ctx.fill();
    text(ctx, `SCORE ${game.score}`, 26, 30, 20, '#fff', 'left');
    text(ctx, `${Math.floor(game.world.distance)}m / 1000m`, 26, 56, 18, '#ffd60a', 'left');
    text(ctx, `🌽 ${game.corn}`, 250, 30, 18, '#ffe08a', 'left');
    text(ctx, game.world.zoneName, 250, 56, 15, '#fff', 'left');

    // Hearts, top right.
    for (let i = 0; i < 3; i += 1) {
      const hx = VIEW_W - 40 - i * 36;
      ctx.fillStyle = i < game.turkey.hearts ? '#e63946' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(hx - 6, 30, 9, 0, Math.PI * 2);
      ctx.arc(hx + 6, 30, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx - 14, 33);
      ctx.lineTo(hx, 50);
      ctx.lineTo(hx + 14, 33);
      ctx.closePath();
      ctx.fill();
    }
    if (game.turkey.shield) {
      text(ctx, '🛡 SHIELD', VIEW_W - 30, 66, 15, '#bde0fe', 'right');
    }

    // Farmer-gap bar along the bottom: the whole chase, at a glance.
    const barW = 420;
    const barX = (VIEW_W - barW) / 2;
    const barY = VIEW_H - 30;
    ctx.fillStyle = 'rgba(30, 12, 6, 0.6)';
    roundRect(ctx, barX - 8, barY - 8, barW + 16, 26, 8);
    ctx.fill();
    const gapRatio = game.farmer.gap / 480;
    ctx.fillStyle = game.farmer.isClose ? '#e63946' : '#ffd60a';
    ctx.fillRect(barX, barY, barW * gapRatio, 10);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(barX + barW * gapRatio, barY + 5, 7, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'FARMER', barX - 14, barY + 5, 12, '#fff', 'right');
    text(ctx, 'TURKEY', barX + barW + 14, barY + 5, 12, '#fff', 'left');

    // Zone banner, briefly, on every zone change.
    if (game.world.bannerTimer > 0) {
      ctx.globalAlpha = Math.min(1, game.world.bannerTimer);
      outlineText(ctx, game.world.zoneBanner, VIEW_W / 2, 120, 34, '#ffd60a', 'center');
      ctx.globalAlpha = 1;
    }

    // Stamina bar under the gap bar while dashing or drained.
    if (game.turkey.stamina < 100) {
      ctx.fillStyle = 'rgba(30, 12, 6, 0.6)';
      ctx.fillRect(barX, barY + 22, barW, 6);
      ctx.fillStyle = '#74c0fc';
      ctx.fillRect(barX, barY + 22, barW * (game.turkey.stamina / 100), 6);
    }
  }

  dim(ctx) {
    ctx.fillStyle = 'rgba(20, 8, 4, 0.62)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  button(ctx, rect, label, color) {
    ctx.fillStyle = color || '#e8590c';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.stroke();
    text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 22, '#fff', 'center');
  }

  drawTitle(game) {
    const ctx = this.ctx;
    this.dim(ctx);
    outlineText(ctx, 'TURKEY', VIEW_W / 2, 108, 72, '#ffd60a', 'center');
    outlineText(ctx, 'TROUBLE', VIEW_W / 2, 178, 72, '#ff922b', 'center');
    text(ctx, '3 zones · 1000m dash · 1 relentless farmer', VIEW_W / 2, 232, 20, '#fff', 'center');
    text(ctx, 'Thanksgiving is coming. The farmer is coming faster.', VIEW_W / 2, 262, 17, '#ffe08a', 'center');
    text(ctx, 'SPACE / ↑ jump      ↓ slide & hide in haystacks      SHIFT dash', VIEW_W / 2, 312, 17, '#fff', 'center');
    text(ctx, 'Dodge fences, knives, pumpkins and oven fire. Grab corn. Stay ahead.', VIEW_W / 2, 340, 17, '#fff', 'center');
    text(ctx, 'P pause · M mute', VIEW_W / 2, 368, 15, '#adb5bd', 'center');
    this.button(ctx, game.startButton, '▶  START THE ESCAPE', '#e8590c');
    text(ctx, 'or press ENTER', VIEW_W / 2, 468, 14, '#adb5bd', 'center');
  }

  drawPaused(game) {
    const ctx = this.ctx;
    this.dim(ctx);
    outlineText(ctx, 'PAUSED', VIEW_W / 2, 220, 56, '#fff', 'center');
    text(ctx, 'The farmer waits for no turkey… except now.', VIEW_W / 2, 272, 17, '#ffe08a', 'center');
    text(ctx, 'Press P or ENTER to keep running', VIEW_W / 2, 306, 17, '#fff', 'center');
  }

  drawEnd(game, escaped) {
    const ctx = this.ctx;
    this.dim(ctx);
    if (escaped) {
      outlineText(ctx, 'ESCAPED!', VIEW_W / 2, 130, 64, '#69db7c', 'center');
      outlineText(ctx, 'PARDONED!', VIEW_W / 2, 196, 44, '#ffd60a', 'center');
      text(ctx, 'You outran the farmer, the knives and the oven.', VIEW_W / 2, 244, 18, '#fff', 'center');
      text(ctx, 'Thanksgiving dinner is officially cancelled.', VIEW_W / 2, 272, 18, '#fff', 'center');
    } else {
      outlineText(ctx, 'CAUGHT!', VIEW_W / 2, 130, 64, '#e63946', 'center');
      outlineText(ctx, 'DINNER IS SERVED', VIEW_W / 2, 196, 40, '#ff922b', 'center');
      text(ctx, 'The farmer finally closed the gap.', VIEW_W / 2, 244, 18, '#fff', 'center');
      text(ctx, 'The oven was already warm. Better luck next run.', VIEW_W / 2, 272, 18, '#fff', 'center');
    }
    const statsY = 316;
    text(ctx, `Distance  ${Math.floor(game.world.distance)}m / 1000m`, VIEW_W / 2, statsY, 20, '#fff', 'center');
    text(ctx, `Score  ${game.score}      Corn  ${game.corn}      Best  ${Math.floor(game.bestDistance)}m`, VIEW_W / 2, statsY + 32, 20, '#ffd60a', 'center');
    this.button(ctx, game.restartButton, '↻  RUN AGAIN', '#2f9e44');
    text(ctx, 'or press ENTER', VIEW_W / 2, 468, 14, '#adb5bd', 'center');
  }
}
// __NEXT__