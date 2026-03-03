// ════════════════════════════════════════════════════════════
// EQUIPMENT SYSTEM
// Slots: weapon · offhand · head · chest · legs · boots
//        gloves · earring×2 · ring×2
// Iron Grid starter set — 2/3/5-piece bonuses
// Variable affixes rolled per instance
// ════════════════════════════════════════════════════════════

// ── SLOT DEFINITIONS ─────────────────────────────────────────
// gc/gr = grid-column / grid-row in the 3×6 body layout
// Rows 1-5: armour/jewellery. Row 6: gathering tools.
const EQUIP_SLOTS = {
  head:      { label:'Head',      icon:'⛑',  gc:2, gr:1 },
  earring_l: { label:'L. Ear',    icon:'💎',  gc:1, gr:2 },
  chest:     { label:'Chest',     icon:'🦺',  gc:2, gr:2 },
  earring_r: { label:'R. Ear',    icon:'💎',  gc:3, gr:2 },
  weapon:    { label:'Weapon',    icon:'⚔️',  gc:1, gr:3 },
  legs:      { label:'Legs',      icon:'👖',  gc:2, gr:3 },
  offhand:   { label:'Off Hand',  icon:'🛡',  gc:3, gr:3 },
  ring_l:    { label:'L. Ring',   icon:'💍',  gc:1, gr:4 },
  boots:     { label:'Boots',     icon:'👟',  gc:2, gr:4 },
  ring_r:    { label:'R. Ring',   icon:'💍',  gc:3, gr:4 },
  gloves:    { label:'Gloves',    icon:'🥊',  gc:2, gr:5 },
  // ── Gathering tools (row 6) ────────────────────────────
  pickaxe:   { label:'Pickaxe',   icon:'⛏',  gc:1, gr:6 },
  axe:       { label:'Axe',       icon:'🪓',  gc:2, gr:6 },
  scythe:    { label:'Scythe',    icon:'🔪',  gc:3, gr:6 },
};

// ── EQUIPMENT STATE ───────────────────────────────────────────
const playerEquip = {
  head:null, earring_l:null, earring_r:null,
  chest:null, legs:null,
  weapon:null, offhand:null,
  ring_l:null, ring_r:null,
  boots:null, gloves:null,
  // Gathering tools
  pickaxe:null, axe:null, scythe:null,
};

// ── AFFIX POOL ────────────────────────────────────────────────
const AFFIX_DEFS = {
  // ── Offensive ──────────────────────────────────────────────
  rawDmg:           { label:'Raw Dmg',       color:'#ff8866', min:2,  max:8  },
  strikeTempo:      { label:'Strike Tempo',  color:'#44ffcc', min:3,  max:10 },
  lethalChance:     { label:'Lethal Chance', color:'#ffaa44', min:2,  max:6  },
  lethalMult:       { label:'Lethal Mult',   color:'#ff5522', min:8,  max:20 },
  sunderChance:     { label:'Sunder Chance', color:'#ff6600', min:5,  max:15 },
  crushPotency:     { label:'Crush Potency', color:'#ff4400', min:5,  max:15 },
  witherPotency:    { label:'Wither Pot.',   color:'#aa44cc', min:5,  max:15 },
  armorShred:       { label:'Armor Shred',   color:'#cc8844', min:5,  max:20 },
  fatefulStrike:    { label:'Fateful%',      color:'#ffff44', min:2,  max:8  },
  // ── Defensive ──────────────────────────────────────────────
  hardiness:        { label:'Hardiness',     color:'#88aacc', min:2,  max:8  },
  vitality:         { label:'Vitality',      color:'#66dd88', min:4,  max:16 },
  vitRegen:         { label:'Vit Regen',     color:'#44ff88', min:1,  max:4  },
  veil:             { label:'Veil',          color:'#88ccff', min:4,  max:12 },
  dodge:            { label:'Dodge',         color:'#aaffdd', min:2,  max:6  },
  rebuke:           { label:'Rebuke',        color:'#ff88cc', min:5,  max:15 },
  rampart:          { label:'Rampart',       color:'#6688ff', min:5,  max:15 },
  allResist:        { label:'All Resist',    color:'#88ffaa', min:3,  max:8  },
  // ── Utility ────────────────────────────────────────────────
  strideSpeed:      { label:'Stride Speed',  color:'#ffdd44', min:1,  max:5  },
  essenceMax:       { label:'Essence',       color:'#cc88ff', min:4,  max:12 },
  flux:             { label:'Flux',          color:'#aa88ff', min:1,  max:4  },
  // ── Traits ─────────────────────────────────────────────────
  brawn:            { label:'Brawn',         color:'#ffaa66', min:1,  max:3  },
  agility:          { label:'Agility',       color:'#aaff88', min:1,  max:3  },
  mind:             { label:'Mind',          color:'#88aaff', min:1,  max:3  },
  resolve:          { label:'Resolve',       color:'#ffcc88', min:1,  max:3  },
  // ── On-hit ─────────────────────────────────────────────────
  vitalityOnStrike: { label:'Vit on Hit',    color:'#ff6688', min:1,  max:5  },
  // ── Gathering (tools only) ─────────────────────────────────
  miningSpeed:      { label:'Mine Speed',    color:'#ffbb44', min:5,  max:16 },
  miningYield:      { label:'Yield',         color:'#44ddaa', min:4,  max:13 },
  miningReach:      { label:'Reach',         color:'#88ccff', min:6,  max:16 },
};

// Number of random stats rolled per tier on craft (T1–T8)
const STATS_PER_TIER = [1, 1, 2, 2, 2, 3, 3, 4];

// ── SET DEFINITIONS ───────────────────────────────────────────
const EQUIP_SETS = {
  scrap_assembly: {
    name: 'SCRAP ASSEMBLY',
    color: '#999988',
    bonuses: [
      { pieces:2, desc:'+3 Hardiness',                   stats:{ hardiness:3 }                       },
      { pieces:3, desc:'+4 Raw Dmg',                     stats:{ rawDmg:4 }                          },
      { pieces:5, desc:'+12 Vitality · 5% All Resist',   stats:{ vitality:12, allResist:5 }          },
    ],
  },
  copper_rig: {
    name: 'COPPER RIG',
    color: '#d4904c',
    bonuses: [
      { pieces:2, desc:'+4 Hardiness',                   stats:{ hardiness:4 }                       },
      { pieces:3, desc:'+6 Raw Dmg',                     stats:{ rawDmg:6 }                          },
      { pieces:5, desc:'+16 Vitality · 8% All Resist',   stats:{ vitality:16, allResist:8 }          },
    ],
  },
  iron_grid: {
    name: 'IRON GRID',
    color: '#8fa8cc',
    bonuses: [
      { pieces:2, desc:'+5 Hardiness',                   stats:{ hardiness:5 }                       },
      { pieces:3, desc:'+8 Raw Dmg',                     stats:{ rawDmg:8 }                          },
      { pieces:5, desc:'+20 Vitality · 10% All Resist',  stats:{ vitality:20, allResist:10 }         },
    ],
  },
  tempered_core: {
    name: 'TEMPERED CORE',
    color: '#ccbb66',
    bonuses: [
      { pieces:2, desc:'+6 Hardiness',                   stats:{ hardiness:6 }                       },
      { pieces:3, desc:'+10 Raw Dmg',                    stats:{ rawDmg:10 }                         },
      { pieces:4, desc:'+8 Stride Speed',                stats:{ strideSpeed:8 }                     },
      { pieces:5, desc:'+25 Vitality · 12% All Resist',  stats:{ vitality:25, allResist:12 }         },
    ],
  },
  hardened_shell: {
    name: 'HARDENED SHELL',
    color: '#4499ff',
    bonuses: [
      { pieces:2, desc:'+8 Hardiness',                   stats:{ hardiness:8 }                       },
      { pieces:3, desc:'+14 Raw Dmg',                    stats:{ rawDmg:14 }                         },
      { pieces:4, desc:'+10 Stride Speed',               stats:{ strideSpeed:10 }                    },
      { pieces:5, desc:'+35 Vitality · 15% All Resist',  stats:{ vitality:35, allResist:15 }         },
    ],
  },
  runic_weave: {
    name: 'RUNIC WEAVE',
    color: '#44bbcc',
    bonuses: [
      { pieces:2, desc:'+11 Hardiness',                  stats:{ hardiness:11 }                      },
      { pieces:3, desc:'+18 Raw Dmg',                    stats:{ rawDmg:18 }                         },
      { pieces:4, desc:'+14 Stride Speed',               stats:{ strideSpeed:14 }                    },
      { pieces:5, desc:'+45 Vitality · 18% All Resist',  stats:{ vitality:45, allResist:18 }         },
    ],
  },
  void_thread: {
    name: 'VOID THREAD',
    color: '#aa44ff',
    bonuses: [
      { pieces:2, desc:'+15 Hardiness',                  stats:{ hardiness:15 }                      },
      { pieces:3, desc:'+25 Raw Dmg',                    stats:{ rawDmg:25 }                         },
      { pieces:4, desc:'+18 Stride Speed',               stats:{ strideSpeed:18 }                    },
      { pieces:5, desc:'+60 Vitality · 22% All Resist',  stats:{ vitality:60, allResist:22 }         },
    ],
  },
  mythic_mantle: {
    name: 'MYTHIC MANTLE',
    color: '#ffaa22',
    bonuses: [
      { pieces:2, desc:'+20 Hardiness',                  stats:{ hardiness:20 }                      },
      { pieces:3, desc:'+35 Raw Dmg',                    stats:{ rawDmg:35 }                         },
      { pieces:4, desc:'+24 Stride Speed',               stats:{ strideSpeed:24 }                    },
      { pieces:5, desc:'+80 Vitality · 28% All Resist',  stats:{ vitality:80, allResist:28 }         },
      { pieces:7, desc:'+10 Fateful Strike',             stats:{ fatefulStrike:10 }                  },
    ],
  },
};

