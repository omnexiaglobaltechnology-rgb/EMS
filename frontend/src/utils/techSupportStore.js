const TECH_SUPPORT_STORAGE_KEY = "ems_shared_tech_support_messages";

const emitNotificationsUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("ems:notifications:updated"));
};

const parseMessages = (value) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getSharedTechSupportMessages = () => {
  const stored = localStorage.getItem(TECH_SUPPORT_STORAGE_KEY);
  return parseMessages(stored);
};

export const saveSharedTechSupportMessages = (messages) => {
  localStorage.setItem(TECH_SUPPORT_STORAGE_KEY, JSON.stringify(messages));
  emitNotificationsUpdated();
};

export const addSharedTechSupportMessage = (message) => {
  const existingMessages = getSharedTechSupportMessages();

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    from: message.from,
    text: message.text,
    time:
      message.time ||
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    sourceRole: message.sourceRole,
    type: "text",
    mine: false,
  };

  const updatedMessages = [...existingMessages, entry];
  saveSharedTechSupportMessages(updatedMessages);
  return entry;
};
