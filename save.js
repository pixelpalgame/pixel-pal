const HISTORY_KEY = 'pixel_chat_history'; // separate key — survives save resets

// Save/load chat history independently so it's never lost
function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify({
      history:   ai.history.slice(-60),
      exchanges: mem.exchanges,
      topics:    mem.topics,
      userName:  mem.userName,
      facts:     mem.facts || [],
    }));
  } catch(e) {}
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.history?.length)   ai.history    = data.history;
    if (data.exchanges)         mem.exchanges = data.exchanges;
    if (data.topics?.length)    mem.topics    = data.topics;
    if (data.userName)          mem.userName  = data.userName;
    if (data.facts?.length)     mem.facts     = data.facts;
  } catch(e) {}
}

function buildSaveData() {
  return {
    version: 7,
    ts: Date.now(),
    charData: playerCharData ? { ...playerCharData } : null,
    char: { wx: char.wx, wy: char.wy, loc: char.loc, action: char.action, facing: char.facing },
    mood: { v: mood.v, energy: mood.energy, curiosity: mood.curiosity, topics: mood.topics, news: mood.news },
    gt:   { h: gt.h, m: gt.m, d: gt.d },
    needs: Object.fromEntries(Object.entries(NEEDS).map(([k,n])=>([k,n.v]))),
    skills: Object.fromEntries(Object.entries(SKILLS).map(([k,s])=>([k,{xp:s.xp,level:s.level}]))),
    money:           playerMoney,
    craftingUnlocked:  craftingUnlocked,
    minesVisited:      minesVisited,
    downtownAttempted: downtownAttempted,
    inventory:       playerInv.map(s => s ? { id: s.id, qty: s.qty } : null),
    equipment:    Object.fromEntries(Object.entries(playerEquip).map(([k,v]) =>
                    [k, v ? { id: v.id, affixes: v.affixes, baseStats: v.baseStats } : null]
                  )),
    history:      ai.history.slice(-50),
    memExchanges: mem.exchanges,
    memTopics:    mem.topics,
    questState:   typeof questState !== 'undefined' ? { ...questState } : {},
  };
}

function applySaveData(data) {
  if (!data || data.version < 2) return false; // allow loading saves from v2+
  try {
    if (data.charData && typeof playerCharData !== 'undefined') {
      Object.assign(playerCharData, data.charData);
    }
    char.wx     = data.char.wx;    char.wy   = data.char.wy;
    char.loc    = data.char.loc;   char.action = data.char.action;
    char.facing = data.char.facing || 1;
    char.tx     = data.char.wx;    char.moving = false;
    mood.v      = data.mood.v;     mood.energy  = data.mood.energy;
    mood.curiosity = data.mood.curiosity;
    mood.topics = data.mood.topics || [];
    mood.news   = data.mood.news   || [];
    gt.h = data.gt.h; gt.m = data.gt.m; gt.d = data.gt.d;
    if (data.needs) {
      Object.entries(data.needs).forEach(([k,v])=>{ if(NEEDS[k]) NEEDS[k].v = v; });
    }
    Object.entries(data.skills || {}).forEach(([k,v])=>{
      if (SKILLS[k]) { SKILLS[k].xp = v.xp; SKILLS[k].level = v.level; }
    });
    playerMoney = data.money || 0;
    // Restore crafting unlock state.
    // Saves that predate this field default to true (player already past tutorial).
    if (typeof craftingUnlocked !== 'undefined') {
      craftingUnlocked = data.craftingUnlocked !== undefined
        ? data.craftingUnlocked
        : true;
    }
    if (typeof minesVisited !== 'undefined') {
      minesVisited = data.minesVisited !== undefined
        ? data.minesVisited
        : true; // old saves: already visited, no tutorial
    }
    if (typeof downtownAttempted !== 'undefined') {
      downtownAttempted = data.downtownAttempted !== undefined
        ? data.downtownAttempted
        : true; // old saves: already past downtown tutorial
    }
    // Restore inventory — only import items that still exist in ITEM_DB
    if (data.inventory) {
      data.inventory.forEach((s, i) => {
        if (s && ITEM_BY_ID[s.id] && i < playerInv.length) {
          playerInv[i] = { id: s.id, qty: s.qty };
        } else {
          playerInv[i] = null;
        }
      });
    }
    ai.history    = data.history || [];
    mem.exchanges = data.memExchanges || Math.floor(ai.history.length / 2);
    mem.topics    = data.memTopics    || [];
    if (typeof questState !== 'undefined') {
      questState = data.questState ?? {};
    }
    // Restore equipped items (re-use rolled affixes from save)
    if (data.equipment && typeof rollEquipItem !== 'undefined') {
      Object.entries(data.equipment).forEach(([k, saved]) => {
        if (saved && Object.prototype.hasOwnProperty.call(playerEquip, k)) {
          const inst = rollEquipItem(saved.id);
          if (inst) {
            inst.affixes   = saved.affixes   || inst.affixes;
            inst.baseStats = saved.baseStats || inst.baseStats;
            playerEquip[k] = inst;
          }
        }
      });
    }
    // If saved while inside a scene (docks/mines) reset to apartment
    // — scenes can't be resumed, bad loc causes invisible char + wrong HUD
    const SCENE_LOCS = ['docks', 'mines', 'street'];
    if (SCENE_LOCS.includes(char.loc)) {
      char.loc    = 'apartment';
      char.wx     = 760;
      char.tx     = 760;
      char.action = 'idle';
    }

    // Always clamp wy to floor — a bad saved wy makes char invisible
    char.wy = FLOOR_Y;

    camX = Math.max(0, Math.min(WW - VW, char.wx - VW / 2));
    return true;
  } catch(e) { console.error('Save load error:', e); return false; }
}

