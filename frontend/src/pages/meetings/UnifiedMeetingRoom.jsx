import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer/simplepeer.min.js";
import {
  Loader2, Copy, Check, Video, PhoneOff, UserPlus, MessageSquare, ScreenShare,
  Mic, MicOff, VideoOff, Send, X, Users, Search
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

// ─── Helper: create a simple-peer wrapper ────────────────────────────────────
function createSimplePeer({ initiator, stream, onSignal, onStream, onClose, onError }) {
  const peer = new Peer({
    initiator,
    trickle: true,
    stream,
    config: ICE_SERVERS,
  });

  peer.on("signal", onSignal);
  peer.on("stream", onStream);
  peer.on("close", onClose);
  peer.on("error", onError);

  return peer;
}

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
  // peers: Array<{ socketId, userId, micOn, cameraOn, peer }>
  const [peers, setPeers] = useState([]);

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
  // Map<socketId, { peer, userId, micOn, cameraOn }>
  const peersRef = useRef(new Map());
  const myIdRef = useRef(null);

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
    // Destroy all peers
    for (const [, entry] of peersRef.current) {
      try { entry.peer.destroy(); } catch (e) { /* ignore */ }
    }
    peersRef.current = new Map();

    // Stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // LOCAL VIDEO PREVIEW (ECHO-PROOF)
  // ═════════════════════════════════════════════════════════════════════════
  // Track when the <video> element mounts/unmounts
  const [videoElMounted, setVideoElMounted] = useState(0);
  const setLocalVideoRef = useCallback((el) => {
    userVideoRef.current = el;
    setVideoElMounted((n) => n + 1);
  }, []);

  // Apply video-only stream to the local preview (no audio tracks = no echo)
  useEffect(() => {
    const el = userVideoRef.current;
    if (!el || !stream) return;

    const videoOnlyStream = new MediaStream(stream.getVideoTracks());
    el.srcObject = videoOnlyStream;
    el.muted = true;
    el.volume = 0;
  }, [stream, videoElMounted]);

  // ═════════════════════════════════════════════════════════════════════════
  // MEDIA MANAGEMENT
  // ═════════════════════════════════════════════════════════════════════════
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
      return newStream;
    } catch (err) {
      console.error("[MEET] Media error:", err);
      return null;
    }
  };

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

        // Replace track on every existing peer
        for (const [, entry] of peersRef.current) {
          try {
            if (oldVideoTrack && screenTrack) {
              entry.peer.replaceTrack(oldVideoTrack, screenTrack, streamRef.current);
            }
          } catch (err) {
            console.error("[MEET] replaceTrack failed:", err);
          }
        }

        // Swap in local stream
        if (oldVideoTrack) {
          oldVideoTrack.stop();
          streamRef.current.removeTrack(oldVideoTrack);
        }
        streamRef.current.addTrack(screenTrack);
        setStream(new MediaStream(streamRef.current.getTracks()));

        screenTrack.onended = () => stopScreenShare(screenTrack);

        setIsScreenSharing(true);
        socketRef.current?.emit("screen-share-toggle", roomId, true);
      } catch (err) {
        console.error("[MEET] Screen share error:", err);
      }
    } else {
      const screenTrack = streamRef.current?.getVideoTracks()[0];
      stopScreenShare(screenTrack);
    }
  };

  const stopScreenShare = async (screenTrack) => {
    if (screenTrack) screenTrack.stop();

    const cameraStream = await requestMedia(micOn, true);
    if (!cameraStream) return;

    const cameraTrack = cameraStream.getVideoTracks()[0];
    const currentVideoTrack = streamRef.current?.getVideoTracks()[0];

    for (const [, entry] of peersRef.current) {
      try {
        if (currentVideoTrack && cameraTrack) {
          entry.peer.replaceTrack(currentVideoTrack, cameraTrack, streamRef.current);
        }
      } catch (err) {
        console.error("[MEET] revert replaceTrack failed:", err);
      }
    }

    if (currentVideoTrack) {
      currentVideoTrack.stop();
      streamRef.current.removeTrack(currentVideoTrack);
    }
    streamRef.current.addTrack(cameraTrack);
    setStream(new MediaStream(streamRef.current.getTracks()));

    setIsScreenSharing(false);
    setCameraOn(true);
    socketRef.current?.emit("screen-share-toggle", roomId, false);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // PEER MANAGEMENT
  // ═════════════════════════════════════════════════════════════════════════

  /** Sync peersRef → React state */
  const syncPeersToState = useCallback(() => {
    const arr = [];
    for (const [socketId, entry] of peersRef.current) {
      arr.push({ socketId, ...entry });
    }
    setPeers(arr);
  }, []);

  /** Create a peer for a remote user. `initiator` = true if WE are initiating. */
  const createPeer = useCallback(
    (targetSocketId, targetUserId, isInitiator, initialSignal) => {
      // Guard against duplicates
      if (peersRef.current.has(targetSocketId)) {
        console.log("[MEET] Peer already exists for:", targetSocketId);
        // If we received a signal for an existing peer, forward it
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

      console.log(`[MEET] Creating peer for ${targetSocketId} (initiator=${isInitiator})`);

      const peer = createSimplePeer({
        initiator: isInitiator,
        stream: streamRef.current,
        onSignal: (signal) => {
          socketRef.current?.emit("signal", {
            target: targetSocketId,
            signal,
            userId: myIdRef.current,
          });
        },
        onStream: (remoteStream) => {
          console.log("[MEET] Got remote stream from:", targetSocketId,
            "tracks:", remoteStream.getTracks().map((t) => `${t.kind}:${t.enabled}`));
        },
        onClose: () => {
          console.log("[MEET] Peer closed:", targetSocketId);
        },
        onError: (err) => {
          console.error("[MEET] Peer error:", targetSocketId, err.message);
        },
      });

      // If we have an initial signal (we are the receiver), apply it
      if (initialSignal && !isInitiator) {
        peer.signal(initialSignal);
      }

      // Store in ref
      peersRef.current.set(targetSocketId, {
        peer,
        userId: targetUserId,
        micOn: true,
        cameraOn: true,
      });

      syncPeersToState();
    },
    [syncPeersToState]
  );

  /** Destroy a peer and remove from tracking */
  const destroyPeer = useCallback(
    (socketId) => {
      const entry = peersRef.current.get(socketId);
      if (entry) {
        try { entry.peer.destroy(); } catch (e) { /* ignore */ }
        peersRef.current.delete(socketId);
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

    // ── Socket Connected ─────────────────────────────────────────────────
    socket.on("connect", () => {
      console.log("[MEET] ✅ Socket connected:", socket.id);
      socket.emit("join-room", roomId, myIdRef.current);
    });

    socket.on("connect_error", (err) => {
      console.error("[MEET] ❌ Socket error:", err.message);
    });

    // ── Reconnection: re-join room and rebuild peers ─────────────────────
    socket.io.on("reconnect", () => {
      console.log("[MEET] 🔄 Reconnected, re-joining room");
      // Destroy stale peers
      for (const [sid] of peersRef.current) {
        destroyPeer(sid);
      }
      socket.emit("join-room", roomId, myIdRef.current);
    });

    // ── Room Users (sent to us on join) ──────────────────────────────────
    // We are the joiner → create initiator peers for each existing user
    socket.on("room-users", (existingUsers) => {
      console.log("[MEET] Room has", existingUsers.length, "existing user(s)");
      for (const user of existingUsers) {
        createPeer(user.socketId, user.userId, true, null);
        // Apply their current states
        const entry = peersRef.current.get(user.socketId);
        if (entry) {
          entry.micOn = user.micOn;
          entry.cameraOn = user.cameraOn;
        }
      }
      syncPeersToState();
      // Broadcast our own initial state
      socket.emit("mic-toggle", roomId, micOn);
      socket.emit("camera-toggle", roomId, cameraOn);
    });

    // ── User Joined (a new user joined after us) ─────────────────────────
    // We wait for their signal — they are the initiator
    socket.on("user-joined", (userId, socketId) => {
      if (String(userId) === myIdRef.current || socketId === socket.id) return;
      console.log("[MEET] New user joined:", userId, socketId);
      // Don't create a peer yet — wait for their signal
    });

    // ── Signal ───────────────────────────────────────────────────────────
    socket.on("signal", (payload) => {
      if (payload.sender === socket.id) return;

      const existing = peersRef.current.get(payload.sender);
      if (existing) {
        // Forward signal to existing peer
        try {
          existing.peer.signal(payload.signal);
        } catch (err) {
          console.error("[MEET] Signal error:", err);
        }
      } else {
        // First signal from this user — create receiver peer
        console.log("[MEET] Creating receiver peer for:", payload.sender);
        createPeer(payload.sender, payload.userId, false, payload.signal);
      }
    });

    // ── Chat ─────────────────────────────────────────────────────────────
    socket.on("chat-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // ── User Disconnected ────────────────────────────────────────────────
    socket.on("user-disconnected", (socketId) => {
      console.log("[MEET] User disconnected:", socketId);
      destroyPeer(socketId);
    });

    // ── Remote Media Toggles ─────────────────────────────────────────────
    socket.on("remote-mic-toggle", ({ socketId, micOn: remoteMic }) => {
      const entry = peersRef.current.get(socketId);
      if (entry) {
        entry.micOn = remoteMic;
        syncPeersToState();
      }
    });

    socket.on("remote-camera-toggle", ({ socketId, cameraOn: remoteCam }) => {
      const entry = peersRef.current.get(socketId);
      if (entry) {
        entry.cameraOn = remoteCam;
        syncPeersToState();
      }
    });

    socket.on("remote-screen-share-toggle", ({ socketId }) => {
      // Trigger a re-render for the affected peer's video
      const entry = peersRef.current.get(socketId);
      if (entry) {
        entry.refreshKey = Date.now();
        syncPeersToState();
      }
    });
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
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white p-12 rounded-[48px] shadow-2xl shadow-indigo-100/50 border border-slate-100">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">Ready to join?</h1>
              <p className="mt-2 text-slate-500 font-medium">{meeting?.title || "EMS Meeting Room"}</p>
            </div>

            <div className="relative group aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl ring-8 ring-slate-50">
              <video
                ref={setLocalVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover mirror ${cameraOn ? "" : "hidden"}`}
              />
              {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-4xl font-bold text-slate-600">
                    {me?.name?.charAt(0) || "U"}
                  </div>
                </div>
              )}

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <button
                  onClick={toggleMic}
                  className={`p-4 rounded-2xl transition-all shadow-xl ${micOn ? "bg-white/10 backdrop-blur-md text-white hover:bg-white/20" : "bg-red-500 text-white hover:bg-red-600"}`}
                >
                  {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-4 rounded-2xl transition-all shadow-xl ${cameraOn ? "bg-white/10 backdrop-blur-md text-white hover:bg-white/20" : "bg-red-500 text-white hover:bg-red-600"}`}
                >
                  {cameraOn ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4 text-center lg:text-left">
              <div className="flex -space-x-3 justify-center lg:justify-start">
                {[1, 2, 3].map((i) => <div key={i} className="w-10 h-10 rounded-full bg-indigo-100 border-4 border-white" />)}
              </div>
              <p className="text-slate-600 font-medium">
                {me ? "Some other team members are already here" : "Loading your profile..."}
              </p>
              <button
                onClick={joinMeeting}
                disabled={!me || !meeting || !stream}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-95 ${
                  me && meeting && stream
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {me ? (stream ? "Join Meeting Room" : "Initializing Camera...") : "Please Wait..."}
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-400 justify-center lg:justify-start">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm font-semibold">Automatic HD Quality Enabled</span>
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
  // Determine grid columns based on participant count (Google Meet style)
  const gridCols =
    totalParticipants <= 1 ? "1fr" :
    totalParticipants <= 4 ? "repeat(2, 1fr)" :
    totalParticipants <= 9 ? "repeat(3, 1fr)" :
    "repeat(4, 1fr)";

  return (
    <div className="h-screen bg-[#202124] flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Top Bar */}
        <div className="p-4 flex justify-between items-center z-20 bg-[#202124]">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#303134]">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white text-sm">{meeting?.title}</span>
            <span className="text-gray-500 mx-1">|</span>
            <span className="text-gray-400 font-medium text-xs tracking-tight">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setIsSidebarOpen(true); setActiveTab("people"); }}
              className="p-2.5 rounded-full bg-[#303134] text-gray-300 hover:bg-[#3c4043] transition-all"
            >
              <Users size={20} />
            </button>
            <button
              onClick={() => { setIsSidebarOpen(true); setActiveTab("chat"); }}
              className="p-2.5 rounded-full bg-[#303134] text-gray-300 hover:bg-[#3c4043] transition-all"
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-3 flex items-center justify-center overflow-hidden">
          <div
            className="w-full h-full max-w-[1400px] grid gap-2 place-items-center auto-rows-fr"
            style={{ gridTemplateColumns: gridCols }}
          >
            {/* Local Video Tile */}
            <div className="relative w-full h-full min-h-0 bg-[#3c4043] rounded-xl overflow-hidden group">
              <video
                ref={setLocalVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover mirror ${cameraOn ? "" : "invisible"}`}
              />
              {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#3c4043]">
                  <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold">
                    {me?.name?.charAt(0)}
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-semibold text-white">
                {me?.name} (You)
                {!micOn && <MicOff size={13} className="text-red-400" />}
              </div>
            </div>

            {/* Remote Participants */}
            {peers.map((p) => (
              <RemoteVideo
                key={p.socketId}
                peer={p.peer}
                userId={p.userId}
                myId={myIdRef.current}
                remoteMicOn={p.micOn}
                remoteCameraOn={p.cameraOn}
                refreshKey={p.refreshKey}
              />
            ))}
          </div>
        </div>

        {/* Bottom Controls Bar */}
        <div className="flex justify-center pb-6 pt-2 z-20 bg-[#202124]">
          <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-[#303134]">
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                micOn ? "bg-[#3c4043] text-white hover:bg-[#4a4d51]" : "bg-red-500 text-white hover:bg-red-600"
              }`}
              title={micOn ? "Mute" : "Unmute"}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <button
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                cameraOn ? "bg-[#3c4043] text-white hover:bg-[#4a4d51]" : "bg-red-500 text-white hover:bg-red-600"
              }`}
              title={cameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isScreenSharing ? "bg-indigo-600 text-white" : "bg-[#3c4043] text-white hover:bg-[#4a4d51]"
              }`}
              title={isScreenSharing ? "Stop sharing" : "Share screen"}
            >
              <ScreenShare size={20} />
            </button>

            <div className="w-px h-8 bg-gray-600 mx-1" />

            <button
              onClick={leaveMeeting}
              className="px-6 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all font-semibold gap-2"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-[360px] border-l border-[#3c4043] flex flex-col bg-[#202124] h-full">
          <div className="p-4 border-b border-[#3c4043] flex items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("chat")}
                className={`pb-1 text-sm font-semibold transition-all relative ${activeTab === "chat" ? "text-indigo-400" : "text-gray-500 hover:text-gray-300"}`}
              >
                Chat
                {activeTab === "chat" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 rounded-full" />}
              </button>
              <button
                onClick={() => setActiveTab("people")}
                className={`pb-1 text-sm font-semibold transition-all relative ${activeTab === "people" ? "text-indigo-400" : "text-gray-500 hover:text-gray-300"}`}
              >
                People ({totalParticipants})
                {activeTab === "people" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 rounded-full" />}
              </button>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-[#3c4043] rounded-full transition-all text-gray-400">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "chat" ? (
              <div className="p-4 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{m.sender}</span>
                      <span className="text-[10px] text-gray-500">{m.time}</span>
                    </div>
                    <div className="bg-[#303134] p-3 rounded-xl rounded-tl-none text-gray-300 text-sm leading-relaxed">
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">In this meeting</div>

                {/* Self */}
                <div className="flex items-center gap-3 p-3 bg-[#303134] rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {me?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{me?.name} (You)</p>
                    <p className="text-[10px] font-semibold text-indigo-400 uppercase">{me?.role?.replace("_", " ")}</p>
                  </div>
                </div>

                {/* Remote participants */}
                {peers.map((p) => (
                  <RemoteParticipantInfo key={p.socketId} userId={p.userId} />
                ))}

                {/* Invite Section */}
                {(me?.id === meeting?.creatorId?.id || me?.role === "ceo") && (
                  <div className="pt-6 border-t border-[#3c4043] mt-4 space-y-3">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <UserPlus size={10} /> Invite Team Members
                    </div>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={userSearch}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        className="w-full bg-[#303134] border border-[#3c4043] rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none text-white placeholder-gray-500 focus:border-indigo-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <div className="text-center py-4"><Loader2 size={16} className="animate-spin mx-auto text-indigo-400" /></div>
                      ) : searchResults.map((user) => (
                        <div key={user.id || user._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#303134] transition-all">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#3c4043] flex items-center justify-center text-[10px] font-bold text-gray-300">
                              {user.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">{user.name}</p>
                              <p className="text-[9px] text-gray-500 font-medium">{user.role?.replace("_", " ")}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleInviteUser(user)}
                            className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-all"
                          >
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
            <div className="p-4 border-t border-[#3c4043]">
              <div className="relative">
                <textarea
                  placeholder="Send a message to everyone"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  className="w-full bg-[#303134] border border-[#3c4043] rounded-xl px-4 py-3 text-sm outline-none text-white placeholder-gray-500 focus:border-indigo-500 transition-all resize-none h-20"
                />
                <button
                  onClick={sendMessage}
                  className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
                >
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
    <div className="flex items-center gap-3 p-3 bg-[#303134] rounded-xl">
      <div className="w-9 h-9 rounded-full bg-[#3c4043] text-gray-300 flex items-center justify-center font-bold text-xs">
        {userData?.name?.charAt(0) || "?"}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{userData?.name || "Loading..."}</p>
        <p className="text-[10px] font-semibold text-gray-500 uppercase">{userData?.role?.replace("_", " ") || "PARTICIPANT"}</p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REMOTE VIDEO TILE
// ═══════════════════════════════════════════════════════════════════════════════
const RemoteVideo = ({ peer, userId, myId, remoteMicOn, remoteCameraOn, refreshKey }) => {
  const videoRef = useRef();
  const [userData, setUserData] = useState(null);

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

  // Attach remote stream
  useEffect(() => {
    const handleStream = (remoteStream) => {
      // Safety: never play our own audio back
      if (String(userId) === String(myId)) {
        if (videoRef.current) { videoRef.current.muted = true; videoRef.current.volume = 0; }
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    };

    // If peer already has a stream, apply immediately
    if (peer.streams && peer.streams[0]) {
      handleStream(peer.streams[0]);
    }
    peer.on("stream", handleStream);

    // Fetch user metadata
    if (userId && String(userId) !== String(myId)) {
      usersApi.getById(String(userId))
        .then(setUserData)
        .catch(() => {});
    }

    return () => { peer.off("stream", handleStream); };
  }, [peer, userId, myId]);

  return (
    <div className="relative w-full h-full min-h-0 bg-[#3c4043] rounded-xl overflow-hidden group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${remoteCameraOn ? "" : "invisible"}`}
      />

      {!remoteCameraOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#3c4043]">
          <div className="w-20 h-20 rounded-full bg-slate-700 text-gray-300 flex items-center justify-center text-3xl font-bold">
            {userData?.name?.charAt(0) || "P"}
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-semibold text-white">
        <span className={`w-1.5 h-1.5 rounded-full ${remoteCameraOn ? "bg-emerald-400" : "bg-gray-500"}`} />
        {userData ? `${userData.name}` : "Participant"}
        {remoteMicOn === false && <MicOff size={13} className="text-red-400 ml-1" />}
      </div>
    </div>
  );
};

export default UnifiedMeetingRoom;
