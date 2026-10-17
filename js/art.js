/* ============================================================
   art.js — SVG 宠物绘制（参数化：种族 × 成长 × 表情 × 装扮）
   ============================================================ */
"use strict";

/**
 * 生成宠物 SVG
 * @param {string} speciesId  种族 id
 * @param {object} opts { level, stats:{food,mood,clean,energy}, accs:[装扮emoji] }
 * @returns {string} SVG 字符串
 */
function petSVG(speciesId, opts = {}) {
  const sp = speciesById(speciesId);
  const level = opts.level || 1;
  const stats = opts.stats || { food: 80, mood: 80, clean: 80, energy: 80 };
  const accs = opts.accs || [];
  const stage = stageOf(level);

  /* ---- 表情判定 ---- */
  let mood = "happy";
  if (stats.food < 25) mood = "hungry";
  else if (stats.energy < 22) mood = "sleepy";
  else if (stats.clean < 25) mood = "dirty";
  else if (stats.mood < 35) mood = "sad";
  else if (stats.mood > 60 && stats.food > 55) mood = "happy";

  const g = [];
  g.push(`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="pet-svg" aria-label="${sp.name}">`);
  g.push(`<defs>
    <radialGradient id="bg-${sp.id}" cx="35%" cy="25%" r="80%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="${sp.tint}"/>
    </radialGradient>
    <linearGradient id="body-${sp.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${sp.body}"/><stop offset="100%" stop-color="${sp.shade}"/>
    </linearGradient>
  </defs>`);
  g.push(`<circle cx="100" cy="100" r="96" fill="url(#bg-${sp.id})"/>`);

  /* ---- 整体缩放（成长体型） ---- */
  const s = stage.scale;
  g.push(`<g transform="translate(100 168) scale(${s}) translate(-100 -168)">`);

  /* ---- 传奇光环 ---- */
  if (stage.aura) {
    g.push(`<ellipse cx="100" cy="170" rx="52" ry="12" fill="none" stroke="#f5cf7a" stroke-width="4" opacity="0.9"/>`);
    g.push(`<ellipse cx="100" cy="170" rx="62" ry="15" fill="none" stroke="#ffe9b8" stroke-width="2" opacity="0.6"/>`);
  }

  /* ---- 披风（壮年+） ---- */
  if (stage.cape) {
    g.push(`<path d="M 62 118 Q 40 160 30 178 Q 100 196 170 178 Q 160 160 138 118 Q 100 140 62 118 Z"
      fill="#ef8a3c" opacity="0.92"/>`);
    g.push(`<path d="M 62 118 Q 100 140 138 118" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.7"/>`);
  }

  /* ---- 尾巴 ---- */
  g.push(tailSVG(sp));

  /* ---- 身体 ---- */
  g.push(`<g class="pet-body-group">
    <ellipse cx="100" cy="140" rx="43" ry="36" fill="url(#body-${sp.id})"/>
    <ellipse cx="100" cy="148" rx="26" ry="24" fill="${sp.belly}"/>
    ${sp.stripes ? `<path d="M 84 118 Q 100 126 116 118" fill="none" stroke="${sp.shade}" stroke-width="3" stroke-linecap="round" opacity=".55"/>` : ""}
    ${mood === "dirty" ? `<circle cx="86" cy="150" r="5" fill="#a89676" opacity=".55"/><circle cx="118" cy="140" r="3.5" fill="#a89676" opacity=".5"/>` : ""}
    <!-- 四肢 -->
    <ellipse cx="76" cy="170" rx="13" ry="9" fill="${sp.shade}"/>
    <ellipse cx="124" cy="170" rx="13" ry="9" fill="${sp.shade}"/>
  </g>`);

  /* ---- 头部 ---- */
  g.push(`<g class="pet-head-group">`);
  g.push(earSVG(sp));

  /* 头型 */
  if (sp.id === "panda") {
    g.push(`<circle cx="100" cy="86" r="42" fill="${sp.body}"/>`);
    /* 熊猫眼罩 */
    g.push(`<ellipse cx="85" cy="84" rx="12" ry="14" fill="#3d3d3d" transform="rotate(-12 85 84)"/>`);
    g.push(`<ellipse cx="115" cy="84" rx="12" ry="14" fill="#3d3d3d" transform="rotate(12 115 84)"/>`);
  } else {
    g.push(`<circle cx="100" cy="86" r="42" fill="url(#body-${sp.id})"/>`);
  }

  /* 脸颊红晕 */
  g.push(`<ellipse cx="70" cy="98" rx="8" ry="5" fill="${sp.cheek}" opacity=".65"/>`);
  g.push(`<ellipse cx="130" cy="98" rx="8" ry="5" fill="${sp.cheek}" opacity=".65"/>`);

  /* 猫/狐 斑纹 */
  if (sp.stripes) {
    g.push(`<path d="M 92 48 Q 94 56 92 62" stroke="${sp.shade}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`);
    g.push(`<path d="M 100 46 Q 100 55 100 62" stroke="${sp.shade}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`);
    g.push(`<path d="M 108 48 Q 106 56 108 62" stroke="${sp.shade}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`);
  }

  /* ---- 眼睛 ---- */
  g.push(eyeSVG(mood, sp));

  /* ---- 鼻子 & 嘴 ---- */
  if (mood === "hungry") {
    g.push(`<path d="M 94 102 Q 100 96 106 102 Q 100 108 94 102 Z" fill="${sp.inner}"/>`);
    g.push(`<ellipse cx="100" cy="110" rx="6" ry="7" fill="#d96a7e"/>`); /* 张嘴 */
    g.push(`<path d="M 88 116 Q 100 126 112 116" fill="none" stroke="#c98a5e" stroke-width="2.5" stroke-linecap="round"/>`);
  } else if (mood === "sad") {
    g.push(`<path d="M 96 100 Q 100 104 104 100" fill="none" stroke="#a97850" stroke-width="2.5" stroke-linecap="round"/>`);
    g.push(`<path d="M 90 110 Q 100 104 110 110" fill="none" stroke="#a97850" stroke-width="2.5" stroke-linecap="round"/>`); /* 下弯嘴 */
  } else if (mood === "sleepy") {
    g.push(`<path d="M 96 102 Q 100 98 104 102" fill="none" stroke="#a97850" stroke-width="2.5" stroke-linecap="round"/>`);
    g.push(`<ellipse cx="100" cy="109" rx="4.5" ry="5.5" fill="#d96a7e"/>`);
    g.push(`<text x="126" y="58" font-size="17" font-weight="900" fill="#8aa5c9" class="pet-zzz">Z</text>`);
    g.push(`<text x="136" y="46" font-size="13" font-weight="900" fill="#a5bcd9" class="pet-zzz" style="animation-delay:.6s">z</text>`);
  } else {
    g.push(`<path d="M 95 100 L 100 105 L 105 100 Z" fill="${sp.inner}"/>`);
    g.push(`<path d="M 93 107 Q 100 114 107 107" fill="none" stroke="#a97850" stroke-width="2.5" stroke-linecap="round"/>`); /* 微笑 */
    if (mood === "happy") {
      g.push(`<path d="M 86 104 Q 100 116 114 104" fill="none" stroke="#a97850" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`);
    }
  }

  /* 胡须（猫/狐/兔） */
  if (["cat", "fox", "rabbit"].includes(sp.id)) {
    g.push(`<path d="M 62 96 L 46 92 M 62 102 L 46 104 M 138 96 L 154 92 M 138 102 L 154 104"
      stroke="#c9b8a4" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`);
  }

  g.push(`</g>`); /* head-group */

  /* ---- 皇冠（传奇） ---- */
  if (stage.crown) {
    g.push(`<g class="pet-crown">
      <path d="M 80 50 L 86 32 L 94 44 L 100 28 L 106 44 L 114 32 L 120 50 Z" fill="#f5cf7a" stroke="#d9a416" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="100" cy="30" r="3.5" fill="#ff8a8a"/>
    </g>`);
  }

  g.push(`</g>`); /* scale group */
  g.push(`</svg>`);
  return g.join("\n");
}

