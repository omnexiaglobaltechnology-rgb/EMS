import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./authSlice";

/**
 * Central Redux store configuration.
 * Aggregates all slice reducers into a unified state tree.
 */
export const store = configureStore({
  reducer: { auth: authReducer },
});
