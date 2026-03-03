// ── CAMERA ─────────────────────────────────────────────────
function updateCamera() {
  const target=Math.max(0,Math.min(WW-VW, char.wx-VW/2));
  // Snap camX instantly if it's way off (after scene/warp transitions)
  // — prevents char and speech bubbles appearing at wrong viewport position
  if (Math.abs(target-camX) > VW*0.8) { camX=target; } else { camX+=(target-camX)*0.1; }
  document.getElementById('scroll').style.transform=`translateX(-${camX}px)`;

  // character div is OUTSIDE scroll, positioned in viewport coords
  const vx=char.wx-camX;
  const charEl=document.getElementById('char');
  charEl.style.left=(vx-16)+'px';
  charEl.style.top=(char.wy-52)+'px';
  charEl.style.transform=char.facing===-1?'scaleX(-1)':'scaleX(1)';

  // bubbles follow char in viewport
  positionBubbles(vx);
}

function positionBubbles(vx, vy) {
  const sp=document.getElementById('speech');
  const th=document.getElementById('thought');
  const by = (vy !== undefined) ? vy : char.wy-52;
  const bx = (vx !== undefined) ? vx : char.wx-camX;
  sp.style.left=Math.max(4,Math.min(VW-244,bx-20))+'px';
  sp.style.top=Math.max(36,(by-95))+'px';
  th.style.left=Math.max(4,Math.min(VW-224,bx+34))+'px';
  th.style.top=Math.max(36,(by-75))+'px';
}

// ── SPEECH/THOUGHT ─────────────────────────────────────────
let sTimer=null, tTimer=null;
function showSpeech(text,dur=6000,addToHistory=false){
  const el=document.getElementById('speech');
  el.textContent=text; el.classList.add('show');
  clearTimeout(sTimer); sTimer=setTimeout(()=>el.classList.remove('show'),dur);
  if(addToHistory) addChatMsg('pixel', text, true);
}
function showThought(text){
  const el=document.getElementById('thought');
  el.textContent=text; el.classList.add('show');
  clearTimeout(tTimer); tTimer=setTimeout(()=>el.classList.remove('show'),7000);
}

// ── HUD ────────────────────────────────────────────────────
function updateHUD(){
  const ml=getMood(), t=tod();
  // Look up current location — works for main LOCS and custom scene locs
  const LOC_OVERRIDES = {
    docks:    { emoji:'⚓',  name:'DOCKS'     },
    library:  { emoji:'📚', name:'LIBRARY'   },
    mines:    { emoji:'⛏️',  name:'MINES'     },
    bazaar:   { emoji:'🏪', name:'BAZAAR'    },
    outskirts:{ emoji:'🌾', name:'OUTSKIRTS' },
    nightclub:{ emoji:'🎵', name:'NIGHTCLUB' },
    street:   { emoji:'🚶', name:'STREET'    },
  };
  const l = LOCS[char.loc] || LOC_OVERRIDES[char.loc] || { emoji:'🏠', name:'HOME' };
  document.getElementById('locpill').textContent=`${l.emoji} ${l.name} 🗺`;
  document.getElementById('moodpill').innerHTML=`${ml.emoji} ${ml.name} <span id="moodbar"><span id="moodfill" style="width:${(mood.v+100)/200*100}%;background:${ml.col}"></span></span>`;
  document.getElementById('timepill').textContent=`${t.icon} ${String(gt.h).padStart(2,'0')}:${String(gt.m).padStart(2,'0')}`;
  document.getElementById('statustxt').textContent = char.action + ' · ' + char.loc + (currentArc ? ' · ' + currentArc.label : '');
  updateChatStatus();
  // day/night overlay
  const dk={morning:'rgba(15,10,40,0.12)',day:'rgba(0,0,0,0)',evening:'rgba(10,5,30,0.32)',night:'rgba(8,6,40,0.6)'};
  document.getElementById('night').style.background=dk[t.phase];
}

// ════════════════════════════════════════════════════════════
// AUDIO DATABASE
// ════════════════════════════════════════════════════════════
// Structure:
//   AUDIO_DB.bgm        — background music (looping, location-driven)
//   AUDIO_DB.sfx        — sound effects (one-shot)
//   AUDIO_DB.radio      — radio station tracks
//   AUDIO_DB.ambient    — ambient loops (non-music atmosphere)
//   AUDIO_DB.ui         — UI sounds (clicks, notifications, alerts)
//
// To add a new track: ffmpeg -i song.wav -codec:a libmp3lame -qscale:a 4 song.mp3
// then base64-encode it and paste the string as the `src` value.
// Naming convention: MAIN_SONG_N → bgm, RADIO_SONG_N → radio,
//                   SFX_N → sfx, AMBIENT_N → ambient, UI_N → ui
// ════════════════════════════════════════════════════════════

