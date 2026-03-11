/**
 * Represents a single chat message bubble within a conversation.
 * Determines styling automatically based on whether the sender is the current user.
 *
 * @param {object} msg - The message object containing the text and sender identifier
 */
const MessageBubble = ({ msg }) => {
  const isMe = msg.from === "me";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs rounded-xl px-4 py-2 text-sm ${
          isMe
            ? "bg-indigo-600 text-white"
            : "bg-white border border-slate-200 text-slate-900"
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
};

export default MessageBubble;
