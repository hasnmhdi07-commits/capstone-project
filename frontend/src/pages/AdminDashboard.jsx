import React, { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);

  const fetchReports = async () => {
    try {
      const { data } = await api.get("/houses/admin/reported-houses");
      setReports(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") fetchReports();
  }, [user]);

  const handleDeleteHouse = async (houseId) => {
    if (!window.confirm("Are you sure you want to delete this house?")) return;
    try {
      await api.delete(`/houses/admin/reported-houses/${houseId}`);
      fetchReports();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Reported listings requiring review</p>

      {reports.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-600 text-lg font-semibold">No reported houses</p>
          <p className="text-gray-500">All listings are clean!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div key={report._id} className="border p-4 rounded-lg shadow bg-white flex flex-col gap-2">
              <h2 className="font-bold text-lg">{report.house?.title}</h2>
              <p className="text-gray-600 text-sm">📍 {report.house?.location}</p>
              <p className="text-gray-600 text-sm">
                🚩 Total reports: <span className="font-semibold">{report.reportCount || 0}</span>
              </p>
              <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
                <strong>Recent reasons:</strong>{" "}
                {report.reasons?.length ? report.reasons.join(", ") : "No reason provided"}
              </div>
              <button
                onClick={() => handleDeleteHouse(report.house?._id)}
                className="bg-red-500 text-white p-2 rounded mt-2 hover:bg-red-600 transition font-semibold"
              >
                🗑 Delete House & Reports
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
