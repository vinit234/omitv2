const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://omitv2.onrender.com",
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
    console.log(`User ${socket.id} attempting to join ${chatType} queue`);
  
    // If user is already connected or in queue, do nothing
    if (activeConnections.has(socket.id)) {
      console.log(`User ${socket.id} is already in an active connection.`);
      return;
    }
  
    if (waitingUsers[chatType].has(socket.id)) {
      console.log(`User ${socket.id} is already in the ${chatType} queue.`);
      return;
    }
  
    // Add user to the queue
    waitingUsers[chatType].add(socket.id);
    console.log(`User ${socket.id} added to ${chatType} queue`);
  
    // Try to find a partner
    const users = Array.from(waitingUsers[chatType]);
    const availablePartner = users.find(id => id !== socket.id && !activeConnections.has(id));
  
    if (availablePartner) {
      // Remove both users from the queue
      waitingUsers[chatType].delete(socket.id);
      waitingUsers[chatType].delete(availablePartner);
  
      // Store the connection
      activeConnections.set(socket.id, { partnerId: availablePartner, chatType });
      activeConnections.set(availablePartner, { partnerId: socket.id, chatType });
  
      console.log(`Matched users: ${socket.id} and ${availablePartner}`);
  
      // Notify both users
      io.to(socket.id).emit('partnerFound', { partnerId: availablePartner, chatType });
      io.to(availablePartner).emit('partnerFound', { partnerId: socket.id, chatType });
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