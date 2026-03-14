import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer/simplepeer.min.js";
import {
  Loader2, Link, Copy, Check, Video, PhoneOff, UserPlus, MessageSquare, ScreenShare, Mic, MicOff, VideoOff, Send, X
} from "lucide-react";
import { meetingsApi, authApi, usersApi, SOCKET_URL } from "../../utils/api";

// Socket URL is now imported from ../../utils/api

const InternMeetingRoom = () => {
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
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Refs
  const socketRef = useRef();
  const userVideoRef = useRef();
  const peersRef = useRef([]);
  const streamRef = useRef();

  useEffect(() => {
    const init = async () => {
      // Fetch User Info
      try {
        const userData = await authApi.me();
        setMe(userData);
      } catch (err) {
        console.error("Auth failed", err);
      }

      // Fetch Meeting Info
      try {
        const meetingData = await meetingsApi.getById(roomId);
        setMeeting(meetingData);
      } catch (err) {
        console.error("Failed to fetch meeting", err);
      }

      // Initial Media Request for Pre-join preview
      await requestMedia(true, true);
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
        userVideoRef.current.srcObject = currentStream;
        userVideoRef.current.muted = true;
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

  const joinMeeting = () => {
    const myId = me?.id || me?._id;
    if (!myId) {
      console.warn("User data not loaded yet, cannot join meeting");
      return;
    }

    setIsJoined(true);
    console.log("Connecting to socket at:", SOCKET_URL);
    
    socketRef.current = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socketRef.current.emit("join-room", roomId, myId);

    socketRef.current.on("user-joined", (userId, socketId) => {
      if (userId === (me?.id || me?._id) || socketId === socketRef.current.id) return;
      console.log("User joined:", userId, socketId);
      const peer = createPeer(socketId, socketRef.current.id, streamRef.current);
      peersRef.current.push({
        peerID: socketId,
        peer,
      });
      setPeers(prev => [...prev, { peerID: socketId, peer }]);
    });

    socketRef.current.on("signal", (payload) => {
      if (payload.userId === (me?.id || me?._id) || payload.sender === socketRef.current.id) return;
      const item = peersRef.current.find(p => p.peerID === payload.sender);
      if (item) {
        item.peer.signal(payload.signal);
      } else {
        const peer = addPeer(payload.signal, payload.sender, streamRef.current);
        peersRef.current.push({ peerID: payload.sender, peer });
        setPeers(prev => [...prev, { peerID: payload.sender, peer }]);
      }
    });

    socketRef.current.on("chat-message", (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on("user-disconnected", (socketId) => {
      const peerObj = peersRef.current.find(p => p.peerID === socketId);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      const remainingPeers = peersRef.current.filter(p => p.peerID !== socketId);
      peersRef.current = remainingPeers;
      setPeers(remainingPeers);
    });
  };
  
  // Re-apply local stream when joining (since video element is re-mounted)
  useEffect(() => {
    if (isJoined && streamRef.current && userVideoRef.current) {
        userVideoRef.current.srcObject = streamRef.current;
        userVideoRef.current.muted = true;
    }
  }, [isJoined]);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socketRef.current.emit("signal", { target: userToSignal, signal, userId: me?.id || me?._id });
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socketRef.current.emit("signal", { target: callerID, signal, userId: me?.id || me?._id });
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
    navigate(-1);
  };

  if (!isJoined) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Preview Side */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Ready to join?</h1>
            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <video
                ref={userVideoRef}
                autoPlay
                muted={true}
                playsInline={true}
                className={`w-full h-full object-cover mirror ${cameraOn ? "" : "hidden"}`}
              />
              {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-slate-900">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                    {me?.name?.charAt(0) || <VideoOff size={40} />}
                  </div>
                  <p className="text-slate-400 text-sm font-medium">Camera is off</p>
                </div>
              )}
              
              {/* Preview Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full transition-all ${micOn ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-red-500 text-white hover:bg-red-600"}`}
                >
                  {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full transition-all ${cameraOn ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-red-500 text-white hover:bg-red-600"}`}
                >
                  {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Info Side */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-100">{meeting?.title || "Meeting"}</h2>
              <p className="text-slate-400 text-sm">No one else is here yet</p>
            </div>
            
            <button
              onClick={joinMeeting}
              disabled={!me}
              className={`px-8 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 ${
                me 
                ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/20" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {me ? "Join now" : "Loading profile..."}
            </button>

            <div className="pt-8 flex items-center gap-4 text-slate-500">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800" />
                ))}
              </div>
              <span className="text-sm">Join to see who's here</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-transparent relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
            <Video size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-100">{meeting?.title}</h2>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">In Progress</span>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800 text-sm font-medium text-slate-400">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-4 grid gap-4 relative overflow-hidden" 
           style={{ gridTemplateColumns: `repeat(auto-fit, minmax(400px, 1fr))` }}>
        
        {/* Local Video */}
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 group shadow-2xl">
          <video
            ref={userVideoRef}
            autoPlay
            muted={true}
            playsInline={true}
            className={`w-full h-full object-cover mirror transform transition-transform duration-700 group-hover:scale-105 ${cameraOn ? "" : "invisible"}`}
          />
          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="w-24 h-24 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 text-3xl font-bold">
                {me?.name?.charAt(0)}
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-xs font-bold border border-white/10 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            You ({me?.name})
            {!micOn && <MicOff size={12} className="text-red-400" />}
          </div>
        </div>

        {/* Remote Videos */}
        {peers.map((peerObj) => (
          <VideoComponent key={peerObj.peerID} peer={peerObj.peer} />
        ))}

        {/* Chat Sidebar Overlay */}
        {isChatOpen && (
          <div className="fixed top-24 right-4 bottom-24 w-96 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-right-8 duration-300">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Meeting Chat</h3>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <MessageSquare size={40} className="opacity-20" />
                  <p className="text-sm">No messages yet</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === me?.name ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{msg.sender}</span>
                    <span className="text-[10px] text-slate-600">{msg.time}</span>
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] ${
                    msg.sender === me?.name 
                    ? "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20" 
                    : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 pt-0">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-2 focus-within:border-indigo-500/50 transition-colors flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Send a message..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-600"
                />
                <button
                  onClick={sendMessage}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  disabled={!chatInput.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="p-8 flex justify-center items-center relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-[40px] flex items-center gap-10 shadow-2xl">
          <div className="flex items-center gap-4 border-r border-white/10 pr-10">
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                micOn ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-red-500 text-white hover:bg-red-600 animate-pulse"
              }`}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                cameraOn ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
          </div>

          <div className="flex items-center gap-4 border-r border-white/10 pr-10">
            <button className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-all">
              <ScreenShare size={20} />
            </button>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isChatOpen ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <MessageSquare size={20} />
            </button>
          </div>

          <button
            onClick={leaveMeeting}
            className="w-16 h-12 bg-red-500 hover:bg-red-600 text-white rounded-[24px] flex items-center justify-center transition-all shadow-lg shadow-red-500/20 hover:-translate-y-1 active:scale-95"
            title="Leave Meeting"
          >
            <PhoneOff size={22} variant="bold" />
          </button>
        </div>
      </div>
    </div>
  );
};

const VideoComponent = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", stream => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });
  }, [peer]);

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 group shadow-2xl">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-xs font-bold border border-white/10 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Participant
      </div>
    </div>
  );
};

export default InternMeetingRoom;
