// ── QUEST SYSTEM ──────────────────────────────────────────────────────────────
// Quest definitions, state, and engine.
// initQuests()      — called at game start (save.js > startGame)
// activateQuest(id) — called by tutorial finish() and claimQuest() for chains
// tickQuests()      — called every frame in npc.js loop()
// completeQuest(id) — marks quest 'claimable' when all objectives met
// claimQuest(id)    — player-triggered: gives rewards, hides quest, activates next

// ── QUEST DEFINITIONS ─────────────────────────────────────────────────────────
const QUEST_DB = [

  // ── Q1 ──────────────────────────────────────────────────────────────────────
  {
    id:    'visit_mines',
    title: 'Into the Deep',
    desc:  'Head to the Stonepick Mines and see what awaits.',
    icon:  '⛏️',
    objectives: [
      { id: 'enter_mines', label: 'Enter the Stonepick Mines', total: 1 },
    ],
    rewards: { money: 75, items: [{ id: 'copper_ore', qty: 5 }], nextQuest: 'arm_yourself' },
  },

  // ── Q2 ──────────────────────────────────────────────────────────────────────
  {
    id:    'arm_yourself',
    title: 'Armed and Ready',
    desc:  'Forge a scrap sword and buckler from your mined materials, then push into the Downtown Strip.',
    icon:  '⚔️',
    objectives: [
      { id: 'craft_sword',    label: 'Craft a Scrap Shortsword',   total: 1 },
      { id: 'craft_shield',   label: 'Craft a Scrap Buckler',      total: 1 },
      { id: 'equip_sword',    label: 'Equip the Scrap Shortsword', total: 1 },
      { id: 'equip_shield',   label: 'Equip the Scrap Buckler',    total: 1 },
      { id: 'enter_downtown', label: 'Enter the Downtown Strip',   total: 1 },
    ],
    rewards: { money: 150, items: [], nextQuest: 'smelters_mark' },
  },

  // ── Q3 ──────────────────────────────────────────────────────────────────────
  {
    id:    'smelters_mark',
    title: 'Smelter\'s Mark',
    desc:  'Raw ore is just rock until you refine it. Smelt copper ingots — you\'ll need them to forge copper gear.',
    icon:  '🔥',
    objectives: [
      { id: 'smelt_copper', label: 'Smelt a Copper Ingot', total: 1 },
    ],
    rewards: { money: 200, items: [{ id: 'copper_ingot', qty: 2 }], nextQuest: 'full_kit' },
  },

  // ── Q4 ──────────────────────────────────────────────────────────────────────
  {
    id:    'full_kit',
    title: 'Full Kit',
    desc:  'Scrap gear is just the beginning. Upgrade to Copper — craft and equip a full set of head, chest, legs, boots, and gauntlets.',
    icon:  '🛡',
    objectives: [
      { id: 'craft_helm',   label: 'Craft a Copper Helmet',        total: 1 },
      { id: 'equip_helm',   label: 'Equip the Copper Helmet',      total: 1 },
      { id: 'craft_chest',  label: 'Craft a Copper Chestplate',    total: 1 },
      { id: 'equip_chest',  label: 'Equip the Copper Chestplate',  total: 1 },
      { id: 'craft_legs',   label: 'Craft Copper Legguards',       total: 1 },
      { id: 'equip_legs',   label: 'Equip the Copper Legguards',   total: 1 },
      { id: 'craft_boots',  label: 'Craft Copper Boots',           total: 1 },
      { id: 'equip_boots',  label: 'Equip the Copper Boots',       total: 1 },
      { id: 'craft_gloves', label: 'Craft Copper Gauntlets',       total: 1 },
      { id: 'equip_gloves', label: 'Equip the Copper Gauntlets',   total: 1 },
    ],
    rewards: { money: 150, items: [{ id: 'scrap_metal', qty: 8 }, { id: 'fiber', qty: 4 }], nextQuest: 'the_veteran' },
  },

  // ── Q5 ──────────────────────────────────────────────────────────────────────
  {
    id:    'the_veteran',
    title: 'The Veteran',
    desc:  'Survive, fight, forge. Prove you\'ve mastered the basics before the Strip\'s real threat shows itself.',
    icon:  '🏆',
    objectives: [
      { id: 'mining_lv5',   label: 'Reach Mining Level 5',   total: 1 },
      { id: 'combat_lv5',   label: 'Reach Combat Level 5',   total: 1 },
      { id: 'crafting_lv5', label: 'Reach Crafting Level 5', total: 1 },
    ],
    rewards: { money: 400, items: [{ id: 'scrap_metal', qty: 15 }], nextQuest: 'street_brawler' },
  },

  // ── Q6 ──────────────────────────────────────────────────────────────────────
  {
    id:    'street_brawler',
    title: 'Street Brawler',
    desc:  'The Strip won\'t respect you until you\'ve put some enemies down. Fight your way through.',
    icon:  '🥊',
    objectives: [
      { id: 'kill_enemies', label: 'Defeat enemies in the Downtown Strip', total: 15 },
    ],
    rewards: { money: 250, items: [{ id: 'copper_ore', qty: 6 }], nextQuest: 'warden_call' },
  },

  // ── Q7 ──────────────────────────────────────────────────────────────────────
  {
    id:    'warden_call',
    title: 'The Warden\'s Call',
    desc:  'Something powerful lurks at the end of the Strip. Farm the crew for Street Tags, forge a Warden\'s Summon, then open the portal.',
    icon:  '🌀',
    objectives: [
      { id: 'craft_sigil', label: 'Craft a Warden\'s Summon',      total: 1 },
      { id: 'use_portal',  label: 'Use the Summon at the portal',  total: 1 },
    ],
    rewards: { money: 500, items: [], nextQuest: 'downtown_warden' },
  },

  // ── Q8 (BOSS) ────────────────────────────────────────────────────────────────
  {
    id:    'downtown_warden',
    title: 'The Downtown Warden',
    desc:  'The Warden controls everything in this strip. Take him down and the gate to Tier 2 opens.',
    icon:  '💀',
    objectives: [
      { id: 'defeat_warden', label: 'Defeat the Downtown Warden', total: 1 },
    ],
    rewards: { money: 1000, items: [{ id: 'wardens_badge', qty: 1 }], nextQuest: null },
  },

];

