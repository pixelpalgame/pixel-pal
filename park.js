// ── GROVE PARK SCENE ─────────────────────────────────────────
// Platformer gathering scene: arrows/WASD to move, E to gather, F1 idle mode.
// Trees drop wood; plants drop fiber.

let parkActive      = false;
let parkFrame       = 0;
let parkLoopRunning = false;
let parkKeyLeft     = false;
let parkKeyRight    = false;
let parkKeyJump     = false;

// ── IDLE GATHERING AI ─────────────────────────────────────────
let idlePark       = false;
let idleParkTarget = null;
let idleParkWait   = 0;
let idleParkStuckT = 0;
let idleParkLastX  = 0;

// ── PHYSICS OBJECT ───────────────────────────────────────────
const parkChar = {
  x: 120, y: 400,
  vx: 0,  vy: 0,
  w: 20,  h: 32,
  onGround: false,
  facing: 1,
  action: 'idle',   // idle | walk | jump | gather
  gatherTimer: 0,
  gatherTarget: null,
};

let parkCamX      = 0;
const PARK_W      = 1800;
const PARK_GRAV   = 0.55;
const PARK_JUMP   = -11;
const PARK_SPEED  = 2.8;

// ── PLATFORMS ────────────────────────────────────────────────
// Garden beds / raised soil areas
const PARK_PLATFORMS = [
  { x: 0,    y: 440, w: 1800, h: 20 },  // main ground
  { x: 200,  y: 370, w: 130,  h: 16 },  // raised bed 1
  { x: 480,  y: 350, w: 110,  h: 16 },  // raised bed 2
  { x: 750,  y: 365, w: 120,  h: 16 },  // raised bed 3
  { x: 1050, y: 345, w: 130,  h: 16 },  // raised bed 4
  { x: 1380, y: 360, w: 110,  h: 16 },  // raised bed 5
];

// ── NODE TYPES ────────────────────────────────────────────────
const PARK_NODE_TYPES = {
  tree:  { color: '#5a8a20', glow: '#88cc44', emoji: '🌳', label: 'Tree',  xp: 12, item: 'wood'  },
  plant: { color: '#2a7a3a', glow: '#44ff88', emoji: '🌿', label: 'Plant', xp: 8,  item: 'fiber' },
};

