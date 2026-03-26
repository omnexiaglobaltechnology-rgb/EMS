import "./polyfills";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { store } from "./redux/store.js";

import { Provider } from "react-redux";
import { ThemeProvider } from "./context/ThemeContext.jsx";


if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);
            // Check for updates on every page load
            registration.update();
            // When a new SW is found, activate it immediately
            registration.onupdatefound = () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.onstatechange = () => {
                        if (newWorker.state === 'activated') {
                            // New service worker activated — reload to get fresh content
                            if (navigator.serviceWorker.controller) {
                                console.log('New SW activated, reloading for fresh content');
                                window.location.reload();
                            }
                        }
                    };
                }
            };
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </Provider>
    </StrictMode>,
);
