const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  createReport,
  getReportedHouses,
  deleteReportedHouse,
  getAdminDashboard,
} = require("../controllers/reportController");

// Tenant/User reports a house listing
router.post(
  "/:houseId",
  protect,
  authorizeRoles("user", "owner", "admin"),
  createReport
);

// Admin moderation endpoints
router.get("/admin/reported-houses", protect, authorizeRoles("admin"), getReportedHouses);
router.delete(
  "/admin/reported-houses/:houseId",
  protect,
  authorizeRoles("admin"),
  deleteReportedHouse
);
router.get("/admin/dashboard", protect, authorizeRoles("admin"), getAdminDashboard);

module.exports = router;
