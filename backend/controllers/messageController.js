const Message = require("../models/message");
const House = require("../models/house");

// Send a message to house owner
exports.sendMessage = async (req, res) => {
  const { houseId, message } = req.body;
  const senderId = req.user._id;
  const senderName = req.user.name;
  const senderEmail = req.user.email;

  try {
    const house = await House.findById(houseId).populate("owner");
    if (!house) return res.status(404).json({ message: "House not found" });

    const newMessage = await Message.create({
      houseId,
      receiverId: house.owner._id,
      senderId,
      senderName,
      senderEmail,
      message,
    });

    // Populate for the socket payload so both sides get full data
    const populated = await Message.findById(newMessage._id)
      .populate("houseId", "title location")
      .populate("senderId", "name email");

    // ── REAL-TIME: emit to owner's personal room ──────────────────────────────
    // The owner's room is named after their _id (they join it on connect).
    const io = req.app.get("io");
    if (io) {
      io.to(house.owner._id.toString()).emit("newMessage", populated);
    }

    // ── REAL-TIME: emit to the house chat room ────────────────────────────────
    // Both the tenant and owner join room `house_<houseId>` for live chat.
    if (io) {
      io.to(`house_${houseId}`).emit("chatMessage", {
        _id: populated._id,
        message: populated.message,
        senderName: populated.senderName,
        senderEmail: populated.senderEmail,
        senderId: populated.senderId?._id || senderId,
        createdAt: populated.createdAt,
        isRead: false,
      });
    }

    res.status(201).json({ message: "Message sent successfully", data: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all messages received by owner (for their properties)
exports.getReceivedMessages = async (req, res) => {
  try {
    const messages = await Message.find({ receiverId: req.user._id })
      .populate("houseId", "title location")
      .populate("senderId", "name email")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all messages for a specific house (used to load chat history)
exports.getHouseMessages = async (req, res) => {
  try {
    const { houseId } = req.params;
    const house = await House.findById(houseId);

    if (!house) return res.status(404).json({ message: "House not found" });

    // Allow both the owner AND the tenant who sent messages to read them
    const messages = await Message.find({
      houseId,
      $or: [
        { receiverId: req.user._id },
        { senderId: req.user._id },
      ],
    })
      .populate("senderId", "name email")
      .sort({ createdAt: 1 }); // ascending for chat display

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: "Message marked as read", data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Message.findByIdAndDelete(messageId);
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
