// ════════════════════════════════════════════════════════════
// DOWNTOWN STRIP — Combat Training Zone
// Controls: ← → / WASD move · Space/W jump · E attack · Q block · Esc leave
// ════════════════════════════════════════════════════════════

let downtownActive = false;
let downtownFrame  = 0;
let dtLoopRunning  = false;
let dtKeyLeft = false, dtKeyRight = false, dtKeyJump = false, dtKeyBlock = false, dtKeyInteract = false;

// ── PORTAL LOCKED MODAL ────────────────────────────────────────
let dtPortalLockedOpen = false;

function showPortalLockedModal() {
  dtPortalLockedOpen = true;
  document.getElementById('dtPortalLockedOverlay').classList.add('open');
}
function hidePortalLockedModal() {
  dtPortalLockedOpen = false;
  document.getElementById('dtPortalLockedOverlay').classList.remove('open');
}
document.getElementById('dtPortalLockedDismiss').addEventListener('click', hidePortalLockedModal);

// ── COMBAT TUTORIAL ───────────────────────────────────────────
const DT_COMBAT_TUT_KEY = 'pixel_combat_tutorial_seen';
let dtCombatTutOpen = false;

function showCombatTutorial() {
  dtCombatTutOpen = true;
  document.getElementById('combatTutorialOverlay').classList.add('open');
}

function hideCombatTutorial() {
  dtCombatTutOpen = false;
  document.getElementById('combatTutorialOverlay').classList.remove('open');
  localStorage.setItem(DT_COMBAT_TUT_KEY, '1');
}

document.getElementById('combatTutorialDismiss').addEventListener('click', hideCombatTutorial);

// ── COMBAT SKILL ─────────────────────────────────────────────
if (!SKILLS.combat) {
  SKILLS.combat = { name:'Combat', emoji:'⚔️', color:'#ff4444', xp:0, level:1, action:'fight' };
}

// ── PLAYER STATE ──────────────────────────────────────────────
// action: 'idle' | 'walk' | 'jump' | 'attack' | 'block' | 'hurt' | 'dead'
// atkFrame: 0-21 during attack  (0-5 windup · 6-13 active · 14-21 recovery)
// hitFired: flag — hit dealt once per swing in active window
const dtChar = {
  x: 80, y: 380,
  vx: 0, vy: 0, kbVx: 0,
  w: 20, h: 32,
  onGround: false,
  facing: 1,
  action: 'idle',
  hp: 100, maxHp: 100,
  atkFrame:   -1,   // -1 = not attacking
  hitFired:  false,
  atkCooldown: 0,   // frames before next attack allowed
  hurtTimer:   0,   // invincibility + stagger frames
  deathTimer:  0,
  blocking:   false,
  blockAnim:  0,    // 0-8 shield-raise animation progress
};

// ── SCENE ─────────────────────────────────────────────────────
let dtCamX = 0;
let dtScreenShake = 0;  // frames of screen shake remaining
let dtHitStop     = 0;  // frames of hit-stop (pause physics on clean hit)

const DOWNTOWN_W  = 2200;
const DT_GRAVITY  = 0.55;
const DT_JUMP     = -11;
const DT_SPEED    = 3.2;

// Attack phases (atkFrame ranges)
const ATK_WINDUP   = 6;   // frames 0-5: committing, no hit yet
const ATK_ACTIVE   = 14;  // frames 6-13: hitbox live — hit fires at frame 6
const ATK_RECOVERY = 22;  // frames 14-21: returning, vulnerable
const ATK_COOLDOWN = 10;  // frames after animation before next attack

// ── PLATFORMS ────────────────────────────────────────────────
const DT_PLATFORMS = [
  { x:    0, y: 440, w: 2200, h: 20 },
  { x:   50, y: 365, w: 150,  h: 14 },
  { x:  100, y: 295, w: 200,  h: 14 },
  { x:  370, y: 250, w: 170,  h: 14 },
  { x:  555, y: 320, w:  60,  h: 10 },
  { x:  675, y: 205, w: 155,  h: 14 },
  { x:  890, y: 265, w:  60,  h: 10 },
  { x:  975, y: 305, w: 175,  h: 14 },
  { x: 1195, y: 235, w: 130,  h: 14 },
  { x: 1355, y: 355, w: 155,  h: 14 },
  { x: 1575, y: 285, w: 175,  h: 14 },
  { x: 1775, y: 225, w: 135,  h: 14 },
  { x: 1935, y: 360, w:  60,  h: 10 },
  { x: 1995, y: 315, w: 175,  h: 14 },
];

// ── ENEMIES ───────────────────────────────────────────────────
// state: 'patrol' | 'aggro' | 'windup' | 'attack' | 'stagger' | 'dead'
// windupTimer: telegraph before swing (enemy freezes and glows)
// staggerTimer: brief stun after being hit
// kbVx: knockback x velocity
const DT_ENEMIES = [
  { x:  320, y: 440, platY: 440, platX0:  150, platX1:  550, hp: 120, maxHp: 120, state:'patrol', facing:  1, kbVx: 0, w: 18, h: 32, atkCd: 0, windupTimer: 0, staggerTimer: 0, respawnTimer: 0 },
  { x:  780, y: 440, platY: 440, platX0:  550, platX1: 1000, hp: 120, maxHp: 120, state:'patrol', facing: -1, kbVx: 0, w: 18, h: 32, atkCd: 0, windupTimer: 0, staggerTimer: 0, respawnTimer: 0 },
  { x: 1490, y: 440, platY: 440, platX0: 1000, platX1: 1600, hp: 150, maxHp: 150, state:'patrol', facing:  1, kbVx: 0, w: 18, h: 32, atkCd: 0, windupTimer: 0, staggerTimer: 0, respawnTimer: 0 },
  { x: 1880, y: 440, platY: 440, platX0: 1600, platX1: 2200, hp: 150, maxHp: 150, state:'patrol', facing: -1, kbVx: 0, w: 18, h: 32, atkCd: 0, windupTimer: 0, staggerTimer: 0, respawnTimer: 0 },
  { x:  160, y: 295, platY: 295, platX0:  100, platX1:  300, hp: 100, maxHp: 100, state:'patrol', facing:  1, kbVx: 0, w: 18, h: 32, atkCd: 0, windupTimer: 0, staggerTimer: 0, respawnTimer: 0 },
  { x: 1005, y: 305, platY: 305, platX0:  975, platX1: 1150, hp: 140, maxHp: 140, state:'patrol', facing:  1, kbVx: 0, w: 18, h: 32, atkCd: 0, windupTimer: 0, staggerTimer: 0, respawnTimer: 0 },
  { x: 1610, y: 285, platY: 285, platX0: 1575, platX1: 1750, hp: 160, maxHp: 160, state:'patrol', facing:  1, kbVx: 0, w: 18, h: 32, atkCd: 0, windupTimer: 0, staggerTimer: 0, respawnTimer: 0 },
];

