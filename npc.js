// ── NEEDS  (per-real-second rates) ──────────────────────────
const NEEDS = {
  hunger:  { v: 8,  rate:  0.45, label: 'hunger'  }, // 0=full, 100=starving
  fatigue: { v: 12, rate:  0.28, label: 'fatigue'  }, // 0=rested, 100=exhausted
  boredom: { v: 15, rate:  0.12, label: 'boredom'  }, // rises slowly always
  fitness: { v: 68, rate: -0.07, label: 'fitness'  }, // 100=peak, drops unless exercised
  social:  { v: 60, rate: -0.06, label: 'social'   }, // 100=connected, drops over time
};

// ── PERSONALITY TRAITS (fixed at birth, shape preferences) ──
// Each 0–100. Rolled once, persist across sessions.
const TRAITS = {
  introversion:  55,  // high = recharges alone; low = social butterfly
  discipline:    62,  // high = follows routines; low = impulsive
  curiosity:     78,  // high = reads/studies more
  creativity:    70,  // high = paints/writes more
  athleticism:   58,  // high = exercises more often
};

// ── EMOTIONAL STATE (the "soul" layer) ──────────────────────
// Pixel cycles through emotional arcs that colour behaviour.
// An arc lasts 3–8 real minutes then organically transitions.
const EMOTIONAL_ARCS = [
  { id:'content',    label:'content',    moodBias:+8,  nextArcs:['restless','focused','content'],        thoughts:['not bad.','this is okay.','comfortable.','yeah.'] },
  { id:'restless',   label:'restless',   moodBias:-4,  nextArcs:['content','impulsive','melancholy'],     thoughts:['need to do something.','can\'t sit still.','something\'s off.','antsy.'] },
  { id:'focused',    label:'focused',    moodBias:+5,  nextArcs:['content','tired'],                     thoughts:['in the zone.','getting things done.','sharp today.','locked in.'] },
  { id:'melancholy', label:'melancholy', moodBias:-12, nextArcs:['content','reflective','restless'],     thoughts:['...',  'hard to explain.','just feeling it.','quiet kind of sad.'] },
  { id:'reflective', label:'reflective', moodBias:-2,  nextArcs:['content','focused','melancholy'],     thoughts:['thinking about things.','time is weird.','what am i doing, really.','lot on my mind.'] },
  { id:'impulsive',  label:'impulsive',  moodBias:+2,  nextArcs:['content','restless','tired'],         thoughts:['just gonna do it.','why not.','screw the plan.','spontaneous.'] },
  { id:'tired',      label:'tired',      moodBias:-6,  nextArcs:['content','melancholy'],               thoughts:['exhausted.','need rest.','running on empty.','drained.'] },
  { id:'energised',  label:'energised',  moodBias:+15, nextArcs:['content','focused','impulsive'],      thoughts:['feeling good.','could do anything today.','let\'s go.','good energy.'] },
];

let currentArc     = EMOTIONAL_ARCS[0]; // starts content
let arcTimer       = 0;  // seconds until arc transitions
let arcElapsed     = 0;  // seconds spent in current arc

function tickArc(elapsed) {
  arcElapsed += elapsed;
  arcTimer   -= elapsed;
  if (arcTimer > 0) return;

  // Choose next arc — weighted toward arcs listed in nextArcs
  const pool = currentArc.nextArcs;
  const nextId = pool[Math.floor(Math.random() * pool.length)];
  const next = EMOTIONAL_ARCS.find(a => a.id === nextId) || EMOTIONAL_ARCS[0];

  // Needs influence which arc we land in
  if (NEEDS.fatigue.v > 70 && next.id !== 'tired')
    currentArc = EMOTIONAL_ARCS.find(a => a.id === 'tired');
  else if (NEEDS.boredom.v > 75 && Math.random() < 0.5)
    currentArc = EMOTIONAL_ARCS.find(a => a.id === 'restless');
  else if (mood.v > 55 && Math.random() < 0.4)
    currentArc = EMOTIONAL_ARCS.find(a => a.id === 'energised');
  else
    currentArc = next;

  arcTimer   = 180 + Math.random() * 300; // 3–8 real minutes per arc
  arcElapsed = 0;

  // Arc shift nudges mood
  shiftMood(currentArc.moodBias * 0.5);
  addLog(`✨ ${currentArc.label}`);
}