// ── QUEST STATE ───────────────────────────────────────────────────────────────
// Populated by initQuests(); persisted via save.js.
// Statuses: 'inactive' | 'active' | 'claimable' | 'claimed'
// 'claimable' = all objectives done, player must click CLAIM to collect reward.
// 'claimed'   = reward taken, quest removed from panel.
let questState = {};

// ── INIT ──────────────────────────────────────────────────────────────────────
function initQuests() {
  QUEST_DB.forEach(q => {
    if (!questState[q.id]) {
      const progress = {};
      q.objectives.forEach(o => { progress[o.id] = 0; });
      questState[q.id] = { status: 'inactive', progress };
    }
  });
}

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
function activateQuest(id) {
  const def = QUEST_DB.find(q => q.id === id);
  if (!def) return;
  const state = questState[id];
  if (!state || state.status !== 'inactive') return;
  state.status = 'active';
  addLog(`📋 New quest: ${def.title}`);
  showSpeech(`New quest: ${def.title} — ${def.desc}`, 6000);
  renderQuestPanel();
}

// ── ADVANCE OBJECTIVE ─────────────────────────────────────────────────────────
function advanceObjective(questId, objId, amount) {
  const def   = QUEST_DB.find(q => q.id === questId);
  const state = questState[questId];
  if (!def || !state || state.status !== 'active') return;
  const obj = def.objectives.find(o => o.id === objId);
  if (!obj) return;
  const prev = state.progress[objId] || 0;
  if (prev >= obj.total) return;
  state.progress[objId] = Math.min(prev + amount, obj.total);

  const allDone = def.objectives.every(o => (state.progress[o.id] || 0) >= o.total);
  if (allDone) completeQuest(questId);
  else renderQuestPanel();
}

// ── COMPLETE (sets claimable — no rewards yet) ─────────────────────────────
function completeQuest(id) {
  const def   = QUEST_DB.find(q => q.id === id);
  const state = questState[id];
  if (!def || !state || state.status !== 'active') return;
  state.status = 'claimable';
  addLog(`📋 "${def.title}" ready to claim!`);
  showSpeech(`Quest done: ${def.title} — open the quest panel to claim your reward!`, 6000);
  renderQuestPanel();
  updateQuestBadge();
}

// ── CLAIM (player-triggered: give rewards, hide quest, chain next) ───────────
function claimQuest(id) {
  const def   = QUEST_DB.find(q => q.id === id);
  const state = questState[id];
  if (!def || !state || state.status !== 'claimable') return;
  state.status = 'claimed';

  if (def.rewards.money)  addMoney(def.rewards.money);
  (def.rewards.items || []).forEach(r => invAddItem(r.id, r.qty));

  addLog(`🎉 Reward claimed: ${def.title} (+$${def.rewards.money || 0})`);
  showQuestToast(def);

  if (def.id === 'visit_mines')     showCraftingIntroScreen();
  if (def.id === 'downtown_warden') unlockTier2();

  if (def.rewards.nextQuest) activateQuest(def.rewards.nextQuest);

  renderQuestPanel();
  updateQuestBadge();
}

