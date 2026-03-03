let docksLoopRunning = false;
function enterDocksScene() {
  try {
  docksActive = true;
  docksCharX = 320;
  docksFrame = 0;
  docksCamX = 0;
  docksAction = 'idle';
  docksKeyLeft = false;
  docksKeyRight = false;
  char.loc = 'docks';
  char.action = 'idle';

  // Show scene2, hide main scroll
  document.getElementById('scene2').style.display = 'block';
  document.getElementById('scroll').style.display = 'none';
  document.getElementById('char').style.display = 'none';
  updateHUD();
  addLog('⚓ arrived at Coastal Docks');

  setTimeout(async () => {
    const r = await callAI('You just arrived at the Coastal Docks — smell of salt water, creaking boats, foggy morning. React in 1 sentence.', true);
    if (r) showSpeech(r, 7000, true);
  }, 800);

  if (!docksLoopRunning) requestAnimationFrame(docksLoop);
  } catch(err) {
    console.error('enterDocksScene failed:', err);
    leaveDocksScene();
  }
}

function leaveDocksScene() {
  docksActive = false;
  document.getElementById('scene2').style.display = 'none';
  document.getElementById('scroll').style.display = 'block';
  document.getElementById('char').style.display = 'block';
  char.action = 'idle';
  char.moving = false;
  char.loc = 'street';
  char.wx = 1950; char.tx = 1950; // street world x
  updateCamera(); // reposition char div immediately so it's not invisible
  addLog('🚶 left the docks');
}

