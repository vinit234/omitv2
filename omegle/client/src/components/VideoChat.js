// import React, { useEffect, useRef, useState } from 'react';
// import Peer from 'simple-peer';

// const VideoChat = ({ partnerId, onNext, socket }) => {
//   const [stream, setStream] = useState(null);
//   const [peer, setPeer] = useState(null);
//   const [isStreamReady, setIsStreamReady] = useState(false);
//   const [isConnected, setIsConnected] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState(null);
//   const [isWaiting, setIsWaiting] = useState(true);
//   const messagesEndRef = useRef();
//   const localVideoRef = useRef();
//   const remoteVideoRef = useRef();

//   // Initialize media stream
//   useEffect(() => {
//     console.log('Initializing media stream...');
//     let mounted = true;

//     const initializeStream = async () => {
//       try {
//         const mediaStream = await navigator.mediaDevices.getUserMedia({ 
//           video: { 
//             width: { ideal: 1280 },
//             height: { ideal: 720 }
//           }, 
//           audio: true 
//         });

//         if (mounted) {
//           console.log('Media stream obtained successfully');
//           setStream(mediaStream);
          
//           // Set up local video
//           if (localVideoRef.current) {
//             console.log('Setting up local video');
//             localVideoRef.current.srcObject = mediaStream;
//             localVideoRef.current.muted = true; // Mute local video to prevent echo
//             localVideoRef.current.play().catch(err => {
//               console.error('Error playing local video:', err);
//               setError('Error playing local video');
//             });
//           }
          
//           setIsStreamReady(true);
//         }
//       } catch (err) {
//         console.error('Error accessing media devices:', err);
//         if (mounted) {
//           setIsStreamReady(false);
//           setError('Error accessing camera/microphone. Please check permissions.');
//         }
//       }
//     };

//     initializeStream();

//     return () => {
//       mounted = false;
//       if (stream) {
//         console.log('Cleaning up media stream');
//         stream.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, []);

//   // Initialize peer connection
//   useEffect(() => {
//     if (!stream || !partnerId || !isStreamReady) {
//       console.log('Waiting for partner or stream...');
//       return;
//     }

//     console.log('Initializing peer connection with partner:', partnerId);
//     setIsWaiting(false);

//     const peer = new Peer({
//       initiator: true,
//       trickle: false,
//       stream,
//     });

//     peer.on('signal', data => {
//       console.log('Sending signal data to partner');
//       socket.emit('signal', { partnerId, signal: data });
//     });

//     peer.on('stream', remoteStream => {
//       console.log('Received remote stream from partner');
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = remoteStream;
//         remoteVideoRef.current.play().catch(err => {
//           console.error('Error playing remote video:', err);
//           setError('Error playing remote video');
//         });
//       }
//     });

//     peer.on('connect', () => {
//       console.log('Peer connection established');
//       setIsConnected(true);
//     });

//     peer.on('error', err => {
//       console.error('Peer error:', err);
//       setError('Error establishing video connection');
//     });

//     peer.on('close', () => {
//       console.log('Peer connection closed');
//       setIsConnected(false);
//     });

//     setPeer(peer);

//     return () => {
//       if (peer) {
//         console.log('Cleaning up peer connection');
//         peer.destroy();
//       }
//     };
//   }, [stream, partnerId, socket, isStreamReady]);

//   // Handle incoming signals
//   useEffect(() => {
//     if (!stream || !partnerId || !isStreamReady) return;

//     const handleSignal = (data) => {
//       console.log('Received signal data from partner');
//       if (data.senderId === partnerId && peer) {
//         console.log('Processing signal data');
//         peer.signal(data.signal);
//       }
//     };

//     socket.on('signal', handleSignal);

//     return () => {
//       socket.off('signal', handleSignal);
//     };
//   }, [stream, partnerId, peer, socket, isStreamReady]);

//   // Handle incoming messages
//   useEffect(() => {
//     const handleMessage = (data) => {
//       if (data.senderId === partnerId) {
//         setMessages(prev => [...prev, { text: data.message, sender: data.senderId }]);
//       }
//     };

//     socket.on('message', handleMessage);

//     return () => {
//       socket.off('message', handleMessage);
//     };
//   }, [partnerId, socket]);

