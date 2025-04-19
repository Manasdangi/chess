import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import type { Move } from "../src/types/chess";

// Disable deprecation warnings
process.removeAllListeners('warning');

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:5173" },
});

// ANSI color codes for better visibility
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

io.on("connection", (socket) => {
  console.log(`${colors.green}➜ Client connected: ${socket.id}${colors.reset}`);

  socket.on("joinRoom", (roomId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit("playerJoined");
    console.log(`${colors.blue}➜ ${socket.id} joined room ${roomId}${colors.reset}`);
  });

  socket.on("move", ({ roomId, move }: { roomId: string; move: Move }) => {
    socket.to(roomId).emit("opponentMove", move);
    console.log(`${colors.yellow}➜ Move in room ${roomId}: ${move.piece} from ${move.from} to ${move.to}${colors.reset}`);
  });

  socket.on("disconnect", () => {
    console.log(`${colors.yellow}➜ Client disconnected: ${socket.id}${colors.reset}`);
  });
});

console.clear(); // Clear the console first
server.listen(3001, () => {
  console.log(`${colors.green}➜ Server running on http://localhost:3001${colors.reset}`);
});