function drawDocksScene() {
  const cvs = document.getElementById('scene2Canvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const W = 1100, H = 580;
  const f = docksFrame;
  const cam = docksCamX;

  ctx.clearRect(0, 0, W, H);

  // ── SKY ──────────────────────────────────────────────────
  const h = gt.h;
  const isNight = h < 6 || h >= 21;
  const isDusk = h >= 18 && h < 21;
  const isDawn = h >= 5 && h < 8;

  let skyG = ctx.createLinearGradient(0, 0, 0, 280);
  if (isNight) {
    skyG.addColorStop(0, '#020815'); skyG.addColorStop(1, '#040c1e');
  } else if (isDusk) {
    skyG.addColorStop(0, '#200830'); skyG.addColorStop(0.5, '#801828'); skyG.addColorStop(1, '#c04818');
  } else if (isDawn) {
    skyG.addColorStop(0, '#0a1830'); skyG.addColorStop(0.5, '#402060'); skyG.addColorStop(1, '#c07040');
  } else {
    skyG.addColorStop(0, '#2a5888'); skyG.addColorStop(1, '#7aaabb');
  }
  ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, 300);

  // Stars / moon (night)
  if (isNight || isDusk) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    [[60,40],[200,70],[380,30],[520,60],[700,25],[850,55],[1000,40],[140,100],[450,85],[780,90]].forEach(([sx,sy]) => {
      ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, Math.PI*2); ctx.fill();
    });
    // Moon
    ctx.fillStyle = '#ffffdd'; ctx.beginPath(); ctx.arc(900, 70, 26, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = isNight ? '#020815' : '#200830';
    ctx.beginPath(); ctx.arc(915, 62, 22, 0, Math.PI*2); ctx.fill();
  } else {
    // Sun
    ctx.save();
    ctx.shadowColor = '#ffdd88'; ctx.shadowBlur = 40;
    ctx.fillStyle = 'rgba(255,220,100,0.9)';
    ctx.beginPath(); ctx.arc(880, 90, 32, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // Fog layer near horizon
  const fogG = ctx.createLinearGradient(0, 250, 0, 310);
  fogG.addColorStop(0, 'rgba(180,200,220,0)');
  fogG.addColorStop(0.5, 'rgba(180,200,220,0.18)');
  fogG.addColorStop(1, 'rgba(180,200,220,0)');
  ctx.fillStyle = fogG; ctx.fillRect(0, 250, W, 60);

  // Distant city skyline silhouette
  ctx.fillStyle = 'rgba(20,30,50,0.7)';
  const buildings = [[0,50,60],[80,80,40],[140,45,70],[230,60,55],[300,90,45],[360,55,65],[440,75,50],[500,42,80],[590,65,60],[660,50,70],[740,80,45],[800,60,55],[870,40,75],[950,70,60],[1020,55,80]];
  buildings.forEach(([bx, bh, bw]) => {
    ctx.fillRect(bx - cam * 0.08, 240 - bh, bw, bh + 20);
    // windows
    ctx.fillStyle = isNight ? 'rgba(255,220,120,0.6)' : 'rgba(180,200,255,0.2)';
    for (let wx = bx - cam * 0.08 + 5; wx < bx - cam * 0.08 + bw - 5; wx += 10) {
      for (let wy = 245 - bh; wy < 255; wy += 10) {
        if (Math.random() < 0.7) ctx.fillRect(wx, wy, 4, 5);
      }
    }
    ctx.fillStyle = 'rgba(20,30,50,0.7)';
  });

  // ── WATER ─────────────────────────────────────────────────
  const waterG = ctx.createLinearGradient(0, 295, 0, 460);
  if (isNight) {
    waterG.addColorStop(0, '#0a1830'); waterG.addColorStop(1, '#060e20');
  } else if (isDusk) {
    waterG.addColorStop(0, '#602018'); waterG.addColorStop(1, '#2a1008');
  } else {
    waterG.addColorStop(0, '#1a5070'); waterG.addColorStop(1, '#0e2840');
  }
  ctx.fillStyle = waterG; ctx.fillRect(0, 295, W, 165);

  // Water ripples / reflections
  ctx.save();
  for (let i = 0; i < 18; i++) {
    const wx = ((i * 70 - cam * 0.6 + f * 0.4) % (W + 100)) - 50;
    const wy = 320 + (i % 4) * 22 + Math.sin(f * 0.03 + i) * 3;
    ctx.strokeStyle = `rgba(120,180,220,${0.05 + (i%3)*0.04})`;
    ctx.lineWidth = 1 + (i % 2);
    ctx.beginPath();
    ctx.ellipse(wx, wy, 30 + i * 3, 4, 0, 0, Math.PI);
    ctx.stroke();
  }
  ctx.restore();

  // Moon/sun reflection on water
  if (isNight) {
    const reflG = ctx.createLinearGradient(880 - cam*0.1, 295, 880 - cam*0.1, 460);
    reflG.addColorStop(0, 'rgba(255,255,200,0.12)');
    reflG.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = reflG;
    ctx.fillRect(860 - cam*0.1, 295, 40, 165);
  }

  // ── DOCK PLANKS (main ground) ─────────────────────────────
  // Stone/concrete dock base
  ctx.fillStyle = '#2a2e34'; ctx.fillRect(0, 455, W, 125);
  ctx.fillStyle = '#22262c'; ctx.fillRect(0, 453, W, 6); // edge line

  // Wooden dock planks
  ctx.fillStyle = '#5a4030';
  for (let px = -((cam * 0.9) % 60); px < W + 60; px += 60) {
    ctx.fillRect(px, 455, 58, 8);
  }
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1;
  for (let px = -((cam * 0.9) % 60); px < W + 60; px += 60) {
    ctx.strokeRect(px, 455, 58, 8);
  }

  // Plank detail lines (grain)
  ctx.fillStyle = '#4a3020';
  for (let px = -((cam * 0.9) % 60); px < W + 60; px += 60) {
    ctx.fillRect(px + 10, 455, 1, 8);
    ctx.fillRect(px + 30, 455, 1, 8);
    ctx.fillRect(px + 50, 455, 1, 8);
  }

  // Ground floor (concrete)
  ctx.fillStyle = '#2a2e34';
  for (let gx = -((cam * 0.9) % 80); gx < W; gx += 80) {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    ctx.strokeRect(gx, 465, 78, 46);
  }

  // ── PIER EXTENDING INTO WATER ─────────────────────────────
  const pierX = 350 - cam;
  if (pierX > -200 && pierX < W + 100) {
    // Pier planks
    ctx.fillStyle = '#6a5040';
    ctx.fillRect(pierX, 360, 120, 100);
    ctx.fillStyle = '#4a3020'; ctx.lineWidth = 1;
    for (let py = 360; py < 460; py += 12) {
      ctx.fillRect(pierX, py, 120, 1);
    }
    // Pier posts
    ctx.fillStyle = '#3a2010';
    [[pierX+10,365],[pierX+35,365],[pierX+60,365],[pierX+85,365],[pierX+110,365]].forEach(([ppx,ppy]) => {
      ctx.fillRect(ppx, ppy, 8, 95);
    });
    // Rope along edge
    ctx.strokeStyle = '#886633'; ctx.lineWidth = 3; ctx.setLineDash([8,4]);
    ctx.beginPath();
    ctx.moveTo(pierX, 375);
    ctx.lineTo(pierX+120, 375);
    ctx.stroke(); ctx.setLineDash([]);
  }

  // ── BOATS ─────────────────────────────────────────────────
  // Boat 1 (left)
  const b1x = 80 - cam * 0.7;
  drawDocksBoat(ctx, b1x, 380, f, 0, isNight);

  // Boat 2 (right of pier)
  const b2x = 550 - cam * 0.7;
  drawDocksBoat(ctx, b2x, 375, f, 1, isNight);

  // Boat 3 (far)
  const b3x = 900 - cam * 0.5;
  drawDocksBoatSmall(ctx, b3x, 340, f, 2);

  // ── DOCK BUILDINGS (background) ──────────────────────────
  // Warehouse left
  const wax = 0 - cam * 0.85;
  drawDocksWarehouse(ctx, wax, 230, isNight);

  // Fisherman's shop / hut
  const hutX = 680 - cam * 0.85;
  drawDocksHut(ctx, hutX, 320, isNight, f);

  // Lighthouse (far right)
  const ltX = 1350 - cam * 0.85;
  drawDocksLighthouse(ctx, ltX, 170, f, isNight);

  // ── DOCK DETAILS ──────────────────────────────────────────
  // Crates and barrels scattered
  const cratePositions = [[120, 445],[200, 448],[210, 440],[500, 447],[520, 440],[760, 446],[810, 445],[820, 437]];
  cratePositions.forEach(([cx, cy]) => {
    const rx = cx - cam * 0.9;
    if (rx < -30 || rx > W+30) return;
    // Barrel
    ctx.fillStyle = '#5a3820';
    ctx.beginPath(); ctx.ellipse(rx, cy+10, 12, 16, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(rx, cy+10, 12, 16, 0, 0, Math.PI*2); ctx.stroke();
    // Hoops
    ctx.strokeStyle = '#7a5030'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(rx, cy+4, 12, 4, 0, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(rx, cy+16, 12, 4, 0, 0, Math.PI*2); ctx.stroke();
  });

  // Fishing nets hanging
  const netPos = [[300, 400],[750, 395]];
  netPos.forEach(([nx, ny]) => {
    const rnx = nx - cam * 0.88;
    if (rnx < -50 || rnx > W+50) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(140,120,80,0.55)'; ctx.lineWidth = 1;
    for (let ni = 0; ni < 6; ni++) {
      ctx.beginPath();
      ctx.moveTo(rnx + ni*8, ny);
      ctx.lineTo(rnx + ni*8 + 20, ny + 40 + Math.sin(ni)*5);
      ctx.stroke();
    }
    for (let ni = 0; ni < 5; ni++) {
      ctx.beginPath();
      ctx.moveTo(rnx, ny + ni*8);
      ctx.lineTo(rnx + 40, ny + ni*8 + Math.sin(ni)*3);
      ctx.stroke();
    }
    ctx.restore();
  });

  // Dock lamp posts (lit at night)
  const lampPos = [180, 420, 640, 880, 1100];
  lampPos.forEach(lx => {
    const rlx = lx - cam * 0.9;
    if (rlx < -20 || rlx > W+20) return;
    ctx.fillStyle = '#3a3a4a'; ctx.fillRect(rlx-3, 390, 6, 70);
    ctx.fillStyle = '#5a5a6a'; ctx.fillRect(rlx-8, 390, 16, 5);
    // Lamp head
    ctx.fillStyle = isNight ? '#ffdd88' : '#aaaaaa';
    ctx.beginPath(); ctx.arc(rlx, 388, 7, 0, Math.PI*2); ctx.fill();
    if (isNight) {
      // Glow
      const lGlow = ctx.createRadialGradient(rlx, 388, 0, rlx, 388, 55);
      lGlow.addColorStop(0, 'rgba(255,220,100,0.25)');
      lGlow.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = lGlow; ctx.fillRect(rlx-60, 330, 120, 120);
    }
  });

  // Seagulls flying
  for (let sg = 0; sg < 4; sg++) {
    const sgx = ((f * (1.2 + sg * 0.3) + sg * 280) % (W + 200)) - 100;
    const sgy = 180 + Math.sin(f * 0.04 + sg) * 15 + sg * 25;
    const flap = Math.sin(f * 0.15 + sg) * 5;
    ctx.strokeStyle = 'rgba(200,220,240,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sgx - 8, sgy + flap);
    ctx.quadraticCurveTo(sgx, sgy - 4, sgx + 8, sgy + flap);
    ctx.stroke();
  }

  // ── CHARACTER IN DOCKS ────────────────────────────────────
  drawDocksChar(ctx, f);

  // ── HUD: BACK button ─────────────────────────────────────
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(10, 50, 110, 28);
  ctx.strokeStyle = 'rgba(60,180,255,0.3)'; ctx.lineWidth = 1;
  ctx.strokeRect(10, 50, 110, 28);
  ctx.font = '11px "Press Start 2P", monospace';
  ctx.fillStyle = 'rgba(60,200,255,0.7)';
  ctx.textAlign = 'left';
  ctx.fillText('← LEAVE', 22, 69);
  ctx.restore();
}

function drawDocksBoat(ctx, bx, by, f, seed, isNight) {
  const bob = Math.sin(f * 0.025 + seed * 1.3) * 3;
  const tilt = Math.sin(f * 0.018 + seed) * 1.2;
  ctx.save();
  ctx.translate(bx + 60, by + 40 + bob);
  ctx.rotate(tilt * Math.PI / 180);

  // Hull
  ctx.fillStyle = seed === 0 ? '#3a5a8a' : '#8a3a3a';
  ctx.beginPath();
  ctx.moveTo(-60, 0); ctx.lineTo(60, 0);
  ctx.lineTo(50, 30); ctx.lineTo(-50, 30); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1a2a3a'; ctx.lineWidth = 2; ctx.stroke();

  // Cabin
  ctx.fillStyle = seed === 0 ? '#2a3a5a' : '#5a2a2a';
  ctx.fillRect(-20, -30, 50, 32);
  // Windows
  ctx.fillStyle = isNight ? 'rgba(255,220,100,0.7)' : 'rgba(160,210,255,0.4)';
  ctx.fillRect(-12, -24, 14, 10);
  ctx.fillRect(8, -24, 14, 10);

  // Mast
  ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -90); ctx.stroke();
  // Sail
  ctx.fillStyle = seed === 0 ? 'rgba(220,210,190,0.8)' : 'rgba(200,160,140,0.8)';
  ctx.beginPath();
  ctx.moveTo(0, -85); ctx.lineTo(40, -55); ctx.lineTo(0, -30); ctx.closePath(); ctx.fill();

  // Rigging lines
  ctx.strokeStyle = 'rgba(140,120,80,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(60, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(-55, 0); ctx.stroke();

  ctx.restore();
}

function drawDocksBoatSmall(ctx, bx, by, f, seed) {
  const bob = Math.sin(f * 0.02 + seed * 2) * 2;
  ctx.save();
  ctx.translate(bx, by + bob);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#2a4a6a';
  ctx.beginPath();
  ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.lineTo(22, 18); ctx.lineTo(-22, 18); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1a2a3a'; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -40); ctx.stroke();
  ctx.restore();
}

function drawDocksWarehouse(ctx, x, y, isNight) {
  if (x < -200 || x > 1200) return;
  // Main building
  ctx.fillStyle = '#2a3040';
  ctx.fillRect(x, y, 200, 200);
  ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 200, 200);

  // Roof
  ctx.fillStyle = '#1e2530';
  ctx.beginPath(); ctx.moveTo(x-10, y); ctx.lineTo(x+100, y-30); ctx.lineTo(x+210, y); ctx.closePath(); ctx.fill();

  // Big door
  ctx.fillStyle = '#1a2028';
  ctx.fillRect(x+60, y+120, 80, 80);
  ctx.strokeStyle = '#3a4050'; ctx.lineWidth = 1;
  ctx.strokeRect(x+60, y+120, 80, 80);
  ctx.beginPath(); ctx.moveTo(x+100, y+120); ctx.lineTo(x+100, y+200); ctx.stroke();

  // Windows
  ctx.fillStyle = isNight ? 'rgba(255,200,80,0.4)' : 'rgba(140,180,220,0.3)';
  [[x+15,y+20],[x+55,y+20],[x+95,y+20],[x+135,y+20],[x+165,y+20]].forEach(([wx,wy]) => {
    ctx.fillRect(wx, wy, 28, 22);
    ctx.strokeStyle = '#3a4050'; ctx.lineWidth = 1; ctx.strokeRect(wx, wy, 28, 22);
  });

  // Sign
  ctx.fillStyle = '#223344';
  ctx.fillRect(x+50, y+80, 100, 30);
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = 'rgba(100,180,255,0.6)';
  ctx.textAlign = 'center';
  ctx.fillText('PIER 7 STORAGE', x+100, y+100);
}

function drawDocksHut(ctx, x, y, isNight, f) {
  if (x < -100 || x > 1300) return;
  ctx.fillStyle = '#4a3820';
  ctx.fillRect(x, y, 140, 130);
  ctx.fillStyle = '#3a2a14';
  ctx.beginPath(); ctx.moveTo(x-5, y); ctx.lineTo(x+70, y-35); ctx.lineTo(x+145, y); ctx.closePath(); ctx.fill();

  // Window (glowing)
  ctx.fillStyle = isNight ? 'rgba(255,200,80,0.7)' : 'rgba(200,220,255,0.4)';
  ctx.fillRect(x+10, y+20, 40, 30);
  if (isNight) {
    ctx.save();
    ctx.globalAlpha = 0.2 + Math.sin(f*0.04)*0.1;
    ctx.fillStyle = '#ffcc44';
    ctx.fillRect(x-10, y+10, 80, 60);
    ctx.restore();
  }

  // Door
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(x+90, y+70, 35, 60);

  // Sign: "TACKLE & BAIT"
  ctx.fillStyle = '#3a2a12';
  ctx.fillRect(x+20, y-8, 100, 20);
  ctx.font = '7px monospace';
  ctx.fillStyle = 'rgba(255,200,80,0.7)';
  ctx.textAlign = 'center';
  ctx.fillText('TACKLE & BAIT', x+70, y+6);
}

function drawDocksLighthouse(ctx, x, y, f, isNight) {
  if (x < -100 || x > 1400) return;
  // Base
  ctx.fillStyle = '#e8e0d0';
  ctx.fillRect(x+10, y+180, 50, 40);
  // Tower (tapered)
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath();
  ctx.moveTo(x, y+180); ctx.lineTo(x+70, y+180);
  ctx.lineTo(x+58, y+40); ctx.lineTo(x+12, y+40); ctx.closePath(); ctx.fill();

  // Red/white stripes
  ctx.fillStyle = '#cc2222';
  for (let s = 0; s < 5; s++) {
    const sy = y + 40 + s * 28;
    const sw = 70 - s * 3;
    const so = s * 1.5;
    ctx.fillRect(x + so, sy, sw - so*2, 14);
  }

  // Lantern room
  ctx.fillStyle = '#3a4050'; ctx.fillRect(x+10, y+20, 50, 22);
  ctx.strokeStyle = '#5a6070'; ctx.lineWidth = 2; ctx.strokeRect(x+10, y+20, 50, 22);

  // Light beam (night)
  if (isNight) {
    const beamAngle = (f * 0.02) % (Math.PI * 2);
    ctx.save();
    ctx.translate(x+35, y+30);
    ctx.rotate(beamAngle);
    const beamG = ctx.createLinearGradient(0, 0, 300, 0);
    beamG.addColorStop(0, 'rgba(255,240,180,0.5)');
    beamG.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = beamG;
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.lineTo(300, -25); ctx.lineTo(300, 25); ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Yellow light glow
    ctx.fillStyle = 'rgba(255,220,100,0.8)';
    ctx.beginPath(); ctx.arc(x+35, y+30, 8, 0, Math.PI*2); ctx.fill();
  }

  // Catwalk railing
  ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x+6, y+42); ctx.lineTo(x+64, y+42); ctx.stroke();
  for (let p = x+8; p < x+65; p += 8) {
    ctx.beginPath(); ctx.moveTo(p, y+32); ctx.lineTo(p, y+42); ctx.stroke();
  }
}

