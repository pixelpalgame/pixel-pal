// ════════════════════════════════════════════════════════════
// BOSS ARENA — Downtown Warden Fight
// ════════════════════════════════════════════════════════════

let bossArenaActive = false;
let bossArenaFrame  = 0;
let baLoopRunning   = false;
let baKeyLeft = false, baKeyRight = false, baKeyJump = false, baKeyBlock = false;

const BA_TUT_KEY = 'pixel_boss_arena_tut_seen';
let baTutOpen = false;

// ── ARENA LAYOUT ──────────────────────────────────────────────
const BA_W         = 1100;
const BA_H         = 580;
const BA_GROUND_Y  = 440;
const BA_LEFT      = 15;
const BA_RIGHT     = 1085;
const BA_GRAVITY   = 0.55;
const BA_JUMP_VEL  = -11.5;
const BA_WAVE_SPEED = 4;

const BA_PLATFORMS = [
  { x: 0,   y: BA_GROUND_Y, w: BA_W, h: 140 },   // ground floor
  { x: 155, y: 308,         w: 150, h: 14  },     // left ledge
  { x: 475, y: 268,         w: 160, h: 14  },     // centre ledge
  { x: 790, y: 308,         w: 150, h: 14  },     // right ledge
];

// ── PLAYER STATE ──────────────────────────────────────────────
const baChar = {
  x: 80, y: BA_GROUND_Y - 32, vx: 0, vy: 0, kbVx: 0,
  w: 20, h: 32, onGround: false, facing: 1, action: 'idle',
  hp: 100, maxHp: 100,
  atkFrame: -1, hitFired: false, atkCooldown: 0,
  hurtTimer: 0, deathTimer: 0,
  blocking: false, blockAnim: 0,
};

// ── BOSS STATE ────────────────────────────────────────────────
let baEverDied = false;   // set true on first death; bumps sigil cost to 100 tags

const baWarden = {
  x: 860, y: BA_GROUND_Y - 52, vx: 0, vy: 0, kbVx: 0,
  w: 36, h: 52, hp: 0, maxHp: 1100,
  // states: idle | aggro | windup | attack | stagger | dead
  //         charge_windup | charging | slam_windup | slam_leap | slam_crash
  state: 'idle', facing: -1,
  atkCd: 0, windupTimer: 0, staggerTimer: 0, deathTimer: 0,
  phase2: false, specialCd: 200,
  chargeDir: -1, chargeTimer: 0, chargeVx: 0,
  slamLeapVy: 0, shockwaves: [],
};

let baVictory      = false;
let baVictoryTimer = 0;
let baHitStop      = 0;
let baScreenShake  = 0;
const baPopups     = [];

// ATK frame windows (mirror downtown values)
const BA_ATK_WINDUP   = 6;
const BA_ATK_ACTIVE   = 8;
const BA_ATK_RECOVERY = 8;
const BA_ATK_TOTAL    = BA_ATK_WINDUP + BA_ATK_ACTIVE + BA_ATK_RECOVERY;

const BA_PLAYER_REACH  = 56;
const BA_PLAYER_DMG_LO = 10;
const BA_PLAYER_DMG_HI = 18;
const BA_KNOCKBACK     = 5;

// ── ENTER / LEAVE ─────────────────────────────────────────────
function enterBossArena() {
  bossArenaActive = true;
  bossArenaFrame  = 0;

  // Stop the downtown loop so both loops don't run in parallel
  if (typeof downtownActive !== 'undefined') downtownActive = false;
  // Clear any stuck downtown movement flags
  if (typeof dtKeyLeft  !== 'undefined') dtKeyLeft  = false;
  if (typeof dtKeyRight !== 'undefined') dtKeyRight = false;
  if (typeof dtKeyJump  !== 'undefined') dtKeyJump  = false;
  if (typeof dtKeyBlock !== 'undefined') dtKeyBlock = false;
  if (typeof dtKeyInteract !== 'undefined') dtKeyInteract = false;
  baHitStop = 0; baScreenShake = 0;
  baVictory = false; baVictoryTimer = 0;
  baPopups.length = 0;
  baWarden.shockwaves.length = 0;

  // Sync combat stats before resetting HP
  if (typeof updateCombatStats === 'function') updateCombatStats();

  Object.assign(baChar, {
    x: 80, y: BA_GROUND_Y - 32,
    vx: 0, vy: 0, kbVx: 0,
    onGround: false, facing: 1, action: 'idle',
    hp: baChar.maxHp,
    atkFrame: -1, hitFired: false, atkCooldown: 0,
    hurtTimer: 0, deathTimer: 0,
    blocking: false, blockAnim: 0,
  });

  Object.assign(baWarden, {
    x: 860, y: BA_GROUND_Y - 52,
    vx: 0, vy: 0, kbVx: 0,
    hp: baWarden.maxHp, state: 'aggro',
    facing: -1, atkCd: 90, windupTimer: 0,
    staggerTimer: 0, deathTimer: 0,
    phase2: false, specialCd: 200,
    chargeTimer: 0, chargeVx: 0, slamLeapVy: 0,
  });

  baKeyLeft = false; baKeyRight = false; baKeyJump = false; baKeyBlock = false;

  // Show arena, hide downtown
  document.getElementById('downtownScene').style.display = 'none';
  document.getElementById('bossArenaScene').style.display = 'block';

  // First-time tutorial
  if (!localStorage.getItem(BA_TUT_KEY)) {
    baTutOpen = true;
    document.getElementById('bossArenaTutOverlay').classList.add('open');
  }

  // ── MULTIPLAYER: register arena callbacks ──────────────────
  if (typeof mp !== 'undefined' && mp.inRoom) {
    mp.sendArenaEvent('enter');

    if (!mp.isHost) {
      // Guest: receive authoritative boss state from host
      mp.onBossState(function(state) {
        if (!bossArenaActive) return;
        baWarden.x       = state.x       ?? baWarden.x;
        baWarden.y       = state.y       ?? baWarden.y;
        baWarden.hp      = state.hp      ?? baWarden.hp;
        baWarden.state   = state.state   ?? baWarden.state;
        baWarden.facing  = state.facing  ?? baWarden.facing;
        baWarden.phase2  = state.phase2  ?? baWarden.phase2;
        if (Array.isArray(state.shockwaves)) baWarden.shockwaves = state.shockwaves;
      });

      // Guest: receive boss hit events directed at us
      mp.onBossHitGuest(function(damage) {
        if (!bossArenaActive || baChar.action === 'dead') return;
        if (baChar.blocking) {
          const eqStats = (typeof getEquipStats === 'function') ? getEquipStats() : {};
          const chip = Math.max(2, Math.round(damage * 0.25));
          baChar.hp = Math.max(0, baChar.hp - chip);
          baPopups.push({ x: baChar.x+baChar.w/2, y: baChar.y-18, text:'BLOCKED', alpha:1, vy:-1, color:'#44aaff' });
        } else {
          baChar.hp = Math.max(0, baChar.hp - damage);
          baChar.hurtTimer = 50;
          baScreenShake = 14;
          baPopups.push({ x: baChar.x+baChar.w/2, y: baChar.y-10, text:`-${damage}`, alpha:1, vy:-1.2, color:'#ff2200' });
          if (baChar.hp <= 0) { baChar.action = 'dead'; baChar.deathTimer = 130; addLog('💀 Knocked out by the Warden — respawning'); }
        }
      });

    } else {
      // Host: receive hit events from guest
      mp.onHitBoss(function(damage) {
        const w = baWarden;
        if (!bossArenaActive || w.state === 'dead') return;
        w.hp = Math.max(0, w.hp - damage);
        w.kbVx = -w.facing * BA_KNOCKBACK * 0.4;
        if (w.state !== 'dead') { w.staggerTimer = 4; w.state = 'stagger'; }
        baPopups.push({ x: w.x+w.w/2, y: w.y-14, text:`-${damage} [P2]`, alpha:1, vy:-1.5, color:'#88ffaa' });
        if (w.hp <= 0) {
          w.hp = 0; w.state = 'dead'; w.deathTimer = 150;
          gainXP('combat', 300);
          addMoney(500);
          if (typeof invAddItem === 'function') invAddItem('wardens_badge', 1);
          baPopups.push({ x: w.x+w.w/2, y: w.y-30, text:'+300 Combat XP',   alpha:1, vy:-0.9,  color:'#44ffaa' });
          baPopups.push({ x: w.x+w.w/2, y: w.y-46, text:'+$500',            alpha:1, vy:-0.8,  color:'#ffd700' });
          baPopups.push({ x: w.x+w.w/2, y: w.y-62, text:'WARDEN DEFEATED!', alpha:1, vy:-0.55, color:'#cc44ff' });
          addLog('💀 Downtown Warden defeated!  +300xp  +$500  +Warden\'s Badge');
          if (typeof advanceObjective === 'function')
            advanceObjective('downtown_warden', 'defeat_warden', 1);
        }
      });
    }
  }

  if (!baLoopRunning) requestAnimationFrame(bossArenaLoop);
}