// ITEM DATABASE
// ════════════════════════════════════════════════════════════
// Structure:
//   id         — unique string key
//   name       — display name
//   type       — 'resource' | 'food' | 'equipment' | 'misc'
//   rarity     — 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
//   icon       — emoji fallback (shown if no pixel art defined)
//   drawFn     — function(ctx, x, y, size) draws pixel icon onto canvas
//   desc       — flavour text
//   weight     — kg per unit
//   stackable  — max stack size (1 = not stackable)
//   stats      — { key: value } pairs shown in detail panel
//   value      — sell value in coins
//
// To add items: push to ITEM_DB array. drawFn is optional — leave null
// to use emoji icon instead. Pixel art functions draw at (0,0) size x size.
// ════════════════════════════════════════════════════════════

// ── PIXEL ART DRAW FUNCTIONS ─────────────────────────────────
// Each draws a recognisable icon onto a canvas context at given size.
// Colors chosen to look good on dark backgrounds.

function drawMetal(ctx, size) {
  const s = size / 16;
  const p = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x*s, y*s, w*s, h*s); };
  // Ingot base shape
  p(2,4,12,8,'#8899aa');   // main body
  p(2,4,12,2,'#aabbcc');   // top highlight
  p(2,4,1,8,'#aabbcc');    // left highlight
  p(13,4,1,8,'#667788');   // right shadow
  p(2,11,12,1,'#556677');  // bottom shadow
  // Trapezoidal top bevel
  p(4,2,8,3,'#99aabb');
  p(5,1,6,2,'#bbccdd');
  p(6,0,4,2,'#ccdde8');
  // Shine streak
  p(4,5,2,4,'#ccddee');
  p(5,5,1,3,'#ddeeff');
  // Rivet dots
  p(4,8,2,2,'#556677');
  p(10,8,2,2,'#556677');
}

function drawWood(ctx, size) {
  const s = size / 16;
  const p = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x*s, y*s, w*s, h*s); };
  // Log shape
  p(1,5,14,7,'#8B5E3C');   // main log
  p(1,5,14,2,'#A07040');   // top face
  p(1,5,1,7,'#9a6840');    // left face
  p(14,5,1,7,'#6B4520');   // right shadow
  // End grain circle (left)
  p(1,4,4,9,'#9E6B3D');
  p(2,3,2,11,'#B07844');
  p(1,6,4,4,'#9E6B3D');
  // Ring lines in end grain
  p(3,5,1,6,'#7a5230');
  p(2,7,1,3,'#7a5230');
  // Bark texture lines along log
  p(5,6,1,5,'#6B4520');
  p(8,5,1,6,'#6B4520');
  p(11,6,1,5,'#7a5230');
  // Grain lines on top face
  p(3,5,1,1,'#6B4520');
  p(7,5,2,1,'#7a5230');
  p(12,5,1,1,'#6B4520');
  // Highlight on top edge
  p(2,4,12,1,'#C09060');
}

function drawFiber(ctx, size) {
  const s = size / 16;
  const p = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x*s, y*s, w*s, h*s); };
  // Bundle of plant fibers / rope coil base
  p(3,11,10,3,'#8aaa44');  // ground shadow
  // Strands — woven diagonal pattern
  const strand = '#a8cc55';
  const dark   = '#6a8833';
  const light  = '#ccee77';
  p(4,2,2,12, strand);
  p(7,1,2,12, strand);
  p(10,2,2,12, strand);
  // Weave cross lines
  p(3,4,10,2, dark);
  p(3,8,10,2, dark);
  p(4,6,8,1, '#b8dd66');
  // Highlight strands
  p(4,2,1,4, light);
  p(7,1,1,3, light);
  p(10,2,1,4, light);
  // Tie band at middle
  p(3,6,10,3,'#88aa33');
  p(3,7,10,1,'#6a8822');
  p(4,6,8,1,'#aacc44');
  // Loose ends at top
  p(3,1,2,3,'#b8cc66');
  p(7,0,1,3,'#ccdd77');
  p(11,1,2,3,'#b8cc66');
}

