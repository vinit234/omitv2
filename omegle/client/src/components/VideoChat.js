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
//     let mounted = true;
//     const initializeStream = async () => {
//       try {
//         const mediaStream = await navigator.mediaDevices.getUserMedia({
//           video: { width: { ideal: 1280 }, height: { ideal: 720 } },
//           audio: true,
//         });
//         if (mounted) {
//           setStream(mediaStream);
//           if (localVideoRef.current) {
//             localVideoRef.current.srcObject = mediaStream;
//             localVideoRef.current.muted = true;
//             localVideoRef.current.play().catch(err => {
//               setError('Error playing local video');
//             });
//           }
//           setIsStreamReady(true);
//         }
//       } catch (err) {
//         setIsStreamReady(false);
//         setError('Error accessing camera/microphone.');
//       }
//     };
//     initializeStream();

//     return () => {
//       mounted = false;
//       if (stream) {
//         stream.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, []);

//   // Initialize peer connection
//   useEffect(() => {
//     if (!stream || !partnerId || !isStreamReady) return;

//     setIsWaiting(false);
//     const newPeer = new Peer({
//       initiator: true,
//       trickle: false,
//       stream,
//     });

//     newPeer.on('signal', data => {
//       socket.emit('signal', { partnerId, signal: data });
//     });

//     newPeer.on('stream', remoteStream => {
//       const remoteVideo = remoteVideoRef.current;
//       if (remoteVideo) {
//         remoteVideo.srcObject = remoteStream;
//         remoteVideo.play().catch(err => setError('Error playing remote video.'));
//       }
//     });

//     newPeer.on('connect', () => setIsConnected(true));
//     newPeer.on('error', () => setError('Error establishing video connection.'));
//     newPeer.on('close', () => setIsConnected(false));

//     setPeer(newPeer);

//     return () => {
//       if (newPeer) {
//         newPeer.destroy();
//       }
//     };
//   }, [stream, partnerId, socket, isStreamReady]);

//   // Handle incoming signals
//   useEffect(() => {
//     if (!stream || !partnerId || !isStreamReady) return;

//     const handleSignal = (data) => {
//       if (data.senderId === partnerId && peer) {
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
//           <h2 className="text-xl font-semibold">Video Chat</h2>
//           <div className="flex items-center gap-4">
//             {isConnected && <span className="text-green-500">Connected</span>}
//             {error && <span className="text-red-500">{error}</span>}
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
//           <video
//             ref={remoteVideoRef}
//             autoPlay
//             playsInline
//             className="absolute inset-0 w-full h-full object-cover"
//           />
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
//                 className={`mb-4 ${msg.sender === partnerId ? 'text-left' : 'text-right'}`}
//               >
//                 <div
//                   className={`inline-block p-3 rounded-lg ${
//                     msg.sender === partnerId ? 'bg-gray-200 text-gray-800' : 'bg-blue-500 text-white'
//                   }`}
//                 >
//                   {msg.text}
//                 </div>
//               </div>
//             ))}
//             <div ref={messagesEndRef} />
//           </div>

//           <form onSubmit={sendMessage} className="p-4 border-t bg-gray-50">
//             <div className="flex items-center">
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
//   const [isChatExpanded, setIsChatExpanded] = useState(false);

//   const localVideoRef = useRef();
//   const remoteVideoRef = useRef();
//   const messagesEndRef = useRef();

//   useEffect(() => {
//     let mounted = true;

//     const initStream = async () => {
//       try {
//         const mediaStream = await navigator.mediaDevices.getUserMedia({
//           video: { width: { ideal: 1280 }, height: { ideal: 720 } },
//           audio: true,
//         });

//         if (mounted) {
//           setStream(mediaStream);
//           if (localVideoRef.current) {
//             localVideoRef.current.srcObject = mediaStream;
//             localVideoRef.current.muted = true;
//             localVideoRef.current.play().catch(() => {
//               setError('Error playing local video.');
//             });
//           }
//           setIsStreamReady(true);
//         }
//       } catch (err) {
//         setIsStreamReady(false);
//         setError('Error accessing camera/microphone.');
//       }
//     };