function leaveBossArena(returnToDowntown) {
  bossArenaActive = false;
  // Reset portal so a new Warden's Summon is required next time
  if (typeof dtResetPortal === 'function') dtResetPortal();
  document.getElementById('bossArenaScene').style.display = 'none';
  // Notify peer we left the arena
  if (typeof mp !== 'undefined' && mp.inRoom) mp.sendArenaEvent('leave');
  if (returnToDowntown !== false) {
    if (typeof enterDowntownScene === 'function') enterDowntownScene();
  }
}

function hideBossArenaTut() {
  baTutOpen = false;
  document.getElementById('bossArenaTutOverlay').classList.remove('open');
  localStorage.setItem(BA_TUT_KEY, '1');
}

function showBaDeathTutorial() {
  // Mark first death — bumps sigil recipe to 100 street tags
  if (!baEverDied) {
    baEverDied = true;
    if (typeof BOSS_RECIPE_DB !== 'undefined') {
      BOSS_RECIPE_DB[0].ingredients[0].qty = 100;
    }
  }
  // Return player to downtown strip first
  leaveBossArena(true);
  // Show the death / consumables tutorial overlay
  const overlay = document.getElementById('baDeathTutOverlay');
  if (overlay) overlay.classList.add('open');
}

function hideBaDeathTutorial() {
  const overlay = document.getElementById('baDeathTutOverlay');
  if (overlay) overlay.classList.remove('open');
}

document.getElementById('bossArenaTutDismiss').addEventListener('click', hideBossArenaTut);
document.getElementById('baDeathTutDismiss').addEventListener('click', hideBaDeathTutorial);

// ── PHYSICS ───────────────────────────────────────────────────
function baPhysics() {
  // Player horizontal movement
  if (baChar.action !== 'dead') {
    if (!baChar.blocking) {
      const spd = 3.2 + (((typeof getEquipStats === 'function') ? (getEquipStats().strideSpeed || 0) : 0) * 0.15);
      baChar.vx = baKeyLeft ? -spd : baKeyRight ? spd : 0;
      if (baChar.vx !== 0) baChar.facing = baChar.vx > 0 ? 1 : -1;
    } else {
      baChar.vx = 0;
    }
  } else {
    baChar.vx = 0;
  }

  baChar.kbVx *= 0.75;
  baChar.x += baChar.vx + baChar.kbVx;
  baChar.x = Math.max(BA_LEFT, Math.min(BA_RIGHT - baChar.w, baChar.x));

  // Vertical
  baChar.vy += BA_GRAVITY;
  baChar.y  += baChar.vy;
  baChar.onGround = false;

  for (const p of BA_PLATFORMS) {
    const cx   = baChar.x + baChar.w / 2;
    const feet = baChar.y + baChar.h;
    if (cx > p.x && cx < p.x + p.w && feet >= p.y && feet <= p.y + 16 + Math.abs(baChar.vy) + 2 && baChar.vy >= 0) {
      baChar.y = p.y - baChar.h;
      baChar.vy = 0;
      baChar.onGround = true;
      break;
    }
  }

  // Jump
  if (baKeyJump && baChar.onGround && baChar.action !== 'dead') {
    baChar.vy = BA_JUMP_VEL;
    baChar.onGround = false;
    baKeyJump = false;
  }

  // Action state
  if (baChar.action !== 'dead' && baChar.action !== 'attack') {
    if (baKeyBlock) {
      baChar.action = 'block'; baChar.blocking = true;
    } else if (!baChar.onGround) {
      baChar.action = 'jump'; baChar.blocking = false;
    } else if (baChar.vx !== 0) {
      baChar.action = 'walk'; baChar.blocking = false;
    } else {
      baChar.action = 'idle'; baChar.blocking = false;
    }
    if (!baKeyBlock) baChar.blocking = false;
  }

  // Attack frame advance
  if (baChar.atkFrame >= 0) {
    baChar.atkFrame++;
    if (baChar.atkFrame >= BA_ATK_WINDUP && baChar.atkFrame < BA_ATK_WINDUP + BA_ATK_ACTIVE && !baChar.hitFired) {
      baCheckHit();
      baChar.hitFired = true;
    }
    if (baChar.atkFrame >= BA_ATK_TOTAL) {
      baChar.atkFrame = -1;
      baChar.hitFired = false;
      baChar.action   = 'idle';
      baChar.atkCooldown = 12;
    }
  }
  if (baChar.atkCooldown > 0) baChar.atkCooldown--;
  if (baChar.hurtTimer > 0)   baChar.hurtTimer--;

  // Warden gravity (not during leap)
  const w = baWarden;
  if (w.state !== 'dead' && w.state !== 'slam_leap') {
    w.vy += BA_GRAVITY;
    w.y  += w.vy;
    if (w.y + w.h >= BA_GROUND_Y) { w.y = BA_GROUND_Y - w.h; w.vy = 0; }
  }
  // Warden knockback decay (not while charging — chargeVx is separate)
  if (w.state !== 'charging') {
    w.kbVx *= 0.7;
    w.x += w.kbVx;
  }
  w.x = Math.max(BA_LEFT + 4, Math.min(BA_RIGHT - w.w - 4, w.x));
}

// ── PLAYER ATTACK ─────────────────────────────────────────────
function baPlayerAttack() {
  if (baChar.action === 'dead') return;
  if (baChar.action === 'block') return;
  if (baChar.atkFrame >= 0) return;
  if (baChar.atkCooldown > 0) return;
  if (!(typeof playerEquip !== 'undefined' && playerEquip?.weapon)) { addLog('⚔️ Equip a weapon first!'); return; }
  baChar.atkFrame = 0;
  baChar.hitFired = false;
  baChar.action   = 'attack';
  baChar.kbVx     = baChar.facing * 2.5;
}

