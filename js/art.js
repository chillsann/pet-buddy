/* ============================================================
   art.js — 精细分层 SVG 宠物（v1.1）
   结构：地台 → 尾巴 → 身体 → 头部(耳/眼/鼻嘴) → 皇冠
   每个部件独立 group + class，供 anim.js 驱动动作
   ============================================================ */
"use strict";

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

  const uid = sp.id + "-" + Math.random().toString(36).slice(2, 7);
  const g = [];

  g.push(`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="pet-svg" data-mood="${mood}" aria-label="${sp.name}">`);
  g.push(`<defs>
    <radialGradient id="bg-${uid}" cx="35%" cy="25%" r="85%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="${sp.tint}"/>
    </radialGradient>
    <linearGradient id="body-${uid}" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stop-color="${sp.body}"/><stop offset="100%" stop-color="${sp.shade}"/>
    </linearGradient>
    <linearGradient id="belly-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${sp.belly}"/><stop offset="100%" stop-color="${sp.shade}" stop-opacity="0.35"/>
    </linearGradient>
    <radialGradient id="cheek-${uid}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${sp.cheek}" stop-opacity=".8"/><stop offset="100%" stop-color="${sp.cheek}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft-${uid}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.2"/>
    </filter>
  </defs>`);

  /* 背景圆 */
  g.push(`<circle cx="100" cy="100" r="97" fill="url(#bg-${uid})"/>`);

  /* 地面投影 */
  g.push(`<ellipse class="pet-shadow" cx="100" cy="176" rx="46" ry="9" fill="#8a6f4d" opacity=".16" filter="url(#soft-${uid})"/>`);

  /* 成长缩放 */
  const s = stage.scale;
  g.push(`<g transform="translate(100 172) scale(${s}) translate(-100 -172)">`);

  /* 传奇光环 */
  if (stage.aura) {
    g.push(`<ellipse class="pet-aura" cx="100" cy="170" rx="54" ry="12" fill="none" stroke="#f5cf7a" stroke-width="4" opacity=".9"/>`);
    g.push(`<ellipse class="pet-aura" cx="100" cy="170" rx="64" ry="15" fill="none" stroke="#ffe9b8" stroke-width="2" opacity=".55"/>`);
  }

  /* 披风（壮年+） */
  if (stage.cape) {
    g.push(`<path class="pet-cape" d="M 62 118 Q 40 160 30 178 Q 100 196 170 178 Q 160 160 138 118 Q 100 140 62 118 Z" fill="#ef8a3c" opacity=".92"/>`);
    g.push(`<path d="M 62 118 Q 100 140 138 118" fill="none" stroke="#fff" stroke-width="2.5" opacity=".7"/>`);
  }

  /* 尾巴 */
  g.push(tailSVG(sp, uid));

  /* ================= 身体 ================= */
  g.push(`<g class="pet-body-group">`);
  g.push(`<ellipse cx="74" cy="166" rx="14" ry="10" fill="${sp.shade}"/>`);
  g.push(`<ellipse cx="126" cy="166" rx="14" ry="10" fill="${sp.shade}"/>`);
  g.push(`<ellipse cx="100" cy="139" rx="44" ry="37" fill="url(#body-${uid})"/>`);
  g.push(`<ellipse cx="100" cy="148" rx="27" ry="24" fill="url(#belly-${uid})"/>`);
  g.push(`<path d="M 88 132 Q 100 140 112 132" fill="none" stroke="${sp.belly}" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>`);
  if (sp.stripes) {
    g.push(`<path d="M 82 122 Q 100 132 118 122" fill="none" stroke="${sp.shade}" stroke-width="3.5" stroke-linecap="round" opacity=".5"/>`);
    g.push(`<path d="M 88 160 Q 100 168 112 160" fill="none" stroke="${sp.shade}" stroke-width="3" stroke-linecap="round" opacity=".4"/>`);
  }
  g.push(`<ellipse cx="80" cy="168" rx="11" ry="8.5" fill="${sp.body}"/>`);
  g.push(`<ellipse cx="120" cy="168" rx="11" ry="8.5" fill="${sp.body}"/>`);
  g.push(`<path d="M 76 165 v6 M 80 164 v7 M 84 165 v6 M 116 165 v6 M 120 164 v7 M 124 165 v6" stroke="${sp.shade}" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>`);
  if (mood === "dirty") {
    g.push(`<circle cx="86" cy="152" r="5.5" fill="#a89676" opacity=".55"/><circle cx="118" cy="142" r="3.5" fill="#a89676" opacity=".5"/>`);
  }
  g.push(`</g>`);

  /* ================= 头部 ================= */
  g.push(`<g class="pet-head-group">`);
  g.push(earSVG(sp, uid));

  if (sp.id === "panda") {
    g.push(`<circle cx="100" cy="86" r="43" fill="${sp.body}"/>`);
    g.push(`<ellipse cx="85" cy="84" rx="12.5" ry="14.5" fill="#3d3d3d" transform="rotate(-12 85 84)"/>`);
    g.push(`<ellipse cx="115" cy="84" rx="12.5" ry="14.5" fill="#3d3d3d" transform="rotate(12 115 84)"/>`);
  } else {
    g.push(`<circle cx="100" cy="86" r="43" fill="url(#body-${uid})"/>`);
    g.push(`<ellipse cx="86" cy="60" rx="17" ry="10" fill="#fff" opacity=".28" transform="rotate(-18 86 60)"/>`);
  }

  if (sp.stripes) {
    g.push(`<path d="M 92 48 Q 94 57 92 63" stroke="${sp.shade}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`);
    g.push(`<path d="M 100 46 Q 100 56 100 63" stroke="${sp.shade}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`);
    g.push(`<path d="M 108 48 Q 106 57 108 63" stroke="${sp.shade}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`);
  }
  if (sp.id === "fox") {
    g.push(`<path d="M 70 92 Q 100 108 130 92 Q 118 122 100 122 Q 82 122 70 92 Z" fill="${sp.belly}" opacity=".85"/>`);
  }

  g.push(`<ellipse cx="70" cy="99" rx="9.5" ry="6" fill="url(#cheek-${uid})"/>`);
  g.push(`<ellipse cx="130" cy="99" rx="9.5" ry="6" fill="url(#cheek-${uid})"/>`);

  if (["cat", "fox", "rabbit"].includes(sp.id)) {
    g.push(`<path d="M 62 96 L 44 91 M 62 103 L 44 106 M 138 96 L 156 91 M 138 103 L 156 106" stroke="#c9b8a4" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`);
  }

  g.push(eyeSVG(mood, sp));
  g.push(mouthSVG(mood, sp));

  g.push(`</g>`); /* head-group */

  if (stage.crown) {
    g.push(`<g class="pet-crown">
      <path d="M 80 50 L 86 32 L 94 44 L 100 28 L 106 44 L 114 32 L 120 50 Z" fill="#f5cf7a" stroke="#d9a416" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="100" cy="30" r="3.5" fill="#ff8a8a"/>
      <circle cx="86" cy="32" r="2" fill="#ff8a8a"/><circle cx="114" cy="32" r="2" fill="#ff8a8a"/>
    </g>`);
  }

  g.push(`</g>`); /* scale */
  g.push(`</svg>`);
  return g.join("\n");
}