// ── IRON GRID BASE ITEM DEFINITIONS ──────────────────────────
const IRON_GRID_BASES = [
  {
    id:'ig_sword',  name:'Iron Grid Shortsword', slot:'weapon',  setId:'iron_grid',
    rarity:'uncommon', icon:'⚔️', weight:1.8, value:45,
    desc:'A short blade ground from scrap rail. Holds an edge surprisingly well.',
    baseStats:{ rawDmg:8 },
    affixPool:['rawDmg','strikeTempo','lethalChance','lethalMult'],
  },
  {
    id:'ig_shield', name:'Iron Grid Buckler',    slot:'offhand', setId:'iron_grid',
    rarity:'uncommon', icon:'🛡', weight:1.5, value:38,
    desc:'Pressed steel plate with a welded grip. Stops more than it looks like it should.',
    baseStats:{ hardiness:5 },
    affixPool:['hardiness','vitality','rebuke','rampart'],
  },
  {
    id:'ig_helm',   name:'Iron Grid Helmet',     slot:'head',    setId:'iron_grid',
    rarity:'uncommon', icon:'⛑', weight:1.4, value:30,
    desc:'Repurposed hard-hat with welded steel plating. Protects from overhead strikes.',
    baseStats:{ hardiness:4, vitality:5 },
    affixPool:['hardiness','vitality','veil','dodge'],
  },
  {
    id:'ig_chest',  name:'Iron Grid Chestplate', slot:'chest',   setId:'iron_grid',
    rarity:'uncommon', icon:'🦺', weight:3.2, value:55,
    desc:'Riveted scrap-metal vest. Heavier than it looks — stops most blows cold.',
    baseStats:{ hardiness:7, vitality:10 },
    affixPool:['hardiness','vitality','allResist','rampart'],
  },
  {
    id:'ig_legs',   name:'Iron Grid Legguards',  slot:'legs',    setId:'iron_grid',
    rarity:'uncommon', icon:'👖', weight:2.0, value:40,
    desc:'Reinforced cargo pants with knee plates. Takes the hits so your legs dont.',
    baseStats:{ hardiness:5, vitality:8 },
    affixPool:['hardiness','vitality','strideSpeed','dodge'],
  },
  {
    id:'ig_boots',  name:'Iron Grid Stompers',   slot:'boots',   setId:'iron_grid',
    rarity:'uncommon', icon:'👟', weight:1.6, value:35,
    desc:'Steel-toed work boots. Good for running. Better for stomping faces.',
    baseStats:{ hardiness:3, strideSpeed:5 },
    affixPool:['strideSpeed','dodge','hardiness','vitality'],
  },
  {
    id:'ig_gloves', name:'Iron Grid Gauntlets',  slot:'gloves',  setId:'iron_grid',
    rarity:'uncommon', icon:'🥊', weight:0.9, value:28,
    desc:'Knuckle-plated leather gloves. Every punch hits a little harder.',
    baseStats:{ rawDmg:4, hardiness:2 },
    affixPool:['rawDmg','lethalChance','lethalMult','sunderChance'],
  },
];

// Register in ITEM_DB (runs after ui.js defines ITEM_DB)
IRON_GRID_BASES.forEach(base => {
  if (!ITEM_BY_ID[base.id]) {
    const entry = {
      id: base.id, name: base.name, type: 'equipment',
      slot: base.slot, setId: base.setId,
      rarity: base.rarity, icon: base.icon, drawFn: null,
      desc: base.desc, weight: base.weight, stackable: 1,
      stats: { ...base.baseStats },
      value: base.value,
    };
    ITEM_DB.push(entry);
    ITEM_BY_ID[base.id] = entry;
  }
});

// ── GATHERING TOOL DEFINITIONS ────────────────────────────────
const TOOL_BASES = [
  {
    id: 'tool_pickaxe', name: 'Ironwood Pickaxe', slot: 'pickaxe',
    rarity: 'common', icon: '⛏', weight: 1.2, value: 20,
    desc: 'A solid iron head on a rough wooden handle. Swings faster and digs deeper than bare hands.',
    baseStats: { miningSpeed: 15 },
    affixPool: ['miningSpeed', 'miningYield', 'miningReach'],
  },
  {
    id: 'tool_axe', name: 'Ironwood Axe', slot: 'axe',
    rarity: 'common', icon: '🪓', weight: 1.4, value: 20,
    desc: 'A heavy iron axe head wedged onto a timber haft. Splits ore seams for better yield.',
    baseStats: { miningYield: 12 },
    affixPool: ['miningYield', 'miningSpeed', 'miningReach'],
  },
  {
    id: 'tool_scythe', name: 'Ironwood Scythe', slot: 'scythe',
    rarity: 'common', icon: '🌿', weight: 0.9, value: 18,
    desc: 'A curved iron blade on a long wooden shaft. Sweeps a wider arc — nothing nearby escapes.',
    baseStats: { miningReach: 16 },
    affixPool: ['miningReach', 'miningYield', 'miningSpeed'],
  },
];

// Register tools in ITEM_DB
TOOL_BASES.forEach(base => {
  if (!ITEM_BY_ID[base.id]) {
    const entry = {
      id: base.id, name: base.name, type: 'equipment',
      slot: base.slot, setId: null,
      rarity: base.rarity, icon: base.icon, drawFn: null,
      desc: base.desc, weight: base.weight, stackable: 1,
      stats: { ...base.baseStats },
      value: base.value,
    };
    ITEM_DB.push(entry);
    ITEM_BY_ID[base.id] = entry;
  }
});

// ── ROLL AN ITEM INSTANCE ─────────────────────────────────────
function rollEquipItem(baseId) {
  const base = IRON_GRID_BASES.find(b => b.id === baseId)
            || TOOL_BASES.find(b => b.id === baseId)
            || (typeof TIERED_GEAR_BASES !== 'undefined' && TIERED_GEAR_BASES.find(b => b.id === baseId));
  if (!base) return null;
  const pool     = [...base.affixPool];
  const tier     = base.tier || 3;
  const count    = STATS_PER_TIER[tier - 1] ?? 2;
  const tierMult = (typeof TIER_AFFIX_MULT !== 'undefined' && TIER_AFFIX_MULT[tier - 1] != null)
    ? TIER_AFFIX_MULT[tier - 1]
    : 1.0;
  const affixes  = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx    = Math.floor(Math.random() * pool.length);
    const key    = pool.splice(idx, 1)[0];
    const def    = AFFIX_DEFS[key];
    const rawVal = def.min + Math.floor(Math.random() * (def.max - def.min + 1));
    const val    = Math.max(1, Math.round(rawVal * tierMult));
    affixes.push({ key, value: val });
  }
  return {
    id: base.id, name: base.name, slot: base.slot,
    setId: base.setId, rarity: base.rarity, icon: base.icon,
    drawFn: base.drawFn || null,
    baseStats: { ...(base.baseStats || {}) },
    affixes,
  };
}

// ── STAT COMPUTATION ──────────────────────────────────────────
function getEquipStats() {
  const total = {
    // Offensive
    rawDmg:0, strikeTempo:0, lethalChance:0, lethalMult:0,
    sunderChance:0, crushPotency:0, witherPotency:0, armorShred:0, fatefulStrike:0,
    // Defensive
    hardiness:0, vitality:0, vitRegen:0, veil:0, dodge:0,
    rebuke:0, rampart:0, allResist:0,
    // Utility
    strideSpeed:0, essenceMax:0, flux:0,
    // Traits
    brawn:0, agility:0, mind:0, resolve:0,
    // On-hit
    vitalityOnStrike:0,
    // Gathering
    miningSpeed:0, miningYield:0, miningReach:0,
  };
  const setCounts = {};
  const specials  = new Set();

  Object.values(playerEquip).forEach(inst => {
    if (!inst) return;
    Object.entries(inst.baseStats || {}).forEach(([k,v]) => { if (k in total) total[k] += v; });
    (inst.affixes || []).forEach(a => { if (a.key in total) total[a.key] += a.value; });
    if (inst.setId) setCounts[inst.setId] = (setCounts[inst.setId] || 0) + 1;
  });

  Object.entries(setCounts).forEach(([setId, count]) => {
    const set = EQUIP_SETS[setId];
    if (!set) return;
    set.bonuses.forEach(b => {
      if (count >= b.pieces) {
        Object.entries(b.stats || {}).forEach(([k,v]) => { if (k in total) total[k] += v; });
        if (b.special) specials.add(b.special);
      }
    });
  });

  return { ...total, setCounts, specials };
}

// ── EQUIP / UNEQUIP ───────────────────────────────────────────
function equipFromInv(invIdx) {
  const invSlot = playerInv[invIdx];
  if (!invSlot) return;
  const itemDef = ITEM_BY_ID[invSlot.id];
  if (!itemDef || itemDef.type !== 'equipment') return;
  let slotKey = itemDef.slot;
  if (slotKey === 'earring') slotKey = !playerEquip.earring_l ? 'earring_l' : 'earring_r';
  else if (slotKey === 'ring') slotKey = !playerEquip.ring_l ? 'ring_l' : 'ring_r';
  if (!slotKey || !(slotKey in playerEquip)) return;

  const inst = invSlot._inst || rollEquipItem(invSlot.id);
  if (!inst) return;

  if (playerEquip[slotKey]) _returnToInv(playerEquip[slotKey]);

  playerEquip[slotKey] = inst;
  playerInv[invIdx] = null;

  _refreshAfterEquipChange();
}

function unequipSlot(slotKey) {
  const inst = playerEquip[slotKey];
  if (!inst) return;
  hideEqTooltip();
  _returnToInv(inst);
  playerEquip[slotKey] = null;
  _refreshAfterEquipChange();
}

function _returnToInv(inst) {
  for (let i = 0; i < INV_SLOTS; i++) {
    if (!playerInv[i]) {
      playerInv[i] = { id: inst.id, qty: 1, _inst: inst };
      return;
    }
  }
  addLog('⚠ inventory full — item lost');
}

