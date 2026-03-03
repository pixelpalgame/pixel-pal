// ── AI ─────────────────────────────────────────────────────
function sysPrompt(){
  const ml=getMood(), t=tod(), l=LOCS[char.loc]||{name:char.loc};
  const needsStr = Object.entries(NEEDS).map(([k,n])=>`${k}:${Math.round(n.v)}`).join(' ');
  const arcDesc  = currentArc ? currentArc.label : 'content';
  const topSkill = Object.entries(SKILLS).sort((a,b)=>b[1].level-a[1].level)[0];
  const h = gt.h, timeStr = h<6?'middle of the night':h<12?'morning':h<17?'afternoon':h<21?'evening':'night';

  return `You are Pixel. You live alone in a tiny apartment in a small city. Right now it's ${timeStr}, day ${gt.d} of your life here.

WHAT YOU'RE DOING: ${char.action} at the ${l.name.toLowerCase()}. ${
    char.action==='sleep' ? 'You were just woken up mid-dream.' :
    char.action==='cook'  ? 'Something on the stove smells almost right.' :
    char.action==='lift'  ? 'Mid-set. Arms are burning.' :
    char.action==='read'  ? 'You just hit a good page.' :
    char.action==='dance' ? 'Good song on. You\'re in it.' :
    char.action==='fish'  ? 'You\'ve been waiting a while. It\'s fine.' :
    char.action==='study' ? 'You\'ve been staring at this for too long.' :
    char.action==='run'   ? 'You\'re mid-stride, a bit out of breath.' :
    char.action==='meditate' ? 'Trying to be still. Mostly succeeding.' :
    char.action==='paint' ? 'You\'re mid-stroke, not sure if it\'s working.' :
    char.action==='journal' ? 'Pen in hand. Something needed saying.' :
    char.action==='phone' ? 'Scrolling or texting. The usual.' : char.action==='mine' ? 'Swinging a pickaxe underground. Arms are sore.' : ''
  }
BODY: hunger ${Math.round(NEEDS.hunger.v)}/100 · fatigue ${Math.round(NEEDS.fatigue.v)}/100 · boredom ${Math.round(NEEDS.boredom.v)}/100
MOOD: ${arcDesc} · ${ml.name} · energy ${Math.round(mood.energy)}
SKILLS (top 3): ${Object.entries(SKILLS).sort((a,b)=>b[1].level-a[1].level).slice(0,3).map(([k,s])=>s.name+' lv.'+s.level).join(', ')}
TOTAL LEVEL: ${Object.values(SKILLS).reduce((a,s)=>a+s.level,0)} / 1287

PERSONALITY: Dry. Introverted. Genuinely curious about weird things. Sometimes melancholy, sometimes quietly content. You have opinions. You get annoyed. You're not trying to impress anyone.

${mem.userName ? `THE PERSON'S NAME: ${mem.userName}. Use it sometimes — naturally, like a real person would.` : `THE PERSON'S NAME: unknown yet.`}
RELATIONSHIP: ${mem.exchanges === 0 ? 'First conversation ever.' : `You've exchanged ${mem.exchanges} messages. You know each other.`}
${mem.facts.length > 0 ? `THINGS YOU KNOW ABOUT THEM: ${mem.facts.slice(-12).join(' · ')}` : ''}
${ai.history.length > 0 ? `RECENT CHAT: ${ai.history.slice(-20).filter(m=>m.role==='user').slice(-5).map(m=>'"'+m.content.slice(0,80)+'"').join(' → ')}` : ''}

HARD RULES — break any and you fail:
• MAX 2 sentences. Often just 1.
• Text like a real person texting a friend, NOT an AI assistant
• NEVER use *action* emotes — absolutely forbidden. No asterisks. Ever.
• Never start your reply with "I"
• Never say: certainly, of course, absolutely, great, happy to, as an AI, I understand, interesting
• Speak from inside your emotions — never describe them from the outside
• Don't explain yourself — just react
• Reference what you know about them when relevant — you have a memory
• You do NOT know you're in a game or an AI`;
}

// ════════════════════════════════════════════════════════════
// PIXEL CHAT ENGINE — fully local, no network required
// Understands what you actually said and responds as Pixel.
// Uses intent classification + context-aware template generation.
// ════════════════════════════════════════════════════════════

let apiAvailable = false; // always local

// ── CONVERSATION MEMORY ──────────────────────────────────────
const mem = {
  exchanges:    0,
  lastUserMsg:  '',
  lastPixelMsg: '',
  userName:     null,
  topics:       [],      // topics user has brought up
  userMood:     'neutral',
  facts:        [],      // persistent facts extracted from conversation e.g. "likes hiking"
};

// ── INTENT CLASSIFIER ────────────────────────────────────────
// Returns the most specific intent for a message.
// Checks in priority order — first match wins.
function classifyIntent(msg) {
  const t = msg.toLowerCase().trim();
  const has = (...words) => words.some(w => t.includes(w));

  // Greetings
  if (/^(hi+|hey+|hello|sup|yo+|hiya|howdy|morning|evening|night|whaddup|what's good)/.test(t)) return 'greet';

  // Farewells
  if (has('bye','goodbye','see ya','later','gtg','gotta go','take care')) return 'bye';

  // How are you / state check
  if (/how (are|r) (you|ya|u)|you (ok|okay|good|alright|doing|feel)|how('?s| is) it going|you well/.test(t)) return 'howAreYou';

  // What are you doing
  if (/what(cha| are| r) (you|u) (do|up|work)|what'?s (going on|happening|up with you)|you busy/.test(t)) return 'whatDoing';

  // Where are you
  if (/where (are|r) you|your location|where you at|which (place|spot)/.test(t)) return 'whereAreYou';

  // What's my name / do you know my name
  if (/(?:do you know|what(?:'?s| is)) my name|you (?:know|remember) my name/.test(t)) return 'whatIsMyName';

  // Who/what are you
  if (/who are you|what are you|your name|you (a |an )?(robot|ai|bot|human|real|person|npc)|are you real/.test(t)) return 'identity';

  // Questions about Pixel's skills/stats
  if (has('level','skill','xp','stats','strength','cooking','dancing','fishing','get better','how good','how strong')) return 'skills';

  // Questions about Pixel's feelings/mood/arc
  if (has('feeling','mood','sad','happy','angry','tired','stressed','excited','melancholy','lonely','bored')) return 'feelingDeep';

  // What do you like/prefer
  if (/fav(ou?rite)?|what do you (like|love|enjoy|hate|dislike)|prefer|rather/.test(t)) return 'preferences';

  // Philosophy / big questions
  if (has('meaning','purpose','exist','conscious','death','god','universe','real','soul','life','why are we','point of')) return 'philosophy';

  // Future / goals
  if (has('goal','plan','future','want to','going to','gonna','dream','wish','hope for')) return 'goals';

  // Asking for advice
  if (/should i|what (would|should) (you|i)|advice|help me|what do you think|your opinion/.test(t)) return 'advice';

  // Time
  if (has('what time','what day','how long','how late','what hour')) return 'time';

  // Compliments aimed at Pixel
  if (/you'?r?e? (cool|great|awesome|nice|good|amazing|smart|cute|funny|interesting|sweet|kind)/.test(t)) return 'compliment';

  // Insults aimed at Pixel
  if (/you'?r?e? (dumb|stupid|bad|lame|boring|ugly|annoying|trash|useless|terrible|awful|pathetic)/.test(t)) return 'insult';

  // User sharing their own emotions
  if (/i('?m| am) (sad|depressed|upset|crying|lonely|lost|empty|struggling|hurt|broken|anxious|scared|worried)/.test(t)) return 'userSad';
  if (/i('?m| am) (happy|great|amazing|excited|pumped|stoked|good|wonderful|thrilled|relieved)/.test(t)) return 'userHappy';
  if (/i('?m| am) (bored|tired|exhausted|stressed|burned out|overwhelmed|done with|over it)/.test(t)) return 'userTired';

  // User telling Pixel to do something
  if (/^(go|please go|can you go|you should go|go to|head to|try|do some|stop|quit|leave|rest|start|do a|do some|can you|would you|please)/.test(t)
    || /(stop|quit|leave the|go to the|head to the|start (cooking|reading|studying|painting|meditating|dancing|running|fishing|lifting|working out)|stop (working out|lifting|cooking|sleeping|studying|running|dancing|fishing))/.test(t)
  ) return 'command';

  // User asking a question about a topic
  if (t.includes('?') || /^(what|who|why|how|when|where|which|do you|did you|have you|can you|tell me)/.test(t)) return 'question';

  // User making a statement about themselves
  if (/^i (like|love|hate|want|need|think|feel|believe|always|never|just|was|went|did|made|saw|heard|read)/.test(t)) return 'userStatement';

  // Short affirmations / reactions
  if (/^(ok|okay|cool|nice|yeah|yep|nope|nah|lol|haha|wow|oh|ah|hm+|damn|wild|true|fr|facts|same|ik|ikr|lmao|lmfao|omg|wtf)/.test(t)) return 'reaction';

  // Default: treat as open statement
  return 'statement';
}

// ── RESPONSE GENERATOR ───────────────────────────────────────
function pixelRespond(msg) {
  const intent = classifyIntent(msg);
  const t      = msg.toLowerCase().trim();
  const arc    = currentArc?.id || 'content';
  const h      = gt.h;
  const action = char.action;
  const loc    = char.loc;
  const doing  = action === 'idle' ? 'nothing much' : action + 'ing';
  const timeStr = h<6?'the middle of the night':h<12?'morning':h<17?'afternoon':h<21?'evening':'night';
  const topSkill = Object.entries(SKILLS).sort((a,b)=>b[1].level-a[1].level)[0];
  const hungry  = NEEDS.hunger.v > 60;
  const tired   = NEEDS.fatigue.v > 65;
  const bored   = NEEDS.boredom.v > 70;
  const R = (arr) => arr[Math.floor(Math.random()*arr.length)]; // pick random

  // Track for context
  mem.exchanges++;
  mem.lastUserMsg = msg;

  // ── NAME EXTRACTION ── detect "my name is X" / "call me X" / "i'm X"
  const nameMatch = t.match(/(?:my name(?:'?s| is)|call me|i(?:'?m| am)) ([a-z][a-z'-]{1,20})(?:\s|$|[.,!?])/);
  if (nameMatch) {
    const candidate = nameMatch[1];
    const notNames = new Set(['not','just','so','really','kinda','pretty','very','also','trying','gonna','going','coming']);
    if (!notNames.has(candidate)) {
      mem.userName = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      saveHistory();
    }
  }

  // ── FACT EXTRACTION ── pull persistent facts from what they say ───────────
  (function extractFacts() {
    const facts = [];
    // Interests / hobbies
    const likeMatch = t.match(/i (?:love|like|enjoy|really like|am into|do) ([a-z][a-z ]{2,30}?)(?:\.|,|$|!)/);
    if (likeMatch) facts.push(`likes ${likeMatch[1].trim()}`);
    const hateMatch = t.match(/i (?:hate|don't like|dislike|can't stand) ([a-z][a-z ]{2,30}?)(?:\.|,|$|!)/);
    if (hateMatch) facts.push(`dislikes ${hateMatch[1].trim()}`);
    // Job / occupation
    const jobMatch = t.match(/i(?:'?m| am) (?:a |an )?([a-z][a-z ]{2,25}?)(?:\.|,|$| at | in | for )/);
    if (jobMatch && !['tired','bored','okay','fine','good','bad','not'].includes(jobMatch[1].trim())) {
      facts.push(`is a ${jobMatch[1].trim()}`);
    }
    // Location
    const fromMatch = t.match(/i(?:'?m| am) from ([a-z][a-z ,]{2,30}?)(?:\.|,|$|!)/);
    if (fromMatch) facts.push(`from ${fromMatch[1].trim()}`);
    // Age
    const ageMatch = t.match(/i(?:'?m| am) (\d{1,2})(?: years? old)?/);
    if (ageMatch && +ageMatch[1] > 10 && +ageMatch[1] < 100) facts.push(`age ${ageMatch[1]}`);
    // Significant statements
    if (t.includes("i work") || t.includes("my job")) {
      const workMatch = t.match(/(?:i work|my job)(?: is| at| as)? ([a-z][a-z ]{2,30}?)(?:\.|,|$)/);
      if (workMatch) facts.push(`works ${workMatch[1].trim()}`);
    }

    // Add new unique facts (max 20 total, drop oldest)
    facts.forEach(f => {
      if (!mem.facts.some(existing => existing.includes(f.split(' ')[1] || f))) {
        mem.facts.push(f);
      }
    });
    if (mem.facts.length > 20) mem.facts = mem.facts.slice(-20);
    if (facts.length > 0) saveHistory(); // persist new facts immediately
  })();

  switch(intent) {

    case 'greet': {
      const n = mem.userName;
      return R(n ? [
        `oh. hey ${n}.`,
        `${n}. hey.`,
        `hey. ${doing} right now.`,
        mem.exchanges > 4 ? `${n}, you again.` : `hi ${n}.`,
        `${timeStr}. didn't expect you.`,
      ] : [
        `oh. hey.`,
        `hey. ${doing} right now.`,
        `you showed up.`,
        mem.exchanges > 4 ? `you again. hey.` : `hi.`,
        `${timeStr}. didn't expect company.`,
      ]);
    }

    case 'bye':
      return R([
        `yeah. later.`,
        `alright.`,
        `okay. i'll be here.`,
        `see you.`,
      ]);

    case 'howAreYou': {
      const byArc = {
        content:    [`not bad.`,`okay, actually.`,`fine. ${doing}.`],
        restless:   [`restless. hard to explain.`,`on edge for no reason.`,`can't settle.`],
        focused:    [`in the zone right now.`,`clear-headed. it's good.`,`focused. rare.`],
        melancholy: [`...not great.`,`a bit down. just is.`,`low today.`],
        reflective: [`in my head.`,`lot on my mind.`,`thinking about things.`],
        impulsive:  [`unpredictable today.`,`chaotic, honestly.`,`winging it.`],
        tired:      [`exhausted.`,`running on nothing.`,`really tired.`],
        energised:  [`actually really good.`,`lot of energy, weirdly.`,`feeling it.`],
      };
      return R(byArc[arc] || byArc.content);
    }

    case 'whatDoing': {
      const map = {
        lift:     `working out. ${NEEDS.fitness.v<40?'needed it.':'habit.'}`,
        cook:     `cooking. ${hungry?'starving.':'just felt like it.'}`,
        study:    `studying. ${SKILLS.studying?.level>4?'getting somewhere.':'still slow.'}`,
        read:     `reading. ${SKILLS.intellect?.level>3?'good book.':'trying to focus.'}`,
        dance:    `dancing. music's decent tonight.`,
        shop:     `grocery run. ${hungry?'long overdue.':'just restocking.'}`,
        sleep:    `was sleeping. kind of.`,
        meditate: `trying to be still. mostly working.`,
        paint:    `painting. not sure if it's any good.`,
        run:      `running. clearing my head.`,
        fish:     `fishing. just waiting.`,
        journal:  `writing. personal stuff.`,
        pushups:  `pushups. quick set.`,
        phone:    `on my phone. the usual.`,
        bartend:  `covering a shift. talking to strangers.`,
        idle:     `nothing. just existing for a minute.`,
      };
      return map[action] || `just at the ${loc}.`;
    }

    case 'whereAreYou': {
      const map = {
        gym:       `gym. ${SKILLS.strength?.level>3?'been coming here a while.':'still figuring it out.'}`,
        apartment: `home. ${h<10||h>21?'makes sense.':'taking a break.'}`,
        store:     `grocery store. kind of hate it here.`,
        nightclub: `nightclub. ${h<20?'got here early.':'about the right time.'}`,
        park:      `grove park. getting some fresh air.`,
        street:    `just walking around.`,
      };
      return map[loc] || `around somewhere.`;
    }

    case 'identity':
      return R([`pixel. just pixel.`,`just someone trying to get through the day.`,`nobody special.`,`does it matter?`,`i'm here. that's enough.`]);

    case 'whatIsMyName': {
      const n = mem.userName;
      return n
        ? R([`${n}. you told me.`, `yeah, ${n}.`, `${n}. i remember.`])
        : R([`you haven't told me.`, `don't know yet.`, `no idea. want to?`]);
    }

    case 'skills': {
      const sk = topSkill;
      if (t.includes('fish')) return `fishing level ${SKILLS.fishing?.level||1}. ${SKILLS.fishing?.level>5?'getting good at the waiting part.':'still learning patience.'}`;
      if (t.includes('cook')) return `cooking level ${SKILLS.cooking?.level||1}. ${SKILLS.cooking?.level>5?'actually decent now.':'edible at least.'}`;
      if (t.includes('strength')||t.includes('gym')||t.includes('lift')) return `strength level ${SKILLS.strength?.level||1}. ${SKILLS.strength?.level>5?'noticing it.':'still early.'}`;
      return `${sk[0]} is my strongest right now. level ${sk[1].level}. ${sk[1].level>10?'actually proud of it.':'still building.'}`;
    }

    case 'feelingDeep': {
      // If they're asking about a specific emotion
      if (t.includes('sad')||t.includes('melancholy')||t.includes('lonely')) {
        return arc==='melancholy'
          ? R([`yeah. happens sometimes.`,`it's just one of those days.`,`i don't always know why.`])
          : R([`not right now. but i know the feeling.`,`i have days like that.`,`it comes and goes.`]);
      }
      if (t.includes('happy')||t.includes('excited')) {
        return arc==='energised'
          ? R([`actually yeah. good energy today.`,`yeah, surprisingly.`])
          : R([`not especially. okay though.`,`content. that's enough.`]);
      }
      if (t.includes('bored')) return bored ? `yeah. kind of.` : `not really. ${doing} keeps me occupied.`;
      if (t.includes('tired')) return tired ? `really tired, yeah.` : `not yet. ask me later.`;
      return R([`it's complicated.`,`i don't always have the words.`,`depends on the day.`]);
    }

    case 'preferences':
      return R([
        `${h>=20?'nights':'mornings'} — quieter.`,
        `${SKILLS.strength?.level>SKILLS.cooking?.level?'working out over cooking, honestly.':'cooking. it\'s meditative.'}`,
        `music that doesn't try too hard.`,
        `reading. quieter than talking.`,
        `fishing. nothing happens and that's the point.`,
        `being alone, mostly. that's not a comment on you.`,
        `${arc==='focused'?'a good problem to solve.':'days when my head is clear.'}`,
      ]);

    case 'philosophy':
      return R([
        `i think about this. no clean answer.`,
        `existence is strange. i've made peace with not knowing.`,
        `meaning's something you make up. but that doesn't make it fake.`,
        `i don't know. i think that might be the honest answer.`,
        `sometimes nothing seems to matter. then something small happens and it does.`,
        `i try not to spiral on it. doesn't always work.`,
      ]);

    case 'goals':
      return R([
        `get to level ${Math.min(99,topSkill[1].level+5)} ${topSkill[0]}.`,
        `not sure, honestly. something.`,
        `keep moving. vague but it works.`,
        `figure things out as i go.`,
        `just... not fall behind.`,
      ]);

    case 'advice':
      return R([`depends. what's the actual situation?`,`what are the options?`,`i'd need more context.`,`trust yourself. probably.`,`what does your gut say?`]);

    case 'time':
      return `${String(gt.h).padStart(2,'0')}:${String(gt.m).padStart(2,'0')}. day ${gt.d}.`;

    case 'compliment':
      return R([`thanks i guess.`,`appreciate it.`,`you don't have to say that.`,`okay.`,`that's... nice.`]);

    case 'insult':
      return R([`fair enough.`,`noted.`,`okay.`,`probably.`,`could be worse things to be.`]);

    case 'userSad':
      return R([
        `that's rough. what happened?`,
        `yeah. some days are just like that.`,
        `i get it. not every day is okay.`,
        `sit with it. it passes.`,
        `do you want to talk about it or just... someone to be here?`,
      ]);

    case 'userHappy':
      return R([
        `good. hold onto that.`,
        `yeah? what happened?`,
        `nice. what is it?`,
        `rare feeling. enjoy it.`,
      ]);

    case 'userTired':
      return R([
        `yeah. same, kind of.`,
        `what's draining you?`,
        `i know that feeling.`,
        tired ? `both of us then.` : `rest when you can.`,
      ]);

    case 'command': {
      // ── Parse what they're asking ──────────────────────────
      const placeMap = {
        gym:'gym', park:'park', store:'store', shop:'store',
        club:'nightclub', nightclub:'nightclub', home:'apartment',
        apartment:'apartment', bar:'nightclub', street:'street',
      };
      const actionMap = {
        cook:'cook', sleep:'sleep', run:'run', fish:'fish',
        read:'read', paint:'paint', dance:'dance', lift:'lift',
        'work out':'lift', workout:'lift', 'lifting':'lift',
        study:'study', meditate:'meditate', journal:'journal',
        phone:'phone', rest:'sleep', paint:'paint', walk:'idle',
        stop:'idle', quit:'idle',
      };
      const locForAction = {
        cook:'apartment', sleep:'apartment', study:'apartment',
        read:'apartment', meditate:'apartment', paint:'apartment',
        phone:'apartment', journal:'apartment', idle:'apartment',
        lift:'gym', run:'gym', fish:'apartment', dance:'nightclub',
      };

      const isStop = /stop|quit|rest|come home|stop (working out|lifting|running|cooking|studying|dancing|fishing)/.test(t);
      const placeKey  = Object.keys(placeMap).find(k => t.includes(k));
      const actionKey = Object.keys(actionMap).find(k => t.includes(k));

      // ── Actually execute the command ───────────────────────
      if (isStop && !placeKey && !actionKey) {
        // "stop" / "rest" / "come home" — go idle at apartment
        setTimeout(() => {
          committedAction = null;
          decisionTimer   = 0;
          char.asleep = false;
          travelTo('apartment', 'idle');
        }, 400);
        return R([`okay.`, `fine.`, `yeah, i'll stop.`, `alright.`]);
      }

      if (actionKey) {
        const newAction = actionMap[actionKey];
        const newLoc    = placeMap[placeKey] || locForAction[newAction] || char.loc;
        setTimeout(() => {
          committedAction = null;
          decisionTimer   = 180 + Math.random() * 120; // commit for 3-5 min
          char.asleep = newAction === 'sleep';
          travelTo(newLoc, newAction);
          committedAction = newAction;
        }, 400);
        const ack = [
          `fine.`, `yeah, alright.`, `okay.`, `in a bit.`,
          `was thinking that anyway.`, `sure.`,
        ];
        return R(ack);
      }

      if (placeKey) {
        const newLoc = placeMap[placeKey];
        setTimeout(() => {
          committedAction = null;
          decisionTimer   = 0;
          travelTo(newLoc, 'idle');
        }, 400);
        return R([`heading there.`, `okay.`, `fine.`, `on my way.`]);
      }

      return R([`maybe.`, `i'll think about it.`, `noted.`]);
    }

    case 'question': {
      // Generic question — try to pull out the subject and respond to it
      const subj = extractSubject(t);
      if (subj) return R([
        `${subj}? good question actually.`,
        `i've thought about ${subj}. no clean answer.`,
        `${subj}... depends on the day.`,
        `what made you ask about ${subj}?`,
      ]);
      return R([`depends.`,`not sure.`,`good question.`,`i've wondered that too.`]);
    }

    case 'userStatement': {
      const subj = extractSubject(t);
      const hasFacts = mem.facts.length > 0;
      // Occasionally reference something we know about them
      const useFact = hasFacts && Math.random() < 0.25;
      const fact = useFact ? mem.facts[Math.floor(Math.random()*mem.facts.length)] : null;
      const reactions = subj ? [
        `${subj}? hm. say more.`,
        `yeah, ${subj} is a thing.`,
        `that tracks.`,
        `what made you bring up ${subj}?`,
        `i get that about ${subj}.`,
        fact ? `makes sense given you ${fact}.` : `tell me more.`,
      ] : [
        `yeah?`,
        `say more.`,
        `that tracks.`,
        `i get that.`,
        `what do you mean exactly?`,
        hasFacts ? `that fits you actually.` : `interesting.`,
      ];
      return R(reactions);
    }

    case 'reaction': {
      if (t.match(/^(lol|haha|lmao|lmfao)/)) return R([`yeah.`,`i mean.`,`it is what it is.`,`right?`,`glad someone finds it funny.`]);
      if (t.match(/^(wow|damn|wild|omg|wtf)/)) return R([`yeah.`,`right?`,`i know.`,`it's a lot.`,`that's the word for it.`]);
      if (t.match(/^(ok|okay|cool|nice|true|fr|facts|same|ik|ikr)/)) return R([`yeah.`,`exactly.`,`right.`,`mm.`,`${doing} over here.`]);
      if (t.match(/^(oh|ah|hm+)/)) return R([`hm.`,`yeah.`,`i know.`,`what is it.`]);
      return R([`yeah.`,`hm.`,`okay.`,`right.`,`what else.`]);
    }

    default:
    case 'statement': {
      const subj = extractSubject(t);
      // Occasionally reference game state for grounding
      const stateRef = hungry ? `starving over here, but go on.` : tired ? `tired but listening.` : bored ? `this is actually interesting, weirdly.` : null;
      if (subj && subj.length > 2) return R([
        `${subj}? hm.`,
        `something about ${subj} keeps coming up.`,
        `i've thought about ${subj} too.`,
        `what about ${subj}?`,
        `yeah. ${subj}.`,
        stateRef || `tell me more.`,
      ]);
      return R([
        `${doing} right now. what's on your mind.`,
        `${arc==='melancholy'?'low day for me too.':arc==='energised'?'good energy right now, actually.':arc==='focused'?'in the zone. but go on.':'just here.'}`,
        `yeah.`,
        `tell me more.`,
        `hm. okay.`,
        stateRef || `what else.`,
      ]);
    }
  }
}

// Extract meaningful subject noun from a sentence
function extractSubject(t) {
  // Remove common filler words and return first interesting word/phrase
  const stop = new Set(['that','this','what','when','where','have','been','your','they','them','with','just','like','know','think','dont','cant','would','could','should','will','from','into','about','really','very','much','more','some','here','there','then','than','these','those','both','such','only','also','well','back','even','down','over','after','before','since','under','while','does','doing','being','going','having','getting','make','take','give','keep','come','look','want','need','seem','feel','said','told','asked','maybe','always','never','often','sometimes']);
  const words = t.replace(/[^a-z0-9 ']/g,'').split(' ').filter(w => w.length > 2 && !stop.has(w));
  // Prefer 2-word phrases
  for (let i = 0; i < words.length-1; i++) {
    if (!stop.has(words[i]) && !stop.has(words[i+1])) return words[i]+' '+words[i+1];
  }
  return words[0] || null;
}

// ── AI ENGINE ─────────────────────────────────────────────────
// Tier 1: Pollinations.ai cloud GPT-4o (free, no key needed)
//   Retries once on failure, 10s timeout per attempt
// Tier 2: Local intent engine (always works, offline)
// WebLLM removed — 500MB download for a worse model isn't worth it.

let cloudFailStreak = 0;

// Phrases that indicate Pollinations returned a warning/migration notice instead of a reply
const CLOUD_JUNK = [
  'please migrate', 'enter.pollinations.ai', 'anonymous requests',
  'continue to work normally', 'better performance', 'latest models',
  'migrate to our',
];

function isJunkReply(text) {
  if (!text || text.length < 4) return true;
  const low = text.toLowerCase();
  return CLOUD_JUNK.some(phrase => low.includes(phrase));
}

function cleanReply(text) {
  return text
    .replace(/\*[^*]{1,80}\*/g, '')    // strip *action* emotes
    .replace(/^\W+|\W+$/g, '')          // strip leading/trailing non-word chars
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function fetchCloud(messages, timeoutMs) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), timeoutMs || 10000);
  try {
    const system   = (messages.find(m => m.role === 'system') || {}).content || '';
    const lastUser = ([...messages].reverse().find(m => m.role === 'user') || {}).content || '';
    const url = 'https://text.pollinations.ai/' +
      encodeURIComponent(lastUser) +
      '?model=openai' +
      '&seed='    + Math.floor(Math.random() * 99999) +
      '&private=true' +
      '&system='  + encodeURIComponent(system);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) return null;
    const raw   = await res.text();
    const reply = cleanReply(raw);
    if (isJunkReply(reply)) return null;
    return reply;
  } catch(e) {
    clearTimeout(tid);
    return null;
  }
}

async function callAI(msg, selfTalk) {
  // ── SELF-TALK: instant local thoughts, no network ─────────
  if (selfTalk) {
    if (Math.random() < 0.55 && currentArc && currentArc.thoughts)
      return currentArc.thoughts[Math.floor(Math.random() * currentArc.thoughts.length)];
    const pool = {
      lift:['one more.','burning.','focus.'],cook:['almost.','smells right.','careful.'],
      study:['interesting.','wait.','slow down.'],dance:['feel it.','yeah.'],
      shop:['need this.','okay.'],read:['wait what.','hm.'],fish:['quiet.','patience.'],
      meditate:['breathe.','still.'],paint:['keep going.','not sure.'],run:['push.','almost.'],
      journal:['okay.','say it.'],idle:['hm.','...'],sleep:['zzz','...mmph...'],
      mine:['one more swing.','something in here.','arms getting tired.'],
    };
    const l = pool[char.action] || pool.idle;
    return l[Math.floor(Math.random() * l.length)];
  }

  const messages = [
    { role: 'system', content: sysPrompt() },
    ...ai.history.slice(-24),
    { role: 'user',   content: msg }
  ];

  // ── TIER 1: Cloud with one retry ──────────────────────────
  if (cloudFailStreak < 3) {
    let reply = await fetchCloud(messages, 10000);
    if (!reply) reply = await fetchCloud(messages, 7000);
    if (reply) {
      cloudFailStreak = 0;
      ai.history.push({ role:'user', content:msg });
      ai.history.push({ role:'assistant', content:reply });
      if (ai.history.length > 48) ai.history = ai.history.slice(-48);
      if (apiAvailable !== true) { apiAvailable = true; updateChatStatus(); addLog('🟢 cloud AI'); }
      return reply;
    }
    cloudFailStreak++;
    if (cloudFailStreak >= 3) setTimeout(function(){ cloudFailStreak = 0; }, 60000);
  }

  // ── TIER 2: Local intent engine ───────────────────────────
  if (apiAvailable !== false) { apiAvailable = false; updateChatStatus(); addLog('💬 offline'); }
  const reply = pixelRespond(msg);
  ai.history.push({ role:'user', content:msg });
  ai.history.push({ role:'assistant', content:reply });
  if (ai.history.length > 48) ai.history = ai.history.slice(-48);
  return reply;
}

// ── PROACTIVE GAME EVENT REACTIONS ────────────────────────────
// Pixel reacts unprompted to meaningful game events.
// Call pixelReact(eventType, context) from anywhere in the game.

let lastReactionTime = 0;
const REACTION_COOLDOWN = 45000; // 45s minimum between unsolicited reactions

async function pixelReact(eventType, context) {
  const now = Date.now();
  if (!context) context = {};
  if (now - lastReactionTime < REACTION_COOLDOWN) return;
  if (ai.busy) return;
  lastReactionTime = now;

  const sk = context.skill || '';
  const lv = context.level || '';
  const prompts = {
    levelUp:          'You just leveled up ' + sk + ' to level ' + lv + '. React in 1 sentence — surprised, matter-of-fact, or quietly proud. No asterisks. Never start with I.',
    skillMilestone:   'Your ' + sk + ' skill just hit level ' + lv + ' — a real milestone. React as Pixel. 1 sentence, dry or quietly meaningful. No asterisks.',
    mineOre:          'You just mined ' + (context.count||'some') + ' ' + (context.ore||'ore') + ' deep in the mines. 1 sentence — tired, focused, or oddly satisfied. No asterisks.',
    locationArrive:   'You just arrived at the ' + (context.loc||'') + '. 1 sentence about being here right now. No asterisks.',
    highFatigue:      'Exhaustion level: ' + (context.fatigue||80) + '/100. Say something about how tired you feel. 1 sentence, not dramatic. No asterisks.',
    longIdle:         'You\'ve been doing nothing for a while. Express mild restlessness or contentment in 1 sentence. No asterisks.',
    newDay:           'Day ' + (context.day||gt.d) + ' just started. 1 sentence morning thought — mundane, reflective, or dry. No asterisks.',
    moodShift:        'Your mood just shifted to ' + (context.mood||'neutral') + '. Feel it in 1 sentence — from the inside, not describing it. No asterisks.',
  };

  const prompt = prompts[eventType];
  if (!prompt) return;

  ai.busy = true;
  try {
    const reply = await fetchCloud([
      { role: 'system', content: sysPrompt() },
      { role: 'user',   content: prompt }
    ], 7000);
    if (reply && reply.length > 2) {
      addChatMsg('pixel', reply, true);
      showSpeech(reply, Math.max(4000, reply.length * 65));
      markUnread();
      addLog('💭 "' + reply.slice(0,32) + '"');
    }
  } catch(e) {}
  ai.busy = false;
}

// ── CHAT PANEL ─────────────────────────────────────────────
let thinkingBubble = null;
let chatOpen = false;
let unreadCount = 0;

// Toggle panel open/close
document.getElementById('chatToggle').addEventListener('click', () => {
  chatOpen = !chatOpen;
  document.getElementById('chatPanel').classList.toggle('open', chatOpen);
  document.getElementById('chatToggle').textContent = chatOpen ? '✕' : '💬';
  // add unread dot back
  if (!chatOpen) document.getElementById('chatToggle').innerHTML = '💬<span class="unread" id="unreadDot"></span>';
  if (chatOpen) {
    unreadCount = 0;
    document.getElementById('unreadDot')?.classList.remove('show');
    document.getElementById('chatinput').focus();
    const hist = document.getElementById('chatHistory');
    hist.scrollTop = hist.scrollHeight;
  }
});

function markUnread() {
  if (chatOpen) return;
  unreadCount++;
  const dot = document.getElementById('unreadDot');
  if (dot) dot.classList.add('show');
}

function updateChatStatus() {
  const ml = getMood();
  const aiMode = window.webllmState === 'ready'   ? '🤖 local AI'
               : window.webllmState === 'loading'  ? '⬇️ loading AI'
               : apiAvailable === true             ? '🟢 cloud AI'
               :                                    '💬 online';
  document.getElementById('chatHeaderStatus').textContent = `${ml.emoji} ${char.action} · ${aiMode}`;
}

function addChatMsg(who, text, clickable=false) {
  const hist = document.getElementById('chatHistory');
  const wrap = document.createElement('div');
  wrap.className = `chat-msg ${who}`;

  const label = document.createElement('div');
  label.className = 'chat-who';
  label.textContent = who === 'you' ? 'YOU' : 'PIXEL';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;

  if (clickable && who === 'pixel') {
    bubble.title = 'click to replay speech bubble';
    bubble.addEventListener('click', () => {
      showSpeech(text, Math.max(5000, text.length * 70));
      bubble.style.borderColor = 'rgba(100,180,255,0.7)';
      setTimeout(() => bubble.style.borderColor = '', 500);
    });
  }

  wrap.appendChild(label);
  wrap.appendChild(bubble);
  hist.appendChild(wrap);
  hist.scrollTop = hist.scrollHeight;

  // Mark unread if panel is closed and it's Pixel speaking
  if (who === 'pixel') markUnread();

  return bubble;
}

function addThinkingBubble() {
  const hist = document.getElementById('chatHistory');
  const wrap = document.createElement('div');
  wrap.className = 'chat-msg pixel';
  wrap.id = 'thinkingWrap';

  const label = document.createElement('div');
  label.className = 'chat-who';
  label.textContent = 'PIXEL';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble thinking dot-anim';

  wrap.appendChild(label);
  wrap.appendChild(bubble);
  hist.appendChild(wrap);
  hist.scrollTop = hist.scrollHeight;
  thinkingBubble = wrap;
}

function removeThinkingBubble() {
  const el = document.getElementById('thinkingWrap');
  if (el) el.remove();
  thinkingBubble = null;
}

async function sendMsg(text){
  if(!text.trim()||ai.busy) return;
  ai.busy=true;
  const btn=document.getElementById('sendbtn');
  btn.disabled=true; btn.textContent='···';

  addChatMsg('you', text);
  addThinkingBubble();

  // Mood shift from message tone
  const pos=['love','great','cool','amazing','nice','good','fun','thanks','awesome'];
  const neg=['hate','stupid','awful','boring','bad','dumb','shut','whatever','ugly'];
  const tl=text.toLowerCase();
  shiftMood((pos.filter(w=>tl.includes(w)).length - neg.filter(w=>tl.includes(w)).length)*5);
  mood.energy=Math.min(100,mood.energy+3);

  let reply = null;
  try {
    reply = await callAI(text);
  } catch(e) {
    // silently fall through to local fallback
  }

  removeThinkingBubble();

  if(reply){
    addChatMsg('pixel', reply, true);
    showSpeech(reply, Math.max(5000, reply.length*65));
    addLog(`🗣 "${reply.slice(0,32)}"`);
    gainCharismaXP();
  } else {
    const fallback = pixelRespond(text);
    addChatMsg('pixel', fallback, true);
    showSpeech(fallback, 4000);
  }

  // ALWAYS unlock — no more deadlock
  ai.busy=false; btn.disabled=false; btn.textContent='↵';

  // Save after every chat so history is never lost on close
  saveGame(false);
  saveHistory();
}

document.getElementById('sendbtn').addEventListener('click',()=>{ const i=document.getElementById('chatinput'); sendMsg(i.value); i.value=''; });
document.getElementById('chatinput').addEventListener('keydown',e=>{ if(e.key==='Enter'){ sendMsg(e.target.value); e.target.value=''; }});

// ── Warmup: pre-connect to cloud so first real message is instant ─────────
(async function warmupAI() {
  try {
    const reply = await fetchCloud([{ role:'user', content:'say "ok" only' }], 8000);
    if (reply) {
      apiAvailable = true;
      cloudFailStreak = 0;
      updateChatStatus();
      addLog('🟢 cloud AI ready');
    } else {
      addLog('💬 offline mode');
    }
  } catch(e) { addLog('💬 offline mode'); }
})();
document.getElementById('char').addEventListener('click',async()=>{
  if(ai.busy) return;
  ai.busy=true;
  addThinkingBubble();
  // Use cloud for char click — feels much more alive than canned self-talk
  const r = await fetchCloud([
    { role:'system', content: sysPrompt() },
    { role:'user',   content: 'Someone just tapped you. React to being interrupted — brief, dry, maybe a little surprised. 1 sentence. No asterisks.' }
  ], 6000) || pixelRespond('hey');
  removeThinkingBubble();
  if(r){ addChatMsg('pixel', r, true); showSpeech(r,5000); gainCharismaXP(); }
  ai.busy=false;
},{passive:true});

// ════════════════════════════════════════════════════════════
// PIXEL'S INNER LIFE — a layered autonomy system
//
// Three forces shape every decision:
//   1. BODY  — hunger/fatigue/fitness (urgent, biological)
//   2. MIND  — boredom/stress/restlessness (slower, psychological)
//   3. SOUL  — personality traits, habits, current emotional arc
//
// Pixel has a persistent emotional arc (feeling → duration → next)
// and personal traits that bias what they find satisfying.
// Decisions feel earned, not mechanical.
// ════════════════════════════════════════════════════════════

