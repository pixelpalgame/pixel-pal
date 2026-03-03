// WORLD MAP SYSTEM
// ════════════════════════════════════════════════════════════

const WORLD_LOCS = [
  {
    id:'apartment',
    name:'THE GROVE APT',
    emoji:'🏠',
    desc:'Home sweet home. Where it all started.',
    badge:'HOME BASE',
    badgeColor:'#ffcc44',
    mx:420, my:240,
    color:'#ffcc44',
    scene:'main',
  },
  {
    id:'nightclub',
    name:'NEON BASEMENT',
    emoji:'🎵',
    desc:'Lose yourself in the music. Or find someone.',
    badge:'NIGHTLIFE',
    badgeColor:'#bb44ff',
    mx:720, my:310,
    color:'#bb44ff',
    scene:'main',
  },
  {
    id:'street',
    name:'DOWNTOWN STRIP',
    emoji:'🚶',
    desc:'Just walk. No destination needed.',
    badge:'EXPLORE',
    badgeColor:'#88aaff',
    mx:530, my:320,
    color:'#88aaff',
    scene:'main',
  },
  {
    id:'docks',
    name:'COASTAL DOCKS',
    emoji:'⚓',
    desc:'Salt air. Old boats. Stories in the fog.',
    badge:'FISHING',
    badgeColor:'#22bbcc',
    mx:240, my:370,
    color:'#22bbcc',
    scene:'docks',
  },
  {
    id:'library',
    name:'CITY LIBRARY',
    emoji:'📚',
    desc:'Quiet floors. Hidden knowledge. Good light.',
    badge:'INTELLECT',
    badgeColor:'#4488ff',
    mx:370, my:130,
    color:'#4488ff',
    scene:'main',
  },
  {
    id:'mines',
    name:'STONEPICK MINES',
    emoji:'⛏️',
    desc:'Dark tunnels, glinting ore. Every swing counts.',
    badge:'MINING',
    badgeColor:'#bb8833',
    mx:160, my:310,
    color:'#bb8833',
    scene:'main',
  },
  {
    id:'bazaar',
    name:'THE BAZAAR',
    emoji:'🏪',
    desc:'A bustling market of traders and odd deals.',
    badge:'TRADE',
    badgeColor:'#ff9922',
    mx:620, my:150,
    color:'#ff9922',
    scene:'main',
  },
  {
    id:'park',
    name:'GROVE PARK',
    emoji:'🌳',
    desc:'Trees, wild plants, fresh air. Gather wood and fiber.',
    badge:'PARK',
    badgeColor:'#44aa44',
    mx:840, my:190,
    color:'#44aa44',
    scene:'park',
  },
];

// Road/path connections between locations (pairs of ids)
const MAP_ROADS = [
  ['apartment','street'],
  ['apartment','library'],
  ['apartment','bazaar'],
  ['street','nightclub'],
  ['street','docks'],
  ['street','mines'],
  ['library','bazaar'],
  ['bazaar','nightclub'],
  ['bazaar','park'],
  ['mines','docks'],
  ['nightclub','park'],
];

let mapOpen = false;
let mapHover = null;
let mapSelected = null;
let mapFrame = 0;

function openMap() {
  mapOpen = true;
  document.getElementById('worldMapOverlay').classList.add('open');
  mapSelected = WORLD_LOCS.find(l => l.id === char.loc) || WORLD_LOCS[0];
  updateMapInfoBar(mapSelected);
  drawMap();
  requestAnimationFrame(animateMap);
}

function closeMap() {
  mapOpen = false;
  document.getElementById('worldMapOverlay').classList.remove('open');
}

function toggleMap() {
  mapOpen ? closeMap() : openMap();
}

