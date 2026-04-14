const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const houseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  rent: { type: Number, required: true },
  rooms: { type: Number, required: true },
  facilities: [{ type: String }],
  address: { type: String, required: true },
  images: [{ type: String }],
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  house_status: {
    type: String,
    enum: ["available", "rented"],
    default: "available",
  },
  reports: [reportSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("House", houseSchema);