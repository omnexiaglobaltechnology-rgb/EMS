import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer/simplepeer.min.js";
import {
  Loader2, Link, Copy, Check, Video, PhoneOff, UserPlus, MessageSquare, ScreenShare, Mic, MicOff, VideoOff, Send, X, Users, Settings, MoreVertical, Search
} from "lucide-react";
import { meetingsApi, authApi, usersApi, SOCKET_URL } from "../../utils/api";

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Meeting State
  const [meeting, setMeeting] = useState(null);
  const [peers, setPeers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Invitation State
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Refs
  const socketRef = useRef();
  const userVideoRef = useRef();
  const peersRef = useRef([]);
  const streamRef = useRef();
  const screenStreamRef = useRef(null);

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
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

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
      setStream(currentStream);
      streamRef.current = currentStream;
      if (userVideoRef.current) {
        // Local preview: only video tracks to prevent hearing your own mic
        const previewStream = new MediaStream(currentStream.getVideoTracks());
        userVideoRef.current.srcObject = previewStream;
        userVideoRef.current.muted = true;
        userVideoRef.current.defaultMuted = true;
      }
      return currentStream;
    } catch (err) {
      console.error("Media error", err);
      return null;
    }
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !micOn);
      setMicOn(!micOn);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.enabled = !cameraOn);
      setCameraOn(!cameraOn);
    }
  };

  // Replace the video track on all existing peers with screen or camera
  const replaceTrackOnAllPeers = useCallback((newTrack) => {
    peersRef.current.forEach(({ peer }) => {
      try {
        const sender = peer._pc?.getSenders?.()?.find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(newTrack);
        }
      } catch (err) {
        console.warn("Could not replace track on peer:", err);
      }
    });
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing, revert to camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      // Re-enable camera track on all peers
      const camTrack = streamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        camTrack.enabled = true;
        replaceTrackOnAllPeers(camTrack);
        if (userVideoRef.current) {
          const previewStream = new MediaStream([camTrack]);
          userVideoRef.current.srcObject = previewStream;
        }
      }
      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace the video track on all peers
        replaceTrackOnAllPeers(screenTrack);

        // Show screen share in local preview
        if (userVideoRef.current) {
          const previewStream = new MediaStream([screenTrack]);
          userVideoRef.current.srcObject = previewStream;
        }

        setIsScreenSharing(true);

        // When user stops screen share via browser UI button
        screenTrack.onended = () => {
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
          }
          const camTrack = streamRef.current?.getVideoTracks()[0];
          if (camTrack) {
            camTrack.enabled = true;
            replaceTrackOnAllPeers(camTrack);
            if (userVideoRef.current) {
              const previewStream = new MediaStream([camTrack]);
              userVideoRef.current.srcObject = previewStream;
            }
          }
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error("Screen share error:", err);
      }
    }
  }, [isScreenSharing, replaceTrackOnAllPeers]);

  const joinMeeting = () => {
    const myId = me?.id || me?._id;
    if (!myId) {
      console.warn("User data not loaded yet, cannot join meeting");
      return;
    }

    setIsJoined(true);
    console.log("Connecting to socket at:", SOCKET_URL);
    
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to socket server:", socketRef.current.id);
      socketRef.current.emit("join-room", roomId, myId);
    });

    // When a NEW user joins the room AFTER us, WE initiate a peer to them
    socketRef.current.on("user-joined", (userId, socketId) => {
      // Skip self
      if (userId === myId || socketId === socketRef.current.id) return;

      // Prevent duplicate peers
      if (peersRef.current.some(p => p.peerID === socketId)) {
        console.log("Peer already exists for socket:", socketId, "— skipping");
        return;
      }

      console.log("New user joined:", userId, "Socket:", socketId);
      const peer = createPeer(socketId, socketRef.current.id, streamRef.current);
      const peerObj = { peerID: socketId, peer, userId };
      peersRef.current.push(peerObj);
      setPeers(prev => [...prev, peerObj]);
    });

    // Signal handler for WebRTC signaling (SDP + ICE candidates)
    socketRef.current.on("signal", (payload) => {
      // Skip signals from self
      if (payload.sender === socketRef.current.id) return;

      const existingPeer = peersRef.current.find(p => p.peerID === payload.sender);
      if (existingPeer) {
        // Forward the signal to the existing peer
        try {
          existingPeer.peer.signal(payload.signal);
        } catch (err) {
          console.warn("Error signaling existing peer:", err);
        }
      } else {
        // New peer that was already in the room — they initiated to us, we respond
        console.log("Creating responding peer for:", payload.sender);
        const peer = addPeer(payload.signal, payload.sender, streamRef.current);
        const peerObj = { peerID: payload.sender, peer, userId: payload.userId };
        peersRef.current.push(peerObj);
        setPeers(prev => [...prev, peerObj]);
      }
    });

    socketRef.current.on("chat-message", (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on("user-disconnected", (socketId) => {
      console.log("User disconnected:", socketId);
      const peerObj = peersRef.current.find(p => p.peerID === socketId);
      if (peerObj) {
        try { peerObj.peer.destroy(); } catch (e) { /* already destroyed */ }
      }
      peersRef.current = peersRef.current.filter(p => p.peerID !== socketId);
      setPeers(prev => prev.filter(p => p.peerID !== socketId));
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });
  };

  // Re-apply local stream when joining (video element re-mounts)
  useEffect(() => {
    if (isJoined && streamRef.current && userVideoRef.current) {
      const previewStream = new MediaStream(streamRef.current.getVideoTracks());
      userVideoRef.current.srcObject = previewStream;
      userVideoRef.current.muted = true;
      userVideoRef.current.defaultMuted = true;
    }
  }, [isJoined]);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: true,
      stream,
      config: ICE_SERVERS
    });
    peer.on("signal", signal => {
      socketRef.current.emit("signal", {
        target: userToSignal,
        signal,
        userId: me?.id || me?._id
      });
    });
    peer.on("error", err => {
      console.error("Peer error (initiator):", err);
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: true,
      stream,
      config: ICE_SERVERS
    });
    peer.on("signal", signal => {
      socketRef.current.emit("signal", {
        target: callerID,
        signal,
        userId: me?.id || me?._id
      });
    });
    peer.on("error", err => {
      console.error("Peer error (responder):", err);
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
    if (socketRef.current) socketRef.current.disconnect();
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
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
      
      setMeeting(prev => ({ ...prev, invitees: updatedInvitees }));
      setSearchResults(prev => prev.filter(u => (u.id || u._id) !== (user.id || user._id)));
    } catch (err) {
      console.error("Invite failed", err);
    }
  };

  // ─── PRE-JOIN LOBBY ─────────────────────────────────────────────────
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
                ref={userVideoRef}
                autoPlay
                muted={true}
                playsInline={true}
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
                  disabled={!me || !meeting}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-95 ${
                    me && meeting 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {me ? "Join Meeting Room" : "Please Wait..."}
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

  // ─── MEETING ROOM (JOINED) ──────────────────────────────────────────
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
                    <video
                      ref={userVideoRef}
                      autoPlay
                      muted={true}
                      playsInline={true}
                      className={`w-full h-full object-cover ${isScreenSharing ? '' : 'mirror'} ${cameraOn || isScreenSharing ? "" : "invisible"}`}
                    />
                    {!cameraOn && !isScreenSharing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                            <div className="w-24 h-24 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-4xl font-black">
                                {me?.name?.charAt(0)}
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/10">
                        {me?.name} (You) {isScreenSharing && " — Screen"}
                        {!micOn && <MicOff size={14} className="text-red-400" />}
                    </div>
                </div>

                {/* Remote Participants */}
                {peers.map(p => (
                    <RemoteVideo key={p.peerID} peer={p.peer} userId={p.userId} />
                ))}
            </div>
        </div>

        {/* Floating Controls Bar */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-slate-900/90 backdrop-blur-3xl px-10 py-5 rounded-[40px] flex items-center gap-8 shadow-2xl border border-white/10">
                <button
                  onClick={toggleMic}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${micOn ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-red-500 text-white shadow-lg shadow-red-500/20"}`}
                  title={micOn ? "Mute" : "Unmute"}
                >
                  {micOn ? <Mic size={22} /> : <MicOff size={22} />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${cameraOn ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-red-500 text-white shadow-lg shadow-red-500/20"}`}
                  title={cameraOn ? "Turn off camera" : "Turn on camera"}
                >
                  {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
                </button>

                <div className="w-px h-10 bg-white/10 mx-2" />

                <button
                  onClick={toggleScreenShare}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  title={isScreenSharing ? "Stop sharing" : "Share screen"}
                >
                  {isScreenSharing ? <ScreenShare size={22} /> : <ScreenShare size={22} />}
                </button>

                <button
                  onClick={leaveMeeting}
                  className="w-20 h-14 bg-red-600 hover:bg-red-700 text-white rounded-[28px] flex items-center justify-center transition-all shadow-2xl active:scale-95"
                  title="Leave meeting"
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
                               <Users size={10} /> Remote Participants ({peers.length})
                           </div>
                           <div className="space-y-3">
                               {peers.map(p => (
                                  <RemoteParticipantInfo key={p.peerID} userId={p.userId} />
                                ))}
                           </div>
                        </div>
                      )}

                      {/* Invite Section */}
                      {(me?.id === meeting?.creatorId?.id || me?._id === meeting?.creatorId?._id || me?.role === 'ceo') && (
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

// ─── REMOTE PARTICIPANT INFO (Sidebar) ─────────────────────────────────
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

// ─── REMOTE VIDEO ──────────────────────────────────────────────────────
const RemoteVideo = ({ peer, userId }) => {
    const videoRef = useRef();
    const [userData, setUserData] = useState(null);
    const [hasVideo, setHasVideo] = useState(true);

    useEffect(() => {
        const handleStream = (remoteStream) => {
            console.log("Received remote stream for user:", userId, "tracks:", remoteStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
            if (videoRef.current) {
                videoRef.current.srcObject = remoteStream;
                // CRITICAL: Do NOT mute remote video — we need to hear their audio
                videoRef.current.muted = false;
                videoRef.current.volume = 1.0;

                // Explicitly attempt playback
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => {
                        console.warn("Autoplay blocked for remote video, retrying...", err);
                        setTimeout(() => {
                            if (videoRef.current) {
                                videoRef.current.play().catch(e => {
                                    console.error("Remote video play failed:", e);
                                });
                            }
                        }, 500);
                    });
                }
            }

            // Track video track state changes
            remoteStream.getVideoTracks().forEach(track => {
                setHasVideo(track.enabled);
                track.onmute = () => setHasVideo(false);
                track.onunmute = () => setHasVideo(true);
                track.onended = () => setHasVideo(false);
            });
        };

        // If peer already has a stream, apply it immediately
        if (peer._remoteStreams && peer._remoteStreams[0]) {
            handleStream(peer._remoteStreams[0]);
        }

        peer.on("stream", handleStream);

        // Fetch user metadata
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
                muted={false}
                className={`w-full h-full object-cover ${hasVideo ? '' : 'invisible'}`}
            />
            {!hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <div className="w-24 h-24 rounded-full bg-slate-700/50 text-slate-400 flex items-center justify-center text-4xl font-black">
                        {userData?.name?.charAt(0) || "?"}
                    </div>
                </div>
            )}
            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {userData ? `${userData.name} (${userData.role?.replace("_", " ").toUpperCase()})` : "Participant"}
            </div>
        </div>
    );
};

export default UnifiedMeetingRoom;
