const { Server } = require("socket.io");

let io;

/**
 * Room registry: Map<roomId, Map<socketId, { userId, micOn, cameraOn }>>
 * Server-side tracking of who is in each room with their media state.
 */
const rooms = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("[Socket] Connected:", socket.id);

    // ─── JOIN ROOM ───────────────────────────────────────────────────────
    // 1. Register user in the room registry
    // 2. Send the joiner a list of existing users so they can initiate peers
    // 3. Notify existing users about the new joiner
    socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);

      // Store the roomId on the socket for disconnect cleanup
      socket._roomId = roomId;
      socket._userId = userId;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }

      const room = rooms.get(roomId);

      // Build list of existing users BEFORE adding the new user
      const existingUsers = [];
      for (const [sid, meta] of room.entries()) {
        existingUsers.push({
          socketId: sid,
          userId: meta.userId,
          micOn: meta.micOn,
          cameraOn: meta.cameraOn,
        });
      }

      // Add the new user to the registry
      room.set(socket.id, {
        userId,
        micOn: true,
        cameraOn: true,
      });

      console.log(`[Socket] User ${userId} (${socket.id}) joined room ${roomId}. Room size: ${room.size}`);

      // Send the joiner the list of who is already in the room
      // The joiner will create initiator peers for each existing user
      socket.emit("room-users", existingUsers);

      // Notify existing users about the new joiner
      // They will wait for the joiner's signal (they act as receivers)
      socket.to(roomId).emit("user-joined", userId, socket.id);
    });

    // ─── SIGNALING (simple-peer) ─────────────────────────────────────────
    // Single signaling path: sender -> server -> target
    socket.on("signal", (payload) => {
      io.to(payload.target).emit("signal", {
        signal: payload.signal,
        sender: socket.id,
        userId: payload.userId,
      });
    });

    // ─── MIC / CAMERA TOGGLES ────────────────────────────────────────────
    socket.on("mic-toggle", (roomId, micOn) => {
      // Update registry
      const room = rooms.get(roomId);
      if (room && room.has(socket.id)) {
        room.get(socket.id).micOn = micOn;
      }
      socket.to(roomId).emit("remote-mic-toggle", {
        socketId: socket.id,
        micOn,
      });
    });

    socket.on("camera-toggle", (roomId, cameraOn) => {
      const room = rooms.get(roomId);
      if (room && room.has(socket.id)) {
        room.get(socket.id).cameraOn = cameraOn;
      }
      socket.to(roomId).emit("remote-camera-toggle", {
        socketId: socket.id,
        cameraOn,
      });
    });

    // ─── SCREEN SHARE ────────────────────────────────────────────────────
    socket.on("screen-share-toggle", (roomId, isSharing) => {
      socket.to(roomId).emit("remote-screen-share-toggle", {
        socketId: socket.id,
        isSharing,
      });
    });

    // ─── CHAT ────────────────────────────────────────────────────────────
    socket.on("send-chat-message", (roomId, message) => {
      // Broadcast to everyone in the room INCLUDING the sender
      io.in(roomId).emit("chat-message", message);
    });

    // ─── EXPLICIT LEAVE ──────────────────────────────────────────────────
    socket.on("leave-room", (roomId) => {
      console.log(`[Socket] User ${socket.id} explicitly left room ${roomId}`);
      removeFromRoom(socket, roomId);
      socket.leave(roomId);
      socket.to(roomId).emit("user-disconnected", socket.id);
    });

    // ─── DISCONNECT (browser close, network loss) ────────────────────────
    socket.on("disconnecting", () => {
      console.log("[Socket] Disconnecting:", socket.id);
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          removeFromRoom(socket, roomId);
          socket.to(roomId).emit("user-disconnected", socket.id);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected:", socket.id);
    });
  });

  return io;
};

/**
 * Remove a socket from the room registry. Clean up empty rooms.
 */
function removeFromRoom(socket, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.delete(socket.id);
  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`[Socket] Room ${roomId} is now empty, removed from registry`);
  }
}

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIo };
