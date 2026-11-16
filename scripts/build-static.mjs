// Builds the static profile graphics (header banner and expertise cards)
// in dark and light variants. Text lives in PROFILE below: edit it, then run
//   node scripts/build-static.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { THEMES, esc, textWidth, svgOpen } from './theme.mjs';

const PROFILE = {
  name: 'John Victor Gatimu',
  role: 'Full Stack Systems Developer',
  handle: 'gatimuvictor',
  chips: ['Laravel', 'Django', 'Database Administration', 'D365 Business Central'],
  // Rendered in the code window on the right of the banner
  code: [
    [['var', '$victor'], ['punct', ' = [']],
    [['key', "    'backend'"], ['punct', ' => ['], ['str', "'Laravel'"], ['punct', ', '], ['str', "'Django'"], ['punct', '],']],
    [['key', "    'data'   "], ['punct', ' => ['], ['str', "'MySQL'"], ['punct', ', '], ['str', "'PostgreSQL'"], ['punct', '],']],
    [['key', "    'erp'    "], ['punct', ' => '], ['str', "'Business Central'"], ['punct', ',']],
    [['key', "    'focus'  "], ['punct', ' => '], ['str', "'reliable systems'"], ['punct', ',']],
    [['punct', '];']],
  ],
  expertise: [
    {
      no: '01',
      title: 'Laravel Development',
      line: 'ERP, POS, finance and HR/payroll systems',
      stack: 'PHP · Laravel · REST APIs · Queues',
      accent: 'coral',
    },
    {
      no: '02',
      title: 'Django Development',
      line: 'Python back ends and enterprise web platforms',
      stack: 'Python · Django · REST APIs · PostgreSQL',
      accent: 'green',
    },
    {
      no: '03',
      title: 'Database Administration',
      line: 'Design, tuning, backup, replication, security',
      stack: 'MySQL · MariaDB · PostgreSQL · SQL Server',
      accent: 'blue',
    },
    {
      no: '04',
      title: 'Dynamics 365 Business Central',
      line: 'AL extensions, APIs and system integrations',
      stack: 'AL · OData · Power BI · Azure',
      accent: 'violet',
    },
  ],
};