/* ================= 耳朵 ================= */
function earSVG(sp, uid) {
  const ear = sp.ear;
  if (ear === "point") {
    if (sp.id === "fox") {
      return `<g class="pet-ears">
        <path d="M 68 60 L 56 20 L 90 44 Z" fill="${sp.body}"/>
        <path d="M 71 53 L 65 32 L 84 47 Z" fill="${sp.inner}"/>
        <path d="M 132 60 L 144 20 L 110 44 Z" fill="${sp.body}"/>
        <path d="M 129 53 L 135 32 L 116 47 Z" fill="${sp.inner}"/>
      </g>`;
    }
    return `<g class="pet-ears">
      <path d="M 70 62 L 61 23 L 93 48 Z" fill="url(#body-${uid})"/>
      <path d="M 73 55 L 67 35 L 87 51 Z" fill="${sp.inner}"/>
      <path d="M 130 62 L 139 23 L 107 48 Z" fill="url(#body-${uid})"/>
      <path d="M 127 55 L 133 35 L 113 51 Z" fill="${sp.inner}"/>
    </g>`;
  }
  if (ear === "flop") {
    return `<g class="pet-ears">
      <path d="M 64 66 Q 47 58 45 84 Q 47 102 69 93 Z" fill="${sp.shade}"/>
      <path d="M 136 66 Q 153 58 155 84 Q 153 102 131 93 Z" fill="${sp.shade}"/>
      <path d="M 60 76 Q 54 84 58 94" fill="none" stroke="${sp.inner}" stroke-width="3" stroke-linecap="round" opacity=".6"/>
      <path d="M 140 76 Q 146 84 142 94" fill="none" stroke="${sp.inner}" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    </g>`;
  }
  if (ear === "long") {
    return `<g class="pet-ears">
      <ellipse cx="78" cy="34" rx="13.5" ry="35" fill="${sp.body}" transform="rotate(-10 78 34)"/>
      <ellipse cx="78" cy="37" rx="7" ry="27" fill="${sp.inner}" transform="rotate(-10 78 37)"/>
      <ellipse cx="122" cy="34" rx="13.5" ry="35" fill="${sp.body}" transform="rotate(10 122 34)"/>
      <ellipse cx="122" cy="37" rx="7" ry="27" fill="${sp.inner}" transform="rotate(10 122 37)"/>
    </g>`;
  }
  if (ear === "round") {
    return `<g class="pet-ears">
      <circle cx="65" cy="51" r="13.5" fill="#3d3d3d"/><circle cx="135" cy="51" r="13.5" fill="#3d3d3d"/>
    </g>`;
  }
  if (ear === "horn") {
    return `<g class="pet-ears">
      <path d="M 76 52 L 67 26 L 89 44 Z" fill="${sp.belly}" stroke="${sp.shade}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 124 52 L 133 26 L 111 44 Z" fill="${sp.belly}" stroke="${sp.shade}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 92 46 Q 100 36 108 46" fill="none" stroke="${sp.shade}" stroke-width="3" stroke-linecap="round"/>
      <path d="M 84 44 Q 100 30 116 44" fill="none" stroke="${sp.shade}" stroke-width="2" stroke-linecap="round" opacity=".5"/>
    </g>`;
  }
  return "";
}

