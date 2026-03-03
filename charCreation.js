// ════════════════════════════════════════════════════════════
// CHARACTER CREATION + PLAYER INTRO
// Inserts between title screen and startGame()
// ════════════════════════════════════════════════════════════

var playerCharData = {
  type: 'male',       // 'male' | 'female' | 'alien'
  skin: '#e8b88a',    // skin tone
  hair: '#3a2010',    // hair color
};

const SKIN_TONES  = ['#f5c8a0', '#e8b88a', '#c8834a', '#7a4a2a'];
const HAIR_COLORS = ['#3a2010', '#8b6914', '#1a1a1a', '#cc5555', '#cccccc'];

// ── DRAW A MINI CHARACTER ────────────────────────────────────
// s = pixel scale factor; draws with bottom of feet at (cx, bottomY)
function _drawCCChar(ctx, cx, bottomY, type, skin, hair, s) {
  const body  = type === 'alien'  ? '#55bb66' : skin;
  const shirt = type === 'female' ? '#cc4488' : type === 'alien' ? '#5533aa' : '#4a6fa5';
  const pants = '#2a3a5a', shoe = '#2c2010';

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, bottomY, 8*s, 3*s, 0, 0, Math.PI*2);
  ctx.fill();

  const px = cx - 10*s;
  const py = bottomY - 42*s;

  // Legs
  ctx.fillStyle = pants;
  ctx.fillRect(px+3*s, py+30*s, 5*s, 9*s);
  ctx.fillRect(px+12*s, py+30*s, 5*s, 9*s);
  // Feet
  ctx.fillStyle = shoe;
  ctx.fillRect(px+2*s, py+38*s, 8*s, 3*s);
  ctx.fillRect(px+11*s, py+38*s, 8*s, 3*s);
  // Pants waist
  ctx.fillStyle = pants;
  ctx.fillRect(px+2*s, py+26*s, 16*s, 5*s);
  // Body / shirt
  ctx.fillStyle = shirt;
  ctx.fillRect(px+2*s, py+14*s, 16*s, 13*s);
  // Arms
  ctx.fillStyle = shirt;
  ctx.fillRect(px-2*s, py+14*s, 4*s, 10*s);
  ctx.fillRect(px+18*s, py+14*s, 4*s, 10*s);
  // Hands
  ctx.fillStyle = body;
  ctx.fillRect(px-2*s, py+24*s, 4*s, 4*s);
  ctx.fillRect(px+18*s, py+24*s, 4*s, 4*s);
  // Head
  ctx.fillStyle = body;
  ctx.fillRect(px+4*s, py+2*s, 12*s, 12*s);

  if (type === 'alien') {
    // Top of head (same green)
    ctx.fillStyle = '#55bb66';
    ctx.fillRect(px+4*s, py+2*s, 12*s, 4*s);
    // Antenna
    ctx.fillStyle = '#88ffcc';
    ctx.fillRect(px+9*s, py-3*s, 2*s, 6*s);
    ctx.fillRect(px+7*s, py-5*s, 6*s, 3*s);
    // Big oval eyes
    ctx.fillStyle = '#000022';
    ctx.fillRect(px+5*s, py+6*s, 4*s, 5*s);
    ctx.fillRect(px+11*s, py+6*s, 4*s, 5*s);
    // Eye shine
    ctx.fillStyle = '#88ccff';
    ctx.fillRect(px+6*s, py+7*s, 2*s, 2*s);
    ctx.fillRect(px+12*s, py+7*s, 2*s, 2*s);
    // Small mouth
    ctx.fillStyle = '#336644';
    ctx.fillRect(px+7*s, py+11*s, 6*s, 1*s);
  } else {
    // Hair — top and left side
    ctx.fillStyle = hair;
    ctx.fillRect(px+4*s, py+2*s, 12*s, 4*s);
    ctx.fillRect(px+4*s, py+2*s, 3*s, 9*s);
    if (type === 'female') {
      // Longer hair on both sides
      ctx.fillRect(px+13*s, py+2*s, 3*s, 14*s);
      ctx.fillRect(px+4*s,  py+2*s, 3*s, 14*s);
    }
    // Eyes
    ctx.fillStyle = '#2c1810';
    ctx.fillRect(px+6*s, py+8*s, 2*s, 2*s);
    ctx.fillRect(px+12*s, py+8*s, 2*s, 2*s);
    // Mouth
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(px+7*s, py+12*s, 6*s, 1*s);
    if (type === 'female') {
      ctx.fillStyle = '#cc3355';
      ctx.fillRect(px+8*s, py+12*s, 4*s, 1*s);
    }
  }
}

