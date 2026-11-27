// input.js — keyboard plus mouse clicks, with edge detection: a jump
// fires once per key press, not once per frame the key is held. The game
// loop consumes the pressed set each frame, so nothing is double-read.

export const KEYS = {
  jump: ['Space', 'ArrowUp', 'KeyW'],
  slide: ['ArrowDown', 'KeyS'],
  dash: ['ShiftLeft', 'ShiftRight'],
  pause: ['KeyP', 'Escape'],
  mute: ['KeyM'],
  confirm: ['Enter', 'NumpadEnter'],
};

export class Input {
  constructor(canvas) {
    this.down = new Set();
    this.pressed = new Set();
    this.clicks = [];
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.down.add(event.code);
      this.pressed.add(event.code);
      if (KEYS.jump.includes(event.code) || event.code === 'Space') {
        event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => {
      this.down.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.down.clear();
    });

    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
      this.clicks.push({ x, y });
    });
  }

  isDown(code) {
    return this.down.has(code);
  }

  anyDown(codes) {
    return codes.some((code) => this.down.has(code));
  }

  // True once, the frame after the key went down; then forgotten.
  justPressed(codes) {
    for (const code of codes) {
      if (this.pressed.has(code)) return true;
    }
    return false;
  }

  // Drain this frame's presses so a held key cannot fire twice.
  endFrame() {
    this.pressed.clear();
  }

  // Drain this frame's clicks (already in canvas coordinates).
  takeClicks() {
    const taken = this.clicks;
    this.clicks = [];
    return taken;
  }
}

// A rectangle button hit-test shared by the menu screens.
export function hitButton(click, rect) {
  return (
    click.x >= rect.x &&
    click.x <= rect.x + rect.w &&
    click.y >= rect.y &&
    click.y <= rect.y + rect.h
  );
}
// __NEXT__