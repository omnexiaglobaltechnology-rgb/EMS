// API base URL configuration
const getApiUrls = () => {
  const rawUrl = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5000/api" : "https://ems-backend-mcf0.onrender.com/api");
  const apiBase = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
  const socketBase = apiBase.replace(/\/api$/, "");
  return { API_BASE_URL: apiBase, SOCKET_URL: socketBase };
};

export const { API_BASE_URL, SOCKET_URL } = getApiUrls();

const getStoredToken = () => {
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    return auth?.token || null;
  } catch {
    return null;
  }
};

// Generic fetch wrapper
export const apiFetch = async (endpoint, options = {}) => {
  const { method = "GET", body, isFormData = false, ...rest } = options;

  const config = {
    method,
    credentials: "include",
    ...rest,
  };

  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    config.headers = {
      "Content-Type": "application/json",
      ...rest.headers,
    };
  } else {
    config.headers = {
      ...rest.headers,
    };
  }

  const token = getStoredToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  if (body) {
    if (isFormData) {
      config.body = body; // FormData object
    } else {
      config.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      let parsedError = null;
      try {
        parsedError = await response.json();
      } catch (parseError) {
        console.error(`[apiFetch] Could not parse error response:`, parseError);
      }
      console.error(`[apiFetch] API Error Response:`, parsedError);
      throw new Error(
        parsedError?.error ||
        `API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Task API calls
export const tasksApi = {
  create: (taskData) => apiFetch("/tasks", { method: "POST", body: taskData }),
  getAll: () => apiFetch("/tasks", { method: "GET" }),
  getById: (id) => apiFetch(`/tasks/${id}`, { method: "GET" }),
  update: (id, taskData) => apiFetch(`/tasks/${id}`, { method: "PATCH", body: taskData }),
  delete: (id) => apiFetch(`/tasks/${id}`, { method: "DELETE" }),
  assign: (id, assignedToId, role) =>
    apiFetch(`/tasks/${id}/assign`, { method: "PATCH", body: { assignedToId, role } }),
  getVersions: (id) => apiFetch(`/tasks/${id}/versions`, { method: "GET" }),
};

export const authApi = {
  register: (userData) => apiFetch("/auth/register", { method: "POST", body: userData }),
  login: (credentials) => apiFetch("/auth/login", { method: "POST", body: credentials }),
  verifyEmail: (payload) => apiFetch("/auth/verify-email", { method: "POST", body: payload }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  me: () => apiFetch("/auth/me", { method: "GET" }),
  updateProfile: (data) => apiFetch("/auth/profile", { method: "PATCH", body: data }),
  changePassword: (data) => apiFetch("/auth/change-password", { method: "POST", body: data }),
};

export const trackingApi = {
  getTimeLogs: () => apiFetch("/tracking/time", { method: "GET" }),
  logLogout: () => apiFetch("/tracking/time/logout", { method: "POST" }),
  logPageActivity: (payload, extraOptions = {}) =>
    apiFetch("/tracking/page-activity", { method: "POST", body: payload, ...extraOptions }),
  logIdleStart: () => apiFetch("/tracking/idle", { method: "POST", body: { status: "start" } }),
  logIdleEnd: (duration) => apiFetch("/tracking/idle", { method: "POST", body: { status: "end", duration } }),
  logFocusLoss: (pagePath) => apiFetch("/tracking/focus", { method: "POST", body: { status: "loss", pagePath } }),
  logFocusGain: (pagePath) => apiFetch("/tracking/focus", { method: "POST", body: { status: "gain", pagePath } }),
  getPageActivity: () => apiFetch("/tracking/page-activity", { method: "GET" }),
};

// User management API calls
export const usersApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.role) query.set("role", params.role);
    if (params.departmentId) query.set("departmentId", params.departmentId);
    if (params.reportsTo) query.set("reportsTo", params.reportsTo);
    if (params.userType) query.set("userType", params.userType);
    if (params.search) query.set("search", params.search);
    const qs = query.toString();
    return apiFetch(`/auth/users${qs ? `?${qs}` : ""}`, { method: "GET" });
  },
  getByRole: (role) => apiFetch(`/auth/users${role ? `?role=${role}` : ''}`, { method: 'GET' }),
  getById: (id) => apiFetch(`/auth/users/${id}`, { method: 'GET' }),
  create: (userData) => apiFetch("/auth/admin/users", { method: "POST", body: userData }),
  update: (id, userData) => apiFetch(`/auth/admin/users/${id}/password`, { method: "PATCH", body: userData }),
  delete: (id) => apiFetch(`/auth/admin/users/${id}`, { method: "DELETE" }),
};

// Department API calls
export const departmentsApi = {
  getAll: (type) => apiFetch(`/departments${type ? `?type=${type}` : ""}`, { method: "GET" }),
  getUsers: (id) => apiFetch(`/departments/${id}/users`, { method: "GET" }),
};

// Chat API calls
export const chatApi = {
  getRooms: () => apiFetch("/chat/rooms", { method: "GET" }),
  getMessages: (id, params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page);
    if (params.limit) query.set("limit", params.limit);
    const qs = query.toString();
    return apiFetch(`/chat/rooms/${id}/messages${qs ? `?${qs}` : ""}`, { method: "GET" });
  },
  sendMessage: (roomId, formData) =>
    apiFetch(`/chat/rooms/${roomId}/messages`, { method: "POST", body: formData, isFormData: true }),
  renameRoom: (roomId, name) =>
    apiFetch(`/chat/rooms/${roomId}/rename`, { method: "PATCH", body: { name } }),
  getAnnouncements: () => apiFetch("/chat/announcements", { method: "GET" }),
  sendAnnouncement: (formData) =>
    apiFetch("/chat/announcements", { method: "POST", body: formData, isFormData: true }),
};

// Submissions API calls
export const submissionsApi = {
  create: (formData) => apiFetch("/submissions", { method: "POST", body: formData, isFormData: true }),
  getByTask: (taskId) => apiFetch(`/submissions/task/${taskId}`, { method: "GET" }),
  getById: (id) => apiFetch(`/submissions/${id}`, { method: "GET" }),
  getHistory: (taskId, userId) =>
    apiFetch(`/submissions/task/${taskId}/user/${userId}`, { method: "GET" }),
  review: (id, reviewData) => apiFetch(`/submissions/${id}/review`, { method: "PATCH", body: reviewData }),
  delete: (id) => apiFetch(`/submissions/${id}`, { method: "DELETE" }),
};

// Meetings API calls
export const meetingsApi = {
  create: (data) => apiFetch("/meetings", { method: "POST", body: data }),
  getAll: () => apiFetch("/meetings", { method: "GET" }),
  getById: (id) => apiFetch(`/meetings/${id}`, { method: "GET" }),
  update: (id, data) => apiFetch(`/meetings/${id}`, { method: "PATCH", body: data }),
  delete: (id) => apiFetch(`/meetings/${id}`, { method: "DELETE" }),
  updateInvitees: (id, invitees) =>
    apiFetch(`/meetings/${id}/invitees`, { method: "PATCH", body: { invitees } }),
  searchInvitees: (params = {}) => {
    const query = new URLSearchParams();
    if (params.departmentId) query.set("departmentId", params.departmentId);
    if (params.role) query.set("role", params.role);
    if (params.reportsTo) query.set("reportsTo", params.reportsTo);
    if (params.search) query.set("search", params.search);
    const qs = query.toString();
    return apiFetch(`/meetings/invitees/search${qs ? `?${qs}` : ""}`, { method: "GET" });
  },
};

export default apiFetch;
