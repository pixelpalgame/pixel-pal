// ── CONSTANTS ──────────────────────────────────────────────
const VW = 1100, VH = 580; // viewport
const WW = 2700, WH = 580; // world width

// Locations (world x ranges)
const LOCS = {
  gym:       { x0:0,    x1:480,  name:'GYM',      emoji:'🏋️' },
  apartment: { x0:480,  x1:1240, name:'HOME',      emoji:'🏠' },
  store:     { x0:1240, x1:1760, name:'GROCERY',   emoji:'🛒' },
  street:    { x0:1760, x1:2080, name:'STREET',    emoji:'🚶' },
  nightclub: { x0:2080, x1:2700, name:'NIGHTCLUB', emoji:'🎵' },
};
const FLOOR_Y = 490; // character walks at this y

// ── STATE ──────────────────────────────────────────────────
const char = { wx:760, wy:FLOOR_Y, tx:760, moving:false, facing:1, action:'idle', loc:'apartment', asleep:false };
const mood = { v:10, energy:80, curiosity:70, topics:[], news:[] };
const gt   = { h:9, m:0, d:0 };
const ai   = { history:[], busy:false };

let camX   = 200;
let frame  = 0;
let lastTick = Date.now();
let logLines = [];

// ── XP SYSTEM ──────────────────────────────────────────────
// RuneScape XP formula: xp to reach level L = floor(sum(i=1..L-1, floor(i + 300*2^(i/7))) / 4)
const XP_TABLE = [0]; // index = level, value = xp needed to reach it
(function buildXPTable(){
  for(let lvl=2; lvl<=99; lvl++){
    let s=0;
    for(let i=1;i<lvl;i++) s+=Math.floor(i+300*Math.pow(2,i/7));
    XP_TABLE[lvl]=Math.floor(s/4);
  }
})();

function levelFromXP(xp){
  let l=1;
  for(let i=99;i>=2;i--){ if(xp>=XP_TABLE[i]){l=i;break;} }
  return l;
}
function xpProgress(sk){
  if(sk.level>=99) return 1;
  const lo=XP_TABLE[sk.level], hi=XP_TABLE[sk.level+1];
  return (sk.xp-lo)/(hi-lo);
}
function xpToNext(sk){
  if(sk.level>=99) return 0;
  return XP_TABLE[sk.level+1]-sk.xp;
}

// Skills definition
const SKILLS = {
  strength:  {name:'Strength',  emoji:'💪', color:'#ff4422', xp:0, level:1, action:'lift'     },
  cooking:   {name:'Cooking',   emoji:'🍳', color:'#ff9922', xp:0, level:1, action:'cook'     },
  intellect: {name:'Intellect', emoji:'📖', color:'#4488ff', xp:0, level:1, action:'read'     },
  charisma:  {name:'Charisma',  emoji:'💬', color:'#dd44bb', xp:0, level:1, action:'chat'     },
  agility:   {name:'Agility',   emoji:'🏃', color:'#44ddaa', xp:0, level:1, action:'walk'     },
  dancing:   {name:'Dancing',   emoji:'🕺', color:'#bb44ff', xp:0, level:1, action:'dance'    },
  studying:  {name:'Studying',  emoji:'💻', color:'#44aaff', xp:0, level:1, action:'study'    },
  hustle:    {name:'Hustle',    emoji:'🛒', color:'#44cc44', xp:0, level:1, action:'shop'     },
  fishing:   {name:'Fishing',   emoji:'🎣', color:'#22bbcc', xp:0, level:1, action:'fish'     },
  zen:       {name:'Zen',       emoji:'🧘', color:'#aaddff', xp:0, level:1, action:'meditate' },
  creativity:{name:'Creativity',emoji:'🎨', color:'#ff88cc', xp:0, level:1, action:'paint'    },
  endurance: {name:'Endurance', emoji:'🏃', color:'#ffaa22', xp:0, level:1, action:'run'      },
  social:    {name:'Social',    emoji:'📱', color:'#66ffcc', xp:0, level:1, action:'phone'    },
  crafting:  {name:'Crafting',  emoji:'⚒', color:'#cc8844', xp:0, level:1, action:'craft'    },
};

