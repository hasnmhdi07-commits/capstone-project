import React, { useState } from "react";

/**
 * FilterBar – search and filter form for house listings.
 *
 * Props:
 *   onFilter {function} – called with a filters object when the user submits
 */
const FilterBar = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    location: "",
    minRent: "",
    maxRent: "",
    rooms: "",
  });

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Remove empty values before sending to avoid polluting query string
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "")
    );
    onFilter(activeFilters);
  };

  const handleReset = () => {
    setFilters({ location: "", minRent: "", maxRent: "", rooms: "" });
    onFilter({}); // re-fetch all houses
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap gap-3 items-end mb-6"
    >
      {/* Location */}
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Location
        </label>
        <input
          type="text"
          name="location"
          placeholder="e.g. Dhaka"
          value={filters.location}
          onChange={handleChange}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition"
        />
      </div>

      {/* Min Rent */}
      <div className="min-w-[120px]">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Min Rent (BDT)
        </label>
        <input
          type="number"
          name="minRent"
          placeholder="Min"
          value={filters.minRent}
          onChange={handleChange}
          min={0}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition"
        />
      </div>

      {/* Max Rent */}
      <div className="min-w-[120px]">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Max Rent (BDT)
        </label>
        <input
          type="number"
          name="maxRent"
          placeholder="Max"
          value={filters.maxRent}
          onChange={handleChange}
          min={0}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition"
        />
      </div>

      {/* Rooms */}
      <div className="min-w-[100px]">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Rooms
        </label>
        <select
          name="rooms"
          value={filters.rooms}
          onChange={handleChange}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition"
        >
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} {n === 5 ? "+" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default FilterBar;