/* ---------- 耳朵 ---------- */
function earSVG(sp) {
  switch (sp.ear) {
    case "point": /* 猫 / 狐 / 龙嵴 */
      if (sp.id === "fox") {
        return `<path d="M 68 60 L 58 22 L 88 44 Z" fill="${sp.body}"/>
                <path d="M 70 54 L 65 34 L 82 46 Z" fill="${sp.inner}"/>
                <path d="M 132 60 L 142 22 L 112 44 Z" fill="${sp.body}"/>
                <path d="M 130 54 L 135 34 L 118 46 Z" fill="${sp.inner}"/>`;
      }
      return `<path d="M 70 62 L 62 24 L 92 48 Z" fill="url(#body-${sp.id})"/>
              <path d="M 72 56 L 67 36 L 86 50 Z" fill="${sp.inner}"/>
              <path d="M 130 62 L 138 24 L 108 48 Z" fill="url(#body-${sp.id})"/>
              <path d="M 128 56 L 133 36 L 114 50 Z" fill="${sp.inner}"/>`;
    case "flop": /* 柴犬塌耳 */
      return `<path d="M 64 66 Q 48 60 46 84 Q 48 100 68 92 Z" fill="${sp.shade}"/>
              <path d="M 136 66 Q 152 60 154 84 Q 152 100 132 92 Z" fill="${sp.shade}"/>`;
    case "long": /* 兔子长耳 */
      return `<g class="pet-ears">
                <ellipse cx="78" cy="34" rx="13" ry="34" fill="${sp.body}" transform="rotate(-10 78 34)"/>
                <ellipse cx="78" cy="36" rx="7" ry="26" fill="${sp.inner}" transform="rotate(-10 78 36)"/>
                <ellipse cx="122" cy="34" rx="13" ry="34" fill="${sp.body}" transform="rotate(10 122 34)"/>
                <ellipse cx="122" cy="36" rx="7" ry="26" fill="${sp.inner}" transform="rotate(10 122 36)"/>
              </g>`;
    case "round": /* 熊猫圆耳 */
      return `<circle cx="66" cy="52" r="13" fill="#3d3d3d"/><circle cx="134" cy="52" r="13" fill="#3d3d3d"/>`;
    case "horn": /* 小龙角 */
      return `<path d="M 76 52 L 68 28 L 88 44 Z" fill="${sp.belly}" stroke="${sp.shade}" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M 124 52 L 132 28 L 112 44 Z" fill="${sp.belly}" stroke="${sp.shade}" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M 92 46 Q 100 36 108 46" fill="none" stroke="${sp.shade}" stroke-width="3" stroke-linecap="round"/>`;
    default:
      return "";
  }
}