//   // Auto-scroll to bottom of messages
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const handleNext = () => {
//     console.log('User clicked next - cleaning up and finding new partner');
//     if (peer) {
//       peer.destroy();
//     }
//     if (stream) {
//       stream.getTracks().forEach(track => track.stop());
//     }
//     setIsWaiting(true);
//     onNext();
//   };

//   const sendMessage = (e) => {
//     e.preventDefault();
//     if (message.trim() && partnerId) {
//       socket.emit('message', { partnerId, message });
//       setMessages(prev => [...prev, { text: message, sender: socket.id }]);
//       setMessage('');
//     }
//   };

//   if (!isStreamReady) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
//         <p className="mt-4 text-xl">Setting up video...</p>
//       </div>
//     );
//   }

//   if (isWaiting) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
//         <p className="mt-4 text-xl">Waiting for a stranger...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-screen">
//       <div className="bg-white shadow-md p-4">
//         <div className="flex justify-between items-center">
//           <h2 className="text-xl font-semibold">Video Chat with Stranger</h2>
//           <div className="flex items-center gap-4">
//             {isConnected && (
//               <span className="text-green-500">Connected</span>
//             )}
//             {error && (
//               <span className="text-red-500">{error}</span>
//             )}
//             <button
//               onClick={handleNext}
//               className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="flex-1 flex">
//         {/* Video Section */}
//         <div className="flex-1 relative bg-gray-100">
//           {/* Remote Video */}
//           <div className="absolute inset-0">
//             <video
//               ref={remoteVideoRef}
//               autoPlay
//               playsInline
//               className="w-full h-full object-cover"
//             />
//           </div>

//           {/* Local Video */}
//           <div className="absolute bottom-4 right-4 w-64 h-48 rounded-lg overflow-hidden shadow-lg bg-black">
//             <video
//               ref={localVideoRef}
//               autoPlay
//               playsInline
//               muted
//               className="w-full h-full object-cover"
//             />
//           </div>
//         </div>

//         {/* Chat Section */}
//         <div className="w-80 bg-white border-l flex flex-col">
//           <div className="flex-1 overflow-y-auto p-4">
//             {messages.map((msg, index) => (
//               <div
//                 key={index}
//                 className={`mb-4 ${
//                   msg.sender === partnerId ? 'text-left' : 'text-right'
//                 }`}
//               >
//                 <div
//                   className={`inline-block p-3 rounded-lg ${
//                     msg.sender === partnerId
//                       ? 'bg-gray-200 text-gray-800'
//                       : 'bg-blue-500 text-white'
//                   }`}
//                 >
//                   {msg.text}
//                 </div>
//               </div>
//             ))}
//             <div ref={messagesEndRef} />
//           </div>

//           <form onSubmit={sendMessage} className="p-4 border-t">
//             <div className="flex">
//               <input
//                 type="text"
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//                 placeholder="Type a message..."
//                 className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//               <button
//                 type="submit"
//                 className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-r-lg"
//               >
//                 Send
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoChat;
// import React, { useEffect, useRef, useState } from 'react';
// import Peer from 'simple-peer';

// const VideoChat = ({ partnerId, onNext, socket }) => {
//   const [stream, setStream] = useState(null);
//   const [peer, setPeer] = useState(null);
//   const [isStreamReady, setIsStreamReady] = useState(false);
//   const [isConnected, setIsConnected] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState(null);
//   const [isWaiting, setIsWaiting] = useState(true);
//   const messagesEndRef = useRef();
//   const localVideoRef = useRef();
//   const remoteVideoRef = useRef();

//   // Initialize media stream
//   useEffect(() => {
//     console.log('Initializing media stream...');
//     let mounted = true;

//     const initializeStream = async () => {
//       try {
//         const mediaStream = await navigator.mediaDevices.getUserMedia({ 
//           video: { 
//             width: { ideal: 1280 },
//             height: { ideal: 720 }
//           }, 
//           audio: true 
//         });

//         if (mounted) {
//           console.log('Media stream obtained successfully');
//           setStream(mediaStream);
          
//           // Set up local video
//           if (localVideoRef.current) {
//             console.log('Setting up local video');
//             localVideoRef.current.srcObject = mediaStream;
//             localVideoRef.current.muted = true; // Mute local video to prevent echo
//             localVideoRef.current.play().catch(err => {
//               console.error('Error playing local video:', err);
//               setError('Error playing local video');
//             });
//           }
          
//           setIsStreamReady(true);
//         }
//       } catch (err) {
//         console.error('Error accessing media devices:', err);
//         if (mounted) {
//           setIsStreamReady(false);
//           setError('Error accessing camera/microphone. Please check permissions.');
//         }
//       }
//     };

//     initializeStream();

//     return () => {
//       mounted = false;
//       if (stream) {
//         console.log('Cleaning up media stream');
//         stream.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, []);

//   // Initialize peer connection
//   useEffect(() => {
//     if (!stream || !partnerId || !isStreamReady) {
//       console.log('Waiting for partner or stream...');
//       return;
//     }

//     console.log('Initializing peer connection with partner:', partnerId);
//     setIsWaiting(false);

//     const newPeer = new Peer({
//       initiator: true,
//       trickle: false,
//       stream,
//     });

//     newPeer.on('signal', data => {
//       console.log('Sending signal data to partner');
//       socket.emit('signal', { partnerId, signal: data });
//     });

//     newPeer.on('stream', remoteStream => {
//       console.log('Received remote stream from partner');
//       const remoteVideo = remoteVideoRef.current;
//       if (remoteVideo) {
//         remoteVideo.srcObject = remoteStream;

//         const tryPlay = () => {
//           remoteVideo.play().then(() => {
//             console.log('Remote video is playing.');
//           }).catch(err => {
//             console.error('Error trying to play remote video:', err);
//             setError('Error playing remote video. Please click to unmute or allow autoplay.');
//           });
//         };

//         remoteVideo.onloadedmetadata = () => {
//           console.log('Remote video metadata loaded.');
//           tryPlay();
//         };

//         tryPlay();
//       }
//     });

//     newPeer.on('connect', () => {
//       console.log('Peer connection established');
//       setIsConnected(true);
//     });

//     newPeer.on('error', err => {
//       console.error('Peer error:', err);
//       setError('Error establishing video connection');
//     });

//     newPeer.on('close', () => {
//       console.log('Peer connection closed');
//       setIsConnected(false);
//     });

//     setPeer(newPeer);

//     return () => {
//       if (newPeer) {
//         console.log('Cleaning up peer connection');
//         newPeer.destroy();
//       }
//     };
//   }, [stream, partnerId, socket, isStreamReady]);

//   // Handle incoming signals
//   useEffect(() => {
//     if (!stream || !partnerId || !isStreamReady) return;

//     const handleSignal = (data) => {
//       console.log('Received signal data from partner');
//       if (data.senderId === partnerId && peer) {
//         console.log('Processing signal data');
//         peer.signal(data.signal);
//       }
//     };

//     socket.on('signal', handleSignal);

//     return () => {
//       socket.off('signal', handleSignal);
//     };
//   }, [stream, partnerId, peer, socket, isStreamReady]);

//   // Handle incoming messages
//   useEffect(() => {
//     const handleMessage = (data) => {
//       if (data.senderId === partnerId) {
//         setMessages(prev => [...prev, { text: data.message, sender: data.senderId }]);
//       }
//     };

//     socket.on('message', handleMessage);

//     return () => {
//       socket.off('message', handleMessage);
//     };
//   }, [partnerId, socket]);

//   // Auto-scroll to bottom of messages
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const handleNext = () => {
//     console.log('User clicked next - cleaning up and finding new partner');
//     if (peer) {
//       peer.destroy();
//     }
//     if (stream) {
//       stream.getTracks().forEach(track => track.stop());
//     }
//     setIsWaiting(true);
//     onNext();
//   };

//   const sendMessage = (e) => {
//     e.preventDefault();
//     if (message.trim() && partnerId) {
//       socket.emit('message', { partnerId, message });
//       setMessages(prev => [...prev, { text: message, sender: socket.id }]);
//       setMessage('');
//     }
//   };

//   if (!isStreamReady) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
//         <p className="mt-4 text-xl">Setting up video...</p>
//       </div>
//     );
//   }

//   if (isWaiting) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
//         <p className="mt-4 text-xl">Waiting for a stranger...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-screen">
//       <div className="bg-white shadow-md p-4">
//         <div className="flex justify-between items-center">
//           <h2 className="text-xl font-semibold">Video Chat with Stranger</h2>
//           <div className="flex items-center gap-4">
//             {isConnected && (
//               <span className="text-green-500">Connected</span>
//             )}
//             {error && (
//               <span className="text-red-500">{error}</span>
//             )}
//             <button
//               onClick={handleNext}
//               className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="flex-1 flex">
//         {/* Video Section */}
//         <div className="flex-1 relative bg-gray-100">
//           {/* Remote Video */}
//           <div className="absolute inset-0">
//             <video
//               ref={remoteVideoRef}
//               autoPlay
//               playsInline
//               className="w-full h-full object-cover"
//             />
//           </div>

//           {/* Local Video */}
//           <div className="absolute bottom-4 right-4 w-64 h-48 rounded-lg overflow-hidden shadow-lg bg-black">
//             <video
//               ref={localVideoRef}
//               autoPlay
//               playsInline
//               muted
//               className="w-full h-full object-cover"
//             />
//           </div>
//         </div>

//         {/* Chat Section */}
//         <div className="w-80 bg-white border-l flex flex-col">
//           <div className="flex-1 overflow-y-auto p-4">
//             {messages.map((msg, index) => (
//               <div
//                 key={index}
//                 className={`mb-4 ${
//                   msg.sender === partnerId ? 'text-left' : 'text-right'
//                 }`}
//               >
//                 <div
//                   className={`inline-block p-3 rounded-lg ${
//                     msg.sender === partnerId
//                       ? 'bg-gray-200 text-gray-800'
//                       : 'bg-blue-500 text-white'
//                   }`}
//                 >
//                   {msg.text}
//                 </div>
//               </div>
//             ))}
//             <div ref={messagesEndRef} />
//           </div>

//           <form onSubmit={sendMessage} className="p-4 border-t">
//             <div className="flex">
//               <input
//                 type="text"
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//                 placeholder="Type a message..."
//                 className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//               <button
//                 type="submit"
//                 className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-r-lg"
//               >
//                 Send
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoChat;
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
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const messagesEndRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  // Initialize media stream
  useEffect(() => {
    let mounted = true;
    const initStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (mounted) {
          setStream(mediaStream);
          localVideoRef.current.srcObject = mediaStream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play();
          setIsStreamReady(true);
        }
      } catch (err) {
        console.error(err);
        setError('Please allow camera & microphone access');
      }
    };
    initStream();
    return () => {
      mounted = false;
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Handle peer connection
  useEffect(() => {
    if (!stream || !partnerId || !isStreamReady) return;

    setIsWaiting(false);

    const newPeer = new Peer({ initiator: true, trickle: false, stream });

    newPeer.on('signal', data => socket.emit('signal', { partnerId, signal: data }));

    newPeer.on('stream', remoteStream => {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(err => {
        console.error('Remote video error:', err);
        setError('Issue playing remote video');
      });
    });

    newPeer.on('connect', () => setIsConnected(true));
    newPeer.on('error', err => {
      console.error('Peer error:', err);
      setError('Peer connection failed');
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, [stream, partnerId, socket, isStreamReady]);

  useEffect(() => {
    const handleSignal = (data) => {
      if (data.senderId === partnerId && peer) {
        peer.signal(data.signal);
      }
    };
    socket.on('signal', handleSignal);
    return () => socket.off('signal', handleSignal);
  }, [partnerId, peer, socket]);

  useEffect(() => {
    const handleMessage = (data) => {
      if (data.senderId === partnerId) {
        setMessages(prev => [...prev, { text: data.message, sender: data.senderId }]);
      }
    };
    socket.on('message', handleMessage);
    return () => socket.off('message', handleMessage);
  }, [partnerId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNext = () => {
    if (peer) peer.destroy();
    if (stream) stream.getTracks().forEach(track => track.stop());
    onNext();
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('message', { partnerId, message });
      setMessages(prev => [...prev, { text: message, sender: socket.id }]);
      setMessage('');
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  if (isWaiting) {
    return (
      <div className="flex items-center justify-center h-screen text-xl">
        Waiting for a stranger to connect...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white shadow-md">
        <h1 className="text-2xl font-bold">Random Video Chat</h1>
        <div className="flex gap-2">
          <button onClick={toggleAudio} className="bg-gray-200 px-4 py-2 rounded">
            {audioEnabled ? 'Mute' : 'Unmute'}
          </button>
          <button onClick={toggleVideo} className="bg-gray-200 px-4 py-2 rounded">
            {videoEnabled ? 'Camera Off' : 'Camera On'}
          </button>
          <button onClick={handleNext} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Next
          </button>
        </div>
      </div>

      {/* Video Section */}
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="mb-2 text-lg font-semibold text-gray-700">You</h2>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full max-w-md rounded-lg shadow-md" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="mb-2 text-lg font-semibold text-gray-700">Stranger</h2>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full max-w-md rounded-lg shadow-md" />
        </div>
      </div>

      {/* Chat Box */}
      <div className="w-full border-t bg-white flex flex-col max-h-60">
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg max-w-xs ${
                msg.sender === partnerId ? 'bg-gray-200 self-start' : 'bg-blue-500 text-white self-end'
              }`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="flex border-t p-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-l focus:outline-none"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default VideoChat;
