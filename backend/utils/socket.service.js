const { Server } = require("socket.io");

let io;

// Track which rooms each socket has joined
const socketRooms = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);
      console.log(`User ${userId} (socket: ${socket.id}) joined room ${roomId}`);

      // Track rooms this socket has joined
      if (!socketRooms.has(socket.id)) {
        socketRooms.set(socket.id, new Set());
      }
      socketRooms.get(socket.id).add(roomId);

      // Store userId on the socket for later use
      socket.userId = userId;

      // Notify others in the room
      socket.to(roomId).emit("user-joined", userId, socket.id);
    });

    socket.on("offer", (payload) => {
      io.to(payload.target).emit("offer", {
        offer: payload.offer,
        sender: socket.id,
        userId: payload.userId
      });
    });

    socket.on("answer", (payload) => {
      io.to(payload.target).emit("answer", {
        answer: payload.answer,
        sender: socket.id
      });
    });

    socket.on("ice-candidate", (payload) => {
      io.to(payload.target).emit("ice-candidate", {
        candidate: payload.candidate,
        sender: socket.id
      });
    });

    socket.on("signal", (payload) => {
      io.to(payload.target).emit("signal", {
        signal: payload.signal,
        sender: socket.id,
        userId: payload.userId
      });
    });

    socket.on("send-chat-message", (roomId, message) => {
      io.to(roomId).emit("chat-message", message);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      // Only emit user-disconnected to rooms this socket was in
      const rooms = socketRooms.get(socket.id);
      if (rooms) {
        rooms.forEach((roomId) => {
          socket.to(roomId).emit("user-disconnected", socket.id);
        });
        socketRooms.delete(socket.id);
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIo };
