const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const houseRoutes = require("./routes/houseRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const reportRoutes = require("./routes/reportRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());

// ── AUTO-CREATE uploads DIR ───────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}
app.use("/uploads", express.static(uploadsDir));

// ── HTTP SERVER + SOCKET.IO ───────────────────────────────────────────────────
// We wrap express in an http.Server so Socket.io can share the same port.
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ── SOCKET.IO REAL-TIME LOGIC ─────────────────────────────────────────────────
// Each user joins a personal room named after their MongoDB _id.
// When a message is sent via the REST API, the message controller emits
// an event to the owner's room so they see it instantly.
//
// We attach `io` to `app` so controllers can access it via `req.app.get("io")`.
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Client calls this right after connecting, passing their userId
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined room: ${userId}`);
    }
  });

  // Client joins a specific house chat room (for tenant ↔ owner live chat)
  socket.on("joinHouseChat", ({ houseId, userId }) => {
    const room = `house_${houseId}`;
    socket.join(room);
    console.log(`${userId} joined house chat room: ${room}`);
  });

  // Relay a typing indicator to the other party in the chat room
  socket.on("typing", ({ houseId, senderName, isTyping }) => {
    const room = `house_${houseId}`;
    socket.to(room).emit("typing", { senderName, isTyping });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/houses", favoriteRoutes);
app.use("/api/houses", houseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend is running", env: process.env.NODE_ENV });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// ── MONGODB ───────────────────────────────────────────────────────────────────
if (!process.env.MONGO_URI) {
  console.error("FATAL: MONGO_URI environment variable is not set");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

mongoose.connection.on("connected", () => {
  console.log("Connected to DB:", mongoose.connection.name);
});

// ── START ─────────────────────────────────────────────────────────────────────
// Use `server.listen` (not `app.listen`) so Socket.io shares the same port.
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server + Socket.io running on port ${PORT}`));