/* ================= 尾巴 ================= */
function tailSVG(sp, uid) {
  switch (sp.tail) {
    case "curl":
      return `<g class="pet-tail-group">
        <path d="M 138 138 Q 170 132 165 106 Q 161 90 147 95" fill="none" stroke="${sp.body}" stroke-width="15" stroke-linecap="round"/>
        <path d="M 150 96 Q 157 92 161 99" fill="none" stroke="${sp.shade}" stroke-width="5" stroke-linecap="round" opacity=".6"/>
        <path d="M 155 118 Q 162 116 165 110" fill="none" stroke="${sp.shade}" stroke-width="4" stroke-linecap="round" opacity=".5"/>
      </g>`;
    case "fluffy":
      if (sp.id === "fox") {
        return `<g class="pet-tail-group">
          <ellipse cx="152" cy="132" rx="27" ry="21" fill="${sp.body}" transform="rotate(18 152 132)"/>
          <ellipse cx="159" cy="134" rx="14" ry="11" fill="${sp.belly}" transform="rotate(18 159 134)"/>
        </g>`;
      }
      return `<g class="pet-tail-group">
        <ellipse cx="153" cy="130" rx="23" ry="16" fill="${sp.body}" transform="rotate(20 153 130)"/>
        <ellipse cx="157" cy="131" rx="13" ry="9" fill="${sp.belly}" transform="rotate(20 157 131)"/>
      </g>`;
    case "puff":
      return `<g class="pet-tail-group">
        <circle cx="146" cy="150" r="12.5" fill="${sp.id === "panda" ? "#f7f7f5" : sp.body}"/>
        <circle cx="143" cy="147" r="4" fill="#fff" opacity=".5"/>
      </g>`;
    case "spike":
      return `<g class="pet-tail-group">
        <path d="M 138 142 Q 172 138 178 110" fill="none" stroke="${sp.body}" stroke-width="13" stroke-linecap="round"/>
        <path d="M 157 127 L 166 116 L 166 132 Z" fill="${sp.belly}"/>
        <path d="M 172 121 L 183 114 L 179 130 Z" fill="${sp.belly}"/>
      </g>`;
    default:
      return "";
  }
}

