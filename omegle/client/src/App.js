import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Home from './components/Home';
import Chat from './components/Chat';
import VideoChat from './components/VideoChat';
import './App.css';

// Create socket instance with proper configuration
const socket = io('http://localhost:5001', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true,
  forceNew: true
});

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatType, setChatType] = useState('text');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Connection event handlers
    const onConnect = () => {
      console.log('Connected to server with ID:', socket.id);
      setIsConnected(true);
      setError(null);
    };

    const onConnectError = (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
      setError('Failed to connect to server');
    };

    const onDisconnect = (reason) => {
      console.log('Disconnected:', reason);
      setIsConnected(false);
    };

    // Chat event handlers
    const onPartnerFound = (data) => {
      console.log('Partner found:', data);
      setPartnerId(data.partnerId);
      setChatType(data.chatType);
      setIsLoading(false);
    };

    const onMessage = (data) => {
      setMessages(prev => [...prev, { text: data.message, sender: data.senderId }]);
    };

    const onPartnerLeft = () => {
      setPartnerId(null);
      setMessages([]);
      setIsLoading(true);
      socket.emit('findPartner', { chatType });
    };

    // Set up event listeners
    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);
    socket.on('partnerFound', onPartnerFound);
    socket.on('message', onMessage);
    socket.on('partnerLeft', onPartnerLeft);
    socket.on('error', (data) => setError(data.message));
    socket.on('waiting', () => setIsLoading(true));

    // Cleanup function
    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', onDisconnect);
      socket.off('partnerFound', onPartnerFound);
      socket.off('message', onMessage);
      socket.off('partnerLeft', onPartnerLeft);
      socket.off('error');
      socket.off('waiting');
    };
  }, [chatType]);

  const startChat = (type) => {
    if (!isConnected) {
      setError('Not connected to server');
      return;
    }
    setChatType(type);
    setIsLoading(true);
    socket.emit('findPartner', { chatType: type });
  };

  const sendMessage = (message) => {
    if (partnerId && isConnected) {
      socket.emit('message', { partnerId, message });
      setMessages(prev => [...prev, { text: message, sender: socket.id }]);
    }
  };

  const handleNext = () => {
    if (isConnected) {
      socket.emit('next', { chatType });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            {error || 'Connecting to server...'}
          </h1>
          {error && (
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {!partnerId ? (
        <Home onStart={startChat} />
      ) : chatType === 'video' ? (
        <VideoChat partnerId={partnerId} onNext={handleNext} socket={socket} />
      ) : (
        <Chat
          messages={messages}
          onSendMessage={sendMessage}
          onNext={handleNext}
          isLoading={isLoading}
          partnerId={partnerId}
        />
      )}
    </div>
  );
}

export default App;
