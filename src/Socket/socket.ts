// src/sockets/socket.ts
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://chess-backend-gbxl.onrender.com'; //|| 'http://localhost:3001';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
