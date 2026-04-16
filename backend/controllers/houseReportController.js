const House = require("../models/house");

// Report House Listings
exports.reportHouse = async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "Reason is required" });
  }

  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: "House not found" });

    const alreadyReported = house.reports.some(
      (report) => report.reportedBy.toString() === req.user._id.toString()
    );
    if (alreadyReported) {
      return res.status(400).json({ message: "You already reported this listing" });
    }

    house.reports.push({
      reportedBy: req.user._id,
      reason: reason.trim(),
    });
    await house.save();

    return res.status(201).json({ message: "House reported successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
