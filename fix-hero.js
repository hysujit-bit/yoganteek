const fs = require('fs');
let c = fs.readFileSync('d:/ALKIMI/yoganteek/index.html', 'utf8');
c = c.replace(/\r\n/g, '\n');

// ─── CSS FIXES ───────────────────────────────────────────────────────────────

// 1. Hero wrap -> 2-column grid
c = c.replace(
  '.home-hero-wrap { max-width:1200px; margin:0 auto; padding:0 40px; width:100%; }',
  '.home-hero-wrap { max-width:1200px; margin:0 auto; padding:0 40px; width:100%; display:grid; grid-template-columns:1fr 1fr; align-items:center; gap:40px; }'
);

// 2. Hero inner - remove fixed max-width
c = c.replace(
  '.home-hero-inner { max-width:660px; z-index:10; animation:fadeInUp 1.2s ease-out; }',
  '.home-hero-inner { max-width:100%; z-index:10; animation:fadeInUp 1.2s ease-out; }'
);

// 3. Hero yoga lotus - relative positioning inside grid
c = c.replace(
  '.hero-yoga-lotus { position:absolute; width:520px; height:520px; right:-80px; top:50%; transform:translateY(-50%); pointer-events:none; }',
  '.hero-yoga-lotus { position:relative; width:100%; height:520px; display:flex; align-items:center; justify-content:center; pointer-events:none; }'
);
c = c.replace(
  '.hero-yoga-lotus svg { width:100%; height:100%; overflow:visible; }',
  '.hero-yoga-lotus svg { width:100%; height:100%; max-height:500px; overflow:visible; }'
);

// 4. Mobile media query
c = c.replace(
  '@media(max-width:900px){.hero-lotus{display:none !important;}.home-hero-inner{grid-template-columns:1fr !important;}}',
  '@media(max-width:900px){.hero-yoga-lotus{display:none !important;}.home-hero-wrap{grid-template-columns:1fr !important;}}'
);

// ─── HTML STRUCTURE FIX ──────────────────────────────────────────────────────
// Move .hero-yoga-lotus inside .home-hero-wrap

// Remove the extra </div> that was closing home-hero-wrap before the lotus div
c = c.replace(
  '    </div>\n    </div>\n    <div class="hero-yoga-lotus">',
  '    </div>\n    <div class="hero-yoga-lotus">'
);

// Fix the closing tags at end of hero section
c = c.replace(
  '    </svg>\n</div>\n</div>\n</section>',
  '    </svg>\n    </div>\n    </div>\n</section>'
);

