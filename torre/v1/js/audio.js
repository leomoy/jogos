// js/audio.js — Sfx (WebAudio sintetizado)
const Sfx = (() => {
  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;
  const lastPlay = {};
  const THROTTLE = 0.06; // 60ms

  function ensureCtx() {
    if (ctx) return true;
    try {
      const AC = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ||
                 (typeof AudioContext !== 'undefined' ? AudioContext : null);
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.3;
      master.connect(ctx.destination);
      // ruído branco (1s)
      const len = Math.floor(ctx.sampleRate * 1);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) {
      return false;
    }
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  function osc(type, freq, t0, dur, vol, freqEnd) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
    return o;
  }

  function noise(t0, dur, vol, filterType, filterFreq, q) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = s;
    if (filterFreq) {
      const f = ctx.createBiquadFilter();
      f.type = filterType || 'lowpass';
      f.frequency.value = filterFreq;
      if (q) f.Q.value = q;
      s.connect(f); node = f;
    }
    node.connect(g); g.connect(master);
    s.start(t0); s.stop(t0 + dur + 0.02);
  }

  function play(name) {
    if (muted) return;
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    const t = now();
    if (lastPlay[name] && (t - lastPlay[name]) < THROTTLE) return;
    lastPlay[name] = t;
    try { synth(name, t); } catch (e) {}
  }

  function synth(name, t) {
    switch (name) {
      case 'arrow':
        osc('square', 1400, t, 0.05, 0.18, 900);
        break;
      case 'cannon':
        osc('sine', 90, t, 0.35, 0.35, 40);
        noise(t, 0.3, 0.25, 'lowpass', 500);
        break;
      case 'frost':
        osc('triangle', 1800, t, 0.25, 0.16, 700);
        osc('sine', 2400, t, 0.18, 0.08, 1200);
        break;
      case 'mage': {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(600, t);
        o.frequency.linearRampToValueAtTime(900, t + 0.15);
        const lfo = ctx.createOscillator();
        lfo.type = 'sine'; lfo.frequency.value = 22;
        const lg = ctx.createGain(); lg.gain.value = 120;
        lfo.connect(lg); lg.connect(o.frequency);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 0.27); lfo.start(t); lfo.stop(t + 0.27);
        break;
      }
      case 'tesla':
        noise(t, 0.18, 0.22, 'highpass', 2500);
        osc('square', 220, t, 0.15, 0.12, 180);
        break;
      case 'sniper':
        noise(t, 0.12, 0.35, 'bandpass', 1800, 2);
        osc('square', 300, t, 0.08, 0.2, 120);
        break;
      case 'poison':
        osc('sine', 200, t, 0.08, 0.18, 320);
        osc('sine', 260, t + 0.09, 0.08, 0.16, 400);
        osc('sine', 180, t + 0.18, 0.1, 0.14, 300);
        break;
      case 'flame':
        noise(t, 0.4, 0.22, 'bandpass', 900, 1.5);
        break;
      case 'mortar':
        osc('sine', 70, t, 0.5, 0.4, 30);
        noise(t, 0.45, 0.28, 'lowpass', 400);
        break;
      case 'harpoon':
        noise(t, 0.25, 0.2, 'bandpass', 1200, 1);
        osc('sawtooth', 500, t, 0.2, 0.08, 200);
        break;
      case 'hit':
        osc('square', 500, t, 0.04, 0.15, 300);
        break;
      case 'death':
        osc('sine', 400, t, 0.25, 0.2, 80);
        break;
      case 'build':
        osc('triangle', 440, t, 0.1, 0.18);
        osc('triangle', 660, t + 0.1, 0.12, 0.18);
        break;
      case 'upgrade':
        osc('triangle', 440, t, 0.1, 0.16);
        osc('triangle', 587, t + 0.09, 0.1, 0.16);
        osc('triangle', 880, t + 0.18, 0.14, 0.18);
        break;
      case 'sell':
        osc('square', 1200, t, 0.05, 0.12);
        osc('square', 1600, t + 0.06, 0.05, 0.12);
        osc('square', 2000, t + 0.12, 0.06, 0.1);
        break;
      case 'leak':
        osc('sawtooth', 110, t, 0.35, 0.25, 90);
        osc('square', 55, t, 0.35, 0.15);
        break;
      case 'wave':
        osc('square', 330, t, 0.15, 0.18);
        osc('square', 440, t + 0.15, 0.2, 0.18);
        break;
      case 'waveClear':
        osc('triangle', 523, t, 0.25, 0.16);
        osc('triangle', 659, t, 0.25, 0.14);
        osc('triangle', 784, t, 0.28, 0.14);
        break;
      case 'win':
        osc('triangle', 523, t, 0.15, 0.18);
        osc('triangle', 659, t + 0.14, 0.15, 0.18);
        osc('triangle', 784, t + 0.28, 0.15, 0.18);
        osc('triangle', 1046, t + 0.42, 0.3, 0.2);
        break;
      case 'lose':
        osc('sine', 440, t, 0.25, 0.18);
        osc('sine', 349, t + 0.25, 0.25, 0.18);
        osc('sine', 262, t + 0.5, 0.4, 0.2);
        break;
      case 'click':
        osc('square', 800, t, 0.03, 0.1);
        break;
      case 'error':
        osc('sawtooth', 150, t, 0.15, 0.18, 120);
        break;
      default:
        break;
    }
  }

  // ---- Música procedural (loop calmo, escala menor, ~96 BPM) ----
  const SCALE = [0, 2, 3, 5, 7, 8, 10]; // menor natural
  const ROOT = 220; // A3
  function noteFreq(semi) { return ROOT * Math.pow(2, semi / 12); }
  const BASS = [0, 0, 5, 3]; // graus da escala (A, A, D, C)
  const ARP = [0, 2, 4, 6, 4, 2, 0, 2]; // índices na escala

  function scheduleNote(freq, t0, dur, vol, type) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = type || 'triangle';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function musicTick() {
    if (muted || !ctx) return;
    const t = ctx.currentTime + 0.05;
    const stepDur = 60 / 96 / 2; // colcheia ~0.3125s
    const bar = Math.floor(musicStep / 8) % BASS.length;
    // baixo a cada 8 passos
    if (musicStep % 8 === 0) {
      const semi = SCALE[BASS[bar]] + 12; // uma oitava acima do grau
      scheduleNote(noteFreq(semi), t, stepDur * 7, 0.12, 'sine');
    }
    // arpejo a cada passo
    const deg = ARP[musicStep % ARP.length];
    const semi = SCALE[deg] + 24; // duas oitavas acima
    scheduleNote(noteFreq(semi), t, stepDur * 0.9, 0.06, 'triangle');
    musicStep++;
  }

  function music(on) {
    if (on) {
      if (!ensureCtx()) return;
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
      if (musicTimer) return;
      musicStep = 0;
      musicTimer = setInterval(musicTick, 60 / 96 / 2 * 1000);
    } else {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    }
  }

  return {
    init() { ensureCtx(); },
    play,
    music,
    toggle() { muted = !muted; if (muted) music(false); return muted; },
    get muted() { return muted; },
    set muted(v) { muted = !!v; if (muted) music(false); }
  };
})();
