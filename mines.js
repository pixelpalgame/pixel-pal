// ════════════════════════════════════════════════════════════
// STONEPICK MINES — Beginner Mining Zone
// Platformer scene: arrow keys to move/jump, E to mine nearby nodes
// ════════════════════════════════════════════════════════════

let minesActive  = false;
let minesFrame   = 0;
let minesKeyLeft = false, minesKeyRight = false, minesKeyJump = false;

// Tutorial shown once on first entry — persisted via save.js
let minesVisited = false;

function showMinesTutorial() {
  document.getElementById('minesTutorialOverlay').classList.add('open');
}
function hideMinesTutorial() {
  document.getElementById('minesTutorialOverlay').classList.remove('open');
}

function initMinesTutorial() {
  document.getElementById('minesTutorialCraftBtn').addEventListener('click', () => {
    hideMinesTutorial();
    if (typeof toggleCraft === 'function') toggleCraft();
  });
}

// ── IDLE MINING MODE ─────────────────────────────────────────
let idleMining = false;       // F1 toggle
let idleTarget = null;        // node the AI is walking toward
let idleWaitTimer = 0;        // pause between tasks
let idleJumpTimer = 0;        // auto-jump cooldown when stuck

// XP scaling for idle mining — near-infinite but very slow
// Level thresholds grow exponentially: next level = prev * 1.8
// Returns current idle level and bonuses
function getIdleLevel() {
  const xp = (SKILLS.mining || { xp: 0 }).xp;
  let level = 1, threshold = 500;
  while (xp >= threshold && level < 999) { level++; threshold = Math.floor(threshold * 1.8); }
  const nextAt = threshold;
  // All bonuses use log scaling — fast early gains, near-infinite soft cap
  // Base values are intentionally slow: speed 1.0px/frame, swing 100 frames
  const speedMult  = 1 + Math.log(level + 1) * 0.15;   // walk speed multiplier on base 1.0
  const yieldMult  = 1 + Math.log(level + 1) * 0.08;   // bonus ore drop chance
  const swingMult  = Math.max(0.35, 1 - Math.log(level + 1) * 0.07); // swing time mult on base 100
  return { level, xp, nextAt, speedMult, yieldMult, swingMult };
}

// Player physics
const mineChar = {
  x: 160, y: 300,
  vx: 0, vy: 0,
  w: 20, h: 32,
  onGround: false,
  facing: 1,
  action: 'idle',   // idle | walk | jump | mine
  mineTimer: 0,     // counts down when mining
  mineTarget: null, // which node being mined
};

// Camera
let minesCamX = 0;
const MINES_W = 2200;
const GRAVITY = 0.55;
const JUMP_FORCE = -11;
const MOVE_SPEED = 3.2;

// ── PLATFORMS ───────────────────────────────────────────────
// { x, y, w, h }  — all in world coords
const MINE_PLATFORMS = [
  // Ground floor
  { x: 0,    y: 440, w: 2200, h: 20 },  // main ground

  // Upper cave ledges
  { x: 180,  y: 340, w: 140, h: 16 },
  { x: 420,  y: 280, w: 120, h: 16 },
  { x: 620,  y: 330, w: 100, h: 16 },
  { x: 760,  y: 250, w: 130, h: 16 },
  { x: 960,  y: 310, w: 110, h: 16 },
  { x: 1100, y: 260, w: 120, h: 16 },
  { x: 1280, y: 330, w: 100, h: 16 },
  { x: 1440, y: 280, w: 130, h: 16 },
  { x: 1640, y: 350, w: 120, h: 16 },
  { x: 1820, y: 290, w: 110, h: 16 },
  { x: 1980, y: 360, w: 140, h: 16 },

  // Low rock shelves removed — they were too close to ground (40px gap < player height 32px+margin)
  // Players were getting stuck against their sides with no way through
];

// ── ORE NODES ────────────────────────────────────────────────
// Each node: { x, y, type, hp, maxHp, depleted, respawnTimer }
const ORE_TYPES = {
  stone:  { color: '#888880', glow: '#aaaaaa', emoji: '🪨', label: 'Stone',       xp: 10, item: 'stone'      },
  metal:  { color: '#7a8a9a', glow: '#99aacc', emoji: '⛏️', label: 'Scrap Metal', xp: 25, item: 'scrap_metal' },
};

