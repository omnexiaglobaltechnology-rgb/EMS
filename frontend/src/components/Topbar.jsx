import { useEffect, useMemo, useState } from "react";
import { BellIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../utils/inAppNotifications";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun } from "lucide-react";

const WATCHED_STORAGE_KEYS = [
  "ems_shared_meetings",
  "ems_shared_announcements",
  "ems_shared_tech_support_messages",
  "ems_notification_reads_v1",
];

const getMeetingsRoute = (role) => {
  if (!role) return null;
  if (role === "manager_intern") return "/manager_intern/intern-meetings";
  return `/${role}/meetings`;
};

const getChatRoute = (role) => {
  if (!role) return null;
  return `/${role}/chat`;
};

const getRouteForNotification = (role, type) => {
  if (type === "meeting") return getMeetingsRoute(role);
  return getChatRoute(role);
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString();
};

const Topbar = () => {
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth?.role);
  const email = useSelector((state) => state.auth?.email);
  const { theme, toggleTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = () => {
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
      window.removeEventListener("ems:notifications:updated", loadNotifications);
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

    const route = getRouteForNotification(role, notification.type);
    setIsOpen(false);
    loadNotifications();

    if (route) {
      navigate(route);
    }
  };

  return (
    <header
      className="h-14 bg-[#090E1A] text-white shadow flex justify-between px-6 items-center fixed left-64 top-0 right-0 z-30 border-b border-gray-700"
      style={{ height: 56 }}
    >
      <div className="flex items-center gap-4">
        <span className="font-semibold text-white">Enterprise Management System</span>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors text-gray-300"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative text-gray-600 cursor-pointer border border-gray-400 rounded-sm p-1"
          title="Notifications"
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <p className="font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
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
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                      notification.isRead ? "bg-white" : "bg-indigo-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
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
