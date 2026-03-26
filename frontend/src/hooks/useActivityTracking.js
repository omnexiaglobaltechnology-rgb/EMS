import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { trackingApi } from "../utils/api";

const IDLE_THRESHOLD_MS = 60 * 1000;

const useActivityTracking = () => {
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const initializedRef = useRef(false);
  const currentPathRef = useRef("");
  const pageStartAtRef = useRef(0);

  const idleTimerRef = useRef(null);
  const idleStartAtRef = useRef(null);
  const isIdleRef = useRef(false);

  const safelyTrack = useCallback((trackFn) => {
    trackFn().catch((error) => {
      console.warn("[activity-tracking] event log failed:", error.message);
    });
  }, []);

  const pushPageVisit = useCallback((path, startedAt, keepalive = false) => {
    if (!isAuthenticated || !path) return;

    const duration = Math.max(0, Date.now() - startedAt);

    safelyTrack(() =>
      trackingApi.logPageActivity(
        {
          pagePath: path,
          pageTitle: document.title || "Untitled",
          duration,
        },
        { keepalive }
      )
    );
  }, [isAuthenticated, safelyTrack]);

  useEffect(() => {
    if (!isAuthenticated) {
      initializedRef.current = false;
      currentPathRef.current = "";
      pageStartAtRef.current = Date.now();
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      currentPathRef.current = location.pathname;
      pageStartAtRef.current = Date.now();
      return;
    }

    pushPageVisit(currentPathRef.current, pageStartAtRef.current);
    currentPathRef.current = location.pathname;
    pageStartAtRef.current = Date.now();
  }, [isAuthenticated, location.pathname, pushPageVisit]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleBeforeUnload = () => {
      pushPageVisit(currentPathRef.current, pageStartAtRef.current, true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isAuthenticated, pushPageVisit]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const resetIdleTimer = () => {
      if (isIdleRef.current) {
        const idleDuration = Math.max(0, Date.now() - (idleStartAtRef.current || Date.now()));
        isIdleRef.current = false;
        idleStartAtRef.current = null;

        safelyTrack(() => trackingApi.logIdleEnd(idleDuration));
      }

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        if (isIdleRef.current) return;

        isIdleRef.current = true;
        idleStartAtRef.current = Date.now();

        safelyTrack(() => trackingApi.logIdleStart());
      }, IDLE_THRESHOLD_MS);
    };

    const activityEvents = ["mousemove", "keydown", "scroll", "click", "touchstart"];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    resetIdleTimer();

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [isAuthenticated, safelyTrack]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const onBlur = () => {
      safelyTrack(() => trackingApi.logFocusLoss(location.pathname));
    };

    const onFocus = () => {
      safelyTrack(() => trackingApi.logFocusGain(location.pathname));
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, location.pathname, safelyTrack]);
};

export default useActivityTracking;
