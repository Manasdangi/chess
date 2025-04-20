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
const roomPlayerCount = new Map<string, number>();
const roomPlayers = new Map<string, string[]>();

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("checkRoom", (roomId: string, callback: (exists: boolean) => void) => {
    const exists = activeRooms.has(roomId);
    if(!exists) {
      console.log("room does not exist");
      callback(false);
    } else {
      console.log("room exists");
      callback(true);
    }
  });

  socket.on("joinRoom", (roomId: string) => {
    console.log("joinRoom", roomId);
    
    const currentCount = roomPlayerCount.get(roomId) || 0;
    const currentPlayers = roomPlayers.get(roomId) || [];
    
    // Handle room full case
    if (currentCount >= 2) {
      socket.emit("roomFull", { 
        message: "Room is full. Maximum 2 players allowed.",
        userId: socket.id
      });
      return;
    }  

    // Handle already in room case
    if (currentPlayers.includes(socket.id)) {
      socket.emit("alreadyInRoom", {
        message: "You are already in this room",
        isCreator: currentPlayers[0] === socket.id,
        playerCount: currentCount,
        userId: socket.id
      });
      return;
    }

    // Join the room
    socket.join(roomId);
    roomPlayers.set(roomId, [...currentPlayers, socket.id]);
    const newCount = currentCount + 1;
    roomPlayerCount.set(roomId, newCount);
    
    const isCreator = newCount === 1;
    if (isCreator) {
      roomCreators.set(roomId, socket.id);
      activeRooms.add(roomId);
    }

    // Notify the joining player
    socket.emit("roomJoined", { 
      message: isCreator ? "Room created successfully!" : "Joined room successfully!",
      isCreator,
      playerCount: newCount,
      userId: socket.id
    });

    // If second player joined, notify the first player
    if (newCount === 2) {
      const firstPlayerId = currentPlayers[0];
      if (firstPlayerId) {
        io.to(firstPlayerId).emit("opponentJoined", {
          message: "Your opponent has joined the room!",
          playerCount: newCount,
          userId: firstPlayerId
        });
      }
    }
  });

  // Handle moves and send to opponent
  socket.on("move", ({ roomId, move, playerId }: { roomId: string; move: Move; playerId: string }) => {
    socket.to(roomId).emit("opponentMove", move);
    console.log(`🎯 Move in ${roomId} by ${playerId}: ${move.piece} ${move.from} → ${move.to}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        const count = (roomPlayerCount.get(room) || 1) - 1;
        roomPlayerCount.set(room, count);
        if (count === 0) {
          activeRooms.delete(room);
          roomCreators.delete(room);
          roomPlayerCount.delete(room);
          roomPlayers.delete(room);
        }
      }
    });
  });
});

// Start the server
server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});
