import { useState, useRef, useEffect } from "react";
import {
  Search,
  Send,
  Paperclip,
  Hash,
  ChevronDown,
  MessageSquare,
  MoreVertical,
  File,
} from "lucide-react";

import Avatar from "../../components/tl-panel/Avatar";
import MessageBubble from "../../components/tl-panel/MessageBubble";
import {
  addSharedAnnouncement,
  getSharedAnnouncements,
} from "../../utils/announcementsStore";
import {
  addSharedTechSupportMessage,
  getSharedTechSupportMessages,
} from "../../utils/techSupportStore";

/* TL INTERN DATA */
const tlInternData = {
  channels: [
    {
      id: "announcements",
      name: "Announcements",
      description: "Important updates",
      type: "channel",
    },
    {
      id: "tech-support",
      name: "Tech Support",
      description: "Help with tools & infra",
      type: "channel",
    },
  ],
};

const initialMessages = {
  announcements: [],
  "tech-support": [],
};

/**
 * Department communication center for Team Lead Interns.
 * Integrates with shared announcement and tech support stores.
 */
const TlDepartmentChat = () => {
  const [activeChat, setActiveChat] = useState(tlInternData.channels[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [sharedAnnouncements, setSharedAnnouncements] = useState([]);
  const [sharedTechSupportMessages, setSharedTechSupportMessages] = useState(
    [],
  );
  const [input, setInput] = useState("");
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat, messages, sharedAnnouncements, sharedTechSupportMessages]);

  useEffect(() => {
    setSharedAnnouncements(getSharedAnnouncements());
    setSharedTechSupportMessages(getSharedTechSupportMessages());

    const onStorage = (event) => {
      if (event.key === "ems_shared_announcements") {
        setSharedAnnouncements(getSharedAnnouncements());
      }
      if (event.key === "ems_shared_tech_support_messages") {
        setSharedTechSupportMessages(getSharedTechSupportMessages());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const currentMessages =
    activeChat.id === "announcements"
      ? sharedAnnouncements
      : activeChat.id === "tech-support"
        ? sharedTechSupportMessages
        : messages[activeChat.id] || [];

  /**
   * Sends a message to the current channel.
   * Handles storage of announcements and tech support messages in the global store.
   */
  const sendMessage = () => {
    if (!input.trim()) return;

    if (activeChat.id === "announcements") {
      const createdAnnouncement = addSharedAnnouncement({
        from: "TL Intern",
        text: input,
        sourceRole: "team_lead_intern",
      });
      setSharedAnnouncements((prev) => [...prev, createdAnnouncement]);
      setInput("");
      return;
    }

    if (activeChat.id === "tech-support") {
      const createdMessage = addSharedTechSupportMessage({
        from: "TL Intern",
        text: input,
        sourceRole: "team_lead_intern",
      });
      setSharedTechSupportMessages((prev) => [...prev, createdMessage]);
      setInput("");
      return;
    }

    const newMessage = {
      from: "You",
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      mine: true,
      type: "text",
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMessage],
    }));
    setInput("");
  };

  /**
   * Logic for uploading and previewing files in chat.
   *
   * @param {Event} e - Input change event
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newFileMessage = {
      from: "You",
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      mine: true,
      type: "file",
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newFileMessage],
    }));
    e.target.value = null; // Reset input
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] rounded-xl border border-gray-300 bg-white overflow-hidden shadow-sm">
      {/* --- LEFT PANEL: NAVIGATION --- */}
      <div className="w-80 border-r border-gray-300 bg-slate-50 flex flex-col">
        <div className="p-4">
          <h2 className="font-bold text-xl text-slate-800">
            Team Lead Intern Chat
          </h2>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 ring-blue-500/20 transition-all">
            <Search size={16} className="text-slate-400" />
            <input
              placeholder="Search chat..."
              className="w-full text-sm outline-none border-none focus:ring-0 p-0 bg-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Channel List */}
          <div className="px-4 py-2 text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
            <Hash size={12} /> Channels
          </div>
          <div className="mt-1 space-y-1 px-2 mb-4">
            {tlInternData.channels.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChat(c)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                  activeChat.id === c.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${activeChat.id === c.id ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500"}`}
                >
                  <Hash size={18} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-semibold truncate leading-tight">
                    {c.name}
                  </div>
                  <div
                    className={`text-[10px] truncate uppercase font-medium ${activeChat.id === c.id ? "text-blue-100" : "text-slate-500"}`}
                  >
                    {c.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL: CHAT INTERFACE --- */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white z-10">
          <div className="flex items-center gap-3">
            {activeChat.avatar ? (
              <img
                src={activeChat.avatar}
                className="h-10 w-10 rounded-full object-cover border border-gray-100"
                alt=""
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <Hash size={20} />
              </div>
            )}
            <div>
              <div className="font-bold text-slate-800 leading-tight">
                {activeChat.name}
              </div>
              <div className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                {activeChat.online && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                )}
                {activeChat.description || activeChat.role}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-[#F9FBFE]">
          {currentMessages.length > 0 ? (
            currentMessages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  m.mine || m.from === "TL Intern" ? "items-end" : "items-start"
                }`}
              >
                {!(m.mine || m.from === "TL Intern") &&
                  (activeChat.type === "group" ||
                    activeChat.type === "channel") && (
                    <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase bg-slate-50 px-1 rounded">
                      {m.from}
                    </span>
                  )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                    m.mine || m.from === "TL Intern"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white border border-gray-200 text-slate-800 rounded-tl-none"
                  }`}
                >
                  {m.type === "file" ? (
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 underline hover:text-blue-100 transition-colors"
                    >
                      <File size={16} />
                      {m.fileName}
                    </a>
                  ) : (
                    m.text
                  )}
                </div>
                <div className="mt-1.5 text-[10px] text-slate-400 px-1 font-medium italic">
                  {m.time}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="bg-slate-100 p-4 rounded-full mb-3">
                <MessageSquare size={32} className="opacity-20" />
              </div>
              <p className="text-sm font-medium italic">
                No messages in this chat yet.
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="border-t border-gray-200 px-6 py-5 bg-white">
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl border border-gray-200 p-2 focus-within:border-blue-400 focus-within:ring-4 ring-blue-500/5 transition-all">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Paperclip size={20} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={`Message ${activeChat.name}...`}
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none border-none focus:ring-0"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className={`rounded-xl px-5 py-2.5 font-bold text-sm transition-all flex items-center gap-2 ${
                input.trim()
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <span>Send</span>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TlDepartmentChat;
