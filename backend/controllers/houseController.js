const House = require("../models/house");
const User = require("../models/user");

// Get all available houses (public - no auth required)
exports.getHouses = async (req, res) => {
  console.log("GET /api/houses called with query:", req.query);
  const { location, minRent, maxRent, rooms, minRooms, maxRooms, q } = req.query;

  // FIX: Only filter by "available" for the public listing.
  let query = { house_status: "available" };
  if (location) query.location = { $regex: location, $options: "i" };
  if (minRent || maxRent) {
    query.rent = {};
    if (minRent) query.rent.$gte = Number(minRent);
    if (maxRent) query.rent.$lte = Number(maxRent);
  }
  if (rooms) {
    query.rooms = Number(rooms);
  } else if (minRooms || maxRooms) {
    query.rooms = {};
    if (minRooms) query.rooms.$gte = Number(minRooms);
    if (maxRooms) query.rooms.$lte = Number(maxRooms);
  }
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { address: { $regex: q, $options: "i" } },
    ];
  }

  try {
    const houses = await House.find(query).populate("owner", "name email");
    res.json(houses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FIX: New endpoint - get the logged-in owner's OWN houses (all statuses)
// This replaces the client-side filter that was missing rented houses.
exports.getMyHouses = async (req, res) => {
  try {
    const houses = await House.find({ owner: req.user._id }).populate(
      "owner",
      "name email"
    );
    res.json(houses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single house by id
exports.getHouseById = async (req, res) => {
  console.log("GET /api/houses/:id called, id=", req.params.id);
  try {
    const house = await House.findById(req.params.id).populate(
      "owner",
      "name email"
    );
    if (!house) return res.status(404).json({ message: "House not found" });
    res.json(house);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createHouse = async (req, res) => {
  const { title, location, rent, rooms, facilities, address, description } =
    req.body;

  let images = [];
  if (req.files && req.files.length) {
    images = req.files.map((f) => `/uploads/${f.filename}`);
  } else if (req.body.images) {
    images = Array.isArray(req.body.images)
      ? req.body.images
      : req.body.images.split(",");
  }

  try {
    const house = await House.create({
      title,
      location,
      rent,
      rooms,
      facilities,
      address,
      images,
      description,
      owner: req.user._id,
    });
    res.status(201).json(house);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateHouse = async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: "House not Found" });
    if (house.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const updateData = { ...req.body };
    if (req.files && req.files.length) {
      updateData.images = req.files.map((f) => `/uploads/${f.filename}`);
    }

    const updatedHouse = await House.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(updatedHouse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteHouse = async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: "House not Found" });
    if (house.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    await House.findByIdAndDelete(req.params.id);
    res.json({ message: "House Removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateHouseStatus = async (req, res) => {
  const { house_status } = req.body;
  if (!["available", "rented"].includes(house_status))
    return res.status(400).json({ message: "Invalid status" });

  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: "House Not Found" });
    if (house.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    house.house_status = house_status;
    await house.save();
    res.json(house);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
          reportCount: { $size: "$reports" },
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
      { $project: { count: { $size: "$reports" } } },
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