// ── ITEM DATABASE ─────────────────────────────────────────────
const ITEM_DB = [

  // ── RESOURCES ──────────────────────────────────────────────
  {
    id:        'metal',
    name:      'Metal',
    type:      'resource',
    rarity:    'common',
    icon:      '🔩',
    drawFn:    drawMetal,
    desc:      'Raw scrap metal. Salvaged from old machinery. Useful for crafting and repairs.',
    weight:    1.5,
    stackable: 99,
    stats:     { Hardness: '7/10', Source: 'Salvage / Store' },
    value:     4,
  },
  {
    id:        'wood',
    name:      'Wood',
    type:      'resource',
    rarity:    'common',
    icon:      '🪵',
    drawFn:    drawWood,
    desc:      'Rough-cut timber. Chopped from city park trees or found in dumpsters.',
    weight:    1.2,
    stackable: 99,
    stats:     { Density: 'Medium', Source: 'Park / Dumpster' },
    value:     2,
  },
  {
    id:        'fiber',
    name:      'Fiber',
    type:      'resource',
    rarity:    'common',
    icon:      '🌿',
    drawFn:    drawFiber,
    desc:      'Plant fibers and rope scraps. Twisted together into rough cord. Used for binding and crafting.',
    weight:    0.3,
    stackable: 99,
    stats:     { Flexibility: 'High', Source: 'Park / Market' },
    value:     1,
  },

  // (more items go here — food, equipment, misc)

  // Mining resources
  { id:'stone',      name:'Stone',      type:'resource', rarity:'common',   icon:'🪨', drawFn:null, desc:'Basic rock. Building material.',               weight:0.5, stackable:99, stats:{Hardness:'4/10', Source:'Mines'},     value:1  },
  { id:'coal',       name:'Coal',       type:'resource', rarity:'common',   icon:'⚫', drawFn:null, desc:'Burns hot. Used for smelting and fuel.',        weight:0.4, stackable:99, stats:{Energy:'High',  Source:'Mines'},     value:3  },
  { id:'copper_ore', name:'Copper Ore', type:'resource', rarity:'uncommon', icon:'🟤', drawFn:null, desc:'Soft metal ore. Smelt to refine.',              weight:0.8, stackable:99, stats:{Purity:'60%',  Source:'Mines'},     value:8  },
  { id:'tin_ore',    name:'Tin Ore',    type:'resource', rarity:'uncommon', icon:'🔘', drawFn:null, desc:'Combine with copper to make bronze.',           weight:0.7, stackable:99, stats:{Purity:'55%',  Source:'Mines'},     value:6  },
  { id:'iron_ore',   name:'Iron Ore',   type:'resource', rarity:'rare',     icon:'⚙️', drawFn:null, desc:'Heavy dense ore. Foundation of tools.',        weight:1.2, stackable:99, stats:{Purity:'70%',  Source:'Deep Mines'},value:18 },

  // ── TIER ORES (raw, mineable) ──────────────────────────────
  { id:'scrap_metal',  name:'Scrap Metal',  type:'resource', rarity:'common',    icon:'🔩', drawFn:null, desc:'Bent scrap and salvaged bits. Basic T1 material.',                    weight:1.0, stackable:99, stats:{Hardness:'2/10', Source:'Mines'},         value:2   },
  { id:'runic_ore',    name:'Runic Ore',    type:'resource', rarity:'rare',      icon:'🔷', drawFn:null, desc:'Ore humming with dormant energy. Deep mine seams only.',              weight:1.4, stackable:99, stats:{Purity:'75%',    Source:'Deep Mines'},    value:80  },
  { id:'void_ore',     name:'Void Ore',     type:'resource', rarity:'epic',      icon:'💠', drawFn:null, desc:'Dense ore that absorbs light. Deepest shafts.',                      weight:2.0, stackable:99, stats:{Purity:'85%',    Source:'Deepest Mines'}, value:180 },
  { id:'mythic_ore',   name:'Mythic Ore',   type:'resource', rarity:'legendary', icon:'✨', drawFn:null, desc:'Condensed starfire fragment. Appears rarely.',                        weight:2.5, stackable:99, stats:{Purity:'99%',    Source:'Mythic Depths'},  value:400 },

  // ── FABRICATED INGOTS (processed) ─────────────────────────
  { id:'copper_ingot', name:'Copper Ingot', type:'resource', rarity:'common',    icon:'🟠', drawFn:null, desc:'Smelted copper. Soft and workable. T2 crafting base.',                weight:1.0, stackable:99, stats:{Purity:'90%',    Source:'Fabrication'},   value:12  },
  { id:'tin_ingot',    name:'Tin Ingot',    type:'resource', rarity:'uncommon',  icon:'🔘', drawFn:null, desc:'Refined tin bar. Light and corrosion-resistant. T4 crafting base.',   weight:0.9, stackable:99, stats:{Purity:'88%',    Source:'Fabrication'},   value:28  },
  { id:'iron_ingot',   name:'Iron Ingot',   type:'resource', rarity:'uncommon',  icon:'🔨', drawFn:null, desc:'Properly smelted iron. Hard and reliable. T5 crafting base.',          weight:1.3, stackable:99, stats:{Purity:'92%',    Source:'Fabrication'},   value:55  },
  { id:'runic_ingot',  name:'Runic Ingot',  type:'resource', rarity:'rare',      icon:'🔮', drawFn:null, desc:'A glowing ingot of refined runic ore. Resonates with magic. T6 base.', weight:1.5, stackable:99, stats:{Purity:'80%',    Source:'Fabrication'},   value:160 },
  { id:'void_crystal', name:'Void Crystal', type:'resource', rarity:'epic',      icon:'💎', drawFn:null, desc:'Crystallised void ore. Bends light at its edges. T7 crafting base.',  weight:1.8, stackable:99, stats:{Purity:'90%',    Source:'Fabrication'},   value:380 },
  { id:'mythic_core',  name:'Mythic Core',  type:'resource', rarity:'legendary', icon:'🌟', drawFn:null, desc:'A pulsing core of refined mythic material. T8 crafting base.',         weight:2.2, stackable:99, stats:{Purity:'99%',    Source:'Fabrication'},   value:850 },

  // ── SECONDARY PROCESSED MATERIALS ─────────────────────────
  { id:'refined_cord',  name:'Refined Cord',  type:'resource', rarity:'uncommon',  icon:'🧵', drawFn:null, desc:'Tightly woven fiber cord reinforced with stone dust. T4 secondary.',  weight:0.3, stackable:99, stats:{Flex:'High', Source:'Fabrication'}, value:22  },
  { id:'hardened_cord', name:'Hardened Cord', type:'resource', rarity:'rare',      icon:'🪢', drawFn:null, desc:'Coal-cured cord that resists cutting and fraying. T5 secondary.',     weight:0.4, stackable:99, stats:{Flex:'Med',  Source:'Fabrication'}, value:48  },
  { id:'runic_thread',  name:'Runic Thread',  type:'resource', rarity:'rare',      icon:'🕸', drawFn:null, desc:'Fiber woven with runic ore dust. Faintly luminescent. T6 secondary.', weight:0.3, stackable:99, stats:{Flex:'Low',  Source:'Fabrication'}, value:120 },
  { id:'void_weave',    name:'Void Weave',    type:'resource', rarity:'epic',      icon:'🌀', drawFn:null, desc:'Thread spun from void ore filaments. Barely there. T7 secondary.',    weight:0.2, stackable:99, stats:{Flex:'High', Source:'Fabrication'}, value:280 },
  { id:'mythic_silk',   name:'Mythic Silk',   type:'resource', rarity:'legendary', icon:'⭐', drawFn:null, desc:'Celestial filament woven from mythic ore. Stronger than steel. T8.',  weight:0.1, stackable:99, stats:{Flex:'Max',  Source:'Fabrication'}, value:620 },

  // ── QUEST ITEMS ────────────────────────────────────────────
  { id:'wardens_badge', name:"Warden's Badge", type:'quest', rarity:'epic', icon:'🔰', drawFn:null, desc:'Torn from the Downtown Warden. Proof you cleared Tier 1. Opens the gate beyond the Strip.', weight:0.1, stackable:1, stats:{ Origin:'Downtown Strip', Tier:'1 Clear' }, value:0 },

  // ── DOWNTOWN DROP & BOSS ITEMS ─────────────────────────────
  { id:'street_tag',   name:'Street Tag',     type:'resource', rarity:'uncommon', icon:'🏷️', drawFn:null, desc:'A gang tag ripped off a downed enemy. Collect 15 to craft a Warden\'s Summon.', weight:0.1, stackable:99, stats:{ Source:'Downtown Strip' }, value:5 },
  { id:'warden_sigil', name:"Warden's Summon", type:'quest',   rarity:'epic',    icon:'🌀', drawFn:null, desc:'A crackling sigil that calls the Downtown Warden from the shadows. Use at the portal at the end of the Strip.', weight:0.1, stackable:1, stats:{ Use:'Boss Portal' }, value:0 },
];