function _refreshAfterEquipChange() {
  if (typeof updateCombatStats === 'function') updateCombatStats();
  if (invOpen)   renderInv();
  if (equipOpen) renderEquipPanel();
}

// Called by downtown.js to sync dtChar HP cap from equipment
function updateCombatStats() {
  if (typeof dtChar === 'undefined') return;
  const stats = getEquipStats();
  dtChar.maxHp = 100 + (stats.vitality || 0);
  if (dtChar.hp > dtChar.maxHp) dtChar.hp = dtChar.maxHp;
}

// ── EQUIPMENT PANEL UI ────────────────────────────────────────
let equipOpen = false;

function openEquip()  {
  equipOpen = true;
  document.getElementById('equipOverlay').classList.add('open');
  renderEquipPanel();
  startEqPreview();
}
function closeEquip() {
  equipOpen = false;
  document.getElementById('equipOverlay').classList.remove('open');
  stopEqPreview();
}
function toggleEquip() { equipOpen ? closeEquip() : openEquip(); }

function renderEquipPanel() {
  renderEquipSlots();
  renderEquipStats();
}

// Short display name — strip set prefix
function _shortName(name) {
  return name.replace(/^Iron Grid /i, '');
}

// Abbreviated stat summary: "+12 ATK +5 DEF"
const STAT_ABBREV = {
  rawDmg:'RDmg',    hardiness:'HARD',   vitality:'VIT',     strideSpeed:'SPD',
  fatefulStrike:'FATE', lethalChance:'LETH%', lethalMult:'LMLT', strikeTempo:'STMP',
  sunderChance:'SNDR',  crushPotency:'CRSH',  witherPotency:'WTHR', armorShred:'SHRD',
  rebuke:'RBKE',    rampart:'RMPT',     veil:'VEIL',        dodge:'DODGE',
  allResist:'RSST', vitRegen:'VREG',    essenceMax:'ESS',   flux:'FLUX',
  brawn:'BRWN',     agility:'AGIL',     mind:'MIND',        resolve:'RSLV',
  vitalityOnStrike:'VoH',
  miningSpeed:'MSPD', miningYield:'YIELD', miningReach:'REACH',
};
function _statSummary(inst) {
  const merged = {};
  Object.entries(inst.baseStats || {}).forEach(([k,v]) => { merged[k] = (merged[k]||0)+v; });
  (inst.affixes || []).forEach(a => { merged[a.key] = (merged[a.key]||0)+a.value; });
  return Object.entries(merged)
    .map(([k,v]) => `+${v} ${STAT_ABBREV[k] || k}`)
    .join('  ');
}

function renderEquipSlots() {
  const grid = document.getElementById('eqSlotGrid');
  if (!grid) return;
  grid.innerHTML = '';

  Object.entries(EQUIP_SLOTS).forEach(([key, def]) => {
    const inst = playerEquip[key];
    const div  = document.createElement('div');
    div.className = 'eq-slot' + (inst ? ' filled' : ' empty');
    div.style.gridColumn = def.gc;
    div.style.gridRow    = def.gr;
    div.title = '';

    if (inst) {
      const rCol = RARITY_COLOR[inst.rarity] || '#888899';

      // Left rarity bar
      const bar = document.createElement('div');
      bar.className = 'eq-rarity-bar';
      bar.style.background = rCol;
      div.appendChild(bar);

      // Content wrapper — horizontal: icon left, text right
      const inner = document.createElement('div');
      inner.className = 'eq-slot-inner';

      const iconEl = document.createElement('div');
      iconEl.className = 'eq-slot-icon';
      if (inst.drawFn) {
        const cvs = document.createElement('canvas');
        cvs.width = 36; cvs.height = 36;
        cvs.style.imageRendering = 'pixelated';
        cvs.style.width  = '14px';
        cvs.style.height = '14px';
        inst.drawFn(cvs.getContext('2d'), 36);
        iconEl.appendChild(cvs);
      } else {
        iconEl.textContent = inst.icon;
      }
      inner.appendChild(iconEl);

      const textCol = document.createElement('div');
      textCol.className = 'eq-slot-text';

      const nameEl = document.createElement('div');
      nameEl.className = 'eq-slot-name';
      nameEl.textContent = _shortName(inst.name);
      textCol.appendChild(nameEl);

      const statEl = document.createElement('div');
      statEl.className = 'eq-slot-stats';
      statEl.textContent = _statSummary(inst);
      textCol.appendChild(statEl);

      inner.appendChild(textCol);
      div.appendChild(inner);

      // Unequip hint (top-right)
      const x = document.createElement('div');
      x.className = 'eq-slot-x';
      x.textContent = '✕';
      div.appendChild(x);

      div.addEventListener('dblclick', () => unequipSlot(key));

      // Hover tooltip
      div.addEventListener('mouseenter', e => showEqTooltip(inst, def, div));
      div.addEventListener('mouseleave',  () => hideEqTooltip());
    } else {
      const inner = document.createElement('div');
      inner.className = 'eq-slot-inner';

      const iconEl = document.createElement('div');
      iconEl.className = 'eq-slot-icon-empty';
      iconEl.textContent = def.icon;
      inner.appendChild(iconEl);

      const lbl = document.createElement('div');
      lbl.className = 'eq-slot-label';
      lbl.textContent = def.label;
      inner.appendChild(lbl);

      div.appendChild(inner);
    }

    grid.appendChild(div);
  });
}

function renderEquipStats() {
  const panel = document.getElementById('eqStatsPanel');
  if (!panel) return;
  const stats = getEquipStats();
  panel.innerHTML = '';

  const sec = txt => {
    const el = document.createElement('div');
    el.className = 'eq-sec';
    el.textContent = txt;
    panel.appendChild(el);
  };
  const row = (label, val, col) => {
    const el = document.createElement('div');
    el.className = 'eq-row' + (val === 0 ? ' zero' : '');
    el.innerHTML =
      `<span class="eq-row-key" style="color:${col||'rgba(210,200,185,0.75)'}">${label}</span>` +
      `<span class="eq-row-val">${val > 0 ? '+'+val : val}</span>`;
    panel.appendChild(el);
  };

  const pctRow = (label, val, col) => {
    const el = document.createElement('div');
    el.className = 'eq-row' + (val === 0 ? ' zero' : '');
    el.innerHTML =
      `<span class="eq-row-key" style="color:${col||'rgba(210,200,185,0.75)'}">${label}</span>` +
      `<span class="eq-row-val">${val > 0 ? val+'%' : '—'}</span>`;
    panel.appendChild(el);
  };

  sec('OFFENSE');
  row('⚔ Raw Dmg',      stats.rawDmg,        '#ffaa77');
  row('⚡ Strike Tempo', stats.strikeTempo,   '#44ffcc');
  row('🎯 Lethal%',      stats.lethalChance,  '#ffaa44');
  row('💥 Lethal Mult',  stats.lethalMult,    '#ff5522');
  row('🔥 Sunder%',      stats.sunderChance,  '#ff6600');
  row('🔨 Crush',        stats.crushPotency,  '#ff4400');
  row('☠ Wither',        stats.witherPotency, '#aa44cc');
  row('🔓 Armor Shred',  stats.armorShred,    '#cc8844');
  row('✨ Fateful%',     stats.fatefulStrike, '#ffff44');
  sec('DEFENSE');
  row('🛡 Hardiness',    stats.hardiness,     '#88bbdd');
  row('❤ Vitality',      stats.vitality,      '#77dd99');
  row('💚 Vit Regen',    stats.vitRegen,      '#44ff88');
  row('💠 Veil',         stats.veil,          '#88ccff');
  row('👁 Dodge',        stats.dodge,         '#aaffdd');
  pctRow('🌀 All Resist', stats.allResist,    '#88ffaa');
  row('↩ Rebuke',        stats.rebuke,        '#ff88cc');
  row('🏰 Rampart',      stats.rampart,       '#6688ff');
  sec('UTILITY');
  row('👟 Stride Spd',   stats.strideSpeed,   '#ffdd55');
  row('💧 Essence',      stats.essenceMax,    '#cc88ff');
  row('🔄 Flux',         stats.flux,          '#aa88ff');
  row('💢 Vit on Hit',   stats.vitalityOnStrike, '#ff6688');
  sec('TRAITS');
  row('💪 Brawn',        stats.brawn,         '#ffaa66');
  row('🏃 Agility',      stats.agility,       '#aaff88');
  row('🧠 Mind',         stats.mind,          '#88aaff');
  row('🔷 Resolve',      stats.resolve,       '#ffcc88');
  sec('GATHERING');
  const mspd = stats.miningSpeed;
  const el = document.createElement('div');
  el.className = 'eq-row' + (mspd === 0 ? ' zero' : '');
  el.innerHTML = `<span class="eq-row-key" style="color:#ffbb44">⛏ Mine Spd</span><span class="eq-row-val">${mspd > 0 ? '+'+mspd+'%' : '—'}</span>`;
  panel.appendChild(el);
  row('💎 Yield',   stats.miningYield, '#44ddaa');
  row('📏 Reach',   stats.miningReach, '#88ccff');

  // Set bonus blocks
  const sets = Object.entries(stats.setCounts);
  if (sets.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'eq-hint';
    hint.textContent = 'No set bonuses yet.\nEquip matching pieces.';
    panel.appendChild(hint);
  } else {
    sets.forEach(([setId, count]) => {
      const set = EQUIP_SETS[setId];
      if (!set) return;
      const maxPc = set.bonuses[set.bonuses.length - 1].pieces;

      const block = document.createElement('div');
      block.className = 'eq-set-block';

      const head = document.createElement('div');
      head.className = 'eq-set-head';
      head.innerHTML =
        `<span class="eq-set-name" style="color:${set.color}">${set.name}</span>` +
        `<span class="eq-set-count" style="color:${set.color}">${count}/${maxPc}</span>`;
      block.appendChild(head);

      const barW = document.createElement('div');
      barW.className = 'eq-set-bar';
      const barF = document.createElement('div');
      barF.className = 'eq-set-fill';
      barF.style.cssText = `width:${Math.min(100,(count/maxPc)*100)}%;background:${set.color}`;
      barW.appendChild(barF);
      block.appendChild(barW);

      set.bonuses.forEach(b => {
        const bon = document.createElement('div');
        bon.className = 'eq-set-bonus' + (count >= b.pieces ? ' on' : '');
        bon.textContent = `${count >= b.pieces ? '✓' : '·'} ${b.pieces}pc  ${b.desc}`;
        block.appendChild(bon);
      });

      panel.appendChild(block);
    });
  }
}