// ─── NEW SVG: Elegant Lotus Mandala ──────────────────────────────────────────
const newSVG = [
'<svg id="yogaMandala" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;max-height:500px">',
'  <defs>',
'    <radialGradient id="pgOuter" cx="50%" cy="15%" r="85%" gradientUnits="objectBoundingBox">',
'      <stop offset="0%" stop-color="#9B7BB8"/>',
'      <stop offset="100%" stop-color="#3E2E58"/>',
'    </radialGradient>',
'    <radialGradient id="pgInner" cx="50%" cy="15%" r="85%">',
'      <stop offset="0%" stop-color="#D4A845" stop-opacity="0.92"/>',
'      <stop offset="100%" stop-color="#8A6018" stop-opacity="0.72"/>',
'    </radialGradient>',
'    <radialGradient id="pgCenter" cx="40%" cy="35%" r="65%">',
'      <stop offset="0%" stop-color="#F2C84B"/>',
'      <stop offset="70%" stop-color="#C89B3C"/>',
'      <stop offset="100%" stop-color="#9A7620"/>',
'    </radialGradient>',
'    <radialGradient id="pgMid" cx="50%" cy="50%" r="50%">',
'      <stop offset="0%" stop-color="#5A4878"/>',
'      <stop offset="100%" stop-color="#3D2D55"/>',
'    </radialGradient>',
'    <radialGradient id="pgAmbient" cx="50%" cy="50%" r="50%">',
'      <stop offset="0%" stop-color="rgba(107,91,138,0.2)"/>',
'      <stop offset="100%" stop-color="rgba(107,91,138,0)"/>',
'    </radialGradient>',
'    <filter id="pgGlow" x="-15%" y="-15%" width="130%" height="130%">',
'      <feGaussianBlur stdDeviation="3" result="b"/>',
'      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>',
'    </filter>',
'    <filter id="pgCenterGlow" x="-40%" y="-40%" width="180%" height="180%">',
'      <feGaussianBlur stdDeviation="6" result="b"/>',
'      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>',
'    </filter>',
'  </defs>',
'',
'  <!-- Ambient background -->',
'  <circle cx="250" cy="250" r="248" fill="url(#pgAmbient)"/>',
'',
'  <!-- OUTER RING GROUP (slow rotation) -->',
'  <g style="transform-origin:250px 250px;animation:pg-spin 90s linear infinite">',
'    <circle cx="250" cy="250" r="234" fill="none" stroke="#C89B3C" stroke-width="1.2" opacity="0.5"/>',
'    <circle cx="250" cy="250" r="228" fill="none" stroke="#C89B3C" stroke-width="0.5" opacity="0.25"/>',
'    <!-- 16 tick marks -->',
'    <g stroke="#C89B3C" stroke-width="1" opacity="0.45">',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(0,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(22.5,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(45,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(67.5,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(90,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(112.5,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(135,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(157.5,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(180,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(202.5,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(225,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(247.5,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(270,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(292.5,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(315,250,250)"/>',
'      <line x1="250" y1="16" x2="250" y2="24" transform="rotate(337.5,250,250)"/>',
'    </g>',
'    <!-- 8 diamond accent points -->',
'    <g fill="#C89B3C" opacity="0.62">',
'      <polygon points="250,11 253,17 250,23 247,17" transform="rotate(0,250,250)"/>',
'      <polygon points="250,11 253,17 250,23 247,17" transform="rotate(45,250,250)"/>',
'      <polygon points="250,11 253,17 250,23 247,17" transform="rotate(90,250,250)"/>',
'      <polygon points="250,11 253,17 250,23 247,17" transform="rotate(135,250,250)"/>',
'      <polygon points="250,11 253,17 250,23 247,17" transform="rotate(180,250,250)"/>',
'      <polygon points="250,11 253,17 250,23 247,17" transform="rotate(225,250,250)"/>',
'      <polygon points="250,11 253,17 250,23 247,17" transform="rotate(270,250,250)"/>',
'      <polygon points="250,11 253,17 250,23 247,17" transform="rotate(315,250,250)"/>',
'    </g>',
'    <!-- 8 outer lotus petals -->',
'    <g filter="url(#pgGlow)" opacity="0.93">',
'      <g transform="translate(250,250) rotate(0)"><path d="M0,-216 C-36,-172 -38,-130 0,-104 C38,-130 36,-172 0,-216Z" fill="url(#pgOuter)"/><path d="M0,-204 C-22,-168 -22,-132 0,-114 C22,-132 22,-168 0,-204Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.3"/></g>',
'      <g transform="translate(250,250) rotate(45)"><path d="M0,-216 C-36,-172 -38,-130 0,-104 C38,-130 36,-172 0,-216Z" fill="url(#pgOuter)"/><path d="M0,-204 C-22,-168 -22,-132 0,-114 C22,-132 22,-168 0,-204Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.3"/></g>',
'      <g transform="translate(250,250) rotate(90)"><path d="M0,-216 C-36,-172 -38,-130 0,-104 C38,-130 36,-172 0,-216Z" fill="url(#pgOuter)"/><path d="M0,-204 C-22,-168 -22,-132 0,-114 C22,-132 22,-168 0,-204Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.3"/></g>',
'      <g transform="translate(250,250) rotate(135)"><path d="M0,-216 C-36,-172 -38,-130 0,-104 C38,-130 36,-172 0,-216Z" fill="url(#pgOuter)"/><path d="M0,-204 C-22,-168 -22,-132 0,-114 C22,-132 22,-168 0,-204Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.3"/></g>',
'      <g transform="translate(250,250) rotate(180)"><path d="M0,-216 C-36,-172 -38,-130 0,-104 C38,-130 36,-172 0,-216Z" fill="url(#pgOuter)"/><path d="M0,-204 C-22,-168 -22,-132 0,-114 C22,-132 22,-168 0,-204Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.3"/></g>',
'      <g transform="translate(250,250) rotate(225)"><path d="M0,-216 C-36,-172 -38,-130 0,-104 C38,-130 36,-172 0,-216Z" fill="url(#pgOuter)"/><path d="M0,-204 C-22,-168 -22,-132 0,-114 C22,-132 22,-168 0,-204Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.3"/></g>',
'      <g transform="translate(250,250) rotate(270)"><path d="M0,-216 C-36,-172 -38,-130 0,-104 C38,-130 36,-172 0,-216Z" fill="url(#pgOuter)"/><path d="M0,-204 C-22,-168 -22,-132 0,-114 C22,-132 22,-168 0,-204Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.3"/></g>',
'      <g transform="translate(250,250) rotate(315)"><path d="M0,-216 C-36,-172 -38,-130 0,-104 C38,-130 36,-172 0,-216Z" fill="url(#pgOuter)"/><path d="M0,-204 C-22,-168 -22,-132 0,-114 C22,-132 22,-168 0,-204Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.3"/></g>',
'    </g>',
'    <circle cx="250" cy="250" r="102" fill="none" stroke="rgba(200,155,60,0.32)" stroke-width="1.2"/>',
'  </g>',
'',
'  <!-- INNER MIDDLE RING (fixed) -->',
'  <circle cx="250" cy="250" r="106" fill="url(#pgMid)" stroke="#7A5FA0" stroke-width="1.8" opacity="0.88"/>',
'',
'  <!-- INNER PETALS (counter-rotation) -->',
'  <g style="transform-origin:250px 250px;animation:pg-rev 60s linear infinite">',
'    <g opacity="0.9">',
'      <g transform="translate(250,250) rotate(22.5)"><path d="M0,-100 C-15,-88 -15,-70 0,-62 C15,-70 15,-88 0,-100Z" fill="url(#pgInner)"/></g>',
'      <g transform="translate(250,250) rotate(67.5)"><path d="M0,-100 C-15,-88 -15,-70 0,-62 C15,-70 15,-88 0,-100Z" fill="url(#pgInner)"/></g>',
'      <g transform="translate(250,250) rotate(112.5)"><path d="M0,-100 C-15,-88 -15,-70 0,-62 C15,-70 15,-88 0,-100Z" fill="url(#pgInner)"/></g>',
'      <g transform="translate(250,250) rotate(157.5)"><path d="M0,-100 C-15,-88 -15,-70 0,-62 C15,-70 15,-88 0,-100Z" fill="url(#pgInner)"/></g>',
'      <g transform="translate(250,250) rotate(202.5)"><path d="M0,-100 C-15,-88 -15,-70 0,-62 C15,-70 15,-88 0,-100Z" fill="url(#pgInner)"/></g>',
'      <g transform="translate(250,250) rotate(247.5)"><path d="M0,-100 C-15,-88 -15,-70 0,-62 C15,-70 15,-88 0,-100Z" fill="url(#pgInner)"/></g>',
'      <g transform="translate(250,250) rotate(292.5)"><path d="M0,-100 C-15,-88 -15,-70 0,-62 C15,-70 15,-88 0,-100Z" fill="url(#pgInner)"/></g>',
'      <g transform="translate(250,250) rotate(337.5)"><path d="M0,-100 C-15,-88 -15,-70 0,-62 C15,-70 15,-88 0,-100Z" fill="url(#pgInner)"/></g>',
'    </g>',
'    <!-- 8 gold dots between inner petals -->',
'    <g fill="#C89B3C" opacity="0.55">',
'      <circle cx="250" cy="156" r="2.2" transform="rotate(0,250,250)"/>',
'      <circle cx="250" cy="156" r="2.2" transform="rotate(45,250,250)"/>',
'      <circle cx="250" cy="156" r="2.2" transform="rotate(90,250,250)"/>',
'      <circle cx="250" cy="156" r="2.2" transform="rotate(135,250,250)"/>',
'      <circle cx="250" cy="156" r="2.2" transform="rotate(180,250,250)"/>',
'      <circle cx="250" cy="156" r="2.2" transform="rotate(225,250,250)"/>',
'      <circle cx="250" cy="156" r="2.2" transform="rotate(270,250,250)"/>',
'      <circle cx="250" cy="156" r="2.2" transform="rotate(315,250,250)"/>',
'    </g>',
'  </g>',
'',
'  <!-- CENTER (fixed) -->',
'  <circle cx="250" cy="250" r="60" fill="rgba(45,30,70,0.92)" stroke="#C89B3C" stroke-width="1.5" opacity="0.9"/>',
'  <circle cx="250" cy="250" r="40" fill="url(#pgCenter)" filter="url(#pgCenterGlow)"/>',
'  <!-- 6 white lotus petals in center -->',
'  <g opacity="0.72">',
'    <g transform="translate(250,250) rotate(0)"><path d="M0,-37 C-6,-29 -6,-19 0,-15 C6,-19 6,-29 0,-37Z" fill="rgba(255,255,255,0.82)"/></g>',
'    <g transform="translate(250,250) rotate(60)"><path d="M0,-37 C-6,-29 -6,-19 0,-15 C6,-19 6,-29 0,-37Z" fill="rgba(255,255,255,0.82)"/></g>',
'    <g transform="translate(250,250) rotate(120)"><path d="M0,-37 C-6,-29 -6,-19 0,-15 C6,-19 6,-29 0,-37Z" fill="rgba(255,255,255,0.82)"/></g>',
'    <g transform="translate(250,250) rotate(180)"><path d="M0,-37 C-6,-29 -6,-19 0,-15 C6,-19 6,-29 0,-37Z" fill="rgba(255,255,255,0.82)"/></g>',
'    <g transform="translate(250,250) rotate(240)"><path d="M0,-37 C-6,-29 -6,-19 0,-15 C6,-19 6,-29 0,-37Z" fill="rgba(255,255,255,0.82)"/></g>',
'    <g transform="translate(250,250) rotate(300)"><path d="M0,-37 C-6,-29 -6,-19 0,-15 C6,-19 6,-29 0,-37Z" fill="rgba(255,255,255,0.82)"/></g>',
'  </g>',
'  <circle cx="250" cy="250" r="8" fill="rgba(255,255,255,0.96)"/>',
'  <circle cx="250" cy="250" r="4" fill="#C89B3C"/>',
'</svg>'
].join('\n');

// Find and replace the old SVG
const svgStart = c.indexOf('    <svg id="yogaLotus"');
const svgEnd = c.indexOf('    </svg>', svgStart) + '    </svg>'.length;

if (svgStart === -1) {
  console.error('ERROR: SVG start marker not found');
  process.exit(1);
}

c = c.slice(0, svgStart) + newSVG + c.slice(svgEnd);

// Add keyframes for mandala animations (inject before @keyframes crown-glow)
const kfLines = [
  '@keyframes pg-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }',
  '@keyframes pg-rev { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }',
  '@keyframes lotus-gentle { 0%,100%{transform:translateY(0px) scale(1)} 50%{transform:translateY(-12px) scale(1.02)} }',
  ''
].join('\n');

c = c.replace('@keyframes crown-glow', kfLines + '@keyframes crown-glow');

fs.writeFileSync('d:/ALKIMI/yoganteek/index.html', c, 'utf8');
console.log('Done. Hero: 2-col grid + elegant lotus mandala applied.');
