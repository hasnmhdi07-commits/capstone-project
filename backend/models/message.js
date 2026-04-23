const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  houseId: { type: mongoose.Schema.Types.ObjectId, ref: "House", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Owner
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },    // User
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);
