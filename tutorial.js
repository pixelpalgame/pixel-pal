// ── TUTORIAL SYSTEM ──────────────────────────────────────────────────────────
// Spotlight-style walkthrough shown once after a new game is started.
// Stored in localStorage so it never shows again after being completed/skipped.

const TUTORIAL_SEEN_KEY    = 'pixel_tutorial_seen';
const TUTORIAL_PLAYED_KEY  = 'pixel_ever_played'; // set after first completion; enables SKIP on future runs

// Global flag — blocks game BGM from starting until tutorial is dismissed
window.tutorialActive = false;

const TUTORIAL_STEPS = [
  {
    title: '👋 Welcome to Pixel Pal!',
    body:  "This is your apartment — home base. Pixel lives here and you'll watch over them, help them grow, and explore the world together.",
    target: null,
    pad: 0,
  },
  {
    title: '🎒 You Have Starter Items!',
    body:  "Check your backpack — you already have materials to get started. Tap the bag icon (or press TAB) to open your Inventory and see what you've got.",
    target: 'invBtn',
    pad: 12,
  },
  {
    title: '🛡 Equip Your Gear',
    body:  'Click each armor item in your inventory and hit EQUIP to slot it. You have a helmet, chestplate, legguards, boots, and gauntlets — equip all 5 to continue!',
    target: 'invBtn',
    pad: 12,
    requireEquip: true,
  },
  {
    title: '⚒ Crafting Bench',
    body:  'Use your materials at the Crafting Bench (C key) to forge gear, tools, and upgrades. Better crafting skill = higher success rate and access to rarer recipes.',
    target: 'craftHudBtn',
    pad: 12,
  },
  {
    title: '⚔ Skills & XP',
    body:  'Every action — mining, cooking, studying, dancing — levels up a matching skill. Open the Skills panel to track your progress and unlock perks.',
    target: 'xpBtn',
    pad: 12,
  },
  {
    title: '🗺 Travel & Zones',
    body:  "The location pill shows where Pixel is. Walk to the edge of the apartment to reach new areas — the Docks, Mines, and more. Each zone has unique resources and activities, and that's where you can take direct control.",
    target: 'locpill',
    pad: 14,
  },
  {
    title: '💚 Mood & Needs',
    body:  "Keep an eye on the HUD bars — hunger, energy, hygiene, social, and fun. Let them drop too low and Pixel gets unhappy. Happy Pixel = better skill gains.",
    target: 'hud',
    pad: 8,
  },
  {
    title: '🎵 Music Player',
    body:  "Use the music button to browse and play the in-game soundtrack. Tracks change based on where Pixel is. Open the panel and hit play on a song to continue!",
    target: 'musicBtn',
    pad: 12,
    requirePlay: true,
  },
  {
    title: '🏠 Pixel Lives Their Own Life',
    body:  "At home, Pixel is fully autonomous — they handle their own needs and follow their desires without any input from you. You're a companion and observer here, not a controller. Manual control unlocks in other zones like the Mines, Docks, and Downtown.",
    target: 'world',
    pad: 0,
  },
  {
    title: "✨ You're Ready!",
    body:  "That's all you need to know. Explore, craft, level up — and talk to Pixel anytime using the chat bar at the bottom. Have fun!",
    target: null,
    pad: 0,
    isLast: true,
  },
];