//     initStream();

//     return () => {
//       mounted = false;
//       stream?.getTracks().forEach(track => track.stop());
//     };
//   }, []);

//   useEffect(() => {
//     if (!stream || !partnerId || !isStreamReady) return;

//     setIsWaiting(false);

//     const newPeer = new Peer({ initiator: true, trickle: false, stream });

//     newPeer.on('signal', signal => {
//       socket.emit('signal', { partnerId, signal });
//     });

//     newPeer.on('stream', remoteStream => {
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = remoteStream;
//         remoteVideoRef.current.play().catch(() => {
//           setError('Error playing remote video.');
//         });
//       }
//     });

//     newPeer.on('connect', () => setIsConnected(true));
//     newPeer.on('error', () => setError('Error establishing connection.'));
//     newPeer.on('close', () => setIsConnected(false));

//     setPeer(newPeer);

//     return () => newPeer.destroy();
//   }, [stream, partnerId, socket, isStreamReady]);

//   useEffect(() => {
//     if (!peer) return;

//     const handleSignal = ({ senderId, signal }) => {
//       if (senderId === partnerId) peer.signal(signal);
//     };

//     socket.on('signal', handleSignal);
//     return () => socket.off('signal', handleSignal);
//   }, [peer, partnerId, socket]);

//   useEffect(() => {
//     const handleMessage = ({ senderId, message }) => {
//       if (senderId === partnerId) {
//         setMessages(prev => [...prev, { text: message, sender: senderId }]);
//       }
//     };
//     socket.on('message', handleMessage);
//     return () => socket.off('message', handleMessage);
//   }, [partnerId, socket]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   useEffect(() => {
//     const handlePartnerLeft = () => {
//       setError('Partner disconnected. Finding new partner...');
//       setIsWaiting(true);
//     };

//     socket.on('partnerLeft', handlePartnerLeft);
//     return () => socket.off('partnerLeft', handlePartnerLeft);
//   }, [socket]);

//   const handleNext = () => {
//     peer?.destroy();
//     stream?.getTracks().forEach(track => track.stop());
//     setMessages([]);
//     setIsWaiting(true);
//     onNext();
//   };

//   const sendMessage = (e) => {
//     e.preventDefault();
//     if (!message.trim()) return;
//     socket.emit('message', { partnerId, message });
//     setMessages(prev => [...prev, { text: message, sender: socket.id }]);
//     setMessage('');
//   };

//   const toggleChat = () => setIsChatExpanded(prev => !prev);

//   if (!isStreamReady) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
//         <div className="text-center">
//           <div className="animate-spin h-16 w-16 border-t-4 border-b-4 border-blue-500 rounded-full mx-auto" />
//           <p className="mt-4 text-xl">Setting up video...</p>
//         </div>
//       </div>
//     );
//   }

//   if (isWaiting) {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
//         <div className="animate-spin h-16 w-16 border-t-4 border-b-4 border-blue-500 rounded-full" />
//         <p className="mt-4 text-xl">Waiting for a stranger...</p>
//         <p className="mt-2 text-sm text-gray-400">Keep this tab active</p>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-screen bg-gray-900 text-white">
//       <header className="bg-gray-800 p-4 flex justify-between items-center">
//         <div className="flex items-center gap-4">
//           <h2 className="text-xl font-semibold">Video Chat</h2>
//           {isConnected && (
//             <span className="bg-green-600 text-xs px-2 py-1 rounded-full">Connected</span>
//           )}
//         </div>
//         <div className="flex gap-2">
//           <button onClick={toggleChat} className="md:hidden bg-blue-600 px-3 py-1 rounded">
//             {isChatExpanded ? 'Video' : 'Chat'}
//           </button>
//           <button onClick={handleNext} className="bg-red-600 px-4 py-2 rounded">Next</button>
//         </div>
//       </header>