const dtPopups = [];

// ── BOSS PORTAL ────────────────────────────────────────────────
const dtPortal = { x: 2110, y: 408, w: 30, h: 32 };
let dtPortalUsed           = false;
let dtPortalInteractPrompt = false;

// Called by bossarena.js on arena exit — resets so a new Warden's Summon is required.
function dtResetPortal() { dtPortalUsed = false; }

// Portal should be visible (and interactive) during warden_call AND downtown_warden
function dtPortalShouldShow() {
  if (typeof questState === 'undefined') return false;
  return questState?.warden_call?.status === 'active' ||
         questState?.downtown_warden?.status === 'active';
}

// Street tags drop while warden_call is active OR after downtown_warden is complete (for re-runs)
function dtTagDropActive() {
  if (typeof questState === 'undefined') return false;
  return questState?.warden_call?.status === 'active' ||
         questState?.downtown_warden?.status === 'completed';
}

// ── COMBAT TUNING ─────────────────────────────────────────────
const DT_AGGRO_RANGE    = 130;
const DT_ATTACK_RANGE   =  44;
const DT_ENEMY_SPEED    = 1.1;
const DT_ENEMY_CHASE    = 1.7;
const DT_ENEMY_DMG      =  14;   // base damage
const DT_ENEMY_WINDUP   =  22;   // telegraph frames before hit lands
const DT_ENEMY_ATK_CD   =  70;   // frames between enemy attacks
const DT_ENEMY_XP       =  40;
const DT_ENEMY_RESPAWN  = 600;
const DT_PLAYER_REACH   =  56;
const DT_PLAYER_DMG_LO  =  10;
const DT_PLAYER_DMG_HI  =  18;
const DT_BLOCK_CHIP     = 0.12;  // fraction of damage that passes through block
const DT_KNOCKBACK      =   5;   // px/frame knockback impulse

// ── ENTER / LEAVE ─────────────────────────────────────────────
function enterDowntownScene() {
  try {
    downtownActive = true;
    downtownFrame  = 0;
    dtScreenShake  = 0;
    dtHitStop      = 0;

    // Sync maxHp from equipment before resetting HP
    if (typeof updateCombatStats === 'function') updateCombatStats();

    Object.assign(dtChar, {
      x:80, y:380, vx:0, vy:0, kbVx:0,
      onGround:false, facing:1, action:'idle',
      hp:dtChar.maxHp, atkFrame:-1, hitFired:false,
      atkCooldown:0, hurtTimer:0, deathTimer:0,
      blocking:false, blockAnim:0,
    });
    dtKeyLeft = false; dtKeyRight = false; dtKeyJump = false; dtKeyBlock = false; dtKeyInteract = false;
    dtCamX = 0;
    dtPopups.length = 0;
    dtPortalInteractPrompt = false;

    DT_ENEMIES.forEach(e => {
      e.hp = e.maxHp; e.state = 'patrol'; e.respawnTimer = 0;
      e.atkCd = 0; e.windupTimer = 0; e.staggerTimer = 0;
      e.kbVx = 0; e.y = e.platY;
    });

    document.getElementById('downtownScene').style.display = 'block';
    document.getElementById('scroll').style.display = 'none';
    document.getElementById('char').style.display   = 'none';

    char.loc = 'street'; char.action = 'idle';
    updateHUD();
    addLog('⚔️ entered Downtown Strip');

    setTimeout(async () => {
      const r = await callAI('You just stepped into the downtown strip at night. Neon signs, graffiti, and trouble around every corner. React in 1 sentence.', true);
      if (r) showSpeech(r, 6000, true);
    }, 600);

    if (!localStorage.getItem(DT_COMBAT_TUT_KEY)) {
      setTimeout(showCombatTutorial, 600);
    }

    if (!dtLoopRunning) requestAnimationFrame(downtownLoop);
  } catch(err) {
    console.error('enterDowntownScene failed:', err);
    leaveDowntownScene();
  }
}

function leaveDowntownScene() {
  downtownActive = false;
  document.getElementById('downtownScene').style.display = 'none';
  document.getElementById('scroll').style.display = 'block';
  document.getElementById('char').style.display   = 'block';
  char.action = 'idle'; char.moving = false;
  char.loc = 'street'; char.wx = 1950; char.tx = 1950;
  updateCamera();
  addLog('🚶 left downtown strip');
}

// ── PHYSICS ───────────────────────────────────────────────────
function dtPhysics() {
  // Apply knockback decay
  dtChar.kbVx *= 0.75;
  dtChar.x += dtChar.vx + dtChar.kbVx;
  dtChar.x = Math.max(0, Math.min(DOWNTOWN_W - dtChar.w, dtChar.x));

  dtChar.vy += DT_GRAVITY;
  dtChar.y  += dtChar.vy;

  dtChar.onGround = false;
  const cx = dtChar.x + dtChar.w / 2;
  for (const p of DT_PLATFORMS) {
    if (cx > p.x && cx < p.x + p.w) {
      const feet = dtChar.y + dtChar.h;
      if (feet >= p.y && feet <= p.y + p.h + Math.abs(dtChar.vy) + 2 && dtChar.vy >= 0) {
        dtChar.y = p.y - dtChar.h;
        dtChar.vy = 0;
        dtChar.onGround = true;
        break;
      }
    }
  }

  const targetCam = Math.max(0, Math.min(DOWNTOWN_W - 1100, dtChar.x - 400));
  dtCamX += (targetCam - dtCamX) * 0.1;
}

// ── PLAYER ATTACK LOGIC ───────────────────────────────────────
function dtPlayerAttack() {
  if (dtChar.action === 'dead') return;
  if (dtChar.action === 'block') return;
  if (dtChar.atkFrame >= 0) return;       // already swinging
  if (dtChar.atkCooldown > 0) return;
  if (!playerEquip?.weapon) { addLog('⚔️ Equip a weapon first!'); return; }

  dtChar.atkFrame  = 0;
  dtChar.hitFired  = false;
  dtChar.action    = 'attack';

  // Small forward lunge on attack
  dtChar.kbVx = dtChar.facing * 2.5;
}

