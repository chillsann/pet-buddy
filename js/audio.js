/* ============================================================
   audio.js — WebAudio 程序化音效（无外部音频文件）
   ============================================================ */
"use strict";

const AudioFX = (() => {
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /** 单个音符 */
  function tone(freq, t0, dur, { type = "sine", vol = 0.18, glide = 0 } = {}) {
    const a = ac();
    if (!a || !enabled) return;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, a.currentTime + t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + glide), a.currentTime + t0 + dur);
    g.gain.setValueAtTime(0.0001, a.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(vol, a.currentTime + t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(a.currentTime + t0);
    o.stop(a.currentTime + t0 + dur + 0.05);
  }

  /** 噪声（用于 pop/刷子声） */
  function noise(t0, dur, { vol = 0.12, freq = 1200 } = {}) {
    const a = ac();
    if (!a || !enabled) return;
    const n = a.sampleRate * dur;
    const buf = a.createBuffer(1, n, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.createBufferSource();
    src.buffer = buf;
    const f = a.createBiquadFilter();
    f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 0.8;
    const g = a.createGain();
    g.gain.setValueAtTime(vol, a.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
    src.connect(f).connect(g).connect(a.destination);
    src.start(a.currentTime + t0);
  }

  const sfx = {
    click()  { tone(660, 0, .07, { type: "triangle", vol: .10 }); },
    coin()   { tone(988, 0, .09, { type: "square", vol: .07 }); tone(1319, .07, .16, { type: "square", vol: .07 }); },
    praise() { /* 上升琶音 C-E-G-C */ [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .09, .22, { type: "triangle", vol: .14 })); },
    level()  { /* 号角 */ [392, 523, 659, 784].forEach((f, i) => tone(f, i * .11, .4, { type: "sawtooth", vol: .10 })); tone(1047, .46, .6, { type: "triangle", vol: .14 }); },
    eat()    { tone(420, 0, .08, { type: "sine", vol: .16, glide: 180 }); tone(360, .12, .1, { type: "sine", vol: .14, glide: 160 }); },
    wash()   { noise(0, .3, { vol: .07, freq: 900 }); noise(.25, .3, { vol: .06, freq: 1400 }); },
    play()   { [740, 880, 740, 988].forEach((f, i) => tone(f, i * .08, .12, { type: "sine", vol: .12 })); },
    error()  { tone(220, 0, .22, { type: "sawtooth", vol: .10, glide: -80 }); },
    badge()  { [659, 784, 988, 1175, 1319].forEach((f, i) => tone(f, i * .08, .3, { type: "triangle", vol: .12 })); },
    pop()    { tone(520, 0, .09, { type: "sine", vol: .16, glide: 260 }); },
  };

  return {
    play(name) { try { if (sfx[name]) sfx[name](); } catch (e) { /* 静默失败 */ } },
    toggle() { enabled = !enabled; return enabled; },
    get enabled() { return enabled; },
  };
})();

window.AudioFX = AudioFX;