// ── SHOW CHARACTER CREATION SCREEN ──────────────────────────
function showCharCreation(onConfirm) {
  const el     = document.getElementById('charCreationScreen');
  const canvas = document.getElementById('ccCanvas');
  const ctx    = canvas.getContext('2d');
  el.style.display = 'flex';

  let rafId = null, frame = 0;
  let hitRegions = [];

  function resize() {
    const dw = el.clientWidth || 1100, dh = el.clientHeight || 580;
    if (canvas.width !== dw || canvas.height !== dh) {
      canvas.width = dw; canvas.height = dh;
    }
  }

  function draw() {
    frame++;
    resize();
    const W = canvas.width, H = canvas.height, cx = W/2;
    hitRegions = [];

    // Background
    ctx.fillStyle = '#030310';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(40,50,100,0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,20,0.13)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);

    // ── Title ────────────────────────────────────────────────
    ctx.save();
    ctx.shadowColor = '#4466ff';
    ctx.shadowBlur  = 14 + Math.sin(frame*0.04)*6;
    ctx.fillStyle   = '#ffffff';
    ctx.font        = 'bold 20px "Press Start 2P",monospace';
    ctx.textAlign   = 'center';
    ctx.fillText('WHO ARE YOU?', cx, 60);
    ctx.restore();

    // ── Type cards ───────────────────────────────────────────
    const TYPES  = ['male', 'female', 'alien'];
    const LABELS = ['MALE', 'FEMALE', 'ALIEN'];
    const cW = 148, cH = 188, cGap = 20;
    const cardsW = cW*3 + cGap*2;
    const cX0 = cx - cardsW/2;
    const cY  = 78;

    TYPES.forEach((type, i) => {
      const bx = cX0 + i*(cW+cGap), by = cY;
      const selected = playerCharData.type === type;

      // Card bg
      ctx.fillStyle = selected ? 'rgba(50,70,200,0.4)' : 'rgba(8,10,25,0.75)';
      ctx.fillRect(bx, by, cW, cH);
      // Card border
      ctx.strokeStyle = selected ? '#6688ff' : 'rgba(70,80,130,0.35)';
      ctx.lineWidth   = selected ? 2 : 1;
      ctx.strokeRect(bx, by, cW, cH);
      // Pulsing glow when selected
      if (selected) {
        ctx.strokeStyle = `rgba(100,140,255,${0.25+Math.sin(frame*0.06)*0.15})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, cW, cH);
      }

      // Mini character preview inside card
      const pSkin = type === 'alien' ? '#55bb66' : playerCharData.skin;
      const pHair = type === 'alien' ? '#55bb66' : playerCharData.hair;
      _drawCCChar(ctx, bx+cW/2, by+cH-16, type, pSkin, pHair, 1.7);

      // Type label
      ctx.fillStyle  = selected ? '#aabbff' : 'rgba(150,170,215,0.5)';
      ctx.font       = 'bold 8px "Press Start 2P",monospace';
      ctx.textAlign  = 'center';
      ctx.fillText(LABELS[i], bx+cW/2, by+cH-3);

      // Selected tag
      if (selected) {
        ctx.fillStyle = '#6688ff';
        ctx.font = '7px monospace';
        ctx.fillText('▲ SELECTED', bx+cW/2, by+cH+14);
      }

      hitRegions.push({ x:bx, y:by, w:cW, h:cH, action:()=>{ playerCharData.type = type; } });
    });

    // ── Customisation rows (hidden for alien) ─────────────────
    if (playerCharData.type !== 'alien') {
      const swSize = 24, swGap = 9;
      const swX0   = cX0;

      // Skin row
      const skinY = cY + cH + 26;
      ctx.fillStyle = 'rgba(170,190,250,0.5)';
      ctx.font      = '7px "Press Start 2P",monospace';
      ctx.textAlign = 'right';
      ctx.fillText('SKIN', swX0 - 10, skinY + swSize/2 + 4);

      SKIN_TONES.forEach((col, i) => {
        const sx = swX0 + i*(swSize+swGap), sy = skinY;
        const sel = playerCharData.skin === col;
        ctx.fillStyle   = col; ctx.fillRect(sx, sy, swSize, swSize);
        ctx.strokeStyle = sel ? '#ffffff' : 'rgba(110,130,185,0.35)';
        ctx.lineWidth   = sel ? 2.5 : 1;
        ctx.strokeRect(sx, sy, swSize, swSize);
        if (sel) {
          ctx.fillStyle  = '#fff';
          ctx.font       = 'bold 13px monospace';
          ctx.textAlign  = 'center';
          ctx.fillText('✓', sx+swSize/2, sy+17);
        }
        hitRegions.push({ x:sx, y:sy, w:swSize, h:swSize, action:()=>{ playerCharData.skin = col; } });
      });

      // Hair row
      const hairY = skinY + swSize + 14;
      ctx.fillStyle = 'rgba(170,190,250,0.5)';
      ctx.font      = '7px "Press Start 2P",monospace';
      ctx.textAlign = 'right';
      ctx.fillText('HAIR', swX0 - 10, hairY + swSize/2 + 4);

      HAIR_COLORS.forEach((col, i) => {
        const sx = swX0 + i*(swSize+swGap), sy = hairY;
        const sel = playerCharData.hair === col;
        ctx.fillStyle   = col; ctx.fillRect(sx, sy, swSize, swSize);
        ctx.strokeStyle = sel ? '#ffffff' : 'rgba(110,130,185,0.35)';
        ctx.lineWidth   = sel ? 2.5 : 1;
        ctx.strokeRect(sx, sy, swSize, swSize);
        if (sel) {
          ctx.fillStyle  = '#fff';
          ctx.font       = 'bold 13px monospace';
          ctx.textAlign  = 'center';
          ctx.fillText('✓', sx+swSize/2, sy+17);
        }
        hitRegions.push({ x:sx, y:sy, w:swSize, h:swSize, action:()=>{ playerCharData.hair = col; } });
      });
    }

    // ── Large preview (right of cards) ────────────────────────
    const pvX = cX0 + cardsW + 110;
    const pvY = H - 90;
    _drawCCChar(ctx, pvX, pvY, playerCharData.type, playerCharData.skin, playerCharData.hair, 3.2);
    ctx.fillStyle = 'rgba(130,155,220,0.38)';
    ctx.font      = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PREVIEW', pvX, pvY + 16);

    // Preview panel border
    const pvPad = 24;
    const pvBoxW = 3.2*20*2 + pvPad*2, pvBoxH = 3.2*42 + pvPad*2 + 30;
    ctx.strokeStyle = 'rgba(60,80,160,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pvX - pvBoxW/2, pvY - pvBoxH + pvPad, pvBoxW, pvBoxH);

    // ── Begin button ──────────────────────────────────────────
    const bW = 268, bH = 48, bX = cx-bW/2, bY = H - 72;
    ctx.fillStyle = 'rgba(10,10,28,0.9)';
    ctx.fillRect(bX+3, bY+3, bW, bH);
    ctx.fillStyle = 'rgba(10,10,28,0.92)';
    ctx.fillRect(bX, bY, bW, bH);
    ctx.strokeStyle = '#44dd88';
    ctx.lineWidth   = 2;
    ctx.strokeRect(bX, bY, bW, bH);
    ctx.fillStyle   = '#44dd88';
    ctx.font        = 'bold 11px "Press Start 2P",monospace';
    ctx.textAlign   = 'center';
    ctx.fillText('BEGIN YOUR STORY', cx, bY+bH/2+5);

    hitRegions.push({
      x: bX, y: bY, w: bW, h: bH,
      action: () => {
        cancelAnimationFrame(rafId);
        canvas.removeEventListener('click', onClick);
        el.style.transition = 'opacity 0.4s';
        el.style.opacity    = '0';
        setTimeout(() => {
          el.style.display  = 'none';
          el.style.opacity  = '1';
          showPlayerIntro(onConfirm);
        }, 400);
      }
    });

    // Hint
    ctx.fillStyle = 'rgba(80,90,135,0.4)';
    ctx.font      = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('click to select · click BEGIN to start', cx, H-12);

    rafId = requestAnimationFrame(draw);
  }

  function onClick(ev) {
    const rect  = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (ev.clientX - rect.left) * scaleX;
    const my = (ev.clientY - rect.top)  * scaleY;
    for (const r of hitRegions) {
      if (mx >= r.x && mx <= r.x+r.w && my >= r.y && my <= r.y+r.h) {
        r.action();
        break;
      }
    }
  }

  canvas.addEventListener('click', onClick);
  draw();
}

// ── SHOW PLAYER INTRO SCREEN ─────────────────────────────────
function showPlayerIntro(onDone) {
  const el     = document.getElementById('playerIntroScreen');
  const canvas = document.getElementById('introCanvas');
  const ctx    = canvas.getContext('2d');
  el.style.display = 'flex';

  const typeGreets = {
    male:   'A new day dawns in PIXEL CITY...',
    female: 'A new day dawns in PIXEL CITY...',
    alien:  'Signal received. PIXEL CITY located...',
  };

  const LINES = [
    { t: typeGreets[playerCharData.type] || typeGreets.male,                   d: 0   },
    { t: 'You just moved into a small apartment',                              d: 55  },
    { t: 'on the STRIP.',                                                      d: 85  },
    { t: '',                                                                   d: 110 },
    { t: 'Your bank account is nearly empty.',                                 d: 130 },
    { t: '',                                                                   d: 165 },
    { t: 'But this city holds opportunity —',                                  d: 185 },
    { t: 'for those willing to hustle.',                                       d: 228 },
    { t: '',                                                                   d: 260 },
    { t: 'Your story begins... now.',                                          d: 285 },
  ];

  let frame = 0, rafId = null, done = false;

  function finish() {
    if (done) return;
    done = true;
    cancelAnimationFrame(rafId);
    canvas.removeEventListener('click', finish);
    document.removeEventListener('keydown', onKey);
    el.style.transition = 'opacity 0.6s';
    el.style.opacity    = '0';
    setTimeout(() => {
      el.style.display = 'none';
      el.style.opacity = '1';
      onDone();
    }, 600);
  }

  function onKey(e) {
    if (e.code === 'Space' || e.code === 'Enter') finish();
  }

  canvas.addEventListener('click', finish);
  document.addEventListener('keydown', onKey);

  function draw() {
    frame++;
    canvas.width  = el.clientWidth  || 1100;
    canvas.height = el.clientHeight || 580;
    const W = canvas.width, H = canvas.height, cx = W/2;

    // Dark background
    ctx.fillStyle = '#000008';
    ctx.fillRect(0, 0, W, H);

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,20,0.2)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);

    // Tiny character silhouette at bottom-right corner
    const charType = playerCharData.type;
    const charSkin = playerCharData.skin;
    const charHair = playerCharData.hair;
    ctx.globalAlpha = 0.18 + Math.sin(frame*0.02)*0.05;
    _drawCCChar(ctx, W - 60, H - 30, charType, charSkin, charHair, 2.2);
    ctx.globalAlpha = 1;

    // Text lines
    const visLines = LINES.filter(l => l.t);
    const blockH   = visLines.length * 36;
    const startY   = H/2 - blockH/2;
    const lastLine = LINES[LINES.length - 1];
    let vIdx = 0;

    LINES.forEach(line => {
      if (!line.t) return;
      if (frame < line.d) { vIdx++; return; }
      const progress = Math.min(1, (frame - line.d) / 35);
      const isLast   = line === lastLine;

      ctx.globalAlpha = progress;
      ctx.fillStyle   = isLast ? '#44ffaa' : '#ccddf5';
      ctx.font        = isLast
        ? 'bold 13px "Press Start 2P",monospace'
        : '11px "Press Start 2P",monospace';
      ctx.textAlign   = 'center';
      if (isLast) { ctx.shadowColor = '#44ffaa'; ctx.shadowBlur = 18 + Math.sin(frame*0.05)*8; }
      ctx.fillText(line.t, cx, startY + vIdx*36);
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
      vIdx++;
    });

    // Continue prompt — appears after all lines shown
    if (frame > lastLine.d + 55) {
      ctx.globalAlpha = (Math.sin(frame*0.06)+1) * 0.45;
      ctx.fillStyle   = 'rgba(140,160,215,0.9)';
      ctx.font        = '8px monospace';
      ctx.textAlign   = 'center';
      ctx.fillText('[ click or press SPACE to begin ]', cx, H - 28);
      ctx.globalAlpha = 1;
      // Auto-proceed after a long pause
      if (frame > lastLine.d + 450) finish();
    }

    rafId = requestAnimationFrame(draw);
  }

  draw();
}
