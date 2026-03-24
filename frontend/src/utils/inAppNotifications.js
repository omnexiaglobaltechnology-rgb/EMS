const MEETINGS_STORAGE_KEY = "ems_shared_meetings";
const ANNOUNCEMENTS_STORAGE_KEY = "ems_shared_announcements";
const TECH_SUPPORT_STORAGE_KEY = "ems_shared_tech_support_messages";
const NOTIFICATION_READS_KEY = "ems_notification_reads_v1";

const safeParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const getArray = (key) => {
  if (typeof window === "undefined") return [];
  const parsed = safeParse(localStorage.getItem(key) || "[]", []);
  return Array.isArray(parsed) ? parsed : [];
};

const parseTimestampFromId = (value) => {
  if (value === null || value === undefined) return null;

  const raw = String(value);
  const firstSegment = raw.includes("-") ? raw.split("-")[0] : raw;
  const numeric = Number(firstSegment);
  return Number.isFinite(numeric) ? numeric : null;
};

const parseTimestamp = (value, fallbackId) => {
  if (value) {
    const parsedDate = Date.parse(value);
    if (Number.isFinite(parsedDate)) return parsedDate;
  }

  const parsedIdTimestamp = parseTimestampFromId(fallbackId);
  if (parsedIdTimestamp) return parsedIdTimestamp;

  return Date.now();
};

const toUserKey = ({ role, email }) => {
  const normalizedRole = String(role || "unknown").toLowerCase();
  const normalizedEmail = String(email || "anonymous").toLowerCase();
  return `${normalizedRole}:${normalizedEmail}`;
};

const getReadMap = () => {
  if (typeof window === "undefined") return {};
  const parsed = safeParse(localStorage.getItem(NOTIFICATION_READS_KEY) || "{}", {});
  return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

const saveReadMap = (readMap) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATION_READS_KEY, JSON.stringify(readMap));
};

const getReadIds = ({ role, email }) => {
  const readMap = getReadMap();
  const userKey = toUserKey({ role, email });
  const value = readMap[userKey] || [];
  return Array.isArray(value) ? value : [];
};

const isMeetingsEnabledForRole = (_role) => {
  return true;
};

const isChatEnabledForRole = (_role) => {
  return true;
};

const buildMeetingNotifications = (role) => {
  if (!isMeetingsEnabledForRole(role)) return [];

  return getArray(MEETINGS_STORAGE_KEY)
    .filter((meeting) => {
      if (!Array.isArray(meeting?.targetRoles) || meeting.targetRoles.length === 0) {
        return false;
      }

      return meeting.targetRoles.includes(role) && meeting.creatorRole !== role;
    })
    .map((meeting) => ({
      id: `meeting:${meeting.id}`,
      type: "meeting",
      title: "New meeting assigned",
      message: meeting.datetime ? `${meeting.title} • ${meeting.datetime}` : meeting.title,
      timestamp: parseTimestamp(meeting.createdAt, meeting.id),
    }));
};

const buildAnnouncementNotifications = (role) => {
  if (!isChatEnabledForRole(role)) return [];

  return getArray(ANNOUNCEMENTS_STORAGE_KEY)
    .filter((announcement) => announcement?.sourceRole !== role)
    .map((announcement) => ({
      id: `announcement:${announcement.id}`,
      type: "announcement",
      title: "New announcement",
      message: `${announcement.from || "Announcement"}: ${announcement.text || ""}`,
      timestamp: parseTimestamp(announcement.createdAt, announcement.id),
    }));
};

const buildMessageNotifications = (role) => {
  if (!isChatEnabledForRole(role)) return [];

  return getArray(TECH_SUPPORT_STORAGE_KEY)
    .filter((message) => message?.sourceRole !== role)
    .map((message) => ({
      id: `message:${message.id}`,
      type: "message",
      title: "New message",
      message: `${message.from || "Message"}: ${message.text || ""}`,
      timestamp: parseTimestamp(message.createdAt, message.id),
    }));
};

export const getUserNotifications = ({ role, email, limit = 20 }) => {
  if (!role) return [];

  const readIds = new Set(getReadIds({ role, email }));

  const notifications = [
    ...buildMeetingNotifications(role),
    ...buildAnnouncementNotifications(role),
    ...buildMessageNotifications(role),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
    .map((notification) => ({
      ...notification,
      isRead: readIds.has(notification.id),
    }));

  return notifications;
};

export const markNotificationAsRead = ({ role, email, notificationId }) => {
  if (!role || !notificationId) return;

  const readMap = getReadMap();
  const userKey = toUserKey({ role, email });
  const existing = new Set(Array.isArray(readMap[userKey]) ? readMap[userKey] : []);
  existing.add(notificationId);
  readMap[userKey] = Array.from(existing);
  saveReadMap(readMap);
};

export const markAllNotificationsAsRead = ({ role, email, notificationIds = [] }) => {
  if (!role || notificationIds.length === 0) return;

  const readMap = getReadMap();
  const userKey = toUserKey({ role, email });
  const existing = new Set(Array.isArray(readMap[userKey]) ? readMap[userKey] : []);

  notificationIds.forEach((id) => existing.add(id));

  readMap[userKey] = Array.from(existing);
  saveReadMap(readMap);
};
