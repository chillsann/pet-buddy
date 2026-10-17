/* ============================================================
   data.js — 静态数据：宠物 / 表扬类型 / 商店 / 成就 / 等级
   ============================================================ */
"use strict";

const SAVE_KEY = "petBuddy.save.v1";
const MAX_LEVEL = 20;

/* ---------- 等级曲线：升到下一级所需经验 ---------- */
function expForLevel(level) {
  return 30 + (level - 1) * 10; // Lv1→2: 30, Lv2→3: 40 ... Lv19→20: 210
}

/* ---------- 成长阶段 ---------- */
const STAGES = [
  { min: 1,  name: "幼崽期", scale: 0.72, crown: false, aura: false, cape: false },
  { min: 5,  name: "成长期", scale: 0.85, crown: false, aura: false, cape: false },
  { min: 10, name: "壮年期", scale: 0.97, crown: false, aura: false, cape: true  },
  { min: 15, name: "传奇期", scale: 1.08, crown: true,  aura: true,  cape: true  },
];
function stageOf(level) {
  let s = STAGES[0];
  for (const st of STAGES) if (level >= st.min) s = st;
  return s;
}

/* ---------- 宠物种族（SVG 参数化绘制，见 art.js） ---------- */
const SPECIES = [
  {
    id: "cat", name: "橘猫", defaultName: "小橘",
    body: "#f6a96b", shade: "#e8904a", belly: "#ffe6cb", inner: "#ffc2cf",
    ear: "point", tail: "curl", cheek: "#ffb9a8", stripes: true,
    tint: "#fde8d4",
  },
  {
    id: "dog", name: "柴犬", defaultName: "阿柴",
    body: "#e0995a", shade: "#c97f3e", belly: "#fdeed6", inner: "#ffb3b3",
    ear: "flop", tail: "fluffy", cheek: "#f2a58a", stripes: false,
    tint: "#fdeedd",
  },
  {
    id: "rabbit", name: "兔子", defaultName: "团子",
    body: "#fdfdfd", shade: "#e8e2d8", belly: "#ffffff", inner: "#ffc9d6",
    ear: "long", tail: "puff", cheek: "#ffc2cf", stripes: false,
    tint: "#f0eef8",
  },
  {
    id: "panda", name: "熊猫", defaultName: "滚滚",
    body: "#f7f7f5", shade: "#d9d9d4", belly: "#ffffff", inner: "#ffc2cf",
    ear: "round", tail: "puff", cheek: "#ffb9c4", stripes: false,
    tint: "#e9f0e4",
  },
  {
    id: "fox", name: "狐狸", defaultName: "阿狸",
    body: "#f08a3c", shade: "#d96f22", belly: "#fff4e3", inner: "#ffc2cf",
    ear: "point", tail: "fluffy", cheek: "#ff9e7a", stripes: false,
    tint: "#fdeadd",
  },
  {
    id: "dragon", name: "小龙", defaultName: "嗷呜",
    body: "#8fd0a8", shade: "#5fae82", belly: "#f2fbd9", inner: "#ffc2cf",
    ear: "horn", tail: "spike", cheek: "#ff9eb0", stripes: false,
    tint: "#e2f3e2",
  },
];
function speciesById(id) { return SPECIES.find(s => s.id === id) || SPECIES[0]; }

/* ---------- 表扬类型（家长用） ---------- */
const PRAISE_TYPES = [
  { id: "study",   icon: "📚", name: "认真学习",   score: 10, coins: 8  },
  { id: "house",   icon: "🧹", name: "帮忙家务",   score: 15, coins: 12 },
  { id: "polite",  icon: "🤝", name: "懂礼貌",     score: 10, coins: 8  },
  { id: "sleep",   icon: "😴", name: "按时作息",   score: 10, coins: 8  },
  { id: "meal",    icon: "🍚", name: "独立吃饭",   score: 8,  coins: 6  },
  { id: "sport",   icon: "🏃", name: "坚持运动",   score: 12, coins: 10 },
  { id: "share",   icon: "💖", name: "诚实分享",   score: 12, coins: 10 },
  { id: "kind",    icon: "🐾", name: "爱护宠物",   score: 12, coins: 10 },
  { id: "custom",  icon: "⭐", name: "特别表扬",   score: 0,  coins: 0, custom: true },
];

/* ---------- 照顾动作 ---------- */
const CARE = {
  feed: { name: "喂食", icon: "🍖", cooldown: 60,  exp: 3, coins: 2, stat: "food",   gain: 30, line: "啊呜啊呜……真好吃！" },
  play: { name: "玩耍", icon: "🎾", cooldown: 90,  exp: 3, coins: 2, stat: "mood",   gain: 30, line: "接住接住！再来一次～" },
  wash: { name: "洗澡", icon: "🧼", cooldown: 180, exp: 4, coins: 3, stat: "clean",  gain: 35, line: "泡泡泡泡……变得香喷喷！" },
};

