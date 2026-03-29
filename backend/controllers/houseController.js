const House = require("../models/house");

// Get all available houses (public - no auth required)
exports.getHouses = async (req, res) => {
  console.log("GET /api/houses called with query:", req.query);
  const { location, minRent, maxRent, rooms } = req.query;

  // FIX: Only filter by "available" for the public listing.
  let query = { house_status: "available" };
  if (location) query.location = { $regex: location, $options: "i" };
  if (minRent || maxRent) {
    query.rent = {};
    if (minRent) query.rent.$gte = Number(minRent);
    if (maxRent) query.rent.$lte = Number(maxRent);
  }
  if (rooms) query.rooms = Number(rooms);

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
