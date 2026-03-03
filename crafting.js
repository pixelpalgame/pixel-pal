// ════════════════════════════════════════════════════════════
// CRAFTING SYSTEM
// Recipes for all Iron Grid equipment pieces.
// Open with [C] or the HUD button. ESC to close.
//
// Locked until player first enters the Mines.
// On first mines entry: crafting unlocks + mines tutorial fires.
// Downtown tutorial fires separately on first downtown attempt.
// ════════════════════════════════════════════════════════════

// ── LOCK STATE ───────────────────────────────────────────────
// Saved/loaded by save.js. Old saves default to true (already past tutorial).
let craftingUnlocked  = false;
let downtownAttempted = false;  // tracks whether downtown tutorial has shown

// ── CRAFT LIST UI STATE ──────────────────────────────────────
const craftCollapsedTiers = new Set(); // tier numbers the user has collapsed

function unlockCrafting() {
  if (craftingUnlocked) return;
  craftingUnlocked = true;
  const btn = document.getElementById('craftHudBtn');
  if (btn) btn.classList.remove('craft-hud-locked');
}

// ── DOWNTOWN TUTORIAL POPUP ──────────────────────────────────
// Called from map.js on first downtown attempt (crafting already unlocked by then).
function showDowntownTutorial() {
  document.getElementById('craftTutorialOverlay').classList.add('open');
}

function hideCraftTutorial() {
  document.getElementById('craftTutorialOverlay').classList.remove('open');
}

// ── RECIPE DATABASE ──────────────────────────────────────────
// output  — item id to produce (must exist in ITEM_BY_ID)
// qty     — how many are produced per craft
// ingredients — array of { id, qty } consumed from inventory
// xp      — hustle XP awarded on success
const RECIPE_DB = [
  {
    id:            'recipe_ig_sword',
    output:        'ig_sword',
    qty:           1,
    tier:          3,
    craftLevelReq: 0,
    successChance: 1.0,
    flavorCraft:   'Ground from scrap rail and wire-wrapped in fiber strips.',
    ingredients: [
      { id:'metal', qty:8 },
      { id:'fiber', qty:3 },
      { id:'coal',  qty:2 },
    ],
    xp: 25,
  },
  {
    id:            'recipe_ig_shield',
    output:        'ig_shield',
    qty:           1,
    tier:          3,
    craftLevelReq: 0,
    successChance: 1.0,
    flavorCraft:   'Pressed steel plate bolted over a rough wooden back-frame.',
    ingredients: [
      { id:'metal', qty:6 },
      { id:'wood',  qty:4 },
      { id:'fiber', qty:2 },
    ],
    xp: 20,
  },
  {
    id:            'recipe_ig_helm',
    output:        'ig_helm',
    qty:           1,
    tier:          3,
    craftLevelReq: 0,
    successChance: 1.0,
    flavorCraft:   'Hard-hat stuffed with fiber padding and clad in stone-weighted plates.',
    ingredients: [
      { id:'metal', qty:5 },
      { id:'fiber', qty:2 },
      { id:'stone', qty:2 },
    ],
    xp: 18,
  },
  {
    id:            'recipe_ig_chest',
    output:        'ig_chest',
    qty:           1,
    tier:          3,
    craftLevelReq: 0,
    successChance: 1.0,
    flavorCraft:   'Riveted scrap-metal vest — needs coal heat to properly harden the plates.',
    ingredients: [
      { id:'metal', qty:10 },
      { id:'fiber', qty:3  },
      { id:'coal',  qty:3  },
    ],
    xp: 35,
  },
  {
    id:            'recipe_ig_legs',
    output:        'ig_legs',
    qty:           1,
    tier:          3,
    craftLevelReq: 0,
    successChance: 1.0,
    flavorCraft:   'Cargo pants reinforced with riveted knee-plates and wooden bracers.',
    ingredients: [
      { id:'metal', qty:6 },
      { id:'wood',  qty:2 },
      { id:'fiber', qty:3 },
    ],
    xp: 22,
  },
  {
    id:            'recipe_ig_boots',
    output:        'ig_boots',
    qty:           1,
    tier:          3,
    craftLevelReq: 0,
    successChance: 1.0,
    flavorCraft:   'Steel-toed stompers built from salvaged scrap and reclaimed timber soles.',
    ingredients: [
      { id:'metal', qty:4 },
      { id:'wood',  qty:3 },
      { id:'fiber', qty:2 },
    ],
    xp: 18,
  },
  // ── GATHERING TOOLS ──────────────────────────────────────────
  {
    id:            'recipe_tool_pickaxe',
    output:        'tool_pickaxe',
    qty:           1,
    tier:          3,
    craftLevelReq: 0,
    successChance: 1.0,
    flavorCraft:   'Iron head ground to a sharp point, hafted onto a split timber handle.',
    ingredients: [
      { id:'metal', qty:4 },
      { id:'wood',  qty:3 },
    ],
    xp: 18,
  },
  {
    id:            'recipe_tool_axe',
    output:        'tool_axe',
    qty:           1,
    tier:          3,
    craftLevelReq: 0,
    successChance: 1.0,
    flavorCraft:   'Heavy iron blade wedged and pinned onto a thick wooden haft.',
    ingredients: [
      { id:'metal', qty:3 },
      { id:'wood',  qty:4 },
    ],
    xp: 16,
  },
  {
    id:            'recipe_tool_scythe',
    output:        'tool_scythe',
    qty:           1,
    tier:          3,
    craftLevelReq: 0,
    successChance: 1.0,
    flavorCraft:   'Curved iron blade lashed to a long wooden shaft with fiber cord.',
    ingredients: [
      { id:'metal', qty:2 },
      { id:'wood',  qty:2 },
      { id:'fiber', qty:3 },
    ],
    xp: 14,
  },
  {
    id:            'recipe_ig_gloves',
    output:        'ig_gloves',
    qty:           1,
    tier:          3,
    craftLevelReq: 0,
    successChance: 1.0,
    flavorCraft:   'Knuckle-plated leather strips backed with raw copper rivets for weight.',
    ingredients: [
      { id:'metal',      qty:3 },
      { id:'fiber',      qty:2 },
      { id:'copper_ore', qty:1 },
    ],
    xp: 15,
  },
];