// Draw the stylized pixel-art map background
function drawMapBackground(ctx) {
  const W = 940, H = 520;

  // Deep space-like BG with topographic grid
  const g = ctx.createRadialGradient(470, 260, 40, 470, 260, 550);
  g.addColorStop(0, '#0a1520');
  g.addColorStop(0.6, '#06101a');
  g.addColorStop(1, '#030810');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Grid lines (topo feel)
  ctx.strokeStyle = 'rgba(40,120,200,0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Terrain patches — hand-drawn pixel style biomes
  // Sea / water (bottom-left area)
  ctx.fillStyle = 'rgba(0,60,120,0.35)';
  ctx.beginPath();
  ctx.moveTo(0,350); ctx.lineTo(50,320); ctx.lineTo(130,340);
  ctx.lineTo(200,360); ctx.lineTo(280,410); ctx.lineTo(300,460);
  ctx.lineTo(0,480); ctx.closePath(); ctx.fill();

  // Water shimmer
  ctx.fillStyle = 'rgba(20,120,220,0.08)';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(20 + i*28, 380 + i*8, 60, 3);
  }

  // Wilderness / outskirts patch (top right) — scrubby yellowy green
  ctx.fillStyle = 'rgba(40,70,20,0.4)';
  ctx.beginPath();
  ctx.moveTo(750,60); ctx.lineTo(940,50); ctx.lineTo(940,250);
  ctx.lineTo(870,260); ctx.lineTo(790,220); ctx.lineTo(740,160); ctx.closePath(); ctx.fill();

  // Outskirts scrub/grass tufts
  ctx.fillStyle = 'rgba(120,180,40,0.35)';
  [[800,110],[850,140],[820,170],[870,100],[900,155],[780,80],[760,140],[910,200]].forEach(([x,y]) => {
    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI*2); ctx.fill();
  });
  // scattered rocks in outskirts
  ctx.fillStyle = 'rgba(100,90,70,0.4)';
  [[810,160],[860,125],[830,190],[875,170]].forEach(([x,y]) => {
    ctx.fillRect(x-5, y-4, 10, 8);
  });

  // City blocks (center/right)
  ctx.fillStyle = 'rgba(30,40,60,0.5)';
  [[370,170,80,50],[460,180,60,40],[540,240,50,40],[610,180,70,45],[680,240,60,50],
   [380,250,60,45],[460,270,50,40],[350,310,70,40],[430,310,50,35]].forEach(([x,y,w,h]) => {
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(60,100,180,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  });

  // ── MINES district (left-center) — dark rocky earth ──
  ctx.fillStyle = 'rgba(30,20,10,0.55)';
  ctx.fillRect(80, 250, 180, 140);
  ctx.strokeStyle = 'rgba(180,120,30,0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(80, 250, 180, 140);

  // Mine shaft entrance (dark rectangle)
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(130, 295, 50, 60);
  ctx.strokeStyle = 'rgba(150,100,30,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(130, 295, 50, 60);

  // Wooden mine frame (two verticals + top bar)
  ctx.strokeStyle = 'rgba(160,110,50,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(130,295); ctx.lineTo(130,355); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(180,295); ctx.lineTo(180,355); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(125,295); ctx.lineTo(185,295); ctx.stroke();

  // Ore glints in the mine area
  ctx.fillStyle = 'rgba(200,160,40,0.5)';
  [[100,270],[220,280],[95,310],[240,330],[110,350],[200,360]].forEach(([x,y]) => {
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
  });
  // Rocky rubble piles
  ctx.fillStyle = 'rgba(80,70,50,0.5)';
  [[195,340,25,12],[100,355,20,10],[220,355,18,8]].forEach(([x,y,w,h]) => {
    ctx.beginPath(); ctx.ellipse(x,y,w,h,0,0,Math.PI*2); ctx.fill();
  });

  // Dock/harbor area
  ctx.fillStyle = 'rgba(10,40,80,0.5)';
  ctx.fillRect(100, 310, 160, 100);

  // Dock piers (lines into water)
  ctx.strokeStyle = 'rgba(80,140,200,0.3)';
  ctx.lineWidth = 4;
  [[140,340],[175,355],[210,345]].forEach(([x,y]) => {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x-15, y+40); ctx.stroke();
  });

  // Roads — draw them on the BG
  ctx.strokeStyle = 'rgba(200,180,100,0.12)';
  ctx.lineWidth = 6;
  ctx.setLineDash([12, 8]);
  MAP_ROADS.forEach(([a, b]) => {
    const la = WORLD_LOCS.find(l => l.id === a);
    const lb = WORLD_LOCS.find(l => l.id === b);
    if (!la || !lb) return;
    // Adjust for header (38px) and footer (52px) strips → map drawing area = rows 38–468
    const ay = la.my, by = lb.my;
    ctx.beginPath();
    ctx.moveTo(la.mx, ay);
    ctx.bezierCurveTo(
      la.mx + (lb.mx - la.mx) * 0.35, ay,
      lb.mx - (lb.mx - la.mx) * 0.35, by,
      lb.mx, by
    );
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Compass rose (bottom right corner)
  const cx = 890, cy = 420, r = 28;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = 'rgba(80,160,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = 'rgba(80,160,255,0.6)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy-r-4);
  ctx.fillText('S', cx, cy+r+12);
  ctx.fillText('E', cx+r+8, cy+4);
  ctx.fillText('W', cx-r-8, cy+4);
  // Arrow
  ctx.fillStyle = '#aaddff';
  ctx.beginPath(); ctx.moveTo(cx, cy-r+6); ctx.lineTo(cx-4, cy+4); ctx.lineTo(cx+4, cy+4); ctx.closePath(); ctx.fill();
  ctx.restore();

  // Map title watermark
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.font = 'bold 80px monospace';
  ctx.fillStyle = '#aaccff';
  ctx.textAlign = 'center';
  ctx.fillText('PIXEL WORLD', 470, 290);
  ctx.restore();
}

