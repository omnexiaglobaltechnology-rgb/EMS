import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import {
  Search,
  Send,
  Paperclip,
  Hash,
  MessageSquare,
  MoreVertical,
  Clock,
  User as UserIcon,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { chatApi, SOCKET_URL } from "../utils/api";

/**
 * Unified Chat Interface for all departments and roles.
 * Supports tech support rooms, announcements, and hierarchy-aware visibility.
 */
const ChatInterface = ({ type = "chat" }) => {
  const currentUserId = useSelector((state) => state.auth?.id);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initial load: Fetch rooms or announcements
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (type === "announcements") {
          const data = await chatApi.getAnnouncements();
          setMessages(data);
          setRooms([{ id: "announcements", name: "Global Announcements", type: "announcement" }]);
          setActiveRoom({ id: "announcements", name: "Global Announcements", type: "announcement" });
        } else {
          const data = await chatApi.getRooms();
          setRooms(data);
          if (data.length > 0) setActiveRoom(data[0]);
        }
      } catch (err) {
        setError("Failed to load chat data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type]);

  // Fetch messages when activeRoom changes
  useEffect(() => {
    if (!activeRoom || activeRoom.id === "announcements") return;

    const fetchMessages = async () => {
      try {
        const data = await chatApi.getMessages(activeRoom.id || activeRoom._id);
        setMessages(data);
        scrollToBottom();
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [activeRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || !activeRoom) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("content", input);
      formData.append("type", "text");

      if (type === "announcements") {
        await chatApi.sendAnnouncement(formData);
        const data = await chatApi.getAnnouncements();
        setMessages(data);
      } else {
        await chatApi.sendMessage(activeRoom.id || activeRoom._id, formData);
        const data = await chatApi.getMessages(activeRoom.id || activeRoom._id);
        setMessages(data);
      }
      setInput("");
      scrollToBottom();
    } catch (err) {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeRoom) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only PNG and JPG images are allowed");
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", "image");

      if (type === "announcements") {
        await chatApi.sendAnnouncement(formData);
        const data = await chatApi.getAnnouncements();
        setMessages(data);
      } else {
        await chatApi.sendMessage(activeRoom.id || activeRoom._id, formData);
        const data = await chatApi.getMessages(activeRoom.id || activeRoom._id);
        setMessages(data);
      }
      scrollToBottom();
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setSending(false);
      e.target.value = null;
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPublicUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${SOCKET_URL}${path}`;
  };

  if (loading && !activeRoom) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <Clock className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-500">Connecting to secure chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-lg shadow-slate-200/50">
      {/* --- Sidebar: Rooms --- */}
      {type !== "announcements" && (
        <div className="w-80 border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-500" /> Chat Rooms
            </h2>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                placeholder="Search rooms..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs focus:ring-2 ring-blue-500/10 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredRooms.map((room) => (
              <button
                key={room.id || room._id}
                onClick={() => setActiveRoom(room)}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  activeRoom?.id === (room.id || room._id) || activeRoom?._id === (room.id || room._id)
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "hover:bg-white hover:shadow-sm text-slate-600"
                }`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  activeRoom?.id === (room.id || room._id) || activeRoom?._id === (room.id || room._id)
                    ? "bg-blue-500 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}>
                  <Hash size={18} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-bold truncate leading-tight">
                    {room.customName || room.name}
                  </div>
                  <div className={`text-[10px] truncate uppercase tracking-wider font-semibold ${
                    activeRoom?.id === (room.id || room._id) || activeRoom?._id === (room.id || room._id)
                      ? "text-blue-100/70"
                      : "text-slate-400"
                  }`}>
                    {room.type?.replace(/_/g, " ")}
                  </div>
                </div>
              </button>
            ))}
            {filteredRooms.length === 0 && (
              <p className="p-4 text-center text-xs text-slate-400">No rooms found</p>
            )}
          </div>
        </div>
      )}

      {/* --- Main: Messages --- */}
      <div className="flex flex-1 flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              {type === "announcements" ? <AlertCircle size={20} /> : <Hash size={20} />}
            </div>
            <div>
              <div className="font-bold text-slate-800 leading-tight">
                {activeRoom?.customName || activeRoom?.name || "Select a room"}
              </div>
              <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest">
                <Clock size={10} /> 30-day Retention Active
              </div>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-slate-50/30 pattern-graph-paper">
          {messages.length > 0 ? (
            messages.map((m, i) => (
              <div
                key={m.id || m._id || i}
                className={`flex flex-col ${
                  m.senderId?._id === currentUserId || m.senderId === currentUserId
                    ? "items-end"
                    : "items-start"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {m.senderName} • {m.senderRole?.replace(/_/g, " ")}
                  </span>
                </div>
                
                <div className={`group relative max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all ${
                  m.senderId?._id === currentUserId || m.senderId === currentUserId
                    ? "bg-indigo-600 text-white rounded-tr-none hover:bg-indigo-700"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none hover:border-slate-300"
                }`}>
                  {m.type === "image" || m.imageUrl ? (
                    <div className="space-y-2">
                       <img
                        src={getPublicUrl(m.imageUrl)}
                        alt="attachment"
                        className="rounded-lg max-h-60 w-auto cursor-pointer border border-black/10"
                        onClick={() => window.open(getPublicUrl(m.imageUrl), "_blank")}
                      />
                      {m.content && <p>{m.content}</p>}
                    </div>
                  ) : (
                    <p className="leading-relaxed">{m.content}</p>
                  )}
                </div>
                
                <div className="mt-1 text-[9px] text-slate-400 font-bold px-1 uppercase flex items-center gap-1">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {m.type === "announcement" && <span className="bg-amber-100 text-amber-600 px-1 rounded">Announcement</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="bg-slate-100 p-6 rounded-full mb-4 animate-pulse">
                <MessageSquare size={48} className="opacity-10 text-indigo-500" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-300">
                End of history (30-day limit)
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 px-6 py-5 bg-white">
          {error && (
            <div className="mb-3 flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl border border-slate-200 p-2 focus-within:border-indigo-400 focus-within:ring-4 ring-indigo-500/5 transition-all">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept=".jpg,.jpeg,.png"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all hover:shadow-sm"
              title="Upload Screenshot (PNG/JPG)"
            >
              <Paperclip size={20} />
            </button>
            
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
              placeholder={activeRoom ? `Message ${activeRoom.customName || activeRoom.name}...` : "Select a room to chat"}
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none focus:ring-0 placeholder:text-slate-400 font-medium"
              disabled={!activeRoom || sending}
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || !activeRoom}
              className={`rounded-xl px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 shadow-lg ${
                input.trim() && !sending && activeRoom
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              {sending ? <Clock className="animate-spin" size={16} /> : <Send size={16} />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