// ── HIT CHECK ─────────────────────────────────────────────────
function baCheckHit() {
  const w = baWarden;
  if (w.state === 'dead' || w.state === 'stagger') return;
  const px   = baChar.x + baChar.w / 2;
  const wx   = w.x + w.w / 2;
  const dist = Math.abs(px - wx);
  const dyOk = Math.abs(baChar.y - w.y) < 80;
  const inFront = baChar.facing === 1 ? wx > baChar.x - 8 : wx < baChar.x + baChar.w + 8;

  if (dist < BA_PLAYER_REACH && dyOk && inFront) {
    const eqStats = (typeof getEquipStats === 'function') ? getEquipStats() : {};
    const eqAtk   = eqStats.rawDmg        || 0;
    const fateful = eqStats.fatefulStrike  || 0;
    let dmg = BA_PLAYER_DMG_LO + Math.floor(Math.random() * (BA_PLAYER_DMG_HI - BA_PLAYER_DMG_LO + 1)) + eqAtk;
    const isCrit = fateful > 0 && Math.random() < fateful * 0.03;
    if (isCrit) dmg = Math.round(dmg * 1.5);

    // ── Guest: send hit to host; host validates ──────────────
    if (typeof mp !== 'undefined' && mp.inRoom && !mp.isHost) {
      mp.sendHitBoss(dmg);
      const col = isCrit ? '#88ff88' : '#aaffaa';
      const txt = isCrit ? `~CRIT ${dmg}?` : `~${dmg}?`;
      baPopups.push({ x: w.x + w.w / 2, y: w.y - 14, text: txt, alpha: 1, vy: -1.5, color: col });
      return;
    }

    // ── Host or solo: apply damage directly ──────────────────
    w.hp -= dmg;
    w.kbVx = baChar.facing * BA_KNOCKBACK * 0.4;
    if (w.state !== 'dead') { w.staggerTimer = 6; w.state = 'stagger'; }
    baHitStop = 5;

    // Also notify guest they did NOT hit (host owns damage)
    if (typeof mp !== 'undefined' && mp.inRoom) {
      mp.sendBossState({ x: w.x, y: w.y, hp: w.hp, state: w.state, facing: w.facing, phase2: w.phase2, shockwaves: w.shockwaves });
    }

    const col = isCrit ? '#ff8844' : '#ffee44';
    const txt = isCrit ? `CRIT -${dmg}` : `-${dmg}`;
    baPopups.push({ x: w.x + w.w / 2, y: w.y - 14, text: txt, alpha: 1, vy: -1.5, color: col });

    if (w.hp <= 0) {
      w.hp = 0;
      w.state = 'dead';
      w.deathTimer = 150;
      gainXP('combat', 300);
      addMoney(500);
      if (typeof invAddItem === 'function') invAddItem('wardens_badge', 1);
      baPopups.push({ x: w.x+w.w/2, y: w.y-30, text:'+300 Combat XP',   alpha:1, vy:-0.9,  color:'#44ffaa' });
      baPopups.push({ x: w.x+w.w/2, y: w.y-46, text:'+$500',            alpha:1, vy:-0.8,  color:'#ffd700' });
      baPopups.push({ x: w.x+w.w/2, y: w.y-62, text:'WARDEN DEFEATED!', alpha:1, vy:-0.55, color:'#cc44ff' });
      addLog('💀 Downtown Warden defeated!  +300xp  +$500  +Warden\'s Badge');
      if (typeof advanceObjective === 'function')
        advanceObjective('downtown_warden', 'defeat_warden', 1);
    }
  }
}

// ── HOST: check if boss hit remote player ─────────────────────
// Called from attack states in baTickWarden when in multiplayer host mode.
// Mirror of the local hit checks but targets mp.remotePlayer position.
function baMpCheckRemoteHit(dmg) {
  if (typeof mp === 'undefined' || !mp.inRoom || !mp.isHost) return;
  const rp = mp.remotePlayer;
  if (!rp.visible) return;
  const w  = baWarden;
  const rpCx = rp.x + 10; // centre of remote player (w=20)
  const wxC  = w.x + w.w / 2;
  if (Math.abs(rpCx - wxC) < 64 && Math.abs(rp.y - w.y) < 54) {
    mp.sendBossHitGuest(dmg);
  }
}