// ── TICK ──────────────────────────────────────────────────────────────────────
function tickQuests() {

  // ── Q1: visit_mines ───────────────────────────────────────────────────────
  const vmState = questState['visit_mines'];
  if (vmState?.status === 'active') {
    if (char.loc === 'mines') advanceObjective('visit_mines', 'enter_mines', 1);
  }

  // ── Q2: arm_yourself ──────────────────────────────────────────────────────
  const ayState = questState['arm_yourself'];
  if (ayState?.status === 'active') {
    if ((ayState.progress['craft_sword']  || 0) < 1) {
      if (playerInv.some(s => s?.id === 't1_sword')  || playerEquip?.weapon?.id  === 't1_sword')
        advanceObjective('arm_yourself', 'craft_sword', 1);
    }
    if ((ayState.progress['craft_shield'] || 0) < 1) {
      if (playerInv.some(s => s?.id === 't1_shield') || playerEquip?.offhand?.id === 't1_shield')
        advanceObjective('arm_yourself', 'craft_shield', 1);
    }
    if ((ayState.progress['equip_sword']  || 0) < 1) {
      if (playerEquip?.weapon?.id  === 't1_sword')  advanceObjective('arm_yourself', 'equip_sword',  1);
    }
    if ((ayState.progress['equip_shield'] || 0) < 1) {
      if (playerEquip?.offhand?.id === 't1_shield') advanceObjective('arm_yourself', 'equip_shield', 1);
    }
    if ((ayState.progress['enter_downtown'] || 0) < 1) {
      if (typeof downtownActive !== 'undefined' && downtownActive)
        advanceObjective('arm_yourself', 'enter_downtown', 1);
    }
  }

  // ── Q3: full_kit ──────────────────────────────────────────────────────────
  const fkState = questState['full_kit'];
  if (fkState?.status === 'active') {
    const checks = [
      ['craft_helm',   't2_helm',   'head'  ],
      ['craft_chest',  't2_chest',  'chest' ],
      ['craft_legs',   't2_legs',   'legs'  ],
      ['craft_boots',  't2_boots',  'boots' ],
      ['craft_gloves', 't2_gloves', 'gloves'],
    ];
    checks.forEach(([craftId, itemId, slot]) => {
      if ((fkState.progress[craftId] || 0) < 1) {
        if (playerInv.some(s => s?.id === itemId) || playerEquip?.[slot]?.id === itemId)
          advanceObjective('full_kit', craftId, 1);
      }
      const equipId = craftId.replace('craft_', 'equip_');
      if ((fkState.progress[equipId] || 0) < 1) {
        if (playerEquip?.[slot]?.id === itemId)
          advanceObjective('full_kit', equipId, 1);
      }
    });
  }

  // ── Q3: smelters_mark ─────────────────────────────────────────────────────
  const smState = questState['smelters_mark'];
  if (smState?.status === 'active') {
    if ((smState.progress['smelt_copper'] || 0) < 1) {
      if (playerInv.some(s => s?.id === 'copper_ingot'))
        advanceObjective('smelters_mark', 'smelt_copper', 1);
    }
  }

  // ── Q4: full_kit — craft/equip checks run above (unchanged)

  // ── Q5: the_veteran ───────────────────────────────────────────────────────
  const tvState = questState['the_veteran'];
  if (tvState?.status === 'active') {
    if ((tvState.progress['mining_lv5']   || 0) < 1) {
      if ((SKILLS.mining?.level   || 0) >= 5) advanceObjective('the_veteran', 'mining_lv5',   1);
    }
    if ((tvState.progress['combat_lv5']   || 0) < 1) {
      if ((SKILLS.combat?.level   || 0) >= 5) advanceObjective('the_veteran', 'combat_lv5',   1);
    }
    if ((tvState.progress['crafting_lv5'] || 0) < 1) {
      if ((SKILLS.crafting?.level || 0) >= 5) advanceObjective('the_veteran', 'crafting_lv5', 1);
    }
  }

  // ── Q6: street_brawler — kill counter driven by advanceObjective() hook in downtown.js

  // ── Q7: warden_call ───────────────────────────────────────────────────────
  const wcState = questState['warden_call'];
  if (wcState?.status === 'active') {
    // craft_sigil: player has a warden_sigil in inventory (or already used it at portal)
    if ((wcState.progress['craft_sigil'] || 0) < 1) {
      const hasSigil   = playerInv.some(s => s?.id === 'warden_sigil');
      const usedPortal = (wcState.progress['use_portal'] || 0) >= 1;
      if (hasSigil || usedPortal) advanceObjective('warden_call', 'craft_sigil', 1);
    }
    // use_portal: driven by portal interaction hook in downtown.js
  }

  // ── Q8: downtown_warden — defeat_warden driven by boss death hook in bossarena.js

}

