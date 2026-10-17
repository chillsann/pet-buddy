/* ============================================================
   main.js — 启动 / 设置流程 / 事件绑定
   ============================================================ */
"use strict";

(function main() {

  /* ================= 启动 ================= */

  /* 背景动态装饰：飘云 + 闪烁星星 */
  (function fillBgDecor() {
    const decor = document.getElementById("bg-decor");
    if (!decor) return;
    for (let i = 0; i < 3; i++) {
      const c = document.createElement("div");
      c.className = "bg-cloud";
      c.textContent = "☁️";
      c.style.top = (6 + Math.random() * 42) + "vh";
      c.style.fontSize = (26 + Math.random() * 24) + "px";
      c.style.animationDuration = (70 + Math.random() * 60) + "s";
      c.style.animationDelay = (-i * 28) + "s";
      decor.appendChild(c);
    }
    for (let i = 0; i < 7; i++) {
      const s = document.createElement("div");
      s.className = "bg-star";
      s.textContent = ["✨", "⭐", "🌟"][i % 3];
      s.style.left = Math.random() * 95 + "vw";
      s.style.top = Math.random() * 92 + "vh";
      s.style.animationDelay = (Math.random() * 3) + "s";
      decor.appendChild(s);
    }
  })();

  /* 欢迎屏宠物展示（随机 4 只） */
  (function fillWelcomePets() {
    const box = document.getElementById("welcome-pets");
    if (!box) return;
    const pool = [...SPECIES].sort(() => Math.random() - 0.5).slice(0, 4);
    box.innerHTML = pool.map(sp => Art.petIconSVG(sp.id)).join("");
  })();

  if (Game.hasSave()) {
    document.getElementById("btn-continue").style.display = "";
  }

  document.getElementById("btn-start").onclick = () => {
    AudioFX.play("click");
    UI.showScreen("screen-setup");
    renderPetGrids();
  };

  document.getElementById("btn-continue").onclick = () => {
    AudioFX.play("click");
    if (Game.load()) {
      Game.applyDecay();
      Game.save();
      enterGame();
      UI.toast("欢迎回来！宠物们很想你～");
    }
  };

  /* ================= 设置流程 ================= */

  let sel = { kid1: null, kid2: null };

  function renderPetGrids() {
    for (const which of ["1", "2"]) {
      const grid = document.getElementById("pet-grid-" + which);
      const other = which === "1" ? sel.kid2 : sel.kid1;
      grid.innerHTML = SPECIES.map(sp => {
        const taken = other && other.id === sp.id;
        const chosen = sel["kid" + which] && sel["kid" + which].id === sp.id;
        return `
          <button class="pet-option ${chosen ? "selected" : ""}" data-sp="${sp.id}" ${taken ? "disabled style='opacity:.35'" : ""}>
            ${Art.petIconSVG(sp.id)}
            <span class="pet-opt-name">${sp.name}${taken ? " · 已被选" : ""}</span>
          </button>`;
      }).join("");
      grid.querySelectorAll(".pet-option").forEach(b => {
        b.onclick = () => {
          AudioFX.play("pop");
          sel["kid" + which] = speciesById(b.dataset.sp);
          renderPetGrids();
        };
      });
    }
  }

  document.getElementById("setup-next-1").onclick = () => {
    const n1 = document.getElementById("setup-kid1-name").value.trim();
    const n2 = document.getElementById("setup-kid2-name").value.trim();
    if (!n1 || !n2) {
      AudioFX.play("error");
      UI.toast("请填写两个孩子的名字哦");
      return;
    }
    document.querySelector('[data-pane="1"]').style.display = "none";
    document.querySelector('[data-pane="2"]').style.display = "";
    document.querySelector('.step-dot[data-step="1"]').classList.remove("active");
    document.querySelector('.step-dot[data-step="2"]').classList.add("active");
    document.getElementById("pick-kid1-title").textContent = `给 ${n1} 选一只宠物`;
    document.getElementById("pick-kid2-title").textContent = `给 ${n2} 选一只宠物`;
    /* 默认推荐组合 */
    if (!sel.kid1) { sel.kid1 = SPECIES[0]; renderPetGrids(); }
    if (!sel.kid2) { sel.kid2 = SPECIES[1]; renderPetGrids(); }
    AudioFX.play("click");
  };

  document.getElementById("setup-finish").onclick = () => {
    if (!sel.kid1 || !sel.kid2) {
      AudioFX.play("error");
      UI.toast("请给两个孩子都选好宠物");
      return;
    }
    const n1 = document.getElementById("setup-kid1-name").value.trim();
    const n2 = document.getElementById("setup-kid2-name").value.trim();
    const p1 = document.getElementById("setup-pet1-name").value.trim();
    const p2 = document.getElementById("setup-pet2-name").value.trim();
    Game.newGame(n1, n2, sel.kid1.id, sel.kid2.id, p1, p2);
    AudioFX.play("praise");
    UI.fxConfetti();
    enterGame();
    setTimeout(() => UI.toast("养育开始！先带宠物们熟悉一下新家吧 🏠"), 500);
  };

  function enterGame() {
    UI.showScreen("screen-main");
    UI.renderAll();
  }

  /* ================= 主界面操作 ================= */

  /* 照顾动作（喂食/玩耍/洗澡）——先选宠物再执行 */
  function careFlow(action) {
    const st = Game.state;
    const c = CARE[action];
    const m = UI.modal({
      title: `${c.icon} ${c.name}`,
      sub: "选择要照顾的小宠物",
      body: `
        <div class="praise-kid-pick">
          ${st.kids.map((k, i) => {
            const remain = Game.careRemain(i, action);
            return `
              <button class="praise-kid" data-kid="${i}" ${remain > 0 ? "disabled style='opacity:.5'" : ""}>
                ${Art.petIconSVG(k.species)}
                <span>${UI.escapeHTML(k.petName)}<br>
                  <small style="font-weight:600;color:var(--ink-faint)">
                    ${remain > 0 ? `${Math.ceil(remain / 60000)} 分钟后才能${c.name}` : `点我${c.name}`}
                  </small></span>
              </button>`;
          }).join("")}
        </div>`,
      actions: [{ label: "下次再说", cls: "btn-plain" }],
    });

    /* 绑定（modal 返回的 el 即弹窗 DOM） */
    m.el.querySelectorAll(".praise-kid").forEach(b => {
      b.onclick = () => {
        const idx = +b.dataset.kid;
        const r = Game.care(idx, action);
        if (!r || !r.ok) {
          AudioFX.play("error");
          UI.toast(`${c.name}太频繁啦，${r && r.remainMin ? r.remainMin + " 分钟后再来" : "稍后再试"}`);
          return;
        }
        Game.save();
        AudioFX.play(action === "wash" ? "wash" : action === "play" ? "play" : "eat");
        /* 先重绘再在新节点上播放表演：吃东西 / 扑跳 / 抖水 */
        UI.renderAll();
        const svg = document.querySelector(`.pet-card[data-kid="${idx}"] .pet-svg`);
        if (svg) PetAnim.play(svg, action === "feed" ? "eat" : action === "play" ? "jump" : "shake");
        const card = document.querySelector(`.pet-card[data-kid="${idx}"]`);
        if (card) {
          const rect = card.getBoundingClientRect();
          UI.fxFloat(rect.left + rect.width / 2 - 30, rect.top + 80, `+${r.exp} EXP`);
          UI.fxFloat(rect.left + rect.width / 2 - 30, rect.top + 120, `+${r.coins} 🪙`, "#b98a1e");
          UI.fxCoins(rect.left + rect.width / 2, rect.top + 110, 4);
        }
        if (r.leveled.length) {
          const kid = Game.state.kids[idx];
          setTimeout(() => {
            AudioFX.play("level");
            UI.levelupBanner(kid.petName, r.leveled[r.leveled.length - 1], levelUpLine(r.leveled[r.leveled.length - 1]));
            UI.fxConfetti();
          }, 350);
        }
        if (r.badges && r.badges.length) {
          r.badges.forEach(bd => setTimeout(() => { AudioFX.play("badge"); UI.toast(`🏆 解锁成就「${bd.name}」！`); }, 900));
        }
        m.close();
        UI.modal({ title: "💕", body: `<p style="text-align:center;font-size:15px;font-weight:700;color:var(--ink-soft)">${r.line}</p>`, actions: [{ label: "好的", cls: "btn-primary" }] });
      };
    });
  }

  document.getElementById("btn-praise").onclick = () => { AudioFX.play("click"); UI.openPraise(); };
  document.getElementById("btn-feed").onclick = () => { AudioFX.play("click"); careFlow("feed"); };
  document.getElementById("btn-play").onclick = () => { AudioFX.play("click"); careFlow("play"); };
  document.getElementById("btn-wash").onclick = () => { AudioFX.play("click"); careFlow("wash"); };

  document.getElementById("btn-diary").onclick = () => { AudioFX.play("click"); UI.openDiary(); };
  document.getElementById("btn-badges").onclick = () => { AudioFX.play("click"); UI.openBadges(); };
  document.getElementById("btn-shop").onclick = () => { AudioFX.play("click"); UI.openShop(); };
  document.getElementById("btn-settings").onclick = () => { AudioFX.play("click"); UI.openSettings(); };

  /* ================= 离开时保存 ================= */

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && Game.state) Game.save();
  });
  window.addEventListener("beforeunload", () => { if (Game.state) Game.save(); });

  /* ================= 首次交互解锁音频 ================= */

  document.body.addEventListener("pointerdown", function unlock() {
    AudioFX.play("click");
    document.body.removeEventListener("pointerdown", unlock);
  }, { once: true });

})();