// ── MONEY ──────────────────────────────────────────────────
let playerMoney = 0;

function addMoney(n) {
  playerMoney += Math.floor(n);
  updateMoneyDisplay();
}
function spendMoney(n) {
  if (playerMoney < n) return false;
  playerMoney -= n;
  updateMoneyDisplay();
  return true;
}
function updateMoneyDisplay() {
  const el = document.getElementById('moneyDisplay');
  if (el) el.textContent = `$${playerMoney}`;
}

// XP per active frame (at ~30fps ticks → per second ≈ value*30)
const XP_RATES = {
  lift:     5,
  cook:     2.5,
  read:     1.5,
  study:    3,
  dance:    2,
  shop:     1.5,
  walk:     0.6,
  meditate: 2,
  paint:    2.5,
  run:      3,
  phone:    1.5,
  pushups:  4,
  journal:  2,
  fish:     2.2,
  bartend:  2.2,
};
const ACTION_TO_SKILL = {
  lift:'strength', cook:'cooking', read:'intellect',
  study:'studying', dance:'dancing', shop:'hustle',
  meditate:'zen', paint:'creativity', run:'endurance',
  phone:'social', pushups:'strength', journal:'intellect',
  fish:'fishing', bartend:'charisma',
};

// Level-up side effects
function onLevelUp(skillKey, level){
  const sk=SKILLS[skillKey];
  const lines={
    strength:  [`arms getting bigger.`,`i can feel the difference.`,`getting stronger.`],
    cooking:   [`this is starting to taste good.`,`actually decent at this now.`,`chef mode.`],
    intellect: [`i understand more now.`,`reading faster.`,`my brain works better.`],
    charisma:  [`people seem to like me more.`,`i'm better at this.`,`words come easier.`],
    agility:   [`i move faster now.`,`less tired walking.`,`more agile.`],
    dancing:   [`i can feel the rhythm.`,`actually dancing now.`,`they're watching me.`],
    studying:  [`things make more sense.`,`getting sharper.`,`i know stuff now.`],
    hustle:    [`better deals.`,`i know what i want.`,`efficient.`],
    fishing:   [`pulled a big one.`,`the patience is paying off.`,`actually good at this now.`],
    zen:       [`quieter inside.`,`easier to breathe.`,`the noise fades.`],
    creativity:[`seeing more color.`,`the brush knows.`,`something's clicking.`],
    endurance: [`lungs getting bigger.`,`further than last time.`,`built different.`],
    social:    [`less awkward now.`,`conversations feel easier.`,`people text back.`],
  };
  // Stat bonuses
  if(skillKey==='strength')  shiftMood(6);
  if(skillKey==='cooking')   mood.energy=Math.min(100,mood.energy+12);
  if(skillKey==='intellect') mood.curiosity=Math.min(100,mood.curiosity+8);
  if(skillKey==='charisma')  shiftMood(4);
  if(skillKey==='dancing')   shiftMood(8);
  if(skillKey==='studying')  mood.curiosity=Math.min(100,mood.curiosity+6);
  if(skillKey==='agility')   mood.energy=Math.min(100,mood.energy+6);
  if(skillKey==='zen')       shiftMood(10);
  if(skillKey==='creativity')shiftMood(7);
  if(skillKey==='endurance') mood.energy=Math.min(100,mood.energy+10);
  if(skillKey==='social')    shiftMood(5);
}

// XP gain with level-up check and floating popup
let lvlQueue=[], lvlBusy=false;
function gainXP(skillKey, amount, forcePopup=false){
  const sk=SKILLS[skillKey];
  if(!sk||sk.level>=99) return;
  // Tiny bonus for higher level (prestige feel)
  sk.xp+=amount*(1+sk.level*0.005);
  const newLvl=levelFromXP(sk.xp);
  if(newLvl>sk.level){
    sk.level=newLvl;
    lvlQueue.push({skillKey,level:newLvl});
    if(!lvlBusy) drainLvlQueue();
  }
  // XP float popup (throttled for passive ticks, always shown for one-off actions)
  if(forcePopup || frame%60===0) spawnXPPop(skillKey, amount);
  if(xpOpen) renderSkillRows();
}

