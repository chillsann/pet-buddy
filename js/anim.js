/* ============================================================
   anim.js — 宠物动作系统（v1.1）
   随机待机小动作 + 情绪表演 + 表情粒子
   ============================================================ */
"use strict";

const PetAnim = (() => {

  const entries = new Map(); // svgEl -> { timer, busy, mood }

  /* ---------- 一次性 class 动画 ---------- */
  function animateEl(el, cls, dur, done) {
    if (!el) { if (done) done(); return; }
    el.classList.remove(cls);
    void el.offsetWidth; /* 重触发 */
    el.classList.add(cls);
    setTimeout(() => {
      el.classList.remove(cls);
      if (done) done();
    }, dur);
  }

  function part(svgEl, sel) { return svgEl.querySelector(sel); }

  /* ================= 动作库 ================= */

  const ACTIONS = {
    /* 跳一下（开心） */
    hop(svg, done) {
      animateEl(svg, "act-hop", 620, done);
    },
    /* 大跳（玩耍） */
    jump(svg, done) {
      animateEl(svg, "act-jump", 780, done);
    },
    /* 歪头卖萌 */
    tilt(svg, done) {
      animateEl(part(svg, ".pet-head-group"), "act-tilt", 900, done);
    },
    /* 快速摇尾巴 */
    wag(svg, done) {
      animateEl(part(svg, ".pet-tail-group"), "act-wag", 1000, done);
    },
    /* 抖耳朵 */
    earTwitch(svg, done) {
      animateEl(part(svg, ".pet-ears"), "act-ear-twitch", 700, done);
    },
    /* 东张西望 */
    lookAround(svg, done) {
      animateEl(part(svg, ".pet-head-group"), "act-look-around", 1300, done);
    },
    /* 打喷嚏 */
    sneeze(svg, done) {
      const head = part(svg, ".pet-head-group");
      animateEl(head, "act-sneeze", 900, () => {
        spawnEmote(svg, "💨", 0);
        if (done) done();
      });
    },
    /* 打瞌睡点头 */
    sleepNod(svg, done) {
      animateEl(part(svg, ".pet-head-group"), "act-sleep-nod", 1800, done);
    },
    /* 打哈欠 */
    yawn(svg, done) {
      const head = part(svg, ".pet-head-group");
      animateEl(head, "act-yawn", 1400, () => {
        spawnEmote(svg, "💤", 0);
        if (done) done();
      });
    },
    /* 委屈叹气 */
    sigh(svg, done) {
      animateEl(part(svg, ".pet-head-group"), "act-sigh", 1500, () => {
        spawnEmote(svg, "💧", 0);
        if (done) done();
      });
    },
    /* 吃东西 */
    eat(svg, done) {
      animateEl(part(svg, ".pet-head-group"), "act-eat", 1100, () => {
        spawnEmote(svg, "😋", 0);
        if (done) done();
      });
    },
    /* 跳舞（表扬/升级） */
    dance(svg, done) {
      animateEl(svg, "act-dance", 1500, () => {
        spawnEmote(svg, "💖", 0);
        spawnEmote(svg, "🎵", 1);
        if (done) done();
      });
    },
    /* 旋转庆祝（升级） */
    spin(svg, done) {
      animateEl(svg, "act-spin", 900, done);
    },
    /* 抖水（洗澡） */
    shake(svg, done) {
      animateEl(svg, "act-shake", 900, () => {
        spawnEmote(svg, "💦", 0);
        spawnEmote(svg, "✨", 1);
        if (done) done();
      });
    },
  };

  /* ================= 对外播放 ================= */

  /**
   * 播放指定动作
   * @param {SVGElement} svgEl
   * @param {string} action 动作名
   * @param {function} [done] 完成回调
   */
  function play(svgEl, action, done) {
    const fn = ACTIONS[action];
    if (!svgEl || !fn) { if (done) done(); return; }
    fn(svgEl, done);
  }

  /* ================= 表情粒子 ================= */

  const EMOTES = ["💖", "🎵", "✨", "😋", "💤", "💧", "⭐", "🌸"];
  function spawnEmote(svgEl, text, delayIdx = 0) {
    const host = svgEl.closest(".pet-avatar") || svgEl.parentElement;
    if (!host) return;
    const el = document.createElement("span");
    el.className = "pet-emote";
    el.textContent = text || EMOTES[Math.floor(Math.random() * EMOTES.length)];
    el.style.left = (30 + Math.random() * 40) + "%";
    el.style.animationDelay = (delayIdx * 0.35) + "s";
    host.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  /* ================= 随机待机循环 ================= */

  const IDLE_POOL = {
    happy:   ["hop", "tilt", "wag", "earTwitch", "lookAround", "sneeze"],
    hungry:  ["lookAround", "earTwitch", "wag"],
    sleepy:  ["sleepNod", "yawn", "earTwitch"],
    dirty:   ["shake", "earTwitch", "sigh"],
    sad:     ["sigh", "earTwitch", "wag"],
  };

  function scheduleNext(entry, svgEl) {
    if (!entries.has(svgEl)) return;
    const delay = 2400 + Math.random() * 3600;
    entry.timer = setTimeout(() => {
      if (!entries.has(svgEl)) return;
      if (entry.busy) { scheduleNext(entry, svgEl); return; }
      const mood = svgEl.dataset.mood || "happy";
      const pool = IDLE_POOL[mood] || IDLE_POOL.happy;
      const act = pool[Math.floor(Math.random() * pool.length)];
      entry.busy = true;
      play(svgEl, act, () => {
        entry.busy = false;
        scheduleNext(entry, svgEl);
      });
    }, delay);
  }

  /** 挂载一只宠物，开始随机待机表演 */
  function attach(svgEl, kidIdx) {
    if (!svgEl) return;
    detach(svgEl);
    const entry = { kidIdx, timer: null, busy: false };
    entries.set(svgEl, entry);
    scheduleNext(entry, svgEl);
  }

  /** 卸载（重新渲染前调用，防止旧节点定时器泄漏） */
  function detach(svgEl) {
    const entry = entries.get(svgEl);
    if (entry) {
      clearTimeout(entry.timer);
      entries.delete(svgEl);
    }
  }

  function detachAll() {
    for (const [svg] of entries) detach(svg);
  }

  return { attach, detach, detachAll, play, spawnEmote };
})();

window.PetAnim = PetAnim;
