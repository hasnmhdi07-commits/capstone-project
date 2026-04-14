const House = require("../models/house");
const User = require("../models/user");
const Report = require("../models/report");

exports.createReport = async (req, res) => {
  const { houseId } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "Reason is required" });
  }

  try {
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    const existingReport = await Report.findOne({
      house: houseId,
      reportedBy: req.user._id,
    });
    if (existingReport) {
      return res
        .status(400)
        .json({ message: "You already reported this listing" });
    }

    const report = await Report.create({
      house: houseId,
      reportedBy: req.user._id,
      reason: reason.trim(),
    });

    return res.status(201).json(report);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getReportedHouses = async (req, res) => {
  try {
    const reportGroups = await Report.aggregate([
      { $match: { status: "open" } },
      {
        $group: {
          _id: "$house",
          reportCount: { $sum: 1 },
          latestReportAt: { $max: "$createdAt" },
          reasons: { $push: "$reason" },
        },
      },
      { $sort: { latestReportAt: -1 } },
    ]);

    const houseIds = reportGroups.map((group) => group._id);
    const houses = await House.find({ _id: { $in: houseIds } }).populate(
      "owner",
      "name email"
    );

    const houseById = new Map(houses.map((house) => [String(house._id), house]));
    const payload = reportGroups
      .map((group) => {
        const house = houseById.get(String(group._id));
        if (!house) return null;

        return {
          house,
          reportCount: group.reportCount,
          latestReportAt: group.latestReportAt,
          reasons: group.reasons.slice(-5),
        };
      })
      .filter(Boolean);

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteReportedHouse = async (req, res) => {
  const { houseId } = req.params;

  try {
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    await House.findByIdAndDelete(houseId);
    await Report.deleteMany({ house: houseId });

    return res.json({ message: "Reported house deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const [totalUsers, totalOwners, totalAdmins, totalHouses, openReports] =
      await Promise.all([
        User.countDocuments({ role: "user" }),
        User.countDocuments({ role: "owner" }),
        User.countDocuments({ role: "admin" }),
        House.countDocuments(),
        Report.countDocuments({ status: "open" }),
      ]);

    const houseStatusBreakdown = await House.aggregate([
      { $group: { _id: "$house_status", count: { $sum: 1 } } },
    ]);

    const recentReports = await Report.find({ status: "open" })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("house", "title location rent")
      .populate("reportedBy", "name email");

    return res.json({
      users: {
        tenants: totalUsers,
        owners: totalOwners,
        admins: totalAdmins,
      },
      houses: {
        total: totalHouses,
        byStatus: houseStatusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      reports: {
        open: openReports,
        recent: recentReports,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
