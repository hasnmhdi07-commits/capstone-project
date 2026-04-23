const express = require("express");

const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { toggleFavorite, getFavorites } = require("../controllers/favouriteController");

// Allow both "user" and "owner" roles to manage favorites
router.post("/:id/favorite", protect, authorizeRoles("user", "owner"), toggleFavorite);
router.get("/favorites", protect, authorizeRoles("user", "owner"), getFavorites);

module.exports = router;