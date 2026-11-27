// audio.js — every sound is synthesised with WebAudio oscillators and
// noise buffers. No audio files, no network: the game stays fully offline
// and the mute key (M) silences the whole lot at once.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.alarmAt = 0;
  }

  // The AudioContext is created on the first user gesture only, so the
  // browser never blocks us for autoplaying.
  ensure() {
    if (!this.ctx) {
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        this.ctx = new Ctor();
      } catch (err) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // A short oscillator blip with a pitch slide and a fade-out envelope.
  tone(freqFrom, freqTo, seconds, type, volume) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freqFrom, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqTo), now + seconds);
    gain.gain.setValueAtTime(volume || 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  // Filtered white noise: hisses, thuds and feather rustles.
  noise(seconds, volume, filterFreq) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq || 1200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume || 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(now);
    src.stop(now + seconds);
  }

  gobble() {
    // The turkey's signature call: three quick descending gobbles.
    this.tone(420, 180, 0.09, 'sawtooth', 0.07);
    setTimeout(() => this.tone(380, 160, 0.09, 'sawtooth', 0.07), 110);
    setTimeout(() => this.tone(340, 140, 0.12, 'sawtooth', 0.07), 220);
  }

  jump() {
    this.tone(280, 620, 0.16, 'square', 0.05);
  }

  dash() {
    this.noise(0.22, 0.09, 2400);
    this.tone(180, 520, 0.18, 'sine', 0.06);
  }

  slide() {
    this.noise(0.18, 0.06, 900);
  }

  pickup() {
    this.tone(880, 1320, 0.1, 'sine', 0.09);
    setTimeout(() => this.tone(1320, 1760, 0.1, 'sine', 0.07), 70);
  }

  golden() {
    [660, 880, 1100, 1320].forEach((f, i) => {
      setTimeout(() => this.tone(f, f * 1.2, 0.12, 'triangle', 0.09), i * 80);
    });
  }

  shield() {
    this.tone(520, 1040, 0.25, 'triangle', 0.09);
  }

  hit() {
    this.tone(220, 60, 0.3, 'sawtooth', 0.12);
    this.noise(0.25, 0.12, 500);
  }

  // A rising two-note alarm while the farmer is closing in. Throttled so
  // it cannot stack into a drone.
  alarm() {
    const now = performance.now();
    if (now - this.alarmAt < 900) return;
    this.alarmAt = now;
    this.tone(740, 740, 0.12, 'square', 0.05);
    setTimeout(() => this.tone(988, 988, 0.14, 'square', 0.05), 140);
  }

  hiss() {
    this.noise(0.5, 0.05, 3200);
  }

  hide() {
    this.tone(300, 180, 0.2, 'sine', 0.05);
    this.noise(0.2, 0.04, 700);
  }

  caught() {
    [392, 330, 262, 196].forEach((f, i) => {
      setTimeout(() => this.tone(f, f * 0.94, 0.28, 'sawtooth', 0.09), i * 210);
    });
  }

  victory() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      setTimeout(() => this.tone(f, f, 0.22, 'triangle', 0.1), i * 130);
    });
    setTimeout(() => this.gobble(), 750);
  }

  click() {
    this.tone(600, 500, 0.05, 'square', 0.04);
  }
}
// __NEXT__