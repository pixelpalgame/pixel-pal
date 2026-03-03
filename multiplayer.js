// ════════════════════════════════════════════════════════════
// PIXEL PAL — Client-side Multiplayer Manager
// Requires Socket.IO client to be loaded before this script.
// ════════════════════════════════════════════════════════════

const mp = (function () {

  // ── State flags ──────────────────────────────────────────────
  let _socket       = null;
  let _isConnected  = false;
  let _inRoom       = false;
  let _isHost       = false;
  let _roomCode     = '';

  // ── Throttle timers ──────────────────────────────────────────
  let _lastPlayerStateSend = 0;
  let _lastBossStateSend   = 0;
  const PLAYER_STATE_INTERVAL = 50;  // ms — ~20/s
  const BOSS_STATE_INTERVAL   = 50;  // ms — ~20/s

  // ── Callbacks ────────────────────────────────────────────────
  const _cb = {
    remotePlayerState : null,
    bossState         : null,
    hitBoss           : null,
    bossHitGuest      : null,
    arenaEnter        : null,
    arenaLeave        : null,
    roomReady         : null,
    playerLeft        : null,
  };

  // ── Remote player interpolation state ────────────────────────
  const remotePlayer = {
    x: 0, y: 0,
    targetX: 0, targetY: 0,
    facing: 1,
    action: 'idle',
    hp: 100, maxHp: 100,
    visible: false,
  };

  // ── Interpolation tick (call every frame) ────────────────────
  function tickInterpolation() {
    if (!_inRoom || !remotePlayer.visible) return;
    remotePlayer.x += (remotePlayer.targetX - remotePlayer.x) * 0.22;
    remotePlayer.y += (remotePlayer.targetY - remotePlayer.y) * 0.22;
  }

  // ── Connection ───────────────────────────────────────────────
  function connect(serverUrl) {
    return new Promise((resolve, reject) => {
      if (typeof io === 'undefined') {
        reject(new Error('Socket.IO not loaded'));
        return;
      }
      if (_socket && _isConnected) { resolve(); return; }

      _socket = io(serverUrl, { transports: ['websocket', 'polling'] });

      _socket.on('connect', () => {
        _isConnected = true;
        _updateStatusBar();
        console.log('[mp] connected to server');
        resolve();
      });

      _socket.on('connect_error', (err) => {
        _isConnected = false;
        _updateStatusBar();
        reject(err);
      });

      _socket.on('disconnect', () => {
        _isConnected = false;
        _inRoom      = false;
        remotePlayer.visible = false;
        _updateStatusBar();
        console.log('[mp] disconnected');
      });

      // ── Server → client events ─────────────────────────────
      _socket.on('room_code', ({ code }) => {
        _roomCode = code;
        _updateLobbyCode(code);
        console.log(`[mp] room created: ${code}`);
      });

      _socket.on('room_ready', ({ role }) => {
        _isHost = role === 'host';
        _inRoom = true;
        remotePlayer.visible = true;
        _updateStatusBar();
        _closeLobby();
        console.log(`[mp] room ready — role: ${role}`);
        if (_cb.roomReady) _cb.roomReady({ role });
      });

      _socket.on('join_failed', ({ reason }) => {
        _showLobbyError(reason);
      });

      _socket.on('player_left', () => {
        _inRoom = false;
        remotePlayer.visible = false;
        _updateStatusBar();
        console.log('[mp] remote player left');
        _showDisconnectOverlay();
        if (_cb.playerLeft) _cb.playerLeft();
      });

      // ── Relayed game events ────────────────────────────────
      _socket.on('player_state', (state) => {
        remotePlayer.targetX  = state.x;
        remotePlayer.targetY  = state.y;
        remotePlayer.facing   = state.facing ?? 1;
        remotePlayer.action   = state.action  ?? 'idle';
        remotePlayer.hp       = state.hp      ?? 100;
        remotePlayer.maxHp    = state.maxHp   ?? 100;
        if (_cb.remotePlayerState) _cb.remotePlayerState(state);
      });

      _socket.on('boss_state', (state) => {
        if (_cb.bossState) _cb.bossState(state);
      });

      _socket.on('hit_boss', ({ damage }) => {
        if (_cb.hitBoss) _cb.hitBoss(damage);
      });

      _socket.on('boss_hit_guest', ({ damage }) => {
        if (_cb.bossHitGuest) _cb.bossHitGuest(damage);
      });

      _socket.on('arena_enter', () => {
        if (_cb.arenaEnter) _cb.arenaEnter();
      });

      _socket.on('arena_leave', () => {
        if (_cb.arenaLeave) _cb.arenaLeave();
      });
    });
  }

  // ── Room management ──────────────────────────────────────────
  function createRoom() {
    if (!_isConnected) return Promise.reject('Not connected');
    return new Promise((resolve) => {
      _socket.once('room_code', ({ code }) => resolve(code));
      _socket.emit('create_room');
    });
  }

  function joinRoom(code) {
    if (!_isConnected) return Promise.reject('Not connected');
    return new Promise((resolve, reject) => {
      function onReady()   { cleanup(); resolve(true);  }
      function onFailed(e) { cleanup(); reject(e.reason); }
      function cleanup() {
        _socket.off('room_ready',   onReady);
        _socket.off('join_failed',  onFailed);
      }
      _socket.once('room_ready',  onReady);
      _socket.once('join_failed', onFailed);
      _socket.emit('join_room', { code: code.toUpperCase().trim() });
    });
  }

  // ── Send helpers ─────────────────────────────────────────────
  function sendPlayerState(stateObj) {
    if (!_inRoom || !_socket) return;
    const now = Date.now();
    if (now - _lastPlayerStateSend < PLAYER_STATE_INTERVAL) return;
    _lastPlayerStateSend = now;
    _socket.emit('player_state', stateObj);
  }

  function sendBossState(stateObj) {
    if (!_inRoom || !_isHost || !_socket) return;
    const now = Date.now();
    if (now - _lastBossStateSend < BOSS_STATE_INTERVAL) return;
    _lastBossStateSend = now;
    _socket.emit('boss_state', stateObj);
  }

  function sendHitBoss(damage) {
    if (!_inRoom || _isHost || !_socket) return;
    _socket.emit('hit_boss', { damage });
  }

  function sendBossHitGuest(damage) {
    if (!_inRoom || !_isHost || !_socket) return;
    _socket.emit('boss_hit_guest', { damage });
  }

  function sendArenaEvent(type) {
    if (!_inRoom || !_socket) return;
    _socket.emit(type === 'enter' ? 'arena_enter' : 'arena_leave');
  }

  // ── Callback setters ─────────────────────────────────────────
  function onRemotePlayerState(cb) { _cb.remotePlayerState = cb; }
  function onBossState(cb)         { _cb.bossState         = cb; }
  function onHitBoss(cb)           { _cb.hitBoss           = cb; }
  function onBossHitGuest(cb)      { _cb.bossHitGuest      = cb; }
  function onRoomReady(cb)         { _cb.roomReady         = cb; }
  function onPlayerLeft(cb)        { _cb.playerLeft        = cb; }

  // ── UI helpers ───────────────────────────────────────────────
  function _updateStatusBar() {
    const bar = document.getElementById('mpStatusBar');
    if (!bar) return;
    if (!_isConnected) {
      bar.innerHTML = '<span class="mp-dot mp-dot-off"></span> OFFLINE';
      bar.style.display = 'none';
      return;
    }
    bar.style.display = 'flex';
    if (!_inRoom) {
      bar.innerHTML = '<span class="mp-dot mp-dot-on"></span> CONNECTED · NO ROOM';
    } else {
      const role = _isHost ? 'HOST' : 'GUEST';
      bar.innerHTML =
        `<span class="mp-dot mp-dot-on"></span> ${role} · ${_roomCode} &nbsp;` +
        `<span id="mpP2Hp">P2: ${remotePlayer.hp}/${remotePlayer.maxHp}</span>`;
    }
  }

  function _updateLobbyCode(code) {
    const el = document.getElementById('mpLobbyCode');
    if (el) el.textContent = code;
    const waitEl = document.getElementById('mpLobbyWait');
    if (waitEl) waitEl.style.display = 'block';
  }

  function _showLobbyError(msg) {
    const el = document.getElementById('mpLobbyError');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  function _closeLobby() {
    const overlay = document.getElementById('mpLobbyOverlay');
    if (overlay) overlay.style.display = 'none';
    _updateStatusBar();
  }

  function _showDisconnectOverlay() {
    const el = document.getElementById('mpDisconnectOverlay');
    if (el) el.style.display = 'flex';
  }

  // ── Force-disconnect (so guest can reconnect to a different server) ──
  function _forceDisconnect() {
    if (_socket) { _socket.disconnect(); _socket = null; }
    _isConnected = false; _inRoom = false;
    remotePlayer.visible = false;
  }

  // ── Public interface ─────────────────────────────────────────
  return {
    get isConnected()  { return _isConnected; },
    get inRoom()       { return _inRoom; },
    get isHost()       { return _isHost; },
    get roomCode()     { return _roomCode; },
    remotePlayer,
    tickInterpolation,
    connect,
    createRoom,
    joinRoom,
    _forceDisconnect,
    sendPlayerState,
    sendBossState,
    sendHitBoss,
    sendBossHitGuest,
    sendArenaEvent,
    onRemotePlayerState,
    onBossState,
    onHitBoss,
    onBossHitGuest,
    onRoomReady,
    onPlayerLeft,
    updateStatusBar: _updateStatusBar,
  };
})();

// ── Lobby UI wiring ───────────────────────────────────────────
(function () {
  const HOST_SERVER_URL = 'http://localhost:3001';

  function lobbyInit() {
    const connectBtn  = document.getElementById('mpConnectBtn');
    const overlay     = document.getElementById('mpLobbyOverlay');
    const closeBtn    = document.getElementById('mpLobbyClose');
    const tabHost     = document.getElementById('mpTabHost');
    const tabJoin     = document.getElementById('mpTabJoin');
    const hostPane    = document.getElementById('mpHostPane');
    const joinPane    = document.getElementById('mpJoinPane');
    const createBtn   = document.getElementById('mpCreateBtn');
    const copyBtn     = document.getElementById('mpCopyCodeBtn');
    const joinBtn     = document.getElementById('mpJoinBtn');
    const joinInput   = document.getElementById('mpJoinInput');
    const hostIpInput = document.getElementById('mpHostIpInput');
    const dismissDC   = document.getElementById('mpDismissDisconnect');

    if (!connectBtn) return;

    function showErr(msg) {
      const el = document.getElementById('mpLobbyError');
      if (el) { el.textContent = msg; el.style.display = 'block'; }
    }
    function hideErr() {
      const el = document.getElementById('mpLobbyError');
      if (el) el.style.display = 'none';
    }

    // Open lobby — just show the overlay, don't connect yet
    connectBtn.addEventListener('click', () => {
      overlay.style.display = 'flex';
      hideErr();
    });

    // Close lobby
    if (closeBtn) closeBtn.addEventListener('click', () => { overlay.style.display = 'none'; });

    // Tab switching
    if (tabHost) tabHost.addEventListener('click', () => {
      tabHost.classList.add('active'); tabJoin.classList.remove('active');
      hostPane.style.display = 'block'; joinPane.style.display = 'none';
      hideErr();
    });
    if (tabJoin) tabJoin.addEventListener('click', () => {
      tabJoin.classList.add('active'); tabHost.classList.remove('active');
      joinPane.style.display = 'block'; hostPane.style.display = 'none';
      hideErr();
    });

    // Create room — connect to local server, then create
    if (createBtn) createBtn.addEventListener('click', async () => {
      hideErr();
      createBtn.disabled = true;
      try {
        if (!mp.isConnected) await mp.connect(HOST_SERVER_URL);
        const code = await mp.createRoom();
        document.getElementById('mpLobbyCode').textContent = code;
        document.getElementById('mpLobbyWait').style.display = 'block';
        connectBtn.textContent = '🌐 ONLINE';
      } catch (e) {
        showErr('Cannot reach co-op server. Make sure LAUNCH_GAME.bat is running.');
        connectBtn.textContent = '🌐 PLAY ONLINE';
      }
      createBtn.disabled = false;
    });

    // Copy code
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const code = document.getElementById('mpLobbyCode').textContent;
      if (code && code !== '——————') {
        navigator.clipboard.writeText(code).catch(() => {});
        copyBtn.textContent = 'COPIED!';
        setTimeout(() => { copyBtn.textContent = '📋 COPY'; }, 1500);
      }
    });

    // Join room — connect to host's IP, then join
    if (joinBtn) joinBtn.addEventListener('click', async () => {
      const code = joinInput ? joinInput.value.trim() : '';
      if (!code) { showErr('Enter the room code.'); return; }
      const ip   = hostIpInput ? hostIpInput.value.trim() : '';
      const url  = ip ? `http://${ip}:3001` : HOST_SERVER_URL;
      hideErr();
      joinBtn.disabled = true;
      try {
        // Always reconnect when joining — guest may need a different server address
        if (mp.isConnected) mp._forceDisconnect && mp._forceDisconnect();
        await mp.connect(url);
        await mp.joinRoom(code);
        connectBtn.textContent = '🌐 ONLINE';
      } catch (reason) {
        showErr(typeof reason === 'string' ? reason : 'Cannot reach that server. Check the IP and try again.');
      }
      joinBtn.disabled = false;
    });

    // Allow pressing Enter in join inputs
    if (joinInput)   joinInput.addEventListener('keydown',   (e) => { if (e.key === 'Enter') joinBtn.click(); });
    if (hostIpInput) hostIpInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinBtn.click(); });

    // Dismiss disconnect overlay
    if (dismissDC) dismissDC.addEventListener('click', () => {
      document.getElementById('mpDisconnectOverlay').style.display = 'none';
    });
  }

  function detectMyIp() {
    const el = document.getElementById('mpMyIp');
    if (!el) return;
    // window.location.hostname is the LAN IP when accessed via network,
    // or 'localhost' / '127.0.0.1' when opened locally.
    const h = window.location.hostname;
    if (h && h !== 'localhost' && h !== '127.0.0.1') {
      el.textContent = h;
    } else {
      // Try WebRTC to find LAN IP
      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        pc.createOffer().then(o => pc.setLocalDescription(o));
        pc.onicecandidate = e => {
          if (!e || !e.candidate) return;
          const m = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
          if (m && !m[1].startsWith('127.')) {
            el.textContent = m[1];
            pc.close();
          }
        };
      } catch (_) {
        el.textContent = 'run ipconfig to find your IP';
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { lobbyInit(); detectMyIp(); });
  } else {
    lobbyInit();
    detectMyIp();
  }
})();
