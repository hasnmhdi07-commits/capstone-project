const express = require("express");
const router = express.Router();
const { sendMessage, getReceivedMessages, getHouseMessages, markAsRead, deleteMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

// Send message to house owner (user route)
router.post("/", protect, sendMessage);

// Get all messages received by owner
router.get("/received", protect, getReceivedMessages);

// Get messages for specific house (owner only)
router.get("/house/:houseId", protect, getHouseMessages);

// Mark message as read
router.patch("/:messageId/read", protect, markAsRead);

// Delete message
router.delete("/:messageId", protect, deleteMessage);

module.exports = router;
