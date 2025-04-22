import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';

const VideoChat = ({ partnerId, onNext, socket }) => {
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const messagesEndRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const streamRef = useRef();

  // Initialize media stream
  useEffect(() => {
    let mounted = true;

    const initializeStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: true 
        });

        if (mounted) {
          setStream(mediaStream);
          streamRef.current = mediaStream;
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStream;
            await localVideoRef.current.play().catch(err => {
              console.error('Error playing local video:', err);
              setError('Error playing local video');
            });
          }
          
          setIsStreamReady(true);
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        if (mounted) {
          setIsStreamReady(false);
          setError('Error accessing camera/microphone. Please check permissions.');
        }
      }
    };

    initializeStream();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle camera toggle
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  // Handle microphone toggle
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  // Initialize peer connection
  useEffect(() => {
    if (!stream || !partnerId || !isStreamReady) {
      return;
    }

    setIsWaiting(false);

    const newPeer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    newPeer.on('signal', data => {
      socket.emit('signal', { partnerId, signal: data });
    });

    newPeer.on('stream', remoteStream => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(err => {
          console.error('Error playing remote video:', err);
          setError('Error playing remote video');
        });
      }
    });

    newPeer.on('connect', () => {
      setIsConnected(true);
    });

    newPeer.on('error', err => {
      console.error('Peer error:', err);
      setError('Error establishing video connection');
    });

    setPeer(newPeer);

    return () => {
      if (newPeer) {
        newPeer.destroy();
      }
    };
  }, [stream, partnerId, socket, isStreamReady]);

  // Handle incoming signals
  useEffect(() => {
    if (!stream || !partnerId || !isStreamReady || !peer) return;

    const handleSignal = (data) => {
      if (data.senderId === partnerId) {
        peer.signal(data.signal);
      }
    };

    socket.on('signal', handleSignal);

    return () => {
      socket.off('signal', handleSignal);
    };
  }, [stream, partnerId, peer, socket, isStreamReady]);

  // Handle messages
  useEffect(() => {
    const handleMessage = (data) => {
      if (data.senderId === partnerId) {
        setMessages(prev => [...prev, { text: data.message, sender: data.senderId }]);
      }
    };

    socket.on('message', handleMessage);

    return () => {
      socket.off('message', handleMessage);
    };
  }, [partnerId, socket]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNext = () => {
    if (peer) {
      peer.destroy();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsWaiting(true);
    onNext();
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && partnerId) {
      socket.emit('message', { partnerId, message });
      setMessages(prev => [...prev, { text: message, sender: socket.id }]);
      setMessage('');
    }
  };

  if (!isStreamReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-xl">Setting up video...</p>
      </div>
    );
  }

  if (isWaiting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-xl">Waiting for a stranger...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white shadow-md p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Video Chat with Stranger</h2>
          <div className="flex items-center gap-4">
            {/* Camera control button with text */}
            <button
              onClick={toggleCamera}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                isCameraOn ? 'bg-green-500' : 'bg-red-500'
              } text-white transition-colors duration-200`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isCameraOn 
                    ? "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    : "M18.586 18.586a2 2 0 002.828 0l1.414-1.414a2 2 0 000-2.828L20.414 12l2.414-2.414a2 2 0 000-2.828L21.414 5.586a2 2 0 00-2.828 0L16.172 8 14 10.172V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h7v-2H5V8h7v2.172l-2.172 2.172a2 2 0 000 2.828l1.414 1.414a2 2 0 002.828 0L16.172 16l2.414 2.414z"
                  }
                />
              </svg>
              <span className="hidden md:inline">
                {isCameraOn ? 'Camera On' : 'Camera Off'}
              </span>
            </button>

            {/* Microphone control button with text */}
            <button
              onClick={toggleMic}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                isMicOn ? 'bg-green-500' : 'bg-red-500'
              } text-white transition-colors duration-200`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMicOn ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                )}
              </svg>
              <span className="hidden md:inline">
                {isMicOn ? 'Mic On' : 'Mic Off'}
              </span>
            </button>

            {/* Connection status and next button */}
            <div className="flex items-center gap-2">
              {isConnected && (
                <span className="text-green-500 bg-green-100 px-2 py-1 rounded">
                  Connected
                </span>
              )}
              {error && (
                <span className="text-red-500 bg-red-100 px-2 py-1 rounded">
                  {error}
                </span>
              )}
              <button
                onClick={onNext}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status banner for camera and mic state */}
      <div className={`${(isCameraOn && isMicOn) ? 'hidden' : 'block'} bg-yellow-100 border-b border-yellow-200 px-4 py-2`}>
        <div className="flex items-center justify-center gap-4">
          {!isCameraOn && (
            <span className="flex items-center gap-2 text-yellow-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Camera is off
            </span>
          )}
          {!isMicOn && (
            <span className="flex items-center gap-2 text-yellow-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Microphone is muted
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Video Section */}
        <div className="flex-1 relative bg-gray-100">
          {/* Remote Video */}
          <div className="absolute inset-0">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Local Video */}
          <div className="absolute bottom-4 right-4 w-64 h-48 rounded-lg overflow-hidden shadow-lg bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Camera status overlay */}
            {!isCameraOn && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                <span className="text-white text-lg">Camera Off</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.sender === partnerId ? 'text-left' : 'text-right'
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    msg.sender === partnerId
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t">
            <div className="flex">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-r-lg"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
