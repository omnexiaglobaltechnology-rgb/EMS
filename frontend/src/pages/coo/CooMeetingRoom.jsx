import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  ScreenShare,
  UserPlus,
  Link,
  Flag,
  Circle,
  PhoneOff,
} from "lucide-react";

/**
 * Secured virtual space for operational meetings steered by the COO.
 * Supplies live streaming, real-time messaging, screen sharing, and recording utilities.
 */
const CooMeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [recording, setRecording] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, sender: "System", text: "Welcome to the meeting chat." },
  ]);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const videoRef = useRef(null);

  /**
   * Halts all tracked media streams forcibly stopping camera and microphone use.
   */
  const stopCurrentStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  /**
   * Automates the departure lifecycle: stopping localized capture, finalizing recordings,
   * and subsequently routing the user back.
   */
  const leaveMeeting = () => {
    stopCurrentStream();
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    navigate(-1);
  };

  /**
   * Intercedes with the browser to provision and mount user media devices.
   *
   * @param {object} options
   * @param {boolean} options.audio - Dictates microphone requisition
   * @param {boolean} options.video - Dictates camera requisition
   * @returns {Promise<MediaStream|null>} Local media stream instance or null alongside an error flag
   */
  const requestMedia = async ({ audio = true, video = true } = {}) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("Media devices are not supported in this browser.");
      setMicOn(false);
      setCameraOn(false);
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio,
        video,
      });
      stopCurrentStream();
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setMicOn(stream.getAudioTracks().length > 0);
      setCameraOn(stream.getVideoTracks().length > 0);
      setMediaError("");
      return stream;
    } catch (error) {
      setMediaError(
        "Camera/Microphone permission is blocked. Please allow access in browser site settings.",
      );
      setMicOn(false);
      setCameraOn(false);
      return null;
    }
  };

  /**
   * Changes the muting operational state of the local microphone track.
   */
  const toggleMic = () => {
    if (!streamRef.current) {
      requestMedia({ audio: true, video: cameraOn });
      return;
    }

    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length === 0 && !micOn) {
      requestMedia({ audio: true, video: cameraOn });
      return;
    }

    const nextMicOn = !micOn;
    audioTracks.forEach((track) => (track.enabled = nextMicOn));
    setMicOn(nextMicOn);
  };

  /**
   * Modifies the activation toggle for the local visual track.
   */
  const toggleCamera = () => {
    if (!streamRef.current) {
      requestMedia({ audio: micOn, video: true });
      return;
    }

    const videoTracks = streamRef.current.getVideoTracks();
    if (videoTracks.length === 0 && !cameraOn) {
      requestMedia({ audio: micOn, video: true });
      return;
    }

    const nextCameraOn = !cameraOn;
    videoTracks.forEach((track) => (track.enabled = nextCameraOn));
    setCameraOn(nextCameraOn);
  };

  /**
   * Revokes screen sharing privileges and gracefully resumes raw camera ingestion.
   */
  const stopScreenShare = async () => {
    setIsScreenSharing(false);
    stopCurrentStream();
    await requestMedia({ audio: true, video: true });
  };

  /**
   * Overrides the current video stream with an actively queried display surface stream.
   * Maps 'onended' browser controls to trigger systematic fallback to the camera.
   */
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setMediaError("Screen sharing is not supported in this browser.");
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      stopCurrentStream();
      streamRef.current = displayStream;

      const [screenTrack] = displayStream.getVideoTracks();
      if (screenTrack) {
        screenTrack.onended = () => {
          stopScreenShare();
        };
      }

      if (videoRef.current) {
        videoRef.current.srcObject = displayStream;
      }

      setIsScreenSharing(true);
      setMediaError("");
    } catch (error) {
      setMediaError("Screen sharing was cancelled or blocked.");
    }
  };

  /**
   * Serializes the string present in the text input area into a chat array addition.
   */
  const sendMessage = () => {
    const trimmedMessage = chatInput.trim();
    if (!trimmedMessage) {
      return;
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      { id: Date.now(), sender: "You", text: trimmedMessage },
    ]);
    setChatInput("");
  };

  // Get camera + mic stream
  useEffect(() => {
    const getMedia = async () => {
      await requestMedia({ video: true, audio: true });
    };

    getMedia();

    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      stopCurrentStream();
    };
  }, []);

  // Start Recording
  /**
   * Activates MediaRecorder hooks across the aggregated user streams to capture the live session.
   */
  const startRecording = async () => {
    let stream = streamRef.current;

    if (!stream) {
      stream = await requestMedia({ audio: true, video: true });
    }

    if (!stream) {
      return;
    }

    chunksRef.current = [];

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `meeting-${id}.webm`;
      a.click();

      URL.revokeObjectURL(url);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  // Stop Recording
  /**
   * Ceases active MediaRecorder processing and generates a downloadable video output.
   */
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-gray-800">
        <h2 className="font-semibold">Meeting ID: {id}</h2>
        <span className="text-sm text-green-400">Live</span>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {mediaError ? (
          <p className="text-red-400 text-sm mb-4 absolute text-center px-4">
            {mediaError}
          </p>
        ) : null}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="bg-black w-3/4 h-3/4 rounded-xl"
        />

        {isChatOpen ? (
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-gray-800 border border-gray-700 rounded-lg flex flex-col">
            <div className="p-3 border-b border-gray-700 font-medium">
              Meeting Chat
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((message) => (
                <div key={message.id} className="text-sm">
                  <span className="text-blue-300 mr-2">{message.sender}:</span>
                  <span>{message.text}</span>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-700 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Type a message"
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm outline-none"
              />
              <button
                onClick={sendMessage}
                className="px-3 py-1 text-sm bg-blue-600 rounded"
              >
                Send
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center gap-6">
        <button onClick={toggleMic}>{micOn ? <Mic /> : <MicOff />}</button>

        <button onClick={toggleCamera}>
          {cameraOn ? <Video /> : <VideoOff />}
        </button>

        <button onClick={() => setIsChatOpen((prevState) => !prevState)}>
          <MessageSquare />
        </button>

        {/* RECORD BUTTON */}
        <button onClick={recording ? stopRecording : startRecording}>
          <Circle className={recording ? "text-red-500 animate-pulse" : ""} />
        </button>

        {/* LEAVE MEETING */}
        <button
          onClick={leaveMeeting}
          className="text-red-500 hover:text-red-600 transition-colors"
        >
          <PhoneOff />
        </button>

        <button>
          <UserPlus />
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Meeting link copied!");
          }}
        >
          <Link />
        </button>

        {/* <button>
          <Flag />
        </button> */}

        <button onClick={toggleScreenShare}>
          <ScreenShare className={isScreenSharing ? "text-green-400" : ""} />
        </button>
      </div>
    </div>
  );
};

export default CooMeetingRoom;