// ── TIERED RECIPE DB ─────────────────────────────────────────
// Generated from TIERED_SLOT_CONFIGS (defined in equip.js).
// Skips null tier entries (T3 already covered by RECIPE_DB above).
const TIERED_RECIPE_DB = [];

(function buildTieredRecipes() {
  if (typeof TIERED_SLOT_CONFIGS === 'undefined') return;
  TIERED_SLOT_CONFIGS.forEach(cfg => {
    cfg.tiers.forEach((tierDef, idx) => {
      if (!tierDef) return; // T3 = null, skip
      const tierNum  = idx + 1;
      const tierMeta = (typeof GEAR_TIERS !== 'undefined') ? GEAR_TIERS[tierNum - 1] : null;
      const mats     = (typeof _mats === 'function') ? _mats(tierNum) : [];
      if (!mats) return; // safety (shouldn't happen for non-T3 tiers)
      TIERED_RECIPE_DB.push({
        id:            `recipe_${tierDef.id}`,
        output:        tierDef.id,
        qty:           1,
        tier:          tierNum,
        craftLevelReq: tierMeta ? tierMeta.levelReq    : 0,
        successChance: tierMeta ? tierMeta.baseSuccess  : 1.0,
        flavorCraft:   tierDef.desc,
        ingredients:   mats,
        xp:            tierDef.xp,
      });
    });
  });
})();