// ── WHAT EACH ACTIVITY DOES TO NEEDS (per completed session) ─
const SESSION_SATISFACTION = {
  cook:     { hunger: -65 },
  shop:     { hunger: -30, social: +12 },
  lift:     { fitness: +32, boredom: -18 },
  pushups:  { fitness: +16, boredom: -10 },
  sleep:    { fatigue: -75 },
  study:    { boredom: -28 },
  read:     { boredom: -22 },
  dance:    { social: +40, boredom: -30 },
  idle:     { boredom: +5 },  // idling makes boredom worse over time
  meditate: { fatigue: -18, boredom: -22 },
  paint:    { boredom: -38 },
  run:      { fitness: +22, boredom: -14 },
  phone:    { social: +32 },
  journal:  { boredom: -20 },
  fish:     { boredom: -28, fatigue: -12 },
  bartend:  { social: +28, boredom: -18 },
};

// Slow per-second trickle while doing activity
const ACTIVITY_TRICKLE = {
  cook:     { hunger: -3.5 },
  sleep:    { fatigue: -4.5 },
  lift:     { fatigue: +0.35, boredom: -1.2 },  // was 0.8 — was burning him out too fast
  pushups:  { fatigue: +0.25, boredom: -0.8 },
  study:    { boredom: -1.2 },
  read:     { boredom: -0.9 },
  dance:    { social: +1.8, boredom: -1.8 },
  shop:     { hunger: -1.5, social: +0.8 },
  idle:     {},
  meditate: { fatigue: -1.2, boredom: -1.5 },
  paint:    { boredom: -2.0 },
  run:      { fitness: +1.2, fatigue: +0.4 },
  phone:    { social: +1.8 },
  journal:  { boredom: -1.2 },
  fish:     { boredom: -1.8, fatigue: -0.7 },
  bartend:  { social: +1.4, boredom: -1.2 },
};

// ── HABITUAL ROUTINE ──────────────────────────────────────────
// Not rules — gentle nudges toward realistic daily patterns.
// Scored additively alongside needs so urgent needs always win.
const ROUTINE_SCORE = (action, h) => {
  let s = 0;
  if (action === 'sleep')    { s += (h >= 23||h<5) ? 60 : (h<7) ? 22 : -200; }
  if (action === 'cook')     { s += (h>=7&&h<=8)?28:(h>=12&&h<=14)?22:(h>=18&&h<=20)?28:0; }
  if (action === 'lift')     { s += (h>=6&&h<=12) ? 18 : (h>=16&&h<=18) ? 10 : 0; }
  if (action === 'pushups')  { s += (h>=7&&h<=10) ? 12 : 0; }
  if (action === 'run')      { s += (h>=6&&h<=9) ? 18 : (h>=17&&h<=19) ? 12 : 0; }
  if (action === 'meditate') { s += (h>=6&&h<=9) ? 16 : (h>=21) ? 12 : 0; }
  if (action === 'journal')  { s += (h>=21||h<=8) ? 14 : 0; }
  if (action === 'read')     { s += (h>=20||h<=8) ? 12 : 0; }
  if (action === 'study')    { s += (h>=9&&h<=14) ? 12 : (h>=19&&h<=22) ? 10 : 0; }
  if (action === 'shop')     { s += (h>=9&&h<=18) ? 10 : (h<7||h>21) ? -70 : 0; }
  if (action === 'dance')    { s += (h>=22||h===0) ? 38 : (h>=20) ? 14 : (h<18) ? -100 : 0; }
  if (action === 'bartend')  { s += (h>=19&&h<=23) ? 24 : 0; }
  if (action === 'fish')     { s += (h>=7&&h<=16) ? 12 : 0; }
  if (action === 'phone')    { s += (h>=10&&h<=22) ? 6 : 0; }
  if (action === 'paint')    { s += (h>=10&&h<=22) ? 8 : 0; }
  return s;
};

