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
  AlertCircle,
  Image as ImageIcon,
  Loader2,
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
    } catch {
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
    } catch {
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
    <div className="flex h-[calc(100vh-6.5rem)] rounded-[24px] border border-white/10 bg-[#0f172a] overflow-hidden shadow-2xl relative">
      {/* Pattern Background Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      {/* --- Sidebar: Rooms --- */}
      {type !== "announcements" && (
        <div className="w-72 border-r border-white/5 bg-white/5 backdrop-blur-xl flex flex-col shrink-0 z-10 relative">
          <div className="p-6 border-b border-white/5">
            <h2 className="font-black text-xl text-white flex items-center gap-2 tracking-tight">
              <MessageSquare size={20} className="text-indigo-500" /> Chat Rooms
            </h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1.5">Department Sync</p>
          </div>

          <div className="p-4">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-all" size={14} />
              <input
                placeholder="Search channels..."
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-3 text-[11px] font-bold text-white focus:ring-4 ring-indigo-500/10 outline-none transition-all placeholder:text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {(rooms || []).filter(room =>
              (room.customName || room.name || "").toLowerCase().includes(searchTerm.toLowerCase())
            ).map((room) => (
              <button
                key={room.id || room._id}
                onClick={() => setActiveRoom(room)}
               className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-300 group ${
                  activeRoom?.id === (room.id || room._id) || activeRoom?._id === (room.id || room._id)
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 active:scale-95"
                    : "hover:bg-white/5 text-slate-400 border border-transparent hover:border-white/5"
                }`}
              >
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  activeRoom?.id === (room.id || room._id) || activeRoom?._id === (room.id || room._id)
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-slate-500 border border-white/5 shadow-inner"
                }`}>
                  <Hash size={22} />
                </div>
                 <div className="flex-1 overflow-hidden">
                  <div className={`text-sm font-black truncate leading-tight ${
                    activeRoom?.id === (room.id || room._id) || activeRoom?._id === (room.id || room._id)
                      ? "text-white"
                      : "text-slate-300 group-hover:text-white"
                  }`}>
                    {room.customName || room.name}
                  </div>
                  <div className={`text-[9px] truncate uppercase tracking-widest font-black mt-1 ${
                    activeRoom?.id === (room.id || room._id) || activeRoom?._id === (room.id || room._id)
                      ? "text-indigo-200"
                      : "text-slate-500"
                  }`}>
                    {room.type?.replace(/_/g, " ")}
                  </div>
                </div>
              </button>
            ))}
            {filteredRooms.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center">
                <Search className="text-slate-800 mb-4" size={48} />
                <p className="text-xs text-slate-600 font-black uppercase tracking-widest">No active channels</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Main: Messages --- */}
      <div className="flex flex-1 flex-col bg-slate-950/30 overflow-hidden relative z-0">
         {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-8 py-5 bg-[#0f172a]/80 backdrop-blur-3xl z-10 sticky top-0 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
              {type === "announcements" ? <AlertCircle size={22} /> : <Hash size={22} />}
            </div>
            <div>
              <div className="font-black text-xl text-white tracking-tight leading-none group-hover:text-indigo-300 transition-all font-sans">
                {activeRoom?.customName || activeRoom?.name || "Ready to connect"}
              </div>
              <div className="text-[9px] text-indigo-500/70 font-black flex items-center gap-1.5 uppercase tracking-widest mt-2">
                <Clock size={10} className="text-indigo-500" /> 30-day retention
              </div>
            </div>
          </div>
          <button className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5">
            <MoreVertical size={20} />
          </button>
        </div>

         {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar scroll-smooth">
          {messages.length > 0 ? (
            messages.map((m, i) => (
              <div
                key={m.id || m._id || i}
                className={`flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-500 ${
                  m.senderId?._id === currentUserId || m.senderId === currentUserId
                    ? "items-end"
                    : "items-start"
                }`}
              >
                <div className="flex items-center gap-3 mb-2 px-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                     m.senderId?._id === currentUserId || m.senderId === currentUserId ? "text-indigo-400" : "text-slate-500"
                  }`}>
                    {m.senderName} <span className="mx-1 text-slate-800">•</span> {m.senderRole?.replace(/_/g, " ")}
                  </span>
                </div>
                                <div className={`group relative max-w-[75%] rounded-[24px] px-6 py-4 text-sm shadow-xl transition-all duration-300 ${
                  m.senderId?._id === currentUserId || m.senderId === currentUserId
                    ? "bg-indigo-600 text-white rounded-tr-none hover:bg-indigo-500 hover:scale-[1.01] shadow-indigo-600/20 font-bold"
                    : "bg-white/5 border border-white/10 text-slate-100 rounded-tl-none hover:border-white/20 backdrop-blur-xl font-bold"
                }`}>
                  {m.type === "image" || m.imageUrl ? (
                    <div className="space-y-4">
                       <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                          <img
                            src={getPublicUrl(m.imageUrl)}
                            alt="attachment"
                            className="max-h-96 w-auto cursor-pointer hover:scale-105 transition-transform duration-500"
                            onClick={() => window.open(getPublicUrl(m.imageUrl), "_blank")}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 pointer-events-none">
                            <ImageIcon size={16} className="text-white/80" />
                          </div>
                       </div>
                      {m.content && <p className="leading-relaxed">{m.content}</p>}
                    </div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
                
                <div className="mt-3 text-[10px] text-slate-600 font-black px-3 uppercase flex items-center gap-2 tracking-tighter shadow-sm">
                  <Clock size={10} /> {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {m.type === "announcement" && <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 text-[9px] font-black">HEADLINE</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="bg-white/5 p-12 rounded-[48px] border border-white/5 mb-8 animate-pulse shadow-2xl">
                <MessageSquare size={84} className="opacity-10 text-indigo-500" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-black uppercase tracking-[0.5em] text-slate-700">
                  Secure Sync Active
                </p>
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Archived history (30 days)</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>         {/* Input Area */}
        <div className="border-t border-white/5 px-8 py-6 bg-[#0f172a]/80 backdrop-blur-3xl z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
          {error && (
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 animate-in shake duration-500">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="flex items-center gap-4 bg-white/5 rounded-[22px] border-2 border-white/5 p-2 focus-within:border-indigo-500/40 focus-within:ring-[8px] ring-indigo-500/5 transition-all shadow-xl group/input">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept=".jpg,.jpeg,.png"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 text-slate-500 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5"
              title="Attach media (PNG/JPG)"
            >
              <Paperclip size={20} />
            </button>
            
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
              placeholder={activeRoom ? `Sync with ${activeRoom.customName || activeRoom.name}...` : "Select a channel"}
              className="flex-1 bg-transparent px-3 py-2 text-[15px] outline-none border-none focus:ring-0 placeholder:text-slate-700 font-bold text-white shadow-none"
              disabled={!activeRoom || sending}
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || !activeRoom}
              className={`rounded-xl px-7 py-3.5 font-black text-xs transition-all flex items-center gap-2 shadow-xl active:scale-95 ${
                input.trim() && !sending && activeRoom
                  ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30"
                  : "bg-white/5 text-slate-700 cursor-not-allowed border border-white/5"
              }`}
            >
               <span className="hidden sm:inline">TRANSMIT</span>
               {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} className={input.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