function header(t) {
  const W = 1200;
  const H = 360;
  const isDark = t.name === 'dark';

  // Chips under the role
  let x = 64;
  const chips = PROFILE.chips
    .map((label, i) => {
      const w = Math.round(textWidth(label, 15, { bold: true }) + 34);
      const out = `<g class="fade" style="animation-delay:${0.55 + i * 0.08}s">
      <rect x="${x}" y="262" width="${w}" height="36" rx="18" fill="${t.blue}" fill-opacity="${isDark ? 0.1 : 0.07}" stroke="${t.blue}" stroke-opacity="${isDark ? 0.45 : 0.35}"/>
      <text x="${x + w / 2}" y="285.5" text-anchor="middle" class="sans" font-size="15" font-weight="600" fill="${t.blue}">${esc(label)}</text>
    </g>`;
      x += w + 10;
      return out;
    })
    .join('\n    ');

  // Code window
  const cx = 742;
  const cy = 74;
  const cw = 404;
  const ch = 232;
  const colour = { var: t.codeVar, key: t.codeKey, str: t.codeString, punct: t.codePunct };
  const codeLines = PROFILE.code
    .map((tokens, i) => {
      const spans = tokens
        .map(([kind, txt]) => `<tspan fill="${colour[kind]}">${esc(txt).replace(/ /g, '&#160;')}</tspan>`)
        .join('');
      return `<text x="${cx + 24}" y="${cy + 78 + i * 25}" class="mono line" font-size="14" style="animation-delay:${0.8 + i * 0.12}s">${spans}</text>`;
    })
    .join('\n    ');

  return `${svgOpen(W, H, `${PROFILE.name}, ${PROFILE.role}`, `
  .fade { animation: fadeUp .7s cubic-bezier(.2,.7,.2,1) both; }
  .line { animation: fadeIn .5s ease both; }
  .orbA { animation: driftA 14s ease-in-out infinite alternate; }
  .orbB { animation: driftB 18s ease-in-out infinite alternate; }
  .cursor { animation: blink 1.1s steps(1) infinite; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes driftA { from { transform: translate(0,0); } to { transform: translate(60px,30px); } }
  @keyframes driftB { from { transform: translate(0,0); } to { transform: translate(-70px,-20px); } }
  @keyframes blink { 50% { opacity: 0; } }`)}
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${isDark ? '#0b1222' : '#f7faff'}"/>
      <stop offset="1" stop-color="${isDark ? '#0d1117' : '#ffffff'}"/>
    </linearGradient>
    <linearGradient id="role" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.blue}"/>
      <stop offset="1" stop-color="${t.violet}"/>
    </linearGradient>
    <radialGradient id="glowA"><stop offset="0" stop-color="${t.blue}" stop-opacity="${isDark ? 0.35 : 0.18}"/><stop offset="1" stop-color="${t.blue}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB"><stop offset="0" stop-color="${t.violet}" stop-opacity="${isDark ? 0.3 : 0.14}"/><stop offset="1" stop-color="${t.violet}" stop-opacity="0"/></radialGradient>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.1" fill="${t.faint}" fill-opacity="${isDark ? 0.35 : 0.45}"/>
    </pattern>
    <linearGradient id="dotFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".55" stop-color="#fff" stop-opacity=".9"/>
      <stop offset="1" stop-color="#fff" stop-opacity=".4"/>
    </linearGradient>
    <mask id="dotMask"><rect width="${W}" height="${H}" fill="url(#dotFade)"/></mask>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="${isDark ? '#000' : '#1f2328'}" flood-opacity="${isDark ? 0.45 : 0.12}"/>
    </filter>
  </defs>

  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#dotMask)"/>
    <circle class="orbA" cx="880" cy="70" r="300" fill="url(#glowA)"/>
    <circle class="orbB" cx="1120" cy="340" r="260" fill="url(#glowB)"/>
  </g>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="21.5" fill="none" stroke="${t.cardEdge}"/>

  <g class="fade" style="animation-delay:.05s">
    <text x="64" y="92" class="mono" font-size="16" fill="${t.muted}"><tspan fill="${t.green}">~/${esc(PROFILE.handle)}</tspan> $ whoami<tspan class="cursor" fill="${t.blue}">&#160;_</tspan></text>
  </g>
  <g class="fade" style="animation-delay:.18s">
    <text x="62" y="162" class="sans" font-size="58" font-weight="700" letter-spacing="-1.2" fill="${t.text}">${esc(PROFILE.name)}</text>
  </g>
  <g class="fade" style="animation-delay:.32s">
    <text x="64" y="214" class="sans" font-size="28" font-weight="600" fill="url(#role)">${esc(PROFILE.role)}</text>
  </g>
  <g>
    ${chips}
  </g>

  <g class="fade" style="animation-delay:.45s" filter="url(#shadow)">
    <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="14" fill="${t.codeBg}" stroke="${t.cardEdge}"/>
    <path d="M${cx} ${cy + 14}a14 14 0 0 1 14 -14h${cw - 28}a14 14 0 0 1 14 14v26h-${cw}z" fill="${isDark ? '#0f1726' : '#eef1f5'}"/>
    <line x1="${cx}" y1="${cy + 40}" x2="${cx + cw}" y2="${cy + 40}" stroke="${t.cardEdge}"/>
    <circle cx="${cx + 22}" cy="${cy + 20}" r="5.5" fill="#ff5f57"/>
    <circle cx="${cx + 40}" cy="${cy + 20}" r="5.5" fill="#febc2e"/>
    <circle cx="${cx + 58}" cy="${cy + 20}" r="5.5" fill="#28c840"/>
    <text x="${cx + cw / 2}" y="${cy + 25}" text-anchor="middle" class="mono" font-size="12.5" fill="${t.muted}">profile.php</text>
  </g>
  <g>
    ${codeLines}
  </g>
</svg>
`;
}

function expertise(t) {
  const W = 1200;
  const H = 452;
  const cardW = 584;
  const cardH = 214;
  const gap = 32;
  const cards = PROFILE.expertise
    .map((e, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col * (cardW + gap);
      const y = row * (cardH + 24);
      const a = t[e.accent];
      return `<g class="fade" style="animation-delay:${0.08 + i * 0.1}s">
    <rect x="${x + 0.5}" y="${y + 0.5}" width="${cardW - 1}" height="${cardH - 1}" rx="18" fill="${t.card}" stroke="${t.cardEdge}"/>
    <rect x="${x + 0.5}" y="${y + 0.5}" width="${cardW - 1}" height="${cardH - 1}" rx="18" fill="url(#wash-${e.accent})"/>
    <rect x="${x + 28}" y="${y + 30}" width="54" height="54" rx="14" fill="${a}" fill-opacity="${t.name === 'dark' ? 0.14 : 0.1}" stroke="${a}" stroke-opacity=".5"/>
    <text x="${x + 55}" y="${y + 64}" text-anchor="middle" class="mono" font-size="19" font-weight="700" fill="${a}">${e.no}</text>
    <text x="${x + 102}" y="${y + 66}" class="sans" font-size="25" font-weight="700" fill="${t.text}">${esc(e.title)}</text>
    <text x="${x + 30}" y="${y + 128}" class="sans" font-size="20" fill="${t.muted}">${esc(e.line)}</text>
    <line x1="${x + 30}" y1="${y + 152}" x2="${x + cardW - 30}" y2="${y + 152}" stroke="${t.cardEdge}" stroke-dasharray="3 5"/>
    <text x="${x + 30}" y="${y + 186}" class="mono" font-size="16.5" font-weight="600" fill="${a}">${esc(e.stack)}</text>
  </g>`;
    })
    .join('\n  ');

  const washes = ['coral', 'green', 'blue', 'violet']
    .map(
      (k) => `<radialGradient id="wash-${k}" cx="1" cy="0" r="0.9">
      <stop offset="0" stop-color="${t[k]}" stop-opacity="${t.name === 'dark' ? 0.16 : 0.08}"/>
      <stop offset="1" stop-color="${t[k]}" stop-opacity="0"/>
    </radialGradient>`,
    )
    .join('\n    ');

  return `${svgOpen(W, H, 'Areas of expertise: Laravel, Django, database administration, Dynamics 365 Business Central', `
  .fade { animation: fadeUp .7s cubic-bezier(.2,.7,.2,1) both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }`)}
  <defs>
    ${washes}
  </defs>
  ${cards}
</svg>
`;
}

mkdirSync('assets', { recursive: true });
for (const t of Object.values(THEMES)) {
  writeFileSync(`assets/header-${t.name}.svg`, header(t));
  writeFileSync(`assets/expertise-${t.name}.svg`, expertise(t));
}
console.log('Built assets/header-*.svg and assets/expertise-*.svg');