function drawDocksChar(ctx, f) {
  const cx = docksCharX - docksCamX;
  const cy = DOCKS_FLOOR_Y - 52;
  const action = docksAction;

  ctx.save();
  if (docksCharFacing === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-cx * 2 - 32, 0);
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(cx+16, cy+54, 10, 4, 0, 0, Math.PI*2); ctx.fill();

  let body = '#e8b88a', shirt = '#2a5a7a';
  const pants = '#1a2a4a', shoe = '#1a1008';
  const _dpcd = typeof playerCharData !== 'undefined' ? playerCharData : null;
  const dHair = _dpcd ? (_dpcd.type === 'alien' ? '#55bb66' : (_dpcd.hair || '#3a2010')) : '#3a2010';
  if (_dpcd) {
    if (_dpcd.skin) body = _dpcd.skin;
    if (_dpcd.type === 'alien')  body = '#55bb66';
    if (_dpcd.type === 'female') shirt = '#cc4488';
  }

  // Head
  ctx.fillStyle = body; ctx.fillRect(cx+10, cy+2, 12, 11);
  ctx.fillStyle = dHair; ctx.fillRect(cx+10, cy+2, 12, 3); ctx.fillRect(cx+10, cy+2, 3, 7);
  // Female: longer hair on both sides
  if (_dpcd && _dpcd.type === 'female') {
    ctx.fillStyle = dHair;
    ctx.fillRect(cx+10, cy+2, 3, 14); // left side longer
    ctx.fillRect(cx+19, cy+2, 3, 14); // right side longer
  }
  ctx.fillStyle = '#2c1810'; ctx.fillRect(cx+12, cy+8, 2, 2); ctx.fillRect(cx+18, cy+8, 2, 2);

  if (action === 'fish') {
    // Fishing rod
    ctx.strokeStyle = '#5a4020'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx+26, cy+20); ctx.lineTo(cx+50, cy+5); ctx.stroke();
    // Fishing line
    ctx.strokeStyle = 'rgba(200,200,200,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx+50, cy+5);
    ctx.lineTo(cx+45, cy+60 + Math.sin(f*0.06)*5);
    ctx.stroke();
    // Float bob
    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(cx+45, cy+60 + Math.sin(f*0.06)*5, 3, 0, Math.PI*2); ctx.fill();
  }

  // Body
  ctx.fillStyle = shirt; ctx.fillRect(cx+8, cy+13, 16, 16);
  ctx.fillStyle = body; ctx.fillRect(cx+14, cy+13, 4, 3); // neck
  // Arms
  const armSwing = action === 'idle' ? Math.sin(f * 0.04) * 3 : 0;
  ctx.fillStyle = shirt;
  ctx.fillRect(cx+4, cy+14, 5, 12 + armSwing);
  ctx.fillRect(cx+23, cy+14, 5, 12 - armSwing);
  ctx.fillStyle = body;
  ctx.fillRect(cx+4, cy+24 + armSwing, 5, 5);
  ctx.fillRect(cx+23, cy+24 - armSwing, 5, 5);

  // Pants + walk
  const legSwing = action === 'walk' ? Math.sin(f * 0.2) * 5 : 0;
  ctx.fillStyle = pants;
  ctx.fillRect(cx+8, cy+29, 16, 10);
  ctx.fillRect(cx+8, cy+39, 7, 10 + legSwing);
  ctx.fillRect(cx+17, cy+39, 7, 10 - legSwing);
  ctx.fillStyle = shoe;
  ctx.fillRect(cx+7, cy+49 + legSwing, 9, 3);
  ctx.fillRect(cx+17, cy+49 - legSwing, 9, 3);

  // Alien face overlay
  if (_dpcd && _dpcd.type === 'alien') {
    const hx = cx + 10, hy = cy + 2;
    ctx.fillStyle = '#55bb66';
    ctx.fillRect(hx, hy, 12, 3); ctx.fillRect(hx, hy, 3, 9); // cover hair
    ctx.fillStyle = '#88ffcc';
    ctx.fillRect(hx + 5, hy - 3, 2, 5); // antenna
    ctx.fillStyle = '#000022';
    ctx.fillRect(hx + 1, hy + 4, 4, 5); ctx.fillRect(hx + 7, hy + 4, 4, 5); // big eyes
    ctx.fillStyle = '#88ccff';
    ctx.fillRect(hx + 2, hy + 5, 2, 2); ctx.fillRect(hx + 8, hy + 5, 2, 2); // irises
    ctx.fillStyle = '#336644';
    ctx.fillRect(hx + 3, hy + 10, 6, 1); // mouth
  }

  ctx.restore();
}