const MINE_NODES = [
  // Stone — on main ground floor
  { x:  230, y: 440, type: 'stone', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  { x:  500, y: 440, type: 'stone', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  { x:  750, y: 440, type: 'stone', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  { x: 1050, y: 440, type: 'stone', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  { x: 1350, y: 440, type: 'stone', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  { x: 1650, y: 440, type: 'stone', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  { x: 1950, y: 440, type: 'stone', hp: 3, maxHp: 3, depleted: false, respawnTimer: 0 },
  // Metal — on upper ledges (requires jumping up to reach)
  { x:  250, y: 340, type: 'metal', hp: 4, maxHp: 4, depleted: false, respawnTimer: 0 },
  { x:  480, y: 280, type: 'metal', hp: 4, maxHp: 4, depleted: false, respawnTimer: 0 },
  { x:  670, y: 330, type: 'metal', hp: 4, maxHp: 4, depleted: false, respawnTimer: 0 },
  { x:  820, y: 250, type: 'metal', hp: 4, maxHp: 4, depleted: false, respawnTimer: 0 },
  { x: 1000, y: 310, type: 'metal', hp: 4, maxHp: 4, depleted: false, respawnTimer: 0 },
  { x: 1150, y: 260, type: 'metal', hp: 4, maxHp: 4, depleted: false, respawnTimer: 0 },
  { x: 1320, y: 330, type: 'metal', hp: 4, maxHp: 4, depleted: false, respawnTimer: 0 },
  { x: 1470, y: 280, type: 'metal', hp: 4, maxHp: 4, depleted: false, respawnTimer: 0 },
  { x: 1670, y: 350, type: 'metal', hp: 4, maxHp: 4, depleted: false, respawnTimer: 0 },
  { x: 1850, y: 290, type: 'metal', hp: 4, maxHp: 4, depleted: false, respawnTimer: 0 },
  { x: 2020, y: 360, type: 'metal', hp: 4, maxHp: 4, depleted: false, respawnTimer: 0 },
];

// Ore items are registered in ui.js ITEM_DB

// Floating XP pop-ups
const minesPopups = [];

// Mining skill — add to SKILLS if not there
if (!SKILLS.mining) {
  SKILLS.mining = { name:'Mining', emoji:'⛏️', color:'#bb8833', xp:0, level:1, action:'mine' };
}

// ── ENTER / LEAVE ────────────────────────────────────────────
function enterMinesScene() {
  try {
    minesActive = true;
    minesFrame  = 0;
    mineChar.x  = 200;
    mineChar.y  = 380;
    mineChar.vx = 0;
    mineChar.vy = 0;
    mineChar.onGround = false;
    mineChar.action = 'idle';
    mineChar.mineTimer = 0;
    mineChar.mineTarget = null;
    minesKeyLeft = false;
    minesKeyRight = false;
    minesKeyJump = false;
    minesCamX = 0;

    // Give starter materials matching T1 crafting base (scrap_metal + fiber)
    invAddItem('scrap_metal', 4);
    invAddItem('fiber', 2);
    invAddItem('stone', 2);

    document.getElementById('minesScene').style.display = 'block';
    document.getElementById('scroll').style.display = 'none';
    document.getElementById('char').style.display = 'none';

    char.loc = 'mines';
    char.action = 'idle';
    updateHUD();
    addLog('⛏️ entered Stonepick Mines');

    if (!minesVisited) {
      minesVisited = true;
      if (typeof unlockCrafting === 'function') unlockCrafting();
      setTimeout(() => showMinesTutorial(), 400);
    }

    setTimeout(async () => {
      const r = await callAI('You just entered a dark cave mine. Damp walls, glinting ore veins, distant pickaxe echoes. React in 1 sentence.', true);
      if (r) showSpeech(r, 6000, true);
    }, 600);

    if (!minesLoopRunning) requestAnimationFrame(minesLoop);
  } catch(err) {
    console.error('enterMinesScene failed:', err);
    leaveMinesScene(); // safety: never trap player
  }
}

function leaveMinesScene() {
  minesActive = false;
  document.getElementById('minesScene').style.display = 'none';
  document.getElementById('scroll').style.display = 'block';
  document.getElementById('char').style.display = 'block';
  char.action = 'idle';
  char.moving = false;
  char.loc = 'street';
  char.wx = 1950; char.tx = 1950; // street world x
  updateCamera(); // reposition char div immediately
  addLog('🚶 left the mines');
}

// ── IDLE MINING AI ───────────────────────────────────────────
// ── Idle AI state ────────────────────────────────────────────
let idleLastX  = 0;       // stuck detection: last recorded x
let idleStuckT = 0;       // frames since last x-progress
let idlePhase  = 'seek';  // seek | approach | onledge
let idleLedge  = null;    // target ledge platform { x, y, w }

function getNodePlatform(n) {
  // Returns the ledge platform a metal node is embedded in (null for ground nodes)
  if (n.y >= 440) return null;
  return MINE_PLATFORMS.find(p => p.x <= n.x && n.x <= p.x + p.w && p.y < 440) || null;
}

function tickIdleMining() {
  if (!idleMining || mineChar.mineTimer > 0) return;
  if (!playerEquip?.pickaxe) return; // silently skip — no pickaxe equipped

  const il       = getIdleLevel();
  const eqStats  = typeof getEquipStats === 'function' ? getEquipStats() : {};
  const eqSpeed  = eqStats.strideSpeed   || 0;
  const eqMSpd   = eqStats.miningSpeed  || 0;
  const speed    = 1.0 * il.speedMult * (1 + eqSpeed * 0.04);
  const BASE_SWING = 200;
  // miningSpeed reduces swing time (% bonus), stacks with idle level bonus
  const swingTime  = Math.round(BASE_SWING * il.swingMult * (1 / (1 + eqMSpd / 100)));

  const playerFeet  = mineChar.y + mineChar.h;
  const onGround    = mineChar.onGround;
  const onGroundFloor = Math.abs(playerFeet - 440) < 8;

  // ── Stuck detection: only counts when nearly stationary (vx < 0.4) ─────────
  // Walk speed is 1.0px/frame so we only flag stuck when truly not moving
  if (Math.abs(mineChar.x - idleLastX) > 0.4) { idleLastX = mineChar.x; idleStuckT = 0; }
  else if (onGround && Math.abs(mineChar.vx) < 0.4) idleStuckT++;

  if (idleStuckT > 90) {
    if (onGroundFloor) {
      // On ground and stuck — jump using target ledge height if known, else max
      const stuckLedge = idleLedge || idleTarget && getNodePlatform(idleTarget);
      const stuckH = stuckLedge ? (440 - stuckLedge.y + 12) : 200;
      const stuckVy = Math.min(Math.ceil(Math.sqrt(2.4 * GRAVITY * stuckH)), 18);
      mineChar.vy = -stuckVy;
      mineChar.onGround = false;
    } else {
      // On an upper ledge — walk toward nearest edge to fall off
      // Pick the closer edge of the current ledge
      const nearestEdgeDir = (mineChar.x > MINES_W / 2) ? -1 : 1;
      mineChar.vx = nearestEdgeDir * speed * 2;
      mineChar.facing = nearestEdgeDir;
    }
    idleStuckT = 0;
  }

  // ── Active target ─────────────────────────────────────────────────────────
  if (idleTarget && !idleTarget.depleted) {
    const ledge = getNodePlatform(idleTarget);

    // Are we on the same platform as the target?
    const onTargetLevel = ledge
      ? Math.abs(playerFeet - ledge.y) < 8
      : onGroundFloor;

    if (onTargetLevel) {
      // ── Correct platform: walk to node and mine ────────────────────────
      const dx = idleTarget.x - (mineChar.x + mineChar.w / 2);
      if (Math.abs(dx) < 48) {
        mineChar.vx = 0;
        mineChar.facing = dx >= 0 ? 1 : -1;
        mineChar.mineTarget = idleTarget;
        mineChar.mineTimer  = swingTime;
        // Keep idleTarget — will re-mine same node if still has hp after swing completes
        // (idleTarget gets cleared when node is depleted in minesCheckMine)
        idleWaitTimer = 8;
      } else {
        mineChar.vx = Math.sign(dx) * speed;
        mineChar.facing = dx > 0 ? 1 : -1;
      }

    } else if (ledge && onGroundFloor) {
      // ── Need to jump up onto a ledge — only attempt from ground floor ──
      // Phase 1: walk until player center is within ledge x span
      // Phase 2: jump straight up — horizontal momentum carries us onto ledge
      const ledgeCX  = ledge.x + ledge.w / 2;
      const playerCX = mineChar.x + mineChar.w / 2;
      const dx       = ledgeCX - playerCX;

      if (!onGround) {
        // Airborne: keep drifting toward ledge center
        mineChar.vx = Math.sign(dx) * speed;
        mineChar.facing = dx > 0 ? 1 : -1;
      } else if (Math.abs(dx) < 35) {
        // In position — jump with exactly enough force to clear this ledge's height
        // Using factor 2.4 instead of 2 to account for discrete integration overhead
        const platformHeight = 440 - ledge.y + 12; // +12px clearance so feet clear the top
        const reqVy = Math.min(Math.ceil(Math.sqrt(2.4 * GRAVITY * platformHeight)), 18);
        mineChar.vy = -reqVy;
        mineChar.onGround = false;
        idleStuckT = 0;
      } else {
        // Walk into position
        mineChar.vx = Math.sign(dx) * speed;
        mineChar.facing = dx > 0 ? 1 : -1;
      }

    } else {
      // ── On an upper ledge but target is elsewhere — just walk toward it.
      // Walking off the edge naturally drops us to ground, then we re-evaluate.
      const dx = idleTarget.x - (mineChar.x + mineChar.w / 2);
      mineChar.vx = Math.sign(dx) * speed;
      mineChar.facing = dx > 0 ? 1 : -1;
    }
    return;
  }

  // ── Clear depleted target, wait, then pick next ────────────────────────────
  if (idleTarget?.depleted) idleTarget = null;
  if (idleWaitTimer > 0) { idleWaitTimer--; mineChar.vx *= 0.7; return; }

  // Prefer ground nodes when on an upper ledge (so AI descends naturally)
  let best = null, bestScore = Infinity;
  MINE_NODES.forEach(n => {
    if (n.depleted) return;
    const dist = Math.abs(n.x - mineChar.x);
    // When elevated, strongly prefer ground nodes so AI walks off and descends
    const elevatedPenalty = (!onGroundFloor && n.y < 440) ? 2.5 : 1.0;
    const typeBias = n.type === 'metal' ? 0.88 : 1.0;
    const score = dist * typeBias * elevatedPenalty;
    if (score < bestScore) { bestScore = score; best = n; }
  });

  if (best) {
    idleTarget = best;
    idleLedge  = getNodePlatform(best);
    idleStuckT = 0;
  } else {
    idleWaitTimer = 90;
    mineChar.vx = 0;
  }
}

// ── PHYSICS ──────────────────────────────────────────────────
function minesPhysics() {
  // In idle mode AI controls movement; in manual mode use keys
  if (!idleMining) {
    const _eqSpd = typeof getEquipStats === 'function' ? (getEquipStats().strideSpeed || 0) : 0;
    const _mvSpd = MOVE_SPEED * (1 + _eqSpd * 0.04);
    if (minesKeyLeft  && mineChar.action !== 'mine') { mineChar.vx = -_mvSpd; mineChar.facing = -1; }
    else if (minesKeyRight && mineChar.action !== 'mine') { mineChar.vx = _mvSpd;  mineChar.facing =  1; }
    else mineChar.vx *= 0.7;
  } else {
    // Idle mode: AI sets vx via tickIdleMining; apply friction when not mining
    if (mineChar.action === 'mine') mineChar.vx = 0;
    // (vx set by tickIdleMining, don't zero it here)
  }

  // Jump (manual only)
  if (!idleMining && minesKeyJump && mineChar.onGround && mineChar.action !== 'mine') {
    mineChar.vy = JUMP_FORCE;
    mineChar.onGround = false;
    minesKeyJump = false;
  }

  // Gravity + move X axis first
  mineChar.vy += GRAVITY;
  mineChar.x  += mineChar.vx;

  // No side collision — platforms are land-on-top only (standard platformer)
  mineChar.x = Math.max(0, Math.min(MINES_W - mineChar.w, mineChar.x));

  // ── Vertical collision: land on platform tops (only when falling DOWN) ──────
  mineChar.y += mineChar.vy;
  mineChar.onGround = false;
  if (mineChar.vy >= 0) {   // only check landing when moving downward or stationary
    MINE_PLATFORMS.forEach(p => {
      const inX      = mineChar.x + mineChar.w > p.x && mineChar.x < p.x + p.w;
      const feet     = mineChar.y + mineChar.h;
      const prevFeet = feet - mineChar.vy;
      if (inX && prevFeet <= p.y + 1 && feet >= p.y) {
        mineChar.y    = p.y - mineChar.h;
        mineChar.vy   = 0;
        mineChar.onGround = true;
      }
    });
  }
  if (mineChar.y > 480) { mineChar.y = 408; mineChar.vy = 0; mineChar.onGround = true; }

  // ── Camera: always AFTER full collision resolution so it never drifts ────
  minesCamX = Math.max(0, Math.min(MINES_W - 1100, mineChar.x - 400));

  // Action state
  if (mineChar.mineTimer <= 0) {
    if (!mineChar.onGround) mineChar.action = 'jump';
    else if (Math.abs(mineChar.vx) > 0.5) mineChar.action = 'walk';
    else mineChar.action = 'idle';
  }

  // Exit: player reaches the left wall entrance
  if (mineChar.x < 10) leaveMinesScene();
}

// ── MINING LOGIC ─────────────────────────────────────────────
function minesCheckMine() {
  if (mineChar.mineTimer > 0) {
    mineChar.mineTimer--;
    mineChar.action = 'mine';
    mineChar.vx = 0;
    if (mineChar.mineTimer === 0) {
      const node = mineChar.mineTarget;
      if (node && !node.depleted) {
        node.hp--;
        const ore = ORE_TYPES[node.type];

        // XP pop
        minesPopups.push({ x: node.x, y: node.y - 20, text: `+${ore.xp} Mining`, alpha: 1, vy: -1.2 });
        gainXP('mining', ore.xp);
        // Map ore node type to item id (uses ORE_TYPES.item)
        const oreItemId = ore.item;
        // Yield bonus from tool affixes + idle level (both paths stack)
        const eqStats   = typeof getEquipStats === 'function' ? getEquipStats() : {};
        const toolYield = (eqStats.miningYield || 0) / 100; // axe yield bonus
        let yieldCount = 1;
        if (idleMining) {
          const il = getIdleLevel();
          // Combine idle level bonus and equipment yield into one roll
          const yieldChance = Math.min(0.95, (il.yieldMult - 1) * 3 + toolYield);
          if (Math.random() < yieldChance) yieldCount = 2;
        } else {
          if (Math.random() < toolYield) yieldCount = 2;
        }
        invAddItem(oreItemId, yieldCount);
        const yieldStr = yieldCount > 1 ? ` x${yieldCount}` : '';
        addLog(`⛏️ mined ${ore.label}${yieldStr}`);

        // ── Rare bonus drop per swing ─────────────────────────
        if (node.type === 'metal' && Math.random() < 0.25) {
          invAddItem('copper_ore', 1);
          addLog('✨ Bonus: Copper Ore');
        } else if (node.type === 'stone' && Math.random() < 0.25) {
          invAddItem('coal', 1);
          addLog('✨ Bonus: Coal');
        }
        shiftMood(1);

        if (node.hp <= 0) {
          node.depleted = true;
          node.respawnTimer = 3600 + Math.floor(Math.random() * 1800); // 120-180s at 30fps
        }
      }
      mineChar.mineTarget = null;
    }
    return;
  }
}

function tryMineNearest() {
  // Pickaxe must be equipped to mine
  if (!playerEquip?.pickaxe) {
    addLog('⛏️ Equip a pickaxe first!');
    return;
  }
  // Must be standing on the same surface as the node and within arm's reach horizontally
  const eqStats  = typeof getEquipStats === 'function' ? getEquipStats() : {};
  const REACH_X  = 48 + (eqStats.miningReach || 0); // scythe extends reach
  const REACH_Y  = 20;
  const speedPct = (eqStats.miningSpeed || 0) / 100; // pickaxe reduces swing time
  const BASE_SWING = 40;
  const swingTime  = Math.max(14, Math.round(BASE_SWING * (1 - speedPct)));

  let closest = null, closestDist = Infinity;
  MINE_NODES.forEach(n => {
    if (n.depleted) return;
    const dx = Math.abs(mineChar.x + mineChar.w/2 - n.x);
    const dy = Math.abs((mineChar.y + mineChar.h) - n.y);  // feet vs platform surface
    if (dx <= REACH_X && dy <= REACH_Y) {
      const dist = Math.hypot(dx, dy);
      if (dist < closestDist) { closest = n; closestDist = dist; }
    }
  });
  if (closest) {
    mineChar.mineTarget = closest;
    mineChar.mineTimer  = swingTime;
    mineChar.facing     = closest.x > mineChar.x ? 1 : -1;
  }
}

// Respawn depleted nodes
function tickMineNodes() {
  MINE_NODES.forEach(n => {
    if (n.depleted) {
      n.respawnTimer--;
      if (n.respawnTimer <= 0) { n.depleted = false; n.hp = n.maxHp; }
    }
  });
}

// ── DRAW ─────────────────────────────────────────────────────
function drawMinesScene() {
  const cvs = document.getElementById('minesCanvas');
  if (!cvs) return;
  const ctx  = cvs.getContext('2d');
  const W = 1100, H = 580;
  const cam = Math.round(minesCamX);

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(-cam, 0);

  // ── BACKGROUND — deep cave ──────────────────────────────
  // Dark cave gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0806');
  bg.addColorStop(0.5, '#120e08');
  bg.addColorStop(1, '#08060a');
  ctx.fillStyle = bg;
  ctx.fillRect(cam, 0, W, H);

  // Cave ceiling — jagged stalactites
  ctx.fillStyle = '#1a140e';
  ctx.beginPath();
  ctx.moveTo(cam, 0);
  for (let x = cam; x < cam + W + 60; x += 40) {
    const h = 40 + Math.sin(x * 0.04) * 20 + Math.sin(x * 0.07 + 1) * 15;
    ctx.lineTo(x, h);
  }
  ctx.lineTo(cam + W, 0);
  ctx.closePath();
  ctx.fill();

  // Stalactite tips
  ctx.fillStyle = '#110d09';
  for (let x = cam; x < cam + W; x += 55) {
    const baseH = 40 + Math.sin(x * 0.04) * 20 + Math.sin(x * 0.07 + 1) * 15;
    const tipH  = baseH + 30 + Math.sin(x * 0.09) * 18;
    ctx.beginPath();
    ctx.moveTo(x - 12, baseH);
    ctx.lineTo(x, tipH);
    ctx.lineTo(x + 12, baseH);
    ctx.closePath();
    ctx.fill();
  }

  // Rock texture on walls/ceiling
  ctx.fillStyle = 'rgba(60,45,30,0.3)';
  for (let rx = cam; rx < cam + W; rx += 70) {
    for (let ry = 0; ry < 200; ry += 50) {
      ctx.fillRect(rx + Math.sin(rx * ry) * 8, ry + Math.cos(rx + ry) * 6, 18, 8);
    }
  }

  // Glowing ore veins in walls
  [['#441100',70],['#333322',120],['#221133',160]].forEach(([col, baseY]) => {
    ctx.fillStyle = col;
    for (let vx = cam; vx < cam + W; vx += 180) {
      ctx.fillRect(vx + Math.sin(vx) * 20, baseY + Math.cos(vx * 0.05) * 30, 6 + Math.abs(Math.sin(vx)) * 12, 4);
    }
  });

  // Ambient dust particles
  ctx.fillStyle = 'rgba(180,160,120,0.08)';
  for (let i = 0; i < 30; i++) {
    const px = cam + (i * 77 + minesFrame * 0.3) % W;
    const py = 80 + Math.sin(minesFrame * 0.02 + i) * 60 + i * 10;
    ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI*2); ctx.fill();
  }

  // ── GROUND / FLOOR ──────────────────────────────────────
  // Draw dirt/rock floor with texture
  ctx.fillStyle = '#2a1e10';
  ctx.fillRect(cam, 440, W, H - 440);
  // Rock surface texture
  ctx.strokeStyle = 'rgba(60,40,20,0.5)';
  ctx.lineWidth = 1;
  for (let rx = cam; rx < cam + W; rx += 30) {
    ctx.beginPath();
    ctx.moveTo(rx, 440);
    ctx.lineTo(rx + 15, 442 + Math.sin(rx * 0.1) * 3);
    ctx.stroke();
  }
  // Floor top highlight
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(cam, 440, W, 6);

  // ── PLATFORMS ───────────────────────────────────────────
  MINE_PLATFORMS.forEach(p => {
    if (p.x + p.w < cam || p.x > cam + W) return;
    if (p.y > 430) return; // skip the ground platform — drawn above

    // Rock ledge body
    const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    grad.addColorStop(0, '#3a2e1e');
    grad.addColorStop(1, '#221810');
    ctx.fillStyle = grad;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Top edge highlight
    ctx.fillStyle = '#4a3828';
    ctx.fillRect(p.x, p.y, p.w, 3);

    // Underside drip effect
    ctx.fillStyle = '#1a1008';
    for (let dx = 4; dx < p.w - 4; dx += 20) {
      const dripH = 4 + Math.sin(p.x + dx) * 3;
      ctx.fillRect(p.x + dx, p.y + p.h, 5, dripH);
    }
  });

  // ── ORE NODES — embedded in platform face, drawn BELOW surface so player never collides ──
  MINE_NODES.forEach(n => {
    if (n.x + 40 < cam || n.x - 40 > cam + W) return;

    const ore = ORE_TYPES[n.type];
    const hpRatio = n.hp / n.maxHp;
    const NW = 32, NH = 24;
    // nx,ny = top-left of node block, sits just below platform surface (n.y)
    const nx = n.x - NW/2, ny = n.y + 1;

    if (n.depleted) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(nx+2, ny+2, NW-4, NH-4);
      ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 1;
      ctx.strokeRect(nx+2, ny+2, NW-4, NH-4);
      ctx.strokeStyle = 'rgba(80,60,30,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(nx+6, ny+4); ctx.lineTo(nx+16, ny+16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(nx+20, ny+6); ctx.lineTo(nx+10, ny+18); ctx.stroke();
      return;
    }

    ctx.save();

    // Rock face background — same dark rock tone as platform
    ctx.fillStyle = '#2e2216';
    ctx.fillRect(nx, ny, NW, NH);

    // Rock pixel texture
    const cols = ['#352818','#2a1e10','#302214','#382a1c','#2c1e12','#342616','#2e2018','#2a1c0e'];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillStyle = cols[(row*4+col) % cols.length];
        ctx.fillRect(nx + col*8, ny + row*8, 8, 8);
      }
    }

    // Ore pixel pattern — unique per type, centered in the block
    const pulse = 0.75 + Math.sin(minesFrame * 0.06) * 0.15;
    ctx.globalAlpha = pulse;

    // Each entry: [dx, dy] offset from node center (n.x, ny+NH/2), size 4x4
    const patterns = {
      stone:  [[0,-4],[4,0],[-4,0],[0,4],[4,-4],[-4,4]],
      coal:   [[-6,-4],[-2,-4],[2,-4],[6,-4],[-4,0],[0,0],[4,0],[-6,4],[-2,4],[2,4],[6,4]],
      tin:    [[-4,-4],[0,-4],[4,-4],[-6,0],[-2,0],[2,0],[6,0],[-4,4],[0,4],[4,4]],
      copper: [[-4,-6],[0,-6],[4,-6],[-6,-2],[-2,-2],[2,-2],[6,-2],[-4,2],[0,2],[4,2],[-6,6],[6,6]],
      iron:   [[-6,-6],[-2,-6],[2,-6],[6,-6],[-6,-2],[-2,-2],[2,-2],[6,-2],[-6,2],[-2,2],[2,2],[6,2],[-6,6],[-2,6],[2,6],[6,6]],
      scrap:  [[0,-2],[4,0],[-4,0],[0,4],[2,-4],[-2,4],[6,-2],[-6,2]],
      runic:  [[-6,-6],[0,-6],[6,-6],[-6,0],[0,0],[6,0],[-6,6],[0,6],[6,6]],
      void:   [[-4,-8],[4,-8],[0,-4],[-8,0],[-4,0],[4,0],[8,0],[0,4],[-4,8],[4,8]],
      mythic: [[-2,-8],[2,-8],[-8,-2],[-6,0],[-2,0],[2,0],[6,0],[8,-2],[-2,8],[2,8]],
    };
    const cx = n.x, cy = ny + NH/2;
    const pat = patterns[n.type] || patterns.stone;

    ctx.fillStyle = ore.color;
    pat.forEach(([dx,dy]) => ctx.fillRect(cx+dx-2, cy+dy-2, 4, 4));

    // Highlight specks
    ctx.fillStyle = ore.glow;
    pat.slice(0, Math.ceil(pat.length*0.35)).forEach(([dx,dy]) => ctx.fillRect(cx+dx-1, cy+dy-1, 2, 2));

    ctx.globalAlpha = 1;

    // Damage cracks
    if (hpRatio < 0.75) {
      ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(nx+8, ny+2); ctx.lineTo(nx+14, ny+14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(nx+20, ny+4); ctx.lineTo(nx+16, ny+12); ctx.stroke();
    }
    if (hpRatio < 0.4) {
      ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(nx+4, ny+10); ctx.lineTo(nx+18, ny+4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(nx+22, ny+12); ctx.lineTo(nx+8, ny+20); ctx.stroke();
    }

    // Subtle glow at top edge
    ctx.shadowColor = ore.glow;
    ctx.shadowBlur = 5 + Math.sin(minesFrame*0.05)*2;
    ctx.fillStyle = ore.glow;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(nx+4, ny, NW-8, 2);
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;

    ctx.restore();

    // Label — shown above platform surface, fades in when close
    const playerDist = Math.abs(mineChar.x - n.x);
    if (playerDist < 100) {
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(220,200,160,' + Math.min(1,(100-playerDist)/50).toFixed(2) + ')';
      ctx.textAlign = 'center';
      ctx.fillText(ore.label, n.x, n.y - 5);
    }

    // HP pips — below node inside platform face
    const pip = 5, total = n.maxHp;
    const barX = n.x - (total*pip)/2;
    for (let i = 0; i < total; i++) {
      ctx.fillStyle = i < n.hp ? ore.glow : 'rgba(40,30,20,0.5)';
      ctx.fillRect(barX + i*pip+1, ny+NH+2, pip-2, 3);
    }
  });

  // ── XP POPUPS (world-space, inside translate block) ──────
  minesPopups.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ffdd44';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
    p.y += p.vy;
    p.alpha -= 0.018;
  });
  // Clean up faded
  for (let i = minesPopups.length - 1; i >= 0; i--) {
    if (minesPopups[i].alpha <= 0) minesPopups.splice(i, 1);
  }

  // ── TORCH LIGHTS ────────────────────────────────────────
  [[200,440],[600,440],[1000,440],[1400,440],[1800,440],
   [350,345],[760,260],[1100,265],[1440,285],[1850,300]].forEach(([tx, ty]) => {
    if (tx + 100 < cam || tx - 100 > cam + W) return;
    // Torch stick
    ctx.fillStyle = '#6a4020';
    ctx.fillRect(tx - 2, ty - 30, 4, 20);
    // Flame
    const flicker = Math.sin(minesFrame * 0.18 + tx) * 3;
    ctx.save();
    ctx.shadowColor = '#ff8822'; ctx.shadowBlur = 20 + flicker * 4;
    ctx.fillStyle = `rgba(255,${140 + Math.round(flicker * 8)},20,0.9)`;
    ctx.beginPath();
    ctx.ellipse(tx, ty - 36 + flicker, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,230,80,0.7)';
    ctx.beginPath();
    ctx.ellipse(tx, ty - 34 + flicker, 2.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Warm light cone on ground
    const grd = ctx.createRadialGradient(tx, ty, 0, tx, ty, 120);
    grd.addColorStop(0, 'rgba(255,140,20,0.12)');
    grd.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(tx - 120, ty - 60, 240, 120);
  });

  ctx.restore();

  // ── MINE CHARACTER (screen space — after world translate ends) ───────────
  drawMineChar(ctx);

  // ── HUD OVERLAY ─────────────────────────────────────────
  // Exit tunnel at left edge — draw a visible opening
  ctx.save();
  ctx.fillStyle = '#1a1008';
  ctx.fillRect(0, 350, 90, 100); // tunnel opening
  ctx.fillStyle = '#6a4020';
  ctx.fillRect(0, 350, 5, 90); ctx.fillRect(60, 350, 5, 90); // frame sides
  ctx.fillRect(0, 350, 65, 5); // frame top
  ctx.fillStyle = '#ffcc44'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
  ctx.fillText('← EXIT', 8, 390);
  ctx.fillStyle = 'rgba(255,200,80,0.15)';
  ctx.fillRect(0, 355, 60, 85); // warm glow
  ctx.restore();

  // Back button
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(10, 10, 130, 32);
  ctx.strokeStyle = 'rgba(180,130,60,0.5)'; ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 130, 32);
  ctx.fillStyle = '#cc9944'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
  ctx.fillText('← LEAVE MINES', 20, 30);

  // Mining skill level
  const miningSkill = SKILLS.mining || { level: 1 };
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(W - 160, 10, 150, 32);
  ctx.strokeStyle = 'rgba(180,130,60,0.5)';
  ctx.strokeRect(W - 160, 10, 150, 32);
  ctx.fillStyle = '#ffcc44'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
  ctx.fillText(`⛏️ Mining Lv ${miningSkill.level}`, W - 148, 30);

  // ── Idle mode toggle badge (always visible) ──────────────
  {
    const il = getIdleLevel();
    const badgeW = 210, badgeH = 36, badgeX = W/2 - badgeW/2, badgeY = H - 50;
    ctx.save();

    if (idleMining) {
      // Glowing active state
      ctx.shadowColor = '#44ff88'; ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(0,40,10,0.88)';
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
    }
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.strokeStyle = idleMining ? '#44ff88' : 'rgba(180,130,60,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';
    if (idleMining) {
      // Show mode + level progress
      const xpBar = il.xp / il.nextAt;
      ctx.fillStyle = '#44ff88'; ctx.font = 'bold 11px monospace';
      ctx.fillText(`🤖 IDLE  Lv${il.level}  [F1 off]`, W/2, badgeY + 14);
      // XP bar
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(badgeX + 8, badgeY + 20, badgeW - 16, 6);
      ctx.fillStyle = '#33cc66';
      ctx.fillRect(badgeX + 8, badgeY + 20, (badgeW - 16) * Math.min(1, xpBar), 6);
      ctx.fillStyle = 'rgba(200,255,200,0.5)'; ctx.font = '8px monospace';
      ctx.fillText(`spd ×${il.speedMult.toFixed(2)}  yld ×${il.yieldMult.toFixed(2)}  swing ×${il.swingMult.toFixed(2)}`, W/2, badgeY + 34);
    } else {
      ctx.fillStyle = '#ccbb88'; ctx.font = '11px monospace';
      ctx.fillText('← → Move   Space Jump   E Mine', W/2, badgeY + 14);
      ctx.fillText('F1 — Toggle Auto-Mine', W/2, badgeY + 28);
    }
    ctx.restore();
  }

  // Nearby ore prompt — floats above the character's head
  if (mineChar.mineTimer <= 0) {
    const range = 70;
    MINE_NODES.forEach(n => {
      if (n.depleted) return;
      const dx = Math.abs(mineChar.x + mineChar.w/2 - n.x);
      const dy = Math.abs((mineChar.y + mineChar.h) - n.y);
      if (Math.hypot(dx, dy) < range) {
        // Prompt is drawn in screen space (after the outer ctx.restore at line 743)
        // so x must be n.x - cam to stay locked to the node
        const sx = n.x - cam;
        const by = n.y - 44; // y needs no offset (no y-translate was ever applied)
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(sx - 50, by - 18, 100, 18);
        ctx.fillStyle = '#ffee88'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText('[E] Mine ' + ORE_TYPES[n.type].label, sx, by - 4);
      }
    });
  }
}

// ── DRAW MINER CHARACTER ─────────────────────────────────────
function drawMineChar(ctx) {
  const cx = Math.round(mineChar.x - minesCamX);
  const cy = Math.round(mineChar.y);
  const f  = minesFrame;
  const facing = mineChar.facing;

  ctx.save();
  if (facing === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-cx * 2 - mineChar.w, 0);
  }

  let body    = '#e8b88a';
  let shirt   = '#4a3a2a'; // dark mining jacket
  const pants = '#2a2020';
  const boot  = '#1a1010';
  const hat   = '#3a2a1a'; // mining helmet
  const _mpcd = typeof playerCharData !== 'undefined' ? playerCharData : null;
  if (_mpcd) {
    if (_mpcd.skin) body = _mpcd.skin;
    if (_mpcd.type === 'alien')  body = '#55bb66';
    if (_mpcd.type === 'female') shirt = '#cc4488';
  }

  const action = mineChar.action;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(cx + 10, cy + mineChar.h + 1, 10, 4, 0, 0, Math.PI*2); ctx.fill();

  if (action === 'mine') {
    // Mining swing animation
    const swing = Math.sin(f * 0.4) * 0.5 + 0.5; // 0-1
    const armY  = Math.round(-8 + swing * 14);

    // Helmet
    ctx.fillStyle = hat;
    ctx.fillRect(cx + 4, cy, 14, 8);
    ctx.fillStyle = '#ffdd00'; // lamp
    ctx.fillRect(cx + 14, cy + 2, 5, 4);
    ctx.save(); ctx.shadowColor = '#ffdd00'; ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(255,220,0,0.6)';
    ctx.fillRect(cx + 14, cy + 2, 5, 4);
    ctx.restore();

    // Head
    ctx.fillStyle = body; ctx.fillRect(cx + 5, cy + 6, 12, 10);
    ctx.fillStyle = '#2c1810'; ctx.fillRect(cx + 7, cy + 11, 2, 2); ctx.fillRect(cx + 13, cy + 11, 2, 2);

    // Body
    ctx.fillStyle = shirt; ctx.fillRect(cx + 4, cy + 16, 14, 13);

    // Arms — right arm swinging pick
    ctx.fillStyle = shirt;
    ctx.fillRect(cx + 18, cy + 16 + armY, 5, 10);
    ctx.fillStyle = body;
    ctx.fillRect(cx + 18, cy + 26 + armY, 5, 4);
    // Left arm steady
    ctx.fillStyle = shirt; ctx.fillRect(cx - 1, cy + 18, 5, 10);
    ctx.fillStyle = body; ctx.fillRect(cx - 1, cy + 28, 5, 4);

    // Pickaxe in right hand
    ctx.fillStyle = '#6a4020'; // handle
    ctx.fillRect(cx + 14, cy + 20 + armY, 3, 14);
    ctx.fillStyle = '#aaaaaa'; // pick head
    ctx.fillRect(cx + 8, cy + 14 + armY, 14, 5);
    ctx.fillStyle = '#cccccc'; // pick tip
    ctx.fillRect(cx + 8, cy + 13 + armY, 3, 3);

    // Legs
    ctx.fillStyle = pants; ctx.fillRect(cx + 4, cy + 29, 14, 8);
    ctx.fillStyle = pants;
    ctx.fillRect(cx + 4, cy + 36, 7, 7);
    ctx.fillRect(cx + 12, cy + 36, 7, 7);
    ctx.fillStyle = boot;
    ctx.fillRect(cx + 3, cy + 42, 9, 4);
    ctx.fillRect(cx + 11, cy + 42, 9, 4);

    // Spark effect when swinging
    if (swing > 0.7) {
      ctx.fillStyle = '#ffcc00';
      for (let s = 0; s < 3; s++) {
        ctx.fillRect(cx + 6 + s * 3, cy + 18 + armY + s, 2, 2);
      }
    }

  } else if (action === 'walk') {
    const ls = Math.sin(f * 0.35) * 5;
    const as = Math.sin(f * 0.35) * 4;

    // Helmet
    ctx.fillStyle = hat; ctx.fillRect(cx + 4, cy, 14, 8);
    ctx.fillStyle = '#ffdd00'; ctx.fillRect(cx + 14, cy + 2, 5, 4);

    // Head
    ctx.fillStyle = body; ctx.fillRect(cx + 5, cy + 6, 12, 10);
    ctx.fillStyle = '#2c1810'; ctx.fillRect(cx + 7, cy + 11, 2, 2); ctx.fillRect(cx + 13, cy + 11, 2, 2);

    // Body
    ctx.fillStyle = shirt; ctx.fillRect(cx + 4, cy + 16, 14, 13);

    // Arms swinging
    ctx.fillStyle = shirt; ctx.fillRect(cx + 18, cy + 16 + as, 5, 10); ctx.fillRect(cx - 1, cy + 16 - as, 5, 10);
    ctx.fillStyle = body; ctx.fillRect(cx + 18, cy + 26 + as, 5, 4); ctx.fillRect(cx - 1, cy + 26 - as, 5, 4);

    // Legs
    ctx.fillStyle = pants; ctx.fillRect(cx + 4, cy + 29, 14, 8);
    ctx.fillStyle = pants; ctx.fillRect(cx + 4, cy + 36, 7, 8 + ls); ctx.fillRect(cx + 12, cy + 36, 7, 8 - ls);
    ctx.fillStyle = boot; ctx.fillRect(cx + 3, cy + 42 + ls, 9, 4); ctx.fillRect(cx + 11, cy + 42 - ls, 9, 4);

  } else if (action === 'jump') {
    // Helmet
    ctx.fillStyle = hat; ctx.fillRect(cx + 4, cy, 14, 8);
    ctx.fillStyle = '#ffdd00'; ctx.fillRect(cx + 14, cy + 2, 5, 4);

    // Head
    ctx.fillStyle = body; ctx.fillRect(cx + 5, cy + 6, 12, 10);
    ctx.fillStyle = '#2c1810'; ctx.fillRect(cx + 7, cy + 11, 2, 2); ctx.fillRect(cx + 13, cy + 11, 2, 2);

    // Body tucked
    ctx.fillStyle = shirt; ctx.fillRect(cx + 4, cy + 16, 14, 13);
    // Arms out wide
    ctx.fillStyle = shirt; ctx.fillRect(cx + 18, cy + 14, 6, 8); ctx.fillRect(cx - 2, cy + 14, 6, 8);
    ctx.fillStyle = body; ctx.fillRect(cx + 18, cy + 22, 6, 4); ctx.fillRect(cx - 2, cy + 22, 6, 4);

    // Legs tucked up
    ctx.fillStyle = pants; ctx.fillRect(cx + 4, cy + 29, 14, 8);
    ctx.fillStyle = pants; ctx.fillRect(cx + 3, cy + 36, 8, 6); ctx.fillRect(cx + 11, cy + 36, 8, 6);
    ctx.fillStyle = boot; ctx.fillRect(cx + 2, cy + 40, 10, 4); ctx.fillRect(cx + 10, cy + 40, 10, 4);

  } else {
    // Idle — slow breathe
    const sway = Math.round(Math.sin(f * 0.04) * 0.8);

    // Helmet
    ctx.fillStyle = hat; ctx.fillRect(cx + 4 + sway, cy, 14, 8);
    ctx.fillStyle = '#ffdd00'; ctx.fillRect(cx + 14 + sway, cy + 2, 5, 4);
    ctx.save(); ctx.shadowColor = '#ffdd00'; ctx.shadowBlur = 6;
    ctx.fillStyle = 'rgba(255,220,0,0.4)'; ctx.fillRect(cx + 14 + sway, cy + 2, 5, 4);
    ctx.restore();

    // Head
    ctx.fillStyle = body; ctx.fillRect(cx + 5 + sway, cy + 6, 12, 10);
    ctx.fillStyle = '#2c1810'; ctx.fillRect(cx + 7 + sway, cy + 11, 2, 2); ctx.fillRect(cx + 13 + sway, cy + 11, 2, 2);
    // Slight smile
    ctx.fillStyle = '#8b4513'; ctx.fillRect(cx + 8, cy + 14, 6, 1);

    // Body
    ctx.fillStyle = shirt; ctx.fillRect(cx + 4, cy + 16, 14, 13);
    // Arms resting, one holding pick at side
    ctx.fillStyle = shirt; ctx.fillRect(cx - 1, cy + 18, 5, 10); ctx.fillRect(cx + 18, cy + 18, 5, 10);
    ctx.fillStyle = body; ctx.fillRect(cx - 1, cy + 28, 5, 4); ctx.fillRect(cx + 18, cy + 28, 5, 4);

    // Pickaxe resting on shoulder
    ctx.fillStyle = '#6a4020'; ctx.fillRect(cx + 17, cy + 12, 3, 18);
    ctx.fillStyle = '#aaaaaa'; ctx.fillRect(cx + 12, cy + 8, 12, 5);

    // Legs
    ctx.fillStyle = pants; ctx.fillRect(cx + 4, cy + 29, 14, 8);
    ctx.fillStyle = pants; ctx.fillRect(cx + 4, cy + 36, 7, 8); ctx.fillRect(cx + 12, cy + 36, 7, 8);
    ctx.fillStyle = boot; ctx.fillRect(cx + 3, cy + 43, 9, 4); ctx.fillRect(cx + 11, cy + 43, 9, 4);
  }

  // Alien face overlay — drawn on top of everything, below the helmet
  if (_mpcd && _mpcd.type === 'alien') {
    const hx = cx + 5, hy = cy + 6;
    // Fill exposed head area with alien skin (helmet covers top 2 rows already)
    ctx.fillStyle = '#55bb66';
    ctx.fillRect(hx, hy + 2, 12, 8);
    // Big eyes
    ctx.fillStyle = '#000022';
    ctx.fillRect(hx + 1, hy + 3, 4, 5); ctx.fillRect(hx + 7, hy + 3, 4, 5);
    ctx.fillStyle = '#88ccff';
    ctx.fillRect(hx + 2, hy + 4, 2, 2); ctx.fillRect(hx + 8, hy + 4, 2, 2);
    // Mouth
    ctx.fillStyle = '#336644';
    ctx.fillRect(hx + 3, hy + 8, 6, 1);
  }

  ctx.restore();
}

// ── MAIN MINES LOOP ──────────────────────────────────────────
let minesLoopRunning = false;
function minesLoop() {
  if (!minesActive) { minesLoopRunning = false; return; }
  minesLoopRunning = true;
  minesFrame++;

  tickIdleMining();
  minesPhysics();
  minesCheckMine();
  tickMineNodes();

  // Mining XP while actively mining
  if (mineChar.action === 'mine' && minesFrame % 3 === 0) {
    gainXP('mining', 0.8);
  }
  // Agility for walking
  if (mineChar.action === 'walk' && minesFrame % 3 === 0) {
    gainXP('agility', 0.4);
  }

  drawMinesScene();

  // Keep speech/thought bubbles anchored over the mines character
  if (typeof positionBubbles === 'function') {
    positionBubbles(Math.round(mineChar.x - minesCamX) + mineChar.w / 2, mineChar.y);
  }

  requestAnimationFrame(minesLoop);
}

// ── INPUT ─────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!minesActive) return;
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') minesKeyLeft  = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') minesKeyRight = true;
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    minesKeyJump = true; e.preventDefault();
  }
  if (e.key === 'e' || e.key === 'E') { if (!idleMining) tryMineNearest(); }
  if (e.key === 'Escape') {
    if (typeof equipOpen !== 'undefined' && equipOpen) { closeEquip(); return; }
    if (typeof craftOpen !== 'undefined' && craftOpen) { closeCraft(); return; }
    if (typeof invOpen   !== 'undefined' && invOpen)   { closeInv();   return; }
    leaveMinesScene();
  }
  if (e.key === 'F1') {
    e.preventDefault();
    idleMining = !idleMining;
    idleTarget = null;
    idleWaitTimer = 0;
    minesKeyLeft = false; minesKeyRight = false;
    if (idleMining) addLog('🤖 idle mining ON');
    else            addLog('🎮 manual control');
  }
});
document.addEventListener('keyup', e => {
  if (!minesActive) return;
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') minesKeyLeft  = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') minesKeyRight = false;
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') minesKeyJump = false;
});

// Canvas click — back button only. Mining requires [E] key while standing next to node.
document.getElementById('minesCanvas').addEventListener('click', e => {
  if (!minesActive) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const scaleX = e.currentTarget.width / rect.width;
  const scaleY = e.currentTarget.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  // Back button only
  if (mx >= 10 && mx <= 140 && my >= 10 && my <= 42) { leaveMinesScene(); return; }
});