// Called each frame during active window to check for hits
function dtCheckHit() {
  const px = dtChar.x + dtChar.w / 2;
  for (const e of DT_ENEMIES) {
    if (e.state === 'dead' || e.state === 'stagger') continue;
    const ex   = e.x + e.w / 2;
    const dist = Math.abs(px - ex);
    const dyOk = Math.abs(dtChar.y - e.y) < 52;
    const inFront = dtChar.facing === 1 ? ex > dtChar.x - 8 : ex < dtChar.x + dtChar.w + 8;

    if (dist < DT_PLAYER_REACH && dyOk && inFront) {
      const eqStats  = (typeof getEquipStats === 'function') ? getEquipStats() : {};
      const eqAtk    = eqStats.rawDmg       || 0;
      const fateful  = eqStats.fatefulStrike || 0;
      let dmg = DT_PLAYER_DMG_LO + Math.floor(Math.random() * (DT_PLAYER_DMG_HI - DT_PLAYER_DMG_LO + 1)) + eqAtk;
      // Fateful Strike crit: 3% per point, 1.5× damage
      const isCrit = fateful > 0 && Math.random() < fateful * 0.03;
      if (isCrit) dmg = Math.round(dmg * 1.5);
      e.hp -= dmg;
      // Knockback enemy away from player
      e.kbVx = dtChar.facing * DT_KNOCKBACK;
      // Stagger enemy briefly
      if (e.state !== 'dead') { e.staggerTimer = 12; e.state = 'stagger'; }
      // Hit-stop — brief freeze for impact feel
      dtHitStop = 4;
      const hitColor = isCrit ? '#ff8844' : '#ffee44';
      const hitText  = isCrit ? `CRIT -${dmg}` : `-${dmg}`;
      dtPopups.push({ x: e.x + e.w / 2, y: e.y - 14, text: hitText, alpha: 1, vy: -1.5, color: hitColor });

      if (e.hp <= 0) {
        e.state = 'dead';
        e.respawnTimer = DT_ENEMY_RESPAWN;
        gainXP('combat', DT_ENEMY_XP);
        // Luck widens coin drop range
        const coinBonus = Math.floor(fateful / 2);
        const coins = 3 + Math.floor(Math.random() * (6 + coinBonus));
        addMoney(coins);
        dtPopups.push({ x: e.x + e.w / 2, y: e.y - 30, text: `+${DT_ENEMY_XP} Combat`, alpha: 1, vy: -0.9, color: '#44ffaa' });
        dtPopups.push({ x: e.x + e.w / 2, y: e.y - 46, text: `+$${coins}`, alpha: 1, vy: -0.8, color: '#ffd700' });
        addLog(`⚔️ +${DT_ENEMY_XP} xp  +$${coins}`);
        // street_tag drop (40%) while player is farming for the Warden's Summon
        if (dtTagDropActive() && Math.random() < 0.40) {
          if (typeof invAddItem === 'function') invAddItem('street_tag', 1);
          dtPopups.push({ x: e.x + e.w / 2, y: e.y - 60, text: `+1 Street Tag`, alpha: 1, vy: -0.65, color: '#cc88ff' });
        }
        if (typeof advanceObjective === 'function')
          advanceObjective('street_brawler', 'kill_enemies', 1);
      }
    }
  }

}

