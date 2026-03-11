import { useEffect, useState, useRef } from "react";
import {
  Search,
  Send,
  Paperclip,
  Hash,
  MoreVertical,
  File,
  MessageSquare,
} from "lucide-react";
import {
  addSharedTechSupportMessage,
  getSharedTechSupportMessages,
} from "../../utils/techSupportStore";

/* MANAGER GROUP CHANNELS */
const channels = [
  {
    id: "team-updates",
    name: "Team Updates",
    description: "Daily standups & progress updates",
  },
  // {
  //     id: "intern-coordination",
  //     name: "Intern Coordination",
  //     description: "Assign tasks & review submissions",
  // },
  // {
  //     id: "project-escalations",
  //     name: "Project Escalations",
  //     description: "Issues needing higher attention",
  // },
  {
    id: "tech-support",
    name: "Tech Support",
    description: "Help with tools & infra",
  },
  {
    id: "announcements",
    name: "Announcements",
    description: "Important leadership updates",
  },
];

/* INITIAL GROUP MESSAGES */
const initialMessages = {
  "team-updates": [
    {
      user: "John Williams",
      text: "Frontend module completed. Moving to API integration.",
      time: "9:15 AM",
    },
    {
      user: "You",
      text: "Great work. Please update the sprint board.",
      time: "9:20 AM",
      mine: true,
    },
  ],
  "intern-coordination": [
    {
      user: "Sophia Kim",
      text: "I’ve submitted the dashboard task for review.",
      time: "Yesterday",
    },
  ],
  "project-escalations": [],
  "tech-support": [],
  announcements: [
    {
      user: "CTO Office",
      text: "Quarterly review meeting scheduled for Friday.",
      time: "2 days ago",
    },
  ],
};

/**
 * Specialized chat interface for manager-intern coordination.
 * Connects interns with technical support and team-level communications.
 */
const Manager_internDepartmentChat = () => {
  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [sharedTechSupportMessages, setSharedTechSupportMessages] = useState(
    [],
  );
  const [input, setInput] = useState("");

  useEffect(() => {
    setSharedTechSupportMessages(getSharedTechSupportMessages());

    const onStorage = (event) => {
      if (event.key === "ems_shared_tech_support_messages") {
        setSharedTechSupportMessages(getSharedTechSupportMessages());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const currentMessages =
    activeChannel.id === "tech-support"
      ? sharedTechSupportMessages
      : messages[activeChannel.id] || [];

  /**
   * Forwards user messages to the active channel or tech support stream.
   */
  const sendMessage = () => {
    if (!input.trim()) return;

    if (activeChannel.id === "tech-support") {
      const createdMessage = addSharedTechSupportMessage({
        from: "Manager Intern",
        text: input,
        sourceRole: "manager_intern",
      });
      setSharedTechSupportMessages((prev) => [...prev, createdMessage]);
      setInput("");
      return;
    }

    setMessages((prev) => ({
      ...prev,
      [activeChannel.id]: [
        ...(prev[activeChannel.id] || []),
        {
          user: "You",
          text: input,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          mine: true,
        },
      ],
    }));

    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-6.5rem)] rounded-xl border border-gray-300 bg-white overflow-hidden shadow-sm">
      {/* ---------------- LEFT SIDEBAR ---------------- */}
      <div className="w-80 border-r border-gray-300 bg-slate-50 flex flex-col">
        <div className="p-4 text-xl font-bold text-slate-800">Manager Chat</div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 ring-blue-500/20 transition-all">
            <Search size={16} className="text-slate-400" />
            <input
              placeholder="Search channel..."
              className="w-full text-sm outline-none border-none focus:ring-0 p-0 bg-transparent"
            />
          </div>
        </div>

        {/* Channel List */}
        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
          <Hash size={12} /> Channels
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                activeChannel.id === channel.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "hover:bg-slate-200 text-slate-700"
              }`}
            >
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${activeChannel.id === channel.id ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500"}`}
              >
                <Hash size={18} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-semibold truncate leading-tight">
                  {channel.name}
                </div>
                <div
                  className={`text-[10px] truncate uppercase font-medium ${activeChannel.id === channel.id ? "text-blue-100" : "text-slate-500"}`}
                >
                  {channel.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- RIGHT CHAT AREA ---------------- */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Hash size={20} />
            </div>
            <div>
              <div className="font-bold text-slate-800 leading-tight">
                {activeChannel.name}
              </div>
              <div className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                {activeChannel.description}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-[#F9FBFE]">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="bg-slate-100 p-4 rounded-full mb-3">
                <MessageSquare size={32} className="opacity-20" />
              </div>
              <p className="text-sm font-medium italic">
                No messages in this chat yet.
              </p>
            </div>
          ) : (
            currentMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.mine ? "items-end" : "items-start"}`}
              >
                {!msg.mine && (
                  <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">
                    {msg.user || msg.from}
                  </span>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                    msg.mine
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white border border-gray-200 text-slate-800 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
                <div className="mt-1.5 text-[10px] text-slate-400 px-1 font-medium italic">
                  {msg.time}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 px-6 py-5 bg-white">
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl border border-gray-200 p-2 focus-within:border-blue-400 focus-within:ring-4 ring-blue-500/5 transition-all">
            <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
              <Paperclip size={20} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={`Message #${activeChannel.name}...`}
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

export default Manager_internDepartmentChat;