// ── TIER 2 UNLOCK ─────────────────────────────────────────────────────────────
function unlockTier2() {
  if (typeof tier2Unlocked !== 'undefined') tier2Unlocked = true;
  addLog('🌐 Tier 2 zones unlocked!');
  showSpeech('The gate is open. There\'s a whole world past the Strip.', 8000);
  // Show demo end screen after a short delay so the victory moment lands first
  setTimeout(function() {
    const overlay = document.getElementById('demoEndOverlay');
    if (overlay) overlay.classList.add('open');
  }, 3500);
}

document.getElementById('demoEndDismiss').addEventListener('click', function() {
  document.getElementById('demoEndOverlay').classList.remove('open');
});

// ── TOAST ────────────────────────────────────────────────────────────────────
function showQuestToast(def) {
  const toast = document.getElementById('questToast');
  if (!toast) return;
  document.getElementById('questToastTitle').textContent = def.icon + ' ' + def.title;
  const rewardParts = [];
  if (def.rewards.money) rewardParts.push(`+$${def.rewards.money}`);
  (def.rewards.items || []).forEach(r => {
    const item = typeof ITEM_BY_ID !== 'undefined' && ITEM_BY_ID[r.id];
    rewardParts.push(`+${r.qty}x ${item ? item.name : r.id}`);
  });
  document.getElementById('questToastRewards').textContent =
    rewardParts.length ? rewardParts.join('  ') : 'Reward collected!';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ── PANEL RENDER ─────────────────────────────────────────────────────────────
function renderQuestPanel() {
  const list = document.getElementById('questList');
  if (!list) return;

  const visible = QUEST_DB.filter(q => {
    const s = questState[q.id]?.status;
    return s === 'active' || s === 'claimable';
  });

  if (visible.length === 0) {
    list.innerHTML = '<div style="color:rgba(255,255,255,0.3);font-size:14px;padding:10px 0;">No active quests.</div>';
    return;
  }

  let html = '';
  visible.forEach(q => {
    const st        = questState[q.id];
    const claimable = st.status === 'claimable';

    html += `<div class="quest-item${claimable ? ' quest-item-claimable' : ''}">`;
    html += `<div class="quest-item-header"><span class="quest-icon">${q.icon}</span><span class="quest-title">${q.title}</span></div>`;
    html += `<div class="quest-desc">${q.desc}</div>`;

    q.objectives.forEach(o => {
      const cur  = st.progress[o.id] || 0;
      const pct  = Math.min(100, Math.round((cur / o.total) * 100));
      const done = cur >= o.total;
      html += `<div class="quest-obj${done ? ' quest-obj-done' : ''}">`;
      html += `<span class="quest-obj-label">${done ? '✓ ' : ''}${o.label}</span>`;
      html += `<span class="quest-obj-count">${cur}/${o.total}</span>`;
      html += `</div>`;
      html += `<div class="quest-bar"><div class="quest-bar-fill" style="width:${pct}%"></div></div>`;
    });

    if (claimable) {
      const parts = [];
      if (q.rewards.money) parts.push(`$${q.rewards.money}`);
      (q.rewards.items || []).forEach(r => {
        const item = typeof ITEM_BY_ID !== 'undefined' && ITEM_BY_ID[r.id];
        parts.push(`${r.qty}x ${item ? item.name : r.id}`);
      });
      if (parts.length) html += `<div class="quest-reward-preview">Reward: ${parts.join('  +  ')}</div>`;
      html += `<button class="quest-claim-btn" onclick="claimQuest('${q.id}')">✦ CLAIM REWARD</button>`;
    }

    html += `</div>`;
  });

  list.innerHTML = html;
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
function updateQuestBadge() {
  const hasClaimable = Object.values(questState).some(s => s.status === 'claimable');
  document.getElementById('questBadge')?.classList.toggle('show', hasClaimable);
}

// ── PANEL OPEN / CLOSE ────────────────────────────────────────────────────────
let questPanelOpen = false;

function openQuestPanel() {
  questPanelOpen = true;
  renderQuestPanel();
  document.getElementById('questPanel').classList.add('open');
  document.getElementById('questBtn').textContent = '✕';
}

function closeQuestPanel() {
  questPanelOpen = false;
  document.getElementById('questPanel').classList.remove('open');
  document.getElementById('questBtn').textContent = '📋';
}

// ── CRAFTING INTRO SCREEN ─────────────────────────────────────────────────────
// Shown once when the player claims the 'visit_mines' quest reward.
// Explains the crafting loop, gear tier importance, and the grind ahead.
function showCraftingIntroScreen() {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '950',
    background: 'rgba(0,0,8,0.96)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '"VT323", monospace',
  });

  overlay.innerHTML = `
    <div style="max-width:520px;width:90%;background:linear-gradient(160deg,#080c1a,#0d1228);
      border:2px solid #2a3a6a;border-radius:12px;padding:32px 30px 24px;color:#c8d8f0;
      box-shadow:0 0 60px rgba(40,80,200,0.18);">
      <div style="font-size:11px;letter-spacing:3px;color:#4466aa;margin-bottom:8px;">⚒ CRAFTING BENCH UNLOCKED</div>
      <div style="font-size:32px;font-weight:bold;color:#88aaff;margin-bottom:6px;letter-spacing:1px;">THE GRIND BEGINS</div>
      <div style="font-size:15px;color:rgba(180,200,240,0.6);margin-bottom:22px;letter-spacing:0.5px;">Mine. Forge. Equip. Repeat.</div>

      <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:24px;">
        <div style="display:flex;gap:14px;align-items:flex-start;">
          <span style="font-size:28px;flex-shrink:0;">⛏</span>
          <div>
            <div style="font-size:17px;color:#aaccff;margin-bottom:2px;">GATHER MATERIALS</div>
            <div style="font-size:14px;color:rgba(180,200,230,0.6);line-height:1.4;">Mine ore, chop trees, harvest plants. Higher-tier ores unlock deeper in the mines — the grind never stops, but neither do the rewards.</div>
          </div>
        </div>
        <div style="display:flex;gap:14px;align-items:flex-start;">
          <span style="font-size:28px;flex-shrink:0;">⚒</span>
          <div>
            <div style="font-size:17px;color:#aaccff;margin-bottom:2px;">FORGE BETTER GEAR</div>
            <div style="font-size:14px;color:rgba(180,200,230,0.6);line-height:1.4;">Gear comes in 8 tiers — Scrap to Mythic. Each tier is dramatically more powerful than the last. A Mythic weapon hits 20× harder than scrap and rolls stat bonuses 32× stronger.</div>
          </div>
        </div>
        <div style="display:flex;gap:14px;align-items:flex-start;">
          <span style="font-size:28px;flex-shrink:0;">⚔</span>
          <div>
            <div style="font-size:17px;color:#aaccff;margin-bottom:2px;">FIGHT & LEVEL UP</div>
            <div style="font-size:14px;color:rgba(180,200,230,0.6);line-height:1.4;">Combat, Mining, and Crafting skills all level independently. Higher crafting level = better success rates and access to rarer recipes. Never stop upgrading.</div>
          </div>
        </div>
        <div style="display:flex;gap:14px;align-items:flex-start;">
          <span style="font-size:28px;flex-shrink:0;">💍</span>
          <div>
            <div style="font-size:17px;color:#aaccff;margin-bottom:2px;">STACK EVERY SLOT</div>
            <div style="font-size:14px;color:rgba(180,200,230,0.6);line-height:1.4;">Weapon, shield, armor, gloves, boots — and don't forget rings and earrings. Accessories are the only source of Luck, which improves enemy drops. Fill every slot.</div>
          </div>
        </div>
      </div>

      <div style="font-size:13px;color:rgba(100,140,220,0.5);text-align:center;margin-bottom:18px;letter-spacing:0.5px;">
        Your first quest: craft a Scrap Shortsword and Buckler to enter Downtown.
      </div>

      <button id="craftIntroClose" style="width:100%;padding:12px 0;font-family:'VT323',monospace;
        font-size:20px;letter-spacing:2px;color:#ddeeff;cursor:pointer;border-radius:6px;
        background:linear-gradient(90deg,#1a2d66,#223377);border:1px solid #3355aa;
        transition:background 0.15s;">LET'S GET TO WORK</button>
    </div>`;

  document.body.appendChild(overlay);
  document.getElementById('craftIntroClose').addEventListener('click', () => overlay.remove());
}

// ── BUTTON WIRING ─────────────────────────────────────────────────────────────
document.getElementById('questBtn').addEventListener('click', () => {
  questPanelOpen ? closeQuestPanel() : openQuestPanel();
});
document.getElementById('questClose').addEventListener('click', closeQuestPanel);