// Quick lookup by id
const ITEM_BY_ID = {};
ITEM_DB.forEach(item => { ITEM_BY_ID[item.id] = item; });

// ── RARITY COLORS ─────────────────────────────────────────────
const RARITY_COLOR = {
  common:    '#888899',
  uncommon:  '#44cc66',
  rare:      '#4499ff',
  epic:      '#aa44ff',
  legendary: '#ffaa22',
};

// ════════════════════════════════════════════════════════════
// PLAYER INVENTORY
// ════════════════════════════════════════════════════════════
// Flat array of { id, qty } — 40 slots max (nulls = empty slots)
const INV_SLOTS = 40;
let playerInv = Array(INV_SLOTS).fill(null);

// ── Inventory helpers ─────────────────────────────────────────
function invAddItem(id, qty = 1) {
  const item = ITEM_BY_ID[id];
  if (!item) return false;
  let remaining = qty;
  // Try to stack into existing slots first
  if (item.stackable > 1) {
    for (let i = 0; i < INV_SLOTS && remaining > 0; i++) {
      if (playerInv[i]?.id === id && playerInv[i].qty < item.stackable) {
        const space = item.stackable - playerInv[i].qty;
        const add = Math.min(space, remaining);
        playerInv[i].qty += add;
        remaining -= add;
      }
    }
  }
  // Fill empty slots
  for (let i = 0; i < INV_SLOTS && remaining > 0; i++) {
    if (!playerInv[i]) {
      const take = Math.min(remaining, item.stackable || 1);
      playerInv[i] = { id, qty: take };
      remaining -= take;
    }
  }
  if (invOpen) renderInv();
  return remaining === 0;
}