// ── FABRICATION RECIPE DB ────────────────────────────────────
// Ore/material refinement recipes. type:'fab' sorts to top of each tier group.
const FABRICATION_DB = [
  { id:'fab_copper_ingot',  output:'copper_ingot',  qty:1, tier:2, craftLevelReq:5,  successChance:1.00, type:'fab', flavorCraft:'Smelt copper ore in a coal furnace.',               ingredients:[{id:'copper_ore',qty:2},{id:'coal',qty:1}],                xp:8  },
  { id:'fab_tin_ingot',     output:'tin_ingot',     qty:1, tier:4, craftLevelReq:22, successChance:0.95, type:'fab', flavorCraft:'Refine tin ore with sustained coal heat.',           ingredients:[{id:'tin_ore',qty:2},{id:'coal',qty:2}],                   xp:14 },
  { id:'fab_iron_ingot',    output:'iron_ingot',    qty:1, tier:5, craftLevelReq:35, successChance:0.90, type:'fab', flavorCraft:'Smelt iron ore at high temperature.',                ingredients:[{id:'iron_ore',qty:2},{id:'coal',qty:3}],                  xp:20 },
  { id:'fab_runic_ingot',   output:'runic_ingot',   qty:1, tier:6, craftLevelReq:50, successChance:0.80, type:'fab', flavorCraft:'Refine runic ore carefully — energy is unstable.',  ingredients:[{id:'runic_ore',qty:3},{id:'coal',qty:3}],                 xp:30 },
  { id:'fab_void_crystal',  output:'void_crystal',  qty:1, tier:7, craftLevelReq:65, successChance:0.65, type:'fab', flavorCraft:'Crystallise void ore with a runic ingot catalyst.',  ingredients:[{id:'void_ore',qty:2},{id:'runic_ingot',qty:1}],           xp:45 },
  { id:'fab_mythic_core',   output:'mythic_core',   qty:1, tier:8, craftLevelReq:80, successChance:0.50, type:'fab', flavorCraft:'Condense mythic ore into a stable core.',             ingredients:[{id:'mythic_ore',qty:2},{id:'void_crystal',qty:1}],        xp:65 },
  { id:'fab_refined_cord',  output:'refined_cord',  qty:2, tier:4, craftLevelReq:22, successChance:1.00, type:'fab', flavorCraft:'Twist fiber with stone dust into reinforced cord.',   ingredients:[{id:'fiber',qty:3},{id:'stone',qty:1}],                    xp:10 },
  { id:'fab_hardened_cord', output:'hardened_cord', qty:1, tier:5, craftLevelReq:35, successChance:0.95, type:'fab', flavorCraft:'Cure refined cord in coal smoke.',                    ingredients:[{id:'refined_cord',qty:2},{id:'coal',qty:1}],             xp:16 },
  { id:'fab_runic_thread',  output:'runic_thread',  qty:2, tier:6, craftLevelReq:50, successChance:0.90, type:'fab', flavorCraft:'Weave fiber with runic ore dust into glowing thread.',ingredients:[{id:'fiber',qty:3},{id:'runic_ore',qty:1}],               xp:24 },
  { id:'fab_void_weave',    output:'void_weave',    qty:1, tier:7, craftLevelReq:65, successChance:0.75, type:'fab', flavorCraft:'Spin runic thread with void ore into void weave.',    ingredients:[{id:'runic_thread',qty:2},{id:'void_ore',qty:1}],          xp:38 },
  { id:'fab_mythic_silk',   output:'mythic_silk',   qty:1, tier:8, craftLevelReq:80, successChance:0.60, type:'fab', flavorCraft:'Combine mythic ore with void weave into celestial silk.',ingredients:[{id:'mythic_ore',qty:1},{id:'void_weave',qty:1}],       xp:55 },
];

// ── BOSS SUMMON RECIPE ───────────────────────────────────────
const BOSS_RECIPE_DB = [
  {
    id:            'recipe_warden_sigil',
    output:        'warden_sigil',
    qty:           1,
    tier:          1,
    craftLevelReq: 0,
    successChance: 1.0,
    flavorCraft:   'Bind the tags of the fallen into a crackling summon sigil.',
    ingredients:   [{ id:'street_tag', qty:15 }],
    xp:            25,
  },
];

