/* ============================================================
   ui.js — 渲染层：屏幕 / 宠物卡片 / 弹窗 / 动效
   ============================================================ */
"use strict";

const UI = (() => {

  /* ================= 屏幕切换 ================= */

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  }

  /* ================= Toast ================= */

  function toast(msg, ms = 2200) {
    const root = document.getElementById("toast-root");
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => t.remove(), ms + 400);
  }

  /* ================= 弹窗系统 ================= */

  function modal({ title, sub, body, actions = [], onClose, wide = false }) {
    const root = document.getElementById("modal-root");
    const mask = document.createElement("div");
    mask.className = "modal-mask";

    const box = document.createElement("div");
    box.className = "modal" + (wide ? " modal-wide" : "");
    if (wide) box.style.maxWidth = "640px";

    let html = "";
    if (title) html += `<h3 class="modal-title">${title}</h3>`;
    if (sub) html += `<p class="modal-sub">${sub}</p>`;
    html += `<div class="modal-body">${body}</div>`;
    box.innerHTML = html;

    if (actions.length) {
      const acts = document.createElement("div");
      acts.className = "modal-actions";
      actions.forEach(a => {
        const b = document.createElement("button");
        b.className = "btn " + (a.cls || "btn-plain");
        b.textContent = a.label;
        b.onclick = () => {
          AudioFX.play("click");
          if (a.fn) { const r = a.fn(); if (r === false) return; }
          closeModal();
        };
        acts.appendChild(b);
      });
      box.appendChild(acts);
    } else {
      /* 兜底：无按钮时给一个默认关闭按钮，防止卡死 */
      const acts = document.createElement("div");
      acts.className = "modal-actions";
      const b = document.createElement("button");
      b.className = "btn btn-primary";
      b.textContent = "知道啦";
      b.onclick = () => { AudioFX.play("click"); closeModal(); };
      acts.appendChild(b);
      box.appendChild(acts);
    }

    mask.appendChild(box);
    mask.addEventListener("click", (e) => { if (e.target === mask) closeModal(); });
    root.appendChild(mask);

    function closeModal() {
      mask.style.animation = "fadeIn .18s reverse";
      setTimeout(() => { mask.remove(); if (onClose) onClose(); }, 150);
    }
    return { el: box, close: closeModal };
  }

  /* ================= 动效 ================= */

  function fxFloat(x, y, text, color) {
    const layer = document.getElementById("fx-layer");
    const el = document.createElement("div");
    el.className = "fx-float";
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    if (color) el.style.color = color;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  function fxCoins(x, y, n = 6) {
    const layer = document.getElementById("fx-layer");
    for (let i = 0; i < n; i++) {
      const c = document.createElement("div");
      c.className = "fx-coin";
      c.style.left = (x + (Math.random() - 0.5) * 60) + "px";
      c.style.top = (y + (Math.random() - 0.5) * 30) + "px";
      c.style.setProperty("--dx", ((Math.random() - 0.5) * 90) + "px");
      c.style.setProperty("--dy", (-70 - Math.random() * 70) + "px");
      c.style.animationDelay = (i * 0.05) + "s";
      layer.appendChild(c);
      setTimeout(() => c.remove(), 1300);
    }
  }

  function fxConfetti() {
    const layer = document.getElementById("fx-layer");
    const colors = ["#ef8a3c", "#7fb069", "#f2a3b6", "#7aa5d2", "#e8b73c"];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement("div");
      p.className = "fx-confetti";
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (1.6 + Math.random() * 1.6) + "s";
      p.style.animationDelay = (Math.random() * 0.5) + "s";
      layer.appendChild(p);
      setTimeout(() => p.remove(), 4000);
    }
  }

  function levelupBanner(petName, level, line) {
    const el = document.createElement("div");
    el.className = "levelup-banner";
    el.innerHTML = `
      <div class="levelup-inner">
        <div class="lu-rays"></div>
        <div class="lu-title">LEVEL UP!</div>
        <div class="lu-sub">${petName} 升到了 ${level} 级<br>${line}</div>
      </div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  /* ================= 宠物卡片 ================= */

  function petCardHTML(kid, idx, leader) {
    const sp = speciesById(kid.species);
    const stage = stageOf(kid.level);
    const need = expForLevel(kid.level);
    const pct = Math.min(100, Math.round((kid.exp / need) * 100));
    const worn = kid.accs.filter(a => a.worn).map(a => a.emoji);
    const svg = Art.petSVG(kid.species, { level: kid.level, stats: kid.stats, accs: worn });
    const line = petLine(kid.stats);
    const maxed = kid.level >= MAX_LEVEL;

    const statBar = (key, icon, label) => {
      const v = Math.round(kid.stats[key]);
      return `
        <div class="stat">
          <div class="stat-icon ${key}">${icon}</div>
          <div class="stat-body">
            <div class="stat-label"><span>${label}</span><span data-stat-num="${key}">${v}</span></div>
            <div class="stat-bar"><div class="stat-fill ${key} ${v < 25 ? "low" : ""}" data-stat-bar="${key}" style="width:${v}%"></div></div>
          </div>
        </div>`;
    };

    const accRow = kid.accs.length
      ? kid.accs.map(a => `<button class="pet-acc" data-kid="${idx}" data-acc="${a.emoji}" title="点击戴上/脱下" style="${a.worn ? "" : "opacity:.35;filter:grayscale(1)"}">${a.emoji}</button>`).join("")
      : `<span class="pet-acc-empty">还没有装扮，去商店逛逛～</span>`;

    return `
      <div class="pet-card ${leader ? "leader" : ""}" data-kid="${idx}" data-species="${kid.species}" data-level="${kid.level}" style="--tint:${sp.tint}">
        ${leader ? `<div class="leader-flag">👑 领先者</div>` : ""}
        <div class="pet-stage" data-stage="${idx}" data-species="${kid.species}" title="拖动旋转 · 点一下互动">
          <div class="stage-bg"></div>
          <div class="stage-floor"></div>
          <div class="stage-deco d1">🌿</div>
          <div class="stage-deco d2">🌼</div>
          <div class="stage-deco d3">✨</div>
          <div class="stage-tag" data-field="stageTag">${stage.name}</div>
          <div class="stage-lv" data-field="stageLv">Lv.${kid.level}</div>
          <div class="stage-hint">↔ 拖动旋转</div>
          <!-- 2D 回退内容（3D 不可用时显示） -->
          <div class="pet-avatar pet-avatar-fallback" data-pat="${idx}" title="点我互动" style="display:none">
            ${svg}
          </div>
        </div>
        <div class="pet-info">
          <div class="pet-name-row">
            <span class="pet-name" data-field="petName">${escapeHTML(kid.petName)}</span>
            <span class="pet-owner">${escapeHTML(kid.name)}的宝贝</span>
          </div>
          <div class="coin-line">
            <span class="coin-icon">¥</span><span class="coin-num" data-field="coins">${kid.coins}</span>
            <span class="coin-label">金币</span>
          </div>
          <div class="exp-wrap">
            <div class="exp-bar"><div class="exp-fill" data-field="expFill" style="width:${maxed ? 100 : pct}%"></div></div>
            <div class="exp-text" data-field="expText">${maxed ? "已满级 · 传奇王者 ✨" : `经验 ${kid.exp} / ${need} · 距下级还差 ${need - kid.exp}`}</div>
          </div>
          <div class="stats">
            ${statBar("food", "🍖", "饱食")}
            ${statBar("mood", "💗", "心情")}
            ${statBar("clean", "🧼", "清洁")}
            ${statBar("energy", "⚡", "精力")}
          </div>
          <div class="pet-speech" data-field="speech">💬 ${line}</div>
          <div class="pet-acc-row" data-field="accRow">${accRow}</div>
        </div>
      </div>`;
  }

  /* ---------- 宠物互动（点一下） ---------- */
  function tapPet(kidIdx) {
    const st = Game.state;
    const kid = st.kids[kidIdx];
    AudioFX.play("pop");
    playAction(kidIdx, "hop");
    spawnEmote(kidIdx, Math.random() < 0.5 ? "💖" : "✨");
    if (kid.stats.mood < 96) kid.stats.mood = Game.clamp(kid.stats.mood + 1, 0, 100);
    Game.save();
    const speech = document.querySelector(`.pet-card[data-kid="${kidIdx}"] .pet-speech`);
    if (speech) {
      speech.textContent = "💬 " + petLine(kid.stats);
      speech.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }], { duration: 350 });
    }
  }

  /* ---------- 动作统一入口（3D 优先，回退 2D） ---------- */
  function playAction(kidIdx, action) {
    const card = document.querySelector(`.pet-card[data-kid="${kidIdx}"]`);
    if (!card) return;
    const stageEl = card.querySelector(".pet-stage");
    if (stageEl && Pet3D.stage(stageEl)) {
      Pet3D.play(stageEl, action);
      return;
    }
    const svg = card.querySelector(".pet-svg");
    if (svg) PetAnim.play(svg, action === "sleep" ? "sleepNod" : action);
  }

  /* ---------- 舞台漂浮表情 ---------- */
  function spawnEmote(kidIdx, text) {
    const card = document.querySelector(`.pet-card[data-kid="${kidIdx}"] .pet-stage`);
    if (!card) return;
    const el = document.createElement("span");
    el.className = "pet-emote";
    el.textContent = text;
    el.style.left = (32 + Math.random() * 36) + "%";
    el.style.bottom = "26%";
    card.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  /* ---------- 绑定装扮按钮 ---------- */
  function bindAccButtons(scope) {
    scope.querySelectorAll(".pet-acc").forEach(b => {
      b.onclick = () => {
        AudioFX.play("click");
        Game.toggleAcc(+b.dataset.kid, b.dataset.acc);
        renderBoard();
      };
    });
  }

  /* ---------- 增量更新（不重建 3D，避免闪烁） ---------- */
  function updateCards() {
    const st = Game.state;
    const leader = totalExp(st.kids[0]) >= totalExp(st.kids[1]) ? 0 : 1;

    st.kids.forEach((kid, idx) => {
      const card = document.querySelector(`.pet-card[data-kid="${idx}"]`);
      if (!card) return;
      const stageInfo = stageOf(kid.level);
      const need = expForLevel(kid.level);
      const pct = Math.min(100, Math.round((kid.exp / need) * 100));
      const maxed = kid.level >= MAX_LEVEL;

      card.dataset.level = kid.level;
      card.classList.toggle("leader", leader === idx);
      if (leader === idx && !card.querySelector(".leader-flag")) {
        const f = document.createElement("div");
        f.className = "leader-flag";
        f.textContent = "👑 领先者";
        card.prepend(f);
      } else if (leader !== idx) {
        const f = card.querySelector(".leader-flag");
        if (f) f.remove();
      }

      const set = (field, val) => {
        const el = card.querySelector(`[data-field="${field}"]`);
        if (el) el.textContent = val;
      };
      set("petName", kid.petName);
      set("coins", kid.coins);
      set("stageTag", stageInfo.name);
      set("stageLv", "Lv." + kid.level);
      set("speech", "💬 " + petLine(kid.stats));

      const fill = card.querySelector('[data-field="expFill"]');
      if (fill) fill.style.width = (maxed ? 100 : pct) + "%";
      set("expText", maxed ? "已满级 · 传奇王者 ✨" : `经验 ${kid.exp} / ${need} · 距下级还差 ${need - kid.exp}`);

      ["food", "mood", "clean", "energy"].forEach(key => {
        const v = Math.round(kid.stats[key]);
        const num = card.querySelector(`[data-stat-num="${key}"]`);
        const bar = card.querySelector(`[data-stat-bar="${key}"]`);
        if (num) num.textContent = v;
        if (bar) { bar.style.width = v + "%"; bar.classList.toggle("low", v < 25); }
      });

      /* 装扮行 */
      const accRow = card.querySelector('[data-field="accRow"]');
      if (accRow) {
        accRow.innerHTML = kid.accs.length
          ? kid.accs.map(a => `<button class="pet-acc" data-kid="${idx}" data-acc="${a.emoji}" style="${a.worn ? "" : "opacity:.35;filter:grayscale(1)"}">${a.emoji}</button>`).join("")
          : `<span class="pet-acc-empty">还没有装扮，去商店逛逛～</span>`;
        bindAccButtons(accRow);
      }

      /* 3D / 2D 刷新（等级变化会重建模型） */
      const stageEl = card.querySelector(".pet-stage");
      if (stageEl && Pet3D.stage(stageEl)) {
        Pet3D.refresh(stageEl, { level: kid.level, stats: kid.stats });
      } else {
        const fb = card.querySelector(".pet-avatar-fallback");
        if (fb) {
          fb.innerHTML = Art.petSVG(kid.species, { level: kid.level, stats: kid.stats });
          const svg = fb.querySelector(".pet-svg");
          if (svg) PetAnim.attach(svg, idx);
        }
      }
    });
  }

  function renderBoard(force = false) {
    const st = Game.state;
    const board = document.getElementById("board");

    /* 若结构与物种未变 → 只更新数值，保留正在运行的 3D 场景 */
    const cards = board.querySelectorAll(".pet-card");
    const sameStructure = !force && cards.length === 2 &&
      cards[0].dataset.species === st.kids[0].species &&
      cards[1].dataset.species === st.kids[1].species &&
      board.querySelectorAll(".pet-stage.is-3d").length === 2;
    if (sameStructure) { updateCards(); return; }

    /* 清理旧宠物动画/3D 资源，防止泄漏 */
    PetAnim.detachAll();
    Pet3D.unmountAll();
    const leader = totalExp(st.kids[0]) >= totalExp(st.kids[1]) ? 0 : 1;
    board.innerHTML = petCardHTML(st.kids[0], 0, leader === 0) + petCardHTML(st.kids[1], 1, leader === 1);

    /* 挂载 3D 舞台；失败则回退 2D SVG */
    board.querySelectorAll(".pet-stage").forEach(stageEl => {
      const idx = +stageEl.dataset.stage;
      const kid = st.kids[idx];
      const ok = Pet3D.mount(stageEl, kid.species, { level: kid.level, stats: kid.stats });
      if (ok) {
        stageEl.classList.add("is-3d");
        Pet3D.onTap(stageEl, () => tapPet(idx));
      } else {
        stageEl.classList.add("is-2d");
        const fb = stageEl.querySelector(".pet-avatar-fallback");
        if (fb) {
          fb.style.display = "";
          const svg = fb.querySelector(".pet-svg");
          if (svg) PetAnim.attach(svg, idx);
          fb.onclick = () => tapPet(idx);
        }
      }
    });

    bindAccButtons(board);
  }

  function totalExp(kid) {
    let total = kid.exp;
    for (let l = 1; l < kid.level; l++) total += expForLevel(l);
    return total;
  }

  /* ================= HTML 转义 ================= */

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  /* ================= 表扬弹窗 ================= */

  function openPraise() {
    const st = Game.state;
    let pickKid = 0;
    let pickType = null;
    let customScore = 10;

    const kidBtn = (i) => `
      <button class="praise-kid ${i === pickKid ? "selected" : ""}" data-kid="${i}">
        ${Art.petIconSVG(st.kids[i].species)}
        <span>${escapeHTML(st.kids[i].petName)}<br><small style="font-weight:600;color:var(--ink-faint)">${escapeHTML(st.kids[i].name)}</small></span>
      </button>`;

    const typeBtn = (t) => `
      <button class="praise-type ${pickType === t.id ? "selected" : ""}" data-type="${t.id}">
        <span class="pt-icon">${t.icon}</span>
        <span>${t.name}</span>
        ${t.custom ? "" : `<span class="pt-score">+${t.score}</span>`}
      </button>`;

    function bodyHTML() {
      return `
        <div class="praise-kid-pick">${kidBtn(0)}${kidBtn(1)}</div>
        <div class="praise-types">${PRAISE_TYPES.map(typeBtn).join("")}</div>
        <div id="custom-wrap" style="display:${pickType === "custom" ? "block" : "none"}">
          <div class="custom-score-row">
            <span style="font-size:13px;font-weight:700;color:var(--ink-soft)">自定义分值（1-20）</span>
            <input type="number" id="custom-score" min="1" max="20" value="${customScore}">
          </div>
        </div>
        <textarea class="praise-note" id="praise-note" maxlength="40" placeholder="表扬理由（可选）：比如「今天主动练琴 20 分钟，真棒！」"></textarea>`;
    }

    const m = modal({
      title: "🌟 表扬时刻",
      sub: "生活中每一次值得表扬的小进步，都值得被记录",
      body: bodyHTML(),
      actions: [
        { label: "取消", cls: "btn-plain" },
        {
          label: "给予表扬 🎉", cls: "btn-primary", fn: () => {
            if (!pickType) { toast("请先选择表扬类型～"); return false; }
            const note = m.el.querySelector("#praise-note").value.trim();
            const cs = pickType === "custom"
              ? Game.clamp(parseInt(m.el.querySelector("#custom-score").value, 10) || 10, 1, 20)
              : 0;
            doPraise(pickKid, pickType, note, cs);
          }
        },
      ],
    });

    /* 事件绑定 */
    m.el.querySelectorAll(".praise-kid").forEach(b => {
      b.onclick = () => {
        pickKid = +b.dataset.kid;
        m.el.querySelectorAll(".praise-kid").forEach(x => x.classList.toggle("selected", +x.dataset.kid === pickKid));
        AudioFX.play("click");
      };
    });
    m.el.querySelectorAll(".praise-type").forEach(b => {
      b.onclick = () => {
        pickType = b.dataset.type;
        m.el.querySelectorAll(".praise-type").forEach(x => x.classList.toggle("selected", x.dataset.type === pickType));
        m.el.querySelector("#custom-wrap").style.display = pickType === "custom" ? "block" : "none";
        AudioFX.play("click");
      };
    });
    const cs = m.el.querySelector("#custom-score");
    if (cs) cs.oninput = () => { customScore = +cs.value; };
  }

  function doPraise(kidIdx, typeId, note, customScore) {
    const r = Game.praise(kidIdx, typeId, note, customScore);
    if (!r) return;
    Game.save();
    AudioFX.play("praise");

    /* 先重绘（新形态/新状态），再在新节点上播放庆祝动作 */
    renderBoard();
    renderCheckinChip();
    playAction(kidIdx, "dance");

    /* 飘字定位到对应宠物卡片 */
    const card = document.querySelector(`.pet-card[data-kid="${kidIdx}"]`);
    if (card) {
      const rect = card.getBoundingClientRect();
      fxFloat(rect.left + rect.width / 2 - 20, rect.top + 90, `+${r.score} EXP`);
      fxFloat(rect.left + rect.width / 2 - 20, rect.top + 130, `+${r.coins} 🪙`, "#b98a1e");
      fxCoins(rect.left + rect.width / 2, rect.top + 120);
    }

    if (r.leveled.length) {
      const kid = Game.state.kids[kidIdx];
      setTimeout(() => {
        AudioFX.play("level");
        playAction(kidIdx, "spin");
        levelupBanner(kid.petName, r.leveled[r.leveled.length - 1], levelUpLine(r.leveled[r.leveled.length - 1]));
        fxConfetti();
      }, 600);
    }
    if (r.badges.length) {
      setTimeout(() => {
        AudioFX.play("badge");
        r.badges.forEach(b => toast(`🏆 解锁成就「${b.name}」！`));
      }, r.leveled.length ? 900 : 300);
    }
    if (note) {
      setTimeout(() => toast(`📝 已记入成长日记：${note}`), 700);
    }
  }

  /* ================= 商店弹窗 ================= */

  function openShop() {
    const st = Game.state;
    let pickKid = 0;

    function itemHTML(item) {
      const kid = st.kids[pickKid];
      const owned = item.kind === "acc" && kid.accs.some(a => a.emoji === item.acc);
      const afford = kid.coins >= item.price;
      return `
        <div class="shop-item ${owned ? "owned" : ""}">
          <div class="si-icon">${item.icon}</div>
          <div class="si-name">${item.name}</div>
          <div class="si-desc">${item.desc}</div>
          <div class="si-price">${item.price}</div>
          <button class="btn ${owned ? "btn-plain" : afford ? "btn-primary" : "btn-plain"}" data-item="${item.id}" ${owned || !afford ? "disabled" : ""}>
            ${owned ? "已拥有 ✓" : afford ? "购买" : "金币不足"}
          </button>
        </div>`;
    }

    function bodyHTML() {
      const kid = st.kids[pickKid];
      return `
        <div class="praise-kid-pick" style="margin-bottom:14px">
          <button class="praise-kid ${pickKid === 0 ? "selected" : ""}" data-kid="0">${Art.petIconSVG(st.kids[0].species)}<span>${escapeHTML(st.kids[0].petName)}<br><small style="font-weight:600;color:var(--ink-faint)">🪙 ${st.kids[0].coins}</small></span></button>
          <button class="praise-kid ${pickKid === 1 ? "selected" : ""}" data-kid="1">${Art.petIconSVG(st.kids[1].species)}<span>${escapeHTML(st.kids[1].petName)}<br><small style="font-weight:600;color:var(--ink-faint)">🪙 ${st.kids[1].coins}</small></span></button>
        </div>
        <div class="shop-grid">${SHOP_ITEMS.map(itemHTML).join("")}</div>`;
    }

    const m = modal({
      title: "🛍️ 宠物商店",
      sub: "金币来自每一次表扬与照顾，理性消费也是财商课哦",
      body: bodyHTML(),
      actions: [{ label: "买好啦", cls: "btn-primary" }],
      wide: true,
    });

    m.el.querySelectorAll(".praise-kid").forEach(b => {
      b.onclick = () => {
        pickKid = +b.dataset.kid;
        AudioFX.play("click");
        m.el.querySelector(".modal-body").innerHTML = bodyHTML();
        bindItems();
      };
    });

    function bindItems() {
      m.el.querySelectorAll("[data-item]").forEach(b => {
        b.onclick = () => {
          const r = Game.buy(pickKid, b.dataset.item);
          if (!r || !r.ok) {
            AudioFX.play("error");
            toast(r && r.reason === "owned" ? "已经拥有这件装扮啦" : "金币不够，快去赚取表扬吧！");
            return;
          }
          Game.save();
          AudioFX.play("coin");
          const rect = b.getBoundingClientRect();
          fxFloat(rect.left + rect.width / 2 - 30, rect.top - 10, `-${r.item.price} 🪙`, "#b98a1e");
          if (r.kind === "acc") {
            toast(`${r.item.icon} 新装扮到手！`);
          } else {
            toast(`${r.item.icon} ${Game.state.kids[pickKid].petName} 很喜欢！`);
          }
          if (r.badges && r.badges.length) {
            r.badges.forEach(bd => { AudioFX.play("badge"); toast(`🏆 解锁成就「${bd.name}」！`); });
          }
          m.el.querySelector(".modal-body").innerHTML = bodyHTML();
          bindItems();
          renderBoard();
        };
      });
    }
    bindItems();
  }

  /* ================= 成就墙 ================= */

  function openBadges() {
    const st = Game.state;
    function ownerOf(badgeId) {
      const owners = st.kids.filter(k => k.badges.includes(badgeId));
      if (!owners.length) return "";
      return `<div class="bi-owner">${owners.map(k => escapeHTML(k.petName)).join(" · ")}</div>`;
    }
    const body = `
      <div class="badge-grid">
        ${BADGES.map(b => {
          const unlocked = st.kids.some(k => k.badges.includes(b.id));
          return `
            <div class="badge-item ${unlocked ? "unlocked" : ""}">
              <div class="bi-icon">${b.icon}</div>
              <div class="bi-name">${b.name}</div>
              <div class="bi-desc">${b.desc}</div>
              ${ownerOf(b.id)}
            </div>`;
        }).join("")}
      </div>`;
    const got = st.kids.reduce((n, k) => n + k.badges.length, 0);
    modal({
      title: "🏆 成就墙",
      sub: `已收集 ${got} / ${BADGES.length * 2} 枚徽章（每只宠物可独立收集）`,
      body,
      actions: [{ label: "继续努力", cls: "btn-primary" }],
      wide: true,
    });
  }

  /* ================= 成长日记 ================= */

  function openDiary() {
    const st = Game.state;
    function itemHTML(h) {
      const kid = st.kids[h.kid];
      return `
        <div class="diary-item di-${h.type}">
          <div class="di-icon">${h.icon}</div>
          <div class="di-body">
            <div class="di-title">${escapeHTML(h.title)} <span style="font-weight:600;color:var(--ink-faint)">· ${kid ? escapeHTML(kid.petName) : ""}</span></div>
            ${h.note ? `<div class="di-note">${escapeHTML(h.note)}</div>` : ""}
          </div>
          <div class="di-time">${Game.fmtTime(h.t)}</div>
        </div>`;
    }
    const body = st.history.length
      ? `<div class="diary-list">${st.history.map(itemHTML).join("")}</div>`
      : `<div class="diary-empty">还没有记录哦，快去给孩子第一次表扬吧～</div>`;
    modal({
      title: "📖 成长日记",
      sub: "每一次表扬、照顾与进步，都定格在这里",
      body,
      actions: [{ label: "关闭", cls: "btn-primary" }],
      wide: true,
    });
  }

  /* ================= 设置 ================= */

  function openSettings() {
    const st = Game.state;
    const body = `
      <div class="setting-row">
        <div class="sr-label">💾 存档状态<small>上次保存：${Game.fmtTime(st.lastVisit || Date.now())} · 已自动保存 ${st.history ? st.history.length : 0} 条记录</small></div>
        <span class="save-ok">✓ 已保存</span>
      </div>
      <div class="setting-row">
        <div class="sr-label">🔗 存档码（跨设备）<small>复制一串文字，换手机/换浏览器粘贴即可恢复全部进度</small></div>
        <button class="btn btn-plain" id="set-code">复制</button>
      </div>
      <div class="setting-row">
        <div class="sr-label">📥 粘贴存档码恢复<small>把之前复制的存档码粘贴进来</small></div>
        <button class="btn btn-plain" id="set-restore">恢复</button>
      </div>
      <div class="setting-row">
        <div class="sr-label">🔔 游戏音效<small>表扬、升级、金币等提示音</small></div>
        <button class="btn btn-plain" id="set-sound">${st.soundOn ? "开启中" : "已关闭"}</button>
      </div>
      <div class="setting-row">
        <div class="sr-label">💾 导出备份文件<small>下载存档 JSON，换设备可恢复</small></div>
        <button class="btn btn-plain" id="set-export">导出</button>
      </div>
      <div class="setting-row">
        <div class="sr-label">📥 导入备份文件<small>选择之前导出的 JSON 存档</small></div>
        <button class="btn btn-plain" id="set-import">导入</button>
        <input type="file" id="import-file" accept=".json" style="display:none">
      </div>
      <div class="setting-row">
        <div class="sr-label">📜 玩法说明<small>给家长看的快速指南</small></div>
        <button class="btn btn-plain" id="set-help">查看</button>
      </div>
      <div class="setting-row">
        <div class="sr-label">🗑️ 重新开始<small>清空全部进度，不可恢复！</small></div>
        <button class="btn btn-danger" id="set-reset">重置</button>
      </div>`;

    const m = modal({
      title: "⚙️ 设置",
      body,
      actions: [{ label: "完成", cls: "btn-primary" }],
      wide: true,
    });

    m.el.querySelector("#set-code").onclick = () => openSaveCode();
    m.el.querySelector("#set-restore").onclick = () => openRestoreCode();
    m.el.querySelector("#set-sound").onclick = (e) => {
      const on = AudioFX.toggle();
      st.soundOn = on;
      Game.save();
      e.target.textContent = on ? "开启中" : "已关闭";
      if (on) AudioFX.play("click");
    };
    m.el.querySelector("#set-export").onclick = () => {
      const blob = new Blob([Game.exportData()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `pet-buddy-备份-${Game.todayStr()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("备份已导出 💾");
    };
    m.el.querySelector("#set-import").onclick = () => m.el.querySelector("#import-file").click();
    m.el.querySelector("#import-file").onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (Game.importData(reader.result)) {
          toast("导入成功，欢迎回来！");
          renderAll();
        } else {
          AudioFX.play("error");
          toast("存档文件无效，导入失败");
        }
      };
      reader.readAsText(f);
    };
    m.el.querySelector("#set-help").onclick = () => openHelp();
    m.el.querySelector("#set-reset").onclick = () => {
      modal({
        title: "⚠️ 确认重置",
        sub: "两只宠物的全部成长记录都会消失，且无法恢复。建议先导出备份。",
        actions: [
          { label: "取消", cls: "btn-plain" },
          {
            label: "确认重置", cls: "btn-danger", fn: () => {
              Game.reset();
              toast("已重置，重新开始养育之旅吧");
              setTimeout(() => location.reload(), 600);
            }
          },
        ],
      });
    };
  }

  /* ================= 存档码 ================= */

  function copyText(text) {
    const done = () => toast("已复制！保存到微信收藏或备忘录吧～");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); }
    catch (e) { toast("请长按文字手动复制"); }
    ta.remove();
  }

  function openSaveCode() {
    const code = Game.exportCode();
    modal({
      title: "🔗 存档码",
      sub: "复制这串文字保存好（微信收藏/备忘录）。换手机、换浏览器时粘贴即可恢复全部进度",
      body: `<textarea class="save-code-box" id="save-code-text" readonly>${code}</textarea>
             <p class="save-code-tip">共 ${code.length} 个字符 · 包含两只宠物的等级、金币、装扮、日记</p>`,
      actions: [
        { label: "关闭", cls: "btn-plain" },
        { label: "复制存档码", cls: "btn-primary", fn: () => copyText(code) },
      ],
      wide: true,
    });
  }

  function openRestoreCode() {
    modal({
      title: "📥 粘贴存档码",
      sub: "把之前复制的「PB1-」开头的存档码粘贴到这里，会覆盖当前进度",
      body: `<textarea class="save-code-box" id="restore-code" placeholder="PB1-..."></textarea>`,
      actions: [
        { label: "取消", cls: "btn-plain" },
        {
          label: "恢复进度", cls: "btn-primary", fn: () => {
            const el = document.getElementById("restore-code");
            const code = el ? el.value : "";
            if (Game.importCode(code)) {
              UI.toast("恢复成功，欢迎回来！");
              renderAll();
            } else {
              AudioFX.play("error");
              toast("存档码无效，请检查是否复制完整");
              return false;
            }
          }
        },
      ],
      wide: true,
    });
  }

  function openHelp() {
    modal({
      title: "📜 玩法说明",
      body: `
        <div style="font-size:14px;line-height:2;color:var(--ink-soft)">
          <p><b style="color:var(--ink)">🐾 双宠养成</b>：两个孩子各养一只宠物，同屏成长、互相见证。总经验高的一方会戴上「领先者」小皇冠。</p>
          <p><b style="color:var(--ink)">🌟 表扬加分</b>：生活中每一次值得表扬的进步（学习、家务、礼貌、作息……），家长点「表扬加分」记录下来，宠物获得经验与金币。坚持表扬，宠物就会不断升级进化：幼崽期 → 成长期 → 壮年期 → 传奇期！</p>
          <p><b style="color:var(--ink)">🍖 日常照顾</b>：喂食、玩耍、洗澡让小宠物保持饱食、心情、清洁、精力。状态不好时它会委屈给你看，照顾它也是孩子的责任课。</p>
          <p><b style="color:var(--ink)">🛍️ 金币商店</b>：金币来自表扬与照顾，可以买零食礼盒和永久装扮。</p>
          <p><b style="color:var(--ink)">📅 每日打卡</b>：每天首次进入点击顶部「打卡」领金币，连续打卡有额外奖励。</p>
          <p><b style="color:var(--ink)">🏆 成就 & 日记</b>：12 种成就徽章、300 条成长日记，记录每一步进步。</p>
        </div>`,
      actions: [{ label: "明白啦", cls: "btn-primary" }],
      wide: true,
    });
  }

  /* ================= 打卡 ================= */

  function renderCheckinChip() {
    const chip = document.getElementById("checkin-chip");
    if (!chip) return;
    if (Game.canCheckin()) {
      chip.textContent = "📅 打卡 +5";
      chip.style.display = "";
      chip.onclick = () => {
        const ev = Game.checkin();
        if (!ev) return;
        AudioFX.play("praise");
        ev.forEach(e => {
          const kid = Game.state.kids[e.kid];
          const card = document.querySelector(`.pet-card[data-kid="${e.kid}"]`);
          if (card) {
            const rect = card.getBoundingClientRect();
            fxFloat(rect.left + rect.width / 2 - 30, rect.top + 80, `+${e.bonus} 🪙`, "#b98a1e");
          }
          if (STREAK_BONUS[e.streak]) {
            setTimeout(() => { AudioFX.play("badge"); toast(`🔥 连续打卡 ${e.streak} 天，额外奖励 ${STREAK_BONUS[e.streak]} 金币！`); }, 400);
          }
          if (e.badges && e.badges.length) {
            e.badges.forEach(b => setTimeout(() => toast(`🏆 解锁成就「${b.name}」！`), 800));
          }
        });
        toast("打卡成功，明天再来哦～");
        renderCheckinChip();
        renderBoard();
      };
    } else {
      chip.textContent = "✅ 已打卡";
      chip.style.display = "";
      chip.style.animation = "none";
      chip.onclick = () => toast("今天已经打卡啦，明天继续加油！");
    }
  }

  /* ================= 全量渲染 ================= */

  function renderAll() {
    renderBoard();
    renderCheckinChip();
  }

  return {
    showScreen, toast, modal, renderBoard, renderAll, renderCheckinChip,
    openPraise, openShop, openBadges, openDiary, openSettings, openHelp,
    fxFloat, fxCoins, fxConfetti, levelupBanner, escapeHTML,
    playAction, spawnEmote, tapPet,
  };
})();

window.UI = UI;