function invRemoveItem(id, qty = 1) {
  let remaining = qty;
  for (let i = INV_SLOTS - 1; i >= 0 && remaining > 0; i--) {
    if (playerInv[i]?.id === id) {
      const take = Math.min(playerInv[i].qty, remaining);
      playerInv[i].qty -= take;
      if (playerInv[i].qty <= 0) playerInv[i] = null;
      remaining -= take;
    }
  }
  compactInv();
  if (invOpen) renderInv();
  return remaining === 0;
}

// ── COMPACT & SORT ────────────────────────────────────────────
// Compact: shift all filled slots to the front, nulls to the end.
function compactInv() {
  const filled = playerInv.filter(s => s !== null);
  for (let i = 0; i < INV_SLOTS; i++) {
    playerInv[i] = filled[i] || null;
  }
}

// Sort: equipment → quest → food → resource → misc,
//       then legendary → epic → rare → uncommon → common,
//       then alphabetically by name. Nulls always go to the end.
function sortInv() {
  const TYPE_ORDER = { equipment: 0, quest: 1, food: 2, resource: 3, misc: 4 };
  const RAR_ORDER  = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
  const filled = playerInv.filter(s => s !== null);
  filled.sort((a, b) => {
    const ia = ITEM_BY_ID[a.id], ib = ITEM_BY_ID[b.id];
    const ta = TYPE_ORDER[ia?.type] ?? 5, tb = TYPE_ORDER[ib?.type] ?? 5;
    if (ta !== tb) return ta - tb;
    const ra = RAR_ORDER[ia?.rarity] ?? 5, rb = RAR_ORDER[ib?.rarity] ?? 5;
    if (ra !== rb) return ra - rb;
    return (ia?.name || '').localeCompare(ib?.name || '');
  });
  for (let i = 0; i < INV_SLOTS; i++) playerInv[i] = filled[i] || null;
  if (invOpen) renderInv();
}

function invTotalWeight() {
  return playerInv.reduce((sum, slot) => {
    if (!slot) return sum;
    const item = ITEM_BY_ID[slot.id];
    return sum + (item ? item.weight * slot.qty : 0);
  }, 0);
}

function invCount() {
  return playerInv.filter(s => s !== null).length;
}

// ── Render pixel art icon onto a canvas ───────────────────────
function renderItemIcon(item, canvas, size) {
  if (!item?.drawFn) return false;
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  item.drawFn(ctx, size);
  return true;
}

// ── INVENTORY UI ──────────────────────────────────────────────
let invOpen       = false;
let invDragSlot   = null;  // index being dragged
let invActiveTab  = 'all';
let invHoverSlot  = null;
let invHoveredIdx = null;  // tracks hovered detail slot (for equip button)
let invCtxSlot    = null;  // inventory index targeted by right-click context menu

function openInv()  { invOpen = true;  document.getElementById('invOverlay').classList.add('open');    renderInv(); }
function closeInv() { invOpen = false; document.getElementById('invOverlay').classList.remove('open'); }
function toggleInv(){ invOpen ? closeInv() : openInv(); }

// Filter slots by active tab
function filteredSlots() {
  if (invActiveTab === 'all') return playerInv.map((s,i)=>({s,i}));
  return playerInv.map((s,i)=>({s,i})).filter(({s}) => {
    if (!s) return true; // always show empty slots
    const item = ITEM_BY_ID[s.id];
    return item?.type === invActiveTab;
  });
}

