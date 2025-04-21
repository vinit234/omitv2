const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store connected users and their chat types
const waitingUsers = {
  text: new Set(),
  video: new Set()
};

// Store active connections
const activeConnections = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Handle user joining the queue
  socket.on('findPartner', (data) => {
    const { chatType } = data;
    console.log(`User ${socket.id} joining ${chatType} queue`);
    
    // Add user to appropriate queue
    waitingUsers[chatType].add(socket.id);
    
    // Try to find a partner
    if (waitingUsers[chatType].size >= 2) {
      const users = Array.from(waitingUsers[chatType]);
      const user1 = users[0];
      const user2 = users[1];
      
      // Remove both users from queue
      waitingUsers[chatType].delete(user1);
      waitingUsers[chatType].delete(user2);
      
      // Store the connection
      activeConnections.set(user1, { partnerId: user2, chatType });
      activeConnections.set(user2, { partnerId: user1, chatType });
      
      console.log(`Matched users: ${user1} and ${user2}`);
      
      // Notify both users
      io.to(user1).emit('partnerFound', { partnerId: user2, chatType });
      io.to(user2).emit('partnerFound', { partnerId: user1, chatType });
    }
  });

  // Handle text messages
  socket.on('message', (data) => {
    const { partnerId, message } = data;
    console.log(`Message from ${socket.id} to ${partnerId}`);
    io.to(partnerId).emit('message', { message, senderId: socket.id });
  });

  // Handle WebRTC signaling
  socket.on('signal', (data) => {
    const { partnerId, signal } = data;
    console.log(`Signal from ${socket.id} to ${partnerId}`);
    io.to(partnerId).emit('signal', { signal, senderId: socket.id });
  });

  // Handle next button
  socket.on('next', (data) => {
    const { chatType } = data;
    console.log(`User ${socket.id} clicked next`);
    
    const connection = activeConnections.get(socket.id);
    if (connection) {
      const { partnerId } = connection;
      console.log(`Notifying partner ${partnerId} about disconnect`);
      io.to(partnerId).emit('partnerLeft');
      
      // Add user back to queue
      waitingUsers[chatType].add(socket.id);
      
      // Clean up connections
      activeConnections.delete(socket.id);
      activeConnections.delete(partnerId);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from all queues
    Object.values(waitingUsers).forEach(queue => queue.delete(socket.id));
    
    // Handle active connection
    const connection = activeConnections.get(socket.id);
    if (connection) {
      const { partnerId, chatType } = connection;
      console.log(`Notifying partner ${partnerId} about disconnect`);
      io.to(partnerId).emit('partnerLeft');
      
      // Add partner back to queue
      waitingUsers[chatType].add(partnerId);
      
      // Clean up connections
      activeConnections.delete(socket.id);
      activeConnections.delete(partnerId);
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 