// ── NODES ─────────────────────────────────────────────────────
const PARK_NODES = [
  // Trees (wood) — ground floor
  { x:  350, y: 440, type: 'tree',  hp: 5, maxHp: 5, depleted: false, respawnTimer: 0 },
  { x:  700, y: 440, type: 'tree',  hp: 5, maxHp: 5, depleted: false, respawnTimer: 0 },
  { x: 1000, y: 440, type: 'tree',  hp: 5, maxHp: 5, depleted: false, respawnTimer: 0 },
  { x: 1300, y: 440, type: 'tree',  hp: 5, maxHp: 5, depleted: false, respawnTimer: 0 },
  { x: 1650, y: 440, type: 'tree',  hp: 5, maxHp: 5, depleted: false, respawnTimer: 0 },
  // Trees (wood) — elevated beds
  { x:  250, y: 370, type: 'tree',  hp: 5, maxHp: 5, depleted: false, respawnTimer: 0 },
  { x:  800, y: 365, type: 'tree',  hp: 5, maxHp: 5, depleted: false, respawnTimer: 0 },
  { x: 1100, y: 345, type: 'tree',  hp: 5, maxHp: 5, depleted: false, respawnTimer: 0 },
  // Plants (fiber) — ground floor
  { x:  200, y: 440, type: 'plant', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  { x:  500, y: 440, type: 'plant', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  { x:  850, y: 440, type: 'plant', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  { x: 1150, y: 440, type: 'plant', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  { x: 1450, y: 440, type: 'plant', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  { x: 1750, y: 440, type: 'plant', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  // Plants (fiber) — elevated beds
  { x:  520, y: 350, type: 'plant', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  { x: 1420, y: 360, type: 'plant', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
];

const parkPopups = [];

// ── ENTER / LEAVE ─────────────────────────────────────────────
function enterParkScene() {
  try {
    parkActive = true;
    parkFrame  = 0;
    parkChar.x = 120; parkChar.y = 400;
    parkChar.vx = 0;  parkChar.vy = 0;
    parkChar.onGround   = false;
    parkChar.action     = 'idle';
    parkChar.gatherTimer  = 0;
    parkChar.gatherTarget = null;
    parkKeyLeft = false; parkKeyRight = false; parkKeyJump = false;
    parkCamX = 0;

    document.getElementById('parkScene').style.display = 'block';
    document.getElementById('scroll').style.display    = 'none';
    document.getElementById('char').style.display      = 'none';

    char.loc    = 'park';
    char.action = 'idle';
    updateHUD();
    addLog('🌳 entered Grove Park');

    setTimeout(async () => {
      const r = await callAI('You just entered a lush park. Green trees, wild plants, fresh air. React in 1 sentence.', true);
      if (r) showSpeech(r, 6000, true);
    }, 600);

    if (!parkLoopRunning) requestAnimationFrame(parkLoop);
  } catch (err) {
    console.error('enterParkScene failed:', err);
    leaveParkScene();
  }
}

function leaveParkScene() {
  parkActive = false;
  document.getElementById('parkScene').style.display = 'none';
  document.getElementById('scroll').style.display    = 'block';
  document.getElementById('char').style.display      = 'block';
  char.action = 'idle';
  char.moving = false;
  char.loc    = 'nightclub';
  char.wx = 2500; char.tx = 2500;
  updateCamera();
  addLog('🚶 left the park');
}

// ── IDLE GATHERING AI ─────────────────────────────────────────
function getParkNodePlatform(n) {
  if (n.y >= 440) return null;
  return PARK_PLATFORMS.find(p => p.x <= n.x && n.x <= p.x + p.w && p.y < 440) || null;
}

function tickIdlePark() {
  if (!idlePark || parkChar.gatherTimer > 0) return;

  const eqStats    = typeof getEquipStats === 'function' ? getEquipStats() : {};
  const speedBonus = ((eqStats.miningSpeed || 0) + (eqStats.strideSpeed || 0)) * 0.01;
  const speed      = PARK_SPEED * (1 + speedBonus);

  const playerFeet    = parkChar.y + parkChar.h;
  const onGround      = parkChar.onGround;
  const onGroundFloor = Math.abs(playerFeet - 440) < 8;

  // Stuck detection
  if (Math.abs(parkChar.x - idleParkLastX) > 0.4) { idleParkLastX = parkChar.x; idleParkStuckT = 0; }
  else if (onGround && Math.abs(parkChar.vx) < 0.4) idleParkStuckT++;

  if (idleParkStuckT > 90) {
    if (onGroundFloor) {
      const stuckLedge = idleParkTarget && getParkNodePlatform(idleParkTarget);
      const stuckH = stuckLedge ? (440 - stuckLedge.y + 12) : 100;
      const stuckVy = Math.min(Math.ceil(Math.sqrt(2.4 * PARK_GRAV * stuckH)), 16);
      parkChar.vy = -stuckVy;
      parkChar.onGround = false;
    } else {
      const nearDir = (parkChar.x > PARK_W / 2) ? -1 : 1;
      parkChar.vx   = nearDir * speed * 2;
      parkChar.facing = nearDir;
    }
    idleParkStuckT = 0;
  }

  if (idleParkTarget && !idleParkTarget.depleted) {
    const ledge        = getParkNodePlatform(idleParkTarget);
    const onTargetLevel = ledge
      ? Math.abs(playerFeet - ledge.y) < 8
      : onGroundFloor;

    if (onTargetLevel) {
      const dx = idleParkTarget.x - (parkChar.x + parkChar.w / 2);
      if (Math.abs(dx) < 52) {
        parkChar.vx = 0;
        parkChar.facing      = dx >= 0 ? 1 : -1;
        parkChar.gatherTarget = idleParkTarget;
        parkChar.gatherTimer  = 80;
        parkChar.action       = 'gather';
        idleParkWait = 8;
      } else {
        parkChar.vx     = Math.sign(dx) * speed;
        parkChar.facing = dx > 0 ? 1 : -1;
      }

    } else if (ledge && onGroundFloor) {
      const ledgeCX  = ledge.x + ledge.w / 2;
      const playerCX = parkChar.x + parkChar.w / 2;
      const dx       = ledgeCX - playerCX;
      if (!onGround) {
        parkChar.vx     = Math.sign(dx) * speed;
        parkChar.facing = dx > 0 ? 1 : -1;
      } else if (Math.abs(dx) < 35) {
        const platformH = 440 - ledge.y + 12;
        const reqVy = Math.min(Math.ceil(Math.sqrt(2.4 * PARK_GRAV * platformH)), 16);
        parkChar.vy = -reqVy;
        parkChar.onGround = false;
        idleParkStuckT = 0;
      } else {
        parkChar.vx     = Math.sign(dx) * speed;
        parkChar.facing = dx > 0 ? 1 : -1;
      }

    } else {
      const dx = idleParkTarget.x - (parkChar.x + parkChar.w / 2);
      parkChar.vx     = Math.sign(dx) * speed;
      parkChar.facing = dx > 0 ? 1 : -1;
    }
    return;
  }

  if (idleParkTarget?.depleted) idleParkTarget = null;
  if (idleParkWait > 0) { idleParkWait--; parkChar.vx *= 0.7; return; }

  // Pick next target — prefer nearby, no elevation bias needed (park is gentle)
  const _hasAxe    = !!(typeof playerEquip !== 'undefined' && playerEquip?.axe);
  const _hasScythe = !!(typeof playerEquip !== 'undefined' && playerEquip?.scythe);
  if (!_hasAxe && !_hasScythe) { idleParkWait = 30; parkChar.vx = 0; return; }
  let best = null, bestScore = Infinity;
  PARK_NODES.forEach(n => {
    if (n.depleted) return;
    if (n.type === 'tree'  && !_hasAxe)    return;
    if (n.type === 'plant' && !_hasScythe) return;
    const dist  = Math.abs(n.x - parkChar.x);
    const elev  = (!onGroundFloor && n.y < 440) ? 2.0 : 1.0;
    const score = dist * elev;
    if (score < bestScore) { bestScore = score; best = n; }
  });

  if (best) {
    idleParkTarget = best;
    idleParkStuckT = 0;
  } else {
    idleParkWait  = 90;
    parkChar.vx   = 0;
  }
}

// ── PHYSICS ───────────────────────────────────────────────────
function parkPhysics() {
  if (!idlePark) {
    const _eqSpd = typeof getEquipStats === 'function' ? (getEquipStats().speed || 0) : 0;
    const _mv    = PARK_SPEED * (1 + _eqSpd * 0.04);
    if (parkKeyLeft  && parkChar.action !== 'gather') { parkChar.vx = -_mv; parkChar.facing = -1; }
    else if (parkKeyRight && parkChar.action !== 'gather') { parkChar.vx = _mv; parkChar.facing = 1; }
    else parkChar.vx *= 0.7;
  } else {
    if (parkChar.action === 'gather') parkChar.vx = 0;
  }

  if (!idlePark && parkKeyJump && parkChar.onGround && parkChar.action !== 'gather') {
    parkChar.vy = PARK_JUMP;
    parkChar.onGround = false;
    parkKeyJump = false;
  }

  parkChar.vy += PARK_GRAV;
  parkChar.x  += parkChar.vx;
  parkChar.x   = Math.max(0, Math.min(PARK_W - parkChar.w, parkChar.x));

  parkChar.y  += parkChar.vy;
  parkChar.onGround = false;
  if (parkChar.vy >= 0) {
    PARK_PLATFORMS.forEach(p => {
      const inX      = parkChar.x + parkChar.w > p.x && parkChar.x < p.x + p.w;
      const feet     = parkChar.y + parkChar.h;
      const prevFeet = feet - parkChar.vy;
      if (inX && prevFeet <= p.y + 1 && feet >= p.y) {
        parkChar.y    = p.y - parkChar.h;
        parkChar.vy   = 0;
        parkChar.onGround = true;
      }
    });
  }
  if (parkChar.y > 480) { parkChar.y = 408; parkChar.vy = 0; parkChar.onGround = true; }

  parkCamX = Math.max(0, Math.min(PARK_W - 1100, parkChar.x - 400));

  if (parkChar.gatherTimer <= 0) {
    if (!parkChar.onGround)              parkChar.action = 'jump';
    else if (Math.abs(parkChar.vx) > 0.5) parkChar.action = 'walk';
    else                                  parkChar.action = 'idle';
  }

  // Exit left edge
  if (parkChar.x < 10) leaveParkScene();
}

// ── GATHERING ─────────────────────────────────────────────────
function tryGatherNearest() {
  if (parkChar.gatherTimer > 0) return;
  const hasAxe   = !!(typeof playerEquip !== 'undefined' && playerEquip?.axe);
  const hasScythe = !!(typeof playerEquip !== 'undefined' && playerEquip?.scythe);
  if (!hasAxe && !hasScythe) {
    if (typeof addLog === 'function') addLog('🪓 Equip an axe or scythe first!');
    return;
  }
  const eqStats    = typeof getEquipStats === 'function' ? getEquipStats() : {};
  const extraReach = eqStats.miningReach || 0;
  const REACH_X    = 52 + extraReach;
  const REACH_Y    = 24;
  const speedBonus = ((eqStats.miningSpeed || 0) + (eqStats.miningYield || 0)) / 200;
  const gatherTime = Math.max(20, Math.round(60 * (1 - speedBonus)));

  let closest = null, closestDist = Infinity;
  PARK_NODES.forEach(n => {
    if (n.depleted) return;
    if (n.type === 'tree'  && !hasAxe)    return;
    if (n.type === 'plant' && !hasScythe) return;
    const dx = Math.abs(parkChar.x + parkChar.w / 2 - n.x);
    const dy = Math.abs((parkChar.y + parkChar.h) - n.y);
    if (dx <= REACH_X && dy <= REACH_Y && dx < closestDist) {
      closestDist = dx; closest = n;
    }
  });

  if (closest) {
    parkChar.gatherTarget = closest;
    parkChar.gatherTimer  = gatherTime;
    parkChar.action       = 'gather';
    parkChar.facing       = closest.x > (parkChar.x + parkChar.w / 2) ? 1 : -1;
    parkChar.vx = 0;
  }
}

function parkCheckGather() {
  if (parkChar.gatherTimer <= 0) return;
  parkChar.gatherTimer--;
  if (parkChar.gatherTimer > 0) { parkChar.action = 'gather'; return; }

  const node = parkChar.gatherTarget;
  if (!node || node.depleted) { parkChar.gatherTarget = null; return; }

  const type = PARK_NODE_TYPES[node.type];
  node.hp--;

  // XP popup
  parkPopups.push({ x: node.x, y: node.y - 24, text: `+${type.xp}`, alpha: 1, vy: -1.1 });
  if (typeof gainXP === 'function') gainXP('crafting', type.xp * 0.5, true);
  if (typeof gainXP === 'function') gainXP('agility',  2,             true);

  // Yield — axe boosts wood, scythe boosts fiber
  const eqStats       = typeof getEquipStats === 'function' ? getEquipStats() : {};
  const axeBonus      = (eqStats.miningYield || 0) / 100;
  const scytheBonus   = (eqStats.miningReach || 0) / 100;
  const relevantBonus = node.type === 'tree' ? axeBonus : scytheBonus;
  let yieldCount = 1;
  if (Math.random() < Math.min(0.85, relevantBonus + (idlePark ? 0.1 : 0))) yieldCount = 2;

  if (typeof invAddItem === 'function') invAddItem(type.item, yieldCount);
  const yieldStr = yieldCount > 1 ? ` x${yieldCount}` : '';
  if (typeof addLog === 'function') addLog(`${type.emoji} gathered ${type.label}${yieldStr}`);

  if (node.hp <= 0) {
    node.depleted    = true;
    node.respawnTimer = 2400 + Math.floor(Math.random() * 1200); // ~80-120s at 30fps
  }

  parkChar.gatherTarget = null;
  if (idlePark) idleParkTarget = (node.hp > 0) ? node : null;
}

function tickParkNodes() {
  PARK_NODES.forEach(n => {
    if (!n.depleted) return;
    n.respawnTimer--;
    if (n.respawnTimer <= 0) { n.depleted = false; n.hp = n.maxHp; n.respawnTimer = 0; }
  });
}

// ── MAIN LOOP ─────────────────────────────────────────────────
function parkLoop() {
  if (!parkActive) { parkLoopRunning = false; return; }
  parkLoopRunning = true;
  parkFrame++;

  tickIdlePark();
  parkPhysics();
  parkCheckGather();
  tickParkNodes();

  if (parkChar.action === 'walk' && parkFrame % 3 === 0) {
    if (typeof gainXP === 'function') gainXP('agility', 0.4);
  }

  drawParkScene();
  if (typeof positionBubbles === 'function') {
    positionBubbles(Math.round(parkChar.x - parkCamX) + parkChar.w / 2, parkChar.y);
  }
  requestAnimationFrame(parkLoop);
}

// ── DRAWING ───────────────────────────────────────────────────
function drawParkScene() {
  const cvs = document.getElementById('parkCanvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const W = 1100, H = 580;
  const cam = Math.round(parkCamX);

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(-cam, 0);

  // ── SKY ──────────────────────────────────────────────────────
  const sky = ctx.createLinearGradient(cam, 0, cam, 340);
  sky.addColorStop(0, '#4ab0f8');
  sky.addColorStop(1, '#bce8ff');
  ctx.fillStyle = sky;
  ctx.fillRect(cam, 0, 1100, 340);

  // Sun
  ctx.save();
  ctx.shadowColor = '#ffee88'; ctx.shadowBlur = 24;
  ctx.fillStyle = '#ffe84a';
  ctx.beginPath(); ctx.arc(cam + 950, 60, 28, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Clouds — scroll slowly with camera
  const cloudOff = (parkFrame * 0.08) % 500;
  [[100, 55], [340, 38], [620, 62], [900, 44], [1180, 58], [1450, 40]].forEach(([cx, cy]) => {
    const wx = ((cx - cloudOff + PARK_W) % (PARK_W + 200));
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath(); ctx.arc(wx, cy, 26, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(wx + 20, cy + 7, 19, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(wx - 16, cy + 9, 15, 0, Math.PI * 2); ctx.fill();
  });

  // ── GROUND ───────────────────────────────────────────────────
  const grassGrad = ctx.createLinearGradient(0, 340, 0, 580);
  grassGrad.addColorStop(0,   '#4aaa38');
  grassGrad.addColorStop(0.25,'#3a8828');
  grassGrad.addColorStop(1,   '#264a18');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, 340, PARK_W, 240);

  // Dirt path along ground floor
  ctx.fillStyle = '#9a8060';
  ctx.fillRect(0, 428, PARK_W, 32);
  ctx.fillStyle = '#7a6040';
  ctx.fillRect(0, 428, PARK_W, 3);

  // Grass tufts along path edge
  for (let gx = 20; gx < PARK_W; gx += 38) {
    const gh = 6 + Math.sin(gx * 0.3) * 3;
    ctx.fillStyle = '#3aaa28';
    ctx.fillRect(gx, 428 - gh, 3, gh);
    ctx.fillRect(gx + 6, 428 - gh + 2, 2, gh - 2);
  }

  // ── BACKGROUND TREES (decorative — not minable) ───────────────
  [80, 190, 410, 590, 870, 1080, 1310, 1530, 1720].forEach((tx, i) => {
    const ty = 285 + Math.sin(i * 1.3) * 15;
    ctx.fillStyle = '#4a2808';
    ctx.fillRect(tx - 5, ty, 10, 130);
    ctx.fillStyle = '#2a6a18';
    ctx.beginPath(); ctx.arc(tx, ty - 12, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a7a28';
    ctx.beginPath(); ctx.arc(tx - 9, ty + 4, 21, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a5a08';
    ctx.beginPath(); ctx.arc(tx + 10, ty - 4, 18, 0, Math.PI * 2); ctx.fill();
  });

  // ── RAISED PLATFORMS (garden beds) ───────────────────────────
  PARK_PLATFORMS.forEach(p => {
    if (p.y >= 440) return;
    // Soil body
    const soilGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h + 36);
    soilGrad.addColorStop(0, '#7a5230');
    soilGrad.addColorStop(1, '#4a2a0a');
    ctx.fillStyle = soilGrad;
    ctx.fillRect(p.x, p.y, p.w, p.h + 36);
    // Grass top stripe
    ctx.fillStyle = '#3a9a28';
    ctx.fillRect(p.x, p.y, p.w, 5);
    // Stone border walls
    ctx.fillStyle = '#998877';
    ctx.fillRect(p.x - 5, p.y, 5, p.h + 36);
    ctx.fillRect(p.x + p.w, p.y, 5, p.h + 36);
    ctx.fillRect(p.x - 5, p.y + p.h + 36, p.w + 10, 7);
    // Stone texture lines
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let sy = p.y + 8; sy < p.y + p.h + 36; sy += 8) {
      ctx.fillRect(p.x - 5, sy, p.w + 10, 1);
    }
  });

  // ── MINEABLE NODES ────────────────────────────────────────────
  const playerCX = parkChar.x + parkChar.w / 2;
  PARK_NODES.forEach(n => {
    const type   = PARK_NODE_TYPES[n.type];
    const nx = n.x, ny = n.y;
    const hpFrac = n.hp / n.maxHp;

    if (n.depleted) {
      // Stump / withered remains
      if (n.type === 'tree') {
        ctx.fillStyle = '#5a3010';
        ctx.fillRect(nx - 8, ny - 14, 16, 14);
        ctx.fillStyle = '#3a1800'; ctx.fillRect(nx - 6, ny - 4, 12, 4);
      } else {
        ctx.fillStyle = '#8a7040';
        ctx.beginPath(); ctx.arc(nx, ny - 8, 10, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }

    if (n.type === 'tree') {
      // Trunk
      ctx.fillStyle = '#7a4018';
      ctx.fillRect(nx - 8, ny - 60, 16, 60);
      // Roots
      ctx.fillStyle = '#5a2a08';
      ctx.fillRect(nx - 14, ny - 10, 9, 10);
      ctx.fillRect(nx + 5,  ny - 10, 9, 10);
      // Canopy — colour shifts as damaged
      const canopy = hpFrac > 0.6 ? '#2a9a18' : hpFrac > 0.3 ? '#6aaa18' : '#9a9828';
      ctx.fillStyle = canopy;
      ctx.beginPath(); ctx.arc(nx, ny - 74, 36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hpFrac > 0.6 ? '#3aaa28' : '#7a8818';
      ctx.beginPath(); ctx.arc(nx - 16, ny - 60, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hpFrac > 0.6 ? '#1a8808' : '#5a7818';
      ctx.beginPath(); ctx.arc(nx + 14, ny - 62, 21, 0, Math.PI * 2); ctx.fill();
      // Glow on full-health trees
      if (hpFrac === 1) {
        ctx.save();
        ctx.shadowColor = '#66ff22'; ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(80,220,40,0.1)';
        ctx.beginPath(); ctx.arc(nx, ny - 68, 40, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      // Chop marks
      if (hpFrac < 1) {
        const cuts = Math.ceil((1 - hpFrac) * 3);
        ctx.fillStyle = '#f0d8b0';
        for (let i = 0; i < cuts; i++) ctx.fillRect(nx - 5 + i * 4, ny - 28 + i * 6, 5, 3);
      }

    } else {
      // Plant / bush
      const stem = '#3a2a08';
      ctx.fillStyle = stem;
      ctx.fillRect(nx - 3, ny - 22, 6, 22);
      const bushC = hpFrac > 0.6 ? '#2a9a3a' : hpFrac > 0.3 ? '#5a9a2a' : '#8a9030';
      ctx.fillStyle = bushC;
      ctx.beginPath(); ctx.arc(nx, ny - 26, 19, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hpFrac > 0.6 ? '#3aaa4a' : '#6a8830';
      ctx.beginPath(); ctx.arc(nx - 11, ny - 19, 14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(nx + 10, ny - 20, 13, 0, Math.PI * 2); ctx.fill();
      // Flowers on healthy plants
      if (hpFrac === 1) {
        [['#ff66aa', -9], ['#ffcc44', 0], ['#ff8844', 9]].forEach(([c, ox]) => {
          ctx.fillStyle = '#ffffcc';
          ctx.beginPath(); ctx.arc(nx + ox, ny - 36, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.arc(nx + ox, ny - 36, 2, 0, Math.PI * 2); ctx.fill();
        });
      }
      // Wilt damage
      if (hpFrac < 1) {
        ctx.fillStyle = '#cccc88';
        ctx.fillRect(nx - 4, ny - 20, 3, 8);
        if (hpFrac < 0.5) ctx.fillRect(nx + 2, ny - 24, 3, 7);
      }
    }

    // HP pips
    const pipW = 5, pipGap = 2;
    const totalW = n.maxHp * (pipW + pipGap) - pipGap;
    const pipX   = nx - totalW / 2;
    for (let i = 0; i < n.maxHp; i++) {
      ctx.fillStyle = i < n.hp ? type.color : '#333333';
      ctx.fillRect(pipX + i * (pipW + pipGap), ny + 5, pipW, 3);
    }

    // Proximity prompt
    const dist = Math.abs(playerCX - nx + cam);
    if (dist < 80) {
      const labelY = n.type === 'tree' ? ny - 96 : ny - 52;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(nx - 40, labelY - 2, 80, 18);
      ctx.fillStyle = '#ccffcc';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`[E] ${type.label}`, nx, labelY + 11);
    }
  });

  // ── DECORATIVE FLOWERS along path ─────────────────────────────
  [[140, 425], [440, 423], [620, 426], [960, 424], [1230, 425], [1560, 423], [1740, 426]].forEach(([fx, fy], i) => {
    const colors = ['#ff88aa', '#ffcc44', '#88ddff', '#ff7744', '#cc88ff'];
    ctx.fillStyle = '#4a8a28';
    ctx.fillRect(fx - 1, fy - 10, 2, 10);
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath(); ctx.arc(fx, fy - 12, 4, 0, Math.PI * 2); ctx.fill();
  });

  // ── XP POPUPS ─────────────────────────────────────────────────
  for (let i = parkPopups.length - 1; i >= 0; i--) {
    const p = parkPopups[i];
    p.y    += p.vy;
    p.alpha -= 0.018;
    if (p.alpha <= 0) { parkPopups.splice(i, 1); continue; }
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = '#88ff44';
    ctx.font        = 'bold 11px monospace';
    ctx.textAlign   = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }

  ctx.restore(); // end world-space translate

  // ── SCREEN-SPACE HUD ─────────────────────────────────────────
  // Left-edge exit tunnel hint
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 200, 14, 180);
  ctx.fillStyle = '#aaffaa';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(7, 290); ctx.rotate(-Math.PI / 2);
  ctx.fillText('EXIT', 0, 0);
  ctx.restore();

  // Back button
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(14, 12, 82, 26);
  ctx.strokeStyle = '#44aa44'; ctx.lineWidth = 1;
  ctx.strokeRect(14, 12, 82, 26);
  ctx.fillStyle = '#ccffcc';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('← LEAVE', 22, 28);

  // Idle mode badge (bottom centre)
  const badgeY = H - 54;
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(W / 2 - 125, badgeY, 250, 42);
  ctx.strokeStyle = idlePark ? '#44ff88' : '#224422';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(W / 2 - 125, badgeY, 250, 42);
  ctx.fillStyle = idlePark ? '#44ff88' : '#448844';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(idlePark ? '🌿 IDLE GATHERING  [F1 OFF]' : '🌿 IDLE MODE  [F1 ON]', W / 2, badgeY + 14);
  if (idlePark) {
    const avail = PARK_NODES.filter(n => !n.depleted).length;
    ctx.fillStyle = '#aaffaa';
    ctx.fillText(`nodes available: ${avail} / ${PARK_NODES.length}`, W / 2, badgeY + 30);
  } else {
    ctx.fillStyle = '#668866';
    ctx.fillText('arrows/WASD  +  E to gather', W / 2, badgeY + 30);
  }

  // Draw character on top
  drawParkChar(ctx);
}

// ── CHARACTER DRAWING ─────────────────────────────────────────
function drawParkChar(ctx) {
  const px = Math.round(parkChar.x - parkCamX);
  const py = Math.round(parkChar.y);
  const f  = parkFrame;

  const _pcd = typeof playerCharData !== 'undefined' ? playerCharData : null;
  let body  = '#e8b88a', shirt = '#4a6fa5', hair = '#3a2010';
  if (_pcd) {
    if (_pcd.skin) body = _pcd.skin;
    if (_pcd.type === 'alien')  { body = '#55bb66'; shirt = '#5533aa'; }
    if (_pcd.type === 'female') shirt = '#cc4488';
    if (_pcd.type !== 'alien' && _pcd.hair) hair = _pcd.hair;
  }
  const pants = '#2a3a5a', shoe = '#2c2010';

  ctx.save();
  // Flip for direction
  if (parkChar.facing === -1) {
    ctx.translate(px + parkChar.w, py);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(px, py);
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(10, 34, 10, 4, 0, 0, Math.PI * 2); ctx.fill();

  function drawHead(hx, hy) {
    ctx.fillStyle = body; ctx.fillRect(hx, hy, 12, 11);
    ctx.fillStyle = hair; ctx.fillRect(hx, hy, 12, 3); ctx.fillRect(hx, hy, 3, 7);
    if (_pcd && _pcd.type === 'female') {
      ctx.fillStyle = hair;
      ctx.fillRect(hx, hy, 3, 14); ctx.fillRect(hx + 9, hy, 3, 14);
    }
    ctx.fillStyle = '#2c1810'; ctx.fillRect(hx + 2, hy + 6, 2, 2); ctx.fillRect(hx + 8, hy + 6, 2, 2);
    // Alien overlay
    if (_pcd && _pcd.type === 'alien') {
      ctx.fillStyle = '#55bb66';
      ctx.fillRect(hx, hy, 12, 3); ctx.fillRect(hx, hy, 3, 9);
      ctx.fillStyle = '#88ffcc'; ctx.fillRect(hx + 5, Math.max(-3, hy - 3), 2, 5);
      ctx.fillStyle = '#000022';
      ctx.fillRect(hx + 1, hy + 4, 4, 5); ctx.fillRect(hx + 7, hy + 4, 4, 5);
      ctx.fillStyle = '#88ccff';
      ctx.fillRect(hx + 2, hy + 5, 2, 2); ctx.fillRect(hx + 8, hy + 5, 2, 2);
    }
  }

  if (parkChar.action === 'gather') {
    const swing = Math.sin((f % 60) / 60 * Math.PI * 2);
    const armY  = Math.round(swing * 6);
    const lean  = Math.round(swing * 2);
    drawHead(5 + lean, 0);
    ctx.fillStyle = shirt; ctx.fillRect(4 + lean, 11, 13, 13);
    ctx.fillStyle = body;  ctx.fillRect(9 + lean, 11, 4, 3);
    // Active arm swinging down to gather
    ctx.fillStyle = shirt; ctx.fillRect(17 + lean, 12 + armY, 5, 10);
    ctx.fillStyle = body;  ctx.fillRect(17 + lean, 22 + armY, 5, 4);
    // Supporting arm
    ctx.fillStyle = shirt; ctx.fillRect(-1 + lean, 13, 5, 8);
    ctx.fillStyle = body;  ctx.fillRect(-1 + lean, 21, 5, 4);
    ctx.fillStyle = pants; ctx.fillRect(4, 24, 14, 8);
    ctx.fillStyle = pants; ctx.fillRect(4, 32, 7, 8); ctx.fillRect(12, 32, 7, 8);
    ctx.fillStyle = shoe;  ctx.fillRect(3, 40, 8, 2); ctx.fillRect(11, 40, 8, 2);

  } else if (parkChar.action === 'walk') {
    const leg = Math.sin(f * 0.22) * 5;
    const arm = Math.sin(f * 0.22) * 4;
    const bob = Math.round(Math.abs(Math.sin(f * 0.22)));
    drawHead(5, bob);
    ctx.fillStyle = shirt; ctx.fillRect(4, 11, 13, 13);
    ctx.fillStyle = body;  ctx.fillRect(9, 11, 4, 3);
    ctx.fillStyle = shirt; ctx.fillRect(-1, 12 + Math.round(arm),  5, 10);
    ctx.fillStyle = body;  ctx.fillRect(-1, 22 + Math.round(arm),  5, 4);
    ctx.fillStyle = shirt; ctx.fillRect(17, 12 - Math.round(arm),  5, 10);
    ctx.fillStyle = body;  ctx.fillRect(17, 22 - Math.round(arm),  5, 4);
    ctx.fillStyle = pants; ctx.fillRect(4,  24, 6, 8 + Math.round(leg));
    ctx.fillStyle = pants; ctx.fillRect(11, 24, 6, 8 - Math.round(leg));
    ctx.fillStyle = shoe;  ctx.fillRect(3,  32 + Math.round(leg), 8, 2);
    ctx.fillStyle = shoe;  ctx.fillRect(10, 32 - Math.round(leg), 8, 2);

  } else if (parkChar.action === 'jump') {
    drawHead(5, -2);
    ctx.fillStyle = shirt; ctx.fillRect(4, 9, 13, 13);
    ctx.fillStyle = shirt; ctx.fillRect(-4, 10, 5, 9); ctx.fillRect(20, 10, 5, 9);
    ctx.fillStyle = body;  ctx.fillRect(-4, 19, 5, 4);  ctx.fillRect(20, 19, 5, 4);
    ctx.fillStyle = pants; ctx.fillRect(3, 22, 6, 12); ctx.fillRect(12, 22, 6, 8);
    ctx.fillStyle = shoe;  ctx.fillRect(2, 34, 7, 2);   ctx.fillRect(11, 30, 7, 2);

  } else {
    // Idle — breathe
    const b = Math.round(Math.sin(f * 0.04) * 0.7);
    drawHead(5, b);
    ctx.fillStyle = shirt; ctx.fillRect(4, 11, 13, 13);
    ctx.fillStyle = body;  ctx.fillRect(9, 11, 4, 3);
    ctx.fillStyle = shirt; ctx.fillRect(-1, 12, 5, 10); ctx.fillRect(17, 12, 5, 10);
    ctx.fillStyle = body;  ctx.fillRect(-1, 22, 5, 4);  ctx.fillRect(17, 22, 5, 4);
    ctx.fillStyle = pants; ctx.fillRect(4, 24, 14, 8);
    ctx.fillStyle = pants; ctx.fillRect(4, 32, 7, 6); ctx.fillRect(12, 32, 7, 6);
    ctx.fillStyle = shoe;  ctx.fillRect(3, 38, 8, 2);  ctx.fillRect(11, 38, 8, 2);
  }

  ctx.restore();
}

// ── INPUT ─────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!parkActive) return;
  if (e.key === 'ArrowLeft'  || e.key === 'a') parkKeyLeft  = true;
  if (e.key === 'ArrowRight' || e.key === 'd') parkKeyRight = true;
  if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && parkChar.onGround) {
    parkKeyJump = true; e.preventDefault();
  }
  if ((e.key === 'e' || e.key === 'E') && !idlePark) tryGatherNearest();
  if (e.key === 'Escape') leaveParkScene();
  if (e.key === 'F1') {
    e.preventDefault();
    idlePark       = !idlePark;
    idleParkTarget = null;
    idleParkWait   = 0;
  }
});

document.addEventListener('keyup', e => {
  if (!parkActive) return;
  if (e.key === 'ArrowLeft'  || e.key === 'a') parkKeyLeft  = false;
  if (e.key === 'ArrowRight' || e.key === 'd') parkKeyRight = false;
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') parkKeyJump = false;
});

// Canvas click — back button
document.addEventListener('click', e => {
  if (!parkActive) return;
  const cvs = document.getElementById('parkCanvas');
  if (!cvs) return;
  const rect = cvs.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (1100 / rect.width);
  const my = (e.clientY - rect.top)  * (580  / rect.height);
  if (mx >= 14 && mx <= 96 && my >= 12 && my <= 38) leaveParkScene();
});
