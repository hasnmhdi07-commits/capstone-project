const House = require("../models/house");
const User = require("../models/user");

// Admin: monitor all reported listings
exports.getReportedHouses = async (req, res) => {
  try {
    const houses = await House.find({ "reports.0": { $exists: true } })
      .sort({ "reports.createdAt": -1 })
      .populate("owner", "name email")
      .populate("reports.reportedBy", "name email");

    const payload = houses.map((house) => ({
      house,
      reportCount: house.reports.length,
      latestReportAt: house.reports[house.reports.length - 1]?.createdAt || null,
      reasons: house.reports.slice(-5).map((item) => item.reason),
    }));

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete Reported House
exports.deleteReportedHouseByAdmin = async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: "House not found" });

    await House.findByIdAndDelete(req.params.id);
    return res.json({ message: "Reported house deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Admin Dashboard & Monitoring
exports.getAdminDashboard = async (req, res) => {
  try {
    const [totalUsers, totalOwners, totalAdmins, totalHouses, reportedHouses] =
      await Promise.all([
        User.countDocuments({ role: "user" }),
        User.countDocuments({ role: "owner" }),
        User.countDocuments({ role: "admin" }),
        House.countDocuments(),
        House.countDocuments({ "reports.0": { $exists: true } }),
      ]);

    const houseStatusBreakdown = await House.aggregate([
      { $group: { _id: "$house_status", count: { $sum: 1 } } },
    ]);

    const reportAggregation = await House.aggregate([
      { $match: { "reports.0": { $exists: true } } },
      {
        $project: {
          title: 1,
          location: 1,
          rent: 1,
          reportCount: { $size: { $ifNull: ["$reports", []] } },
          latestReportAt: { $max: "$reports.createdAt" },
          reports: 1,
        },
      },
      { $sort: { latestReportAt: -1 } },
      { $limit: 10 },
    ]);

    const recentReports = reportAggregation.map((house) => {
      const latest = (house.reports || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0];
      return {
        houseId: house._id,
        title: house.title,
        location: house.location,
        rent: house.rent,
        reportCount: house.reportCount || 0,
        latestReason: latest?.reason || "",
        latestReportAt: latest?.createdAt || null,
      };
    });

    const totalReportEntries = await House.aggregate([
      { $project: { count: { $size: { $ifNull: ["$reports", []] } } } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);

    const newestListing = await House.findOne().sort({ createdAt: -1 }).select("createdAt");
    const monitoring = {
      totalReports: totalReportEntries[0]?.total || 0,
      cleanListings: Math.max(totalHouses - reportedHouses, 0),
      latestListingAt: newestListing?.createdAt || null,
    };

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
        open: reportedHouses,
        recent: recentReports,
      },
      monitoring,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
