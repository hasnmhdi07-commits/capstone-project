import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { resolveFirstImage } from "../utils/imageHelper";

/**
 * HouseCard – displays a single house listing as a card.
 * Used by Home.jsx and HousesPage.jsx.
 *
 * Props:
 *   house      {object}   – the house document
 *   showWishlist {boolean} – whether to show the wishlist toggle (default true)
 */
const HouseCard = ({ house, showWishlist = true }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = React.useState(false);
  const [toggling, setToggling] = React.useState(false);

  // Pre-check wishlist state for the current user
  React.useEffect(() => {
    let mounted = true;
    if (!user || user.role === "admin") return;
    api
      .get("/houses/favorites")
      .then(({ data }) => {
        if (!mounted) return;
        setWishlisted(data.some((f) => f._id === house._id));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [user, house._id]);

  const handleWishlist = async (e) => {
    e.preventDefault(); // don't navigate to house detail
    if (!user) return navigate("/login");
    if (user.role === "admin") return;
    setToggling(true);
    try {
      const { data } = await api.post(`/houses/${house._id}/favorite`);
      const favs = data.favorites || [];
      setWishlisted(favs.some((f) => f._id === house._id));
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch {
      // silently fail
    } finally {
      setToggling(false);
    }
  };

  const imgSrc = resolveFirstImage(house.images);
  const isAvailable = house.house_status === "available";

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative">
        <Link to={`/houses/${house._id}`}>
          <img
            src={imgSrc}
            alt={house.title}
            className="w-full h-48 object-cover"
          />
        </Link>

        {/* Status Badge */}
        <span
          className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full ${
            isAvailable
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isAvailable ? "Available" : "Rented"}
        </span>

        {/* Wishlist Button */}
        {showWishlist && user && user.role !== "admin" && (
          <button
            onClick={handleWishlist}
            disabled={toggling}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-lg shadow transition
              ${wishlisted ? "bg-yellow-400 text-white" : "bg-white/80 text-gray-400 hover:text-yellow-500"}`}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            {wishlisted ? "★" : "☆"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/houses/${house._id}`} className="hover:text-indigo-600 transition">
          <h3 className="font-bold text-lg mb-1 line-clamp-1">{house.title}</h3>
        </Link>

        <p className="text-gray-500 text-sm mb-2 flex items-center gap-1">
          <span>📍</span>
          <span className="line-clamp-1">{house.location}</span>
        </p>

        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          <span>🛏 {house.rooms} room{house.rooms !== 1 ? "s" : ""}</span>
          {house.facilities?.length > 0 && (
            <span className="truncate">✅ {house.facilities.slice(0, 2).join(", ")}</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <p className="text-xl font-bold text-indigo-600">
            BDT {Number(house.rent).toLocaleString()}
            <span className="text-sm font-normal text-gray-500">/mo</span>
          </p>
          <Link
            to={`/houses/${house._id}`}
            className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HouseCard;
