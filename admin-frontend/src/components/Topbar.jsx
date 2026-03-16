import { useEffect, useMemo, useState } from "react";
import { BellIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../utils/inAppNotifications";

const WATCHED_STORAGE_KEYS = [
  "ems_shared_meetings",
  "ems_shared_announcements",
  "ems_shared_tech_support_messages",
  "ems_notification_reads_v1",
];

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString();
};

const Topbar = () => {
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth?.role);
  const email = useSelector((state) => state.auth?.email);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = () => {
    // In admin-frontend, admins see 0 notifications since meetings/chats/announcements are disabled for them.
    setNotifications(getUserNotifications({ role, email, limit: 25 }));
  };

  useEffect(() => {
    loadNotifications();

    const onStorage = (event) => {
      if (!event.key || WATCHED_STORAGE_KEYS.includes(event.key)) {
        loadNotifications();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("ems:notifications:updated", loadNotifications);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "ems:notifications:updated",
        loadNotifications,
      );
    };
  }, [role, email]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const handleMarkAllRead = () => {
    const unreadIds = notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);

    markAllNotificationsAsRead({
      role,
      email,
      notificationIds: unreadIds,
    });

    loadNotifications();
  };

  const handleNotificationClick = (notification) => {
    markNotificationAsRead({
      role,
      email,
      notificationId: notification.id,
    });

    setIsOpen(false);
    loadNotifications();
    // No routing needed for admin as they don't have personal notification destinations
  };

  return (
    <header
      className="h-20 glass m-6 rounded-3xl flex justify-between px-8 items-center fixed left-64 top-0 right-0 z-30 border border-white/30"
      style={{ left: 256 + 24, width: `calc(100% - ${256 + 48}px)` }}
    >
      <span className="font-black text-white uppercase tracking-widest text-xs opacity-80">
        Administrative <span className="text-[#00fbff] cyan-glow">Command Console</span>
      </span>

      <div className="relative">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative text-white/60 cursor-pointer border border-white/30 bg-white/30 rounded-xl p-2.5 hover:bg-white/40 hover:text-[#00fbff] transition-all duration-300"
          title="Notifications"
        >
          <BellIcon size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#00fbff] text-slate-900 text-[10px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-black shadow-[0_0_15px_rgba(0,251,255,0.6)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-4 w-96 rounded-2xl glass-dark shadow-2xl z-50 overflow-hidden border border-white/30 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/30">
              <p className="font-semibold text-white">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500 text-center">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 border-b border-white/30 hover:bg-white/30 transition-colors ${
                      notification.isRead ? "text-white/70" : "bg-white/30 text-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-white/60 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-white/40 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-[#00fbff] shadow-[0_0_8px_rgba(0,251,255,0.8)]" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
