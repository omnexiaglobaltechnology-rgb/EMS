/**
 * @deprecated This component is unused. Chat is handled by ChatInterface.jsx.
 * Kept for reference only.
 */
import { useEffect, useState, useRef } from "react";
import { Send, Trash2, Edit2, AlertCircle, MessageCircle } from "lucide-react";

// NOTE: useChatSocket hook and apiChat do not exist. This component is unused.
// If reactivating, implement the necessary hook and API methods first.
const useChatSocket = () => ({ socket: null, isConnected: false });
const apiChat = {
  getMessages: async () => [],
  editMessage: async () => {},
  deleteMessage: async () => {},
};

/**
 * ChatComponent handles the real-time chat interface for a specific chat room.
 * It manages WebSocket connections, message history, typing indicators, and user interactions.
 *
 * @param {string|number} chatId - Unique identifier for the chat room
 * @param {string|number} userId - ID of the currently logged-in user
 * @param {string} userName - Display name of the currently logged-in user
 */
const ChatComponent = ({ chatId, userId, userName }) => {
  const { socket, isConnected } = useChatSocket(); // Custom hook handling socket connection

  // State variables for managing chat functionality
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  // State for message editing functionality
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Reference to scroll to the latest message
  const messagesEndRef = useRef(null);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const data = await apiChat.getMessages(chatId);
        setMessages(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Failed to load messages:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [chatId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join chat
    socket.emit("join_chat", { chatId, userId });

    // Listen for new messages
    socket.on("new_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for edited messages
    socket.on("message_edited", (data) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.id ? { ...msg, ...data } : msg)),
      );
    });

    // Listen for deleted messages
    socket.on("message_deleted", (data) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.id));
    });

    // Listen for typing indicators
    socket.on("typing", (data) => {
      setTypingUsers((prev) => [...new Set([...prev, data.userName])]);
    });

    socket.on("stop_typing", (data) => {
      setTypingUsers((prev) => prev.filter((user) => user !== data.userId));
    });

    // Listen for errors
    socket.on("error", (error) => {
      setError(error.message);
      if (error.message.includes("muted")) {
        setIsMuted(true);
      }
    });

    return () => {
      socket.emit("leave_chat", { chatId, userId });
      socket.off("new_message");
      socket.off("message_edited");
      socket.off("message_deleted");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("error");
    };
  }, [socket, isConnected, chatId, userId]);

  /**
   * Sender handler for new messages. Emit via socket and locally clear input.
   * @param {Event} e - Form submission event
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      socket.emit("send_message", {
        chatId,
        senderId: userId,
        content: newMessage,
      });

      setNewMessage("");
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Edit handler. Commits changes via API and broadcasts edit event via socket.
   * @param {string|number} messageId - The ID of the message to edit
   */
  const handleEditMessage = async (messageId) => {
    if (!editContent.trim()) return;

    try {
      await apiChat.editMessage(messageId, editContent);
      socket.emit("edit_message", { messageId, content: editContent });
      setEditingMessageId(null);
      setEditContent("");
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Deletes a message through the API, broadcasts deletion via socket,
   * and removes it locally from state.
   * @param {string|number} messageId - The ID of the message to delete
   */
  const handleDeleteMessage = async (messageId) => {
    try {
      await apiChat.deleteMessage(messageId);
      socket.emit("delete_message", { messageId });
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Broadcasts to other users that the current user is typing.
   * Prevents spam by automatically stopping after 3s.
   */
  const handleTyping = () => {
    socket?.emit("user_typing", {
      chatId,
      userId,
      userName,
    });

    // Stop typing after 3 seconds of inactivity
    setTimeout(() => {
      socket?.emit("user_stopped_typing", {
        chatId,
        userId,
      });
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow">
        <h2 className="text-xl font-bold">Chat</h2>
        <p className="text-blue-100 text-sm">
          {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600">
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
          typing...
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === userId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === userId
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {message.senderId !== userId && (
                      <p className="text-xs font-semibold mb-1 opacity-90">
                        {message.sender?.name || message.sender?.email}
                      </p>
                    )}
                    {editingMessageId === message.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm text-gray-900 rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditMessage(message.id)}
                          className="text-xs bg-green-600 px-2 py-1 rounded text-white"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{message.content}</p>
                        {message.isEdited && (
                          <p className="text-xs opacity-70 mt-1">(edited)</p>
                        )}
                      </>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  {message.senderId === userId &&
                    editingMessageId !== message.id && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setEditContent(message.content);
                          }}
                          className="p-1 hover:bg-blue-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="p-1 hover:bg-red-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {isMuted ? (
        <div className="bg-red-50 border-t border-red-200 p-4 text-center">
          <p className="text-red-600 text-sm">
            ⚠️ You have been muted and cannot send messages.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="border-t p-4 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected || !newMessage.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChatComponent;