/* ---------- 商店商品 ---------- */
const SHOP_ITEMS = [
  { id: "meat",    icon: "🍗", name: "豪华鸡腿", desc: "立刻恢复 40 点饱食",       price: 20,  kind: "stat", stat: "food",  gain: 40 },
  { id: "cake",    icon: "🍰", name: "奶油蛋糕", desc: "立刻恢复 40 点心情",       price: 20,  kind: "stat", stat: "mood",  gain: 40 },
  { id: "bath",    icon: "🧴", name: "泡泡浴液", desc: "立刻恢复 40 点清洁",       price: 22,  kind: "stat", stat: "clean", gain: 40 },
  { id: "energy",  icon: "⚡", name: "能量饮料", desc: "立刻恢复 40 点精力",       price: 22,  kind: "stat", stat: "energy",gain: 40 },
  { id: "gift",    icon: "🎁", name: "生日礼盒", desc: "四项状态全部恢复 25 点",   price: 45,  kind: "stat", stat: "all",   gain: 25 },
  { id: "hat",     icon: "🎩", name: "魔法礼帽", desc: "永久装扮 · 宠物戴上它",     price: 60,  kind: "acc", acc: "🎩" },
  { id: "scarf",   icon: "🧣", name: "暖冬围巾", desc: "永久装扮 · 宠物戴上它",     price: 50,  kind: "acc", acc: "🧣" },
  { id: "glasses", icon: "🕶️", name: "酷炫墨镜", desc: "永久装扮 · 宠物戴上它",     price: 80,  kind: "acc", acc: "🕶️" },
  { id: "crown",   icon: "👑", name: "星星皇冠", desc: "永久装扮 · 传奇宠物专属",   price: 150, kind: "acc", acc: "👑" },
];
function shopItemById(id) { return SHOP_ITEMS.find(s => s.id === id); }

/* ---------- 成就 ---------- */
const BADGES = [
  { id: "first_praise", icon: "🌟", name: "初露锋芒",   desc: "第一次获得表扬" },
  { id: "study_5",      icon: "📚", name: "小学霸",     desc: "累计 5 次「认真学习」表扬" },
  { id: "house_5",      icon: "🧹", name: "家务小能手", desc: "累计 5 次「帮忙家务」表扬" },
  { id: "level_5",      icon: "🌱", name: "成长之路",   desc: "任意宠物达到 5 级" },
  { id: "level_10",     icon: "🌳", name: "枝繁叶茂",   desc: "任意宠物达到 10 级" },
  { id: "level_15",     icon: "👑", name: "传奇诞生",   desc: "任意宠物达到 15 级" },
  { id: "level_max",    icon: "🏆", name: "满级王者",   desc: "任意宠物达到 20 级" },
  { id: "coins_500",    icon: "💰", name: "小富翁",     desc: "累计获得 500 金币" },
  { id: "care_30",      icon: "❤️", name: "爱心满满",   desc: "累计照顾宠物 30 次" },
  { id: "checkin_7",    icon: "🔥", name: "七日打卡",   desc: "连续 7 天打卡" },
  { id: "both_10",      icon: "🤝", name: "比翼双飞",   desc: "两只宠物都达到 10 级" },
  { id: "acc_3",        icon: "🎩", name: "潮流达人",   desc: "一只宠物拥有 3 件装扮" },
];
function badgeById(id) { return BADGES.find(b => b.id === id); }

/* ---------- 每日打卡奖励 ---------- */
const CHECKIN_REWARD = 5;
const STREAK_BONUS = { 3: 20, 7: 50, 15: 120, 30: 300 };

/* ---------- 状态衰减 ---------- */
const DECAY_PER_HOUR = 2.5;   // 每小时每项衰减
const DECAY_MAX = 45;         // 单次结算最多衰减
const STAT_MAX = 100;

/* ---------- 宠物心情语录 ---------- */
const PET_LINES = {
  happy: ["今天心情超好！", "和你在一起最开心啦～", "喵/汪～想吃好吃的！", "我们去玩球吧！", "今天也是棒棒的一天！"],
  hungry: ["肚子咕咕叫了……", "想吃好吃的！", "嘴巴淡淡的，想吃东西～", "喂喂我嘛～"],
  dirty: ["身上痒痒的……", "想洗香香！", "有点不舒服，想洗澡～"],
  tired: ["眼皮好重……", "想睡觉觉……", "没力气玩了……", "让我休息一下～"],
  sad: ["有点无聊……", "陪我玩玩好不好？", "都不理我……哼！", "想要抱抱～"],
};
function petLine(stats) {
  const low = [];
  if (stats.food < 25) low.push("hungry");
  if (stats.clean < 25) low.push("dirty");
  if (stats.energy < 25) low.push("tired");
  if (low.length) {
    const pool = PET_LINES[low[Math.floor(Math.random() * low.length)]];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (stats.mood < 35) {
    const pool = PET_LINES.sad;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const pool = PET_LINES.happy;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ---------- 升级寄语 ---------- */
const LEVELUP_LINES = {
  5:  "进入成长期！眼神更坚定了！",
  10: "壮年期到来！已经是个小大人了！",
  15: "传奇期降临！王者的气息在闪耀！",
  20: "满级传奇！你就是传说中的宠物大师！",
};
function levelUpLine(level) { return LEVELUP_LINES[level] || `升到 ${level} 级啦，继续加油！`; }