/* ================= 眼睛（多层细节） ================= */
function eyeSVG(mood, sp) {
  const isDark = sp.id === "panda";
  const pupil = isDark ? "#fff" : "#43382e";
  const x1 = 86, x2 = 114, y = 82;

  const shiny = (cx, cy, r = 5.2) => `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${pupil}"/>
    <circle cx="${cx - 2}" cy="${cy - 2.4}" r="1.9" fill="#fff"/>
    <circle cx="${cx + 1.8}" cy="${cy + 2}" r="1" fill="#fff" opacity=".75"/>`;

  const sparkle = (cx, cy) => `
    <path d="M ${cx} ${cy - 6} L ${cx + 1.8} ${cy - 1.8} L ${cx + 6} ${cy} L ${cx + 1.8} ${cy + 1.8} L ${cx} ${cy + 6} L ${cx - 1.8} ${cy + 1.8} L ${cx - 6} ${cy} L ${cx - 1.8} ${cy - 1.8} Z" fill="#fff"/>`;

  if (mood === "sleepy") {
    return `<g class="pet-eyes">
      <path d="M 78 84 Q 86 77 94 84" fill="none" stroke="${pupil}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M 106 84 Q 114 77 122 84" fill="none" stroke="${pupil}" stroke-width="3.5" stroke-linecap="round"/>
    </g>`;
  }
  if (mood === "sad") {
    return `<g class="pet-eyes">
      <ellipse cx="${x1}" cy="${y}" rx="8.5" ry="9.5" fill="#fff"/>
      <ellipse cx="${x2}" cy="${y}" rx="8.5" ry="9.5" fill="#fff"/>
      ${shiny(x1, y + 2)}${shiny(x2, y + 2)}
      <path d="M 76 74 Q 86 69 96 75" fill="none" stroke="${pupil}" stroke-width="3" stroke-linecap="round"/>
      <path d="M 104 75 Q 114 69 124 74" fill="none" stroke="${pupil}" stroke-width="3" stroke-linecap="round"/>
      <g class="pet-tear">
        <path d="M 86 92 Q 89 98 86 101 Q 83 98 86 92 Z" fill="#8ec3ee" opacity=".9"/>
        <path d="M 114 92 Q 117 98 114 101 Q 111 98 114 92 Z" fill="#8ec3ee" opacity=".9"/>
      </g>
    </g>`;
  }
  if (mood === "hungry") {
    return `<g class="pet-eyes">
      <ellipse cx="${x1}" cy="${y}" rx="9.5" ry="10.5" fill="#fff"/>
      <ellipse cx="${x2}" cy="${y}" rx="9.5" ry="10.5" fill="#fff"/>
      ${shiny(x1, y + 1, 6)}${shiny(x2, y + 1, 6)}
      ${sparkle(x1 - 13, y - 11)}${sparkle(x2 + 13, y - 11)}
    </g>`;
  }
  if (mood === "dirty") {
    return `<g class="pet-eyes">
      <ellipse cx="${x1}" cy="${y}" rx="8.5" ry="9.5" fill="#fff"/>
      <ellipse cx="${x2}" cy="${y}" rx="8.5" ry="9.5" fill="#fff"/>
      ${shiny(x1, y + 1)}${shiny(x2, y + 1)}
      <path d="M 77 75 Q 86 70 95 75" fill="none" stroke="${pupil}" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M 105 75 Q 114 70 123 75" fill="none" stroke="${pupil}" stroke-width="2.8" stroke-linecap="round"/>
      <path class="pet-sweat" d="M 132 62 Q 135 68 132 71 Q 129 68 132 62 Z" fill="#8ec3ee" opacity=".85"/>
    </g>`;
  }
  /* happy：弯月笑眼 */
  return `<g class="pet-eyes">
    <path d="M 77 85 Q 86 72 95 85" fill="none" stroke="${pupil}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M 105 85 Q 114 72 123 85" fill="none" stroke="${pupil}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M 80 82 Q 86 76 92 82" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/>
    <path d="M 108 82 Q 114 76 120 82" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/>
  </g>`;
}

/* ================= 鼻子 & 嘴 ================= */
function mouthSVG(mood, sp) {
  if (mood === "hungry") {
    return `
      <path d="M 94 101 Q 100 95 106 101 Q 100 108 94 101 Z" fill="${sp.inner}"/>
      <ellipse class="pet-mouth" cx="100" cy="112" rx="6.5" ry="7.5" fill="#d96a7e"/>
      <ellipse cx="100" cy="115" rx="4" ry="3" fill="#ff9db0"/>
      <path d="M 88 117 Q 100 127 112 117" fill="none" stroke="#c98a5e" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  if (mood === "sad") {
    return `
      <path d="M 96 101 Q 100 105 104 101" fill="none" stroke="#a97850" stroke-width="2.5" stroke-linecap="round"/>
      <path class="pet-mouth" d="M 90 111 Q 100 105 110 111" fill="none" stroke="#a97850" stroke-width="2.8" stroke-linecap="round"/>`;
  }
  if (mood === "sleepy") {
    return `
      <path d="M 96 101 Q 100 105 104 101" fill="none" stroke="#a97850" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse class="pet-mouth" cx="100" cy="110" rx="4.5" ry="5.5" fill="#d96a7e"/>
      <text x="124" y="58" font-size="18" font-weight="900" fill="#8aa5c9" class="pet-zzz">Z</text>
      <text x="136" y="44" font-size="13" font-weight="900" fill="#a5bcd9" class="pet-zzz" style="animation-delay:.6s">z</text>`;
  }
  if (mood === "dirty") {
    return `
      <path d="M 95 100 L 100 105 L 105 100 Z" fill="${sp.inner}"/>
      <path class="pet-mouth" d="M 89 109 Q 95 104 100 109 Q 105 104 111 109" fill="none" stroke="#a97850" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  return `
    <path d="M 95 100 L 100 106 L 105 100 Z" fill="${sp.inner}"/>
    <path class="pet-mouth" d="M 92 107 Q 100 116 108 107" fill="none" stroke="#a97850" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M 96 111 Q 100 115 104 111" fill="#d96a7e" opacity=".55"/>`;
}

/* ================= 小图标版（选择器/欢迎屏用） ================= */
function petIconSVG(speciesId) {
  const sp = speciesById(speciesId);
  const uid = "ic" + Math.random().toString(36).slice(2, 7);
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg-${uid}" cx="35%" cy="25%" r="85%">
        <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="${sp.tint}"/>
      </radialGradient>
      <linearGradient id="body-${uid}" x1="0" y1="0" x2="0.2" y2="1">
        <stop offset="0%" stop-color="${sp.body}"/><stop offset="100%" stop-color="${sp.shade}"/>
      </linearGradient>
      <radialGradient id="cheek-${uid}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${sp.cheek}" stop-opacity=".8"/><stop offset="100%" stop-color="${sp.cheek}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="97" fill="url(#bg-${uid})"/>
    <ellipse cx="100" cy="176" rx="44" ry="8" fill="#8a6f4d" opacity=".14"/>
    <g transform="translate(100 172) scale(0.84) translate(-100 -172)">
      <g class="pet-tail-group">
        <path d="M 138 138 Q 170 132 165 108 Q 161 94 146 98" fill="none" stroke="${sp.body}" stroke-width="15" stroke-linecap="round"/>
      </g>
      <g class="pet-body-group">
        <ellipse cx="74" cy="166" rx="14" ry="10" fill="${sp.shade}"/>
        <ellipse cx="126" cy="166" rx="14" ry="10" fill="${sp.shade}"/>
        <ellipse cx="100" cy="139" rx="44" ry="37" fill="url(#body-${uid})"/>
        <ellipse cx="100" cy="148" rx="27" ry="24" fill="${sp.belly}" opacity=".9"/>
        <ellipse cx="80" cy="168" rx="11" ry="8.5" fill="${sp.body}"/>
        <ellipse cx="120" cy="168" rx="11" ry="8.5" fill="${sp.body}"/>
      </g>
      <g class="pet-head-group">
        ${earSVG(sp, uid)}
        <circle cx="100" cy="86" r="43" fill="url(#body-${uid})"/>
        <ellipse cx="86" cy="60" rx="17" ry="10" fill="#fff" opacity=".28" transform="rotate(-18 86 60)"/>
        <ellipse cx="70" cy="99" rx="9.5" ry="6" fill="url(#cheek-${uid})"/>
        <ellipse cx="130" cy="99" rx="9.5" ry="6" fill="url(#cheek-${uid})"/>
        <path d="M 77 85 Q 86 72 95 85" fill="none" stroke="#43382e" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M 105 85 Q 114 72 123 85" fill="none" stroke="#43382e" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M 95 100 L 100 106 L 105 100 Z" fill="${sp.inner}"/>
        <path d="M 92 107 Q 100 116 108 107" fill="none" stroke="#a97850" stroke-width="2.8" stroke-linecap="round"/>
      </g>
    </g>
  </svg>`;
}

/* ================= 导出 ================= */
window.Art = { petSVG, petIconSVG };