// ── LOCATION ACTIONS ──────────────────────────────────────────
const LOC_ACTIONS = {
  // DO NOT add 'docks' or 'mines' here — they are separate canvas scenes.
  // They can only be entered via the map. Listing them here causes the AI
  // to call travelTo('mines') which sets char.loc='mines' while Pixel is
  // physically standing in the apartment, breaking the HUD permanently.
  apartment: ['cook', 'sleep', 'study', 'read', 'idle', 'meditate', 'paint', 'phone', 'journal'],
  street:    ['idle', 'run', 'phone'],
  nightclub: ['dance', 'bartend'],
  library:   ['read', 'study', 'idle'],
  bazaar:    ['shop', 'idle'],
};

// ── TASK DURATIONS (real seconds) ─────────────────────────────
const TASK_DURATION = {
  cook:     { min: 80,  max: 130 },
  shop:     { min: 55,  max: 85  },
  lift:     { min: 80,  max: 140 },  // was 140-280 — was way too long
  pushups:  { min: 40,  max: 80  },
  sleep:    { min: 280, max: 540 },
  study:    { min: 100, max: 180 },
  read:     { min: 80,  max: 150 },
  dance:    { min: 100, max: 220 },
  idle:     { min: 25,  max: 55  },
  meditate: { min: 70,  max: 140 },
  paint:    { min: 100, max: 200 },
  run:      { min: 70,  max: 130 },
  phone:    { min: 45,  max: 90  },
  journal:  { min: 60,  max: 120 },
  fish:     { min: 110, max: 220 },
  bartend:  { min: 100, max: 190 },
};

// ── COOLDOWN — how long before repeating an activity (seconds) ─
// Prevents immediately looping the same task
const COOLDOWN = {
  cook: 420, shop: 600, lift: 500, pushups: 360, sleep: 900,
  study: 400, read: 300, dance: 500, idle: 120, meditate: 360,
  paint: 440, run: 420, phone: 300, journal: 440, fish: 500, bartend: 420,
};

let decisionTimer    = 0;
let committedAction  = null;
let lastDecisionLog  = '';
let lastNeedSecond   = 0;
const lastDid        = {};  // action → timestamp of last completion

function tickNeeds() {
  const now = Date.now();
  if (now - lastNeedSecond < 1000) return;
  const elapsed = Math.min((now - lastNeedSecond) / 1000, 3); // cap at 3s to avoid tab-return spikes
  lastNeedSecond = now;

  // Base decay / growth
  Object.values(NEEDS).forEach(n => {
    n.v = Math.max(0, Math.min(100, n.v + n.rate * elapsed));
  });

  // Night accelerates fatigue
  if (gt.h >= 23 || gt.h < 6)
    NEEDS.fatigue.v = Math.min(100, NEEDS.fatigue.v + 0.4 * elapsed);

  // Active trickle from current task
  const trickle = ACTIVITY_TRICKLE[char.action];
  if (trickle && !char.moving) {
    Object.entries(trickle).forEach(([k, v]) => {
      if (NEEDS[k] !== undefined)
        NEEDS[k].v = Math.max(0, Math.min(100, NEEDS[k].v + v * elapsed));
    });
  }

  // Idle sitting builds restlessness
  if (char.action === 'idle' && !char.moving)
    NEEDS.boredom.v = Math.min(100, NEEDS.boredom.v + 0.18 * elapsed);

  mood.energy = Math.max(0, 100 - NEEDS.fatigue.v);
  decisionTimer = Math.max(0, decisionTimer - elapsed);

  tickArc(elapsed);
}