/* ---------- 尾巴 ---------- */
function tailSVG(sp) {
  switch (sp.tail) {
    case "curl":
      return `<path d="M 138 138 Q 168 132 164 108 Q 161 92 148 96" fill="none" stroke="${sp.body}" stroke-width="15" stroke-linecap="round"/>
              <path d="M 152 96 Q 158 92 162 98" fill="none" stroke="${sp.shade}" stroke-width="5" stroke-linecap="round" opacity=".6"/>`;
    case "fluffy":
      if (sp.id === "fox") {
        return `<g class="pet-tail">
                  <ellipse cx="152" cy="132" rx="26" ry="20" fill="${sp.body}" transform="rotate(18 152 132)"/>
                  <ellipse cx="158" cy="134" rx="14" ry="11" fill="${sp.belly}" transform="rotate(18 158 134)"/>
                </g>`;
      }
      return `<ellipse cx="152" cy="130" rx="22" ry="15" fill="${sp.body}" transform="rotate(20 152 130)"/>`;
    case "puff":
      return `<circle cx="146" cy="150" r="12" fill="${sp.id === "panda" ? "#f7f7f5" : sp.body}"/>`;
    case "spike":
      return `<g class="pet-tail">
                <path d="M 138 142 Q 172 138 178 112" fill="none" stroke="${sp.body}" stroke-width="13" stroke-linecap="round"/>
                <path d="M 158 128 L 166 118 L 166 134 Z" fill="${sp.belly}"/>
                <path d="M 172 122 L 182 116 L 178 130 Z" fill="${sp.belly}"/>
              </g>`;
    default:
      return "";
  }
}