function drainLvlQueue(){
  if(!lvlQueue.length){lvlBusy=false;return;}
  lvlBusy=true;
  const {skillKey,level}=lvlQueue.shift();
  const sk=SKILLS[skillKey];
  document.getElementById('toastSkill').textContent=`${sk.emoji} ${sk.name.toUpperCase()}`;
  document.getElementById('toastSkill').style.color=sk.color;
  document.getElementById('toastNum').textContent=level;
  document.getElementById('toastNum').style.color=sk.color;
  document.getElementById('lvlToast').style.borderColor=sk.color;
  document.getElementById('lvlToast').classList.add('show');
  onLevelUp(skillKey,level);
  // Live-refresh craft panel when crafting levels up (success% changes)
  if (skillKey === 'crafting'
      && typeof renderCraftList === 'function'
      && typeof craftOpen !== 'undefined' && craftOpen) {
    renderCraftList();
  }
  addLog(`🎉 ${sk.emoji} ${sk.name} → Lv.${level}`);
  // Fire proactive reaction for milestones (5, 10, 25, 50, 99) or 30% of normal levels
  const isMilestone = [5,10,15,20,25,50,75,99].includes(level);
  if (typeof pixelReact === 'function') {
    if (isMilestone) {
      setTimeout(() => pixelReact('skillMilestone', { skill: sk.name, level }), 3500);
    } else if (Math.random() < 0.30) {
      setTimeout(() => pixelReact('levelUp', { skill: sk.name, level }), 3500);
    }
  }
  setTimeout(()=>{
    document.getElementById('lvlToast').classList.remove('show');
    setTimeout(drainLvlQueue,500);
  },3200);
}

// Floating XP text above character — slotted so they never overlap
const xpPopSlots = {}; // skillKey → slot index
let xpPopCount = 0;