//       <div className="flex flex-1 flex-col md:flex-row">
//         <div className={`${isChatExpanded ? 'hidden md:flex' : 'flex'} flex-1 bg-black relative`}>
//           <video
//             ref={remoteVideoRef}
//             autoPlay
//             playsInline
//             className="absolute w-full h-full object-cover"
//           />
//           <div className="absolute bottom-4 right-4 w-28 h-44 sm:w-40 sm:h-60 bg-gray-800 border border-gray-700 rounded overflow-hidden">
//             <video
//               ref={localVideoRef}
//               autoPlay
//               playsInline
//               muted
//               className="w-full h-full object-cover"
//             />
//           </div>
//           {error && (
//             <div className="absolute top-0 w-full bg-red-500 text-center p-2 text-sm">{error}</div>
//           )}
//         </div>

//         <div className={`${!isChatExpanded ? 'hidden md:flex' : 'flex'} md:w-80 lg:w-96 flex-col bg-gray-800 border-l border-gray-700`}>
//           <div className="p-3 border-b border-gray-700 font-semibold">Chat</div>
//           <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
//             {messages.length === 0 ? (
//               <p className="text-gray-500 text-center mt-8">No messages yet.</p>
//             ) : (
//               messages.map((msg, idx) => (
//                 <div
//                   key={idx}
//                   className={`mb-2 ${msg.sender === partnerId ? 'text-left' : 'text-right'}`}
//                 >
//                   <div className={`inline-block px-4 py-2 rounded-lg max-w-xs ${
//                     msg.sender === partnerId ? 'bg-gray-700' : 'bg-blue-600'
//                   }`}>
//                     {msg.text}
//                   </div>
//                 </div>
//               ))
//             )}
//             <div ref={messagesEndRef} />
//           </div>
//           <form onSubmit={sendMessage} className="flex p-3 border-t border-gray-700 bg-gray-800">
//             <input
//               type="text"
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               placeholder="Type a message..."
//               className="flex-1 px-3 py-2 bg-gray-700 rounded-l-lg outline-none"
//             />
//             <button type="submit" className="bg-blue-600 px-4 py-2 rounded-r-lg">Send</button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoChat;
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(true);
  const [isStreamRetrying, setIsStreamRetrying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('initializing');
  const [connectionTimer, setConnectionTimer] = useState(null);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const messagesEndRef = useRef();
  const streamRetryCount = useRef(0);
  const maxStreamRetries = 3;

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initialize camera and microphone stream
  const initStream = useCallback(async () => {
    try {
      setIsCameraLoading(true);
      setConnectionStatus('connecting-camera');
      
      // Clean up any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user' 
        },
        audio: true,
      });

      setStream(mediaStream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
        localVideoRef.current.muted = true;
        
        try {
          await localVideoRef.current.play();
          setIsStreamReady(true);
          setIsCameraLoading(false);
          streamRetryCount.current = 0;
        } catch (playError) {
          setError('Error playing local video. Please click on the screen to enable autoplay.');
          setIsCameraLoading(false);
        }
      }
    } catch (err) {
      console.error('Media access error:', err);
      setIsCameraLoading(false);
      
      if (streamRetryCount.current < maxStreamRetries && !isStreamRetrying) {
        streamRetryCount.current += 1;
        setIsStreamRetrying(true);
        setError(`Camera/microphone access failed. Retrying (${streamRetryCount.current}/${maxStreamRetries})...`);
        
        // Retry after a short delay
        setTimeout(() => {
          setIsStreamRetrying(false);
          initStream();
        }, 2000);
      } else {
        // Set permanent error after max retries
        setIsStreamReady(false);
        if (err.name === 'NotAllowedError') {
          setError('Camera/microphone access denied. Please check your permissions.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera or microphone found. Please connect a device.');
        } else {
          setError(`Error accessing camera/microphone: ${err.message || 'Unknown error'}`);
        }
        setConnectionStatus('error');
      }
    }
  }, [stream, isStreamRetrying]);

  // Initialize stream on component mount
  useEffect(() => {
    let mounted = true;
    
    initStream();
    
    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initStream]);

  // Create peer connection when partner is found and stream is ready
  useEffect(() => {
    if (!stream || !partnerId || !isStreamReady) return;

    setIsWaiting(false);
    setConnectionStatus('connecting-peer');
    
    // Set a connection timeout
    const connectionTimeoutId = setTimeout(() => {
      if (!isConnected) {
        setError('Connection taking too long. Will try a new partner soon.');
        setConnectionStatus('timeout');
        setTimeout(() => {
          handleNext();
        }, 3000);
      }
    }, 15000);
    
    setConnectionTimer(connectionTimeoutId);

    // Create a new peer connection
    const newPeer = new Peer({ 
      initiator: true, 
      trickle: false, 
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    });

    newPeer.on('signal', signal => {
      socket.emit('signal', { partnerId, signal });
    });

    newPeer.on('stream', remoteStream => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        
        // Handle remote video playback
        remoteVideoRef.current.play()
          .then(() => {
            setConnectionStatus('connected');
          })
          .catch(playError => {
            console.error('Remote video play error:', playError);
            setError('Error playing remote video. Please click the screen to enable autoplay.');
          });
      }
    });

    newPeer.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      clearTimeout(connectionTimeoutId);
    });
    
    newPeer.on('error', (err) => {
      console.error('Peer connection error:', err);
      setError(`Connection error: ${err.message || 'Unknown error'}`);
      setConnectionStatus('error');
    });
    
    newPeer.on('close', () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    setPeer(newPeer);

    return () => {
      clearTimeout(connectionTimeoutId);
      
      if (newPeer) {
        newPeer.destroy();
      }
    };
  }, [stream, partnerId, socket, isStreamReady, handleNext]);

  // Handle incoming signal from partner
  useEffect(() => {
    if (!peer) return;

    const handleSignal = ({ senderId, signal }) => {
      if (senderId === partnerId) {
        try {
          peer.signal(signal);
        } catch (err) {
          console.error('Error handling signal:', err);
          setError('Error establishing connection. Please try next.');
        }
      }
    };

    socket.on('signal', handleSignal);
    return () => socket.off('signal', handleSignal);
  }, [peer, partnerId, socket]);

  // Handle incoming chat messages
  useEffect(() => {
    const handleMessage = ({ senderId, message }) => {
      if (senderId === partnerId) {
        setMessages(prev => [...prev, { text: message, sender: senderId }]);
      }
    };
    
    socket.on('message', handleMessage);
    return () => socket.off('message', handleMessage);
  }, [partnerId, socket]);

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle partner disconnection
  useEffect(() => {
    const handlePartnerLeft = () => {
      setError('Partner disconnected. Finding new partner...');
      setIsWaiting(true);
      setConnectionStatus('waiting');
      
      // Clear messages when partner leaves
      setMessages([]);
    };

    socket.on('partnerLeft', handlePartnerLeft);
    return () => socket.off('partnerLeft', handlePartnerLeft);
  }, [socket]);

  // Handle socket errors
  useEffect(() => {
    const handleSocketError = (errorData) => {
      setError(`Server error: ${errorData.message || 'Unknown error'}`);
    };
    
    socket.on('error', handleSocketError);
    return () => socket.off('error', handleSocketError);
  }, [socket]);

  // Create a memoized version of handleNext to avoid dependency loop
  const handleNext = useCallback(() => {
    // Clear connection timeout if it exists
    if (connectionTimer) {
      clearTimeout(connectionTimer);
    }
    
    setIsWaiting(true);
    setConnectionStatus('switching');
    setMessages([]);
    
    // Close peer connection if it exists
    if (peer) {
      peer.destroy();
      setPeer(null);
    }
    
    // Stop camera to reset properly
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    // Let parent know we're moving to next
    onNext();
    
    // Delay re-initializing camera to avoid race conditions
    setTimeout(() => {
      setIsStreamReady(false);
      initStream();
    }, 1000);
  }, [peer, stream, connectionTimer, onNext, initStream]);

  // Send a chat message
  const sendMessage = (e) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !isConnected) return;
    
    try {
      socket.emit('message', { partnerId, message: trimmedMessage });
      setMessages(prev => [...prev, { text: trimmedMessage, sender: socket.id }]);
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  const toggleChat = () => setIsChatExpanded(prev => !prev);

  // Handle manual camera restart
  const handleRestartCamera = () => {
    setError('Restarting camera...');
    initStream();
  };

  // Handle manual click on video to try autoplay
  const handleVideoClick = async () => {
    if (localVideoRef.current && localVideoRef.current.paused) {
      try {
        await localVideoRef.current.play();
      } catch (err) {
        console.error('Manual play failed:', err);
      }
    }
    
    if (remoteVideoRef.current && remoteVideoRef.current.paused) {
      try {
        await remoteVideoRef.current.play();
      } catch (err) {
        console.error('Manual remote play failed:', err);
      }
    }
  };

  // Loading state - waiting for camera access
  if (isCameraLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-t-4 border-b-4 border-blue-500 rounded-full mx-auto" />
          <p className="mt-4 text-xl">Accessing camera and microphone...</p>
          <p className="mt-2 text-sm text-gray-400">Please allow access when prompted</p>
        </div>
      </div>
    );
  }

  // Error state - failed to get camera access after retries
  if (!isStreamReady && connectionStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center p-8 bg-gray-800 rounded-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-4">Camera Access Error</h2>
          <p className="mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleRestartCamera} 
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting state - looking for a partner
  if (isWaiting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <div className="animate-spin h-16 w-16 border-t-4 border-b-4 border-blue-500 rounded-full" />
        <p className="mt-4 text-xl">Waiting for a stranger...</p>
        <p className="mt-2 text-sm text-gray-400">Keep this tab active</p>
        {error && (
          <div className="mt-4 p-3 bg-red-900/50 rounded-lg text-center max-w-md">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Video Chat</h2>
          {connectionStatus === 'connected' && (
            <span className="bg-green-600 text-xs px-2 py-1 rounded-full">Connected</span>
          )}
          {connectionStatus === 'connecting-peer' && (
            <span className="bg-yellow-600 text-xs px-2 py-1 rounded-full">Connecting...</span>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRestartCamera} 
            className="bg-yellow-600 px-3 py-1 rounded"
            title="Restart camera"
          >
            🔄 Camera
          </button>
          <button onClick={toggleChat} className="md:hidden bg-blue-600 px-3 py-1 rounded">
            {isChatExpanded ? 'Video' : 'Chat'}
          </button>
          <button onClick={handleNext} className="bg-red-600 px-4 py-2 rounded">Next</button>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <div className={`${isChatExpanded ? 'hidden md:flex' : 'flex'} flex-1 bg-black relative`} onClick={handleVideoClick}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 w-28 h-44 sm:w-40 sm:h-60 bg-gray-800 border border-gray-700 rounded overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          {error && (
            <div className="absolute top-0 w-full bg-red-500 text-center p-2 text-sm animate-pulse">
              {error}
            </div>
          )}
          {connectionStatus === 'connecting-peer' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="mt-4">Establishing connection...</p>
              </div>
            </div>
          )}
        </div>

        <div className={`${!isChatExpanded ? 'hidden md:flex' : 'flex'} md:w-80 lg:w-96 flex-col bg-gray-800 border-l border-gray-700`}>
          <div className="p-3 border-b border-gray-700 font-semibold flex justify-between items-center">
            <span>Chat</span>
            {isConnected ? (
              <span className="text-xs bg-green-600 px-2 py-1 rounded-full">Connected</span>
            ) : (
              <span className="text-xs bg-yellow-600 px-2 py-1 rounded-full">Connecting</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center mt-8">No messages yet.</p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-2 ${msg.sender === partnerId ? 'text-left' : 'text-right'}`}
                >
                  <div className={`inline-block px-4 py-2 rounded-lg max-w-xs ${
                    msg.sender === partnerId ? 'bg-gray-700' : 'bg-blue-600'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="flex p-3 border-t border-gray-700 bg-gray-800">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={!isConnected}
              className="flex-1 px-3 py-2 bg-gray-700 rounded-l-lg outline-none disabled:bg-gray-600 disabled:text-gray-400"
            />
            <button 
              type="submit" 
              disabled={!isConnected || !message.trim()}
              className="bg-blue-600 px-4 py-2 rounded-r-lg disabled:bg-blue-800"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