function pickBestAction() {
  const h   = gt.h;
  const now = Date.now();
  const candidates = [];

  Object.entries(LOC_ACTIONS).forEach(([loc, actions]) => {
    actions.forEach(action => {
      let score = 0;
      const sat = SESSION_SATISFACTION[action] || {};

      // ── 1. BODY NEEDS ─────────────────────────────────────
      if (sat.hunger  < 0 && NEEDS.hunger.v  > 42) score += NEEDS.hunger.v  * 1.6;
      if (sat.fatigue < 0 && NEEDS.fatigue.v > 48) score += NEEDS.fatigue.v * 1.6;
      if (sat.boredom < 0 && NEEDS.boredom.v > 55) score += NEEDS.boredom.v * 0.9;
      if (sat.fitness > 0 && NEEDS.fitness.v < 42)  score += (100-NEEDS.fitness.v) * 1.1;
      if (sat.social  > 0 && NEEDS.social.v  < 38)  score += (100-NEEDS.social.v)  * 0.9;

      // ── 2. ROUTINE / TIME-OF-DAY ──────────────────────────
      score += ROUTINE_SCORE(action, h);

      // ── 3. PERSONALITY MODIFIERS ──────────────────────────
      const soloActs  = ['read','study','meditate','paint','journal','fish','cook'];
      const socialActs = ['dance','bartend','phone','shop'];
      if (soloActs.includes(action))   score += (TRAITS.introversion - 50) * 0.25;
      if (socialActs.includes(action)) score += (50 - TRAITS.introversion) * 0.25;
      if (action !== 'idle')           score += (TRAITS.discipline - 50) * 0.08;
      if (['read','study'].includes(action))    score += (TRAITS.curiosity - 50) * 0.3;
      if (['paint','journal'].includes(action)) score += (TRAITS.creativity - 50) * 0.3;
      if (['lift','run','pushups'].includes(action)) score += (TRAITS.athleticism - 50) * 0.3;

      // ── 3b. SKILL VARIETY BONUS ───────────────────────────
      // Skills that haven't been trained recently get a stacking urgency bonus
      // This ensures ALL skills eventually get used, not just top-scorers
      const skillForAction = {
        study:'studying', paint:'creativity', run:'endurance', phone:'social',
        dance:'dancing', read:'intellect', fish:'fishing', journal:'intellect',
        lift:'strength', cook:'cooking', meditate:'zen', shop:'hustle',
        pushups:'strength', bartend:'charisma',
      };
      const sk = skillForAction[action];
      if (sk && SKILLS[sk]) {
        // Low-level skills haven't been done much — boost them
        const lvl = SKILLS[sk].level;
        if (lvl <= 3)  score += 22;   // big boost for untrained skills
        else if (lvl <= 8)  score += 12;
        else if (lvl <= 15) score += 5;
      }

      // ── 3c. GYM FATIGUE GUARD ─────────────────────────────
      // Pixel should not keep lifting when exhausted
      if (['lift','pushups','run'].includes(action)) {
        if (NEEDS.fatigue.v > 70) score -= (NEEDS.fatigue.v - 70) * 3.5; // heavy penalty
        if (NEEDS.fatigue.v > 85) score -= 150; // near-critical: hard block
      }

      // ── 4. EMOTIONAL ARC ──────────────────────────────────
      // Current emotional arc amplifies or dampens activities
      if (currentArc.id === 'restless') {
        // Restless = wants movement or novelty
        if (['run','dance','shop','lift'].includes(action)) score += 20;
        if (action === 'idle') score -= 18;
      }
      if (currentArc.id === 'focused') {
        // Focused = productive tasks
        if (['study','read','paint','journal'].includes(action)) score += 22;
      }
      if (currentArc.id === 'melancholy') {
        // Melancholy = solo, introspective
        if (['read','meditate','fish','journal'].includes(action)) score += 18;
        if (socialActs.includes(action)) score -= 15;
      }
      if (currentArc.id === 'energised') {
        // Energised = physical, social
        if (['lift','run','dance','pushups'].includes(action)) score += 25;
      }
      if (currentArc.id === 'impulsive') {
        // Impulsive = does something different, slight chaos
        if (action !== committedAction && loc !== char.loc) score += 12;
      }
      if (currentArc.id === 'tired') {
        if (['sleep','meditate','read'].includes(action)) score += 20;
        if (['lift','run','dance'].includes(action)) score -= 20;
      }
      if (currentArc.id === 'reflective') {
        if (['journal','read','fish','meditate'].includes(action)) score += 18;
      }

      // ── 5. MOOD ───────────────────────────────────────────
      if (mood.v < -20 && ['read','meditate','fish'].some(a=>a===action||loc===a)) score += 18;
      if (mood.v > 50  && loc === 'nightclub') score += 14;
      if (mood.v < -40 && action === 'journal') score += 16;

      // ── 6. COOLDOWN — hard block on recently done tasks ───
      const secsSince = (now - (lastDid[action] || 0)) / 1000;
      const cd = COOLDOWN[action] || 300;
      if (secsSince < cd) {
        // Penalty fades from -140 → 0 over cooldown window
        score -= 140 * Math.max(0, 1 - secsSince / cd);
      }

      // ── 7. COMMITMENT — locked in until timer expires ─────
      if (committedAction !== null && action !== committedAction) {
        score -= 120;  // very hard to break commitment
      }
      if (action === committedAction && loc === char.loc) score += 50;

      // ── 8. LOCATION COST ──────────────────────────────────
      // Small cost to travel — Pixel doesn't hop locations for weak reasons
      if (loc !== char.loc) score -= 8;

      // ── 9. MICRO-RANDOMNESS (biological noise) ────────────
      score += (Math.random() * 5) - 2.5;

      candidates.push({ loc, action, score });
    });
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

// Pixel's inner monologue — arc-aware
function decisionThought(action) {
  // First check if arc has a strong opinion
  if (currentArc.thoughts && Math.random() < 0.35)
    return currentArc.thoughts[Math.floor(Math.random()*currentArc.thoughts.length)];

  const lines = {
    lift:     ['body needs this.','gym time.','skipping isn\'t happening.','need to be stronger.'],
    cook:     ['actually hungry.','need food.','haven\'t eaten right.','should eat something.'],
    sleep:    ['exhausted.','need sleep.','that\'s enough.','eyes aren\'t working.'],
    study:    ['want to learn this.','brain needs work.','got curious.','time to focus.'],
    read:     ['good book waiting.','quiet time.','just want to read.','need to slow down.'],
    dance:    ['need to go out.','the music is calling.','want to move.','club tonight.'],
    shop:     ['fridge is empty.','need to restock.','quick run.','out of food.'],
    idle:     ['nothing right now.','just breathing.','moment to myself.','pause.'],
    meditate: ['head\'s loud.','need to be still.','clearing out.','just breathe.'],
    paint:    ['need to make something.','colors in my head.','feeling it today.','something creative.'],
    run:      ['need to move.','just run it out.','clear my head.','legs want to go.'],
    phone:    ['should check in.','been quiet.','text someone.','feeling distant.'],
    pushups:  ['quick set.','no excuses.','just twenty.','few minutes.'],
    journal:  ['need to write this.','lot in my head.','let it out.','processing.'],
    fish:     ['something peaceful.','just sit and wait.','no pressure today.','quiet.'],
    bartend:  ['cover a shift.','talk to strangers.','make something.','earn it.'],
  };
  const pool = lines[action] || lines.idle;
  return pool[Math.floor(Math.random() * pool.length)];
}

let awaitingDecision = false;

async function makeDecision() {
  if (awaitingDecision || char.moving) return;
  awaitingDecision = true;

  const best = pickBestAction();
  if (!best) { awaitingDecision = false; return; }

  // Already doing the right thing — re-arm
  if (best.loc === char.loc && best.action === char.action) {
    const d = TASK_DURATION[best.action] || { min:60, max:120 };
    decisionTimer = d.min + Math.random() * (d.max - d.min);
    awaitingDecision = false;
    return;
  }

  // Complete previous task: apply satisfaction + cooldown
  if (committedAction) {
    const sat = SESSION_SATISFACTION[committedAction] || {};
    Object.entries(sat).forEach(([k, v]) => {
      if (NEEDS[k] !== undefined) NEEDS[k].v = Math.max(0, Math.min(100, NEEDS[k].v + v));
    });
    lastDid[committedAction] = Date.now();
    committedAction = null;
  }

  showThought(decisionThought(best.action));
  travelTo(best.loc, best.action);
  char.asleep = best.action === 'sleep';
  committedAction = best.action;

  const log = `🧠 ${best.action} @ ${best.loc}`;
  if (log !== lastDecisionLog) { addLog(log); lastDecisionLog = log; }

  const d = TASK_DURATION[best.action] || { min:60, max:120 };
  decisionTimer = d.min + Math.random() * (d.max - d.min);

  awaitingDecision = false;
}

// ── GENUINE EMERGENCIES only (not just pressing needs) ────────
function needsUrgentOverride() {
  if (NEEDS.hunger.v  >= 92 && char.action !== 'cook' && char.action !== 'shop') return true;
  // Stop gym activities much sooner — 80 fatigue is already tired
  if (NEEDS.fatigue.v >= 80 && ['lift','pushups','run'].includes(char.action)) return true;
  if (NEEDS.fatigue.v >= 92 && char.action !== 'sleep') return true;
  if ((gt.h >= 23 || gt.h < 4) && NEEDS.fatigue.v > 75 && char.action !== 'sleep') return true;
  if (gt.h >= 7 && gt.h < 9 && char.action === 'sleep' && NEEDS.fatigue.v < 12) return true;
  return false;
}

function checkFreeWill() {
  tickNeeds();
  if (char.moving) return;

  // Shopping trip owns control until it's done
  if (shopCart.active) return;

  // If shopping just finished (phase==='done'), complete the task now
  if (char.action === 'shop' && shopCart.phase === 'done') {
    shopCart.phase = '';
    // Apply session satisfaction immediately
    const sat = SESSION_SATISFACTION['shop'] || {};
    Object.entries(sat).forEach(([k, v]) => {
      if (NEEDS[k] !== undefined) NEEDS[k].v = Math.max(0, Math.min(100, NEEDS[k].v + v));
    });
    lastDid['shop'] = Date.now();
    committedAction = null;
    decisionTimer   = 0; // pick next task immediately
    return;
  }

  if (decisionTimer > 0 && !needsUrgentOverride()) return;
  makeDecision();
}

// Self-talk: vivid in-the-moment prompts, not generic
const ST = {
  lift:     'You\'re lifting weights, mid-set. One raw thought — about your body, the weight, or something unrelated that crept in. Very short.',
  shop:     'You\'re in a grocery store aisle. Mutter something about what you\'re grabbing or something you just noticed. Keep it real.',
  dance:    'You\'re dancing. One thought about the music, how your body feels, or the people around you.',
  idle:     'You\'re doing nothing right now. One honest, unguarded thought that just surfaced.',
  cook:     'You\'re cooking. Something about the smell, the process, or your mind wandering.',
  read:     'You just read something. React to it in one short sentence — surprise, recognition, boredom, whatever it actually was.',
  study:    'You\'ve been staring at this material. One thought — frustration, curiosity, a realization, spacing out.',
  sleep:    null,
  meditate: 'You\'re trying to be still. One thought you\'re trying to let go of (or can\'t).',
  paint:    'You\'re painting. One honest thought about what\'s on the canvas or in your head.',
  run:      'You\'re running. One physical or mental fragment — something your body or brain is doing right now.',
  phone:    'You\'re on your phone. React to something you just saw, read, or sent.',
  pushups:  'Doing pushups. Count, grunt, or have one thought. Keep it physical and short.',
  journal:  'Writing in your journal. One line from what you\'re actually writing right now.',
  fish:     'Fishing. A long slow thought — about the water, the waiting, something distant.',
  bartend:  'Bartending. React to a customer, a drink you just made, or the noise of the bar.',
};

let stTimer = 200;

async function doSelfTalk() {
  if (char.asleep) { showThought(['zzz...','*snoring*','...mmph...'][Math.floor(Math.random()*3)]); return; }

  // 30% chance: just show an arc thought (fast, no AI needed, feels authentic)
  if (currentArc && Math.random() < 0.30) {
    const t = currentArc.thoughts[Math.floor(Math.random()*currentArc.thoughts.length)];
    showThought(t);
    addChatMsg('pixel', `*${t}*`, true);
    return;
  }

  const prompt = ST[char.action] || ST.idle;
  if (!prompt) return;
  const needCtx = Object.entries(NEEDS).map(([k,n])=>`${k}:${Math.round(n.v)}`).join(' ');
  const arcCtx  = currentArc ? `feeling ${currentArc.label}.` : '';
  const r = await callAI(`[INTERNAL, ${arcCtx} needs: ${needCtx}] ${prompt} 1 sentence. Be in the ${currentArc?.label||'content'} mood naturally.`, true);
  if (r) { showThought(r); shiftMood(0.3); addChatMsg('pixel', `*${r}*`, true); }
}

let wpTimer = 500;
const WP = [
  'A strange or unsettling fact about existence, physics, or time. One sentence, no hedging.',
  'Something you find genuinely beautiful about the world. Not obvious. One sentence.',
  'A thought about what other people are doing right now, somewhere. One sentence.',
  'Something you can\'t stop thinking about lately, without saying why. One sentence.',
  'A question you don\'t have an answer to. Just ask it — don\'t answer it.',
  'Something small that actually matters more than people realize. One sentence.',
];
async function doWorldPonder() {
  const r = await callAI(`[WORLD PONDER] ${WP[Math.floor(Math.random()*WP.length)]}`, true);
  if (r) {
    showThought(r);
    const bad  = ['sad','terrible','awful','horrify','depress','dying','war','suffering'];
    const good = ['beautiful','wonder','amazing','love','joy','fascinat','hope','miraculous'];
    const l = r.toLowerCase();
    shiftMood((good.filter(w=>l.includes(w)).length - bad.filter(w=>l.includes(w)).length) * 4);
    mood.curiosity = Math.min(100, mood.curiosity + 3);
    mood.topics.push(r.slice(0,40));
    if (mood.topics.length > 8) mood.topics.shift();
    addLog(`💭 ${r.slice(0,38)}...`);
  }
}

// ── GAME LOOP ──────────────────────────────────────────────
function loop(){
  frame++;
  const now=Date.now();

  // game clock (1 real sec = 1 game min)
  if(now-lastTick>=1000){
    lastTick=now;
    gt.m++; if(gt.m>=60){gt.m=0;gt.h++;}
    if(gt.h>=24){gt.h=0;gt.d++;}
    const base=15+(mood.curiosity-50)*0.2;
    shiftMood((base-mood.v)*0.008);
    // energy is driven by fatigue need now
    mood.energy = Math.max(0, 100 - NEEDS.fatigue.v);
    if(mood.energy<20) shiftMood(-0.08);
  }

  if(--stTimer<=0){ stTimer=160+Math.floor(Math.random()*120); if(Math.random()<0.14&&!ai.busy) doSelfTalk(); }
  if(--wpTimer<=0){ wpTimer=450+Math.floor(Math.random()*350); if(Math.random()<0.25&&!char.asleep&&!ai.busy) doWorldPonder(); }

  // Skip main world logic when an alternate scene is active
  const altScene = (typeof docksActive    !== 'undefined' && docksActive)    ||
                   (typeof minesActive    !== 'undefined' && minesActive)    ||
                   (typeof downtownActive !== 'undefined' && downtownActive) ||
                   (typeof bossArenaActive !== 'undefined' && bossArenaActive);

  if (!altScene) {
    checkFreeWill();
    updateMove();
    tickShopping();
    tickXP();
    updateCamera();
    if(frame%2===0) drawWorld();
    drawChar();
    // ── MULTIPLAYER: interpolate + draw remote player ────────
    if (typeof mp !== 'undefined' && mp.inRoom) {
      mp.tickInterpolation();
      if (mp.remotePlayer.visible) mpDrawRemotePlayerOverworld();
      // Send local state every 6 frames (~10/s)
      if (frame % 6 === 0) {
        mp.sendPlayerState({
          x: char.wx, y: char.wy,
          facing: char.facing || 1,
          action: char.action,
          hp: (typeof baChar !== 'undefined') ? baChar.hp    : 100,
          maxHp: (typeof baChar !== 'undefined') ? baChar.maxHp : 100,
        });
      }
    }
  }

  tickNeeds();
  if (typeof tickQuests === 'function') tickQuests();
  tickSave();
  tickMusic();
  updateHUD();

  requestAnimationFrame(loop);
}

// ── MULTIPLAYER: draw remote player on world canvas ──────────
function mpDrawRemotePlayerOverworld() {
  const wCanvas = document.getElementById('worldCanvas');
  if (!wCanvas) return;
  const wctx = wCanvas.getContext('2d');
  const rp   = mp.remotePlayer;
  // rp.x/y are world coords; sprite is 32×52, feet at rp.y
  const rx = Math.round(rp.x) - 16;
  const ry = Math.round(rp.y) - 52;
  const face = rp.facing;

  // Shadow
  wctx.fillStyle = 'rgba(0,0,0,0.22)';
  wctx.beginPath();
  wctx.ellipse(rx + 16, ry + 52, 9, 3, 0, 0, Math.PI * 2);
  wctx.fill();

  // Body (teal-blue hoodie — visually distinct from local player)
  wctx.fillStyle = '#226688';
  wctx.fillRect(rx + 2, ry + 16, 28, 24);

  // Head (skin)
  wctx.fillStyle = '#c8a070';
  wctx.fillRect(rx + 4, ry + 4, 24, 14);

  // Hair (purple — distinct colour)
  wctx.fillStyle = '#7744aa';
  wctx.fillRect(rx + 4, ry + 4, 24, 4);

  // Eye
  wctx.fillStyle = '#ffffff';
  const eyeX = face === 1 ? rx + 22 : rx + 6;
  wctx.fillRect(eyeX, ry + 12, 4, 3);

  // Pants
  wctx.fillStyle = '#112244';
  wctx.fillRect(rx + 4,  ry + 38, 10, 14);
  wctx.fillRect(rx + 18, ry + 38, 10, 14);

  // Name tag
  wctx.fillStyle = 'rgba(0,15,30,0.72)';
  wctx.fillRect(rx + 2, ry - 15, 28, 13);
  wctx.fillStyle = '#88ddff';
  wctx.font = 'bold 9px monospace';
  wctx.textAlign = 'center';
  wctx.fillText('P2', rx + 16, ry - 5);
  wctx.textAlign = 'left';
}

// ── SAVE / LOAD SYSTEM ─────────────────────────────────────
// Uses localStorage for persistence inside Lively's sandboxed Chromium.
// Up to 5 rotating backup slots, saved every hour.
// Supports 3 save slots — currentSlot set by title screen on load/new.
let currentSlot = 1;
function getSaveKey()   { return `pixel_save_slot${currentSlot}`; }
function getBackupKey() { return `pixel_backup_slot${currentSlot}`; }
