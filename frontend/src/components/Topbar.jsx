import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const WATCHED_STORAGE_KEYS = ["auth", "ems_notifications"];
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../utils/inAppNotifications";
import { useTheme } from "../context/ThemeContext";
import { Menu, Moon, Sun, BellIcon, Terminal } from "lucide-react";

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

const Topbar = ({ onToggleSidebar }) => {
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
    <header className="h-20 glass-dark text-white border-b border-white/10 flex justify-between px-6 items-center fixed left-0 md:left-64 top-0 right-0 z-40 backdrop-blur-3xl shadow-2xl">
      <div className="flex items-center gap-6">
        <button
          onClick={onToggleSidebar}
          className="p-3 hover:bg-white/10 rounded-2xl md:hidden text-white/60 transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="flex items-center gap-3">
           <div className="p-2 bg-[#00d4ff]/10 rounded-xl border border-[#00d4ff]/20">
             <Terminal size={18} className="text-[#00d4ff] blue-glow" />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-white text-xs uppercase tracking-[0.25em]">
               Omnexia <span className="text-[#00d4ff] blue-glow">EMS</span>
             </span>
             <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] -mt-0.5">Command Console v4.0</span>
           </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all text-white/40 hover:text-white"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative p-3 rounded-2xl transition-all active:scale-95 ${isOpen ? 'bg-[#00d4ff]/20 text-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
          title="Secure Notifications"
        >
          <BellIcon size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] rounded-full min-w-4 h-4 flex items-center justify-center font-black shadow-lg">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-4 w-80 md:w-96 rounded-[2.5rem] border border-white/20 bg-slate-900/40 backdrop-blur-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
              <p className="text-xs font-black uppercase tracking-widest text-white">Data <span className="text-[#00d4ff] blue-glow">Streams</span></p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-black uppercase tracking-widest text-[#00d4ff] blue-glow hover:opacity-70 transition-opacity"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
              {notifications.length === 0 ? (
                <div className="px-8 py-12 text-[11px] font-bold text-white/30 text-center uppercase tracking-widest">
                  No incoming packets
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 my-1 rounded-2xl transition-all group ${
                      notification.isRead ? "bg-transparent text-white/60 hover:bg-white/5" : "bg-blue-500/10 text-white hover:bg-blue-500/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-[11px] font-black uppercase tracking-widest truncate ${!notification.isRead ? 'text-[#00d4ff] blue-glow' : 'text-white'}`}>
                          {notification.title}
                        </p>
                        <p className="text-[10px] text-white/40 mt-1 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,1)]" />
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