function saveGame(isBackup = false) {
  try {
    const data = buildSaveData();
    const json = JSON.stringify(data);
    localStorage.setItem(getSaveKey(), json);
    if (isBackup) {
      let backups = [];
      try { backups = JSON.parse(localStorage.getItem(getBackupKey()) || '[]'); } catch(e){}
      backups.push({ ts: data.ts, label: new Date(data.ts).toLocaleString(), json });
      if (backups.length > 5) backups = backups.slice(-5); // keep 5 most recent
      localStorage.setItem(getBackupKey(), JSON.stringify(backups));
      addLog(`💾 backup saved (${backups.length}/5)`);
    }
  } catch(e) { console.error('Save error:', e); }
}

function loadGame() {
  try {
    const json = localStorage.getItem(getSaveKey());
    if (!json) return false;
    const data = JSON.parse(json);
    const ok = applySaveData(data);
    if (ok) {
      const ago = Math.round((Date.now() - data.ts) / 60000);
      addLog(`📂 loaded slot ${currentSlot} (${ago}m ago, day ${gt.d})`);
    }
    // Always restore chat history from dedicated key (more messages, more reliable)
    loadHistory();
    return ok;
  } catch(e) { console.error('Load error:', e); return false; }
}

// Auto-save every hour (real time), backup every hour
let lastSaveTime = Date.now();
let lastBackupTime = Date.now();
const SAVE_INTERVAL   = 5 * 60 * 1000;  // quick save every 5 min
const BACKUP_INTERVAL = 60 * 60 * 1000; // backup every hour

function tickSave() {
  const now = Date.now();
  if (now - lastSaveTime > SAVE_INTERVAL) {
    lastSaveTime = now;
    saveGame(false);
  }
  if (now - lastBackupTime > BACKUP_INTERVAL) {
    lastBackupTime = now;
    saveGame(true);
  }
}

// ── SAVE UI ────────────────────────────────────────────────
let saveOpen = false;

function setSaveStatus(msg, color='rgba(150,220,150,0.6)') {
  const el = document.getElementById('saveStatus');
  if (el) { el.style.color = color; el.textContent = msg; }
}

function renderBackupList() {
  const container = document.getElementById('backupList');
  if (!container) return;
  let backups = [];
  try { backups = JSON.parse(localStorage.getItem(getBackupKey()) || '[]'); } catch(e){}

  if (!backups.length) {
    container.innerHTML = '<div class="no-backups">no backups yet</div>';
    return;
  }

  container.innerHTML = [...backups].reverse().map((b, i) => {
    const d = new Date(b.ts);
    const label = d.toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
    let meta = '';
    try {
      const bd = JSON.parse(b.json);
      meta = `day ${bd.gt?.d || 0} · ${Object.values(bd.skills||{}).reduce((a,s)=>a+s.level,0)} total lvl`;
    } catch(e) {}
    return `<div class="backup-row">
      <div class="backup-info">
        <div class="backup-time">${label}</div>
        <div class="backup-meta">${meta}</div>
      </div>
      <button class="backup-restore" onclick="restoreBackup(${backups.length - 1 - i})">RESTORE</button>
    </div>`;
  }).join('');
}