// Combined and sorted by tier (T1 first, T8 last). Within same tier, FAB first.
const ALL_RECIPES = [...FABRICATION_DB, ...TIERED_RECIPE_DB, ...RECIPE_DB, ...BOSS_RECIPE_DB]
  .sort((a, b) => {
    const ta = a.tier || 3, tb = b.tier || 3;
    if (ta !== tb) return ta - tb;
    return (a.type === 'fab' ? 0 : 1) - (b.type === 'fab' ? 0 : 1);
  });

// ── CRAFTING STATE ────────────────────────────────────────────
let craftOpen        = false;
let craftSelectedIdx = null;   // index into ALL_RECIPES
let pickaxeCrafted   = false;  // gates all non-pickaxe recipes until first craft

function openCraft()   {
  if (!craftingUnlocked) return;  // silently blocked — button is visually locked
  craftOpen = true;
  const win = document.getElementById('craftWindow');
  win.style.left = '';
  win.style.top  = '';
  win.style.transform = '';
  const searchEl = document.getElementById('craftSearch');
  if (searchEl) searchEl.value = '';
  document.getElementById('craftOverlay').classList.add('open');
  renderCraftList();
}
function closeCraft()  {
  craftOpen = false;
  document.getElementById('craftOverlay').classList.remove('open');
}
function toggleCraft() { craftOpen ? closeCraft() : openCraft(); }

// ── INVENTORY HELPERS ─────────────────────────────────────────
function invCountOf(itemId) {
  if (typeof adminMode !== 'undefined' && adminMode) return 9999;
  return playerInv.reduce((sum, slot) => {
    return slot?.id === itemId ? sum + slot.qty : sum;
  }, 0);
}

function canCraft(recipe) {
  if (typeof adminMode !== 'undefined' && adminMode) return true;
  return recipe.ingredients.every(ing => invCountOf(ing.id) >= ing.qty);
}

function maxCraftable(recipe) {
  if (!recipe.ingredients.length) return 0;
  return Math.floor(
    Math.min(...recipe.ingredients.map(ing => invCountOf(ing.id) / ing.qty))
  );
}

