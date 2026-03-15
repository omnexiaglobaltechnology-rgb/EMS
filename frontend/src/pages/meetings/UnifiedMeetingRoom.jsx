import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer/simplepeer.min.js";
import {
  Loader2, Link, Copy, Check, Video, PhoneOff, UserPlus, MessageSquare, ScreenShare, Mic, MicOff, VideoOff, Send, X, Users, Settings, MoreVertical, Search
} from "lucide-react";
import { meetingsApi, authApi, usersApi, SOCKET_URL } from "../../utils/api";

// Socket URL is now imported from ../../utils/api

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Free TURN servers – required when users are behind NAT/firewalls
    // Without TURN, WebRTC connections silently fail for many network configurations
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turns:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ]
};

const UnifiedMeetingRoom = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();

  // User State
  const [me, setMe] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [stream, setStream] = useState(null);

  // Meeting State
  const [meeting, setMeeting] = useState(null);
  const [peers, setPeers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState("chat"); // "chat" or "people"
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Invitation State
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Refs
  const socketRef = useRef();
  const userVideoRef = useRef();
  const peersRef = useRef([]);
  const streamRef = useRef();
  
  useEffect(() => {
    const init = async () => {
      try {
        const userData = await authApi.me();
        setMe(userData);
        
        const meetingData = await meetingsApi.getById(roomId);
        setMeeting(meetingData);
        
        await requestMedia(true, true);
      } catch (err) {
        console.error("Meeting init failed", err);
      }
    };

    init();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  // videoElMounted is a counter that bumps every time the local <video> element
  // mounts/unmounts. This lets the useEffect below react to the DOM element appearing.
  const [videoElMounted, setVideoElMounted] = useState(0);

  // useCallback keeps the ref callback stable across renders.
  // When React attaches the element it calls this; we store it and bump the counter.
  const setLocalVideoRef = useCallback((el) => {
    userVideoRef.current = el;
    // Bump counter so the mute-sync useEffect fires
    setVideoElMounted(n => n + 1);
  }, []);

  // ─── DEFINITIVE ECHO FIX ───────────────────────────────────────────────────
  // Give the local <video> element a VIDEO-ONLY MediaStream (zero audio tracks).
  // It is physically impossible to play back audio that doesn't exist in the stream.
  // Previous mute/volume=0 approaches failed because browsers and React can
  // un-mute elements during re-renders or autoPlay. This approach needs no muting.
  //
  // The FULL stream (audio + video) stays in streamRef.current and is passed to
  // WebRTC peers — so remote participants still hear you normally.
  useEffect(() => {
    const el = userVideoRef.current;
    if (!el || !stream) return;

    // Create a preview stream with ONLY the video track(s) — no audio at all
    const videoOnlyStream = new MediaStream(stream.getVideoTracks());
    el.srcObject = videoOnlyStream;
    // Still mark muted as belt-and-suspenders, but the zero-audio-track
    // approach is what actually makes this bulletproof
    el.muted = true;
    el.volume = 0;

    console.log(
      '[MEET] Local preview: video-only stream, tracks:',
      videoOnlyStream.getTracks().map(t => t.kind)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, videoElMounted]);
  // ────────────────────────────────────────────────────────────────────────────

  const requestMedia = async (audio, video) => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ 
        video, 
        audio: typeof audio === 'boolean' ? (audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false) : audio
      });

      console.log("[MEET] 🎥 requestMedia successful. micOn:", micOn, "cameraOn:", cameraOn, "tracks:", currentStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
      setStream(currentStream);
      streamRef.current = currentStream;
      return currentStream;
    } catch (err) {
      console.error("[MEET] Media error", err);
      return null;
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const nextMicState = !micOn;
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = nextMicState;
      });
      setMicOn(nextMicState);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const nextCameraState = !cameraOn;
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = nextCameraState;
      });
      setCameraOn(nextCameraState);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace track for all peers
        console.log("[MEET] 🔄 Replacing video track with screen track for", peersRef.current.length, "peers");
        const videoTrack = streamRef.current.getVideoTracks()[0];
        
        peersRef.current.forEach(({ peer, peerID }) => {
          if (videoTrack && screenTrack) {
            try {
              peer.replaceTrack(videoTrack, screenTrack, streamRef.current);
              console.log("[MEET] ✅ Track replaced for peer:", peerID);
            } catch (pErr) {
              console.error("[MEET] ❌ replaceTrack failed for peer:", peerID, pErr);
            }
          }
        });

        // Replace track in local streamRef
        if (videoTrack) {
          videoTrack.stop();
          streamRef.current.removeTrack(videoTrack);
          streamRef.current.addTrack(screenTrack);
        }

        // Trigger local preview update
        setStream(new MediaStream(streamRef.current.getTracks()));

        screenTrack.onended = () => {
          console.log("[MEET] 🖥️ Screen sharing ended by browser");
          stopScreenShare(screenTrack);
        };

        setIsScreenSharing(true);
        socketRef.current.emit("screen-share-toggle", roomId, true);
      } catch (err) {
        console.error("[MEET] Screen share error:", err);
      }
    } else {
      const screenTrack = streamRef.current.getVideoTracks()[0];
      stopScreenShare(screenTrack);
    }
  };

  const stopScreenShare = async (screenTrack) => {
    if (screenTrack) screenTrack.stop();
    
    // Get camera back using the existing helper to maintain audio settings
    const cameraStream = await requestMedia(micOn, true);
    if (!cameraStream) {
      console.error("[MEET] ❌ Failed to restore camera after screen share");
      return;
    }
    const cameraTrack = cameraStream.getVideoTracks()[0];
    const currentVideoTrack = streamRef.current.getVideoTracks()[0];

    // Replace track back for all peers
    peersRef.current.forEach(({ peer, peerID }) => {
      if (currentVideoTrack && cameraTrack) {
        try {
          peer.replaceTrack(currentVideoTrack, cameraTrack, streamRef.current);
        } catch (pErr) {
          console.error("[MEET] ❌ replaceTrack (revert) failed for peer:", peerID, pErr);
        }
      }
    });

    // Update local streamRef
    if (currentVideoTrack) {
      currentVideoTrack.stop();
      streamRef.current.removeTrack(currentVideoTrack);
      streamRef.current.addTrack(cameraTrack);
    }

    // Trigger local preview update
    setStream(new MediaStream(streamRef.current.getTracks()));
    setIsScreenSharing(false);
    setCameraOn(true); // Ensure camera is marked as on
    
    if (socketRef.current) {
      socketRef.current.emit("screen-share-toggle", roomId, false);
    }
  };

  const joinMeeting = () => {
    const myId = me?.id || me?._id;
    if (!myId) {
      console.warn("[MEET] User data not loaded yet, cannot join meeting");
      return;
    }

    if (!streamRef.current) {
      console.error("[MEET] No media stream available! Cannot join without camera/mic.");
      return;
    }

    setIsJoined(true);
    console.log("[MEET] Connecting to socket at:", SOCKET_URL);
    
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socketRef.current.on("connect", () => {
      console.log("[MEET] ✅ Socket connected:", socketRef.current.id);
      socketRef.current.emit("join-room", roomId, myId);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("[MEET] ❌ Socket connection error:", err.message);
    });

    socketRef.current.on("user-joined", (userId, socketId) => {
      if (userId === (me?.id || me?._id) || socketId === socketRef.current.id) return;
      console.log("[MEET] 👤 New user joined:", userId, "Socket:", socketId);
      
      if (!streamRef.current) {
        console.error("[MEET] ❌ Cannot create peer - no local stream!");
        return;
      }

      const peer = createPeer(socketId, socketRef.current.id, streamRef.current);
      peersRef.current.push({
        peerID: socketId,
        peer,
        userId: userId
      });
      setPeers(prev => [...prev, { peerID: socketId, peer, userId }]);
    });

    socketRef.current.on("signal", (payload) => {
      if (payload.userId === (me?.id || me?._id) || payload.sender === socketRef.current.id) return;
      console.log("[MEET] 📡 Received signal from:", payload.sender, "type:", payload.signal?.type || "candidate");
      const item = peersRef.current.find(p => p.peerID === payload.sender);
      if (item) {
        try {
          item.peer.signal(payload.signal);
        } catch (err) {
          console.error("[MEET] ❌ Error processing signal:", err);
        }
      } else {
        console.log("[MEET] Creating new peer for incoming signal from:", payload.sender);
        const peer = addPeer(payload.signal, payload.sender, streamRef.current);
        peersRef.current.push({
          peerID: payload.sender,
          peer,
          userId: payload.userId
        });
        setPeers(prev => [...prev, { peerID: payload.sender, peer, userId: payload.userId }]);
      }
    });

    socketRef.current.on("chat-message", (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on("user-disconnected", (socketId) => {
      console.log("[MEET] 👤 User disconnected:", socketId);
      const peerObj = peersRef.current.find(p => p.peerID === socketId);
      if (peerObj) peerObj.peer.destroy();
      const remainingPeers = peersRef.current.filter(p => p.peerID !== socketId);
      peersRef.current = remainingPeers;
      setPeers(remainingPeers);
    });

    socketRef.current.on("remote-screen-share-toggle", ({ socketId, isSharing }) => {
      console.log("[MEET] 🔄 Remote screen share toggle for:", socketId, "Sharing:", isSharing);
      // We don't necessarily need to do much here if replaceTrack works,
      // but we update the peer object state to trigger a re-render of the RemoteVideo component
      setPeers(prev => prev.map(p => p.peerID === socketId ? { ...p, refreshKey: Date.now() } : p));
    });
  };

  // When joining, the video element remounts into the meeting grid.
  // setLocalVideoRef fires → bumps videoElMounted → mute-sync useEffect handles it.
  // No manual re-application needed here.

  const createPeer = (userToSignal, callerID, stream) => {
    console.log("[MEET] Creating peer (initiator) for:", userToSignal, "with stream tracks:", stream.getTracks().map(t => t.kind + ':' + t.enabled));
    const peer = new Peer({ initiator: true, trickle: true, stream, config: ICE_SERVERS });
    
    peer.on("signal", signal => {
      console.log("[MEET] 📤 Sending signal to:", userToSignal, "type:", signal?.type || "candidate");
      socketRef.current.emit("signal", { target: userToSignal, signal, userId: me?.id || me?._id });
    });
    
    peer.on("connect", () => {
      console.log("[MEET] ✅ Peer connected to:", userToSignal);
    });
    
    peer.on("stream", (remoteStream) => {
      console.log("[MEET] 🎵 Received remote stream from:", userToSignal, "tracks:", remoteStream.getTracks().map(t => t.kind + ':' + t.enabled));
    });
    
    peer.on("error", (err) => {
      console.error("[MEET] ❌ Peer error with:", userToSignal, err.message);
    });
    
    peer.on("close", () => {
      console.log("[MEET] Peer connection closed with:", userToSignal);
    });
    
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    console.log("[MEET] Creating peer (receiver) for:", callerID, "with stream tracks:", stream.getTracks().map(t => t.kind + ':' + t.enabled));
    const peer = new Peer({ initiator: false, trickle: true, stream, config: ICE_SERVERS });
    
    peer.on("signal", signal => {
      console.log("[MEET] 📤 Sending signal to:", callerID, "type:", signal?.type || "candidate");
      socketRef.current.emit("signal", { target: callerID, signal, userId: me?.id || me?._id });
    });
    
    peer.on("connect", () => {
      console.log("[MEET] ✅ Peer connected to:", callerID);
    });
    
    peer.on("stream", (remoteStream) => {
      console.log("[MEET] 🎵 Received remote stream from:", callerID, "tracks:", remoteStream.getTracks().map(t => t.kind + ':' + t.enabled));
    });
    
    peer.on("error", (err) => {
      console.error("[MEET] ❌ Peer error with:", callerID, err.message);
    });
    
    peer.on("close", () => {
      console.log("[MEET] Peer connection closed with:", callerID);
    });
    
    peer.signal(incomingSignal);
    return peer;
  };

  const sendMessage = () => {
    if (chatInput.trim() && socketRef.current) {
      const msg = {
        sender: me?.name || "User",
        text: chatInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      socketRef.current.emit("send-chat-message", roomId, msg);
      setChatInput("");
    }
  };

  const leaveMeeting = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave-room", roomId);
      socketRef.current.disconnect();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      if (stream._rawStream) {
        stream._rawStream.getTracks().forEach(track => track.stop());
      }
    }
    navigate(-1);
  };

  const handleSearchUsers = async (val) => {
    setUserSearch(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await meetingsApi.searchInvitees({ search: val });
      // Filter out people already in meeting.invitees
      const existingIds = meeting.invitees.map(i => i.id || i._id);
      setSearchResults(results.filter(u => !existingIds.includes(u.id || u._id)));
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInviteUser = async (user) => {
    try {
      const updatedInvitees = [...meeting.invitees, user];
      const inviteeIds = updatedInvitees.map(i => i.id || i._id);
      await meetingsApi.updateInvitees(roomId, inviteeIds);
      
      // Update local state
      setMeeting(prev => ({ ...prev, invitees: updatedInvitees }));
      setSearchResults(prev => prev.filter(u => (u.id || u._id) !== (user.id || user._id)));
      
      // We could emit a socket event here if we wanted to notify the invited user
    } catch (err) {
      console.error("Invite failed", err);
    }
  };

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
                    {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full bg-indigo-100 border-4 border-white" />)}
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

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Top Header */}
        <div className="p-6 flex justify-between items-center absolute top-0 left-0 right-0 z-20">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-800 text-sm">{meeting?.title}</span>
            <span className="text-slate-300 mx-1">|</span>
            <span className="text-slate-500 font-semibold text-xs tracking-tight uppercase">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="flex gap-2">
             <button onClick={() => { setIsSidebarOpen(true); setActiveTab("people"); }} className="p-3 bg-white rounded-2xl border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                <Users size={20} />
             </button>
             <button onClick={() => { setIsSidebarOpen(true); setActiveTab("chat"); }} className="p-3 bg-white rounded-2xl border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                <MessageSquare size={20} />
             </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 bg-slate-50 p-6 flex items-center justify-center">
            <div className="w-full h-full max-w-7xl grid gap-4 place-items-center"
                 style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 400px), 1fr))` }}>
                
                {/* Local Video */}
                <div className="relative w-full aspect-video bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl group border-2 border-indigo-500/10">
                    <video ref={setLocalVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover mirror ${cameraOn ? "" : "invisible"}`} />
                    {!cameraOn && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                            <div className="w-24 h-24 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-4xl font-black">
                                {me?.name?.charAt(0)}
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/10">
                        {me?.name} (You)
                        {!micOn && <MicOff size={14} className="text-red-400" />}
                    </div>
                </div>

                {/* Remote Participants */}
                {peers.map(p => (
                    <RemoteVideo key={p.peerID} peer={p.peer} userId={p.userId} me={me} refreshKey={p.refreshKey} />
                ))}
            </div>
        </div>

        {/* Floating Controls Bar */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-slate-900/90 backdrop-blur-3xl px-10 py-5 rounded-[40px] flex items-center gap-8 shadow-2xl border border-white/10">
                <button
                  onClick={toggleMic}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${micOn ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-red-500 text-white shadow-lg shadow-red-500/20"}`}
                >
                  {micOn ? <Mic size={22} /> : <MicOff size={22} />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${cameraOn ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-red-500 text-white shadow-lg shadow-red-500/20"}`}
                >
                  {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
                </button>

                <div className="w-px h-10 bg-white/10 mx-2" />

                <button 
                  onClick={toggleScreenShare}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                >
                  <ScreenShare size={22} />
                </button>

                <button
                  onClick={leaveMeeting}
                  className="w-20 h-14 bg-red-600 hover:bg-red-700 text-white rounded-[28px] flex items-center justify-center transition-all shadow-2xl active:scale-95"
                >
                  <PhoneOff size={24} />
                </button>
            </div>
        </div>
      </div>

      {/* Sidebar (Chat / People) */}
      {isSidebarOpen && (
        <div className="w-[400px] border-l border-slate-100 flex flex-col bg-white animate-in slide-in-from-right duration-300 h-full">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
               <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab("chat")}
                    className={`pb-2 text-sm font-bold transition-all relative ${activeTab === "chat" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Chat
                    {activeTab === "chat" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab("people")}
                    className={`pb-2 text-sm font-bold transition-all relative ${activeTab === "people" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    People
                    {activeTab === "people" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
                  </button>
               </div>
               <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
                    <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === "chat" ? (
                   <div className="p-6 space-y-6">
                      {messages.map((m, i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{m.sender}</span>
                                <span className="text-[10px] text-slate-400">{m.time}</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 text-slate-700 text-sm leading-relaxed">
                                {m.text}
                            </div>
                        </div>
                      ))}
                   </div>
                ) : (
                   <div className="p-6 space-y-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Host & Speaker</div>
                      <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                         <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                             {me?.name?.charAt(0)}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900">{me?.name} (You)</p>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">{me?.role?.replace("_", " ")}</p>
                         </div>
                      </div>

                      {peers.length > 0 && (
                        <div className="pt-6 space-y-4">
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                               <Users size={10} /> Remote Participants
                           </div>
                           <div className="space-y-3">
                               {peers.map(p => (
                                  <RemoteParticipantInfo key={p.peerID} userId={p.userId} />
                                ))}
                           </div>
                        </div>
                      )}

                      {/* Invite Section (Visible to Creator or CEO) */}
                      {(me?.id === meeting?.creatorId?.id || me?.role === 'ceo') && (
                        <div className="pt-8 border-t border-slate-100 mt-6 space-y-4">
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                               <UserPlus size={10} /> Invite Team Members
                           </div>
                           
                           <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={userSearch}
                                    onChange={(e) => handleSearchUsers(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                />
                           </div>

                           <div className="space-y-2 max-h-48 overflow-y-auto">
                               {isSearching ? (
                                   <div className="text-center py-4"><Loader2 size={16} className="animate-spin mx-auto text-indigo-500" /></div>
                               ) : searchResults.map(user => (
                                   <div key={user.id || user._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent transition-all">
                                       <div className="flex items-center gap-2">
                                           <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                               {user.name?.charAt(0)}
                                           </div>
                                           <div>
                                               <p className="text-xs font-bold text-slate-800">{user.name}</p>
                                               <p className="text-[9px] text-slate-400 font-medium">{user.role?.replace("_", " ")}</p>
                                           </div>
                                       </div>
                                       <button 
                                          onClick={() => handleInviteUser(user)}
                                          className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                                          title="Add to meeting"
                                       >
                                           <UserPlus size={14} />
                                       </button>
                                   </div>
                               ))}
                               {!isSearching && userSearch.length >= 2 && searchResults.length === 0 && (
                                   <p className="text-center py-4 text-[10px] text-slate-400 font-medium">No users found</p>
                               )}
                           </div>
                        </div>
                      )}
                   </div>
                )}
            </div>

            {activeTab === "chat" && (
                <div className="p-6 bg-slate-50/50 border-t border-slate-50">
                    <div className="relative">
                        <textarea
                          placeholder="Send a message to everyone"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                          className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none h-24"
                        />
                        <button 
                          onClick={sendMessage}
                          className="absolute bottom-4 right-4 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

const RemoteParticipantInfo = ({ userId }) => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        if (userId) {
            usersApi.getById(userId).then(data => setUserData(data)).catch(() => {});
        }
    }, [userId]);

    return (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                {userData?.name?.charAt(0) || "?"}
            </div>
            <div>
               <p className="text-sm font-bold text-slate-900">{userData?.name || "Loading..."}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{userData?.role?.replace("_", " ") || "PARTICIPANT"}</p>
            </div>
        </div>
    );
};

const RemoteVideo = ({ peer, userId, me, refreshKey }) => {
    const videoRef = useRef();
    const [userData, setUserData] = useState(null);
    const [hasAudio, setHasAudio] = useState(false);

    useEffect(() => {
        const el = videoRef.current;
        if (el && el.srcObject) {
            console.log("[MEET] 🔄 Forcing srcObject refresh for:", userId);
            const currentStream = el.srcObject;
            el.srcObject = null;
            el.srcObject = currentStream;
            el.play().catch(() => {});
        }
    }, [refreshKey, userId]);

    useEffect(() => {
        const handleStream = stream => {
            // Safety check: Never play our own audio back to ourselves
            const myId = me?.id || me?._id;
            if (userId && myId && (userId === myId)) {
                console.warn("[MEET] 🛑 Preventing self-audio playback in RemoteVideo for:", userId);
                return;
            }
            
            console.log("[MEET] 🔊 Setting remote stream for user:", userId, "tracks:", stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
            
            const audioTracks = stream.getAudioTracks();
            setHasAudio(audioTracks.length > 0);
            console.log("[MEET] Remote audio tracks:", audioTracks.length, audioTracks.map(t => `enabled:${t.enabled}, muted:${t.muted}, readyState:${t.readyState}`));
            
            if (videoRef.current) {
                // Assign the FULL stream (audio + video) to the remote video element
                videoRef.current.srcObject = stream;
                videoRef.current.volume = 1.0;
                videoRef.current.muted = false; // Explicitly ensure remote video is NOT muted
                
                // Explicitly attempt playback to handle browser autoplay policies
                const attemptPlay = () => {
                    if (!videoRef.current) return;
                    const playPromise = videoRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => console.log("[MEET] ✅ Remote video playing with audio for:", userId))
                            .catch(err => {
                                console.warn("[MEET] ⚠️ Autoplay blocked, retrying in 500ms...", err.name);
                                setTimeout(() => {
                                    if (videoRef.current) {
                                        videoRef.current.play()
                                            .then(() => console.log("[MEET] ✅ Remote video playing on retry"))
                                            .catch(e => console.error("[MEET] ❌ Remote play failed after retry:", e.name));
                                    }
                                }, 500);
                            });
                    }
                };
                attemptPlay();
            }
        };

        // If peer already has a stream, apply it immediately
        if (peer.streams && peer.streams[0]) {
            handleStream(peer.streams[0]);
        }

        peer.on("stream", handleStream);

        // Try to fetch metadata
        if (userId) {
            usersApi.getById(userId).then(data => setUserData(data)).catch(() => {});
        }

        return () => {
            peer.off("stream", handleStream);
        };
    }, [peer, userId]);

    return (
        <div className="relative w-full aspect-video bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl group border-2 border-transparent hover:border-indigo-500/20 transition-all">
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover" 
            />
            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {userData ? `${userData.name} (${userData.role?.replace("_", " ").toUpperCase()})` : "Participant"}
            </div>
        </div>
    );
};

export default UnifiedMeetingRoom;