function manualSave() {
  saveGame(false);
  setSaveStatus('✓ saved — ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}));
  renderBackupList();
}

function manualBackup() {
  saveGame(true);
  setSaveStatus('✓ backup created');
  renderBackupList();
}

function confirmClear() {
  setSaveStatus('click CLEAR again to confirm', 'rgba(255,140,100,0.7)');
  const btn = document.querySelector('.sv-btn.clear');
  if (!btn) return;
  btn.textContent = '⚠ CONFIRM';
  btn.onclick = () => {
    localStorage.removeItem(getSaveKey());
    localStorage.removeItem(getBackupKey());
    setSaveStatus('save cleared. restart to reset.', 'rgba(255,120,100,0.6)');
    btn.textContent = '🗑 CLEAR';
    btn.onclick = confirmClear;
    renderBackupList();
  };
  setTimeout(() => {
    if (btn.textContent === '⚠ CONFIRM') {
      btn.textContent = '🗑 CLEAR'; btn.onclick = confirmClear;
      setSaveStatus('');
    }
  }, 4000);
}

function restoreBackup(index) {
  try {
    const backups = JSON.parse(localStorage.getItem(getBackupKey()) || '[]');
    const b = backups[index];
    if (!b) return;
    const data = JSON.parse(b.json);
    const ok = applySaveData(data);
    if (ok) {
      drawWorld(); updateHUD();
      setSaveStatus(`✓ restored from ${new Date(b.ts).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}`);
      addLog('📂 backup restored');
      // Trigger fresh decision after restore
      decisionTimer = 0;
    }
  } catch(e) { setSaveStatus('restore failed', 'rgba(255,100,100,0.7)'); }
}

// Toggle save panel
document.getElementById('saveBtn').addEventListener('click', () => {
  saveOpen = !saveOpen;
  document.getElementById('savePanel').classList.toggle('open', saveOpen);
  document.getElementById('saveBtn').textContent = saveOpen ? '✕' : '💾';
  if (saveOpen) { renderBackupList(); setSaveStatus(''); }
});
document.getElementById('saveClose').addEventListener('click', () => {
  saveOpen = false;
  document.getElementById('savePanel').classList.remove('open');
  document.getElementById('saveBtn').textContent = '💾';
});
// ── GAME BOOT — called by title screen after player chooses ───
function startGame(fromSave) {
  const hasSave = fromSave ? loadGame() : false;
  // For save loads, stop homescreen music now.
  // For new games, tutorial's finish() handles it so music plays through the walkthrough.
  if (typeof stopHomeBgm === 'function') stopHomeBgm();
  if (!hasSave) {
    char.wx = 760; char.wy = FLOOR_Y;
    camX = 200;
    playerMoney = 0;
  }

  // Hard-reset scene visibility
  document.getElementById('scene2').style.display       = 'none';
  document.getElementById('minesScene').style.display   = 'none';
  document.getElementById('downtownScene').style.display = 'none';
  document.getElementById('scroll').style.display       = 'block';
  document.getElementById('char').style.display         = 'block';

  drawWorld();
  updateCamera();
  drawChar();
  updateHUD();
  updateMoneyDisplay();

  lastNeedSecond = Date.now();
  arcTimer       = 180 + Math.random() * 300;
  decisionTimer  = 5;

  initMusicPanel();
  initInv(hasSave);   // pass flag so initInv only seeds items on new game
  initEquip();
  initCraft();
  initMinesTutorial();
  if (typeof initQuests === 'function') initQuests();
  if (!hasSave) {
    giveStarterGear();
    // Block game BGM immediately — no gap before tutorial fires
    window.tutorialActive = true;
    // Always clear seen-key so tutorial shows on every new game
    localStorage.removeItem('pixel_tutorial_seen');
    setTimeout(() => { if (typeof showTutorial === 'function') showTutorial(); }, 1800);
  }

  setTimeout(async () => {
    let prompt;
    if (hasSave) {
      let agoMin = 0;
      try { agoMin = Math.round((Date.now() - JSON.parse(localStorage.getItem(getSaveKey())||'{}').ts) / 60000); } catch(e){}
      prompt = `You just loaded back in after being away for ${agoMin} minutes. Welcome the user back in 1 brief sentence. You were: ${char.action} at ${char.loc}.`;
    } else {
      prompt = `First time starting. Introduce yourself in 1 sentence — you're Pixel, you live here.`;
    }
    const r = await callAI(prompt, true);
    showSpeech(r || (hasSave ? "you're back." : "oh. you can see me?"), 7000, true);
  }, 1400);

  loop();
}

// ════════════════════════════════════════════════════════════