function renderInv() {
  const grid = document.getElementById('invGrid');
  grid.innerHTML = '';

  const slots = filteredSlots();
  slots.forEach(({ s: slot, i: realIdx }) => {
    const div = document.createElement('div');
    div.className = 'inv-slot' + (slot ? ' filled' : '');
    div.dataset.idx = realIdx;

    if (slot) {
      const item = ITEM_BY_ID[slot.id];
      // Rarity stripe
      const stripe = document.createElement('div');
      stripe.className = 'slot-rarity';
      stripe.style.background = RARITY_COLOR[item?.rarity || 'common'];
      div.appendChild(stripe);

      // Icon — try pixel art canvas first, fall back to emoji
      if (item?.drawFn) {
        const cvs = document.createElement('canvas');
        cvs.className = 'slot-canvas';
        if (item.type === 'equipment') {
          cvs.width = 144; cvs.height = 144;
          cvs.style.width  = '72px';
          cvs.style.height = '72px';
          renderItemIcon(item, cvs, 144);
        } else {
          cvs.width = 72; cvs.height = 72;
          renderItemIcon(item, cvs, 72);
        }
        div.appendChild(cvs);
      } else {
        const ic = document.createElement('div');
        ic.className = 'slot-icon';
        ic.textContent = item?.icon || '?';
        div.appendChild(ic);
      }

      // Quantity badge
      if (slot.qty > 1) {
        const qty = document.createElement('div');
        qty.className = 'slot-qty';
        qty.textContent = slot.qty;
        div.appendChild(qty);
      }

      // Drag
      div.draggable = true;
      div.addEventListener('dragstart', e => {
        invDragSlot = realIdx;
        div.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        // Ghost image
        const ghost = document.getElementById('invDragGhost');
        ghost.innerHTML = item?.drawFn
          ? `<canvas width="40" height="40" style="image-rendering:pixelated"></canvas>`
          : `<span style="font-size:32px">${item?.icon||'?'}</span>`;
        ghost.style.display = 'block';
        if (item?.drawFn) renderItemIcon(item, ghost.querySelector('canvas'), 40);
        e.dataTransfer.setDragImage(ghost, 20, 20);
      });
      div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
        document.getElementById('invDragGhost').style.display = 'none';
        invDragSlot = null;
      });

      // Hover detail
      div.addEventListener('mouseenter', () => showInvDetail(realIdx));
      div.addEventListener('mouseleave', () => clearInvDetail());

      // Equipment-only interactions
      if (item?.type === 'equipment') {
        // Double-click to equip
        div.addEventListener('dblclick', e => {
          e.preventDefault();
          hideInvContextMenu();
          equipFromInv(realIdx);
        });

        // Right-click context menu
        div.addEventListener('contextmenu', e => {
          e.preventDefault();
          showInvContextMenu(realIdx, e.clientX, e.clientY);
        });
      }
    }

    // Drop target
    div.addEventListener('dragover', e => { e.preventDefault(); div.classList.add('drag-over'); });
    div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
    div.addEventListener('drop', e => {
      e.preventDefault(); div.classList.remove('drag-over');
      if (invDragSlot === null || invDragSlot === realIdx) return;
      // Swap slots
      const tmp = playerInv[realIdx];
      playerInv[realIdx] = playerInv[invDragSlot];
      playerInv[invDragSlot] = tmp;
      invDragSlot = null;
      renderInv();
      updateInvFooter();
    });

    grid.appendChild(div);
  });

  updateInvFooter();
}

// ── INVENTORY CONTEXT MENU ────────────────────────────────────
function showInvContextMenu(idx, x, y) {
  invCtxSlot = idx;
  const menu = document.getElementById('invContextMenu');
  menu.classList.add('open');
  // Keep menu within viewport
  const mw = 140, mh = 110;
  const left = (x + mw > window.innerWidth)  ? x - mw : x;
  const top  = (y + mh > window.innerHeight) ? y - mh : y;
  menu.style.left = left + 'px';
  menu.style.top  = top  + 'px';
}

function hideInvContextMenu() {
  document.getElementById('invContextMenu').classList.remove('open');
  invCtxSlot = null;
}

function invDestroyItem(idx) {
  if (playerInv[idx] === null) return;
  playerInv[idx] = null;
  compactInv();
  renderInv();
  updateInvFooter();
}

function invDissolveItem(idx) {
  const slot = playerInv[idx];
  if (!slot) return;
  const item = ITEM_BY_ID[slot.id];
  // Return some raw materials proportional to item value
  const metalBack = Math.max(1, Math.floor((item?.value || 10) / 12));
  const fiberBack = Math.max(1, Math.floor((item?.value || 10) / 20));
  playerInv[idx] = null;
  compactInv();
  invAddItem('metal', metalBack);
  invAddItem('fiber', fiberBack);
  renderInv();
  updateInvFooter();
}

