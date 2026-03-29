import React, { useState, useEffect, useContext, useCallback } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { resolveImage, resolveFirstImage } from "../utils/imageHelper";

const OwnerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "", location: "", rent: "", rooms: "",
    address: "", description: "", facilities: "", images: "",
  });
  const [editing, setEditing] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // FIX: Use /houses/my so rented houses are also included (public /houses
  // only returns available listings).
  const fetchHouses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get("/houses/my");
      setHouses(data);
    } catch (error) {
      console.error("Error fetching houses:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === "owner") fetchHouses();
  }, [user, fetchHouses]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (k !== "images") formData.append(k, v);
        });
        selectedFiles.forEach((file) => formData.append("images", file));
        if (editing) {
          await api.put(`/houses/${editing}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        } else {
          await api.post("/houses", formData, { headers: { "Content-Type": "multipart/form-data" } });
        }
      } else {
        const houseData = { ...form, facilities: form.facilities ? form.facilities.split(",").map(s=>s.trim()) : [] };
        if (editing) {
          await api.put(`/houses/${editing}`, houseData);
        } else {
          await api.post("/houses", houseData);
        }
      }
      resetForm();
      fetchHouses();
    } catch (error) {
      console.error(error);
      alert("Failed to save house");
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ title: "", location: "", rent: "", rooms: "", address: "", description: "", facilities: "", images: "" });
    setSelectedFiles([]);
    setPreviews([]);
  };

  const handleEdit = (house) => {
    setEditing(house._id);
    setForm({
      title: house.title, location: house.location, rent: house.rent,
      rooms: house.rooms, address: house.address, description: house.description,
      facilities: house.facilities?.join(", ") || "",
      images: house.images ? house.images.join(",") : "",
    });
    setSelectedFiles([]);
    // FIX: Use resolveImage helper instead of hardcoded localhost
    setPreviews(house.images ? house.images.map(resolveImage) : []);
  };

  // FIX: Added confirmation dialog (was missing, unlike AdminDashboard)
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this house? This cannot be undone.")) return;
    try {
      await api.delete(`/houses/${id}`);
      fetchHouses();
    } catch (error) {
      console.error(error);
      alert("Failed to delete house");
    }
  };

  const handleToggleStatus = async (house) => {
    try {
      await api.patch(`/houses/${house._id}/house_status`, {
        house_status: house.house_status === "available" ? "rented" : "available",
      });
      fetchHouses();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Owner Dashboard</h1>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="mb-6 border p-4 rounded flex flex-col gap-2 bg-white shadow">
        <h2 className="font-bold text-lg">{editing ? "Edit House" : "Add New House"}</h2>
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} className="border p-2 rounded" required />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} className="border p-2 rounded" required />
        <input name="rent" type="number" placeholder="Rent (BDT)" value={form.rent} onChange={handleChange} className="border p-2 rounded" required />
        <input name="rooms" type="number" placeholder="Number of Rooms" value={form.rooms} onChange={handleChange} className="border p-2 rounded" required />
        <input name="address" placeholder="Full Address" value={form.address} onChange={handleChange} className="border p-2 rounded" required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} className="border p-2 rounded" required rows={3} />
        <input name="facilities" placeholder="Facilities (comma separated, e.g. WiFi, Parking)" value={form.facilities} onChange={handleChange} className="border p-2 rounded" />
        <label className="text-sm font-medium text-gray-600">Upload Images</label>
        <input type="file" name="imagesFiles" multiple accept="image/*" onChange={handleFileChange} className="border p-2 rounded" />
        {previews.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-1">
            {previews.map((p, idx) => (
              <img key={idx} src={p} alt={`preview-${idx}`} className="w-24 h-16 object-cover rounded" />
            ))}
          </div>
        )}
        <input name="images" placeholder="Or paste image URLs (comma separated)" value={form.images} onChange={handleChange} className="border p-2 rounded" />
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-500 text-white p-2 rounded flex-1 hover:bg-blue-600">
            {editing ? "Update House" : "Add House"}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="bg-gray-500 text-white p-2 rounded flex-1 hover:bg-gray-600">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* House List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Your Houses</h2>
        <div className="flex gap-3 text-sm">
          <span className="text-green-600 font-semibold">
            Available: {houses.filter(h => h.house_status === "available").length}
          </span>
          <span className="text-red-500 font-semibold">
            Rented: {houses.filter(h => h.house_status === "rented").length}
          </span>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Loading your houses...</p>
      ) : houses.length === 0 ? (
        <p className="text-center text-gray-600">No houses listed yet. Create one above!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {houses.map((house) => (
            <div key={house._id} className="border p-4 rounded shadow flex flex-col gap-2 bg-white hover:shadow-lg transition">
              <Link to={`/houses/${house._id}`} className="block">
                {/* FIX: Use resolveFirstImage helper instead of hardcoded localhost */}
                <img
                  src={resolveFirstImage(house.images)}
                  alt={house.title}
                  className="w-full h-40 object-cover rounded"
                />
                <h3 className="font-bold text-lg mt-2">{house.title}</h3>
                <p className="text-gray-600 text-sm">{house.location} · {house.rooms} rooms</p>
                <p className="text-green-600 font-semibold">BDT {Number(house.rent).toLocaleString()}/month</p>
                <p className="text-sm">
                  Status:{" "}
                  <span className={`font-bold ${house.house_status === "available" ? "text-green-600" : "text-red-500"}`}>
                    {house.house_status}
                  </span>
                </p>
              </Link>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleEdit(house)} className="flex-1 bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 transition text-sm">Edit</button>
                <button onClick={() => handleDelete(house._id)} className="flex-1 bg-red-500 text-white p-2 rounded hover:bg-red-600 transition text-sm">Delete</button>
                <button onClick={() => handleToggleStatus(house)} className="flex-1 bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600 transition text-sm">
                  {house.house_status === "available" ? "Mark Rented" : "Mark Available"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
