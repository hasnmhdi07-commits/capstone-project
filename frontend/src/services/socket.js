import { io } from "socket.io-client";

// ── SOCKET SERVICE ────────────────────────────────────────────────────────────
// Creates a single persistent socket connection for the whole app.
// Import `socket` anywhere you need real-time events.
//
// Usage:
//   import socket from "../services/socket";
//   socket.emit("join", userId);
//   socket.on("newMessage", (msg) => { ... });

const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

const socket = io(BASE_URL, {
  autoConnect: false,   // We connect manually after login so we can pass the userId
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

/**
 * Connect the socket and join the user's personal room.
 * Call this after a successful login.
 * @param {string} userId  – MongoDB _id of the logged-in user
 */
export function connectSocket(userId) {
  if (!socket.connected) {
    socket.connect();
  }
  socket.emit("join", userId);
}

/**
 * Disconnect the socket.
 * Call this on logout.
 */
export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

export default socket;
