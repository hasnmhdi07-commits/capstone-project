import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import socket from "../services/socket";
import { AuthContext } from "../context/AuthContext";

function OwnerMessages() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState({}); // grouped by houseId
  const [messages, setMessages] = useState([]);           // flat list for sidebar
  const [selectedConv, setSelectedConv] = useState(null); // { houseId, senderEmail, senderName }
  const [convMessages, setConvMessages] = useState([]);   // messages for selected convo
  const [replyInput, setReplyInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [typingUser, setTypingUser] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const chatBottomRef = useRef(null);

  // ── Fetch all received messages on mount ───────────────────────────────────
  useEffect(() => {
    if (!user || user.role !== "owner") { navigate("/"); return; }

    const fetchMessages = async () => {
      try {
        const { data } = await api.get("/messages/received");
        setMessages(data);
        groupByConversation(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [user, navigate]);

  // ── Socket.io: listen for real-time incoming messages ────────────────────
  useEffect(() => {
    if (!user) return;

    const handleNewMessage = (msg) => {
      // Play a subtle notification (works in most browsers without permissions)
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } catch {}

      // Add to flat list
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) return prev;
        const updated = [msg, ...prev];
        groupByConversation(updated);
        return updated;
      });

      // If this convo is currently open, add to chat view too
      setSelectedConv((current) => {
        if (
          current &&
          msg.houseId?._id === current.houseId &&
          msg.senderEmail === current.senderEmail
        ) {
          setConvMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }
        return current;
      });
    };

    // Typing indicator from tenant
    const handleTyping = ({ senderName, isTyping }) => {
      setTypingUser(isTyping ? senderName : null);
      if (typingTimeout) clearTimeout(typingTimeout);
      if (isTyping) {
        setTypingTimeout(setTimeout(() => setTypingUser(null), 3000));
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
    };
  }, [user]);

  // ── Auto-scroll when convMessages change ─────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages, typingUser]);

  // ── Group flat messages into conversations ────────────────────────────────
  const groupByConversation = (msgs) => {
    const groups = {};
    msgs.forEach((msg) => {
      const key = `${msg.houseId?._id}_${msg.senderEmail}`;
      if (!groups[key]) {
        groups[key] = {
          houseId: msg.houseId?._id,
          houseTitle: msg.houseId?.title || "Property",
          senderName: msg.senderName,
          senderEmail: msg.senderEmail,
          unread: 0,
          lastMessage: msg.message,
          lastTime: msg.createdAt,
          messages: [],
        };
      }
      if (!msg.isRead) groups[key].unread++;
      groups[key].messages.push(msg);
      if (new Date(msg.createdAt) > new Date(groups[key].lastTime)) {
        groups[key].lastTime = msg.createdAt;
        groups[key].lastMessage = msg.message;
      }
    });
    setConversations(groups);
  };

  // ── Open a conversation ───────────────────────────────────────────────────
  const openConversation = async (conv) => {
    setSelectedConv(conv);
    setConvMessages(conv.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));

    // Mark all as read
    const unread = conv.messages.filter((m) => !m.isRead);
    await Promise.all(
      unread.map((m) => api.patch(`/messages/${m._id}/read`).catch(() => {}))
    );

    // Update unread counts
    setMessages((prev) =>
      prev.map((m) =>
        m.senderEmail === conv.senderEmail && m.houseId?._id === conv.houseId
          ? { ...m, isRead: true }
          : m
      )
    );
    setConversations((prev) => {
      const key = `${conv.houseId}_${conv.senderEmail}`;
      if (prev[key]) {
        return { ...prev, [key]: { ...prev[key], unread: 0, messages: prev[key].messages.map(m => ({ ...m, isRead: true })) } };
      }
      return prev;
    });

    // Join house chat room for live replies
    if (conv.houseId) {
      socket.emit("joinHouseChat", { houseId: conv.houseId, userId: user._id });
    }
  };

  // ── Owner reply ───────────────────────────────────────────────────────────
  const sendReply = async () => {
    if (!replyInput.trim() || !selectedConv || sending) return;
    setSending(true);

    const optimistic = {
      _id: `temp_${Date.now()}`,
      message: replyInput.trim(),
      senderName: user.name,
      senderEmail: user.email,
      senderId: { _id: user._id },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    setConvMessages((prev) => [...prev, optimistic]);
    setReplyInput("");

    try {
      // Owner replies are sent as messages on the same house
      // We repurpose the sendMessage endpoint pointing to the house
      await api.post("/messages", {
        houseId: selectedConv.houseId,
        message: optimistic.message,
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send reply");
      setConvMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
    } finally {
      setSending(false);
    }
  };

  // ── Conversation list for sidebar ─────────────────────────────────────────
  const convList = Object.values(conversations).sort(
    (a, b) => new Date(b.lastTime) - new Date(a.lastTime)
  );
  const filteredConvs = filter === "unread"
    ? convList.filter((c) => c.unread > 0)
    : convList;

  const totalUnread = convList.reduce((sum, c) => sum + c.unread, 0);

  if (loading) return <div className="p-8 text-center">Loading messages...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">💬 Messages</h1>
        {totalUnread > 0 && (
          <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
            {totalUnread} new
          </span>
        )}
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

      {convList.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-600 text-lg font-semibold">No messages yet</p>
          <p className="text-gray-500">When tenants contact you, their messages will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[70vh]">

          {/* ── Sidebar: conversation list ─────────────────────────────── */}
          <div className="lg:col-span-1 flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="flex gap-2 p-3 border-b">
              <button
                onClick={() => setFilter("all")}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition ${filter === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >All ({convList.length})</button>
              <button
                onClick={() => setFilter("unread")}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition ${filter === "unread" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >Unread ({convList.filter(c => c.unread > 0).length})</button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y">
              {filteredConvs.map((conv) => {
                const key = `${conv.houseId}_${conv.senderEmail}`;
                const isActive = selectedConv?.houseId === conv.houseId && selectedConv?.senderEmail === conv.senderEmail;
                return (
                  <button
                    key={key}
                    onClick={() => openConversation(conv)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${isActive ? "bg-indigo-50 border-l-4 border-indigo-500" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-gray-800 text-sm truncate flex-1">{conv.senderName}</p>
                      {conv.unread > 0 && (
                        <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5 ml-2 flex-shrink-0">{conv.unread}</span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-600 mb-1 truncate">🏠 {conv.houseTitle}</p>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(conv.lastTime).toLocaleDateString()}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Chat pane ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden">
            {!selectedConv ? (
              <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                <div>
                  <p className="text-4xl mb-3">👈</p>
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-4 border-b bg-indigo-600 text-white">
                  <p className="font-bold">{selectedConv.senderName}</p>
                  <p className="text-xs text-indigo-200">{selectedConv.senderEmail} · 🏠 {selectedConv.houseTitle}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
                  {convMessages.map((msg) => {
                    const isOwn = msg.senderEmail === user.email || msg.senderId?._id === user._id;
                    return (
                      <div key={msg._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          isOwn
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-white text-gray-800 rounded-bl-sm border"
                        } ${msg.isOptimistic ? "opacity-70" : ""}`}>
                          {!isOwn && (
                            <p className="text-xs font-semibold text-indigo-600 mb-1">{msg.senderName}</p>
                          )}
                          <p className="leading-relaxed">{msg.message}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-indigo-200" : "text-gray-400"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {msg.isOptimistic && " · sending..."}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {typingUser && (
                    <div className="flex justify-start">
                      <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs text-gray-500 shadow-sm flex gap-1 items-center">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                        <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                        <span className="ml-1">{typingUser} is typing</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Reply input */}
                <div className="p-3 border-t bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder="Reply to tenant..."
                      className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none"
                    />
                    <button
                      onClick={sendReply}
                      disabled={!replyInput.trim() || sending}
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
                    >
                      {sending ? "..." : "Send"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    ✉️ Tenant's email: <a href={`mailto:${selectedConv.senderEmail}`} className="text-indigo-600 hover:underline">{selectedConv.senderEmail}</a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerMessages;