// ── RENDER RECIPE LIST ────────────────────────────────────────
function renderCraftList() {
  const list    = document.getElementById('craftList');
  const searchEl = document.getElementById('craftSearch');
  const query   = searchEl ? searchEl.value.trim().toLowerCase() : '';
  list.innerHTML = '';

  const _admin     = typeof adminMode !== 'undefined' && adminMode;
  const craftLevel = _admin ? 99 : ((typeof SKILLS !== 'undefined' && SKILLS.crafting) ? SKILLS.crafting.level : 1);
  let lastTier = null;

  // Filter by search query (name or ingredient name)
  const filtered = ALL_RECIPES.map((r, i) => ({ recipe: r, idx: i })).filter(({ recipe }) => {
    if (!query) return true;
    const outItem = ITEM_BY_ID[recipe.output];
    if ((outItem?.name || recipe.output).toLowerCase().includes(query)) return true;
    return recipe.ingredients.some(ing => {
      const ingItem = ITEM_BY_ID[ing.id];
      return (ingItem?.name || ing.id).toLowerCase().includes(query);
    });
  });

  filtered.forEach(({ recipe, idx }) => {
    const outItem     = ITEM_BY_ID[recipe.output];
    const craftable   = canCraft(recipe);
    const levelMet    = craftLevel >= (recipe.craftLevelReq || 0);
    const isPickaxe   = recipe.output.includes('pickaxe');
    const pickaxeLock = !_admin && !pickaxeCrafted && !isPickaxe;
    const selected    = craftSelectedIdx === idx;
    const tierNum     = recipe.tier || 3;
    const collapsed   = !query && craftCollapsedTiers.has(tierNum);

    // Tier group header — only when tier changes
    if (tierNum !== lastTier) {
      lastTier = tierNum;
      const tierMeta = (typeof GEAR_TIERS !== 'undefined') ? GEAR_TIERS[tierNum - 1] : null;
      const rCol = RARITY_COLOR[tierMeta?.rarity || 'common'];

      const header = document.createElement('div');
      header.className = 'craft-tier-header';
      header.style.borderColor = rCol;
      header.style.color = rCol;

      const arrow = document.createElement('span');
      arrow.className = 'craft-tier-arrow';
      arrow.textContent = collapsed ? '▸' : '▾';
      header.appendChild(arrow);

      const label = document.createElement('span');
      label.textContent = `T${tierNum} · ${tierMeta?.name || 'Tier ' + tierNum} · Lv.${tierMeta?.levelReq ?? '?'} req`;
      header.appendChild(label);

      header.addEventListener('click', () => {
        craftCollapsedTiers.has(tierNum) ? craftCollapsedTiers.delete(tierNum) : craftCollapsedTiers.add(tierNum);
        renderCraftList();
      });
      list.appendChild(header);
    }

    // Skip cards when tier is collapsed (search overrides collapse)
    if (collapsed) return;

    const card = document.createElement('div');
    card.className = 'craft-card'
      + (craftable && levelMet && !pickaxeLock ? ' craftable' : '')
      + (selected                              ? ' selected'  : '')
      + (!levelMet || pickaxeLock              ? ' locked'    : '');

    const icon = document.createElement('div');
    icon.className = 'craft-card-icon';
    if (outItem?.drawFn) {
      const cvs = document.createElement('canvas');
      cvs.width = 96; cvs.height = 96;
      cvs.style.imageRendering = 'pixelated';
      cvs.style.width = '48px'; cvs.style.height = '48px';
      outItem.drawFn(cvs.getContext('2d'), 96);
      icon.appendChild(cvs);
    } else {
      icon.textContent = outItem?.icon || '?';
    }
    card.appendChild(icon);

    const info = document.createElement('div');
    info.className = 'craft-card-info';

    const nameEl = document.createElement('div');
    nameEl.className   = 'craft-card-name';
    nameEl.textContent = outItem?.name || recipe.output;
    info.appendChild(nameEl);

    const rarEl = document.createElement('div');
    rarEl.className   = 'craft-card-rarity';
    rarEl.textContent = (outItem?.rarity || 'common').toUpperCase();
    rarEl.style.color = RARITY_COLOR[outItem?.rarity || 'common'];
    info.appendChild(rarEl);

    card.appendChild(info);

    const badge = document.createElement('div');
    badge.className   = 'craft-tier-badge';
    badge.textContent = recipe.type === 'fab' ? `T${tierNum} FAB` : `T${tierNum}`;
    badge.style.color = recipe.type === 'fab' ? '#ffaa44' : RARITY_COLOR[outItem?.rarity || 'common'];
    card.appendChild(badge);

    const status = document.createElement('div');
    status.className   = 'craft-card-status' + (craftable && levelMet && !pickaxeLock ? ' ok' : '');
    status.textContent = (!levelMet || pickaxeLock) ? '🔒' : (craftable ? '✓' : '✗');
    card.appendChild(status);

    card.addEventListener('click', () => {
      craftSelectedIdx = idx;
      renderCraftList();
    });

    list.appendChild(card);
  });

  if (filtered.length === 0 && query) {
    const empty = document.createElement('div');
    empty.className   = 'craft-search-empty';
    empty.textContent = `No recipes match "${query}"`;
    list.appendChild(empty);
  }

  renderCraftDetail();
}