let docksMoveTarget = null;
let docksKeyRight = false, docksKeyLeft = false;

let docksXpTick = 0;
function docksLoop() {
  if (!docksActive) { docksLoopRunning = false; return; }
  docksLoopRunning = true;
  docksFrame++;

  // XP ticking for docks — fishing gives fishing XP, walking gives agility
  docksXpTick++;
  if (docksXpTick % 3 === 0) {
    if (docksAction === 'fish') gainXP('fishing', 2.2);
    else if (docksAction === 'walk') gainXP('agility', 0.6);
  }

  // Movement
  const speed = 2.5;
  if (docksKeyLeft) { docksCharX -= speed; docksCharFacing = -1; docksAction = 'walk'; }
  else if (docksKeyRight) { docksCharX += speed; docksCharFacing = 1; docksAction = 'walk'; }
  else if (docksAction === 'walk') docksAction = 'idle';

  // Clamp
  docksCharX = Math.max(30, Math.min(DOCKS_W - 80, docksCharX));

  // Camera follows char
  const targetCam = Math.max(0, Math.min(DOCKS_W - 1100, docksCharX - 1100/2));
  docksCamX += (targetCam - docksCamX) * 0.1;

  // Check back area click for leave
  if (docksCharX < 60) leaveDocksScene();

  drawDocksScene();

  // Keep speech/thought bubbles anchored over the docks character
  if (typeof positionBubbles === 'function') {
    positionBubbles(Math.round(docksCharX - docksCamX), DOCKS_FLOOR_Y - 52);
  }

  requestAnimationFrame(docksLoop);
}

