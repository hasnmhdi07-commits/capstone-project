import React, { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, reportsRes] = await Promise.all([
        api.get("/houses/admin/dashboard"),
        api.get("/houses/admin/reported-houses"),
      ]);
      setStats(dashboardRes.data);
      setReports(reportsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") fetchDashboardData();
  }, [user]);

  const handleDeleteHouse = async (houseId) => {
    if (!window.confirm("Are you sure you want to delete this house?")) return;
    try {
      await api.delete(`/houses/admin/reported-houses/${houseId}`);
      fetchDashboardData();
    } catch (error) {
      console.error(error);
    }
  };

  const statusMap = stats?.houses?.byStatus || {};
  const availableCount = statusMap.available || 0;
  const rentedCount = statusMap.rented || 0;
  const fmtDate = (date) =>
    date ? new Date(date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "N/A";

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Monitoring + reported listings moderation</p>

      {loading ? (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Tenants" value={stats?.users?.tenants || 0} />
            <StatCard label="Owners" value={stats?.users?.owners || 0} />
            <StatCard label="Total Houses" value={stats?.houses?.total || 0} />
            <StatCard label="Open Reports" value={stats?.reports?.open || 0} danger />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border rounded-lg p-4">
              <h2 className="font-semibold text-lg mb-3">House Status</h2>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between"><span>Available</span><span className="font-semibold">{availableCount}</span></p>
                <p className="flex justify-between"><span>Rented</span><span className="font-semibold">{rentedCount}</span></p>
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h2 className="font-semibold text-lg mb-3">Monitoring</h2>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between"><span>Total report entries</span><span className="font-semibold">{stats?.monitoring?.totalReports || 0}</span></p>
                <p className="flex justify-between"><span>Clean listings</span><span className="font-semibold">{stats?.monitoring?.cleanListings || 0}</span></p>
                <p className="text-gray-600">Latest listing: {fmtDate(stats?.monitoring?.latestListingAt)}</p>
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h2 className="font-semibold text-lg mb-3">Recent Report Activity</h2>
              <div className="space-y-2 text-sm max-h-44 overflow-y-auto">
                {stats?.reports?.recent?.length ? (
                  stats.reports.recent.slice(0, 5).map((item) => (
                    <div key={item.houseId} className="border rounded p-2">
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-gray-600">{item.reportCount} reports</p>
                      <p className="text-gray-500 text-xs">{fmtDate(item.latestReportAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No recent report activity.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <h2 className="text-xl font-semibold mb-3">Moderation Queue</h2>
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

const StatCard = ({ label, value, danger = false }) => (
  <div className="bg-white border rounded-lg p-4">
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${danger ? "text-red-600" : "text-gray-900"}`}>{value}</p>
  </div>
);

export default AdminDashboard;