function spawnXPPop(skillKey, amount){
  const sk = SKILLS[skillKey];
  const vx = char.wx - camX;
  const vy = char.wy - 52;
  const el = document.createElement('div');
  el.className = 'xpPop';
  el.textContent = `+${Math.ceil(amount)} ${sk.name.slice(0,3).toUpperCase()}`;
  el.style.color = sk.color;
  // Each skill gets its own horizontal lane to prevent overlap
  const laneX = {
    strength:0, cooking:1, intellect:2, charisma:3,
    agility:4, dancing:5, studying:6, hustle:7
  };
  const lane = laneX[skillKey] ?? 0;
  // Spread horizontally in lanes — 4 per row, 2 rows
  const col = lane % 4;
  const row = Math.floor(lane / 4);
  el.style.left = (vx - 30 + col * 22) + 'px';
  el.style.top  = (vy - 18 - row * 16) + 'px';
  document.getElementById('world').appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

// Tick XP based on current action (called in game loop)
let xpTickCounter=0;
function tickXP(){
  xpTickCounter++;
  if(xpTickCounter%3!==0) return; // run every 3 frames
  if(char.asleep) return;
  if(char.moving){
    gainXP('agility', XP_RATES.walk);
    return;
  }
  const skillKey=ACTION_TO_SKILL[char.action];
  if(skillKey) gainXP(skillKey, XP_RATES[char.action]||1);
}

// Charisma XP on conversation
function gainCharismaXP(){ gainXP('charisma', 25+Math.random()*20); }

// ── SKILL PANEL UI ─────────────────────────────────────────
function renderSkillRows(){
  const container=document.getElementById('skillRows');
  container.innerHTML=Object.entries(SKILLS).map(([key,sk])=>{
    const pct=Math.round(xpProgress(sk)*100);
    const toNext=sk.level<99?Math.ceil(xpToNext(sk)).toLocaleString():'MAX';
    return `<div class="skill-row">
      <div class="skill-emoji">${sk.emoji}</div>
      <div class="skill-info">
        <div class="skill-name">${sk.name.toUpperCase()}</div>
        <div class="skill-bar-wrap">
          <div class="skill-bar-fill" style="width:${pct}%;background:${sk.color}"></div>
        </div>
        <div class="skill-xp">${Math.floor(sk.xp).toLocaleString()} xp · ${toNext} to next</div>
      </div>
      <div class="skill-level">${sk.level}<small>/ 99</small></div>
    </div>`;
  }).join('');

  // totals
  const totalXP=Object.values(SKILLS).reduce((a,s)=>a+s.xp,0);
  const totalLvl=Object.values(SKILLS).reduce((a,s)=>a+s.level,0);
  document.getElementById('xpTotals').innerHTML=
    `Total level: <b>${totalLvl}</b> / 1386<br>Total XP: <b>${Math.floor(totalXP).toLocaleString()}</b>`;
}

// XP Panel toggle
let xpOpen = false;
document.getElementById('xpBtn').addEventListener('click',()=>{
  xpOpen = !xpOpen;
  document.getElementById('xpPanel').classList.toggle('open', xpOpen);
  document.getElementById('xpBtn').textContent = xpOpen ? '✕' : '⚔';
  if (xpOpen) renderSkillRows();
});
document.getElementById('xpClose').addEventListener('click',()=>{
  xpOpen = false;
  document.getElementById('xpPanel').classList.remove('open');
  document.getElementById('xpBtn').textContent = '⚔';
});

// ── CANVAS SETUP ───────────────────────────────────────────
const worldCanvas = document.getElementById('worldCanvas');
const wctx = worldCanvas.getContext('2d');
worldCanvas.width  = WW;
worldCanvas.height = WH;

const charCanvas = document.getElementById('charCanvas');
const cctx = charCanvas.getContext('2d');

// ── MOOD ───────────────────────────────────────────────────
const MOODS = [
  {lo:-100,hi:-60,name:'Miserable',emoji:'😭',col:'#5566ff'},
  {lo:-60, hi:-30,name:'Sad',      emoji:'😔',col:'#7788ff'},
  {lo:-30, hi:-10,name:'Meh',      emoji:'😕',col:'#999999'},
  {lo:-10, hi:10, name:'Neutral',  emoji:'😐',col:'#aaaaaa'},
  {lo:10,  hi:35, name:'Content',  emoji:'🙂',col:'#88cc88'},
  {lo:35,  hi:60, name:'Happy',    emoji:'😊',col:'#55dd55'},
  {lo:60,  hi:80, name:'Cheerful', emoji:'😄',col:'#33ee33'},
  {lo:80,  hi:101,name:'Elated',   emoji:'🤩',col:'#ffdd00'},
];
function getMood() { return MOODS.find(m=>mood.v>=m.lo&&mood.v<m.hi)||MOODS[3]; }
function shiftMood(d) { mood.v = Math.max(-100,Math.min(100,mood.v+d)); }

// ── TIME ───────────────────────────────────────────────────
function tod() {
  const h=gt.h;
  if(h>=6&&h<9)  return {icon:'🌅',phase:'morning'};
  if(h>=9&&h<18) return {icon:'☀️', phase:'day'};
  if(h>=18&&h<21)return {icon:'🌆',phase:'evening'};
  return               {icon:'🌙',phase:'night'};
}

// ── LOG ────────────────────────────────────────────────────
function addLog(msg) {
  logLines.push(msg);
  if(logLines.length>5) logLines.shift();
  document.getElementById('log').innerHTML = logLines.map(l=>{
    const isLvl = l.includes('→ Lv') || l.includes('🎉');
    const col = isLvl ? 'rgba(255,200,50,0.7)' : 'rgba(255,255,255,0.3)';
    return `<div style="color:${col}">${l}</div>`;
  }).join('');
}

