// Renders the data-driven profile cards. Pure functions: data in, SVG string out.
import { esc, svgOpen } from './theme.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function fmtRange(r) {
  if (!r || !r.length) return '';
  return r.start === r.end ? fmtDate(r.start) : `${fmtDate(r.start)} → ${fmtDate(r.end)}`;
}

function fmtNum(n) {
  return Number(n).toLocaleString('en-GB');
}

const FADE = `
  .fade { animation: fadeUp .7s cubic-bezier(.2,.7,.2,1) both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`;

/* ------------------------------------------------------------------ stats */

export function statsCard(d, t) {
  const W = 1200;
  const H = 214;
  const gap = 16;
  const tileW = (W - gap * 4) / 5;
  const isDark = t.name === 'dark';

  const tiles = [
    { label: 'Contributions', value: fmtNum(d.totalYear), sub: 'last 12 months', accent: t.blue },
    {
      label: 'Current streak',
      value: d.currentStreak.length,
      unit: d.currentStreak.length === 1 ? 'day' : 'days',
      sub: d.currentStreak.length ? fmtRange(d.currentStreak) : 'starts with the next commit',
      accent: t.amber,
      highlight: true,
    },
    {
      label: 'Longest streak',
      value: d.longestStreak.length,
      unit: d.longestStreak.length === 1 ? 'day' : 'days',
      sub: fmtRange(d.longestStreak) || 'no streak yet',
      accent: t.violet,
    },
    { label: 'Active days', value: fmtNum(d.activeDays), sub: 'last 12 months', accent: t.green },
    {
      label: 'Repositories',
      value: fmtNum(d.repoCount),
      sub: d.privateRepoCount ? `${fmtNum(d.privateRepoCount)} private` : 'owned',
      accent: t.coral,
    },
  ];

  const body = tiles
    .map((tile, i) => {
      const x = i * (tileW + gap);
      const valueText = String(tile.value);
      const unitX = 26 + valueText.length * 30.5 + 10;
      return `<g class="fade" style="animation-delay:${0.05 + i * 0.07}s">
    <rect x="${x + 0.5}" y="0.5" width="${tileW - 1}" height="${H - 1}" rx="18" fill="${t.card}" stroke="${tile.highlight ? tile.accent : t.cardEdge}" stroke-opacity="${tile.highlight ? 0.6 : 1}"/>
    <rect x="${x + 0.5}" y="0.5" width="${tileW - 1}" height="${H - 1}" rx="18" fill="url(#wash${i})"/>
    <circle cx="${x + 30}" cy="40" r="5" fill="${tile.accent}"/>
    <text x="${x + 44}" y="46" class="sans" font-size="17" font-weight="600" fill="${t.muted}">${esc(tile.label)}</text>
    <text x="${x + 24}" y="128" class="sans" font-size="50" font-weight="700" letter-spacing="-1" fill="${t.text}">${esc(valueText)}</text>
    ${tile.unit ? `<text x="${x + unitX}" y="128" class="sans" font-size="20" font-weight="600" fill="${t.muted}">${tile.unit}</text>` : ''}
    <text x="${x + 26}" y="178" class="sans" font-size="15.5" fill="${tile.accent}">${esc(tile.sub)}</text>
  </g>`;
    })
    .join('\n  ');

  const washes = tiles
    .map(
      (tile, i) => `<radialGradient id="wash${i}" cx="1" cy="0" r="1">
      <stop offset="0" stop-color="${tile.accent}" stop-opacity="${(tile.highlight ? 0.22 : 0.12) * (isDark ? 1 : 0.6)}"/>
      <stop offset="1" stop-color="${tile.accent}" stop-opacity="0"/>
    </radialGradient>`,
    )
    .join('\n    ');

  return `${svgOpen(W, H, `GitHub stats for ${d.login}`, FADE)}
  <defs>
    ${washes}
  </defs>
  ${body}
</svg>
`;
}

/* --------------------------------------------------------------- activity */

