const express = require("express");
const router = express.Router();
const {
  getHouses,
  getMyHouses,
  getHouseById,
  createHouse,
  updateHouse,
  deleteHouse,
  updateHouseStatus,
} = require("../controllers/houseController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Public routes
router.get("/", getHouses);

// FIX: /my must be declared BEFORE /:id so it is not captured by the dynamic route.
// Returns all of the logged-in owner's houses regardless of house_status.
router.get("/my", protect, authorizeRoles("owner"), getMyHouses);

router.get("/:id", getHouseById);

// Owner-only private routes
router.post(
  "/",
  protect,
  authorizeRoles("owner"),
  upload.array("images", 6),
  createHouse
);
router.put(
  "/:id",
  protect,
  authorizeRoles("owner"),
  upload.array("images", 6),
  updateHouse
);
router.delete("/:id", protect, authorizeRoles("owner"), deleteHouse);
router.patch(
  "/:id/house_status",
  protect,
  authorizeRoles("owner"),
  updateHouseStatus
);

module.exports = router;
