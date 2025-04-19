import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import type { Move } from "../src/types/chess";

// Setup express app
const app = express();


// Create HTTP server from express app
const server = createServer(app);

// Create socket.io server with CORS settings
// Express CORS
app.use(cors({ origin: "*", credentials: true }));

// Socket.IO CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});


// Store active room IDs and their creators
export const activeRooms = new Set<string>();
const roomCreators = new Map<string, string>();

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("checkRoom", (roomId: string, callback: (exists: boolean) => void) => {
    callback(activeRooms.has(roomId));
  });

  socket.on("joinRoom", (roomId: string, isCreator: boolean = false) => {
    console.log("joinRoom", roomId, isCreator);
    socket.join(roomId);
    activeRooms.add(roomId);
    
    console.log("isCreator", isCreator);
    if (isCreator) {
      console.log(`👥 ${socket.id} is the creator of room ${roomId}`);
      roomCreators.set(roomId, socket.id);
    }
    
    // Get the number of players in the room before this player joined
    const room = io.sockets.adapter.rooms.get(roomId);
    
    const creatorId = roomCreators.get(roomId);
    const message = 
       isCreator
        ? "Room created successfully!"
        : "Waiting for another player to join...";
    
    console.log("creatorId", creatorId);
    io.to(roomId).emit("playerJoined", { 
      message,
      isCreator: socket.id === creatorId,

    });
  });

  // Handle moves and send to opponent
  socket.on("move", ({ roomId, move, playerId }: { roomId: string; move: Move; playerId: string }) => {
    socket.to(roomId).emit("opponentMove", move);
    console.log(`🎯 Move in ${roomId} by ${playerId}: ${move.piece} ${move.from} → ${move.to}`);
  });

  // Handle disconnects and clean up
  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    socket.rooms.forEach((room) => {
      if (room !== socket.id && !io.sockets.adapter.rooms.get(room)) {
        activeRooms.delete(room);
        roomCreators.delete(room);
      }
    });
  });
});

// Start the server
server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});