function showTutorial() {
  // Safety: if somehow called when already seen, release the BGM block and exit
  if (localStorage.getItem(TUTORIAL_SEEN_KEY)) {
    window.tutorialActive = false;
    return;
  }

  let step = 0;
  let playPollInterval = null;

  // ── Overlay ──────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'tutOverlay';
  Object.assign(overlay.style, {
    position:       'fixed',
    top:            '0',
    left:           '0',
    width:          '100%',
    height:         '100%',
    zIndex:         '900',
    pointerEvents:  'all',
  });

  // Spotlight element — invisible box whose box-shadow creates the dark surround
  const spot = document.createElement('div');
  spot.id = 'tutSpot';
  Object.assign(spot.style, {
    position:     'fixed',
    borderRadius: '6px',
    boxShadow:    '0 0 0 9999px rgba(0,0,10,0.82)',
    pointerEvents: 'none',
    transition:   'top 0.28s ease, left 0.28s ease, width 0.28s ease, height 0.28s ease',
    zIndex:       '901',
  });

  // Tutorial card
  const card = document.createElement('div');
  card.id = 'tutCard';
  Object.assign(card.style, {
    position:      'fixed',
    background:    'linear-gradient(160deg,#0d0d22 60%,#111830)',
    border:        '2px solid #334488',
    borderRadius:  '10px',
    padding:       '18px 20px 14px',
    maxWidth:      '320px',
    minWidth:      '240px',
    color:         '#ccd6f6',
    fontFamily:    '"VT323", monospace',
    fontSize:      '17px',
    lineHeight:    '1.45',
    boxShadow:     '0 4px 32px rgba(0,0,0,0.8)',
    zIndex:        '902',
    pointerEvents: 'all',
    transition:    'top 0.28s ease, left 0.28s ease',
  });

  // Progress dots
  const dots = document.createElement('div');
  Object.assign(dots.style, {
    display:       'flex',
    gap:           '5px',
    marginBottom:  '10px',
    justifyContent:'center',
  });

  const titleEl = document.createElement('div');
  Object.assign(titleEl.style, {
    fontSize:     '20px',
    fontWeight:   'bold',
    marginBottom: '8px',
    color:        '#88aaff',
  });

  const bodyEl = document.createElement('div');
  Object.assign(bodyEl.style, {
    marginBottom: '14px',
    color:        '#b8c8e8',
    fontSize:     '15px',
  });

  const btnRow = document.createElement('div');
  Object.assign(btnRow.style, {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    gap:            '8px',
  });

  const skipBtn = document.createElement('button');
  skipBtn.textContent = 'SKIP';
  // Only show SKIP if the player has completed the tutorial at least once before
  const _canSkip = !!localStorage.getItem(TUTORIAL_PLAYED_KEY);
  Object.assign(skipBtn.style, {
    background:   'transparent',
    border:       '1px solid #334455',
    borderRadius: '4px',
    color:        '#556677',
    fontFamily:   '"VT323", monospace',
    fontSize:     '15px',
    padding:      '4px 10px',
    cursor:       'pointer',
    display:      _canSkip ? '' : 'none',
  });

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'NEXT →';
  Object.assign(nextBtn.style, {
    background:   'linear-gradient(90deg,#224488,#335599)',
    border:       '1px solid #4466aa',
    borderRadius: '4px',
    color:        '#ddeeff',
    fontFamily:   '"VT323", monospace',
    fontSize:     '17px',
    padding:      '5px 16px',
    cursor:       'pointer',
    marginLeft:   'auto',
  });

  btnRow.appendChild(skipBtn);
  btnRow.appendChild(nextBtn);
  card.appendChild(dots);
  card.appendChild(titleEl);
  card.appendChild(bodyEl);
  card.appendChild(btnRow);
  overlay.appendChild(spot);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // ── Render step ──────────────────────────────────────────
  function renderStep() {
    const s = TUTORIAL_STEPS[step];

    // Dots
    dots.innerHTML = '';
    TUTORIAL_STEPS.forEach((_, i) => {
      const d = document.createElement('div');
      Object.assign(d.style, {
        width:        '7px',
        height:       '7px',
        borderRadius: '50%',
        background:   i === step ? '#6688dd' : '#223355',
        transition:   'background 0.2s',
      });
      dots.appendChild(d);
    });

    titleEl.textContent = s.title;
    bodyEl.textContent  = s.body;
    nextBtn.textContent = s.isLast ? "✨ LET'S GO!" : 'NEXT →';

    // Clear any previous play-poll
    if (playPollInterval) { clearInterval(playPollInterval); playPollInterval = null; }

    if (s.requireEquip) {
      overlay.style.pointerEvents = 'none';
      nextBtn.disabled = true;
      nextBtn.style.opacity = '0.4';
      nextBtn.textContent = 'equip gear (0/5)...';
      // Open inventory — equipping is done from here, not the equip overview
      const ib = document.getElementById('invBtn');
      if (ib) ib.click();
      // After inventory opens, re-aim spotlight at the full inventory window
      setTimeout(() => {
        const panel = document.getElementById('invWindow');
        if (panel) {
          const r = panel.getBoundingClientRect();
          const p = 10;
          // Disable transition so the spotlight jumps instantly to the inventory
          // window instead of animating over it and temporarily covering it.
          const prevTransition = spot.style.transition;
          spot.style.transition = 'none';
          spot.style.top    = (r.top    - p) + 'px';
          spot.style.left   = (r.left   - p) + 'px';
          spot.style.width  = (r.width  + p * 2) + 'px';
          spot.style.height = (r.height + p * 2) + 'px';
          requestAnimationFrame(() => { spot.style.transition = prevTransition; });

          // Position the tutorial card in the dark overlay area (outside the
          // spotlight) so it doesn't block the inventory grid.
          // Priority: right of window → left of window → top of viewport.
          const MARGIN = 14;
          const cardW  = Math.min(320, window.innerWidth - 40);
          card.style.width = cardW + 'px';
          const cardH  = card.offsetHeight || 200;
          const spLeft  = r.left  - p;
          const spRight = r.right + p;
          const spTop   = r.top   - p;

          if (spRight + cardW + MARGIN <= window.innerWidth) {
            // Room to the right
            card.style.left = (spRight + MARGIN) + 'px';
            card.style.top  = Math.max(MARGIN, Math.min(window.innerHeight - cardH - MARGIN, spTop)) + 'px';
          } else if (spLeft - cardW - MARGIN >= 0) {
            // Room to the left
            card.style.left = (spLeft - cardW - MARGIN) + 'px';
            card.style.top  = Math.max(MARGIN, Math.min(window.innerHeight - cardH - MARGIN, spTop)) + 'px';
          } else {
            // No room on either side — pin to bottom of viewport, centred horizontally.
            const cx = Math.max(MARGIN, Math.min(window.innerWidth - cardW - MARGIN,
                                                  r.left + r.width / 2 - cardW / 2));
            card.style.left = Math.round(cx) + 'px';
            card.style.top  = (window.innerHeight - cardH - MARGIN) + 'px';
          }
        }
      }, 150);
      // Poll until all 5 starter armor slots are filled
      const STARTER_SLOTS = ['head', 'chest', 'legs', 'boots', 'gloves'];
      playPollInterval = setInterval(() => {
        if (typeof playerEquip === 'undefined') return;
        const count = STARTER_SLOTS.filter(k => playerEquip[k] !== null).length;
        const total = STARTER_SLOTS.length;
        if (count >= total) {
          clearInterval(playPollInterval);
          playPollInterval = null;
          advance();
        } else {
          nextBtn.textContent = `equip gear (${count}/${total})...`;
        }
      }, 400);

    } else if (s.requirePlay) {
      // Unlock audio context but flag that auto-play is blocked — player must pick manually
      window.tutorialActive = false;
      window.musicStepActive = true;
      // Let clicks pass through overlay so the music panel is usable
      overlay.style.pointerEvents = 'none';
      // Disable NEXT — player must start a track first
      nextBtn.disabled = true;
      nextBtn.style.opacity = '0.4';
      nextBtn.textContent = 'play a song first...';
      // Open music panel automatically
      const mb = document.getElementById('musicBtn');
      if (mb) mb.click();
      // After the panel opens, re-aim the spotlight at the whole music panel.
      // Wait 300ms — the panel's CSS open animation takes 220ms, so we need
      // to let it finish before measuring its rect.
      setTimeout(() => {
        const panel = document.getElementById('musicPanel');
        if (panel) {
          const r = panel.getBoundingClientRect();
          const p = 10;
          spot.style.top    = (r.top    - p) + 'px';
          spot.style.left   = (r.left   - p) + 'px';
          spot.style.width  = (r.width  + p * 2) + 'px';
          spot.style.height = (r.height + p * 2) + 'px';
          positionCard(r, p);
        }
      }, 300);
      // Poll until a track is playing, then auto-advance
      playPollInterval = setInterval(() => {
        if (typeof audioEngine !== 'undefined' && audioEngine.bgm && audioEngine.bgm.trackId) {
          clearInterval(playPollInterval);
          playPollInterval = null;
          window.musicStepActive = false;
          advance();
        }
      }, 400);
    } else {
      // Restore normal overlay behaviour
      window.musicStepActive = false;
      overlay.style.pointerEvents = 'all';
      nextBtn.disabled = false;
      nextBtn.style.opacity = '1';
    }

    // Spotlight target
    if (s.target) {
      const el = document.getElementById(s.target);
      if (el) {
        const r = el.getBoundingClientRect();
        const p = s.pad;
        spot.style.display = 'block';
        spot.style.top     = (r.top    - p) + 'px';
        spot.style.left    = (r.left   - p) + 'px';
        spot.style.width   = (r.width  + p * 2) + 'px';
        spot.style.height  = (r.height + p * 2) + 'px';
        positionCard(r, p);
      } else {
        hideSpot();
        centerCard();
      }
    } else {
      hideSpot();
      centerCard();
    }
  }

  function hideSpot() {
    spot.style.top    = '-9999px';
    spot.style.left   = '-9999px';
    spot.style.width  = '1px';
    spot.style.height = '1px';
  }

  function centerCard() {
    const cW = Math.min(320, window.innerWidth - 40);
    card.style.width = cW + 'px';
    card.style.left  = Math.round((window.innerWidth  - cW) / 2) + 'px';
    card.style.top   = Math.round((window.innerHeight - 220) / 2) + 'px';
  }

  function positionCard(targetRect, pad) {
    const cW = Math.min(320, window.innerWidth - 40);
    card.style.width = cW + 'px';

    const MARGIN  = 14;
    const cardH   = 200;
    const spotBot = targetRect.bottom + pad;
    const spotTop = targetRect.top    - pad;

    if (spotBot + cardH + MARGIN < window.innerHeight) {
      card.style.top = (spotBot + MARGIN) + 'px';
    } else if (spotTop - cardH - MARGIN > 0) {
      card.style.top = (spotTop - cardH - MARGIN) + 'px';
    } else {
      card.style.top = Math.round((window.innerHeight - cardH) / 2) + 'px';
    }

    let cx = targetRect.left + targetRect.width / 2 - cW / 2;
    cx = Math.max(MARGIN, Math.min(window.innerWidth - cW - MARGIN, cx));
    card.style.left = Math.round(cx) + 'px';
  }

  // ── Navigation ───────────────────────────────────────────
  function advance() {
    if (step < TUTORIAL_STEPS.length - 1) {
      if (TUTORIAL_STEPS[step].requireEquip && typeof closeInv === 'function') closeInv();
      if (TUTORIAL_STEPS[step].requirePlay) {
        const mc = document.getElementById('musicClose');
        if (mc) mc.click();
      }
      step++;
      renderStep();
    } else {
      finish();
    }
  }

  function finish() {
    if (playPollInterval) { clearInterval(playPollInterval); playPollInterval = null; }
    localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
    localStorage.setItem(TUTORIAL_PLAYED_KEY, '1'); // unlock SKIP for all future characters
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    window.tutorialActive  = false;
    window.musicStepActive = false;
    if (typeof activateQuest === 'function') activateQuest('visit_mines');
  }

  function onKey(e) {
    if (e.key === 'Escape' && _canSkip) finish();
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') advance();
  }

  nextBtn.addEventListener('click', advance);
  skipBtn.addEventListener('click', finish);
  document.addEventListener('keydown', onKey);

  renderStep();
}
