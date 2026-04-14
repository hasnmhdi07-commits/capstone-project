const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    house: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "House",
      required: true,
    },
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
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },
  },
  { timestamps: true }
);

reportSchema.index({ house: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model("Report", reportSchema);
