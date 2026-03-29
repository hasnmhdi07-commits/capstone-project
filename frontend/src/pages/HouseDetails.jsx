import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import socket from "../services/socket";
import { AuthContext } from "../context/AuthContext";
import { resolveImage, resolveFirstImage } from "../utils/imageHelper";
import { gsap } from "../utils/animations";

function HouseDetails() {
  const { id } = useParams();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [ownerTyping, setOwnerTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const mainImgRef = useRef(null);
  const chatBottomRef = useRef(null);
  const chatPanelRef = useRef(null);

  // ── Fetch house ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchHouseDetails = async () => {
      try {
        const response = await api.get(`/houses/${id}`);
        setHouse(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHouseDetails();
  }, [id]);

  // ── Page entrance animation ───────────────────────────────────────────────
  useEffect(() => {
    if (!house) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".detail-image-block",
        { opacity: 0, scale: 0.97, x: -30 },
        { opacity: 1, scale: 1, x: 0, duration: 0.65 }
      )
      .fromTo(".detail-info-block > *",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.45 },
        "-=0.4"
      )
      .fromTo(".detail-aside",
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.55 },
        "-=0.55"
      );
    }, pageRef);
    return () => ctx.revert();
  }, [house]);

  // ── Swap main image with a cross-fade ────────────────────────────────────
  const changeImage = (index) => {
    if (index === activeImage) return;
    gsap.to(mainImgRef.current, {
      opacity: 0, scale: 0.97, duration: 0.2,
      onComplete: () => {
        setActiveImage(index);
        gsap.to(mainImgRef.current, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
      },
    });
  };

  // ── Socket: join house room, listen for messages ──────────────────────────
  useEffect(() => {
    if (!user || !id) return;
    socket.emit("joinHouseChat", { houseId: id, userId: user._id });

    const handleChatMessage = (msg) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };
    const handleTyping = ({ senderName, isTyping }) => {
      if (senderName !== user.name) setOwnerTyping(isTyping);
    };

    socket.on("chatMessage", handleChatMessage);
    socket.on("typing", handleTyping);
    return () => {
      socket.off("chatMessage", handleChatMessage);
      socket.off("typing", handleTyping);
    };
  }, [user, id]);

  // ── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    if (showChat) chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showChat, ownerTyping]);

  // ── Open chat with slide-up animation ────────────────────────────────────
  const openChat = async () => {
    if (!user) { navigate("/login"); return; }
    setShowChat(true);
    if (chatMessages.length > 0) return;
    setChatLoading(true);
    try {
      const { data } = await api.get(`/messages/house/${id}`);
      setChatMessages(data);
    } catch { } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (showChat && chatPanelRef.current) {
      gsap.fromTo(
        chatPanelRef.current,
        { opacity: 0, y: 40, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.4)" }
      );
    }
  }, [showChat]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!chatInput.trim() || sending) return;
    setSending(true);
    const optimistic = {
      _id: `temp_${Date.now()}`,
      message: chatInput.trim(),
      senderName: user.name,
      senderId: user._id,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    setChatMessages((prev) => [...prev, optimistic]);
    setChatInput("");
    socket.emit("typing", { houseId: id, senderName: user.name, isTyping: false });

    try {
      await api.post("/messages", { houseId: id, message: optimistic.message });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send message");
      setChatMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    setChatInput(e.target.value);
    socket.emit("typing", { houseId: id, senderName: user?.name, isTyping: true });
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => {
      socket.emit("typing", { houseId: id, senderName: user?.name, isTyping: false });
    }, 2000));
  };

  if (loading) return (
    <div className="p-8 text-center">
      <div className="inline-block w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-gray-500">Loading property...</p>
    </div>
  );
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!house) return <div className="p-8">House not found</div>;

  const images = house.images?.length > 0 ? house.images : [];

  return (
    <div ref={pageRef} className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── Image + Info ─────────────────────────────────────────────── */}
        <div className="md:col-span-2">
          <div className="detail-image-block mb-4">
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-2 shadow-sm">
              <img
                ref={mainImgRef}
                src={images.length ? resolveImage(images[activeImage]) : resolveFirstImage([])}
                alt={house.title}
                className="w-full h-72 md:h-96 object-cover"
              />
              {images.length > 1 && (
                <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                  {activeImage + 1} / {images.length}
                </span>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => changeImage((activeImage - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/70 transition text-xl"
                  >‹</button>
                  <button
                    onClick={() => changeImage((activeImage + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/70 transition text-xl"
                  >›</button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => changeImage(i)}
                    className={`flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      i === activeImage
                        ? "border-indigo-500 scale-105 shadow-md"
                        : "border-transparent opacity-55 hover:opacity-80"
                    }`}
                  >
                    <img src={resolveImage(img)} alt={`thumb-${i}`} className="w-20 h-14 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail-info-block space-y-3">
            <h1 className="text-3xl font-bold">{house.title}</h1>
            <p className="text-gray-500 flex items-center gap-1">📍 {house.location}</p>
            <p className="text-2xl font-bold text-green-600">
              BDT {Number(house.rent).toLocaleString()}
              <span className="text-base font-normal text-gray-500">/month</span>
            </p>
            <p className="text-gray-700 leading-relaxed">{house.description}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm">🛏 {house.rooms} room{house.rooms !== 1 ? "s" : ""}</span>
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                house.house_status === "available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}>
                {house.house_status === "available" ? "✅ Available" : "❌ Rented"}
              </span>
              {house.facilities?.map((f, i) => (
                <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm">{f}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400">Listed: {new Date(house.createdAt || Date.now()).toLocaleDateString()}</p>
          </div>
        </div>

        {/* ── Aside ────────────────────────────────────────────────────── */}
        <aside className="detail-aside flex flex-col gap-3">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center text-xl font-bold">
                {(house.owner?.name || "U")[0].toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{house.owner?.name || "Owner"}</div>
                <div className="text-sm text-gray-500">{house.owner?.email}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <AsideButton
                onClick={openChat}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                💬 Message Owner
              </AsideButton>
              <WishlistButton houseId={house._id} />
              <AsideButton
                onClick={() => { if (!user) { navigate("/login"); return; } setShowReportModal(true); }}
                className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-sm"
              >
                🚩 Report Listing
              </AsideButton>
            </div>
          </div>
        </aside>
      </div>

      {/* ── CHAT PANEL ───────────────────────────────────────────────────── */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div
            ref={chatPanelRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
            style={{ height: "min(600px, 90vh)" }}
          >
            <div className="flex items-center justify-between p-4 border-b rounded-t-2xl bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center font-bold">
                  {(house.owner?.name || "O")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{house.owner?.name}</p>
                  <p className="text-xs text-indigo-200">re: {house.title}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  gsap.to(chatPanelRef.current, {
                    opacity: 0, y: 20, duration: 0.25,
                    onComplete: () => setShowChat(false),
                  });
                }}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
              {chatLoading ? (
                <p className="text-center text-gray-400 mt-8">Loading messages...</p>
              ) : chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <p className="text-3xl mb-2">👋</p>
                  <p>Say hello to the owner!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isOwn = msg.senderId === user._id || msg.senderId?._id === user._id || msg.senderName === user.name;
                  return (
                    <div key={msg._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        isOwn ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm border"
                      } ${msg.isOptimistic ? "opacity-70" : ""}`}>
                        {!isOwn && <p className="text-xs font-semibold text-indigo-600 mb-1">{msg.senderName}</p>}
                        <p>{msg.message}</p>
                        <p className={`text-xs mt-1 ${isOwn ? "text-indigo-200" : "text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {msg.isOptimistic && " · sending..."}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {ownerTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm shadow-sm flex gap-1 items-center text-gray-500">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                    <span className="ml-1 text-xs">{house.owner?.name} is typing</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="p-3 border-t bg-white rounded-b-2xl">
              {!user ? (
                <button onClick={() => navigate("/login")} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold">
                  Login to send messages
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text" value={chatInput} onChange={handleInputChange}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a message..."
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatInput.trim() || sending}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Report Modal ──────────────────────────────────────────────────── */}
      {showReportModal && (
        <ReportModal
          houseId={house._id}
          reason={reportReason}
          setReason={setReportReason}
          submitting={reportSubmitting}
          setSubmitting={setReportSubmitting}
          onClose={() => { setShowReportModal(false); setReportReason(""); }}
        />
      )}
    </div>
  );
}

// ── Animated aside button ─────────────────────────────────────────────────────
function AsideButton({ children, onClick, className }) {
  const ref = useRef(null);
  const handleDown = () => gsap.to(ref.current, { scale: 0.95, duration: 0.1 });
  const handleUp = () => gsap.to(ref.current, { scale: 1, duration: 0.2, ease: "back.out(2)" });

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      className={`w-full px-4 py-2.5 rounded-xl font-semibold transition ${className}`}
    >
      {children}
    </button>
  );
}

// ── Report Modal ──────────────────────────────────────────────────────────────
function ReportModal({ houseId, reason, setReason, submitting, setSubmitting, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(modalRef.current,
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.4)" }
    );
  }, []);

  const close = () => {
    gsap.to(modalRef.current, {
      opacity: 0, y: 20, duration: 0.2,
      onComplete: onClose,
    });
  };

  const submit = async () => {
    if (!reason.trim()) return alert("Please enter a reason");
    setSubmitting(true);
    try {
      const api = (await import("../services/api")).default;
      await api.post("/reports", { houseId, reason });
      alert("Report submitted. Thank you!");
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-3">Report This Listing</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe why you're reporting this property..."
          className="w-full border-2 border-gray-200 rounded-xl p-3 mb-4 focus:border-red-400 focus:outline-none"
          rows={4}
        />
        <div className="flex gap-3">
          <button onClick={close} className="flex-1 bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200 transition">Cancel</button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── WishlistButton ────────────────────────────────────────────────────────────
function WishlistButton({ houseId }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    if (!user || user.role === "admin") return;
    api.get("/houses/favorites")
      .then(({ data }) => { if (mounted) setIsWishlisted(data.some((f) => f._id === houseId)); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [user, houseId]);

  if (!user || user.role === "admin") return null;

  const toggle = async () => {
    // Star burst animation
    gsap.fromTo(btnRef.current,
      { scale: 0.85, rotate: -10 },
      { scale: 1, rotate: 0, duration: 0.4, ease: "back.out(2)" }
    );
    try {
      const { data } = await api.post(`/houses/${houseId}/favorite`);
      const favs = data.favorites || [];
      setIsWishlisted(favs.some((f) => f._id === houseId));
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    }
  };

  return (
    <button
      ref={btnRef}
      onClick={toggle}
      className={`w-full px-4 py-2.5 rounded-xl font-semibold transition ${
        isWishlisted ? "bg-yellow-400 text-white hover:bg-yellow-500" : "bg-gray-100 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600"
      }`}
    >
      {isWishlisted ? "★ In Wishlist" : "☆ Add to Wishlist"}
    </button>
  );
}

export default HouseDetails;