// ── BOSS AI ───────────────────────────────────────────────────
function baTickWarden() {
  const w = baWarden;

  if (w.state === 'dead') {
    w.deathTimer--;
    if (w.deathTimer <= 0 && !baVictory) {
      baVictory = true;
      baVictoryTimer = 260;
    }
    return;
  }

  w.phase2 = w.hp <= w.maxHp * 0.5;

  const SPEED        = w.phase2 ? 1.9  : 1.38;
  const WINDUP       = w.phase2 ? 17   : 27;
  const ATK_CD       = w.phase2 ? 53   : 82;
  const DMG          = w.phase2 ? 23   : 15;
  const RANGE        = 64;
  const CHARGE_SPEED = w.phase2 ? 7.1  : 5.5;
  const CHARGE_WINDUP   = 42;
  const CHARGE_DURATION = 52;

  const px   = baChar.x + baChar.w / 2;
  const wx   = w.x + w.w / 2;
  const dist = Math.abs(px - wx);

  // ── Stagger ─────────────────────────────────────────────────
  if (w.state === 'stagger') {
    w.staggerTimer--;
    if (w.staggerTimer <= 0) w.state = 'aggro';
    return;
  }

  if (w.atkCd    > 0) w.atkCd--;
  if (w.specialCd > 0) w.specialCd--;

  // ── Charge windup ───────────────────────────────────────────
  if (w.state === 'charge_windup') {
    w.windupTimer--;
    if (w.windupTimer <= 0) {
      w.state      = 'charging';
      w.chargeTimer = CHARGE_DURATION;
      w.chargeVx    = w.chargeDir * CHARGE_SPEED;
    }
    return;
  }

  // ── Charging ────────────────────────────────────────────────
  if (w.state === 'charging') {
    w.x += w.chargeVx;
    w.chargeTimer--;
    w.facing = w.chargeVx > 0 ? 1 : -1;

    // Hurt player if on ground
    if (baChar.onGround && baChar.hurtTimer <= 0 && baChar.action !== 'dead') {
      const cxW = w.x + w.w / 2;
      const cxP = baChar.x + baChar.w / 2;
      if (Math.abs(cxW - cxP) < 36 && Math.abs(baChar.y - w.y) < 54) {
        if (baChar.blocking) {
          const chip = Math.max(3, Math.round(DMG * 0.3));
          baChar.hp = Math.max(0, baChar.hp - chip);
          baPopups.push({ x: baChar.x+baChar.w/2, y: baChar.y-18, text:'BLOCKED', alpha:1, vy:-1, color:'#44aaff' });
        } else {
          const eqStats = (typeof getEquipStats === 'function') ? getEquipStats() : {};
          const defMit  = Math.floor((eqStats.hardiness||0) / 4);
          const resist  = 1 - Math.min(0.80, (eqStats.allResist||0) / 100);
          const rawHit  = DMG * 1.3 + Math.floor(Math.random() * 10);
          const dmg     = Math.max(1, Math.round((rawHit - defMit) * resist));
          baChar.hp = Math.max(0, baChar.hp - dmg);
          baChar.hurtTimer = 55;
          baChar.kbVx  = w.chargeVx * 1.2;
          baScreenShake = 18;
          baPopups.push({ x:baChar.x+baChar.w/2, y:baChar.y-10, text:`-${dmg} CHARGE!`, alpha:1, vy:-1.2, color:'#ff4400' });
          if (baChar.hp <= 0) { baChar.action = 'dead'; baChar.deathTimer = 130; addLog('💀 Knocked out by the Warden — respawning'); }
        }
      }
    }

    // Host: check remote player during charge
    baMpCheckRemoteHit(Math.round(DMG * 1.3));

    // End charge at wall or timer
    const atWall = w.x <= BA_LEFT + 4 || w.x + w.w >= BA_RIGHT - 4;
    if (atWall || w.chargeTimer <= 0) {
      w.chargeVx = 0;
      w.state    = 'aggro';
      w.atkCd    = 55;
      w.specialCd = w.phase2 ? 110 : 165;
      if (atWall) baScreenShake = 12;
    }
    return;
  }

  // ── Slam windup ──────────────────────────────────────────────
  if (w.state === 'slam_windup') {
    w.windupTimer--;
    if (w.windupTimer <= 0) {
      w.state      = 'slam_leap';
      w.slamLeapVy = -13;
      w.vy         = w.slamLeapVy;
    }
    return;
  }

  // ── Slam leap ────────────────────────────────────────────────
  if (w.state === 'slam_leap') {
    w.vy += BA_GRAVITY * 1.4;
    w.y  += w.vy;
    if (w.y + w.h >= BA_GROUND_Y) {
      w.y   = BA_GROUND_Y - w.h;
      w.vy  = 0;
      w.state = 'slam_crash';
      w.windupTimer = 10;
      baScreenShake = 22;
      // Spawn shockwaves outward from landing spot
      const numPairs = w.phase2 ? 2 : 1;
      for (let i = 0; i < numPairs; i++) {
        const offset = i * 60;
        w.shockwaves.push({ x: w.x + w.w/2 - offset, dir: -1, timer: 100 });
        w.shockwaves.push({ x: w.x + w.w/2 + offset, dir:  1, timer: 100 });
      }
    }
    return;
  }

  // ── Slam crash (landing freeze) ──────────────────────────────
  if (w.state === 'slam_crash') {
    w.windupTimer--;
    if (w.windupTimer <= 0) {
      w.state     = 'aggro';
      w.atkCd     = 65;
      w.specialCd = w.phase2 ? 100 : 155;
    }
    return;
  }

  // ── Normal windup ────────────────────────────────────────────
  if (w.state === 'windup') {
    w.windupTimer--;
    if (w.windupTimer <= 0) w.state = 'attack';
    return;
  }

  // ── Normal attack swing ──────────────────────────────────────
  if (w.state === 'attack') {
    if (dist < RANGE && baChar.action !== 'dead' && baChar.hurtTimer <= 0) {
      if (baChar.blocking) {
        const chip = Math.max(2, Math.round(DMG * 0.25));
        baChar.hp = Math.max(0, baChar.hp - chip);
        baPopups.push({ x:baChar.x+baChar.w/2, y:baChar.y-18, text:'BLOCKED',  alpha:1, vy:-1,   color:'#44aaff' });
        if (chip > 0) baPopups.push({ x:baChar.x+baChar.w/2, y:baChar.y-4,  text:`-${chip}`, alpha:1, vy:-0.8, color:'#aaddff' });
        w.kbVx = -w.facing * 3;
      } else {
        const eqStats = (typeof getEquipStats === 'function') ? getEquipStats() : {};
        const defMit  = Math.floor((eqStats.hardiness||0) / 4);
        const resist  = 1 - Math.min(0.80, (eqStats.allResist||0) / 100);
        const rawHit  = DMG + Math.floor(Math.random() * 8) - 3;
        const dmg     = Math.max(1, Math.round((rawHit - defMit) * resist));
        baChar.hp = Math.max(0, baChar.hp - dmg);
        baChar.hurtTimer = 50;
        baChar.kbVx  = -w.facing * BA_KNOCKBACK * 1.2;
        baScreenShake = 14;
        baPopups.push({ x:baChar.x+baChar.w/2, y:baChar.y-10, text:`-${dmg}`, alpha:1, vy:-1.2, color:'#ff2200' });
        if (baChar.hp <= 0) { baChar.action = 'dead'; baChar.deathTimer = 130; addLog('💀 Knocked out by the Warden — respawning'); }
      }
    }
    // Host: check if the attack also hit the remote player
    baMpCheckRemoteHit(DMG);
    w.atkCd = ATK_CD;
    w.state = 'aggro';
    return;
  }

  // ── Aggro — chase + decide specials ─────────────────────────
  const dir = px > wx ? 1 : -1;
  w.facing  = dir;
  w.x += dir * SPEED;
  w.state = 'aggro';

  // Trigger a special move when cooldown is ready
  if (w.specialCd <= 0 && baChar.action !== 'dead') {
    const roll = Math.random();
    if (roll < (w.phase2 ? 0.55 : 0.45)) {
      // Charge
      w.state       = 'charge_windup';
      w.chargeDir   = dir;
      w.windupTimer = CHARGE_WINDUP;
      w.specialCd   = w.phase2 ? 120 : 185;
    } else {
      // Ground slam
      w.state       = 'slam_windup';
      w.windupTimer = 34;
      w.specialCd   = w.phase2 ? 130 : 195;
    }
    return;
  }

  // Normal melee attack
  if (dist < RANGE && w.atkCd <= 0) {
    w.state       = 'windup';
    w.windupTimer = WINDUP;
  }
}

// ── SHOCKWAVE TICK ────────────────────────────────────────────
function baTickShockwaves() {
  const w = baWarden;
  for (let i = w.shockwaves.length - 1; i >= 0; i--) {
    const s = w.shockwaves[i];
    s.x    += s.dir * BA_WAVE_SPEED;
    s.timer--;

    if (s.timer <= 0 || s.x < BA_LEFT - 20 || s.x > BA_RIGHT + 20) {
      w.shockwaves.splice(i, 1);
      continue;
    }

    // Check player collision — must be standing on the main floor (not elevated platforms)
    const playerAtGroundLevel = baChar.y + baChar.h >= BA_GROUND_Y - 8;
    if (baChar.onGround && playerAtGroundLevel && baChar.hurtTimer <= 0 && baChar.action !== 'dead') {
      const px = baChar.x + baChar.w / 2;
      if (Math.abs(px - s.x) < 28) {
        if (baChar.blocking) {
          baChar.hp = Math.max(0, baChar.hp - 3);
          baPopups.push({ x:baChar.x+baChar.w/2, y:baChar.y-18, text:'BLOCKED', alpha:1, vy:-1, color:'#44aaff' });
        } else {
          const shockDmg = w.phase2 ? 21 : 13;
          baChar.hp = Math.max(0, baChar.hp - shockDmg);
          baChar.hurtTimer = 45;
          baChar.kbVx  = s.dir * 4;
          baScreenShake = 10;
          baPopups.push({ x:baChar.x+baChar.w/2, y:baChar.y-10, text:`-${shockDmg} SHOCKWAVE!`, alpha:1, vy:-1.3, color:'#ff6600' });
          if (baChar.hp <= 0) { baChar.action = 'dead'; baChar.deathTimer = 130; addLog('💀 Knocked out by the Warden — respawning'); }
        }
        w.shockwaves.splice(i, 1);
      }
    }
  }
}

