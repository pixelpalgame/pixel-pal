// ════════════════════════════════════════════════════════════
// PIXEL PAL — In-game update checker
// Fetches version.json from GitHub on load; shows a banner
// if a newer version is available.
// ════════════════════════════════════════════════════════════

(function () {
  function parseVersion(str) {
    return (str || '0.0.0').split('.').map(Number);
  }
  function isNewer(remote, local) {
    for (let i = 0; i < 3; i++) {
      if ((remote[i] || 0) > (local[i] || 0)) return true;
      if ((remote[i] || 0) < (local[i] || 0)) return false;
    }
    return false;
  }

  async function checkForUpdate() {
    // Read local version.json (served by `serve` alongside the game)
    let localVersion = '0.0.0', repo = '';
    try {
      const res = await fetch('/version.json?_=' + Date.now());
      if (!res.ok) return;
      const data = await res.json();
      localVersion = data.version || '0.0.0';
      repo = data.repo || '';
    } catch { return; }

    if (!repo || repo.startsWith('YOUR_GITHUB')) return;

    // Fetch remote version.json from GitHub
    let remoteVersion = '0.0.0';
    try {
      const url = `https://raw.githubusercontent.com/${repo}/main/version.json`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      remoteVersion = data.version || '0.0.0';
    } catch { return; }

    if (!isNewer(parseVersion(remoteVersion), parseVersion(localVersion))) return;

    // Show update banner
    const banner = document.getElementById('updateBanner');
    if (!banner) return;
    banner.querySelector('#updateBannerVersion').textContent = `v${remoteVersion} available`;
    banner.style.display = 'flex';
  }

  // Run after game loads (don't block anything)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(checkForUpdate, 4000));
  } else {
    setTimeout(checkForUpdate, 4000);
  }

  // Dismiss button
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('updateBannerDismiss');
    if (btn) btn.addEventListener('click', () => {
      document.getElementById('updateBanner').style.display = 'none';
    });
  });
})();
