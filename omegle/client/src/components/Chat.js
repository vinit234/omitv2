import React, { useState, useRef, useEffect } from 'react';

const Chat = ({ messages, onSendMessage, onNext, isLoading, partnerId }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-xl">Looking for a partner...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white shadow-md p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Chat with Stranger</h2>
          <button
            onClick={onNext}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
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
                  ? 'bg-white text-gray-800'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4">
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
  );
};

export default Chat; 