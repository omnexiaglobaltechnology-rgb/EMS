// API base URL configuration
// API base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://ems-backend-seven-ruby.vercel.app/api";

const getStoredToken = () => {
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    return auth?.token || null;
  } catch (error) {
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
  // Create a new task
  create: (taskData) =>
    apiFetch("/tasks", {
      method: "POST",
      body: taskData,
    }),

  // Get all tasks
  getAll: () =>
    apiFetch("/tasks", {
      method: "GET",
    }),

  // Get task by ID
  getById: (id) =>
    apiFetch(`/tasks/${id}`, {
      method: "GET",
    }),

  // Update task
  update: (id, taskData) =>
    apiFetch(`/tasks/${id}`, {
      method: "PATCH",
      body: taskData,
    }),

  // Delete task
  delete: (id) =>
    apiFetch(`/tasks/${id}`, {
      method: "DELETE",
    }),

  // Assign task to user (Team Lead only)
  assign: (id, assignedToId, role) =>
    apiFetch(`/tasks/${id}/assign`, {
      method: "PATCH",
      body: { assignedToId, role },
    }),

  // Get task versions
  getVersions: (id) =>
    apiFetch(`/tasks/${id}/versions`, {
      method: "GET",
    }),
};

export const authApi = {
  register: (userData) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: userData,
    }),
  login: (credentials) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: credentials,
    }),
  verifyEmail: (payload) =>
    apiFetch("/auth/verify-email", {
      method: "POST",
      body: payload,
    }),
  logout: () =>
    apiFetch("/auth/logout", {
      method: "POST",
    }),
  me: () =>
    apiFetch("/auth/me", {
      method: "GET",
    }),
};

export const trackingApi = {
  getTimeLogs: () =>
    apiFetch("/tracking/time", {
      method: "GET",
    }),

  logLogout: () =>
    apiFetch("/tracking/time/logout", {
      method: "POST",
    }),

  logPageActivity: (payload, extraOptions = {}) =>
    apiFetch("/tracking/page-activity", {
      method: "POST",
      body: payload,
      ...extraOptions,
    }),

  logIdleStart: () =>
    apiFetch("/tracking/idle", {
      method: "POST",
      body: { status: "start" },
    }),

  logIdleEnd: (duration) =>
    apiFetch("/tracking/idle", {
      method: "POST",
      body: { status: "end", duration },
    }),

  logFocusLoss: (pagePath) =>
    apiFetch("/tracking/focus", {
      method: "POST",
      body: { status: "loss", pagePath },
    }),

  logFocusGain: (pagePath) =>
    apiFetch("/tracking/focus", {
      method: "POST",
      body: { status: "gain", pagePath },
    }),

  getPageActivity: () =>
    apiFetch("/tracking/page-activity", {
      method: "GET",
    }),
};

// Submissions API calls
export const submissionsApi = {
  // Create a new submission (with file upload)
  create: (formData) =>
    apiFetch("/submissions", {
      method: "POST",
      body: formData,
      isFormData: true,
    }),

  // Get all submissions for a task
  getByTask: (taskId) =>
    apiFetch(`/submissions/task/${taskId}`, {
      method: "GET",
    }),

  // Get submission by ID
  getById: (id) =>
    apiFetch(`/submissions/${id}`, {
      method: "GET",
    }),

  // Get submission history (all submissions from a user for a task)
  getHistory: (taskId, userId) =>
    apiFetch(`/submissions/task/${taskId}/user/${userId}`, {
      method: "GET",
    }),

  // Review submission (approve/reject)
  review: (id, reviewData) =>
    apiFetch(`/submissions/${id}/review`, {
      method: "PATCH",
      body: reviewData,
    }),

  // Delete submission
  delete: (id) =>
    apiFetch(`/submissions/${id}`, {
      method: "DELETE",
    }),
};

// Users API calls
export const usersApi = {
  // Get all users, optionally filtered by role (e.g. 'intern', 'team_lead')
  getByRole: (role) =>
    apiFetch(`/auth/users${role ? `?role=${role}` : ''}`, {
      method: 'GET',
    }),
};

export default apiFetch;