// ── CHARACTER PREVIEW ─────────────────────────────────────────
// Live rotatable 2D character diorama shown below the slot grid.
// "Rotation" = flip facing direction every few seconds or via buttons.

let _eqPrevFacing   = 1;   // 1 = right, -1 = left
let _eqPrevFrame    = 0;
let _eqPrevRAF      = null;
let _eqPrevFlipCD   = 0;   // countdown frames until auto-flip
const _EQ_PREV_FLIP_INTERVAL = 280; // ~4.7 s at 60 fps

function startEqPreview() {
  if (_eqPrevRAF) return;
  _eqPrevFlipCD = _EQ_PREV_FLIP_INTERVAL;
  function loop() {
    _eqPrevFrame++;
    _eqPrevFlipCD--;
    if (_eqPrevFlipCD <= 0) {
      _eqPrevFacing   *= -1;
      _eqPrevFlipCD    = _EQ_PREV_FLIP_INTERVAL;
    }
    _drawEqCharPreview();
    _eqPrevRAF = requestAnimationFrame(loop);
  }
  _eqPrevRAF = requestAnimationFrame(loop);

  // Wire up manual rotate buttons
  const btnL = document.getElementById('eqRotL');
  const btnR = document.getElementById('eqRotR');
  if (btnL) btnL.onclick = () => { _eqPrevFacing = -1; _eqPrevFlipCD = _EQ_PREV_FLIP_INTERVAL; };
  if (btnR) btnR.onclick = () => { _eqPrevFacing =  1; _eqPrevFlipCD = _EQ_PREV_FLIP_INTERVAL; };
}

function stopEqPreview() {
  if (_eqPrevRAF) { cancelAnimationFrame(_eqPrevRAF); _eqPrevRAF = null; }
}

