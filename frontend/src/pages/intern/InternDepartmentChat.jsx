import { useEffect, useState, useRef } from "react";
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
import { getSharedAnnouncements } from "../../utils/announcementsStore";
import {
  addSharedTechSupportMessage,
  getSharedTechSupportMessages,
} from "../../utils/techSupportStore";

/* INTERN DEPARTMENT DATA */
const internData = {
  channels: [
    /*
    {
      id: "general",
      name: "General Chat",
      description: "Main department discussion",
      type: "channel",
    },
    */
    {
      id: "announcements",
      name: "Announcements",
      description: "Important updates only",
      type: "channel",
    },
    {
      id: "tech-support",
      name: "Tech Support",
      description: "Help with tools & infra",
      type: "channel",
    },
    /*
    {
      id: "random",
      name: "Random",
      description: "Coffee breaks & fun",
      type: "channel",
    },
    */
  ],
  group: {
    id: "intern-dept-group",
    name: "All Interns",
    role: "Department Group",
    avatar: "https://ui-avatars.com/api/?name=AI&background=6366f1&color=fff",
    type: "group",
  },
};

/* INITIAL MESSAGES */
const initialMessages = {
  general: [
    {
      from: "John Williams",
      text: "Welcome to the General group!",
      time: "9:10 AM",
      mine: false,
      type: "text",
    },
    {
      from: "You",
      text: "Happy to be here.",
      time: "9:12 AM",
      mine: true,
      type: "text",
    },
  ],
  announcements: [
    {
      from: "HR Office",
      text: "Intern orientation is at 10 AM tomorrow.",
      time: "Yesterday",
      mine: false,
      type: "text",
    },
  ],
  "intern-dept-group": [
    {
      from: "Manager",
      text: "Welcome everyone to the Intern Department group!",
      time: "9:00 AM",
      mine: false,
      type: "text",
    },
  ],
  "tech-support": [],
  random: [],
};

/**
 * Communication portal for the intern department.
 * Facilitates access to announcements, technical support, and group discussions.
 */
const InternDepartmentChat = () => {
  const [activeChat, setActiveChat] = useState(internData.channels[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [sharedAnnouncements, setSharedAnnouncements] = useState([]);
  const [sharedTechSupportMessages, setSharedTechSupportMessages] = useState(
    [],
  );
  const [input, setInput] = useState("");
  const fileInputRef = useRef(null);

  const isAnnouncementsChannel = activeChat.id === "announcements";
  const isTechSupportChannel = activeChat.id === "tech-support";

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

  const currentMessages = isAnnouncementsChannel
    ? sharedAnnouncements
    : isTechSupportChannel
      ? sharedTechSupportMessages
      : messages[activeChat.id] || [];

  /**
   * Dispatches messages to the active channel or tech support stream.
   * Interns have read-only access to announcements.
   */
  const sendMessage = () => {
    if (isAnnouncementsChannel) return;
    if (!input.trim()) return;

    if (isTechSupportChannel) {
      const createdMessage = addSharedTechSupportMessage({
        from: "Intern",
        text: input,
        sourceRole: "intern",
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
   * Processes local file selection to share within the chat stream.
   * Generates a temporary blob URL for immediate visibility.
   *
   * @param {Event} e - HTML input change event
   */
  const handleFileUpload = (e) => {
    if (isAnnouncementsChannel) return;
    const file = e.target.files[0];
    if (!file) return;

    const newFileMessage = {
      from: "You",
      fileName: file.name,
      fileUrl: URL.createObjectURL(file), // Create a temporary URL
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
          <h2 className="font-bold text-xl text-slate-800">Intern Chat</h2>
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
            {internData.channels.map((c) => (
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

          {/* Department Group Section (Replaces Mentors) */}
          {/*
          <div className="px-4 py-2 text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
            <ChevronDown size={12} /> Team Groups
          </div>
          <div className="mt-1 space-y-1 px-2 mb-4">
            <button
              onClick={() => setActiveChat(internData.group)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                activeChat.id === internData.group.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "hover:bg-slate-200 text-slate-700"
              }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={internData.group.avatar}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover border border-white/20"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-semibold truncate leading-tight">
                  {internData.group.name}
                </div>
                <div
                  className={`text-[10px] truncate uppercase font-medium ${activeChat.id === internData.group.id ? "text-blue-100" : "text-slate-500"}`}
                >
                  {internData.group.role}
                </div>
              </div>
            </button>
          </div>
          */}
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
                  m.mine ? "items-end" : "items-start"
                }`}
              >
                {!m.mine &&
                  (activeChat.type === "group" ||
                    activeChat.type === "channel") && (
                    <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase bg-slate-50 px-1 rounded">
                      {m.from}
                    </span>
                  )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                    m.mine
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
        </div>

        {/* Message Input Area */}
        <div className="border-t border-gray-200 px-6 py-5 bg-white">
          {isAnnouncementsChannel ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Announcements are read-only for interns. Messages here are posted
              by Team Lead and TL Intern.
            </div>
          ) : null}
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl border border-gray-200 p-2 focus-within:border-blue-400 focus-within:ring-4 ring-blue-500/5 transition-all">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={isAnnouncementsChannel}
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Paperclip size={20} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={
                isAnnouncementsChannel
                  ? "Read-only announcements"
                  : `Message ${activeChat.name}...`
              }
              disabled={isAnnouncementsChannel}
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none border-none focus:ring-0"
            />
            <button
              onClick={sendMessage}
              disabled={isAnnouncementsChannel || !input.trim()}
              className={`rounded-xl px-5 py-2.5 font-bold text-sm transition-all flex items-center gap-2 ${
                !isAnnouncementsChannel && input.trim()
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

export default InternDepartmentChat;
