/* ============================================================
   game.js — 核心状态机：存档 / 表扬 / 照顾 / 商店 / 打卡 / 成就
   ============================================================ */
"use strict";

const Game = (() => {

  /* ================= 数据结构 ================= */

  function defaultKid(name) {
    return {
      name: name || "小主人",
      petName: "",
      species: "cat",
      level: 1,
      exp: 0,
      coins: 30,                 // 初始零花钱
      stats: { food: 80, mood: 80, clean: 80, energy: 80 },
      lastFed: 0, lastPlay: 0, lastWash: 0,   // 冷却时间戳
      accs: [],                  // [{ emoji, worn }]
      praiseCount: 0,
      praiseByType: {},
      careCount: 0,
      coinsEarned: 0,
      badges: [],
      lastCheckin: "",
      streak: 0,
    };
  }

  function freshState() {
    return {
      version: 1,
      createdAt: Date.now(),
      lastVisit: Date.now(),
      lastDecay: Date.now(),
      kids: [defaultKid("宝贝一"), defaultKid("宝贝二")],
      history: [],
      soundOn: true,
    };
  }

  let state = freshState();

  /* ================= 工具 ================= */

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const yesterdayStr = () => {
    const d = new Date(Date.now() - 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const fmtTime = (t) => {
    const d = new Date(t);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (sameDay) return `今天 ${hm}`;
    return `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
  };

  /* ================= 存档 ================= */

  function save() {
    if (!state) return;
    state.lastVisit = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* 存储失败忽略 */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.kids) || data.kids.length !== 2) return false;
      // 结构修补（向后兼容）
      const base = freshState();
      for (let i = 0; i < 2; i++) {
        const k = data.kids[i];
        const d = defaultKid(k.name || base.kids[i].name);
        data.kids[i] = Object.assign(d, k, {
          stats: Object.assign(d.stats, k.stats || {}),
          accs: Array.isArray(k.accs) ? k.accs : [],
          badges: Array.isArray(k.badges) ? k.badges : [],
          praiseByType: k.praiseByType || {},
        });
      }
      data.history = Array.isArray(data.history) ? data.history : [];
      state = Object.assign(base, data);
      return true;
    } catch (e) { return false; }
  }

  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  function newGame(kid1Name, kid2Name, spec1, spec2, pet1Name, pet2Name) {
    state = freshState();
    state.kids[0].name = kid1Name || "宝贝一";
    state.kids[1].name = kid2Name || "宝贝二";
    state.kids[0].species = spec1 || "cat";
    state.kids[1].species = spec2 || "dog";
    state.kids[0].petName = pet1Name || speciesById(spec1).defaultName;
    state.kids[1].petName = pet2Name || speciesById(spec2).defaultName;
    save();
    return state;
  }

  function reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    state = freshState();
  }

  /* ================= 时间结算 ================= */

  /** 距上次访问的状态衰减 + 冷却自然恢复 */
  function applyDecay() {
    const now = Date.now();
    const hours = (now - (state.lastDecay || now)) / 3600000;
    state.lastDecay = now;
    if (hours < 0.05) return;
    const drop = Math.min(hours * DECAY_PER_HOUR, DECAY_MAX);
    for (const k of state.kids) {
      k.stats.food = clamp(k.stats.food - drop, 0, STAT_MAX);
      k.stats.mood = clamp(k.stats.mood - drop * 0.8, 0, STAT_MAX);
      k.stats.clean = clamp(k.stats.clean - drop * 0.6, 0, STAT_MAX);
      k.stats.energy = clamp(k.stats.energy - drop * 0.7, 0, STAT_MAX);
    }
  }

  /* ================= 历史记录 ================= */

  function log(kidIdx, icon, title, note, type) {
    state.history.unshift({
      t: Date.now(),
      kid: kidIdx,
      icon, title, note: note || "",
      type: type || "normal",
    });
    if (state.history.length > 300) state.history.length = 300;
  }

  /* ================= 升级 ================= */

  function gainExp(kid, kidIdx, amount) {
    const events = [];
    kid.exp += amount;
    while (kid.level < MAX_LEVEL && kid.exp >= expForLevel(kid.level)) {
      kid.exp -= expForLevel(kid.level);
      kid.level++;
      events.push(kid.level);
      log(kidIdx, "⬆️", `${kid.petName} 升到了 ${kid.level} 级！`, levelUpLine(kid.level), "level");
      /* 每升 5 级奖励金币 */
      if (kid.level % 5 === 0) { kid.coins += 30; kid.coinsEarned += 30; }
    }
    return events;
  }

  /* ================= 表扬（核心） ================= */

  function praise(kidIdx, typeId, note, customScore) {
    const kid = state.kids[kidIdx];
    const type = PRAISE_TYPES.find(t => t.id === typeId);
    if (!kid || !type) return null;

    let score, coins;
    if (type.custom) {
      score = clamp(parseInt(customScore, 10) || 10, 1, 20);
      coins = Math.round(score * 0.8);
    } else {
      score = type.score;
      coins = type.coins;
    }

    kid.exp += score;
    kid.coins += coins;
    kid.coinsEarned += coins;
    kid.praiseCount++;
    kid.praiseByType[type.id] = (kid.praiseByType[type.id] || 0) + 1;
    kid.stats.mood = clamp(kid.stats.mood + 10, 0, STAT_MAX);
    kid.stats.food = clamp(kid.stats.food + 4, 0, STAT_MAX);

    const leveled = gainExp(kid, kidIdx, 0);
    const badges = checkBadges(kid, kidIdx);

    const title = `${type.icon} ${type.name} +${score}`;
    log(kidIdx, type.icon, `${kid.petName} 获得表扬：${type.name}`, note || `${kid.name} 真棒！`, "praise");

    return { score, coins, leveled, badges, type, note };
  }

  /* ================= 照顾 ================= */

  function care(kidIdx, action) {
    const kid = state.kids[kidIdx];
    const c = CARE[action];
    if (!kid || !c) return null;

    const last = action === "feed" ? kid.lastFed : action === "play" ? kid.lastPlay : kid.lastWash;
    const remain = (last + c.cooldown * 60000) - Date.now();
    if (remain > 0) {
      return { ok: false, remainMin: Math.ceil(remain / 60000) };
    }

    if (c.stat === "all") {
      for (const s of Object.keys(kid.stats)) kid.stats[s] = clamp(kid.stats[s] + c.gain, 0, STAT_MAX);
    } else {
      kid.stats[c.stat] = clamp(kid.stats[c.stat] + c.gain, 0, STAT_MAX);
      kid.stats.mood = clamp(kid.stats.mood + 5, 0, STAT_MAX);
    }
    kid.careCount++;
    kid.exp += c.exp;
    kid.coins += c.coins;
    kid.coinsEarned += c.coins;

    if (action === "feed") kid.lastFed = Date.now();
    if (action === "play") kid.lastPlay = Date.now();
    if (action === "wash") kid.lastWash = Date.now();

    const leveled = gainExp(kid, kidIdx, 0);
    const badges = checkBadges(kid, kidIdx);
    log(kidIdx, c.icon, `${kid.petName} ${c.name}了一次`, c.line, "care");

    return { ok: true, exp: c.exp, coins: c.coins, leveled, badges, line: c.line };
  }

  function careRemain(kidIdx, action) {
    const kid = state.kids[kidIdx];
    const c = CARE[action];
    const last = action === "feed" ? kid.lastFed : action === "play" ? kid.lastPlay : kid.lastWash;
    return Math.max(0, (last + c.cooldown * 60000) - Date.now());
  }

  /* ================= 商店 ================= */

  function buy(kidIdx, itemId) {
    const kid = state.kids[kidIdx];
    const item = shopItemById(itemId);
    if (!kid || !item) return null;

    if (item.kind === "stat") {
      if (kid.coins < item.price) return { ok: false, reason: "coins" };
      kid.coins -= item.price;
      if (item.stat === "all") {
        for (const s of Object.keys(kid.stats)) kid.stats[s] = clamp(kid.stats[s] + item.gain, 0, STAT_MAX);
      } else {
        kid.stats[item.stat] = clamp(kid.stats[item.stat] + item.gain, 0, STAT_MAX);
      }
      log(kidIdx, item.icon, `${kid.petName} 享用了${item.name}`, item.desc, "shop");
      return { ok: true, kind: "stat", item };
    }

    /* 装扮 */
    if (kid.accs.some(a => a.emoji === item.acc)) {
      return { ok: false, reason: "owned" };
    }
    if (kid.coins < item.price) return { ok: false, reason: "coins" };
    kid.coins -= item.price;
    kid.accs.push({ emoji: item.acc, worn: true });
    const badges = checkBadges(kid, kidIdx);
    log(kidIdx, item.icon, `${kid.petName} 获得了新装扮${item.acc}`, item.name, "shop");
    return { ok: true, kind: "acc", item, badges };
  }

  function toggleAcc(kidIdx, emoji) {
    const kid = state.kids[kidIdx];
    const acc = kid.accs.find(a => a.emoji === emoji);
    if (acc) { acc.worn = !acc.worn; save(); return true; }
    return false;
  }

  /* ================= 每日打卡 ================= */

  function canCheckin() {
    const t = todayStr();
    return state.kids.some(k => k.lastCheckin !== t);
  }

  function checkin() {
    const t = todayStr();
    const y = yesterdayStr();
    const events = [];
    for (let i = 0; i < state.kids.length; i++) {
      const k = state.kids[i];
      if (k.lastCheckin === t) continue;
      k.streak = (k.lastCheckin === y) ? k.streak + 1 : 1;
      k.lastCheckin = t;
      let bonus = CHECKIN_REWARD;
      if (STREAK_BONUS[k.streak]) bonus += STREAK_BONUS[k.streak];
      k.coins += bonus;
      k.coinsEarned += bonus;
      k.stats.mood = clamp(k.stats.mood + 8, 0, STAT_MAX);
      const badges = checkBadges(k, i);
      events.push({ kid: i, bonus, streak: k.streak, badges });
      log(i, "📅", `${k.petName} 完成了每日打卡`, `连续 ${k.streak} 天，获得 ${bonus} 金币`, "checkin");
    }
    if (!events.length) return null;
    save();
    return events;
  }

  /* ================= 成就 ================= */

  function checkBadges(kid, kidIdx) {
    const got = [];
    const grant = (id) => {
      if (kid.badges.includes(id)) return;
      kid.badges.push(id);
      const b = badgeById(id);
      if (b) {
        got.push(b);
        log(kidIdx, b.icon, `解锁成就「${b.name}」`, `${kid.petName} · ${b.desc}`, "badge");
      }
    };

    if (kid.praiseCount >= 1) grant("first_praise");
    if ((kid.praiseByType.study || 0) >= 5) grant("study_5");
    if ((kid.praiseByType.house || 0) >= 5) grant("house_5");
    if (kid.level >= 5) grant("level_5");
    if (kid.level >= 10) grant("level_10");
    if (kid.level >= 15) grant("level_15");
    if (kid.level >= MAX_LEVEL) grant("level_max");
    if (kid.coinsEarned >= 500) grant("coins_500");
    if (kid.careCount >= 30) grant("care_30");
    if (kid.streak >= 7) grant("checkin_7");
    if (kid.accs.length >= 3) grant("acc_3");
    const other = state.kids[1 - kidIdx];
    if (other && kid.level >= 10 && other.level >= 10) grant("both_10");

    return got;
  }

  /* ================= 导入 / 导出 ================= */

  function exportData() {
    return JSON.stringify(state, null, 2);
  }

  function importData(json) {
    try {
      const data = JSON.parse(json);
      if (!data || !Array.isArray(data.kids) || data.kids.length !== 2) return false;
      state = Object.assign(freshState(), data);
      applyDecay();
      save();
      return true;
    } catch (e) { return false; }
  }

  /* ================= 对外 ================= */

  return {
    get state() { return state; },
    freshState, save, load, hasSave, newGame, reset,
    applyDecay, praise, care, careRemain, buy, toggleAcc,
    canCheckin, checkin, checkBadges,
    exportData, importData, log,
    fmtTime, todayStr, clamp,
  };
})();

window.Game = Game;
