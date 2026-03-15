const { Server } = require("socket.io");

let io;

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
      console.log(`User ${userId} joined room ${roomId}`);
      
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

    socket.on("leave-room", (roomId) => {
      console.log(`User ${socket.id} explicitly left room ${roomId}`);
      socket.leave(roomId);
      socket.to(roomId).emit("user-disconnected", socket.id);
    });

    socket.on("screen-share-toggle", (roomId, isSharing) => {
      socket.to(roomId).emit("remote-screen-share-toggle", {
        socketId: socket.id,
        isSharing
      });
    });

    socket.on("send-chat-message", (roomId, message) => {
      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(roomId).emit("chat-message", message);
      // Also send to sender so they see their own message
      socket.emit("chat-message", message);
    });

    socket.on("disconnecting", () => {
      console.log("Client disconnecting:", socket.id);
      // Notify rooms this socket was part of before they are cleared
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          socket.to(roomId).emit("user-disconnected", socket.id);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
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