// Monotone cubic interpolation (Fritsch–Carlson): smooth, never dips below zero.
function monotonePath(pts) {
  const n = pts.length;
  if (n < 2) return '';
  const dx = [];
  const m = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push((pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  const tang = [m[0]];
  for (let i = 1; i < n - 1; i++) tang.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  tang.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      tang[i] = 0;
      tang[i + 1] = 0;
      continue;
    }
    const a = tang[i] / m[i];
    const b = tang[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      tang[i] = k * a * m[i];
      tang[i + 1] = k * b * m[i];
    }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${(pts[i][0] + h).toFixed(1)},${(pts[i][1] + tang[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)},${(pts[i + 1][1] - tang[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

function niceMax(v) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  for (const step of [2, 4, 6, 8, 10]) {
    if (step * pow >= v) return step * pow;
  }
  return 20 * pow;
}

export function activityCard(d, t) {
  const W = 1200;
  const H = 436;
  const L = 78;
  const R = 1168;
  const TOP = 148;
  const BOTTOM = 360;
  const weeks = d.weeks;
  const max = Math.max(0, ...weeks.map((w) => w.total));
  const yMax = niceMax(max);
  const xOf = (i) => L + (i * (R - L)) / Math.max(1, weeks.length - 1);
  const yOf = (v) => BOTTOM - (v / yMax) * (BOTTOM - TOP);
  const pts = weeks.map((w, i) => [xOf(i), yOf(w.total)]);
  const line = monotonePath(pts);
  const area = `${line} L${R},${BOTTOM} L${L},${BOTTOM} Z`;

  const grid = [0, 0.5, 1]
    .map((f) => {
      const v = yMax * f;
      const y = yOf(v);
      return `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" stroke="${t.grid}" ${f ? 'stroke-dasharray="4 6"' : ''}/>
    <text x="${L - 14}" y="${y + 5}" text-anchor="end" class="sans" font-size="14" fill="${t.muted}">${fmtNum(v)}</text>`;
    })
    .join('\n    ');

  let lastX = -100;
  let lastMonth = -1;
  const months = weeks
    .map((w, i) => {
      const mo = new Date(`${w.start}T00:00:00Z`).getUTCMonth();
      if (mo === lastMonth) return '';
      lastMonth = mo;
      const x = xOf(i);
      if (x - lastX < 56) return '';
      lastX = x;
      return `<text x="${x}" y="${BOTTOM + 34}" text-anchor="middle" class="sans" font-size="14" fill="${t.muted}">${MONTHS[mo]}</text>`;
    })
    .join('');

  const peakIdx = weeks.reduce((best, w, i) => (w.total > weeks[best].total ? i : best), 0);
  const peak = weeks[peakIdx];
  const subtitle = max
    ? `Weekly totals · busiest week from ${fmtDate(peak.start)} (${fmtNum(peak.total)})`
    : 'Weekly totals · activity appears here after the first contribution';

  const peakMarker = max
    ? (() => {
        const [px, py] = pts[peakIdx];
        const label = `${fmtNum(peak.total)}`;
        const bw = 22 + label.length * 9;
        const bx = Math.min(Math.max(px - bw / 2, L), R - bw);
        return `<g class="pop">
      <line x1="${px}" y1="${py}" x2="${px}" y2="${BOTTOM}" stroke="${t.blue}" stroke-opacity=".35" stroke-dasharray="2 4"/>
      <circle cx="${px}" cy="${py}" r="11" fill="${t.blue}" fill-opacity=".18"/>
      <circle cx="${px}" cy="${py}" r="5.5" fill="${t.bg}" stroke="${t.blue}" stroke-width="3"/>
      <rect x="${bx}" y="${py - 46}" width="${bw}" height="28" rx="8" fill="${t.blue}"/>
      <text x="${bx + bw / 2}" y="${py - 27}" text-anchor="middle" class="sans" font-size="15" font-weight="700" fill="${t.bg}">${label}</text>
    </g>`;
      })()
    : '';

  return `${svgOpen(W, H, `Contribution activity for ${d.login}`, `${FADE}
  .draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 2.2s cubic-bezier(.4,0,.2,1) .2s forwards; }
  .areaIn { animation: fadeIn 1.4s ease .9s both; }
  .pop { animation: fadeIn .6s ease 2.1s both; }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .draw { stroke-dashoffset: 0; } }`)}
  <defs>
    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.blue}" stop-opacity="${t.name === 'dark' ? 0.45 : 0.28}"/>
      <stop offset="1" stop-color="${t.blue}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.violet}"/>
      <stop offset="1" stop-color="${t.blue}"/>
    </linearGradient>
    <filter id="glow" x="-5%" y="-30%" width="110%" height="160%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="${t.card}" stroke="${t.cardEdge}"/>
  <g class="fade">
    <text x="32" y="54" class="sans" font-size="24" font-weight="700" fill="${t.text}">Contribution activity</text>
    <text x="32" y="84" class="sans" font-size="16" fill="${t.muted}">${esc(subtitle)}</text>
    <text x="${W - 32}" y="54" text-anchor="end" class="sans" font-size="24" font-weight="700" fill="${t.blue}">${fmtNum(d.totalYear)}</text>
    <text x="${W - 32}" y="84" text-anchor="end" class="sans" font-size="16" fill="${t.muted}">contributions in the last year</text>
  </g>
  <g>
    ${grid}
  </g>
  ${months}
  <path class="areaIn" d="${area}" fill="url(#fill)"/>
  <path class="draw" d="${line}" pathLength="1" fill="none" stroke="url(#stroke)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
  ${peakMarker}
</svg>
`;
}

/* -------------------------------------------------------------- languages */

export function languagesCard(d, t) {
  const W = 1200;
  const langs = d.languages;
  const total = langs.reduce((s, l) => s + l.bytes, 0);
  const cols = 3;
  const rows = Math.max(1, Math.ceil(langs.length / cols));
  const H = total ? 168 + rows * 42 : 190;
  const header = `<text x="32" y="54" class="sans" font-size="24" font-weight="700" fill="${t.text}">Most used languages</text>
  <text x="32" y="84" class="sans" font-size="16" fill="${t.muted}">${
    total
      ? esc(`By code size across ${fmtNum(d.languageRepoCount)} ${d.languageRepoCount === 1 ? 'repository' : 'repositories'}`)
      : 'No language data yet'
  }</text>`;

  if (!total) {
    return `${svgOpen(W, H, `Most used languages for ${d.login}`, FADE)}
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="${t.card}" stroke="${t.cardEdge}"/>
  <g class="fade">${header}
  <text x="32" y="140" class="sans" font-size="17" fill="${t.blue}">Add the PROFILE_STATS_TOKEN secret so private repositories are included.</text></g>
</svg>
`;
  }

  const barX = 32;
  const barW = W - 64;
  let acc = 0;
  const segs = langs
    .map((l) => {
      const w = (l.bytes / total) * barW;
      const out = `<rect x="${(barX + acc).toFixed(2)}" y="112" width="${Math.max(w, 0).toFixed(2)}" height="16" fill="${l.color || t.muted}"/>`;
      acc += w;
      return out;
    })
    .join('');

  const colW = barW / cols;
  const legend = langs
    .map((l, i) => {
      const x = barX + (i % cols) * colW;
      const y = 174 + Math.floor(i / cols) * 42;
      const pct = ((l.bytes / total) * 100).toFixed(1);
      return `<g class="fade" style="animation-delay:${0.15 + i * 0.05}s">
    <circle cx="${x + 8}" cy="${y - 6}" r="7" fill="${l.color || t.muted}"/>
    <text x="${x + 26}" y="${y}" class="sans" font-size="17" font-weight="600" fill="${t.text}">${esc(l.name)}</text>
    <text x="${x + colW - 24}" y="${y}" text-anchor="end" class="mono" font-size="15.5" fill="${t.muted}">${pct}%</text>
  </g>`;
    })
    .join('\n  ');

  return `${svgOpen(W, H, `Most used languages for ${d.login}`, `${FADE}
  .grow { animation: grow 1.4s cubic-bezier(.2,.7,.2,1) .1s both; transform-origin: 32px 0; }
  @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }`)}
  <defs>
    <clipPath id="bar"><rect x="${barX}" y="112" width="${barW}" height="16" rx="8"/></clipPath>
  </defs>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="${t.card}" stroke="${t.cardEdge}"/>
  <g class="fade">${header}</g>
  <g clip-path="url(#bar)"><g class="grow">${segs}</g></g>
  ${legend}
</svg>
`;
}

/* ------------------------------------------------------------ data shaping */

// days: [{ date: 'YYYY-MM-DD', count }] sorted ascending, ending today.
export function computeStreaks(days) {
  let longest = { length: 0, start: null, end: null };
  let run = { length: 0, start: null, end: null };
  for (const day of days) {
    if (day.count > 0) {
      run = run.length ? { ...run, length: run.length + 1, end: day.date } : { length: 1, start: day.date, end: day.date };
      if (run.length > longest.length) longest = { ...run };
    } else {
      run = { length: 0, start: null, end: null };
    }
  }
  // Current streak: today does not break it until the day is over.
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i -= 1;
  let current = { length: 0, start: null, end: null };
  for (; i >= 0 && days[i].count > 0; i--) {
    current = current.length
      ? { ...current, length: current.length + 1, start: days[i].date }
      : { length: 1, start: days[i].date, end: days[i].date };
  }
  return { current, longest };
}
