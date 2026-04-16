const House = require("../models/house");

// Search & Filter Houses (public listing)
exports.getHouses = async (req, res) => {
  console.log("GET /api/houses called with query:", req.query);
  const { location, minRent, maxRent, rooms, minRooms, maxRooms, q } = req.query;

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
