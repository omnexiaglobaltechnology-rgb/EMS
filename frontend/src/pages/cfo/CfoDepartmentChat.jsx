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
import {
  addSharedTechSupportMessage,
  getSharedTechSupportMessages,
} from "../../utils/techSupportStore";
import {
  addSharedAnnouncement,
  getSharedAnnouncements,
} from "../../utils/announcementsStore";

const people = {
  members: [
    {
      id: 1,
      name: "Alex Johnson",
      role: "Team Lead",
      online: true,
      avatar: "https://randomuser.me/api/portraits/men/11.jpg",
    },
    {
      id: 2,
      name: "Olivia Smith",
      role: "Senior Executive",
      online: true,
      avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    },
    {
      id: 3,
      name: "William Brown",
      role: "Coordinator",
      online: false,
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      id: 4,
      name: "Sophia Davis",
      role: "Associate",
      online: false,
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
  ],
  channels: [
    {
      id: "announcements",
      name: "Announcements",
      description: "Important updates only",
      type: "channel",
    },
    {
      id: "tech-support",
      name: "Tech Support",
      description: "Discussions on tech support",
      type: "channel",
    },
    {
      id: "team-updates",
      name: "Team Updates",
      description: "Updates from the team",
      type: "channel",
    },
  ],
  group: {
    id: 100,
    name: "Department Group",
    role: "Group Chat",
    avatar: "https://ui-avatars.com/api/?name=DG",
  },
  techSupport: {
    id: "tech-support",
    name: "Tech Support Feed",
    role: "Shared Inbox",
    avatar: "https://ui-avatars.com/api/?name=TS&background=0ea5e9&color=fff",
  },
};

const initialMessages = {
  announcements: [
    {
      from: "CFO Office",
      text: "Quarterly budget review scheduled for next week.",
      time: "Yesterday",
      mine: false,
      type: "text",
    },
  ],
  "tech-support": [],
  "team-updates": [],
  100: [],
};

/**
 * Dedicated departmental messaging platform for the CFO's organizational unit.
 * Manages channels, direct messages, file attachments, and an add-member interface.
 */
const CfoDepartmentChat = () => {
  const [activeChat, setActiveChat] = useState(people.channels[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const syncMessages = () => {
      const sharedTech = getSharedTechSupportMessages();
      const sharedAnnouncements = getSharedAnnouncements();

      setMessages((prev) => ({
        ...prev,
        "tech-support": [
          ...(initialMessages["tech-support"] || []),
          ...sharedTech,
        ],
        announcements: [
          ...(initialMessages.announcements || []),
          ...sharedAnnouncements,
        ],
      }));
    };

    syncMessages();
    window.addEventListener("ems:notifications:updated", syncMessages);
    return () =>
      window.removeEventListener("ems:notifications:updated", syncMessages);
  }, []);

  const currentMessages = messages[activeChat.id] || [];

  /**
   * Processes the user's input text and dispatches a simulated outgoing message
   * to the currently selected channel or direct message thread.
   */
  const sendMessage = () => {
    if (!input.trim()) return;

    if (activeChat.id === "tech-support") {
      addSharedTechSupportMessage({
        from: "CFO",
        text: input,
        sourceRole: "cfo",
      });
      setInput("");
      return;
    }

    if (activeChat.id === "announcements") {
      addSharedAnnouncement({
        from: "CFO",
        text: input,
        sourceRole: "cfo",
      });
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
   * Captures uploaded files from the hidden input, generated temporary local URLs,
   * and renders them as downloadable attachment messages in the chat.
   *
   * @param {Event} e - The file input event
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newMessage = {
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
      [activeChat.id]: [...(prev[activeChat.id] || []), newMessage],
    }));

    e.target.value = null;
  };

  /**
   * Invoked from the 'Add Members' modal to link an existing user to the group chat.
   *
   * @param {object} person - The user to be added
   */
  const addToGroup = (person) => {
    if (!groupMembers.some((m) => m.id === person.id)) {
      setGroupMembers([...groupMembers, person]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6.5rem)] rounded-xl border border-gray-300 bg-white overflow-hidden shadow-sm">
      {/* --- LEFT PANEL: NAVIGATION --- */}
      <div className="w-80 border-r border-gray-300 bg-slate-50 flex flex-col">
        <div className="p-4">
          <h2 className="font-bold text-xl text-slate-800">Department Chat</h2>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 ring-blue-500/20 transition-all">
            <Search size={16} className="text-slate-400" />
            <input
              placeholder="Search people..."
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
            {people.channels.map((c) => (
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

          {false && (
            <>
              {/* Members Section */}
              <div className="px-4 py-2 text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                <ChevronDown size={12} /> Members
              </div>

              <div className="mt-1 space-y-1 px-2">
                {people.members.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => setActiveChat(person)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                      activeChat.id === person.id
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={person.avatar}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover border border-white/20"
                      />
                      {person.online && (
                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 ${activeChat.id === person.id ? "bg-green-400 border-blue-600" : "bg-green-500 border-white"}`}
                        />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-semibold truncate leading-tight">
                        {person.name}
                      </div>
                      <div
                        className={`text-[10px] truncate uppercase font-medium ${activeChat.id === person.id ? "text-blue-100" : "text-slate-500"}`}
                      >
                        {person.role}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Group Chat Section */}
              <div className="mt-6 px-4 py-2 text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                <ChevronDown size={12} /> Groups
              </div>
              <div className="mt-1 space-y-1 px-2 pb-6">
                <button
                  onClick={() => setActiveChat(people.group)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                    activeChat.id === people.group.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={people.group.avatar}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover border border-white/20"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-sm font-semibold truncate leading-tight">
                      {people.group.name}
                    </div>
                    <div
                      className={`text-[10px] truncate uppercase font-medium ${activeChat.id === people.group.id ? "text-blue-100" : "text-slate-500"}`}
                    >
                      {people.group.role}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveChat(people.techSupport)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                    activeChat.id === people.techSupport.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={people.techSupport.avatar}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover border border-white/20"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-sm font-semibold truncate leading-tight">
                      {people.techSupport.name}
                    </div>
                    <div
                      className={`text-[10px] truncate uppercase font-medium ${activeChat.id === people.techSupport.id ? "text-blue-100" : "text-slate-500"}`}
                    >
                      {people.techSupport.role}
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
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
                {activeChat.type === "group" && (
                  <span className="ml-2 text-slate-400 font-normal">
                    • {groupMembers.length} Members
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeChat.id === people.group.id && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-200 text-xs font-bold transition-colors"
              >
                + Add People
              </button>
            )}
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
                className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}
              >
                {!m.mine && (
                  <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">
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

      {/* Add People Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-96 p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Add Members to Group
            </h2>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {people.members.map((person) => {
                const alreadyAdded = groupMembers.some(
                  (m) => m.id === person.id,
                );

                return (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={person.avatar}
                        className="h-9 w-9 rounded-full object-cover shadow-sm"
                        alt=""
                      />
                      <span className="font-semibold text-slate-700 text-sm">
                        {person.name}
                      </span>
                    </div>

                    {!alreadyAdded ? (
                      <button
                        onClick={() => addToGroup(person)}
                        className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        Add
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        Added
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CfoDepartmentChat;
