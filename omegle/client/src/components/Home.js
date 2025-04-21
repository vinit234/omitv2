import React from 'react';

const Home = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Random Chat</h1>
      <p className="text-xl mb-8">Choose your preferred chat type:</p>
      <div className="flex gap-4">
        <button
          onClick={() => onStart('text')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
        >
          Text Chat
        </button>
        <button
          onClick={() => onStart('video')}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
        >
          Video Chat
        </button>
      </div>
    </div>
  );
};

export default Home; 