// ── RENDER RECIPE DETAIL ──────────────────────────────────────
function renderCraftDetail() {
  const noneEl    = document.getElementById('craftDetailNone');
  const contentEl = document.getElementById('craftDetailContent');

  if (craftSelectedIdx === null || craftSelectedIdx >= ALL_RECIPES.length) {
    noneEl.style.display    = '';
    contentEl.style.display = 'none';
    return;
  }

  const recipe       = ALL_RECIPES[craftSelectedIdx];
  const outItem      = ITEM_BY_ID[recipe.output];
  const craftable    = canCraft(recipe);
  const maxMake      = maxCraftable(recipe);
  const _adminD      = typeof adminMode !== 'undefined' && adminMode;
  const craftLevel   = _adminD ? 99 : ((typeof SKILLS !== 'undefined' && SKILLS.crafting) ? SKILLS.crafting.level : 1);
  const levelReq     = recipe.craftLevelReq || 0;
  const levelMet     = craftLevel >= levelReq;
  const baseChance   = recipe.successChance ?? 1.0;
  const bonus        = Math.max(0, craftLevel - levelReq) * 0.02;
  const finalChance  = (_adminD || baseChance >= 1.0) ? 1.0 : Math.min(0.95, baseChance + bonus);
  const pct          = Math.round(finalChance * 100);

  noneEl.style.display    = 'none';
  contentEl.style.display = 'flex';

  // Icon
  const _cdi = document.getElementById('craftDetailIcon');
  _cdi.innerHTML = '';
  if (outItem?.drawFn) {
    const cvs = document.createElement('canvas');
    cvs.width = 280; cvs.height = 280;
    cvs.style.imageRendering = 'pixelated';
    cvs.style.width = '140px'; cvs.style.height = '140px';
    outItem.drawFn(cvs.getContext('2d'), 280);
    _cdi.appendChild(cvs);
  } else {
    _cdi.textContent = outItem?.icon || '?';
  }

  // Name
  document.getElementById('craftDetailName').textContent = outItem?.name || recipe.output;

  // Rarity
  const rarEl = document.getElementById('craftDetailRarity');
  rarEl.textContent = ((outItem?.rarity || 'common')).toUpperCase() + ' · EQUIPMENT';
  rarEl.style.color = RARITY_COLOR[outItem?.rarity || 'common'];

  // Level requirement
  const lvlReqEl = document.getElementById('craftLevelReq');
  if (lvlReqEl) {
    lvlReqEl.textContent = `Crafting Lv.${levelReq} required (you: ${craftLevel})`;
    lvlReqEl.className   = levelMet ? 'craft-level-req met' : 'craft-level-req unmet';
  }

  // Success chance
  const successEl = document.getElementById('craftSuccessChance');
  if (successEl) {
    successEl.textContent = `Success: ${pct}%`;
    successEl.className   = pct >= 75 ? 'craft-success-chance good'
                          : pct >= 40 ? 'craft-success-chance warn'
                                      : 'craft-success-chance danger';
  }

  // Description
  document.getElementById('craftDetailDesc').textContent =
    recipe.flavorCraft || outItem?.desc || '';

  // Ingredients
  const ingEl = document.getElementById('craftIngredients');
  ingEl.innerHTML = '';

  const ingHeader = document.createElement('div');
  ingHeader.className   = 'craft-ing-header';
  ingHeader.textContent = 'INGREDIENTS';
  ingEl.appendChild(ingHeader);

  recipe.ingredients.forEach(ing => {
    const ingItem  = ITEM_BY_ID[ing.id];
    const have     = invCountOf(ing.id);
    const enough   = have >= ing.qty;

    const row = document.createElement('div');
    row.className = 'craft-ing-row' + (enough ? ' have' : ' missing');

    const iconSpan = document.createElement('span');
    iconSpan.className   = 'craft-ing-icon';
    iconSpan.textContent = ingItem?.icon || '?';
    row.appendChild(iconSpan);

    const nameSpan = document.createElement('span');
    nameSpan.className   = 'craft-ing-name';
    nameSpan.textContent = ingItem?.name || ing.id;
    row.appendChild(nameSpan);

    const qtySpan = document.createElement('span');
    qtySpan.className   = 'craft-ing-qty';
    qtySpan.textContent = `${have} / ${ing.qty}`;
    row.appendChild(qtySpan);

    ingEl.appendChild(row);
  });

  // Can-make line
  const canMakeEl = document.getElementById('craftCanMake');
  if (craftable && levelMet) {
    canMakeEl.textContent = `Can craft: ${maxMake}`;
    canMakeEl.className   = 'craft-can-make ok';
  } else if (!levelMet) {
    canMakeEl.textContent = `Crafting level too low`;
    canMakeEl.className   = 'craft-can-make missing';
  } else {
    canMakeEl.textContent = 'Missing materials';
    canMakeEl.className   = 'craft-can-make missing';
  }

  // Craft button — disabled if level not met OR missing mats
  const btn = document.getElementById('craftDoBtn');
  btn.disabled    = !craftable || !levelMet;
  btn.textContent = 'CRAFT';
}

