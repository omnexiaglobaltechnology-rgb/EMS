import { createSlice } from "@reduxjs/toolkit";

const savedAuth = JSON.parse(localStorage.getItem("auth"));

/**
 * Redux slice for managing user authentication state.
 * Handles login, logout, and persistent storage of auth tokens in localStorage.
 */
const authSlice = createSlice({
  name: "auth",
  initialState: savedAuth || {
    isAuthenticated: false,
    token: null,
    id: null,
    name: null,
    role: null,
    email: null,
  },
  reducers: {
    /**
     * Updates the state with user session data and persists it to localStorage.
     *
     * @param {Object} state - Current auth state
     * @param {Object} action - Redux action containing payload (token and user info)
     */
    login: (state, action) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.id = action.payload.user.id;
      state.name = action.payload.user.name;
      state.role = action.payload.user.role;
      state.email = action.payload.user.email;

      localStorage.setItem(
        "auth",
        JSON.stringify({
          isAuthenticated: true,
          token: action.payload.token,
          id: action.payload.user.id,
          name: action.payload.user.name,
          role: action.payload.user.role,
          email: action.payload.user.email,
        }),
      );
    },
    /**
     * Clears user session data from state and removes item from localStorage.
     *
     * @param {Object} state - Current auth state
     */
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.id = null;
      state.name = null;
      state.role = null;
      state.email = null;

      localStorage.removeItem("auth");
    },
  },
});

export const { login, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