function drawMap() {
  const cvs = document.getElementById('mapCanvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, 940, 520);

  drawMapBackground(ctx);

  const currentLoc = char.loc;
  const HEADER = 38, FOOTER = 52;
  const drawY = (my) => HEADER + my * ((520 - HEADER - FOOTER) / 520);

  WORLD_LOCS.forEach(loc => {
    const x = loc.mx;
    const y = HEADER + (loc.my * (520 - HEADER - FOOTER)) / 520;
    const isCurrent = loc.id === currentLoc;
    const isHover = mapHover === loc.id;
    const isSelected = mapSelected?.id === loc.id;

    // Outer glow ring
    if (isCurrent || isSelected) {
      ctx.save();
      ctx.globalAlpha = 0.22 + Math.sin(mapFrame * 0.06) * 0.1;
      ctx.fillStyle = loc.color;
      ctx.beginPath();
      ctx.arc(x, y, isCurrent ? 22 : 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Pin circle
    const dotR = isHover ? 11 : 8;
    ctx.save();
    ctx.shadowColor = loc.color;
    ctx.shadowBlur = isHover || isCurrent ? 20 : 8;
    ctx.fillStyle = isCurrent ? '#fff' : loc.color;
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Emoji label
    ctx.font = isHover ? '22px serif' : '17px serif';
    ctx.textAlign = 'center';
    ctx.fillText(loc.emoji, x, y - dotR - 4);

    // Name label
    ctx.save();
    ctx.font = isCurrent || isHover ? 'bold 9px monospace' : '8px monospace';
    ctx.fillStyle = isCurrent ? '#fff' : isHover ? loc.color : 'rgba(200,220,255,0.55)';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText(loc.name, x, y + dotR + 14);
    ctx.restore();

    // "YOU ARE HERE" indicator
    if (isCurrent) {
      ctx.save();
      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.7 + Math.sin(mapFrame * 0.1) * 0.3;
      ctx.fillText('YOU', x, y + dotR + 25);
      ctx.restore();
    }
  });

  mapFrame++;
}

function animateMap() {
  if (!mapOpen) return;
  drawMap();
  requestAnimationFrame(animateMap);
}

function updateMapInfoBar(loc) {
  if (!loc) return;
  document.getElementById('mapInfoEmoji').textContent = loc.emoji;
  document.getElementById('mapInfoName').textContent = loc.name;
  document.getElementById('mapInfoDesc').textContent = loc.desc;
  const btn = document.getElementById('mapTravelBtn');
  // Scene-based locations (mines, docks, street/downtown) are never "already here"
  // in the map sense — char.loc gets set to 'street' when leaving downtown but
  // the player should always be able to re-enter the scene from the map.
  const isScene = loc.id === 'mines' || loc.scene === 'docks' || loc.id === 'street';
  if (!isScene && loc.id === char.loc) {
    btn.textContent = '✓ ALREADY HERE';
    btn.classList.add('current');
    btn.onclick = null;
  } else {
    btn.textContent = '▶ TRAVEL HERE';
    btn.classList.remove('current');
    btn.onclick = () => { closeMap(); doWarpTravel(loc.id); };
  }
}

// Map click / hover handling on canvas
document.getElementById('mapCanvas').addEventListener('mousemove', e => {
  const rect = e.currentTarget.getBoundingClientRect();
  const scaleX = e.currentTarget.width / rect.width;
  const scaleY = e.currentTarget.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  const HEADER = 38, FOOTER = 52;
  let found = null;
  WORLD_LOCS.forEach(loc => {
    const px = loc.mx;
    const py = HEADER + (loc.my * (520 - HEADER - FOOTER)) / 520;
    const dist = Math.hypot(mx - px, my - py);
    if (dist < 20) found = loc.id;
  });
  if (found !== mapHover) {
    mapHover = found;
    if (found) {
      const loc = WORLD_LOCS.find(l => l.id === found);
      if (loc) updateMapInfoBar(loc);
    }
  }
});

document.getElementById('mapCanvas').addEventListener('click', e => {
  const rect = e.currentTarget.getBoundingClientRect();
  const scaleX = e.currentTarget.width / rect.width;
  const scaleY = e.currentTarget.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  const HEADER = 38, FOOTER = 52;
  WORLD_LOCS.forEach(loc => {
    const px = loc.mx;
    const py = HEADER + (loc.my * (520 - HEADER - FOOTER)) / 520;
    const dist = Math.hypot(mx - px, my - py);
    if (dist < 22) {
      mapSelected = loc;
      updateMapInfoBar(loc);
      const isScene = loc.id === 'mines' || loc.scene === 'docks' || loc.id === 'street';
      if (isScene || loc.id !== char.loc) {
        setTimeout(() => { closeMap(); doWarpTravel(loc.id); }, 200);
      }
    }
  });
});

// M key opens/closes map; locpill click also opens
document.addEventListener('keydown', e => {
  if (e.key === 'm' || e.key === 'M') {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
    toggleMap();
  }
});
document.getElementById('locpill').style.cursor = 'pointer';
document.getElementById('locpill').addEventListener('click', () => toggleMap());
document.getElementById('mapClose').addEventListener('click', () => closeMap());
document.getElementById('worldMapOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('worldMapOverlay')) closeMap();
});

// ════════════════════════════════════════════════════════════
// WARP TRAVEL ANIMATION
// ════════════════════════════════════════════════════════════
let warpActive = false;

function doWarpTravel(targetLocId) {
  if (warpActive) return;
  warpActive = true;
  const overlay = document.getElementById('warpOverlay');
  const cvs = document.getElementById('warpCanvas');
  const ctx = cvs.getContext('2d');
  overlay.style.pointerEvents = 'all';

  const loc = WORLD_LOCS.find(l => l.id === targetLocId);
  const color = loc?.color || '#44aaff';

  let phase = 0; // 0 = ramp-in (0→1), 1 = hold flash, 2 = ramp-out
  let t = 0;
  const stars = Array.from({length:80}, () => ({
    x: Math.random()*1100,
    y: Math.random()*580,
    speed: 2 + Math.random() * 12,
    len: 4 + Math.random() * 30,
    op: Math.random(),
  }));

  function warpFrame() {
    ctx.clearRect(0, 0, 1100, 580);
    t += 0.035;

    if (phase === 0) {
      // Warp in — vignette + tunnel lines + static
      const ease = t * t;
      overlay.style.opacity = Math.min(1, ease * 2).toString();

      // Tunnel lines from center
      ctx.save();
      stars.forEach(s => {
        const cx = 550, cy = 290;
        const dx = s.x - cx, dy = s.y - cy;
        const len = s.len * ease * 6;
        ctx.strokeStyle = `rgba(${hexToRgb(color)},${s.op * ease})`;
        ctx.lineWidth = 1 + ease * 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + dx * len * 0.02, s.y + dy * len * 0.02);
        ctx.stroke();
        s.x += dx * 0.06 * ease; s.y += dy * 0.06 * ease;
      });
      ctx.restore();

      // Vignette
      const gv = ctx.createRadialGradient(550, 290, 50, 550, 290, 600);
      gv.addColorStop(0, 'rgba(0,0,0,0)');
      gv.addColorStop(0.6, `rgba(0,0,0,${ease * 0.5})`);
      gv.addColorStop(1, `rgba(0,0,0,${ease * 0.9})`);
      ctx.fillStyle = gv;
      ctx.fillRect(0, 0, 1100, 580);

      // Chromatic aberration strips
      if (ease > 0.4) {
        ctx.save();
        ctx.globalAlpha = (ease - 0.4) * 0.6;
        ctx.fillStyle = `rgba(${hexToRgb(color)},0.25)`;
        ctx.fillRect(0, 0, 1100, 580);
        ctx.restore();
      }

      if (t >= 1.0) { phase = 1; t = 0; }

    } else if (phase === 1) {
      // White flash + destination name
      const flashAlpha = Math.sin(t * Math.PI);
      overlay.style.opacity = '1';
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.9})`;
      ctx.fillRect(0, 0, 1100, 580);

      // Destination label
      ctx.save();
      ctx.globalAlpha = flashAlpha;
      ctx.font = '800 14px "Press Start 2P", monospace';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText('TRAVELLING TO', 550, 268);
      ctx.font = '800 20px "Press Start 2P", monospace';
      ctx.fillText((loc?.name || targetLocId).toUpperCase(), 550, 300);
      ctx.font = '11px monospace';
      ctx.fillText(loc?.emoji + '  ' + (loc?.desc || ''), 550, 330);
      ctx.restore();

      if (t >= 1.0) {
        phase = 2; t = 0;
        // Actually travel here
        performTravel(targetLocId);
      }

    } else {
      // Ramp out — fade back to game
      const fadeOut = 1 - t;
      overlay.style.opacity = Math.max(0, fadeOut).toString();

      if (t >= 1.0) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        ctx.clearRect(0, 0, 1100, 580);
        warpActive = false;
        // Snap camX so char is never off-screen when the warp veil drops
        camX = Math.max(0, Math.min(WW - VW, char.wx - VW / 2));
        updateCamera();
        drawChar();
        return;
      }
    }

    requestAnimationFrame(warpFrame);
  }

  requestAnimationFrame(warpFrame);
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return '100,180,255';
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}

function performTravel(locId) {
  const loc = WORLD_LOCS.find(l => l.id === locId);
  if (!loc) return;

  // Safety: always ensure main world is visible before we try switching
  function ensureMainWorld() {
    document.getElementById('scroll').style.display = 'block';
    document.getElementById('char').style.display = 'block';
    if (typeof minesActive    !== 'undefined') minesActive    = false;
    document.getElementById('minesScene').style.display    = 'none';
    if (typeof docksActive    !== 'undefined') docksActive    = false;
    document.getElementById('scene2').style.display        = 'none';
    if (typeof downtownActive !== 'undefined') downtownActive = false;
    document.getElementById('downtownScene').style.display = 'none';
    if (typeof parkActive !== 'undefined') parkActive = false;
    document.getElementById('parkScene').style.display = 'none';
  }

  try {
    if (loc.scene === 'docks') {
      ensureMainWorld();
      enterDocksScene();
    } else if (loc.id === 'mines') {
      ensureMainWorld();
      enterMinesScene();
    } else if (loc.id === 'park') {
      ensureMainWorld();
      enterParkScene();
    } else if (loc.id === 'street') {
      ensureMainWorld();
      if (!craftingUnlocked) {
        // Haven't visited the mines yet — crafting bench not unlocked
        showSpeech("I should head to the mines first and get some gear before going downtown.", 6000);
        addLog('⛏ Visit the mines to unlock crafting first');
      } else if (!downtownAttempted) {
        // First downtown attempt with crafting unlocked — show tutorial popup
        downtownAttempted = true;
        showDowntownTutorial();
      } else if (!playerEquip.weapon || !playerEquip.offhand) {
        // Missing required gear
        const missing = [];
        if (!playerEquip.weapon)  missing.push('a weapon (⚔ Weapon slot)');
        if (!playerEquip.offhand) missing.push('a shield (🛡 Off Hand slot)');
        showSpeech(`I can't go in there without ${missing.join(' and ')}.`, 6000);
        addLog('⚔ Equip weapon + shield to enter Downtown');
      } else {
        enterDowntownScene();
      }
    } else {
      // Main-world travel
      ensureMainWorld();
      committedAction = null;
      decisionTimer = 5;
      char.asleep = false;

      // Map new locs to nearest real world position
      const LOC_WORLD_POS = {
        library:   760,   // near apartment
        bazaar:    1500,  // store area
        nightclub: 2350,  // nightclub
        street:    1950,  // street
      };

      if (LOCS[locId]) {
        // Snap camX so char doesn't appear off-screen after warp
        const spot = ACTIVITY_SPOTS[locId]?.idle || { x: LOCS[locId].x0 + 80 };
        char.wx = spot.x; char.tx = spot.x; char.moving = false;
        char.loc = locId;
        camX = Math.max(0, Math.min(WW - VW, char.wx - VW / 2));
        updateCamera();
        drawChar();
        // Now start AI-driven movement from this spot
        travelTo(locId, 'idle');
      } else {
        char.wx = LOC_WORLD_POS[locId] || 760;
        char.tx = char.wx;
        char.moving = false;
        char.loc = locId;
        camX = Math.max(0, Math.min(WW - VW, char.wx - VW / 2));
        updateCamera();
        drawChar();
        addLog(`🌍 arrived at ${loc.name}`);
      }
      setTimeout(async () => {
        const r = await callAI(`You just arrived at ${loc.name}. ${loc.desc} React in 1 sentence.`, true);
        if (r) showSpeech(r, 6000, true);
      }, 800);
    }
  } catch(err) {
    console.error('performTravel failed:', err);
    ensureMainWorld();
    char.wx = 760; char.tx = 760; char.loc = 'apartment';
    updateCamera();
  }
}

// ════════════════════════════════════════════════════════════
// COASTAL DOCKS — NEW SCENE
// ════════════════════════════════════════════════════════════
let docksActive = false;
let docksFrame = 0;
let docksCharX = 320;
let docksCharFacing = 1;
let docksAction = 'idle'; // idle | fish | walk
let docksCamX = 0;
const DOCKS_W = 1600; // wider than viewport
const DOCKS_FLOOR_Y = 480;

