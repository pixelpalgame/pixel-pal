// ════════════════════════════════════════════════════════════
// PIXEL PAL — Co-op Relay Server
// Pure relay: never inspects game payloads, only routes events
// between the two sockets in a room.
// ════════════════════════════════════════════════════════════

const { createServer } = require('http');
const { Server }       = require('socket.io');

const PORT = process.env.PORT || 3001;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',   // allow any origin (game is local / file://)
    methods: ['GET', 'POST'],
  },
});

// ── Room registry ─────────────────────────────────────────────
// code → { host: socketId, guest: socketId | null }
const rooms = {};

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function findRoomBySocket(id) {
  for (const [code, room] of Object.entries(rooms)) {
    if (room.host === id || room.guest === id) return { code, room };
  }
  return null;
}

// ── Relay helper ──────────────────────────────────────────────
// Emit an event to the OTHER socket in the same room
function relay(fromId, event, payload) {
  const found = findRoomBySocket(fromId);
  if (!found) return;
  const { room } = found;
  const peerId = room.host === fromId ? room.guest : room.host;
  if (!peerId) return;
  const peer = io.sockets.sockets.get(peerId);
  if (peer) peer.emit(event, payload);
}

// ── Connection handler ────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] connected: ${socket.id}`);

  // ── create_room ────────────────────────────────────────────
  socket.on('create_room', () => {
    // Clean up any existing room this socket is in
    const existing = findRoomBySocket(socket.id);
    if (existing) {
      const { code, room } = existing;
      if (room.guest) {
        const peer = io.sockets.sockets.get(room.guest);
        if (peer) peer.emit('player_left');
      }
      delete rooms[code];
    }

    let code;
    do { code = genCode(); } while (rooms[code]);

    rooms[code] = { host: socket.id, guest: null };
    socket.emit('room_code', { code });
    console.log(`[room] created: ${code} by ${socket.id}`);
  });

  // ── join_room ──────────────────────────────────────────────
  socket.on('join_room', ({ code }) => {
    const uCode = (code || '').toUpperCase().trim();
    const room  = rooms[uCode];

    if (!room) {
      socket.emit('join_failed', { reason: 'Room not found.' });
      return;
    }
    if (room.guest) {
      socket.emit('join_failed', { reason: 'Room is full.' });
      return;
    }
    if (room.host === socket.id) {
      socket.emit('join_failed', { reason: 'You are the host.' });
      return;
    }

    room.guest = socket.id;

    // Notify both players — room is ready
    const hostSocket = io.sockets.sockets.get(room.host);
    if (hostSocket) hostSocket.emit('room_ready', { role: 'host' });
    socket.emit('room_ready', { role: 'guest' });

    console.log(`[room] ${uCode} ready — host:${room.host} guest:${room.guest}`);
  });

  // ── Relay game events ──────────────────────────────────────
  // The server never inspects these payloads; it only routes them.
  const RELAY_EVENTS = [
    'player_state',
    'boss_state',
    'hit_boss',
    'boss_hit_guest',
    'arena_enter',
    'arena_leave',
  ];

  for (const ev of RELAY_EVENTS) {
    socket.on(ev, (payload) => relay(socket.id, ev, payload));
  }

  // ── disconnect ─────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] disconnected: ${socket.id}`);
    const found = findRoomBySocket(socket.id);
    if (!found) return;

    const { code, room } = found;
    const peerId = room.host === socket.id ? room.guest : room.host;
    if (peerId) {
      const peer = io.sockets.sockets.get(peerId);
      if (peer) peer.emit('player_left');
    }
    delete rooms[code];
    console.log(`[room] ${code} closed (disconnect)`);
  });
});

// ── Start ─────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`Pixel Pal relay server running on port ${PORT}`);
  console.log(`Clients should connect to: http://localhost:${PORT}`);
});