// ── CRAFT RESULT POPUP ───────────────────────────────────────
function showCraftResult(recipe, outItem, xpGained, craftedInst) {
  const _cri = document.getElementById('craftResultIcon');
  _cri.innerHTML = '';
  if (outItem?.drawFn) {
    const cvs = document.createElement('canvas');
    cvs.width = 400; cvs.height = 400;
    cvs.style.imageRendering = 'pixelated';
    cvs.style.width = '200px'; cvs.style.height = '200px';
    outItem.drawFn(cvs.getContext('2d'), 400);
    _cri.appendChild(cvs);
  } else {
    _cri.textContent = outItem?.icon || '?';
  }
  document.getElementById('craftResultName').textContent  = outItem?.name || recipe.output;

  const rarEl  = document.getElementById('craftResultRarity');
  const rarity = outItem?.rarity || 'common';
  rarEl.textContent = rarity.toUpperCase();
  rarEl.style.color = RARITY_COLOR[rarity] || '#888';

  const xpColor = (typeof SKILLS !== 'undefined' && SKILLS.crafting) ? SKILLS.crafting.color : '#cc9933';
  const xpEl = document.getElementById('craftResultXP');
  xpEl.textContent = `+${Math.ceil(xpGained)} CRAFTING XP`;
  xpEl.style.color = xpColor;

  const statsEl = document.getElementById('craftResultStats');
  statsEl.innerHTML = '';
  const affixes = craftedInst?.affixes || [];
  affixes.forEach(({ key, value }) => {
    const def   = (typeof AFFIX_DEFS !== 'undefined') ? AFFIX_DEFS[key] : null;
    const label = def?.label || key;
    const color = def?.color || '#aaaaaa';
    const row   = document.createElement('div');
    row.className = 'craft-result-stat';
    row.innerHTML = `<span>${label}</span><span style="color:${color}">+${value}</span>`;
    statsEl.appendChild(row);
  });

  document.getElementById('craftResultOverlay').classList.add('open');
}

// ── DO CRAFT ─────────────────────────────────────────────────
function doCraft() {
  if (craftSelectedIdx === null) return;
  const recipe = ALL_RECIPES[craftSelectedIdx];
  const _adminC = typeof adminMode !== 'undefined' && adminMode;

  if (!canCraft(recipe)) return;

  // Pickaxe gate — bypassed in admin mode
  if (!_adminC && !pickaxeCrafted && !recipe.output.includes('pickaxe')) return;

  // Level gate check — bypassed in admin mode
  const craftLevel = _adminC ? 99 : ((typeof SKILLS !== 'undefined' && SKILLS.crafting) ? SKILLS.crafting.level : 1);
  const levelReq   = recipe.craftLevelReq || 0;
  if (craftLevel < levelReq) return;

  // Success roll — guaranteed in admin mode
  const baseChance  = recipe.successChance ?? 1.0;
  const bonus       = Math.max(0, craftLevel - levelReq) * 0.02;
  const finalChance = (_adminC || baseChance >= 1.0) ? 1.0 : Math.min(0.95, baseChance + bonus);
  const success     = Math.random() < finalChance;

  const outItem = ITEM_BY_ID[recipe.output];

  if (success) {
    // Snapshot existing slots BEFORE adding (to detect the new slot after)
    const priorSlots = new Set();
    playerInv.forEach((s, i) => { if (s?.id === recipe.output) priorSlots.add(i); });
    // Consume full ingredients
    recipe.ingredients.forEach(ing => invRemoveItem(ing.id, ing.qty));
    // Produce output
    invAddItem(recipe.output, recipe.qty);
    // Award full crafting XP
    const xpGained = recipe.xp ?? 0;
    if (typeof gainXP === 'function') gainXP('crafting', xpGained, true);
    // Log
    if (typeof addLog === 'function') addLog(`⚒ Crafted: ${outItem?.name || recipe.output}`);
    // Unlock all recipes after first pickaxe craft
    if (!pickaxeCrafted && recipe.output.includes('pickaxe')) {
      pickaxeCrafted = true;
      if (typeof addLog === 'function') addLog('🔓 Crafting bench fully unlocked!');
    }
    // Roll random stats for equipment and attach to the newly added inventory slot
    let craftedInst = null;
    if (outItem?.type === 'equipment' && typeof rollEquipItem === 'function') {
      craftedInst = rollEquipItem(recipe.output);
      if (craftedInst) {
        const newIdx = playerInv.findIndex((s, i) => s?.id === recipe.output && !priorSlots.has(i));
        if (newIdx >= 0) playerInv[newIdx]._inst = craftedInst;
      }
    }
    // Show result popup
    showCraftResult(recipe, outItem, xpGained, craftedInst);
  } else {
    // Fail — consume half ingredients (rounded up), award 25% XP
    recipe.ingredients.forEach(ing => {
      const lose = Math.ceil(ing.qty / 2);
      invRemoveItem(ing.id, lose);
    });
    if (typeof gainXP === 'function') gainXP('crafting', recipe.xp * 0.25, true);
    if (typeof addLog === 'function') addLog(`⚒ Craft failed — lost half materials`);
  }

  // Refresh both panels
  renderCraftList();
}