// Docks keyboard controls
document.addEventListener('keydown', e => {
  if (!docksActive) return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') docksKeyLeft = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') docksKeyRight = true;
  if (e.key === 'f' || e.key === 'F') { docksAction = 'fish'; addLog('🎣 fishing at the docks'); }
  if (e.key === 'Escape') {
    if (typeof equipOpen !== 'undefined' && equipOpen) { closeEquip(); return; }
    if (typeof craftOpen !== 'undefined' && craftOpen) { closeCraft(); return; }
    if (typeof invOpen   !== 'undefined' && invOpen)   { closeInv();   return; }
    leaveDocksScene();
  }
});
document.addEventListener('keyup', e => {
  if (!docksActive) return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') docksKeyLeft = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') docksKeyRight = false;
});

// Docks scene canvas click
document.getElementById('scene2Canvas').addEventListener('click', e => {
  const rect = e.currentTarget.getBoundingClientRect();
  const scaleX = e.currentTarget.width / rect.width;
  const scaleY = e.currentTarget.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  // Back button area
  if (mx >= 10 && mx <= 120 && my >= 50 && my <= 78) {
    leaveDocksScene();
    return;
  }
  // Click to walk
  docksMoveTarget = mx + docksCamX;
  if (mx + docksCamX < docksCharX) docksCharFacing = -1; else docksCharFacing = 1;
  docksAction = 'walk';
  // Animate walk to click
  const walkInterval = setInterval(() => {
    if (!docksActive) { clearInterval(walkInterval); return; }
    const dx = (mx + docksCamX) - docksCharX;
    if (Math.abs(dx) < 4) { clearInterval(walkInterval); docksAction = 'idle'; return; }
    docksCharX += Math.sign(dx) * 2.5;
  }, 16);
});