function showInvDetail(idx) {
  invHoveredIdx = idx;
  const slot = playerInv[idx];
  if (!slot) { clearInvDetail(); return; }
  const item = ITEM_BY_ID[slot.id];
  if (!item) return;

  document.getElementById('invDetailNone').style.display = 'none';
  const emojiEl  = document.getElementById('invDetailIcon');
  const canvasEl = document.getElementById('invDetailIconCanvas');

  if (item.drawFn) {
    emojiEl.style.display = 'none';
    canvasEl.style.display = 'block';
    if (item.type === 'equipment') {
      canvasEl.style.width  = '160px';
      canvasEl.style.height = '160px';
      renderItemIcon(item, canvasEl, 320);
    } else {
      canvasEl.style.width  = '';
      canvasEl.style.height = '';
      renderItemIcon(item, canvasEl, 112);
    }
  } else {
    emojiEl.style.display = 'block';
    emojiEl.textContent = item.icon;
    canvasEl.style.display = 'none';
  }

  document.getElementById('invDetailName').textContent = item.name;
  document.getElementById('invDetailType').textContent =
    item.type.toUpperCase() + ' · ' + item.rarity.toUpperCase();
  document.getElementById('invDetailType').style.color =
    RARITY_COLOR[item.rarity] || 'rgba(150,180,255,0.45)';
  document.getElementById('invDetailDesc').textContent = item.desc;
  document.getElementById('invDetailQty').textContent = `x${slot.qty}  ·  ${(item.weight * slot.qty).toFixed(1)} kg`;

  const statsEl = document.getElementById('invDetailStats');
  statsEl.innerHTML = '';
  if (item.stats) {
    Object.entries(item.stats).forEach(([k, v]) => {
      const row = document.createElement('div');
      row.className = 'inv-stat-row';
      row.innerHTML = `<span class="inv-stat-key">${k}</span><span class="inv-stat-val">${v}</span>`;
      statsEl.appendChild(row);
    });
    const valRow = document.createElement('div');
    valRow.className = 'inv-stat-row';
    valRow.innerHTML = `<span class="inv-stat-key">Value</span><span class="inv-stat-val">${item.value}¢</span>`;
    statsEl.appendChild(valRow);
  }

  // Show EQUIP button only for equipment-type items
  const equipBtn = document.getElementById('invEquipBtn');
  if (equipBtn) {
    if (item.type === 'equipment') {
      equipBtn.style.display = 'block';
      equipBtn.onclick = () => { equipFromInv(idx); };
    } else {
      equipBtn.style.display = 'none';
    }
  }
}

function clearInvDetail() {
  invHoveredIdx = null;
  document.getElementById('invDetailNone').style.display = 'block';
  document.getElementById('invDetailIcon').style.display = 'none';
  document.getElementById('invDetailIconCanvas').style.display = 'none';
  document.getElementById('invDetailName').textContent = '';
  document.getElementById('invDetailType').textContent = '';
  document.getElementById('invDetailDesc').textContent = '';
  document.getElementById('invDetailStats').innerHTML = '';
  document.getElementById('invDetailQty').textContent = '';
  const eb = document.getElementById('invEquipBtn');
  if (eb) eb.style.display = 'none';
}

function updateInvFooter() {
  const w = invTotalWeight();
  const maxW = 50;
  const pct = Math.min(100, (w / maxW) * 100);
  document.getElementById('invWeightTxt').textContent = `${w.toFixed(1)} / ${maxW} kg`;
  document.getElementById('invWeightFill').style.width = pct + '%';
  document.getElementById('invWeightFill').style.background =
    pct > 90 ? 'rgba(255,80,80,0.7)' : pct > 70 ? 'rgba(255,180,50,0.7)' : 'rgba(100,160,255,0.6)';
  document.getElementById('invCountTxt').textContent = invCount() + ' items';
  updateMoneyDisplay();
}

function initInv(hasSave = false) {
  // Tabs
  document.querySelectorAll('.inv-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      invActiveTab = tab.dataset.tab;
      document.querySelectorAll('.inv-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderInv();
    });
  });

  // Close button — stop mousedown propagation so the drag handler on the title bar doesn't fire
  const invCloseBtn = document.getElementById('invClose');
  invCloseBtn.addEventListener('mousedown', e => e.stopPropagation());
  invCloseBtn.addEventListener('click', closeInv);

  // Sort button
  const sortBtn = document.getElementById('invSortBtn');
  sortBtn.addEventListener('mousedown', e => e.stopPropagation());
  sortBtn.addEventListener('click', () => {
    sortInv();
    sortBtn.classList.add('sorted');
    setTimeout(() => sortBtn.classList.remove('sorted'), 900);
  });

  // Inventory button in HUD
  document.getElementById('invBtn').addEventListener('click', toggleInv);

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Tab') { e.preventDefault(); toggleInv(); }
    if (e.key === 'Escape' && invOpen) { hideInvContextMenu(); closeInv(); }
  });

  // Click outside to close
  document.getElementById('invOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('invOverlay')) closeInv();
  });

  // Context menu actions
  document.getElementById('invCtxEquip').addEventListener('click', () => {
    const idx = invCtxSlot;
    hideInvContextMenu();
    if (idx !== null) equipFromInv(idx);
  });
  document.getElementById('invCtxDissolve').addEventListener('click', () => {
    const idx = invCtxSlot;
    hideInvContextMenu();
    if (idx !== null) invDissolveItem(idx);
  });
  document.getElementById('invCtxDestroy').addEventListener('click', () => {
    const idx = invCtxSlot;
    hideInvContextMenu();
    if (idx !== null) invDestroyItem(idx);
  });

  // Dismiss context menu on any outside click or right-click
  document.addEventListener('mousedown', e => {
    const menu = document.getElementById('invContextMenu');
    if (menu.classList.contains('open') && !menu.contains(e.target)) {
      hideInvContextMenu();
    }
  });
  document.addEventListener('contextmenu', e => {
    // Hide if right-clicking anywhere that isn't an inv slot with equipment
    if (!e.target.closest('.inv-slot')) hideInvContextMenu();
  });

  // ── DRAG WINDOW (title bar) ──────────────────────────────────
  const win = document.getElementById('invWindow');
  const bar = document.getElementById('invTitleBar');
  let dragging = false, ox = 0, oy = 0;
  bar.addEventListener('mousedown', e => {
    dragging = true;
    const r = win.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    win.style.transform = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    win.style.left = (e.clientX - ox) + 'px';
    win.style.top  = (e.clientY - oy) + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; });

  // Seed starting resources only for new games
  if (!hasSave) {
    // 9 metal + 9 wood + 3 fiber covers all three basic tool recipes (pick+axe+scythe)
    invAddItem('metal', 9);
    invAddItem('wood',  9);
    invAddItem('fiber', 8);
  }

  clearInvDetail();
}