// ── INIT ─────────────────────────────────────────────────────
function initCraft() {
  // Apply initial lock state to HUD button
  const hudBtn = document.getElementById('craftHudBtn');
  if (!craftingUnlocked) hudBtn.classList.add('craft-hud-locked');

  hudBtn.addEventListener('click', toggleCraft);
  document.getElementById('craftClose').addEventListener('click', closeCraft);
  document.getElementById('craftDoBtn').addEventListener('click', doCraft);
  document.getElementById('craftResultDismiss').addEventListener('click', () => {
    document.getElementById('craftResultOverlay').classList.remove('open');
    renderCraftList();
  });

  // Search input — re-render list on every keystroke
  document.getElementById('craftSearch').addEventListener('input', () => {
    craftSelectedIdx = null;
    renderCraftList();
  });
  // Prevent game keypresses while typing in search
  document.getElementById('craftSearch').addEventListener('keydown', e => e.stopPropagation());

  // Affix guide open/close
  const affixGuide = document.getElementById('craftAffixGuide');
  document.getElementById('craftInfoBtn').addEventListener('click', e => {
    e.stopPropagation();
    affixGuide.classList.add('open');
  });
  document.getElementById('craftAffixGuideClose').addEventListener('click', () => {
    affixGuide.classList.remove('open');
  });
  affixGuide.addEventListener('click', e => {
    if (e.target === affixGuide) affixGuide.classList.remove('open');
  });

  // Tutorial popup buttons
  document.getElementById('craftTutorialDismiss').addEventListener('click', hideCraftTutorial);

  // Keyboard: ESC closes, C toggles
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && affixGuide.classList.contains('open')) { affixGuide.classList.remove('open'); return; }
    if (e.key === 'Escape' && craftOpen) { closeCraft(); return; }
    if (e.key === 'Escape' && document.getElementById('craftTutorialOverlay').classList.contains('open')) {
      hideCraftTutorial(); return;
    }
    if (e.key === 'c' || e.key === 'C') toggleCraft();
  });

  // Click backdrop to close crafting panel
  document.getElementById('craftOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('craftOverlay')) closeCraft();
  });

  // Draggable title bar
  const win = document.getElementById('craftWindow');
  const bar = document.getElementById('craftTitleBar');
  let drag = false, ox = 0, oy = 0;
  bar.addEventListener('mousedown', e => {
    drag = true;
    const r = win.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    win.style.transform = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!drag) return;
    win.style.left = (e.clientX - ox) + 'px';
    win.style.top  = (e.clientY - oy) + 'px';
  });
  document.addEventListener('mouseup', () => { drag = false; });
}
