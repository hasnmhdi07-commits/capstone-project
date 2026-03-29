import React, { useState, useEffect, useContext, useCallback } from "react";
import api from "../services/api";
import HouseCard from "../components/HouseCard";
import FilterBar from "../components/FilterBar";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { gsap, animateCards } from "../utils/animations";

const HousesPage = () => {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistView, setWishlistView] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Page entrance ─────────────────────────────────────────────────────────
  useEffect(() => {
    gsap.fromTo(
      ".houses-header",
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }
    );
  }, []);

  // ── Animate cards whenever the houses list changes ────────────────────────
  useEffect(() => {
    if (!loading && houses.length > 0) {
      // Small timeout so the DOM has rendered the cards
      const timer = setTimeout(() => {
        animateCards(".house-card-item");
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [houses, loading]);

  const fetchHouses = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/houses?${query}`);
      setHouses(data);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch houses");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/houses/favorites");
      setHouses(data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setWishlistView(false);
        setSearchParams({});
        navigate("/login");
        return;
      }
      alert("Failed to fetch wishlist: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [navigate, setSearchParams]);

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "wishlist") {
      setWishlistView(true);
      fetchWishlist();
    } else {
      setWishlistView(false);
      fetchHouses();
    }
    const onUpdated = () => {
      if (searchParams.get("view") === "wishlist") fetchWishlist();
    };
    window.addEventListener("wishlistUpdated", onUpdated);
    return () => window.removeEventListener("wishlistUpdated", onUpdated);
  }, [fetchHouses, fetchWishlist, searchParams]);

  const handleFilter = useCallback(
    (filters) => {
      if (wishlistView) return;
      fetchHouses(filters);
    },
    [wishlistView, fetchHouses]
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="houses-header rounded-2xl p-6 mb-6 bg-gradient-to-r from-white via-slate-50 to-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Find Your Perfect Home</h1>
            <p className="text-gray-500 mt-1">Browse listings, filter by preferences, and save to your wishlist.</p>
          </div>
          <button
            onClick={async () => {
              if (!user) return navigate("/login");
              const next = !wishlistView;
              setWishlistView(next);

              // Animate the button toggle
              gsap.fromTo(
                ".wishlist-btn",
                { scale: 0.9 },
                { scale: 1, duration: 0.3, ease: "back.out(2)" }
              );

              if (next) {
                setSearchParams({ view: "wishlist" });
                await fetchWishlist();
              } else {
                setSearchParams({});
                await fetchHouses();
              }
            }}
            className={`wishlist-btn px-5 py-2.5 rounded-xl font-semibold transition-colors ${
              wishlistView ? "bg-yellow-400 text-white shadow" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            ★ {wishlistView ? "Viewing Wishlist" : "Wishlist"}
          </button>
        </div>
      </div>

      {/* Filter bar (disabled in wishlist mode) */}
      <div className={wishlistView ? "opacity-40 pointer-events-none" : ""}>
        <FilterBar onFilter={handleFilter} />
      </div>
      {wishlistView && (
        <p className="text-xs text-gray-400 mb-4 -mt-2 pl-1">
          Filters are disabled while viewing your wishlist.
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-xl h-72 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : houses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {houses.map((house) => (
            <div key={house._id} className="house-card-item">
              <HouseCard house={house} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">{wishlistView ? "⭐" : "🏘️"}</p>
          <p className="text-lg font-medium">
            {wishlistView ? "No saved properties yet." : "No houses match your search."}
          </p>
          {!wishlistView && (
            <button
              onClick={() => fetchHouses()}
              className="mt-4 text-indigo-600 underline text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HousesPage;
