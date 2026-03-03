// ════════════════════════════════════════════════════════════
// ADMIN MODE  —  F10 to toggle (password required first time)
// Bypasses: crafting level gates, resource requirements,
//           pickaxe lock, success rolls, skill level checks.
// ════════════════════════════════════════════════════════════

let adminMode      = false;
let _adminUnlocked = false;
const _ADMIN_PW    = 'FUCKYA';

document.addEventListener('keydown', e => {
  if (e.key !== 'F10') return;
  e.preventDefault();

  if (!_adminUnlocked) {
    const pw = prompt('⚙ ADMIN PASSWORD:');
    if (pw === null) return;               // cancelled
    if (pw !== _ADMIN_PW) {
      alert('✗ Wrong password.');
      return;
    }
    _adminUnlocked = true;
  }

  adminMode = !adminMode;
  _syncAdminState();
});

function _syncAdminState() {
  // Badge visibility
  const badge = document.getElementById('adminBadge');
  if (badge) badge.style.display = adminMode ? 'flex' : 'none';

  if (adminMode) {
    // Force crafting unlocked
    if (typeof craftingUnlocked !== 'undefined') craftingUnlocked = true;
    const hudBtn = document.getElementById('craftHudBtn');
    if (hudBtn) hudBtn.classList.remove('craft-hud-locked');

    // Force pickaxe gate open
    if (typeof pickaxeCrafted !== 'undefined') {
      // pickaxeCrafted is let in crafting.js — set via eval-safe assignment
      try { pickaxeCrafted = true; } catch(e) {}
    }

    // Refresh craft panel if open to clear locks
    if (typeof craftOpen !== 'undefined' && craftOpen && typeof renderCraftList === 'function') {
      renderCraftList();
    }

    addLog('⚙ ADMIN MODE ON — all locks bypassed');
  } else {
    addLog('⚙ ADMIN MODE OFF');
  }
}
