// ════════════════════════════════════════════════════════════
// PIXEL PAL — Title / Home Screen  (3-slot version)
// ════════════════════════════════════════════════════════════

(function () {
  const el     = document.getElementById('titleScreen');
  const canvas = document.getElementById('titleCanvas');
  const ctx    = canvas.getContext('2d');
  let titleFrame = 0;
  let rafId      = null;

  // ── HOMESCREEN MUSIC ──────────────────────────────────────
  const homeBgm = new Audio('game music/HOMESCREEN.mp3');
  homeBgm.loop   = true;
  homeBgm.volume = 0.45;
  // Start on first user interaction to satisfy browser autoplay policy
  let bgmStarted = false;
  function startBgm() {
    if (bgmStarted) return;
    bgmStarted = true;
    homeBgm.play().catch(() => {});
  }
  document.addEventListener('click',   startBgm, { once: true });
  document.addEventListener('keydown', startBgm, { once: true });

  // ── READ ALL 3 SLOTS ──────────────────────────────────────
  function peekSlot(n) {
    try {
      const json = localStorage.getItem(`pixel_save_slot${n}`);
      return json ? JSON.parse(json) : null;
    } catch(e) { return null; }
  }

  let saves = [peekSlot(1), peekSlot(2), peekSlot(3)];

  // ── INTERACTION STATE ─────────────────────────────────────
  let selectedSlot = 0;   // 1-3 = slot picked, 0 = no selection
  let confirmMode  = null; // { slot, action: 'newgame'|'delete' }

  // ── PARTICLES ─────────────────────────────────────────────
  const particles = Array.from({ length: 55 }, () => ({
    x: Math.random() * 1200,
    y: Math.random() * 620,
    vy: -(0.25 + Math.random() * 0.6),
    size: 1 + Math.random() * 2,
    alpha: Math.random(),
    hue: [220, 260, 180, 40][Math.floor(Math.random() * 4)],
  }));

  // ── DRAW CHARACTER (uses _drawCCChar from charCreation.js) ─
  function drawSlotChar(cx, cy, save) {
    const cd   = save?.charData;
    const type = cd?.type || 'male';
    const skin = cd?.skin || '#e8b88a';
    const hair = cd?.hair || '#3a2010';
    if (typeof _drawCCChar === 'function') {
      _drawCCChar(ctx, cx, cy, type, skin, hair, 2.0);
    }
  }

  // ── DRAW A SLOT CARD ──────────────────────────────────────
  function drawCard(slotNum, bx, by, cW, cH, save, selected) {
    const cx = bx + cW/2;
    const isEmpty = !save;

    // Card background
    ctx.fillStyle = selected
      ? 'rgba(40,60,180,0.45)'
      : isEmpty ? 'rgba(8,10,25,0.6)' : 'rgba(10,14,35,0.8)';
    ctx.fillRect(bx, by, cW, cH);

    // Border
    ctx.strokeStyle = selected
      ? '#5577ff'
      : isEmpty ? 'rgba(60,70,120,0.3)' : 'rgba(80,100,180,0.45)';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(bx, by, cW, cH);

    // Pulsing glow when selected
    if (selected) {
      ctx.strokeStyle = `rgba(100,140,255,${0.2 + Math.sin(titleFrame*0.07)*0.12})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, cW, cH);
    }

    // Slot label
    ctx.fillStyle = selected ? '#aabbff' : 'rgba(120,140,200,0.5)';
    ctx.font      = '7px "Press Start 2P",monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SLOT ${slotNum}`, bx+10, by+16);

    if (isEmpty) {
      // Empty slot — big + sign
      ctx.fillStyle = selected ? 'rgba(150,180,255,0.55)' : 'rgba(80,100,160,0.35)';
      ctx.font      = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('+', cx, by + cH/2 + 10);

      ctx.fillStyle = 'rgba(100,120,180,0.4)';
      ctx.font      = '7px "Press Start 2P",monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EMPTY', cx, by + cH - 22);
      ctx.fillText('click to begin', cx, by + cH - 10);
    } else {
      // Draw character art
      drawSlotChar(cx, by + cH - 28, save);

      // Stats overlay — top right area
      const tx = bx + 10, ty = by + 28;
      const totalLevel = Object.values(save.skills || {}).reduce((a,s) => a + (s.level || 1), 0);
      const money      = save.money || 0;
      const day        = save.gt?.d ?? 0;
      const ago        = save.ts ? Math.round((Date.now() - save.ts) / 60000) : 0;
      const agoStr     = ago < 60 ? `${ago}m ago` : `${Math.floor(ago/60)}h ago`;
      const cd         = save.charData;
      const typeLabel  = cd?.type ? cd.type.toUpperCase() : 'CHARACTER';

      ctx.textAlign = 'left';

      ctx.fillStyle = '#e8e0d0';
      ctx.font      = 'bold 8px "Press Start 2P",monospace';
      ctx.fillText(typeLabel, tx, ty);

      ctx.fillStyle = 'rgba(170,185,255,0.5)';
      ctx.font      = '7px monospace';
      ctx.fillText(`Day ${day}  ·  ${agoStr}`, tx, ty + 14);

      ctx.fillStyle = '#ffd700';
      ctx.font      = 'bold 7px monospace';
      ctx.fillText(`$${money}`, tx, ty + 26);

      ctx.fillStyle = 'rgba(200,215,255,0.6)';
      ctx.font      = '7px monospace';
      ctx.fillText(`Total Lv ${totalLevel}`, tx, ty + 38);

      // Top 2 skills
      const topSkills = Object.entries(save.skills || {})
        .sort((a,b) => b[1].level - a[1].level).slice(0, 2);
      topSkills.forEach(([name, sk], i) => {
        ctx.fillStyle = 'rgba(180,200,255,0.5)';
        ctx.font      = '7px monospace';
        ctx.fillText(`· ${name} ${sk.level}`, tx, ty + 52 + i*12);
      });
    }
  }

  // ── MAIN DRAW LOOP ────────────────────────────────────────
  function draw() {
    titleFrame++;
    const dw = el.clientWidth || 1100, dh = el.clientHeight || 580;
    if (canvas.width !== dw || canvas.height !== dh) {
      canvas.width = dw; canvas.height = dh;
    }
    const W = canvas.width, H = canvas.height, cx = W/2;

    // Background
    ctx.fillStyle = '#040410';
    ctx.fillRect(0, 0, W, H);

    // City silhouette
    ctx.fillStyle = '#07071c';
    const buildings = [[0,180],[120,220],[200,160],[310,200],[420,240],[520,180],
      [600,210],[700,170],[790,230],[880,190],[970,220],[1060,175],[1100,200]];
    ctx.beginPath(); ctx.moveTo(0, H);
    buildings.forEach(([bx, bh]) => {
      ctx.lineTo(bx, H-bh); ctx.lineTo(bx+90, H-bh);
    });
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

    // Window dots
    ctx.fillStyle = 'rgba(255,220,120,0.1)';
    for (let i = 0; i < 70; i++) {
      const wx = (i*137) % W, wy = H - 20 - ((i*53) % 200);
      if (Math.floor(wy/20) % 3 !== 0) ctx.fillRect(wx, wy, 4, 6);
    }

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,30,0.16)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);

    // Particles
    particles.forEach(p => {
      p.y += p.vy;
      if (p.y < -4) { p.y = H+4; p.x = Math.random()*W; }
      p.alpha = Math.min(1, p.alpha+0.005);
      ctx.globalAlpha = p.alpha * (0.4+Math.sin(titleFrame*0.03+p.x)*0.3);
      ctx.fillStyle = `hsl(${p.hue},80%,70%)`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // ── Logo ─────────────────────────────────────────────────
    const logoY = Math.round(H * 0.16);
    ctx.save();
    ctx.shadowColor = '#4466ff';
    ctx.shadowBlur  = 24 + Math.sin(titleFrame*0.04)*10;
    ctx.fillStyle   = '#ffffff';
    ctx.font        = 'bold 48px "Press Start 2P",monospace';
    ctx.textAlign   = 'center';
    ctx.fillText('PIXEL PAL', cx, logoY);
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = 'rgba(140,160,255,0.45)';
    ctx.font        = '9px "Press Start 2P",monospace';
    ctx.fillText('a life sim · choose your save slot', cx, logoY+26);
    ctx.restore();

    // ── Slot Cards ───────────────────────────────────────────
    const cW = 248, cH = 220, cGap = 18;
    const cardsW = cW*3 + cGap*2;
    const cX0 = cx - cardsW/2;
    const cY  = logoY + 50;

    for (let i = 0; i < 3; i++) {
      const slotNum = i + 1;
      drawCard(slotNum, cX0 + i*(cW+cGap), cY, cW, cH, saves[i], selectedSlot === slotNum);
    }

    // ── Action buttons (shown when a slot is selected with a save) ─
    if (selectedSlot > 0 && saves[selectedSlot-1] && !confirmMode) {
      const btnY   = cY + cH + 22;
      const btns   = [
        { label:'CONTINUE',   color:'#44dd88', x: cx-290, w:160 },
        { label:'NEW GAME',   color:'#88aaff', x: cx-110, w:160 },
        { label:'DELETE',     color:'#ff5555', x: cx+70,  w:160 },
      ];
      const bh = 42;

      btns.forEach(b => {
        ctx.fillStyle = 'rgba(10,10,28,0.9)';
        ctx.fillRect(b.x+3, btnY+3, b.w, bh);
        ctx.fillStyle = 'rgba(10,10,28,0.92)';
        ctx.fillRect(b.x, btnY, b.w, bh);
        ctx.strokeStyle = b.color; ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x, btnY, b.w, bh);
        ctx.fillStyle = b.color;
        ctx.font      = 'bold 9px "Press Start 2P",monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.label, b.x + b.w/2, btnY + bh/2 + 4);
      });
    }

    // ── Confirm dialog ────────────────────────────────────────
    if (confirmMode) {
      const isDelete = confirmMode.action === 'delete';
      const msg = isDelete
        ? `DELETE Slot ${confirmMode.slot} forever?`
        : `Start NEW GAME in Slot ${confirmMode.slot}?\n(save will be lost)`;

      ctx.fillStyle = 'rgba(8,8,24,0.96)';
      ctx.fillRect(cx-210, H/2-20, 420, 140);
      ctx.strokeStyle = isDelete ? '#ff5555' : '#88aaff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx-210, H/2-20, 420, 140);

      ctx.fillStyle = '#fff';
      ctx.font = '9px "Press Start 2P",monospace';
      ctx.textAlign = 'center';
      msg.split('\n').forEach((line, i) => ctx.fillText(line, cx, H/2+14+i*20));

      // YES
      ctx.fillStyle = 'rgba(10,10,28,0.9)';
      ctx.fillRect(cx-170, H/2+68, 130, 36);
      ctx.strokeStyle='#ff5555'; ctx.lineWidth=1.5; ctx.strokeRect(cx-170, H/2+68, 130, 36);
      ctx.fillStyle='#ff5555'; ctx.font='bold 10px "Press Start 2P",monospace';
      ctx.fillText('YES', cx-105, H/2+92);

      // CANCEL
      ctx.fillStyle = 'rgba(10,10,28,0.9)';
      ctx.fillRect(cx+40, H/2+68, 130, 36);
      ctx.strokeStyle='#aaaacc'; ctx.lineWidth=1.5; ctx.strokeRect(cx+40, H/2+68, 130, 36);
      ctx.fillStyle='#aaaacc'; ctx.font='bold 10px "Press Start 2P",monospace';
      ctx.fillText('CANCEL', cx+105, H/2+92);
    }

    // Hint
    ctx.fillStyle = 'rgba(90,100,140,0.35)';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('click a slot to select · click again to open actions', cx, H-12);

    rafId = requestAnimationFrame(draw);
  }

  // ── CLICK HANDLER ────────────────────────────────────────
  canvas.addEventListener('click', ev => {
    const rect  = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (ev.clientX - rect.left) * scaleX;
    const my = (ev.clientY - rect.top)  * scaleY;
    const W  = canvas.width, H = canvas.height, cx = W/2;

    // ── Confirm dialog clicks ────────────────────────────────
    if (confirmMode) {
      const slot = confirmMode.slot;
      // YES
      if (mx >= cx-170 && mx <= cx-40 && my >= H/2+68 && my <= H/2+104) {
        if (confirmMode.action === 'delete') {
          localStorage.removeItem(`pixel_save_slot${slot}`);
          localStorage.removeItem(`pixel_backup_slot${slot}`);
          saves[slot-1] = null;
          confirmMode   = null;
          selectedSlot  = 0;
        } else if (confirmMode.action === 'newgame') {
          localStorage.removeItem(`pixel_save_slot${slot}`);
          localStorage.removeItem(`pixel_backup_slot${slot}`);
          saves[slot-1] = null;
          confirmMode   = null;
          currentSlot   = slot;
          launchGame(false);
        }
        return;
      }
      // CANCEL
      if (mx >= cx+40 && mx <= cx+170 && my >= H/2+68 && my <= H/2+104) {
        confirmMode = null;
      }
      return;
    }

    // ── Action buttons (slot selected with save) ─────────────
    const logoY  = Math.round(H * 0.16);
    const cY     = logoY + 50;
    const cH     = 220;
    const btnY   = cY + cH + 22;
    const bh     = 42;

    if (selectedSlot > 0 && saves[selectedSlot-1]) {
      const btns = [
        { label:'CONTINUE', x:cx-290, w:160, action:'continue' },
        { label:'NEW GAME', x:cx-110, w:160, action:'newgame'  },
        { label:'DELETE',   x:cx+70,  w:160, action:'delete'   },
      ];
      for (const b of btns) {
        if (mx >= b.x && mx <= b.x+b.w && my >= btnY && my <= btnY+bh) {
          if (b.action === 'continue') {
            currentSlot = selectedSlot;
            launchGame(true);
          } else if (b.action === 'newgame') {
            confirmMode = { slot: selectedSlot, action: 'newgame' };
          } else if (b.action === 'delete') {
            confirmMode = { slot: selectedSlot, action: 'delete' };
          }
          return;
        }
      }
    }

    // ── Slot card clicks ─────────────────────────────────────
    const cW   = 248, cGap = 18, cardsW = cW*3 + cGap*2;
    const cX0  = cx - cardsW/2;

    for (let i = 0; i < 3; i++) {
      const slotNum = i + 1;
      const bx = cX0 + i*(cW+cGap);
      if (mx >= bx && mx <= bx+cW && my >= cY && my <= cY+cH) {
        if (!saves[i]) {
          // Empty slot — go straight to char creation
          currentSlot = slotNum;
          launchGame(false);
        } else if (selectedSlot === slotNum) {
          // Second click on selected slot → continue directly
          currentSlot = slotNum;
          launchGame(true);
        } else {
          // First click → select the slot
          selectedSlot = slotNum;
        }
        return;
      }
    }

    // Click outside cards/buttons → deselect
    selectedSlot = 0;
  });

  // ── LAUNCH ───────────────────────────────────────────────────
  // Exposed globally so startGame() can fade it out at the right moment
  window.stopHomeBgm = function() {
    (function fadeOut() {
      if (homeBgm.volume > 0.03) {
        homeBgm.volume = Math.max(0, homeBgm.volume - 0.03);
        setTimeout(fadeOut, 40);
      } else {
        homeBgm.pause();
        homeBgm.currentTime = 0;
      }
    })();
  };

  function launchGame(fromSave) {
    cancelAnimationFrame(rafId);
    // Block game BGM immediately for new games — covers char creation + intro + tutorial
    if (!fromSave) window.tutorialActive = true;
    el.style.transition = 'opacity 0.5s';
    el.style.opacity    = '0';
    setTimeout(() => {
      el.style.display = 'none';
      if (!fromSave && typeof showCharCreation === 'function') {
        // New game — character creation + intro before starting
        showCharCreation(() => startGame(false));
      } else {
        startGame(fromSave);
      }
    }, 500);
  }

  draw();
})();
