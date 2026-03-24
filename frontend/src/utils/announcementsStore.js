const ANNOUNCEMENTS_STORAGE_KEY = "ems_shared_announcements";

const emitNotificationsUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("ems:notifications:updated"));
};

const parseAnnouncements = (value) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export const getSharedAnnouncements = () => {
  const stored = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
  return parseAnnouncements(stored);
};

export const saveSharedAnnouncements = (announcements) => {
  localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
  emitNotificationsUpdated();
};

export const addSharedAnnouncement = (message) => {
  const announcements = getSharedAnnouncements();
  const announcement = {
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
    mine: false,
    type: "text",
  };

  const updated = [...announcements, announcement];
  saveSharedAnnouncements(updated);
  return announcement;
};
