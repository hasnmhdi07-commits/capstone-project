const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { toggleFavorite, getFavorites } = require("../controllers/favouriteController");

// FIX: Allow both "user" and "owner" roles to manage favorites.
// Previously only "user" could, causing silent failures when owners
// tried to wishlist a property from HouseDetails.
router.post("/:id/favorite", protect, authorizeRoles("user", "owner"), toggleFavorite);
router.get("/favorites", protect, authorizeRoles("user", "owner"), getFavorites);

module.exports = router;
