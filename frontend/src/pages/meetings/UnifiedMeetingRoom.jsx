import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer/simplepeer.min.js";
import {
  Loader2, Copy, Check, Video, PhoneOff, UserPlus, MessageSquare, ScreenShare,
  Mic, MicOff, VideoOff, Send, X, Users, Search, Pin, PinOff
} from "lucide-react";
import { meetingsApi, authApi, usersApi, SOCKET_URL } from "../../utils/api";

// ─── ICE Configuration ──────────────────────────────────────────────────────
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turns:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const UnifiedMeetingRoom = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();

  // ── User & Meeting State ─────────────────────────────────────────────────
  const [me, setMe] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [isJoined, setIsJoined] = useState(false);

  // ── Media State ──────────────────────────────────────────────────────────
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [stream, setStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // ── Peers State ──────────────────────────────────────────────────────────
  const [peers, setPeers] = useState([]);

  // ── Pin / Spotlight State ────────────────────────────────────────────────
  // pinnedId: null (grid view) | "local" (pin self) | socketId (pin a remote peer)
  const [pinnedId, setPinnedId] = useState(null);

  // ── Chat & Sidebar ──────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Invite State ─────────────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const userVideoRef = useRef(null);
  const peersRef = useRef(new Map());
  const myIdRef = useRef(null);
  // Keep track of mic state in ref for use inside stopScreenShare
  const micOnRef = useRef(true);
  // Guard against double-invocation of stopScreenShare
  const stoppingShareRef = useRef(false);
  // The original stream that peers were created with (for replaceTrack)
  const peerStreamRef = useRef(null);

  // Keep micOnRef in sync
  useEffect(() => { micOnRef.current = micOn; }, [micOn]);

  // ═════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const userData = await authApi.me();
        if (cancelled) return;
        setMe(userData);
        myIdRef.current = String(userData?.id || userData?._id);

        const meetingData = await meetingsApi.getById(roomId);
        if (cancelled) return;
        setMeeting(meetingData);

        await requestMedia(true, true);
      } catch (err) {
        console.error("[MEET] Init failed:", err);
      }
    };
    init();

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ═════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═════════════════════════════════════════════════════════════════════════
  const cleanup = useCallback(() => {
    for (const [, entry] of peersRef.current) {
      try { entry.peer.destroy(); } catch (e) { /* ignore */ }
    }
    peersRef.current = new Map();
    setPeers([]);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // LOCAL VIDEO PREVIEW (ECHO-PROOF)
  // ═════════════════════════════════════════════════════════════════════════
  // ─── MEDIA MANAGEMENT ──────────────────────────────────────────────────────
  const requestMedia = async (audio, video) => {
    try {
      const constraints = {
        video: video
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24 } }
          : false,
        audio: audio
          ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 }
          : false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      streamRef.current = newStream;
      console.log("[MEET] Local stream ID:", newStream.id);
      return newStream;
    } catch (err) {
      console.error("[MEET] Media error:", err);
      return null;
    }
  };

  const [videoElMounted, setVideoElMounted] = useState(0);
  const setLocalVideoRef = useCallback((el) => {
    userVideoRef.current = el;
    setVideoElMounted((n) => n + 1);
  }, []);

  useEffect(() => {
    const el = userVideoRef.current;
    if (!el || !stream) return;

    const videoOnlyStream = new MediaStream(stream.getVideoTracks());
    el.srcObject = videoOnlyStream;
    el.muted = true;
    el.volume = 0;
  }, [stream, videoElMounted]);


  const toggleMic = () => {
    if (!streamRef.current) return;
    const next = !micOn;
    streamRef.current.getAudioTracks().forEach((t) => { t.enabled = next; });
    setMicOn(next);
    socketRef.current?.emit("mic-toggle", roomId, next);
  };

  const toggleCamera = () => {
    if (!streamRef.current) return;
    const next = !cameraOn;
    streamRef.current.getVideoTracks().forEach((t) => { t.enabled = next; });
    setCameraOn(next);
    socketRef.current?.emit("camera-toggle", roomId, next);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // SCREEN SHARING
  // ═════════════════════════════════════════════════════════════════════════
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const oldVideoTrack = streamRef.current?.getVideoTracks()[0];
        // Save the stream object that peers know about for replaceTrack
        const theStream = peerStreamRef.current || streamRef.current;

        // Replace camera track with screen track on all peers
        for (const [, entry] of peersRef.current) {
          try {
            if (oldVideoTrack && screenTrack) {
              entry.peer.replaceTrack(oldVideoTrack, screenTrack, theStream);
            }
          } catch (err) {
            console.error("[MEET] replaceTrack start failed:", err);
          }
        }

        // Update local stream: remove camera track, add screen track
        if (oldVideoTrack) {
          oldVideoTrack.stop();
          streamRef.current.removeTrack(oldVideoTrack);
        }
        streamRef.current.addTrack(screenTrack);
        setStream(new MediaStream(streamRef.current.getTracks()));

        // onended: browser "Stop sharing" button fires this
        screenTrack.onended = () => stopScreenShare();

        setIsScreenSharing(true);
        stoppingShareRef.current = false;
        setPinnedId("local");
        socketRef.current?.emit("screen-share-toggle", roomId, true);
      } catch (err) {
        console.error("[MEET] Screen share error:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  /**
   * Stop screen share and restore camera.
   * Uses stoppingShareRef to prevent double invocation
   * (user click calls this, which stops track, which fires onended, which calls this again).
   * Uses peerStreamRef to pass the exact same stream object to replaceTrack.
   */
  const stopScreenShare = async () => {
    // Guard: prevent double invocation
    if (stoppingShareRef.current) {
      console.log("[MEET] stopScreenShare already in progress, skipping");
      return;
    }
    stoppingShareRef.current = true;

    const screenTrack = streamRef.current?.getVideoTracks()[0];
    // The stream object that peers were given (for simple-peer _senderMap lookup)
    const theStream = peerStreamRef.current || streamRef.current;

    // Remove the onended handler FIRST to prevent re-entry
    if (screenTrack) {
      screenTrack.onended = null;
    }

    // 1. Get a fresh camera track (video only — keep existing audio track)
    let cameraTrack;
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24 } },
        audio: false,
      });
      cameraTrack = camStream.getVideoTracks()[0];
      console.log("[MEET] Got new camera track:", cameraTrack.id, "enabled:", cameraTrack.enabled);
    } catch (err) {
      console.error("[MEET] Failed to get camera after screen share:", err);
      stoppingShareRef.current = false;
      return;
    }

    // 2. Replace screen→camera on ALL peers using the ORIGINAL stream reference
    for (const [, entry] of peersRef.current) {
      try {
        if (screenTrack && cameraTrack) {
          entry.peer.replaceTrack(screenTrack, cameraTrack, theStream);
          console.log("[MEET] ✅ Replaced screen→camera for peer");
        }
      } catch (err) {
        console.error("[MEET] replaceTrack failed:", err);
      }
    }

    // 3. Stop screen track and update local stream
    if (screenTrack) {
      screenTrack.stop();
      streamRef.current.removeTrack(screenTrack);
    }
    streamRef.current.addTrack(cameraTrack);

    // 4. Trigger re-render with new MediaStream ref
    const updatedStream = new MediaStream(streamRef.current.getTracks());
    streamRef.current = updatedStream;
    setStream(updatedStream);

    setIsScreenSharing(false);
    setCameraOn(true);
    setPinnedId(null);
    socketRef.current?.emit("screen-share-toggle", roomId, false);
    socketRef.current?.emit("camera-toggle", roomId, true);

    console.log("[MEET] ✅ Screen share stopped, camera restored. Tracks:",
      updatedStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
  };

  // ═════════════════════════════════════════════════════════════════════════
  // PEER MANAGEMENT
  // ═════════════════════════════════════════════════════════════════════════

  const syncPeersToState = useCallback(() => {
    const arr = [];
    for (const [socketId, entry] of peersRef.current) {
      arr.push({ socketId, ...entry });
    }
    setPeers([...arr]);
  }, []);

  const createPeerConnection = useCallback(
    (targetSocketId, targetUserId, isInitiator, initialSignal) => {
      if (peersRef.current.has(targetSocketId)) {
        console.log("[MEET] Peer already exists for:", targetSocketId);
        if (initialSignal && !isInitiator) {
          try {
            peersRef.current.get(targetSocketId).peer.signal(initialSignal);
          } catch (e) { /* ignore */ }
        }
        return;
      }

      if (!streamRef.current) {
        console.error("[MEET] No local stream, cannot create peer for:", targetSocketId);
        return;
      }

      const localStreamId = streamRef.current.id;
      // Store the stream object that peers use, for replaceTrack later
      if (!peerStreamRef.current) {
        peerStreamRef.current = streamRef.current;
      }
      console.log(`[MEET] Creating peer for ${targetSocketId} (initiator=${isInitiator})`);

      const peer = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: streamRef.current,
        config: ICE_SERVERS,
      });

      peer.on("signal", (signal) => {
        socketRef.current?.emit("signal", {
          target: targetSocketId,
          signal,
          userId: myIdRef.current,
        });
      });

      peer.on("stream", (remoteStream) => {
        console.log("[MEET] 🎵 Got stream from:", targetSocketId, "streamId:", remoteStream.id,
          "tracks:", remoteStream.getTracks().map(t => `${t.kind}:${t.enabled}`));

        if (remoteStream.id === localStreamId) {
          console.warn("[MEET] ⚠️ Received own stream back, ignoring!");
          return;
        }

        const entry = peersRef.current.get(targetSocketId);
        if (entry) {
          entry.remoteStream = remoteStream;
          syncPeersToState();
        }
      });

      peer.on("connect", () => console.log("[MEET] ✅ Peer connected to:", targetSocketId));
      peer.on("close", () => console.log("[MEET] Peer closed:", targetSocketId));
      peer.on("error", (err) => console.error("[MEET] Peer error:", targetSocketId, err.message));

      if (initialSignal && !isInitiator) {
        peer.signal(initialSignal);
      }

      peersRef.current.set(targetSocketId, {
        peer,
        userId: targetUserId,
        micOn: true,
        cameraOn: true,
        remoteStream: null,
      });

      syncPeersToState();
    },
    [syncPeersToState]
  );

  const destroyPeer = useCallback(
    (socketId) => {
      const entry = peersRef.current.get(socketId);
      if (entry) {
        try { entry.peer.destroy(); } catch (e) { /* ignore */ }
        peersRef.current.delete(socketId);
        // If the destroyed peer was pinned, unpin
        setPinnedId(prev => prev === socketId ? null : prev);
        syncPeersToState();
      }
    },
    [syncPeersToState]
  );

  // ═════════════════════════════════════════════════════════════════════════
  // JOIN MEETING
  // ═════════════════════════════════════════════════════════════════════════
  const joinMeeting = () => {
    if (!myIdRef.current || !streamRef.current) {
      console.warn("[MEET] Cannot join: missing user data or stream");
      return;
    }
    if (socketRef.current) {
      console.warn("[MEET] Already connected, skipping");
      return;
    }

    setIsJoined(true);

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[MEET] ✅ Socket connected:", socket.id);
      socket.emit("join-room", roomId, myIdRef.current);
    });

    socket.on("connect_error", (err) => {
      console.error("[MEET] ❌ Socket error:", err.message);
    });

    socket.io.on("reconnect", () => {
      console.log("[MEET] 🔄 Reconnected, re-joining room");
      for (const [sid] of peersRef.current) {
        destroyPeer(sid);
      }
      socket.emit("join-room", roomId, myIdRef.current);
    });

    socket.on("room-users", (existingUsers) => {
      console.log("[MEET] Room has", existingUsers.length, "existing user(s)");
      for (const user of existingUsers) {
        createPeerConnection(user.socketId, user.userId, true, null);
        const entry = peersRef.current.get(user.socketId);
        if (entry) {
          entry.micOn = user.micOn;
          entry.cameraOn = user.cameraOn;
        }
      }
      syncPeersToState();
      socket.emit("mic-toggle", roomId, micOn);
      socket.emit("camera-toggle", roomId, cameraOn);
    });

    socket.on("user-joined", (userId, socketId) => {
      if (String(userId) === myIdRef.current || socketId === socket.id) return;
      console.log("[MEET] New user joined:", userId, socketId);
    });

    socket.on("signal", (payload) => {
      if (payload.sender === socket.id) return;

      const existing = peersRef.current.get(payload.sender);
      if (existing) {
        try { existing.peer.signal(payload.signal); } catch (err) { console.error("[MEET] Signal error:", err); }
      } else {
        console.log("[MEET] Creating receiver peer for:", payload.sender);
        createPeerConnection(payload.sender, payload.userId, false, payload.signal);
      }
    });

    socket.on("chat-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user-disconnected", (socketId) => {
      console.log("[MEET] User disconnected:", socketId);
      destroyPeer(socketId);
    });

    socket.on("remote-mic-toggle", ({ socketId, micOn: remoteMic }) => {
      const entry = peersRef.current.get(socketId);
      if (entry) { entry.micOn = remoteMic; syncPeersToState(); }
    });

    socket.on("remote-camera-toggle", ({ socketId, cameraOn: remoteCam }) => {
      const entry = peersRef.current.get(socketId);
      if (entry) { entry.cameraOn = remoteCam; syncPeersToState(); }
    });

    socket.on("remote-screen-share-toggle", ({ socketId, isSharing }) => {
      const entry = peersRef.current.get(socketId);
      if (entry) {
        entry.refreshKey = Date.now();
        syncPeersToState();
      }
      // Auto-pin when a remote user starts screen sharing
      if (isSharing) {
        setPinnedId(socketId);
      } else {
        // Unpin if this user stopped sharing and they were pinned
        setPinnedId(prev => prev === socketId ? null : prev);
      }
    });
  };

  // ═════════════════════════════════════════════════════════════════════════
  // PIN / SPOTLIGHT HELPERS
  // ═════════════════════════════════════════════════════════════════════════
  const handlePin = (id) => {
    setPinnedId(prev => prev === id ? null : id);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // CHAT
  // ═════════════════════════════════════════════════════════════════════════
  const sendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    const msg = {
      sender: me?.name || "User",
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    socketRef.current.emit("send-chat-message", roomId, msg);
    setChatInput("");
  };

  // ═════════════════════════════════════════════════════════════════════════
  // LEAVE
  // ═════════════════════════════════════════════════════════════════════════
  const leaveMeeting = () => {
    socketRef.current?.emit("leave-room", roomId);
    cleanup();
    navigate(-1);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // INVITE
  // ═════════════════════════════════════════════════════════════════════════
  const handleSearchUsers = async (val) => {
    setUserSearch(val);
    if (val.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const results = await meetingsApi.searchInvitees({ search: val });
      const existingIds = (meeting?.invitees || []).map((i) => i.id || i._id);
      setSearchResults(results.filter((u) => !existingIds.includes(u.id || u._id)));
    } catch { /* ignore */ } finally { setIsSearching(false); }
  };

  const handleInviteUser = async (user) => {
    try {
      const updatedInvitees = [...(meeting?.invitees || []), user];
      await meetingsApi.updateInvitees(roomId, updatedInvitees.map((i) => i.id || i._id));
      setMeeting((prev) => ({ ...prev, invitees: updatedInvitees }));
      setSearchResults((prev) => prev.filter((u) => (u.id || u._id) !== (user.id || user._id)));
    } catch (err) { console.error("[MEET] Invite failed:", err); }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: PRE-JOIN LOBBY
  // ═══════════════════════════════════════════════════════════════════════
  if (!isJoined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center glass-dark p-6 sm:p-8 lg:p-12 rounded-3xl lg:rounded-[3rem] shadow-2xl border border-white/30 relative z-10">
          <div className="space-y-6 lg:space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white leading-tight tracking-tighter uppercase">Ready to <span className="text-[#00d4ff] blue-glow">Join?</span></h1>
              <p className="mt-2 text-white/40 font-bold uppercase tracking-widest text-xs">{meeting?.title || "EMS Meeting Room"}</p>
            </div>

            <div className="relative group aspect-video bg-slate-900 rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl ring-4 lg:ring-8 ring-slate-50">
              <video
                ref={setLocalVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover mirror ${cameraOn ? "" : "hidden"}`}
              />
              {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-slate-800 flex items-center justify-center text-2xl sm:text-4xl font-bold text-slate-600">
                    {me?.name?.charAt(0) || "U"}
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-4">
                <button onClick={toggleMic} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all shadow-xl backdrop-blur-3xl ${micOn ? "bg-white/10 text-white hover:bg-white/20 border border-white/20" : "bg-red-500/50 text-white hover:bg-red-600/50 border border-red-500/30"}`}>
                  {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button onClick={toggleCamera} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all shadow-xl backdrop-blur-3xl ${cameraOn ? "bg-white/10 text-white hover:bg-white/20 border border-white/20" : "bg-red-500/50 text-white hover:bg-red-600/50 border border-red-500/30"}`}>
                  {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:gap-8">
            <div className="p-6 lg:p-8 bg-white/5 rounded-2xl lg:rounded-[2rem] border border-white/10 space-y-6 text-center lg:text-left backdrop-blur-xl">
              <div className="flex -space-x-3 justify-center lg:justify-start">
                {[1, 2, 3].map((i) => <div key={i} className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-white/30" />)}
              </div>
              <p className="text-white/60 font-medium text-sm sm:text-base italic">
                {me ? "Team members are waiting for your entry..." : "Syncing credentials..."}
              </p>
              <button
                onClick={joinMeeting}
                disabled={!me || !meeting || !stream}
                className={`w-full py-3 sm:py-5 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all blue-button active:scale-95 disabled:opacity-50`}
              >
                {me ? (stream ? "Authorize Entry" : "Initializing Link...") : "Please Wait..."}
              </button>
            </div>
            <div className="flex items-center gap-2 text-white/30 justify-center lg:justify-start">
              <Check size={16} className="text-[#00d4ff] blue-glow" />
              <span className="text-[10px] font-black uppercase tracking-widest">Neural Encryption Active</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: MEETING ROOM
  // ═══════════════════════════════════════════════════════════════════════
  const totalParticipants = peers.length + 1;
  const isPinned = pinnedId !== null;

  // Build the list of all video tiles for layout
  const allTiles = [
    { id: "local", type: "local" },
    ...peers.map(p => ({ id: p.socketId, type: "remote", data: p })),
  ];

  const pinnedTile = isPinned ? allTiles.find(t => t.id === pinnedId) : null;
  const filmstripTiles = isPinned ? allTiles.filter(t => t.id !== pinnedId) : [];

  // Grid columns for non-pinned view
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const isTablet = typeof window !== "undefined" && window.innerWidth < 1024;
  const gridCols =
    totalParticipants <= 1 ? "1fr" :
    totalParticipants <= 2 ? (isMobile ? "1fr" : "repeat(2, 1fr)") :
    totalParticipants <= 4 ? (isMobile ? "1fr" : "repeat(2, 1fr)") :
    totalParticipants <= 9 ? (isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)") :
    (isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)");

  /** Render a video tile (local or remote) */
  const renderTile = (tile, isSpotlight = false) => {
    if (tile.type === "local") {
      return (
        <LocalVideoTile
          key="local"
          videoRef={setLocalVideoRef}
          cameraOn={cameraOn}
          micOn={micOn}
          name={me?.name}
          isPinned={pinnedId === "local"}
          isSpotlight={isSpotlight}
          onPin={() => handlePin("local")}
          isScreenSharing={isScreenSharing}
        />
      );
    }
    const p = tile.data;
    return (
      <RemoteVideo
        key={p.socketId}
        peer={p.peer}
        userId={p.userId}
        myId={myIdRef.current}
        remoteMicOn={p.micOn}
        remoteCameraOn={p.cameraOn}
        refreshKey={p.refreshKey}
        remoteStream={p.remoteStream}
        localStreamId={streamRef.current?.id}
        isPinned={pinnedId === p.socketId}
        isSpotlight={isSpotlight}
        onPin={() => handlePin(p.socketId)}
      />
    );
  };

  return (
    <div className="h-dvh flex flex-col sm:flex-row overflow-hidden relative">
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-full min-w-0">
        {/* Top Bar */}
        <div className="px-3 py-2 sm:p-6 flex justify-between items-center z-20 shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl glass-dark border border-white/10 min-w-0">
            <div className="w-2 h-2 rounded-full bg-[#00d4ff] blue-glow animate-pulse shrink-0" />
            <span className="font-black text-white text-[10px] sm:text-xs uppercase tracking-widest truncate">{meeting?.title}</span>
            <span className="text-white/20 mx-1 hidden sm:inline">|</span>
            <span className="text-white/40 font-black text-[10px] tracking-widest hidden sm:inline">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div className="flex gap-2 shrink-0">
            <button onClick={() => { setIsSidebarOpen(true); setActiveTab("people"); }} className="p-3 rounded-2xl glass-dark text-[#00d4ff] hover:bg-white/10 transition-all border border-white/10 blue-glow shadow-lg shadow-blue-500/10">
              <Users size={18} />
            </button>
            <button onClick={() => { setIsSidebarOpen(true); setActiveTab("chat"); }} className="p-3 rounded-2xl glass-dark text-[#00d4ff] hover:bg-white/10 transition-all border border-white/10 blue-glow shadow-lg shadow-blue-500/10">
              <MessageSquare size={18} />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 p-1.5 sm:p-3 flex flex-col overflow-hidden min-h-0">
          {isPinned && pinnedTile ? (
            /* ─── SPOTLIGHT LAYOUT: Pinned tile fullscreen + filmstrip ─── */
            <div className="w-full h-full flex flex-col gap-1.5 sm:gap-2">
              {/* Spotlight — takes all remaining height */}
              <div className="relative flex-1 min-h-0 w-full">
                <div className="absolute inset-0">
                  {renderTile(pinnedTile, true)}
                </div>
              </div>

              {/* Filmstrip — fixed height strip at bottom */}
              {filmstripTiles.length > 0 && (
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 shrink-0" style={{ height: isMobile ? "90px" : "130px" }}>
                  {filmstripTiles.map(tile => (
                    <div key={tile.id} className="shrink-0 h-full" style={{ width: isMobile ? "120px" : "180px" }}>
                      {renderTile(tile, false)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ─── GRID LAYOUT: Equal-sized tiles ─── */
            <div
              className="w-full h-full max-w-[1400px] mx-auto grid gap-1.5 sm:gap-2 auto-rows-fr"
              style={{ gridTemplateColumns: gridCols }}
            >
              {allTiles.map(tile => renderTile(tile, false))}
            </div>
          )}
        </div>

        {/* Bottom Controls Bar */}
        <div className="flex justify-center pb-6 sm:pb-8 pt-2 sm:pt-4 z-20 shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 px-6 sm:px-8 py-3 sm:py-4 rounded-3xl glass-dark border border-white/20 shadow-2xl">
            <button onClick={toggleMic} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${micOn ? "bg-white/5 text-white hover:bg-white/10 border border-white/10" : "bg-red-500/50 text-white hover:bg-red-600/50 border border-red-500/30"}`} title={micOn ? "Mute" : "Unmute"}>
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button onClick={toggleCamera} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${cameraOn ? "bg-white/5 text-white hover:bg-white/10 border border-white/10" : "bg-red-500/50 text-white hover:bg-red-600/50 border border-red-500/30"}`} title={cameraOn ? "Turn off camera" : "Turn on camera"}>
              {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button onClick={toggleScreenShare} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isScreenSharing ? "bg-[#00d4ff]/20 text-[#00d4ff] blue-glow border border-[#00d4ff]/30 shadow-lg shadow-blue-500/20" : "bg-white/5 text-white hover:bg-white/10 border border-white/10"}`} title={isScreenSharing ? "Stop sharing" : "Share screen"}>
              <ScreenShare size={20} />
            </button>
            <div className="w-px h-6 sm:h-8 bg-gray-600 mx-0.5 sm:mx-1" />
            <button onClick={leaveMeeting} className="px-8 h-12 bg-red-500/80 hover:bg-red-600 text-white rounded-2xl flex items-center justify-center transition-all font-black text-[10px] uppercase tracking-[0.2em] gap-3 shadow-lg shadow-red-500/20 active:scale-95">
              <PhoneOff size={18} /> Terminate
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 sm:static sm:w-[380px] border-l border-white/10 flex flex-col glass-dark backdrop-blur-3xl z-30 sm:z-auto h-full shadow-2xl">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex gap-6">
              <button onClick={() => setActiveTab("chat")} className={`pb-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "chat" ? "text-[#00d4ff] blue-glow" : "text-white/40 hover:text-white"}`}>
                Chat
                {activeTab === "chat" && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#00d4ff] rounded-full shadow-[0_0_10px_rgba(0,212,255,1)]" />}
              </button>
              <button onClick={() => setActiveTab("people")} className={`pb-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "people" ? "text-[#00d4ff] blue-glow" : "text-white/40 hover:text-white"}`}>
                Fleet ({totalParticipants})
                {activeTab === "people" && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#00d4ff] rounded-full shadow-[0_0_10px_rgba(0,212,255,1)]" />}
              </button>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "chat" ? (
              <div className="p-3 sm:p-4 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#00d4ff] blue-glow">{m.sender}</span>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{m.time}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none text-white/80 text-xs leading-relaxed backdrop-blur-md">{m.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 sm:p-4 space-y-3">
                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Neural Fleet Connectivity</div>
                <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00d4ff] to-blue-600 text-[10px] font-black uppercase text-white shadow-lg shadow-blue-500/20">{me?.name?.charAt(0)}</div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tighter text-white">{me?.name} (You)</p>
                    <p className="text-[9px] font-black text-[#00d4ff] uppercase tracking-widest blue-glow mt-0.5">{me?.role?.replace("_", " ")}</p>
                  </div>
                </div>
                {peers.map((p) => (
                  <RemoteParticipantInfo key={p.socketId} userId={p.userId} />
                ))}

                {(me?.id === meeting?.creatorId?.id || me?.role === "ceo") && (
                  <div className="pt-6 border-t border-white/10 mt-6 space-y-4">
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                      <UserPlus size={12} className="text-[#00d4ff]" /> Expand Network
                    </div>
                    <div className="relative group">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00d4ff] transition-colors" />
                      <input type="text" placeholder="Search by name or identity..." value={userSearch} onChange={(e) => handleSearchUsers(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-[10px] uppercase font-black tracking-widest outline-none text-white placeholder:text-white/20 focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/20 transition-all" />
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <div className="text-center py-4"><Loader2 size={16} className="animate-spin mx-auto text-indigo-400" /></div>
                      ) : searchResults.map((user) => (
                        <div key={user.id || user._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#303134] transition-all">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#3c4043] flex items-center justify-center text-[10px] font-bold text-gray-300">{user.name?.charAt(0)}</div>
                            <div>
                              <p className="text-xs font-semibold text-white">{user.name}</p>
                              <p className="text-[9px] text-gray-500 font-medium">{user.role?.replace("_", " ")}</p>
                            </div>
                          </div>
                          <button onClick={() => handleInviteUser(user)} className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-all">
                            <UserPlus size={14} />
                          </button>
                        </div>
                      ))}
                      {!isSearching && userSearch.length >= 2 && searchResults.length === 0 && (
                        <p className="text-center py-4 text-[10px] text-gray-500 font-medium">No users found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {activeTab === "chat" && (
            <div className="p-4 border-t border-white/10">
              <div className="relative">
                <textarea placeholder="Transmit message to all peers..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold outline-none text-white placeholder:text-white/20 focus:border-[#00d4ff] transition-all resize-none h-24 custom-scrollbar" />
                <button onClick={sendMessage} className="absolute bottom-4 right-4 p-2.5 bg-[#00d4ff]/20 text-[#00d4ff] rounded-xl hover:bg-[#00d4ff]/30 transition-all blue-glow border border-[#00d4ff]/20 active:scale-95 shadow-lg shadow-blue-500/10">
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL VIDEO TILE
// ═══════════════════════════════════════════════════════════════════════════════
const LocalVideoTile = ({ videoRef, cameraOn, micOn, name, isPinned, isSpotlight, onPin, isScreenSharing }) => {
  return (
    <div className={`relative w-full h-full min-h-[100px] bg-slate-900/40 rounded-2xl overflow-hidden group border border-white/10 transition-all duration-500 ${isPinned ? "ring-2 ring-[#00d4ff] shadow-[0_0_30px_rgba(0,212,255,0.3)]" : ""}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover ${isScreenSharing ? "" : "mirror"} ${cameraOn || isScreenSharing ? "" : "invisible"}`}
      />
      {!cameraOn && !isScreenSharing && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#020617]/80 backdrop-blur-3xl">
          <div className={`rounded-xl bg-gradient-to-br from-[#00d4ff] to-blue-600 text-white flex items-center justify-center font-black shadow-2xl shadow-blue-500/20 ${isSpotlight ? "w-24 h-24 text-4xl" : "w-14 h-14 sm:w-20 sm:h-20 text-xl sm:text-3xl"}`}>
            {name?.charAt(0)}
          </div>
        </div>
      )}
      {/* Name badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-slate-900/60 backdrop-blur-xl px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
        {isScreenSharing && <ScreenShare size={12} className="text-[#00d4ff] blue-glow" />}
        {name} (You)
        {!micOn && <MicOff size={12} className="text-red-400" />}
      </div>
      {/* Pin button — visible on hover */}
      <button
        onClick={onPin}
        className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        title={isPinned ? "Unpin" : "Pin"}
      >
        {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REMOTE PARTICIPANT INFO (People Tab)
// ═══════════════════════════════════════════════════════════════════════════════
const RemoteParticipantInfo = ({ userId }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!userId) return;
    usersApi.getById(String(userId))
      .then(setUserData)
      .catch((err) => console.error("[MEET] User fetch error:", err));
  }, [userId]);

  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white/40 flex items-center justify-center font-black text-[10px]">{userData?.name?.charAt(0) || "?"}</div>
      <div>
        <p className="text-xs font-black uppercase tracking-tighter text-white">{userData?.name || "Loading..."}</p>
        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-0.5">{userData?.role?.replace("_", " ") || "PARTICIPANT"}</p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REMOTE VIDEO TILE
// ═══════════════════════════════════════════════════════════════════════════════
const RemoteVideo = ({ peer, userId, myId, remoteMicOn, remoteCameraOn, refreshKey, remoteStream, localStreamId, isPinned, isSpotlight, onPin }) => {
  const videoRef = useRef();
  const [userData, setUserData] = useState(null);
  const [hasStream, setHasStream] = useState(false);

  // Refresh srcObject when screen share toggles
  useEffect(() => {
    const el = videoRef.current;
    if (el && el.srcObject && remoteCameraOn) {
      const currentStream = el.srcObject;
      el.srcObject = null;
      el.srcObject = currentStream;
      el.play().catch(() => {});
    }
  }, [refreshKey, remoteCameraOn]);

  // Attach remote stream from parent state
  useEffect(() => {
    if (!remoteStream || !videoRef.current) return;
    if (String(userId) === String(myId)) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
      return;
    }
    if (localStreamId && remoteStream.id === localStreamId) {
      console.warn("[MEET] ⚠️ Remote stream matches local, ignoring");
      return;
    }

    videoRef.current.srcObject = remoteStream;
    videoRef.current.muted = false;
    videoRef.current.volume = 1.0;
    videoRef.current.play().catch(() => {});
    setHasStream(true);
  }, [remoteStream, userId, myId, localStreamId]);

  // Fallback: listen for peer stream event
  useEffect(() => {
    const handleStream = (stream) => {
      if (!videoRef.current) return;
      if (String(userId) === String(myId)) return;
      if (localStreamId && stream.id === localStreamId) return;

      videoRef.current.srcObject = stream;
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      videoRef.current.play().catch(() => {});
      setHasStream(true);
    };

    peer.on("stream", handleStream);
    return () => { peer.off("stream", handleStream); };
  }, [peer, userId, myId, localStreamId]);

  // Fetch user metadata
  useEffect(() => {
    if (userId && String(userId) !== String(myId)) {
      usersApi.getById(String(userId))
        .then(setUserData)
        .catch(() => {});
    }
  }, [userId, myId]);

  return (
    <div className={`relative w-full h-full min-h-[100px] bg-[#3c4043] rounded-lg sm:rounded-xl overflow-hidden group ${isPinned ? "ring-2 ring-indigo-500" : ""}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${remoteCameraOn ? "" : "invisible"}`}
      />

      {(!remoteCameraOn || !hasStream) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#020617]/80 backdrop-blur-3xl">
          <div className={`rounded-xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center font-black ${isSpotlight ? "w-24 h-24 text-4xl" : "w-14 h-14 sm:w-20 sm:h-20 text-xl sm:text-3xl"}`}>
            {userData?.name?.charAt(0) || "P"}
          </div>
        </div>
      )}

      {!hasStream && (
        <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-500">
          <div className="flex items-center gap-2 bg-[#00d4ff]/10 backdrop-blur-xl px-4 py-2 rounded-xl border border-[#00d4ff]/20">
            <Loader2 size={12} className="animate-spin text-[#00d4ff] blue-glow" />
            <span className="text-[10px] text-[#00d4ff] blue-glow font-black uppercase tracking-widest text-[9px]">Handshaking</span>
          </div>
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-slate-900/60 backdrop-blur-xl px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
        <span className={`w-1.5 h-1.5 rounded-full ${hasStream ? "bg-[#00d4ff] blue-glow shadow-[0_0_10px_rgba(0,212,255,1)]" : "bg-yellow-400 animate-pulse"}`} />
        {userData ? `${userData.name}` : "Participant"}
        {remoteMicOn === false && <MicOff size={12} className="text-red-400 ml-1" />}
      </div>

      {/* Pin button — visible on hover */}
      <button
        onClick={onPin}
        className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        title={isPinned ? "Unpin" : "Pin"}
      >
        {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
      </button>
    </div>
  );
};

export default UnifiedMeetingRoom;
