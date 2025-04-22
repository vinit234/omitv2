import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Home from './components/Home';
import Chat from './components/Chat';
import VideoChat from './components/VideoChat';
import './App.css';

const socket = io(process.env.REACT_APP_SOCKET_URL);

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatType, setChatType] = useState('text');

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socket.on('partnerFound', (data) => {
      setPartnerId(data.partnerId);
      setChatType(data.chatType);
      setIsLoading(false);
    });

    socket.on('message', (data) => {
      setMessages(prev => [...prev, { text: data.message, sender: data.senderId }]);
    });

    socket.on('partnerLeft', () => {
      setPartnerId(null);
      setMessages([]);
      setIsLoading(true);
      socket.emit('findPartner', { chatType });
    });

    socket.on('signal', (data) => {
      // Handle WebRTC signaling
      if (data.senderId === partnerId) {
        // Forward the signal to the VideoChat component
        // This will be handled by the VideoChat component's useEffect
      }
    });

    return () => {
      socket.off('connect');
      socket.off('partnerFound');
      socket.off('message');
      socket.off('partnerLeft');
      socket.off('signal');
    };
  }, [chatType]);

  const startChat = (type) => {
    setChatType(type);
    setIsLoading(true);
    socket.emit('findPartner', { chatType: type });
  };

  const sendMessage = (message) => {
    if (partnerId) {
      socket.emit('message', { partnerId, message });
      setMessages(prev => [...prev, { text: message, sender: socket.id }]);
    }
  };

  const handleNext = () => {
    socket.emit('next', { chatType });
  };

  return (
    <div className="min-h-screen bg-gray-100">
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