/* ---------- 眼睛 ---------- */
function eyeSVG(mood, sp) {
  const isDark = sp.id === "panda";
  const white = isDark ? "#fff" : "#fff";
  const pupil = isDark ? "#fff" : "#4a4034";
  const x1 = 86, x2 = 114, y = 82;

  if (mood === "sleepy") {
    return `<path d="M 78 84 Q 86 78 94 84" fill="none" stroke="${pupil}" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M 106 84 Q 114 78 122 84" fill="none" stroke="${pupil}" stroke-width="3.5" stroke-linecap="round"/>`;
  }
  if (mood === "sad") {
    /* 垂眼 + 高光 */
    return `<g class="pet-eyes">
              <ellipse cx="${x1}" cy="${y}" rx="8" ry="8" fill="${white}"/>
              <ellipse cx="${x2}" cy="${y}" rx="8" ry="8" fill="${white}"/>
              <circle cx="${x1}" cy="${y + 2}" r="4.5" fill="${pupil}"/>
              <circle cx="${x2}" cy="${y + 2}" r="4.5" fill="${pupil}"/>
              <path d="M 76 76 Q 86 71 96 76" fill="none" stroke="${pupil}" stroke-width="3" stroke-linecap="round"/>
              <path d="M 104 76 Q 114 71 124 76" fill="none" stroke="${pupil}" stroke-width="3" stroke-linecap="round"/>
            </g>`;
  }
  if (mood === "hungry") {
    /* 渴望大眼 */
    return `<g class="pet-eyes">
              <ellipse cx="${x1}" cy="${y}" rx="9" ry="10" fill="${white}"/>
              <ellipse cx="${x2}" cy="${y}" rx="9" ry="10" fill="${white}"/>
              <circle cx="${x1}" cy="${y + 1}" r="5.5" fill="${pupil}"/>
              <circle cx="${x2}" cy="${y + 1}" r="5.5" fill="${pupil}"/>
              <circle cx="${x1 - 2}" cy="${y - 2}" r="2" fill="#fff"/>
              <circle cx="${x2 - 2}" cy="${y - 2}" r="2" fill="#fff"/>
            </g>`;
  }
  if (mood === "dirty") {
    return `<g class="pet-eyes">
              <ellipse cx="${x1}" cy="${y}" rx="8" ry="8" fill="${white}"/>
              <ellipse cx="${x2}" cy="${y}" rx="8" ry="8" fill="${white}"/>
              <circle cx="${x1}" cy="${y}" r="4.5" fill="${pupil}"/>
              <circle cx="${x2}" cy="${y}" r="4.5" fill="${pupil}"/>
              <circle cx="${x1 - 2}" cy="${y - 2}" r="1.8" fill="#fff"/>
              <circle cx="${x2 - 2}" cy="${y - 2}" r="1.8" fill="#fff"/>
              <path d="M 78 88 Q 86 94 94 88" fill="none" stroke="${pupil}" stroke-width="2.5" stroke-linecap="round"/> <!-- 委屈嘴 -->
            </g>`;
  }
  /* happy：笑眼 */
  return `<g class="pet-eyes">
            <path d="M 78 84 Q 86 74 94 84" fill="none" stroke="${pupil}" stroke-width="4" stroke-linecap="round"/>
            <path d="M 106 84 Q 114 74 122 84" fill="none" stroke="${pupil}" stroke-width="4" stroke-linecap="round"/>
          </g>`;
}

/* ---------- 小图标版（用于欢迎屏/表扬选择，简化无背景圆） ---------- */
function petIconSVG(speciesId) {
  const sp = speciesById(speciesId);
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ic-${sp.id}" cx="35%" cy="25%" r="80%">
        <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="${sp.tint}"/>
      </radialGradient>
      <linearGradient id="icb-${sp.id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${sp.body}"/><stop offset="100%" stop-color="${sp.shade}"/>
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="96" fill="url(#ic-${sp.id})"/>
    <g transform="translate(100 168) scale(0.82) translate(-100 -168)">
      <ellipse cx="100" cy="140" rx="43" ry="36" fill="url(#icb-${sp.id})"/>
      <ellipse cx="100" cy="148" rx="26" ry="24" fill="${sp.belly}"/>
      <ellipse cx="76" cy="170" rx="13" ry="9" fill="${sp.shade}"/>
      <ellipse cx="124" cy="170" rx="13" ry="9" fill="${sp.shade}"/>
      ${earSVG(sp).replace(/icb-|body-/g, "icb-")}
      <circle cx="100" cy="86" r="42" fill="url(#icb-${sp.id})"/>
      <ellipse cx="70" cy="98" rx="8" ry="5" fill="${sp.cheek}" opacity=".65"/>
      <ellipse cx="130" cy="98" rx="8" ry="5" fill="${sp.cheek}" opacity=".65"/>
      <path d="M 78 84 Q 86 74 94 84" fill="none" stroke="#4a4034" stroke-width="4" stroke-linecap="round"/>
      <path d="M 106 84 Q 114 74 122 84" fill="none" stroke="#4a4034" stroke-width="4" stroke-linecap="round"/>
      <path d="M 95 100 L 100 105 L 105 100 Z" fill="${sp.inner}"/>
      <path d="M 93 107 Q 100 114 107 107" fill="none" stroke="#a97850" stroke-width="2.5" stroke-linecap="round"/>
    </g>
  </svg>`;
}

/* ---------- 全局导出 ---------- */
window.Art = { petSVG, petIconSVG };