// ── DRAW ──────────────────────────────────────────────────────
function drawBossArenaScene() {
  const canvas = document.getElementById('bossArenaCanvas');
  const ctx    = canvas.getContext('2d');
  const W = BA_W, H = BA_H;
  const f = bossArenaFrame;

  let shakeX = 0, shakeY = 0;
  if (baScreenShake > 0) {
    shakeX = (Math.random() - 0.5) * baScreenShake * 0.6;
    shakeY = (Math.random() - 0.5) * baScreenShake * 0.35;
  }
  ctx.save();
  ctx.translate(shakeX, shakeY);

  // ── Background ──────────────────────────────────────────────
  ctx.fillStyle = '#08040c';
  ctx.fillRect(0, 0, W, H);

  // Stone wall bricks
  ctx.save();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 15; col++) {
      const bx  = col * 78 + (row % 2 === 0 ? 0 : 39);
      const by  = 10 + row * 48;
      const lum = 12 + Math.floor((row * 13 + col * 7) % 8);
      ctx.fillStyle = `rgb(${lum},${lum-2},${lum+4})`;
      ctx.fillRect(bx, by, 76, 46);
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 76, 46);
    }
  }
  ctx.restore();

  // Atmospheric purple mist
  for (let i = 0; i < 4; i++) {
    const mistX = ((f * (0.18 + i * 0.09) + i * 280) % (W + 350)) - 180;
    const grad  = ctx.createLinearGradient(mistX, 0, mistX + 260, 0);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, `rgba(70,15,110,0.045)`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 330, W, 110);
  }

  // Ceiling chains
  const chainXs = [70, 230, 410, 575, 740, 900, 1045];
  for (const cx of chainXs) {
    const swing = Math.sin(f * 0.02 + cx * 0.009) * 3;
    ctx.strokeStyle = 'rgba(70,60,85,0.75)';
    ctx.lineWidth = 2;
    for (let seg = 0; seg < 7; seg++) {
      const sy = seg * 16 + swing;
      ctx.beginPath();
      ctx.moveTo(cx - 3, sy);
      ctx.lineTo(cx + 3, sy + 14);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(55,50,70,0.85)';
    ctx.beginPath();
    ctx.arc(cx, 112 + swing, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wall torches
  const torchXs = [36, 200, 495, 705, 895, 1064];
  for (const tx of torchXs) baDrawTorch(ctx, tx, 290, f);

  // ── Lava floor cracks ───────────────────────────────────────
  const crackXs = [140, 340, 595, 815, 1005];
  for (const cx of crackXs) {
    const flicker = 0.10 + Math.sin(f * 0.07 + cx * 0.01) * 0.05;
    const glow    = ctx.createRadialGradient(cx, BA_GROUND_Y, 0, cx, BA_GROUND_Y, 38);
    glow.addColorStop(0, `rgba(255,75,0,${flicker})`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 40, BA_GROUND_Y - 6, 80, 22);
    ctx.strokeStyle = `rgba(255,110,20,${flicker * 2.8})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 32, BA_GROUND_Y + 2);
    ctx.lineTo(cx - 14, BA_GROUND_Y + 6);
    ctx.lineTo(cx + 6,  BA_GROUND_Y + 2);
    ctx.lineTo(cx + 20, BA_GROUND_Y + 7);
    ctx.lineTo(cx + 34, BA_GROUND_Y + 3);
    ctx.stroke();
  }

  // ── Ground ──────────────────────────────────────────────────
  ctx.fillStyle = '#160e1e';
  ctx.fillRect(0, BA_GROUND_Y, W, H - BA_GROUND_Y);
  ctx.strokeStyle = 'rgba(130,55,200,0.38)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, BA_GROUND_Y); ctx.lineTo(W, BA_GROUND_Y);
  ctx.stroke();

  // ── Platforms ───────────────────────────────────────────────
  for (let i = 1; i < BA_PLATFORMS.length; i++) {
    const p = BA_PLATFORMS[i];
    ctx.fillStyle = '#221430';
    ctx.fillRect(p.x, p.y, p.w, 14);
    ctx.fillStyle = 'rgba(180,90,255,0.18)';
    ctx.fillRect(p.x, p.y, p.w, 2);
    ctx.fillStyle = 'rgba(90,25,160,0.12)';
    ctx.fillRect(p.x, p.y + 14, p.w, 8);
  }

  // ── Shockwaves ──────────────────────────────────────────────
  for (const s of baWarden.shockwaves) {
    const a    = Math.min(1, s.timer / 30);
    const puls = 0.5 + Math.sin(f * 0.35) * 0.28;
    ctx.save();
    const wg = ctx.createRadialGradient(s.x, BA_GROUND_Y, 0, s.x, BA_GROUND_Y, 44);
    wg.addColorStop(0, `rgba(255,120,0,${a * puls})`);
    wg.addColorStop(1, 'transparent');
    ctx.fillStyle = wg;
    ctx.fillRect(s.x - 46, BA_GROUND_Y - 34, 92, 64);
    ctx.strokeStyle = `rgba(255,175,55,${a})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s.x - 22, BA_GROUND_Y);
    ctx.quadraticCurveTo(s.x, BA_GROUND_Y - 24, s.x + 22, BA_GROUND_Y);
    ctx.stroke();
    ctx.restore();
  }

  // Boss + player(s)
  baDrawWarden(ctx, f);
  baDrawPlayer(ctx, f);
  // Remote player (if in multiplayer)
  if (typeof mp !== 'undefined' && mp.inRoom && mp.remotePlayer.visible) {
    baDrawRemotePlayer(ctx, f);
  }

  // Floating popups
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  for (const p of baPopups) {
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 6;
    ctx.fillText(p.text, p.x, p.y);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  // Boss HP bar (top-centre)
  baDrawBossBar(ctx, W);

  // Player HP bar (bottom-left)
  baDrawPlayerBar(ctx);
  // Remote player HP bar (if in multiplayer)
  if (typeof mp !== 'undefined' && mp.inRoom && mp.remotePlayer.visible) {
    baDrawRemotePlayerBar(ctx);
  }

  // Phase 2 border pulse
  if (baWarden.phase2 && baWarden.state !== 'dead') {
    const pa = 0.28 + Math.sin(f * 0.1) * 0.14;
    ctx.fillStyle = `rgba(255,30,0,${pa})`;
    ctx.fillRect(0, 0, W, 3);
    ctx.fillRect(0, H - 3, W, 3);
    ctx.fillRect(0, 0, 3, H);
    ctx.fillRect(W - 3, 0, 3, H);
  }

  // Controls hint
  ctx.fillStyle = 'rgba(170,160,210,0.22)';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('← → Move  ·  Space Jump  ·  E Attack  ·  Q Block  ·  Esc Leave', W / 2, H - 8);

  // Victory overlay
  if (baVictory) baDrawVictory(ctx, W, H, f);

  // Death overlay — fades to black before the tutorial fires
  if (baChar.action === 'dead') {
    const dt = baChar.deathTimer;
    const fade = Math.min(0.92, (130 - dt) / 55);
    ctx.fillStyle = `rgba(40,0,0,${fade})`;
    ctx.fillRect(0, 0, W, H);
    if (dt < 75) {
      ctx.fillStyle = `rgba(255,60,60,${Math.min(1,(75-dt)/30)})`;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 12;
      ctx.fillText('DEFEATED', W / 2, H / 2 - 8);
      ctx.shadowBlur = 0;
    }
  }

  ctx.restore(); // end shake
}

// ── TORCH ─────────────────────────────────────────────────────
function baDrawTorch(ctx, x, y, f) {
  ctx.fillStyle = '#352243';
  ctx.fillRect(x - 4, y - 22, 8, 22);
  ctx.fillRect(x - 9, y - 5, 18, 5);
  const fk = Math.sin(f * 0.19 + x * 0.05);
  ctx.save();
  ctx.translate(x, y - 24);
  const flame = ctx.createRadialGradient(fk * 2, -6, 0, 0, -6, 16);
  flame.addColorStop(0, `rgba(255,225,80,${0.88 + fk * 0.08})`);
  flame.addColorStop(0.5, `rgba(255,95,15,${0.62 + fk * 0.1})`);
  flame.addColorStop(1, 'transparent');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.ellipse(fk * 2, -6, 7, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  const tg = ctx.createRadialGradient(0, 0, 2, 0, 0, 75);
  tg.addColorStop(0, `rgba(255,155,25,${0.07 + fk * 0.03})`);
  tg.addColorStop(1, 'transparent');
  ctx.fillStyle = tg;
  ctx.fillRect(-76, -76, 152, 130);
  ctx.restore();
}

// ── DRAW WARDEN ───────────────────────────────────────────────
function baDrawWarden(ctx, f) {
  const w  = baWarden;
  if (w.state === 'dead' && w.deathTimer <= 0) return;
  const wx = Math.round(w.x);
  const wy = Math.round(w.y);

  if (w.state === 'dead') ctx.globalAlpha = Math.max(0, w.deathTimer / 100);

  // Phase 2 rage aura
  if (w.phase2 && w.state !== 'dead') {
    const pulse = 0.11 + Math.sin(f * 0.15) * 0.07;
    ctx.fillStyle = `rgba(255,20,0,${pulse})`;
    ctx.fillRect(wx - 14, wy - 22, w.w + 28, w.h + 22);
  }

  // Charge speed-trail
  if (w.state === 'charging') {
    for (let t = 1; t <= 4; t++) {
      ctx.globalAlpha = 0.11 * (5 - t);
      ctx.fillStyle = '#cc2200';
      ctx.fillRect(wx - w.chargeVx * t * 1.8, wy, w.w, w.h);
    }
    ctx.globalAlpha = w.state === 'dead' ? Math.max(0, w.deathTimer / 100) : 1;
  }

  // Slam windup glow
  if (w.state === 'slam_windup') {
    const pulse = 0.38 + Math.sin(f * 0.38) * 0.28;
    ctx.fillStyle = `rgba(255,85,0,${pulse})`;
    ctx.fillRect(wx - 10, wy - 12, w.w + 20, w.h + 12);
  }

  // Normal / charge windup telegraph
  if (w.state === 'windup' || w.state === 'charge_windup') {
    const pulse = 0.33 + Math.sin(f * 0.5) * 0.28;
    ctx.fillStyle = `rgba(255,50,0,${pulse})`;
    ctx.fillRect(wx - 6, wy - 14, w.w + 12, w.h + 14);
  }

  // Stagger flash
  if (w.state === 'stagger' && Math.floor(f / 3) % 2 === 0) ctx.globalAlpha = 0.35;

  // Legs
  const legSwing = (w.state === 'aggro' || w.state === 'charging') ? Math.sin(f * 0.22) * 5 : 0;
  ctx.fillStyle = '#1a0020';
  ctx.fillRect(wx + 5,        wy + w.h - 18, 11, 18 + legSwing);
  ctx.fillRect(wx + w.w - 16, wy + w.h - 18, 11, 18 - legSwing);

  // Body (long coat)
  ctx.fillStyle = w.phase2 ? '#4a0000' : '#1c0030';
  ctx.fillRect(wx + 2, wy + 12, w.w - 4, w.h - 26);

  // Coat lapels
  ctx.fillStyle = '#33104a';
  ctx.fillRect(wx + 4,        wy + 12, 7, 10);
  ctx.fillRect(wx + w.w - 11, wy + 12, 7, 10);

  // Shoulders
  ctx.fillStyle = w.phase2 ? '#660000' : '#280040';
  ctx.fillRect(wx - 4,        wy + 10, 9, 12);
  ctx.fillRect(wx + w.w - 5,  wy + 10, 9, 12);

  // Helmet
  ctx.fillStyle = '#111120';
  ctx.fillRect(wx + 5, wy - 2, w.w - 10, 14);

  // Spikes
  ctx.fillStyle = '#cc2222';
  ctx.fillRect(wx + 13, wy - 8, 4, 8);
  ctx.fillRect(wx + 7,  wy - 6, 3, 5);
  ctx.fillRect(wx + 20, wy - 6, 3, 5);

  // Eyes
  const eyeA = 0.7 + Math.sin(f * 0.13) * 0.25;
  ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10;
  ctx.fillStyle = `rgba(255,20,0,${eyeA})`;
  if (w.facing === 1) {
    ctx.fillRect(wx + 18, wy + 2, 5, 4);
    ctx.fillRect(wx + 24, wy + 2, 5, 4);
  } else {
    ctx.fillRect(wx + 6,  wy + 2, 5, 4);
    ctx.fillRect(wx + 12, wy + 2, 5, 4);
  }
  ctx.shadowBlur = 0;

  // Club weapon
  const wAng = (w.state === 'attack')
    ? 0.85
    : (w.state === 'windup' || w.state === 'charge_windup')
      ? 0.35 + Math.sin(f * 0.5) * 0.2
      : 0.15;
  const armX = w.facing === 1 ? wx + w.w + 2 : wx - 5;
  ctx.fillStyle = '#3e2000';
  ctx.save();
  ctx.translate(armX, wy + 8);
  ctx.rotate(wAng * w.facing);
  ctx.fillRect(-3, -24, 7, 26);
  ctx.fillStyle = '#665533';
  ctx.fillRect(-7, -30, 15, 10);
  ctx.restore();

  ctx.globalAlpha = 1;
}

// ── DRAW PLAYER ───────────────────────────────────────────────
function baDrawPlayer(ctx, f) {
  const c = baChar;
  if (c.action === 'dead' && c.deathTimer <= 0) return;

  const cx = Math.round(c.x);
  const cy = Math.round(c.y);

  // Hurt flash
  if (c.action === 'dead') {
    ctx.globalAlpha = Math.max(0, c.deathTimer / 80);
  } else if (c.hurtTimer > 0 && Math.floor(c.hurtTimer / 4) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }

  const walkBob = c.onGround && c.action === 'walk' ? Math.sin(f * 0.26) * 2 : 0;
  const bodyY   = cy + walkBob;

  // Resolve appearance from playerCharData
  const pcd    = typeof playerCharData !== 'undefined' ? playerCharData : null;
  let skinCol  = '#c8a070';
  let hairCol  = '#1e1e1e';
  let shirtCol = c.blocking ? '#2255cc' : '#1e44aa';
  if (pcd) {
    if (pcd.skin)             skinCol  = pcd.skin;
    if (pcd.type === 'alien') skinCol  = '#55bb66';
    if (pcd.type === 'female') shirtCol = c.blocking ? '#bb2266' : '#cc4488';
    if (pcd.type !== 'alien' && pcd.hair) hairCol = pcd.hair;
  }

  // Shield (off-hand side)
  if (typeof playerEquip !== 'undefined' && playerEquip?.offhand) {
    const shieldX = c.facing === 1 ? cx - 7 : cx + c.w - 1;
    if (typeof drawShield === 'function') drawShield(ctx, shieldX, bodyY + 2, c.blocking && c.atkFrame < 0);
  }

  // Body hoodie
  ctx.fillStyle = shirtCol;
  ctx.fillRect(cx + 2, bodyY, c.w - 4, c.h - 12);

  // Head
  ctx.fillStyle = skinCol;
  ctx.fillRect(cx + 4, bodyY - 10, c.w - 8, 10);

  // Hair
  ctx.fillStyle = hairCol;
  ctx.fillRect(cx + 4, bodyY - 10, c.w - 8, 4);
  if (pcd && pcd.type === 'female') {
    ctx.fillRect(cx + 4,          bodyY - 10, 3, 14);
    ctx.fillRect(cx + c.w - 7,    bodyY - 10, 3, 14);
  }

  // Eye
  ctx.fillStyle = '#eeeeee';
  ctx.fillRect(c.facing === 1 ? cx + 10 : cx + 4, bodyY - 7, 3, 3);

  // Alien overlay
  if (pcd && pcd.type === 'alien') {
    const hx = cx + 4, hy = bodyY - 10;
    ctx.fillStyle = '#55bb66';
    ctx.fillRect(hx, hy, 12, 3); ctx.fillRect(hx, hy, 3, 8);
    ctx.fillStyle = '#88ffcc';
    ctx.fillRect(hx + 5, hy - 3, 2, 4);
    ctx.fillStyle = '#000022';
    ctx.fillRect(hx + 1, hy + 4, 4, 4); ctx.fillRect(hx + 7, hy + 4, 4, 4);
    ctx.fillStyle = '#88ccff';
    ctx.fillRect(hx + 2, hy + 5, 2, 2); ctx.fillRect(hx + 8, hy + 5, 2, 2);
  }

  // Sword (weapon side)
  if (typeof playerEquip !== 'undefined' && playerEquip?.weapon && typeof drawSword === 'function') {
    let swordAngle = 0.3;
    if (c.atkFrame >= 0) {
      const af = c.atkFrame;
      if (af < BA_ATK_WINDUP) {
        swordAngle = 0.3 + (af / BA_ATK_WINDUP) * 1.0;
      } else if (af < BA_ATK_WINDUP + BA_ATK_ACTIVE) {
        const t = (af - BA_ATK_WINDUP) / BA_ATK_ACTIVE;
        swordAngle = 1.3 - t * 2.0;
      } else {
        const t = (af - BA_ATK_WINDUP - BA_ATK_ACTIVE) / BA_ATK_RECOVERY;
        swordAngle = -0.7 + t * 1.0;
      }
    }
    const swordArmX = c.facing === 1 ? cx + c.w + 1 : cx - 3;
    drawSword(ctx, swordArmX, bodyY + 4, swordAngle, c.facing);
  }

  // Legs
  const legSwing = c.onGround && c.action === 'walk' ? Math.sin(f * 0.26) * 4 : 0;
  ctx.fillStyle = '#112244';
  ctx.fillRect(cx + 3,         bodyY + c.h - 12, 6, 12 + legSwing);
  ctx.fillRect(cx + c.w - 9,   bodyY + c.h - 12, 6, 12 - legSwing);

  ctx.globalAlpha = 1;
}

// ── BOSS HP BAR ───────────────────────────────────────────────
function baDrawBossBar(ctx, W) {
  const w = baWarden;
  if (w.state === 'dead' && w.deathTimer <= 30) return;
  const barW = 420, barH = 14;
  const barX = (W - barW) / 2;
  const barY = 16;
  const hpPct = Math.max(0, w.hp / w.maxHp);

  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(barX - 3, barY - 3, barW + 6, barH + 20);
  ctx.strokeStyle = w.phase2 ? 'rgba(255,55,0,0.75)' : 'rgba(145,45,255,0.75)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX - 3, barY - 3, barW + 6, barH + 20);

  // Damage fill
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = hpPct > 0.5 ? '#cc2222' : '#ff6500';
  ctx.fillRect(barX, barY, Math.round(barW * hpPct), barH);

  // Segment ticks
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 10; i++) {
    const sx = barX + (barW / 10) * i;
    ctx.beginPath(); ctx.moveTo(sx, barY); ctx.lineTo(sx, barY + barH); ctx.stroke();
  }

  ctx.fillStyle = w.phase2 ? '#ff8844' : '#cc88ff';
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DOWNTOWN WARDEN' + (w.phase2 ? '  ⚡ ENRAGED' : ''), W / 2, barY + barH + 10);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '7px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.max(0, w.hp)} / ${w.maxHp}`, barX + barW, barY + barH + 10);
}

// ── PLAYER HP BAR ─────────────────────────────────────────────
function baDrawPlayerBar(ctx) {
  const c = baChar;
  const barW = 165, barH = 9;
  const barX = 16, barY = BA_H - 38;
  const hpPct = Math.max(0, c.hp / c.maxHp);

  ctx.fillStyle = 'rgba(0,0,0,0.76)';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 15);
  ctx.strokeStyle = 'rgba(100,200,100,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 15);
  ctx.fillStyle = '#0a140a';
  ctx.fillRect(barX, barY, barW, barH);
  const hpCol = hpPct > 0.5 ? '#44cc66' : hpPct > 0.25 ? '#cccc22' : '#cc2222';
  ctx.fillStyle = hpCol;
  ctx.fillRect(barX, barY, Math.round(barW * hpPct), barH);
  ctx.fillStyle = 'rgba(190,220,190,0.5)';
  ctx.font = '7px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`HP  ${Math.max(0, c.hp)} / ${c.maxHp}`, barX, barY + barH + 9);
}

// ── REMOTE PLAYER (arena) ─────────────────────────────────────
function baDrawRemotePlayer(ctx, f) {
  const rp = mp.remotePlayer;
  const rx = Math.round(rp.x);
  const ry = Math.round(rp.y);
  const face = rp.facing;
  const w = 20, h = 32;

  // Hurt flash skip (simple alpha pulse based on hp)
  ctx.save();

  // Walk bob
  const walkBob = rp.action === 'walk' ? Math.sin(f * 0.26) * 2 : 0;
  const bY = ry + walkBob;

  // Body (teal — distinct from local player blue)
  ctx.fillStyle = '#226688';
  ctx.fillRect(rx + 2, bY, w - 4, h - 12);

  // Head
  ctx.fillStyle = '#c8a070';
  ctx.fillRect(rx + 4, bY - 10, w - 8, 10);

  // Hair (purple)
  ctx.fillStyle = '#7744aa';
  ctx.fillRect(rx + 4, bY - 10, w - 8, 4);

  // Eye
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(face === 1 ? rx + 10 : rx + 4, bY - 7, 3, 3);

  // Legs
  const legSwing = rp.action === 'walk' ? Math.sin(f * 0.26) * 4 : 0;
  ctx.fillStyle = '#112244';
  ctx.fillRect(rx + 3,     bY + h - 12, 6, 12 + legSwing);
  ctx.fillRect(rx + w - 9, bY + h - 12, 6, 12 - legSwing);

  // Name tag
  ctx.fillStyle = 'rgba(0,15,30,0.72)';
  ctx.fillRect(rx - 4, bY - 23, 28, 11);
  ctx.fillStyle = '#88ddff';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('P2', rx + w / 2, bY - 14);
  ctx.textAlign = 'left';

  ctx.restore();
}

function baDrawRemotePlayerBar(ctx) {
  const rp   = mp.remotePlayer;
  const barW = 165, barH = 9;
  const barX = 16, barY = BA_H - 64; // above local player bar
  const hpPct = Math.max(0, rp.hp / Math.max(1, rp.maxHp));

  ctx.fillStyle = 'rgba(0,0,0,0.76)';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 15);
  ctx.strokeStyle = 'rgba(100,180,220,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 15);
  ctx.fillStyle = '#0a1014';
  ctx.fillRect(barX, barY, barW, barH);
  const hpCol = hpPct > 0.5 ? '#44aacc' : hpPct > 0.25 ? '#cccc22' : '#cc2222';
  ctx.fillStyle = hpCol;
  ctx.fillRect(barX, barY, Math.round(barW * hpPct), barH);
  ctx.fillStyle = 'rgba(150,200,220,0.5)';
  ctx.font = '7px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`P2  ${Math.max(0, rp.hp)} / ${rp.maxHp}`, barX, barY + barH + 9);
}

// ── VICTORY OVERLAY ───────────────────────────────────────────
function baDrawVictory(ctx, W, H, f) {
  const progress = 1 - (baVictoryTimer / 260);
  ctx.fillStyle = `rgba(2,0,18,${Math.min(0.72, progress * 1.4)})`;
  ctx.fillRect(0, 0, W, H);

  if (baVictoryTimer < 220) {
    const fa = Math.min(1, (220 - baVictoryTimer) / 55);
    ctx.textAlign = 'center';
    ctx.shadowColor = '#8844cc'; ctx.shadowBlur = 22;
    ctx.fillStyle = `rgba(200,175,255,${fa})`;
    ctx.font = 'bold 18px monospace';
    ctx.fillText('WARDEN DEFEATED', W / 2, H / 2 - 26);
    ctx.shadowBlur = 0;

    ctx.fillStyle = `rgba(255,215,0,${fa})`;
    ctx.font = '11px monospace';
    ctx.fillText('+300 Combat XP   ·   +$500   ·   Warden\'s Badge', W / 2, H / 2 + 4);

    const fa2 = Math.min(0.65, (190 - baVictoryTimer) / 55);
    ctx.fillStyle = `rgba(170,155,210,${fa2})`;
    ctx.font = '8px monospace';
    ctx.fillText('Returning to Downtown Strip...', W / 2, H / 2 + 26);
  }
}

// ── MAIN LOOP ─────────────────────────────────────────────────
function bossArenaLoop() {
  baLoopRunning = true;
  if (!bossArenaActive) { baLoopRunning = false; return; }

  // Pause loop while tutorial is open
  if (baTutOpen) {
    drawBossArenaScene();
    requestAnimationFrame(bossArenaLoop);
    return;
  }

  bossArenaFrame++;

  // Hit-stop freeze
  if (baHitStop > 0) {
    baHitStop--;
    drawBossArenaScene();
    requestAnimationFrame(bossArenaLoop);
    return;
  }

  try {

  if (baScreenShake > 0) baScreenShake--;

  // Victory countdown — then auto-return
  if (baVictory) {
    baVictoryTimer--;
    if (baVictoryTimer <= 0) { baLoopRunning = false; leaveBossArena(true); return; }
  }

  // Player death — exit arena and show consumable tutorial
  if (baChar.action === 'dead') {
    baChar.deathTimer--;
    if (baChar.deathTimer <= 0) showBaDeathTutorial();
  }

  baPhysics();

  // ── Boss AI: only run on host (or solo) ─────────────────────
  const mpGuest = typeof mp !== 'undefined' && mp.inRoom && !mp.isHost;
  if (!baVictory && !mpGuest) baTickWarden();

  // ── MULTIPLAYER sync ─────────────────────────────────────────
  if (typeof mp !== 'undefined' && mp.inRoom) {
    // Host sends boss state every 3 frames
    if (mp.isHost && bossArenaFrame % 3 === 0) {
      mp.sendBossState({
        x: baWarden.x, y: baWarden.y,
        hp: baWarden.hp, state: baWarden.state,
        facing: baWarden.facing, phase2: baWarden.phase2,
        shockwaves: baWarden.shockwaves,
      });
    }
    // Both players send their own position every 3 frames
    if (bossArenaFrame % 3 === 0) {
      mp.sendPlayerState({
        x: baChar.x, y: baChar.y,
        facing: baChar.facing, action: baChar.action,
        hp: baChar.hp, maxHp: baChar.maxHp,
      });
    }
    // Interpolate remote player position
    mp.tickInterpolation();
  }

  baTickShockwaves();

  // Advance popups
  for (let i = baPopups.length - 1; i >= 0; i--) {
    const p = baPopups[i];
    p.y    += p.vy;
    p.alpha -= 0.018;
    if (p.alpha <= 0) baPopups.splice(i, 1);
  }

  drawBossArenaScene();

  } catch (err) {
    console.error('[bossArenaLoop]', err);
  }

  requestAnimationFrame(bossArenaLoop);
}

// ── KEY EVENTS ────────────────────────────────────────────────
document.addEventListener('keydown', function(ev) {
  if (!bossArenaActive) return;
  if (baTutOpen) {
    if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Escape') hideBossArenaTut();
    return;
  }
  if (ev.key === 'ArrowLeft'  || ev.key === 'a' || ev.key === 'A') { baKeyLeft  = true; ev.preventDefault(); }
  if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') { baKeyRight = true; ev.preventDefault(); }
  if (ev.key === 'ArrowUp' || ev.key === ' ' || ev.key === 'w' || ev.key === 'W') { baKeyJump = true; ev.preventDefault(); }
  if (ev.key === 'q' || ev.key === 'Q') { baKeyBlock = true; ev.preventDefault(); }
  if (ev.key === 'e' || ev.key === 'E') { baPlayerAttack(); ev.preventDefault(); }
  if (ev.key === 'Escape') { leaveBossArena(true); ev.preventDefault(); }
}, true);

document.addEventListener('keyup', function(ev) {
  if (!bossArenaActive) return;
  if (ev.key === 'ArrowLeft'  || ev.key === 'a' || ev.key === 'A') baKeyLeft  = false;
  if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') baKeyRight = false;
  if (ev.key === 'ArrowUp' || ev.key === ' ' || ev.key === 'w' || ev.key === 'W') baKeyJump = false;
  if (ev.key === 'q' || ev.key === 'Q') baKeyBlock = false;
}, true);