// ── DRAW PORTAL ────────────────────────────────────────────────
function dtDrawPortal(ctx, cam) {
  const f  = downtownFrame;
  const px = dtPortal.x - cam + 15;
  const py = dtPortal.y  + 16;

  // Outer ambient glow
  const glow = ctx.createRadialGradient(px, py, 2, px, py, 42);
  glow.addColorStop(0, 'rgba(160,60,255,0.32)');
  glow.addColorStop(1, 'rgba(60,0,160,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(px - 44, py - 44, 88, 88);

  // Dark interior
  ctx.save();
  ctx.translate(px, py);
  ctx.globalAlpha = 0.55 + Math.sin(f * 0.08) * 0.15;
  ctx.fillStyle = '#11002a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Spinning ring segments
  ctx.globalAlpha = 1;
  const spin = (f * 0.04) % (Math.PI * 2);
  for (let i = 0; i < 8; i++) {
    const ang = spin + (i / 8) * Math.PI * 2;
    const rx  = Math.cos(ang) * 18;
    const ry  = Math.sin(ang) * 22;
    const a   = 0.45 + Math.sin(ang + f * 0.1) * 0.3;
    const r   = 150 + Math.floor(Math.sin(ang) * 60);
    ctx.fillStyle = `rgba(${r},70,255,${a})`;
    ctx.beginPath();
    ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Portal rim
  ctx.strokeStyle = '#aa44ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#aa44ff'; ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 20, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Label
  ctx.fillStyle = '#cc88ff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#9933ff'; ctx.shadowBlur = 6;
  ctx.fillText('PORTAL', px, dtPortal.y - 6);
  ctx.shadowBlur = 0;

  // Interact prompt — different text depending on whether sigil was already used
  if (dtPortalInteractPrompt) {
    const promptTxt = dtPortalUsed ? '[F] Re-enter Arena' : '[F] Use Warden\'s Summon';
    const promptW   = dtPortalUsed ? 88 : 108;
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(px - promptW / 2 - 2, dtPortal.y - 28, promptW + 4, 16);
    ctx.fillStyle = '#ffee88';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(promptTxt, px, dtPortal.y - 16);
  }
}

// ── ENEMY AI TICK ─────────────────────────────────────────────
function tickEnemies() {
  for (const e of DT_ENEMIES) {
    if (e.state === 'dead') {
      e.respawnTimer--;
      if (e.respawnTimer <= 0) {
        e.hp = e.maxHp; e.state = 'patrol'; e.y = e.platY;
        e.atkCd = 0; e.windupTimer = 0; e.staggerTimer = 0; e.kbVx = 0;
      }
      continue;
    }

    // Apply enemy knockback
    e.kbVx *= 0.7;
    e.x += e.kbVx;
    e.x = Math.max(e.platX0, Math.min(e.platX1 - e.w, e.x));

    // Stagger state — briefly stunned
    if (e.state === 'stagger') {
      e.staggerTimer--;
      if (e.staggerTimer <= 0) e.state = 'aggro';
      continue;
    }

    if (e.atkCd > 0) e.atkCd--;

    const px   = dtChar.x + dtChar.w / 2;
    const ex   = e.x + e.w / 2;
    const dist = Math.abs(px - ex);
    const sameLevel = Math.abs((dtChar.y + dtChar.h) - e.platY) < 55;

    if (e.state === 'patrol') {
      e.x += e.facing * DT_ENEMY_SPEED;
      if (e.x <= e.platX0)         e.facing =  1;
      if (e.x + e.w >= e.platX1)   e.facing = -1;
      e.x = Math.max(e.platX0, Math.min(e.platX1 - e.w, e.x));

      if (dist < DT_AGGRO_RANGE && sameLevel && dtChar.action !== 'dead') {
        e.state = 'aggro';
      }

    } else if (e.state === 'aggro') {
      if (dtChar.action === 'dead' || dist > DT_AGGRO_RANGE * 1.6 || !sameLevel) {
        e.state = 'patrol';
      } else if (dist < DT_ATTACK_RANGE && e.atkCd <= 0) {
        // Begin attack telegraph (windup)
        e.state = 'windup';
        e.windupTimer = DT_ENEMY_WINDUP;
        e.facing = px > ex ? 1 : -1;
      } else {
        const dir = px > ex ? 1 : -1;
        e.facing = dir;
        e.x += dir * DT_ENEMY_CHASE;
        e.x = Math.max(e.platX0, Math.min(e.platX1 - e.w, e.x));
      }

    } else if (e.state === 'windup') {
      // Enemy freezes and telegraphs attack — player can block or dodge
      e.windupTimer--;
      if (e.windupTimer <= 0) {
        e.state = 'attack';
      }

    } else if (e.state === 'attack') {
      // Hit resolves this frame
      if (dist < DT_ATTACK_RANGE * 1.4 && sameLevel && dtChar.action !== 'dead' && dtChar.hurtTimer <= 0) {
        if (dtChar.blocking) {
          // Blocked — chip damage only
          const chip = Math.max(1, Math.round(DT_ENEMY_DMG * DT_BLOCK_CHIP));
          dtChar.hp = Math.max(0, dtChar.hp - chip);
          dtPopups.push({ x: dtChar.x + dtChar.w / 2, y: dtChar.y - 18, text: `BLOCKED`, alpha: 1, vy: -1.0, color: '#44aaff' });
          if (chip > 0) dtPopups.push({ x: dtChar.x + dtChar.w / 2, y: dtChar.y - 4,  text: `-${chip}`,    alpha: 1, vy: -0.8, color: '#aaddff' });
          // Shield bash shoves enemy back
          e.kbVx = -e.facing * 3;
          e.state = 'aggro';
          e.atkCd = DT_ENEMY_ATK_CD;
        } else {
          // Full hit — mitigated by hardiness + allResist
          const eqStats  = (typeof getEquipStats === 'function') ? getEquipStats() : { hardiness:0, allResist:0 };
          const rawHit   = DT_ENEMY_DMG + Math.floor(Math.random() * 5) - 2;
          const defMit   = Math.floor((eqStats.hardiness || 0) / 4); // -1 dmg per 4 hardiness
          const resist   = 1 - Math.min(0.80, (eqStats.allResist || 0) / 100);
          const dmg      = Math.max(1, Math.round((rawHit - defMit) * resist));
          dtChar.hp = Math.max(0, dtChar.hp - dmg);
          dtChar.hurtTimer = 45;
          dtChar.kbVx = -e.facing * DT_KNOCKBACK * 0.8;
          dtScreenShake = 10;
          dtPopups.push({ x: dtChar.x + dtChar.w / 2, y: dtChar.y - 10, text: `-${dmg}`, alpha: 1, vy: -1.2, color: '#ff4444' });
          if (dtChar.hp <= 0) {
            dtChar.action = 'dead';
            dtChar.deathTimer = 120;
            addLog('💀 knocked out — respawning');
          }
        }
      }
      e.atkCd   = DT_ENEMY_ATK_CD;
      e.state   = 'aggro';
    }
  }
}

// ── CONTROLS ──────────────────────────────────────────────────
document.addEventListener('keydown', ev => {
  if (!downtownActive) return;
  if (ev.key === 'ArrowLeft'  || ev.key === 'a' || ev.key === 'A') { dtKeyLeft  = true; ev.preventDefault(); }
  if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') { dtKeyRight = true; ev.preventDefault(); }
  if (ev.key === 'ArrowUp' || ev.key === ' ' || ev.key === 'w' || ev.key === 'W') { dtKeyJump = true; ev.preventDefault(); }
  if (ev.key === 'e' || ev.key === 'E') { dtPlayerAttack(); ev.preventDefault(); }
  if (ev.key === 'q' || ev.key === 'Q') { dtKeyBlock = true; ev.preventDefault(); }
  if (ev.key === 'f' || ev.key === 'F') {
    ev.preventDefault();
    // Handle portal directly — don't wait for game loop round-trip
    const charMidX   = dtChar.x + dtChar.w / 2;
    const portalMidX = dtPortal.x + dtPortal.w / 2;
    if (Math.abs(charMidX - portalMidX) < 90 && dtChar.action !== 'dead') {
      if (dtPortalUsed) {
        addLog('🌀 Re-entering the Warden\'s Arena...');
        if (typeof enterBossArena === 'function') enterBossArena();
      } else {
        const sigIdx = typeof playerInv !== 'undefined'
          ? playerInv.findIndex(s => s && s.id === 'warden_sigil') : -1;
        if (sigIdx >= 0) {
          playerInv.splice(sigIdx, 1);
          dtPortalUsed = true;
          if (typeof renderInv === 'function') renderInv();
          if (typeof advanceObjective === 'function')
            advanceObjective('warden_call', 'use_portal', 1);
          addLog('🌀 Entering the Warden\'s Arena...');
          if (typeof enterBossArena === 'function') enterBossArena();
        } else {
          // No sigil — show blocking modal
          const overlay = document.getElementById('dtPortalLockedOverlay');
          if (overlay) { overlay.classList.add('open'); dtPortalLockedOpen = true; }
        }
      }
    } else {
      dtKeyInteract = true; // not near portal — let game loop handle other F interactions
    }
  }
  if (ev.key === 'Escape') {
    if (dtPortalLockedOpen) { hidePortalLockedModal(); return; }
    if (typeof equipOpen !== 'undefined' && equipOpen) { closeEquip(); return; }
    if (typeof craftOpen !== 'undefined' && craftOpen) { closeCraft(); return; }
    if (typeof invOpen   !== 'undefined' && invOpen)   { closeInv();   return; }
    leaveDowntownScene();
  }
});

document.addEventListener('keyup', ev => {
  if (!downtownActive) return;
  if (ev.key === 'ArrowLeft'  || ev.key === 'a' || ev.key === 'A') dtKeyLeft  = false;
  if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') dtKeyRight = false;
  if (ev.key === 'ArrowUp' || ev.key === ' ' || ev.key === 'w' || ev.key === 'W') dtKeyJump = false;
  if (ev.key === 'q' || ev.key === 'Q') dtKeyBlock = false;
  if (ev.key === 'f' || ev.key === 'F') dtKeyInteract = false;
});

// ── DRAW SWORD (world-space helper) ───────────────────────────
// Draws the equipped sword sprite extending from armX/armY, angled by swingAngle.
// Falls back to pixel-rect sword if the sprite isn't ready.
const _DT_SWORD_IDS = ['t1_sword','t2_sword','ig_sword','t4_sword',
                        't5_sword','t6_sword','t7_sword','t8_sword'];

function drawSword(ctx, armX, armY, swingAngle, facing) {
  ctx.save();
  // +22px lower in screen space BEFORE rotation — symmetric for both facing directions
  ctx.translate(armX, armY + 22);
  ctx.rotate(swingAngle * facing);

  const sheet = typeof _swordSheet !== 'undefined' ? _swordSheet : null;
  const weaponId = (typeof playerEquip !== 'undefined') ? playerEquip?.weapon?.id : null;
  const row = Math.max(0, _DT_SWORD_IDS.indexOf(weaponId || 't1_sword'));
  const CW = typeof _SWORD_CW !== 'undefined' ? _SWORD_CW : 203;
  const CH = typeof _SWORD_CH !== 'undefined' ? _SWORD_CH : 53.5;

  if (sheet && sheet.complete && sheet.naturalWidth) {
    // Rotate −90° so the sprite's long axis (203px) aligns with the blade direction (−y = upward)
    ctx.rotate(-Math.PI / 2);
    // Scale by tier: T1 = 1.0×, T8 (mythic) = 2.0×, linear between
    const tierScale = 1.0 + (row / 7) * 1.0;
    const dw = Math.round(62 * tierScale);   // blade length (upward)
    const dh = Math.round(22 * tierScale);   // sword width
    ctx.imageSmoothingEnabled = false;
    // x=0 → sprite left (hilt) = hand position; x=dw → blade tip extends upward
    ctx.drawImage(sheet, 0, Math.round(row * CH), CW, Math.round(CH),
      0, -dh / 2, dw, dh);
  } else {
    // Fallback pixel-rect sword
    ctx.fillStyle = '#7a5533'; ctx.fillRect(-2, 0, 5, 5);
    ctx.fillStyle = '#bbaa44'; ctx.fillRect(-5, 3, 11, 3);
    ctx.fillStyle = '#d4d4d8'; ctx.fillRect(-1, -14, 3, 14);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -14, 1, 4);
  }

  ctx.restore();
}

// ── DRAW SHIELD (world-space helper) ─────────────────────────
function drawShield(ctx, sx, sy, raised) {
  const offY = raised ? -6 : 0;
  // Shield body
  ctx.fillStyle = '#2244aa';
  ctx.fillRect(sx - 1, sy + offY, 8, 11);
  // Metal rim
  ctx.strokeStyle = '#99aacc';
  ctx.lineWidth = 1;
  ctx.strokeRect(sx - 1, sy + offY, 8, 11);
  // Boss (center stud)
  ctx.fillStyle = '#ccddff';
  ctx.fillRect(sx + 2, sy + 3 + offY, 3, 3);
}

// ── DRAW SCENE ────────────────────────────────────────────────
function drawDowntownScene() {
  const canvas = document.getElementById('downtownCanvas');
  const ctx    = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Screen shake offset
  const shakeX = dtScreenShake > 0 ? (Math.random() * 6 - 3) : 0;
  const shakeY = dtScreenShake > 0 ? (Math.random() * 4 - 2) : 0;
  const cam = Math.round(dtCamX) - shakeX;

  // ── SKY ───────────────────────────────────────────────────────
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#070714');
  sky.addColorStop(0.55, '#110e24');
  sky.addColorStop(1, '#1c1230');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Stars
  for (let i = 0; i < 55; i++) {
    const sx    = ((i * 139 + 22) % 2200) - cam * 0.05;
    const sy    = (i * 57 + 8) % 160;
    const blink = Math.sin(downtownFrame * 0.025 + i * 1.3) * 0.35 + 0.65;
    ctx.globalAlpha = blink * 0.45;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx % W, sy, 1, 1);
  }
  ctx.globalAlpha = 1;

  // ── BACKGROUND BUILDINGS ─────────────────────────────────────
  const bgBuildings = [
    { x:    0, w: 270, h: 310 }, { x:  255, w: 195, h: 275 },
    { x:  440, w: 155, h: 350 }, { x:  585, w: 235, h: 295 },
    { x:  810, w: 195, h: 335 }, { x:  995, w: 175, h: 305 },
    { x: 1165, w: 215, h: 365 }, { x: 1375, w: 195, h: 285 },
    { x: 1565, w: 235, h: 325 }, { x: 1795, w: 195, h: 355 },
    { x: 1985, w: 215, h: 295 },
  ];
  ctx.fillStyle = '#0b0b1e';
  bgBuildings.forEach(b => ctx.fillRect(b.x - cam * 0.28, H - b.h, b.w, b.h));
  bgBuildings.forEach(b => {
    const bx = b.x - cam * 0.28;
    for (let row = 0; row < Math.floor(b.h / 28) - 1; row++) {
      for (let col = 0; col < Math.floor(b.w / 22) - 1; col++) {
        if (((b.x + row * 11 + col * 7) % 3) === 0) continue;
        const w = (b.x + row + col) % 3;
        ctx.fillStyle = w === 0 ? 'rgba(255,220,120,0.16)' : w === 1 ? 'rgba(120,160,255,0.14)' : 'rgba(255,150,70,0.12)';
        ctx.fillRect(bx + 5 + col * 22, H - b.h + 8 + row * 28, 14, 18);
      }
    }
  });

  // ── NEON SIGNS ────────────────────────────────────────────────
  const neons = [
    { x:  130, y: 352, text: 'BAR',   color: '#ff2266' },
    { x:  440, y: 300, text: 'PIZZA', color: '#ff8800' },
    { x:  710, y: 345, text: 'PAWN',  color: '#44ffcc' },
    { x: 1060, y: 318, text: '24H',   color: '#ffff44' },
    { x: 1410, y: 365, text: 'GYM',   color: '#4488ff' },
    { x: 1660, y: 295, text: 'CLUB',  color: '#cc44ff' },
    { x: 1960, y: 332, text: 'HOTEL', color: '#ff5555' },
  ];
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  neons.forEach(n => {
    const nx      = n.x - cam;
    const flicker = Math.sin(downtownFrame * 0.07 + n.x) > -0.88 ? 1 : 0.15;
    ctx.globalAlpha = flicker;
    ctx.shadowColor = n.color; ctx.shadowBlur = 14;
    ctx.fillStyle = n.color;
    ctx.fillText(n.text, nx, n.y);
  });
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;

  // ── PLATFORMS ─────────────────────────────────────────────────
  DT_PLATFORMS.forEach(p => {
    const px = p.x - cam;
    if (p.y === 440) {
      const st = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      st.addColorStop(0, '#272733'); st.addColorStop(1, '#191922');
      ctx.fillStyle = st;
      ctx.fillRect(px, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(px, p.y, p.w, 2);
    } else if (p.h === 10) {
      ctx.fillStyle = '#2e2e3c';
      ctx.fillRect(px, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,170,60,0.35)';
      ctx.fillRect(px, p.y, p.w, 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
      for (let gx = 0; gx < p.w; gx += 8) {
        ctx.beginPath(); ctx.moveTo(px + gx, p.y); ctx.lineTo(px + gx, p.y + p.h); ctx.stroke();
      }
    } else {
      const rt = ctx.createLinearGradient(0, p.y, 0, H);
      rt.addColorStop(0, '#222230'); rt.addColorStop(0.04, '#1a1a26'); rt.addColorStop(1, '#0f0f18');
      ctx.fillStyle = rt;
      ctx.fillRect(px, p.y, p.w, H - p.y);
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      ctx.fillRect(px, p.y, p.w, 3);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
      for (let row = 1; row < 5; row++) {
        ctx.beginPath(); ctx.moveTo(px, p.y + p.h + row * 18); ctx.lineTo(px + p.w, p.y + p.h + row * 18); ctx.stroke();
      }
    }
  });

  // ── STREETLIGHTS ──────────────────────────────────────────────
  [200, 540, 890, 1240, 1590, 1940].forEach(lx => {
    const sx = lx - cam;
    ctx.fillStyle = '#2e2e40';
    ctx.fillRect(sx - 2, 344, 4, 96);
    ctx.fillRect(sx - 22, 344, 22, 3);
    const glow = ctx.createRadialGradient(sx - 22, 344, 0, sx - 22, 344, 58);
    glow.addColorStop(0, 'rgba(255,215,90,0.28)');
    glow.addColorStop(1, 'rgba(255,215,90,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - 82, 306, 118, 78);
    ctx.fillStyle = '#ffe888';
    ctx.fillRect(sx - 24, 341, 7, 7);
  });

  // ── GRAFFITI ──────────────────────────────────────────────────
  const tags = [
    { x:   55, y: 432, text: 'ZONE51', color: '#ff44aa' },
    { x:  645, y: 432, text: 'RXVY',   color: '#44ffff' },
    { x: 1155, y: 432, text: 'GHOST',  color: '#ff8800' },
    { x: 1765, y: 432, text: '404',    color: '#aa44ff' },
  ];
  ctx.font = 'italic bold 15px monospace'; ctx.textAlign = 'left';
  tags.forEach(t => {
    ctx.globalAlpha = 0.45; ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x - cam, t.y);
  });
  ctx.globalAlpha = 1;

  // ── ENEMIES ───────────────────────────────────────────────────
  DT_ENEMIES.forEach(e => {
    if (e.state === 'dead') return;

    const ex = Math.round(e.x - cam);
    const ey = Math.round(e.y);
    const f  = downtownFrame;
    const moving = e.state === 'patrol' || e.state === 'aggro';
    const walkBob = moving ? Math.sin(f * 0.22) * 2 : 0;
    const bodyY   = ey + walkBob;

    // Windup glow — red pulse telegraph
    if (e.state === 'windup') {
      const pulse = 0.3 + Math.sin(f * 0.4) * 0.3;
      ctx.fillStyle = `rgba(255,60,60,${pulse})`;
      ctx.fillRect(ex - 3, bodyY - 14, e.w + 6, e.h + 14);
    }

    // Stagger flash
    if (e.state === 'stagger' && Math.floor(f / 3) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    // Body
    ctx.fillStyle = (e.state === 'aggro' || e.state === 'windup' || e.state === 'attack') ? '#552222' : '#38384e';
    ctx.fillRect(ex + 2, bodyY, e.w - 4, e.h - 12);

    // Head
    ctx.fillStyle = '#c09070';
    ctx.fillRect(ex + 4, bodyY - 10, e.w - 8, 10);

    // Eyes
    ctx.fillStyle = (e.state === 'aggro' || e.state === 'windup' || e.state === 'attack') ? '#ff1111' : '#cccccc';
    const eyeOff = e.facing === 1 ? 6 : 2;
    ctx.fillRect(ex + eyeOff, bodyY - 8, 3, 3);

    // Legs
    const legSwing = moving ? Math.sin(f * 0.22) * 3 : 0;
    ctx.fillStyle = '#1e1e30';
    ctx.fillRect(ex + 3,       bodyY + e.h - 12, 6, 12 + legSwing);
    ctx.fillRect(ex + e.w - 9, bodyY + e.h - 12, 6, 12 - legSwing);

    // Enemy weapon — simple club/fist
    if (e.state === 'attack' || e.state === 'windup') {
      const wAng = e.state === 'attack' ? 0.6 : (0.3 + Math.sin(f * 0.5) * 0.15);
      const armX = e.facing === 1 ? ex + e.w : ex;
      ctx.fillStyle = '#7a5533';
      ctx.save();
      ctx.translate(armX, bodyY + 4);
      ctx.rotate(wAng * e.facing);
      ctx.fillRect(-2, -8, 5, 10);
      ctx.restore();
    }

    ctx.globalAlpha = 1;

    // HP bar
    const barW = 30, barH = 4;
    const barX = ex + e.w / 2 - barW / 2;
    const barY = ey - 18;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    const hpPct = e.hp / e.maxHp;
    ctx.fillStyle = hpPct > 0.5 ? '#33ee33' : hpPct > 0.25 ? '#ffaa00' : '#ff2222';
    ctx.fillRect(barX, barY, Math.round(barW * hpPct), barH);
  });

  // ── BOSS PORTAL ───────────────────────────────────────────────
  dtDrawPortal(ctx, cam);

  // ── PLAYER ────────────────────────────────────────────────────
  if (dtChar.action !== 'dead') {
    const px = Math.round(dtChar.x - cam);
    const py = Math.round(dtChar.y);
    const f  = downtownFrame;

    const flashing = dtChar.hurtTimer > 0 && Math.floor(dtChar.hurtTimer / 4) % 2 === 0;
    ctx.globalAlpha = flashing ? 0.3 : 1;

    const walkBob = dtChar.onGround && (dtKeyLeft || dtKeyRight) && dtChar.action !== 'attack' ? Math.sin(f * 0.26) * 2 : 0;
    const bodyY   = py + walkBob;

    // ── Compute sword arm swing angle from atkFrame ───────────
    let swordAngle = 0.3; // rest angle
    if (dtChar.atkFrame >= 0) {
      const af = dtChar.atkFrame;
      if (af < ATK_WINDUP) {
        // Pull back
        swordAngle = 0.3 + (af / ATK_WINDUP) * 1.0;
      } else if (af < ATK_ACTIVE) {
        // Swing through
        const t = (af - ATK_WINDUP) / (ATK_ACTIVE - ATK_WINDUP);
        swordAngle = 1.3 - t * 2.0;
      } else {
        // Return
        const t = (af - ATK_ACTIVE) / (ATK_RECOVERY - ATK_ACTIVE);
        swordAngle = -0.7 + t * 1.0;
      }
    }

    // Shield position
    const shieldX = dtChar.facing === 1 ? px - 7 : px + dtChar.w - 1;
    const shieldY = bodyY + 2;
    const blocking = dtChar.blocking && dtChar.atkFrame < 0;

    // Draw shield (off-hand side) — only if offhand equipped
    if (playerEquip?.offhand) drawShield(ctx, shieldX, shieldY, blocking);

    // Resolve character appearance from playerCharData
    const _dtpcd = typeof playerCharData !== 'undefined' ? playerCharData : null;
    let dtBody = '#c8a070';
    let dtHair = '#1e1e1e';
    let dtShirt = blocking ? '#2255cc' : '#1e44aa';
    if (_dtpcd) {
      if (_dtpcd.skin) dtBody = _dtpcd.skin;
      if (_dtpcd.type === 'alien')  dtBody = '#55bb66';
      if (_dtpcd.type === 'female') dtShirt = '#cc4488';
      if (_dtpcd.type !== 'alien' && _dtpcd.hair) dtHair = _dtpcd.hair;
    }

    // Body — hoodie
    ctx.fillStyle = dtShirt;
    ctx.fillRect(px + 2, bodyY, dtChar.w - 4, dtChar.h - 12);

    // Head
    ctx.fillStyle = dtBody;
    ctx.fillRect(px + 4, bodyY - 10, dtChar.w - 8, 10);

    // Hair
    ctx.fillStyle = dtHair;
    ctx.fillRect(px + 4, bodyY - 10, dtChar.w - 8, 4);
    // Female: longer hair on both sides
    if (_dtpcd && _dtpcd.type === 'female') {
      ctx.fillStyle = dtHair;
      ctx.fillRect(px + 4, bodyY - 10, 3, 14); // left side longer
      ctx.fillRect(px + dtChar.w - 7, bodyY - 10, 3, 14); // right side longer
    }

    // Eye
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(dtChar.facing === 1 ? px + 10 : px + 4, bodyY - 7, 3, 3);

    // Alien face overlay
    if (_dtpcd && _dtpcd.type === 'alien') {
      const hx = px + 4, hy = bodyY - 10;
      ctx.fillStyle = '#55bb66';
      ctx.fillRect(hx, hy, 12, 3); ctx.fillRect(hx, hy, 3, 8); // cover hair
      ctx.fillStyle = '#88ffcc';
      ctx.fillRect(hx + 5, hy - 3, 2, 4); // antenna tip
      ctx.fillStyle = '#000022';
      ctx.fillRect(hx + 1, hy + 4, 4, 4); ctx.fillRect(hx + 7, hy + 4, 4, 4); // big eyes
      ctx.fillStyle = '#88ccff';
      ctx.fillRect(hx + 2, hy + 5, 2, 2); ctx.fillRect(hx + 8, hy + 5, 2, 2); // irises
    }

    // Sword (weapon arm side) — only if weapon equipped
    if (playerEquip?.weapon) {
      const swordArmX = dtChar.facing === 1 ? px + dtChar.w + 1 : px - 3;
      const swordArmY = bodyY + 4;
      drawSword(ctx, swordArmX, swordArmY, swordAngle, dtChar.facing);
    }

    // Legs
    const legSwing = dtChar.onGround && (dtKeyLeft || dtKeyRight) ? Math.sin(f * 0.26) * 4 : 0;
    ctx.fillStyle = '#112244';
    ctx.fillRect(px + 3,            bodyY + dtChar.h - 12, 6, 12 + legSwing);
    ctx.fillRect(px + dtChar.w - 9, bodyY + dtChar.h - 12, 6, 12 - legSwing);

    ctx.globalAlpha = 1;

    // Attack / block prompt
    let nearEnemy = false;
    for (const e of DT_ENEMIES) {
      if (e.state === 'dead') continue;
      if (Math.abs(dtChar.x + dtChar.w / 2 - e.x - e.w / 2) < 80 && Math.abs(dtChar.y - e.y) < 55) { nearEnemy = true; break; }
    }
    if (nearEnemy && dtChar.atkFrame < 0 && !dtChar.blocking) {
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(px - 24, py - 28, 80, 16);
      ctx.fillStyle = '#ffee88';
      ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('E Attack  Q Block', px + dtChar.w / 2, py - 16);
    }
  }

  // ── FLOATING POPUPS ───────────────────────────────────────────
  ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
  for (let i = dtPopups.length - 1; i >= 0; i--) {
    const p = dtPopups[i];
    p.y += p.vy;
    p.alpha = Math.max(0, p.alpha - 0.018);
    if (p.alpha <= 0) { dtPopups.splice(i, 1); continue; }
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = p.color;
    ctx.fillText(p.text, p.x - cam, p.y);
  }
  ctx.globalAlpha = 1;

  // ── HUD ───────────────────────────────────────────────────────
  // Back button
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(10, 10, 135, 32);
  ctx.strokeStyle = 'rgba(100,150,255,0.5)'; ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 135, 32);
  ctx.fillStyle = '#88aaff'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
  ctx.fillText('← LEAVE STRIP', 20, 30);

  // Combat skill badge
  const combatSk = SKILLS.combat || { level: 1 };
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(W - 165, 10, 155, 32);
  ctx.strokeStyle = 'rgba(255,80,80,0.5)';
  ctx.strokeRect(W - 165, 10, 155, 32);
  ctx.fillStyle = '#ff8888'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
  ctx.fillText(`⚔️ Combat Lv ${combatSk.level}`, W - 153, 30);

  // Player HP bar
  const hpBarW = 160, hpBarH = 14;
  const hpBarX = W / 2 - hpBarW / 2;
  const hpBarY = H - 46;
  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  ctx.fillRect(hpBarX - 4, hpBarY - 4, hpBarW + 8, hpBarH + 20);
  ctx.strokeStyle = dtChar.blocking ? 'rgba(80,140,255,0.6)' : 'rgba(255,80,80,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(hpBarX - 4, hpBarY - 4, hpBarW + 8, hpBarH + 20);
  ctx.fillStyle = 'rgba(80,20,20,0.8)';
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  const hpPct = dtChar.hp / dtChar.maxHp;
  ctx.fillStyle = hpPct > 0.5 ? '#33dd33' : hpPct > 0.25 ? '#ffaa00' : '#ff2222';
  ctx.fillRect(hpBarX, hpBarY, Math.round(hpBarW * hpPct), hpBarH);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
  ctx.fillText(`HP  ${dtChar.hp} / ${dtChar.maxHp}`, W / 2, hpBarY + hpBarH + 9);

  // Block indicator
  if (dtChar.blocking && dtChar.atkFrame < 0) {
    ctx.fillStyle = 'rgba(80,140,255,0.85)';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('🛡 BLOCKING', W / 2, hpBarY + hpBarH + 20);
  }

  // Controls hint
  ctx.fillStyle = 'rgba(180,200,255,0.25)';
  ctx.font = '9px monospace';
  ctx.fillText('← → Move · Space Jump · E Attack · Q Block · F Interact · Esc Leave', W / 2, H - 8);

  // Death overlay
  if (dtChar.action === 'dead') {
    ctx.fillStyle = 'rgba(180,0,0,0.20)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,80,80,0.88)';
    ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
    ctx.fillText('KNOCKED OUT', W / 2, H / 2 - 10);
    ctx.fillStyle = 'rgba(255,180,180,0.6)';
    ctx.font = '11px monospace';
    ctx.fillText(`respawning in ${Math.ceil(dtChar.deathTimer / 30)}s`, W / 2, H / 2 + 12);
  }
}

// ── MAIN LOOP ──────────────────────────────────────────────────
function downtownLoop() {
  dtLoopRunning = true;
  if (!downtownActive) { dtLoopRunning = false; return; }

  try {

  downtownFrame++;
  if (dtScreenShake > 0) dtScreenShake--;

  // Hit-stop: skip simulation for a few frames on clean hit (impact feel)
  if (dtHitStop > 0) {
    dtHitStop--;
    drawDowntownScene();
    requestAnimationFrame(downtownLoop);
    return;
  }

  if (dtCombatTutOpen || dtPortalLockedOpen) {
    drawDowntownScene();
    requestAnimationFrame(downtownLoop);
    return;
  }

  if (dtChar.action !== 'dead') {

    // Block — requires offhand equipped, can't attack while blocking
    dtChar.blocking = !!(playerEquip?.offhand) && dtKeyBlock && dtChar.atkFrame < 0 && dtChar.onGround;

    // Movement — slow to 40% while blocking; speed equipment bonus
    const eqSpd     = (typeof getEquipStats === 'function') ? (getEquipStats().strideSpeed || 0) : 0;
    const speedMult = (dtChar.blocking ? 0.4 : 1) * (1 + eqSpd * 0.04);
    if (dtKeyLeft)       { dtChar.vx = -DT_SPEED * speedMult; dtChar.facing = -1; }
    else if (dtKeyRight) { dtChar.vx =  DT_SPEED * speedMult; dtChar.facing =  1; }
    else                 { dtChar.vx *= 0.72; }

    // Jump — not while blocking
    if (dtKeyJump && dtChar.onGround && !dtChar.blocking) {
      dtChar.vy = DT_JUMP;
      dtChar.onGround = false;
    }

    // Attack state machine
    if (dtChar.atkFrame >= 0) {
      dtChar.atkFrame++;

      // Hitbox fires once at the start of the active window
      if (dtChar.atkFrame === ATK_WINDUP && !dtChar.hitFired) {
        dtChar.hitFired = true;
        dtCheckHit();
      }

      // Animation complete
      if (dtChar.atkFrame >= ATK_RECOVERY) {
        dtChar.atkFrame   = -1;
        dtChar.atkCooldown = ATK_COOLDOWN;
        dtChar.action      = 'idle';
      }
    }

    if (dtChar.atkCooldown > 0) dtChar.atkCooldown--;
    if (dtChar.hurtTimer   > 0) dtChar.hurtTimer--;

    // Action label
    if (dtChar.atkFrame >= 0) {
      dtChar.action = 'attack';
    } else if (dtChar.blocking) {
      dtChar.action = 'block';
    } else if (!dtChar.onGround) {
      dtChar.action = 'jump';
    } else if (Math.abs(dtChar.vx) > 0.5) {
      dtChar.action = 'walk';
    } else {
      dtChar.action = 'idle';
    }

  } else {
    dtChar.deathTimer--;
    if (dtChar.deathTimer <= 0) {
      dtChar.hp = dtChar.maxHp;
      dtChar.action = 'idle';
      dtChar.x = 80; dtChar.y = 380;
      dtChar.vx = 0; dtChar.vy = 0; dtChar.kbVx = 0;
      dtChar.hurtTimer = 60;
      dtChar.atkFrame = -1;
      addLog('💊 back up');
    }
  }

  dtPhysics();
  tickEnemies();

  // ── PORTAL INTERACTION ──────────────────────────────────────
  // ── PORTAL INTERACTION (always active — portal is always at end of strip) ──
  dtPortalInteractPrompt = false;
  if (dtChar.action !== 'dead') {
    const charMidX   = dtChar.x + dtChar.w / 2;
    const portalMidX = dtPortal.x + dtPortal.w / 2;
    if (Math.abs(charMidX - portalMidX) < 90) {
      dtPortalInteractPrompt = true;
      if (dtKeyInteract) {
        dtKeyInteract = false;
        if (dtPortalUsed) {
          // Sigil already spent — re-enter the arena directly
          addLog("🌀 Re-entering the Warden's Arena...");
          if (typeof enterBossArena === 'function') enterBossArena();
        } else {
          const sigIdx = typeof playerInv !== 'undefined'
            ? playerInv.findIndex(s => s && s.id === 'warden_sigil')
            : -1;
          if (sigIdx >= 0) {
            // Consume sigil and enter
            playerInv.splice(sigIdx, 1);
            dtPortalUsed = true;
            if (typeof renderInv === 'function') renderInv();
            if (typeof advanceObjective === 'function')
              advanceObjective('warden_call', 'use_portal', 1);
            addLog("🌀 Entering the Warden's Arena...");
            if (typeof enterBossArena === 'function') enterBossArena();
          } else {
            // No sigil — show the modal regardless of quest state
            showPortalLockedModal();
          }
        }
      }
    }
  }
  if (dtKeyInteract) dtKeyInteract = false; // consume if not near portal

  drawDowntownScene();

  // Keep speech/thought bubbles anchored over the downtown character
  if (typeof positionBubbles === 'function') {
    positionBubbles(Math.round(dtChar.x - dtCamX) + dtChar.w / 2, dtChar.y);
  }

  } catch (err) {
    // Prevent any exception from killing the game loop
    console.error('[downtownLoop]', err);
  }

  requestAnimationFrame(downtownLoop);
}

// ── CANVAS CLICK (back button) ────────────────────────────────
document.getElementById('downtownCanvas').addEventListener('click', ev => {
  const rect   = ev.target.getBoundingClientRect();
  const scaleX = ev.target.width  / rect.width;
  const scaleY = ev.target.height / rect.height;
  const x = (ev.clientX - rect.left) * scaleX;
  const y = (ev.clientY - rect.top)  * scaleY;
  if (x >= 10 && x <= 145 && y >= 10 && y <= 42) leaveDowntownScene();
});
