// src/sockets/socket.ts
import { io } from "socket.io-client";

const socket = io("http://localhost:3001"); // change in prod

export default socket;