// ── Main draw ─────────────────────────────────────────────────
function _drawEqCharPreview() {
  const canvas = document.getElementById('eqCharPreview');
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  const W      = canvas.width;   // 120
  const H      = canvas.height;  // 160
  const SC     = 3;              // game-units → CSS pixels
  const f      = _eqPrevFrame;
  const facing = _eqPrevFacing;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = 'rgba(10,12,20,0.95)';
  ctx.fillRect(0, 0, W, H);

  // Subtle corner grid decoration
  ctx.strokeStyle = 'rgba(200,160,80,0.06)';
  ctx.lineWidth = 0.5;
  for (let gx = 0; gx < W; gx += 12) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
  for (let gy = 0; gy < H; gy += 12) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

  // Ground line
  const groundPx = 147;
  ctx.strokeStyle = 'rgba(200,160,80,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(8, groundPx); ctx.lineTo(W - 8, groundPx); ctx.stroke();
  // Ground shadow
  ctx.fillStyle = 'rgba(200,160,80,0.08)';
  ctx.fillRect(22, groundPx + 1, 76, 3);

  // ── Resolve character appearance ──────────────────────────
  const pcd      = (typeof playerCharData !== 'undefined') ? playerCharData : null;
  let skinColor  = '#c8a070';
  let hairColor  = '#1e1e1e';
  let shirtColor = '#1e44aa';
  if (pcd) {
    if (pcd.skin)              skinColor  = pcd.skin;
    if (pcd.type === 'alien')  skinColor  = '#55bb66';
    if (pcd.type === 'female') shirtColor = '#cc4488';
    if (pcd.type !== 'alien' && pcd.hair) hairColor = pcd.hair;
  }

  // Helper: get the display color for an equipped slot
  function slotCol(key) {
    const inst = playerEquip[key];
    if (!inst) return null;
    if (inst.setId && EQUIP_SETS[inst.setId]) return EQUIP_SETS[inst.setId].color;
    return RARITY_COLOR[inst.rarity] || '#888888';
  }

  const helmColor  = slotCol('head');
  const chestColor = slotCol('chest');
  const legsColor  = slotCol('legs');
  const bootsColor = slotCol('boots');
  const glovesColor = slotCol('gloves');

  // ── Character layout (game units) ─────────────────────────
  // Character centre-x in game units
  const cx  = W / (2 * SC);  // ~20
  const px  = Math.round(cx - 10);  // left edge (char is 20u wide) → 10
  const w   = 20, h = 32;
  // Idle bob (slow sine)
  const bob = Math.sin(f * 0.045) * 1.2;
  const bodyY = 12 + bob;  // body top in game units; head top at bodyY-10 = 2

  ctx.save();
  ctx.scale(SC, SC);

  // ── Shield — drawn behind body on off-hand side ──────────
  const hasShield = !!playerEquip?.offhand;
  if (hasShield) {
    const shCol = slotCol('offhand') || '#2244aa';
    const sx    = facing === 1 ? px - 6 : px + w - 1;
    const sy    = bodyY + 2;
    ctx.fillStyle = shCol;
    ctx.fillRect(sx, sy, 7, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(sx, sy, 7, 1);
    ctx.fillRect(sx, sy, 1, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(sx + 2, sy + 3, 2, 2);
  }

  // ── Chest / shirt ─────────────────────────────────────────
  if (chestColor) {
    ctx.fillStyle = chestColor;
    ctx.fillRect(px + 1, bodyY, w - 2, h - 12);
    // Shoulder pauldrons
    ctx.fillRect(px - 1, bodyY, 4, 5);
    ctx.fillRect(px + w - 3, bodyY, 4, 5);
    // Edge highlight
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(px + 1, bodyY, w - 2, 1);
    ctx.fillRect(px + 1, bodyY, 1, h - 12);
    // Shirt under-tint visible through gaps
    ctx.fillStyle = shirtColor;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(px + 2, bodyY, w - 4, h - 12);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = shirtColor;
    ctx.fillRect(px + 2, bodyY, w - 4, h - 12);
  }

  // ── Head ──────────────────────────────────────────────────
  ctx.fillStyle = skinColor;
  ctx.fillRect(px + 4, bodyY - 10, w - 8, 10);

  // ── Hair ──────────────────────────────────────────────────
  ctx.fillStyle = hairColor;
  ctx.fillRect(px + 4, bodyY - 10, w - 8, 4);
  if (pcd && pcd.type === 'female') {
    ctx.fillStyle = hairColor;
    ctx.fillRect(px + 4, bodyY - 10, 3, 14);
    ctx.fillRect(px + w - 7, bodyY - 10, 3, 14);
  }

  // ── Eye ───────────────────────────────────────────────────
  ctx.fillStyle = '#eeeeee';
  const eyeX = facing === 1 ? px + 10 : px + 4;
  ctx.fillRect(eyeX, bodyY - 7, 3, 3);
  // Pupil
  ctx.fillStyle = '#334466';
  ctx.fillRect(eyeX + (facing === 1 ? 1 : 0), bodyY - 6, 1, 2);

  // Alien face overlay
  if (pcd && pcd.type === 'alien') {
    const hx = px + 4, hy = bodyY - 10;
    ctx.fillStyle = '#55bb66';
    ctx.fillRect(hx, hy, 12, 3);
    ctx.fillRect(hx, hy, 3, 8);
    ctx.fillStyle = '#88ffaa';
    ctx.fillRect(hx + 8, hy, 3, 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(hx + 2, hy + 3, 2, 2);
    ctx.fillRect(hx + 8, hy + 3, 2, 2);
  }

  // ── Helmet overlay ────────────────────────────────────────
  if (helmColor) {
    ctx.fillStyle = helmColor;
    // Top plate
    ctx.fillRect(px + 3, bodyY - 11, w - 6, 3);
    // Cheek guards
    ctx.fillRect(px + 3, bodyY - 8, 2, 6);
    ctx.fillRect(px + w - 5, bodyY - 8, 2, 6);
    // Visor bar
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(px + 5, bodyY - 6, w - 10, 2);
    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(px + 3, bodyY - 11, w - 6, 1);
  }

  // ── Gloves ────────────────────────────────────────────────
  if (glovesColor) {
    // On the weapon arm side (same side as sword hand)
    const gx = facing === 1 ? px + w - 2 : px;
    ctx.fillStyle = glovesColor;
    ctx.fillRect(gx - 1, bodyY + 6, 3, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(gx - 1, bodyY + 6, 3, 1);
  }

  // ── Weapon (drawn in front on weapon arm side) ────────────
  if (playerEquip?.weapon) {
    const inst    = playerEquip.weapon;
    const tier    = parseInt((inst.id?.match(/^t(\d)/) || ['','1'])[1]) || 1;
    const bladeH  = 12 + tier * 1.5;          // longer blade per tier
    const bladeW  = tier >= 3 ? 3 : 2;
    const bladeCol = inst.setId && EQUIP_SETS[inst.setId]
                      ? EQUIP_SETS[inst.setId].color : '#d0d0d8';
    // Sword held at angle on weapon-arm side
    const wArmX   = facing === 1 ? px + w + 1 : px - 5;
    const wArmY   = bodyY + 5;
    // Tilt angle: slight forward lean
    const tilt    = facing === 1 ? -0.22 : 0.22;

    ctx.save();
    ctx.translate(wArmX + (facing === 1 ? 1 : 3), wArmY + 6);
    ctx.rotate(tilt);
    // Hilt
    ctx.fillStyle = '#7a5533';
    ctx.fillRect(-2, 0, 4, 5);
    // Crossguard
    ctx.fillStyle = '#bbaa44';
    ctx.fillRect(-4, -1, 8, 2);
    // Blade
    ctx.fillStyle = bladeCol;
    ctx.fillRect(-Math.floor(bladeW / 2), -bladeH, bladeW, bladeH);
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(-Math.floor(bladeW / 2) + (bladeW > 2 ? 1 : 0), -bladeH, 1, Math.round(bladeH * 0.4));
    ctx.restore();
  }

  // ── Legs ──────────────────────────────────────────────────
  // Subtle idle breathing shift on legs
  const legSway = Math.sin(f * 0.045) * 0.4;
  ctx.fillStyle = legsColor || '#112244';
  ctx.fillRect(px + 3,     bodyY + h - 12, 6, 12 + legSway);
  ctx.fillRect(px + w - 9, bodyY + h - 12, 6, 12 - legSway);

  if (legsColor) {
    // Thigh guard overlay
    ctx.fillStyle = legsColor;
    ctx.fillRect(px + 3,     bodyY + h - 14, 5, 6);
    ctx.fillRect(px + w - 8, bodyY + h - 14, 5, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(px + 3,     bodyY + h - 14, 5, 1);
    ctx.fillRect(px + w - 8, bodyY + h - 14, 5, 1);
  }

  // ── Boots ─────────────────────────────────────────────────
  if (bootsColor) {
    ctx.fillStyle = bootsColor;
    ctx.fillRect(px + 2,     bodyY + h - 4, 7, 4);
    ctx.fillRect(px + w - 9, bodyY + h - 4, 7, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(px + 2,     bodyY + h - 4, 7, 1);
    ctx.fillRect(px + w - 9, bodyY + h - 4, 7, 1);
  }

  ctx.restore(); // end SC scale

  // ── Facing indicator ──────────────────────────────────────
  ctx.fillStyle = 'rgba(200,160,80,0.4)';
  ctx.font      = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(facing === 1 ? '▷ facing right' : '◁ facing left', W / 2, H - 5);
}

// ── EQUIP SLOT TOOLTIP ────────────────────────────────────────
let _eqTipEl = null;
function _ensureTooltip() {
  if (!_eqTipEl) {
    _eqTipEl = document.getElementById('eqTooltip');
    if (!_eqTipEl) {
      _eqTipEl = document.createElement('div');
      _eqTipEl.id = 'eqTooltip';
      document.getElementById('world').appendChild(_eqTipEl);
    }
  }
  return _eqTipEl;
}

function showEqTooltip(inst, def, slotEl) {
  const tip = _ensureTooltip();
  const rCol = RARITY_COLOR[inst.rarity] || '#888899';

  const tierNum = inst.id ? (() => {
    const m = inst.id.match(/_t(\d)$/);
    return m ? parseInt(m[1]) : null;
  })() : null;

  const subParts = [inst.rarity?.toUpperCase()];
  if (tierNum) subParts.push(`TIER ${tierNum}`);
  subParts.push(def.label.toUpperCase());

  // Build stat lines
  const statLines = [];
  const merged = {};
  Object.entries(inst.baseStats || {}).forEach(([k,v]) => { merged[k] = (merged[k]||0)+v; });
  (inst.affixes || []).forEach(a => { merged[a.key] = (merged[a.key]||0)+a.value; });
  const STAT_COLOR = {
    rawDmg:'#ffaa77',      hardiness:'#88bbdd',    vitality:'#77dd99',
    strideSpeed:'#ffdd55', fatefulStrike:'#ffff44', lethalChance:'#ffaa44',
    lethalMult:'#ff5522',  strikeTempo:'#44ffcc',   sunderChance:'#ff6600',
    crushPotency:'#ff4400',witherPotency:'#aa44cc', armorShred:'#cc8844',
    rebuke:'#ff88cc',      rampart:'#6688ff',       veil:'#88ccff',
    dodge:'#aaffdd',       allResist:'#88ffaa',     vitRegen:'#44ff88',
    essenceMax:'#cc88ff',  flux:'#aa88ff',          brawn:'#ffaa66',
    agility:'#aaff88',     mind:'#88aaff',          resolve:'#ffcc88',
    vitalityOnStrike:'#ff6688',
    miningSpeed:'#ffbb44', miningYield:'#44ddaa',   miningReach:'#88ccff',
  };
  Object.entries(merged).forEach(([k,v]) => {
    const label = STAT_ABBREV[k] || k;
    const col   = STAT_COLOR[k]  || '#aaaacc';
    statLines.push(`<span style="color:${col}">+${v} ${label}</span>`);
  });

  // Build set bonus section
  let setHtml = '';
  const setDef = inst.setId ? EQUIP_SETS[inst.setId] : null;
  if (setDef) {
    const equippedCount = (typeof getEquipStats === 'function')
      ? (getEquipStats().setCounts[inst.setId] || 0) : 0;
    const maxPc = setDef.bonuses[setDef.bonuses.length - 1].pieces;
    const bonusLines = setDef.bonuses.map(b => {
      const active = equippedCount >= b.pieces;
      const col    = active ? setDef.color : 'rgba(255,255,255,0.28)';
      return `<span style="color:${col}">${active ? '✓' : '·'} ${b.pieces}pc — ${b.desc}</span>`;
    }).join('<br>');
    setHtml =
      `<div class="tt-set-head" style="color:${setDef.color}">${setDef.name} <span style="opacity:0.55">${equippedCount}/${maxPc}</span></div>` +
      `<div class="tt-set-bonuses">${bonusLines}</div>`;
  }

  const ttIconHtml = inst.drawFn
    ? `<canvas class="tt-sword-icon" width="48" height="48" style="image-rendering:pixelated;vertical-align:middle;margin-right:5px;width:28px;height:28px"></canvas>`
    : (inst.icon ? `${inst.icon} ` : '');
  tip.innerHTML =
    `<div class="tt-name" style="color:${rCol}">${ttIconHtml}${inst.name}</div>` +
    `<div class="tt-sub">${subParts.join(' · ')}</div>` +
    (statLines.length ? `<div class="tt-stat">${statLines.join('<br>')}</div>` : '') +
    (setHtml ? `<div class="tt-set">${setHtml}</div>` : '') +
    `<div class="tt-hint">double-click to unequip</div>`;

  if (inst.drawFn) {
    const ttCvs = tip.querySelector('.tt-sword-icon');
    if (ttCvs) inst.drawFn(ttCvs.getContext('2d'), 48);
  }

  // Position above the slot
  const worldEl  = document.getElementById('world');
  const worldR   = worldEl.getBoundingClientRect();
  const slotR    = slotEl.getBoundingClientRect();
  const tx = slotR.left - worldR.left + slotR.width / 2;
  const ty = slotR.top  - worldR.top  - 8;
  tip.style.left      = Math.max(4, tx - tip.offsetWidth / 2) + 'px';
  tip.style.top       = (ty - (tip.offsetHeight || 120)) + 'px';
  tip.classList.add('show');

  // Reposition after paint (offsetWidth is 0 before first show)
  requestAnimationFrame(() => {
    tip.style.left = Math.max(4, Math.min(worldR.width - tip.offsetWidth - 4,
                              tx - tip.offsetWidth / 2)) + 'px';
    tip.style.top  = Math.max(4, ty - tip.offsetHeight) + 'px';
  });
}

function hideEqTooltip() {
  const tip = _ensureTooltip();
  tip.classList.remove('show');
}

// ── INIT ──────────────────────────────────────────────────────
function initEquip() {
  document.getElementById('equipBtn').addEventListener('click', toggleEquip);
  document.getElementById('equipClose').addEventListener('click', closeEquip);

  // ESC to close, G to toggle
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && equipOpen) { hideEqTooltip(); closeEquip(); return; }
    if (e.key === 'g' || e.key === 'G') toggleEquip();
  });

  // Click backdrop to close
  document.getElementById('equipOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('equipOverlay')) { hideEqTooltip(); closeEquip(); }
  });
}

// ── GIVE STARTER GEAR (new game only) ─────────────────────────
// Gives scrap tier (T1) armor. Weapon and offhand are excluded — the player
// must craft them and then upgrade to Iron Grid via quests.
const STARTER_GEAR_SLOTS = ['t1_helm', 't1_chest', 't1_legs', 't1_boots', 't1_gloves'];
function giveStarterGear() {
  STARTER_GEAR_SLOTS.forEach(id => invAddItem(id, 1));
}

// ═══════════════════════════════════════════════════════════════
// TIERED EQUIPMENT SYSTEM (T1–T8)
// T3 items = existing Iron Grid / Ironwood sets (registered above).
// T1, T2, T4–T8 are defined here and registered below.
// ═══════════════════════════════════════════════════════════════

const GEAR_TIERS = [
  { tier:1, name:'Scrap',    rarity:'common',    levelReq:0,  baseSuccess:1.00, setId:'scrap_assembly' },
  { tier:2, name:'Copper',   rarity:'common',    levelReq:5,  baseSuccess:0.90, setId:'copper_rig'       },
  { tier:3, name:'Steel',    rarity:'uncommon',  levelReq:12, baseSuccess:0.75, setId:'iron_grid'      },
  { tier:4, name:'Tempered', rarity:'uncommon',  levelReq:22, baseSuccess:0.58, setId:'tempered_core'  },
  { tier:5, name:'Hardened', rarity:'rare',      levelReq:35, baseSuccess:0.40, setId:'hardened_shell' },
  { tier:6, name:'Runic',    rarity:'rare',      levelReq:50, baseSuccess:0.25, setId:'runic_weave'    },
  { tier:7, name:'Void',     rarity:'epic',      levelReq:65, baseSuccess:0.12, setId:'void_thread'    },
  { tier:8, name:'Mythic',   rarity:'legendary', levelReq:80, baseSuccess:0.05, setId:'mythic_mantle'  },
];

// Affix strength multipliers per tier index (T1=index 0, T8=index 7)
const TIER_AFFIX_MULT = [1.0, 1.5, 2.5, 4.0, 7.0, 12.0, 20.0, 32.0];

// Returns a fresh copy of standard crafting materials for the given tier.
// Returns null for tier 3 (existing recipes handle T3).
function _mats(tier) {
  const T = {
    1: [{ id:'scrap_metal', qty:4 }, { id:'fiber',        qty:2 }],
    2: [{ id:'copper_ingot',qty:3 }, { id:'wood',         qty:3 }],
    // T3 = null — handled entirely by existing RECIPE_DB
    4: [{ id:'tin_ingot',   qty:5 }, { id:'refined_cord', qty:2 }, { id:'stone',       qty:3 }],
    5: [{ id:'iron_ingot',  qty:5 }, { id:'hardened_cord',qty:2 }, { id:'coal',        qty:3 }],
    6: [{ id:'runic_ingot', qty:5 }, { id:'runic_thread', qty:2 }, { id:'copper_ingot',qty:3 }],
    7: [{ id:'void_crystal',qty:4 }, { id:'void_weave',   qty:2 }, { id:'runic_ingot', qty:3 }],
    8: [{ id:'mythic_core', qty:4 }, { id:'mythic_silk',  qty:2 }, { id:'void_crystal',qty:3 }],
  };
  return T[tier] ? T[tier].map(m => ({ ...m })) : null;
}

const TIERED_GEAR_BASES = [];

// 10 slot configs × 8 tiers each (null entry = T3, already registered)
const TIERED_SLOT_CONFIGS = [
  // ── WEAPON ───────────────────────────────────────────────────
  {
    slotKey: 'weapon', icon: '⚔️', affixPool: ['rawDmg','strikeTempo','lethalChance','lethalMult','sunderChance','crushPotency','armorShred','fatefulStrike'],
    tiers: [
      { id:'t1_sword', name:'Scrap Shortsword',   rarity:'common',    setId:'scrap_assembly', stats:{rawDmg:4},   desc:'A blade hammered from salvage scraps. More dangerous than it looks.', value:12, xp:10 },
      { id:'t2_sword', name:'Copper Shortsword',  rarity:'common',    setId:'copper_rig',       stats:{rawDmg:8},   desc:'A properly forged copper blade. Holds a decent edge.', value:25, xp:18 },
      null,
      { id:'t4_sword', name:'Tempered Blade',     rarity:'uncommon',  setId:'tempered_core',  stats:{rawDmg:16},  desc:'Tempered in coal fire. Sharper and tougher than iron.', value:80, xp:42 },
      { id:'t5_sword', name:'Hardened Blade',     rarity:'rare',      setId:'hardened_shell', stats:{rawDmg:28},  desc:'Case-hardened steel with a razor edge. Cuts through plate.', value:140, xp:70 },
      { id:'t6_sword', name:'Runic Blade',        rarity:'rare',      setId:'runic_weave',    stats:{rawDmg:48},  desc:'Etched with runic patterns that hum faintly in combat.', value:240, xp:110 },
      { id:'t7_sword', name:'Void Edge',          rarity:'epic',      setId:'void_thread',    stats:{rawDmg:80},  desc:'A blade that absorbs light. Cuts cleanly through reality itself.', value:420, xp:175 },
      { id:'t8_sword', name:'Mythic Fang',        rarity:'legendary', setId:'mythic_mantle',  stats:{rawDmg:140}, desc:'Forged at the edge of annihilation. The edge never dulls.', value:720, xp:280 },
    ]
  },
  // ── OFFHAND ──────────────────────────────────────────────────
  {
    slotKey: 'offhand', icon: '🛡', affixPool: ['hardiness','vitality','rebuke','rampart','veil','dodge','allResist'],
    tiers: [
      { id:'t1_shield', name:'Scrap Buckler',     rarity:'common',    setId:'scrap_assembly', stats:{hardiness:3},   desc:'A bent scrap plate with a bolted handle. Better than nothing.', value:10, xp:9 },
      { id:'t2_shield', name:'Copper Buckler',    rarity:'common',    setId:'copper_rig',       stats:{hardiness:6},   desc:'A small copper buckler. Stops the worst of it.', value:22, xp:16 },
      null,
      { id:'t4_shield', name:'Tempered Shield',   rarity:'uncommon',  setId:'tempered_core',  stats:{hardiness:12},  desc:'Tempered steel plate with reinforced straps. Absorbs heavy blows.', value:72, xp:38 },
      { id:'t5_shield', name:'Hardened Wall',     rarity:'rare',      setId:'hardened_shell', stats:{hardiness:21},  desc:'A fortress-grade shield compressed to a manageable size.', value:128, xp:62 },
      { id:'t6_shield', name:'Runic Aegis',       rarity:'rare',      setId:'runic_weave',    stats:{hardiness:36},  desc:'Inscribed runes redistribute impact force across the surface.', value:220, xp:98 },
      { id:'t7_shield', name:'Void Barrier',      rarity:'epic',      setId:'void_thread',    stats:{hardiness:60},  desc:'A shield that bends space. Attacks seem to miss on their own.', value:380, xp:158 },
      { id:'t8_shield', name:'Mythic Bulwark',    rarity:'legendary', setId:'mythic_mantle',  stats:{hardiness:105}, desc:'Solidified starlight pressed flat. Indestructible by any known force.', value:650, xp:252 },
    ]
  },
  // ── HEAD ─────────────────────────────────────────────────────
  {
    slotKey: 'head', icon: '⛑', affixPool: ['hardiness','vitality','vitRegen','veil','dodge','allResist','lethalChance','resolve'],
    tiers: [
      { id:'t1_helm', name:'Scrap Helmet',        rarity:'common',    setId:'scrap_assembly', stats:{hardiness:2,vitality:3},    desc:'A battered metal bowl strapped to your head. Surprisingly effective.', value:9, xp:8 },
      { id:'t2_helm', name:'Copper Helmet',       rarity:'common',    setId:'copper_rig',       stats:{hardiness:4,vitality:6},    desc:'A forged copper helm. Your skull thanks you.', value:20, xp:15 },
      null,
      { id:'t4_helm', name:'Tempered Helm',       rarity:'uncommon',  setId:'tempered_core',  stats:{hardiness:8,vitality:12},   desc:'Coal-hardened helm with a reinforced brim. Nothing gets through.', value:65, xp:35 },
      { id:'t5_helm', name:'Hardened Helm',       rarity:'rare',      setId:'hardened_shell', stats:{hardiness:14,vitality:21},  desc:'Compressed steel headpiece. Headshots barely register.', value:115, xp:58 },
      { id:'t6_helm', name:'Runic Helm',          rarity:'rare',      setId:'runic_weave',    stats:{hardiness:24,vitality:36},  desc:'Runic glyphs carved into the crown absorb kinetic energy.', value:198, xp:90 },
      { id:'t7_helm', name:'Void Crown',          rarity:'epic',      setId:'void_thread',    stats:{hardiness:40,vitality:60},  desc:'A crown-shaped helmet of compressed void. Thoughts become sharper.', value:348, xp:145 },
      { id:'t8_helm', name:'Mythic Visage',       rarity:'legendary', setId:'mythic_mantle',  stats:{hardiness:70,vitality:105}, desc:'A mask of celestial origin. Grants visions of attacks before they land.', value:598, xp:232 },
    ]
  },
  // ── CHEST ────────────────────────────────────────────────────
  {
    slotKey: 'chest', icon: '🦺', affixPool: ['hardiness','vitality','veil','rampart','rebuke','allResist','resolve'],
    tiers: [
      { id:'t1_chest', name:'Scrap Chestplate',   rarity:'common',    setId:'scrap_assembly', stats:{hardiness:4,vitality:5},    desc:'Flattened scrap plates zip-tied to a canvas vest. Rough but real.', value:15, xp:12 },
      { id:'t2_chest', name:'Copper Chestplate',  rarity:'common',    setId:'copper_rig',       stats:{hardiness:8,vitality:10},   desc:'Riveted copper armor plate. Weighs a ton, but holds up.', value:30, xp:22 },
      null,
      { id:'t4_chest', name:'Tempered Cuirass',   rarity:'uncommon',  setId:'tempered_core',  stats:{hardiness:16,vitality:20},  desc:'A coal-tempered steel cuirass. Every section heat-treated for resilience.', value:95, xp:50 },
      { id:'t5_chest', name:'Hardened Carapace',  rarity:'rare',      setId:'hardened_shell', stats:{hardiness:28,vitality:35},  desc:'Layered hardened plates bonded with copper rivets. Blows just bounce off.', value:165, xp:82 },
      { id:'t6_chest', name:'Runic Coat',         rarity:'rare',      setId:'runic_weave',    stats:{hardiness:48,vitality:60},  desc:'A runic-woven coat that stiffens on impact. Adapts to attacks.', value:285, xp:128 },
      { id:'t7_chest', name:'Void Mantle',        rarity:'epic',      setId:'void_thread',    stats:{hardiness:80,vitality:100}, desc:'Woven from void-thread. Absorbs impacts before they fully manifest.', value:498, xp:205 },
      { id:'t8_chest', name:'Mythic Aegis Coat',  rarity:'legendary', setId:'mythic_mantle',  stats:{hardiness:140,vitality:175},desc:"A celestial breastplate that resonates with the wearer's will.", value:855, xp:330 },
    ]
  },
  // ── LEGS ─────────────────────────────────────────────────────
  {
    slotKey: 'legs', icon: '👖', affixPool: ['hardiness','vitality','strideSpeed','dodge','veil','agility'],
    tiers: [
      { id:'t1_legs', name:'Scrap Legguards',     rarity:'common',    setId:'scrap_assembly', stats:{hardiness:3,vitality:4},    desc:'Sheet metal knee-patches on worn cargo pants. Not pretty, but functional.', value:11, xp:9 },
      { id:'t2_legs', name:'Copper Legguards',    rarity:'common',    setId:'copper_rig',       stats:{hardiness:6,vitality:8},    desc:'Copper plated trousers with leather ties. Keeps the legs safe.', value:24, xp:17 },
      null,
      { id:'t4_legs', name:'Tempered Greaves',    rarity:'uncommon',  setId:'tempered_core',  stats:{hardiness:12,vitality:16},  desc:'Tempered steel cuisses and greaves. Absorbs leg strikes well.', value:76, xp:40 },
      { id:'t5_legs', name:'Hardened Plates',     rarity:'rare',      setId:'hardened_shell', stats:{hardiness:21,vitality:28},  desc:'Thickly plated leg armor with articulated knee joints.', value:132, xp:66 },
      { id:'t6_legs', name:'Runic Legs',          rarity:'rare',      setId:'runic_weave',    stats:{hardiness:36,vitality:48},  desc:'Runic inscriptions glow faintly when struck. They absorb what they glow.', value:228, xp:102 },
      { id:'t7_legs', name:'Void Leggings',       rarity:'epic',      setId:'void_thread',    stats:{hardiness:60,vitality:80},  desc:'Void-thread woven legwear redistributes impact across dimensions.', value:400, xp:162 },
      { id:'t8_legs', name:'Mythic Greaves',      rarity:'legendary', setId:'mythic_mantle',  stats:{hardiness:105,vitality:140},desc:'Celestially-forged greaves. Each step leaves faint light on the ground.', value:688, xp:260 },
    ]
  },
  // ── BOOTS ────────────────────────────────────────────────────
  {
    slotKey: 'boots', icon: '👟', affixPool: ['strideSpeed','dodge','hardiness','vitality','strikeTempo','agility'],
    tiers: [
      { id:'t1_boots', name:'Scrap Boots',        rarity:'common',    setId:'scrap_assembly', stats:{hardiness:2,strideSpeed:3},   desc:'Steel scraps duct-taped over old sneakers. Hurt to wear, work well.', value:9, xp:8 },
      { id:'t2_boots', name:'Copper Boots',       rarity:'common',    setId:'copper_rig',       stats:{hardiness:4,strideSpeed:6},   desc:'Forged copper soles with leather uppers. Heavy but very protective.', value:20, xp:15 },
      null,
      { id:'t4_boots', name:'Tempered Treads',    rarity:'uncommon',  setId:'tempered_core',  stats:{hardiness:8,strideSpeed:12},  desc:'Heat-treated soles with reinforced ankle guards. Quick and sturdy.', value:68, xp:36 },
      { id:'t5_boots', name:'Hardened Stompers',  rarity:'rare',      setId:'hardened_shell', stats:{hardiness:14,strideSpeed:21}, desc:'Hardened-steel combat boots with shock-absorbent plating.', value:118, xp:60 },
      { id:'t6_boots', name:'Runic Soles',        rarity:'rare',      setId:'runic_weave',    stats:{hardiness:24,strideSpeed:36}, desc:'Speed runes etched into the sole. You barely notice the weight.', value:205, xp:95 },
      { id:'t7_boots', name:'Void Steps',         rarity:'epic',      setId:'void_thread',    stats:{hardiness:40,strideSpeed:60}, desc:'Each step partially exists in the void. Silent and blindingly fast.', value:358, xp:152 },
      { id:'t8_boots', name:'Mythic Walkers',     rarity:'legendary', setId:'mythic_mantle',  stats:{hardiness:70,strideSpeed:105},desc:'Walk between heartbeats. Leave light trails on every surface.', value:615, xp:244 },
    ]
  },
  // ── GLOVES ───────────────────────────────────────────────────
  {
    slotKey: 'gloves', icon: '🥊', affixPool: ['rawDmg','lethalChance','lethalMult','strikeTempo','sunderChance','armorShred','brawn'],
    tiers: [
      { id:'t1_gloves', name:'Scrap Gauntlets',   rarity:'common',    setId:'scrap_assembly', stats:{rawDmg:2,hardiness:1},  desc:'Knuckle-wrapped scrap metal. Your hands hurt less when hitting things.', value:8, xp:7 },
      { id:'t2_gloves', name:'Copper Gauntlets',  rarity:'common',    setId:'copper_rig',       stats:{rawDmg:4,hardiness:2},  desc:'Copper-plated leather gloves. Every punch counts for more.', value:18, xp:14 },
      null,
      { id:'t4_gloves', name:'Tempered Fists',    rarity:'uncommon',  setId:'tempered_core',  stats:{rawDmg:8,hardiness:4},  desc:'Tempered steel knuckle-plates on reinforced gloves.', value:60, xp:32 },
      { id:'t5_gloves', name:'Hardened Knuckles', rarity:'rare',      setId:'hardened_shell', stats:{rawDmg:14,hardiness:7},  desc:'Heavy-duty hardened gauntlets. Your punches hit like hammers.', value:105, xp:55 },
      { id:'t6_gloves', name:'Runic Grips',       rarity:'rare',      setId:'runic_weave',    stats:{rawDmg:24,hardiness:12}, desc:'Rune-etched grips channel force into every strike.', value:182, xp:88 },
      { id:'t7_gloves', name:'Void Claws',        rarity:'epic',      setId:'void_thread',    stats:{rawDmg:40,hardiness:20}, desc:'Void-crystal tips. Attacks phase through surface armor.', value:318, xp:140 },
      { id:'t8_gloves', name:'Mythic Hands',      rarity:'legendary', setId:'mythic_mantle',  stats:{rawDmg:70,hardiness:35}, desc:'Forged from the same material as stars. Nothing withstands these.', value:545, xp:225 },
    ]
  },
  // ── PICKAXE ──────────────────────────────────────────────────
  {
    slotKey: 'pickaxe', icon: '⛏', affixPool: ['miningSpeed','miningYield','miningReach'],
    tiers: [
      { id:'t1_pickaxe', name:'Scrap Pickaxe',    rarity:'common',    setId:null, stats:{miningSpeed:8},  desc:'A sharpened metal point lashed to a stick. Gets the job done, barely.', value:8, xp:8 },
      { id:'t2_pickaxe', name:'Copper Pickaxe',   rarity:'common',    setId:null, stats:{miningSpeed:14}, desc:'A solid copper head on a rough timber handle. Mines efficiently.', value:18, xp:14 },
      null,
      { id:'t4_pickaxe', name:'Tempered Pickaxe', rarity:'uncommon',  setId:null, stats:{miningSpeed:28}, desc:'A heat-hardened pick that bites through stone effortlessly.', value:62, xp:33 },
      { id:'t5_pickaxe', name:'Hardened Pick',    rarity:'rare',      setId:null, stats:{miningSpeed:45}, desc:'Compressed hardened-steel head that barely slows on impact.', value:108, xp:56 },
      { id:'t6_pickaxe', name:'Runic Pickaxe',    rarity:'rare',      setId:null, stats:{miningSpeed:65}, desc:'Runic acceleration glyphs let each swing complete in half the time.', value:188, xp:90 },
      { id:'t7_pickaxe', name:'Void Pick',        rarity:'epic',      setId:null, stats:{miningSpeed:90}, desc:'The tip partially exists in the void. Passes through rock before it cracks.', value:330, xp:145 },
      { id:'t8_pickaxe', name:'Mythic Excavator', rarity:'legendary', setId:null, stats:{miningSpeed:120}, desc:'Geological forces bend at its touch. Mountains fear this pickaxe.', value:565, xp:232 },
    ]
  },
  // ── AXE ──────────────────────────────────────────────────────
  {
    slotKey: 'axe', icon: '🪓', affixPool: ['miningYield','miningSpeed','miningReach'],
    tiers: [
      { id:'t1_axe', name:'Scrap Axe',            rarity:'common',    setId:null, stats:{miningYield:6},  desc:'A flat scrap blade lashed to a branch. Splits seams for extra ore.', value:8, xp:7 },
      { id:'t2_axe', name:'Copper Axe',           rarity:'common',    setId:null, stats:{miningYield:11}, desc:'A heavy copper axe head pinned to a thick wooden haft.', value:18, xp:13 },
      null,
      { id:'t4_axe', name:'Tempered Axe',         rarity:'uncommon',  setId:null, stats:{miningYield:22}, desc:'A tempered edge that splits ore seams with surgical precision.', value:60, xp:31 },
      { id:'t5_axe', name:'Hardened Splitter',    rarity:'rare',      setId:null, stats:{miningYield:35}, desc:'Every swing maximizes fracture points for maximum yield.', value:105, xp:52 },
      { id:'t6_axe', name:'Runic Axe',            rarity:'rare',      setId:null, stats:{miningYield:50}, desc:'Yield runes etched into the blade ensure every seam gives its best.', value:182, xp:84 },
      { id:'t7_axe', name:'Void Cleaver',         rarity:'epic',      setId:null, stats:{miningYield:70}, desc:'The void edge reveals hidden ore veins invisible to normal tools.', value:318, xp:135 },
      { id:'t8_axe', name:'Mythic Splitter',      rarity:'legendary', setId:null, stats:{miningYield:95}, desc:'One swing per seam. Always maximum yield. Always.', value:545, xp:218 },
    ]
  },
  // ── SCYTHE ───────────────────────────────────────────────────
  {
    slotKey: 'scythe', icon: '🌿', affixPool: ['miningReach','miningYield','miningSpeed'],
    tiers: [
      { id:'t1_scythe', name:'Scrap Scythe',      rarity:'common',    setId:null, stats:{miningReach:9},  desc:'A bent metal strip on a long stick. Sweeps a wider area than bare hands.', value:7, xp:7 },
      { id:'t2_scythe', name:'Copper Scythe',     rarity:'common',    setId:null, stats:{miningReach:15}, desc:'A curved copper blade on a solid wood shaft. Wide sweeping arc.', value:17, xp:12 },
      null,
      { id:'t4_scythe', name:'Tempered Scythe',   rarity:'uncommon',  setId:null, stats:{miningReach:27}, desc:'A tempered blade on a balanced shaft. Reaches what others miss.', value:58, xp:30 },
      { id:'t5_scythe', name:'Hardened Reaper',   rarity:'rare',      setId:null, stats:{miningReach:44}, desc:'A wide hardened arc sweeps everything in a broad half-circle.', value:100, xp:50 },
      { id:'t6_scythe', name:'Runic Scythe',      rarity:'rare',      setId:null, stats:{miningReach:65}, desc:"Reach runes extend the arc far beyond the blade's physical length.", value:175, xp:80 },
      { id:'t7_scythe', name:'Void Reaper',       rarity:'epic',      setId:null, stats:{miningReach:92}, desc:'The blade sweeps through space itself, gathering from just out of reach.', value:305, xp:128 },
      { id:'t8_scythe', name:'Mythic Harvester',  rarity:'legendary', setId:null, stats:{miningReach:130}, desc:'Anything within twenty meters is "in range". Sweeps entire corridors.', value:525, xp:205 },
    ]
  },
  // ── EARRING ──────────────────────────────────────────────────
  {
    slotKey: 'earring', icon: '💎', affixPool: ['rawDmg','vitality','hardiness','strideSpeed','lethalChance','lethalMult','strikeTempo','fatefulStrike','dodge','veil','essenceMax','flux','brawn','agility','mind','resolve','vitalityOnStrike'],
    tiers: [
      { id:'t1_earring', name:'Scrap Loop',       rarity:'common',    setId:null, stats:{fatefulStrike:1}, desc:'A bent wire loop. Lucky to have found it.', value:6, xp:6 },
      { id:'t2_earring', name:'Copper Stud',      rarity:'common',    setId:null, stats:{fatefulStrike:1}, desc:'A plain copper stud. Nothing special, but it feels good.', value:14, xp:11 },
      null,
      { id:'t4_earring', name:'Tempered Charm',   rarity:'uncommon',  setId:null, stats:{fatefulStrike:2}, desc:'A heat-treated charm on a tempered pin. Feels warm to the touch.', value:55, xp:28 },
      { id:'t5_earring', name:'Hardened Gem',     rarity:'rare',      setId:null, stats:{fatefulStrike:2}, desc:'A compressed stone gem with faint inner light. Hard to ignore.', value:95, xp:48 },
      { id:'t6_earring', name:'Runic Stone',      rarity:'rare',      setId:null, stats:{fatefulStrike:3}, desc:'A rune-carved gemstone. The inscription changes in different light.', value:165, xp:76 },
      { id:'t7_earring', name:'Void Pendant',     rarity:'epic',      setId:null, stats:{fatefulStrike:4}, desc:'A pendant of compressed void. Everything near it seems slightly luckier.', value:290, xp:122 },
      { id:'t8_earring', name:'Mythic Jewel',     rarity:'legendary', setId:null, stats:{fatefulStrike:5}, desc:'A gem of unknown origin. Reality bends slightly in its presence.', value:498, xp:196 },
    ]
  },
  // ── RING ─────────────────────────────────────────────────────
  {
    slotKey: 'ring', icon: '💍', affixPool: ['rawDmg','vitality','hardiness','strideSpeed','lethalChance','lethalMult','strikeTempo','fatefulStrike','dodge','veil','essenceMax','flux','brawn','agility','mind','resolve','vitalityOnStrike'],
    tiers: [
      { id:'t1_ring', name:'Scrap Band',          rarity:'common',    setId:null, stats:{rawDmg:1},                  desc:'A flattened scrap strip shaped into a ring. Better than nothing.', value:6, xp:6 },
      { id:'t2_ring', name:'Copper Ring',         rarity:'common',    setId:null, stats:{rawDmg:2},                  desc:'A simple copper band. Heavier than it looks.', value:14, xp:11 },
      null,
      { id:'t4_ring', name:'Tempered Signet',     rarity:'uncommon',  setId:null, stats:{rawDmg:4,hardiness:2},      desc:'A tempered signet ring with an engraved crest. Solid in the fist.', value:55, xp:28 },
      { id:'t5_ring', name:'Hardened Seal',       rarity:'rare',      setId:null, stats:{rawDmg:7,hardiness:4},      desc:'A compressed hardened ring with a worn seal. Hits harder wearing it.', value:95, xp:48 },
      { id:'t6_ring', name:'Runic Crest',         rarity:'rare',      setId:null, stats:{rawDmg:12,hardiness:7},     desc:'Runic channels carved into the band pulse faintly. Power flows through it.', value:165, xp:76 },
      { id:'t7_ring', name:'Void Band',           rarity:'epic',      setId:null, stats:{rawDmg:20,hardiness:12},    desc:'A ring that seems to absorb the colour around it. Unnaturally light.', value:290, xp:122 },
      { id:'t8_ring', name:'Mythic Ring',         rarity:'legendary', setId:null, stats:{rawDmg:32,hardiness:20},    desc:'Forged from the same material as mythic weapons. A perfect circle of power.', value:498, xp:196 },
    ]
  },
];

// ── TIER ICONS ────────────────────────────────────────────────
// Per-slot icon overrides, indexed 0–7 (T1–T8). null = use slot default.
const TIER_ICONS = {
  weapon:  ['🗡️','⚔️', null,'🔪','🔱','🔮','💀','⭐'],
  offhand: ['🪣','🛡',  null,'🛡','🛡','💠','⚫','🌟'],
  head:    ['⛑','⛑',   null,'🪖','🪖','🔷','🖤','👑'],
  chest:   ['👕','🦺',  null,'🥋','🦾','💎','🌑','🌠'],
  legs:    ['🩲','👖',  null,'🩳','🩱','🔵','⚫','✨'],
  boots:   ['👞','👟',  null,'👢','👢','🔹','⚫','💫'],
  gloves:  ['🧤','🥊',  null,'🧤','🤜','✨','🌑','🌟'],
  pickaxe: ['⛏','⛏',   null,'⚒','⚒','🔮','🌀','✨'],
  axe:     ['🪓','🪓',  null,'🪓','🔨','💫','⚫','🌟'],
  scythe:  ['🔪','🔪',  null,'⚔️','⚔️','💠','🌀','✨'],
};

// ── REGISTER TIERED GEAR ──────────────────────────────────────
// Populate TIERED_GEAR_BASES + ITEM_DB / ITEM_BY_ID from TIERED_SLOT_CONFIGS.
TIERED_SLOT_CONFIGS.forEach(cfg => {
  cfg.tiers.forEach((tierDef, idx) => {
    if (!tierDef) return; // null = T3 (already registered above)
    const tierNum  = idx + 1;
    const slotIcon = (TIER_ICONS[cfg.slotKey] || [])[idx] || cfg.icon;
    const base = {
      id:        tierDef.id,
      name:      tierDef.name,
      slot:      cfg.slotKey,
      setId:     tierDef.setId,
      rarity:    tierDef.rarity,
      icon:      slotIcon,
      weight:    1.0,
      value:     tierDef.value,
      desc:      tierDef.desc,
      baseStats: { ...tierDef.stats },
      affixPool: [...cfg.affixPool],
      tier:      tierNum,
    };
    TIERED_GEAR_BASES.push(base);
    if (!ITEM_BY_ID[base.id]) {
      const entry = {
        id: base.id, name: base.name, type: 'equipment',
        slot: base.slot, setId: base.setId,
        rarity: base.rarity, icon: slotIcon, drawFn: null,
        desc: base.desc, weight: base.weight, stackable: 1,
        stats: { ...base.baseStats },
        value: base.value,
      };
      ITEM_DB.push(entry);
      ITEM_BY_ID[base.id] = entry;
    }
  });
});

// ── SWORD SPRITESHEET ──────────────────────────────────────────
// SWORDTIERS.png: 203×428, 1 col × 8 rows → each cell 203×53.5
// Swords top-to-bottom = T1 → T8
const _swordSheet = new Image();
_swordSheet.src = 'GAME IMAGES/SWORDTIERS.png';
const _SWORD_CW   = 203;
const _SWORD_CH   = 428 / 8;   // 53.5 px per row

// row 0 = T1 ... row 7 = T8  (ig_sword is T3 = row 2)
const _SWORD_ROWS = {
  t1_sword: 0,
  t2_sword: 1,
  ig_sword: 2,
  t4_sword: 3,
  t5_sword: 4,
  t6_sword: 5,
  t7_sword: 6,
  t8_sword: 7,
};

function _makeSwordDrawFn(row) {
  return function(ctx, size) {
    function doDraw() {
      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;
      ctx.save();
      ctx.translate(size / 2, size / 2);
      // Rotate CCW so the sprite's long axis (203px) becomes vertical → blade points up
      ctx.rotate(-Math.PI / 2);
      // Contain: fit the long axis (CW) to size, scale short axis proportionally
      const scale = size / _SWORD_CW;
      const dw = size;                            // long axis → fills height after rotation
      const dh = Math.round(_SWORD_CH * scale);  // short axis → proportional width
      ctx.drawImage(_swordSheet,
        0, row * _SWORD_CH, _SWORD_CW, _SWORD_CH,
        -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }
    if (_swordSheet.complete && _swordSheet.naturalWidth) {
      doDraw();
    } else {
      _swordSheet.addEventListener('load', doDraw, { once: true });
    }
  };
}

// Attach drawFn to every sword in ITEM_BY_ID and TIERED_GEAR_BASES / IRON_GRID_BASES
Object.entries(_SWORD_ROWS).forEach(([id, row]) => {
  const fn = _makeSwordDrawFn(row);
  if (ITEM_BY_ID[id])         ITEM_BY_ID[id].drawFn = fn;
  const tb = TIERED_GEAR_BASES.find(b => b.id === id);
  if (tb) tb.drawFn = fn;
  const ib = IRON_GRID_BASES.find(b => b.id === id);
  if (ib) ib.drawFn = fn;
});