// ── BREAKING NEWS ALERTS ───────────────────────────────────
let lastAlertTime = 0;
const ALERT_INTERVAL = 20 * 60 * 1000;

// Rotating pool of realistic-sounding headlines for offline mode
const OFFLINE_HEADLINES = [
  ['Local infrastructure project completes ahead of schedule', 'The downtown bridge reopened two weeks early, saving the city an estimated $2M.'],
  ['Scientists discover new deep-sea species near Pacific ridge', 'The bioluminescent creature was found at 3,000 meters depth during a research expedition.'],
  ['Tech stocks rally following positive earnings reports', 'Several major index funds hit new highs as investor confidence returned.'],
  ['City council approves new affordable housing development', 'The 200-unit complex will break ground next spring in the warehouse district.'],
  ['Record-breaking marathon runner announces retirement', 'The athlete, who holds three world records, cited the need for a long rest.'],
  ['University researchers publish climate adaptation study', 'The findings suggest urban green corridors reduce heat island effects by 12%.'],
  ['Regional airline announces new direct routes', 'Six new destinations added starting next quarter, including two international cities.'],
  ['Museum opens exhibit on century of urban photography', 'The collection spans 1920 to present and includes never-before-seen archives.'],
];

async function fetchBreakingNews() {
  const now = Date.now();
  if (now - lastAlertTime < ALERT_INTERVAL) return;
  lastAlertTime = now;

  // Try Pollinations for a generated headline, else use offline pool
  let headline = '', detail = '';
  if (apiAvailable === true) {
    try {
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai', max_tokens: 60, temperature: 0.9,
          messages: [{ role: 'user', content: 'Give me one realistic breaking news headline (max 12 words) and one sentence of context. Format exactly: HEADLINE | CONTEXT' }]
        })
      });
      if (res.ok) {
        const data  = await res.json();
        const text  = (data?.choices?.[0]?.message?.content || '').trim();
        const parts = text.split('|');
        headline = (parts[0]||'').trim().replace(/^["'*#]+|["'*#]+$/g,'');
        detail   = (parts[1]||'').trim().replace(/^["'*#]+|["'*#]+$/g,'');
      }
    } catch(e) {}
  }
  if (!headline) {
    const pick = OFFLINE_HEADLINES[Math.floor(Math.random()*OFFLINE_HEADLINES.length)];
    headline = pick[0]; detail = pick[1];
  }

  showNewsAlert(headline, detail);
  mood.news.unshift(headline);
  if (mood.news.length > 5) mood.news.pop();
  const badWords=['war','killed','crash','disaster','attack','crisis','dead','explosion'];
  const goodWords=['peace','breakthrough','win','saved','discovery','hope','record'];
  const low = headline.toLowerCase();
  shiftMood((goodWords.filter(w=>low.includes(w)).length - badWords.filter(w=>low.includes(w)).length)*6);
  setTimeout(async()=>{
    const r = await callAI(`[BREAKING NEWS alert: "${headline}"] React to this in 1 sentence, in character.`, true);
    if(r) { showSpeech(r, 5000, true); addChatMsg('pixel',r,true); }
  }, 2500);
}

function showNewsAlert(headline, detail='') {
  const el = document.getElementById('newsAlert');
  const body = document.getElementById('newsAlertBody');
  if (!el || !body) return;
  body.innerHTML = `<strong>${headline}</strong>${detail ? '<br><span style="font-size:14px;color:rgba(255,220,220,0.7)">' + detail + '</span>' : ''}`;
  el.classList.add('show');
  addLog(`⚡ BREAKING: ${headline.slice(0,40)}`);
  el.style.animation = 'none';
  setTimeout(() => { el.style.animation = ''; }, 10);
  setTimeout(() => el.classList.remove('show'), 12000);
}

// First news alert after 3 minutes, then every 20 min
setTimeout(() => fetchBreakingNews(), 180000);
setInterval(() => fetchBreakingNews(), ALERT_INTERVAL);

