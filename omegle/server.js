const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Updated CORS configuration
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://omitv2.onrender.com"], // Allow both local and production
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["my-custom-header"],
  },
  transports: ['websocket', 'polling'] // Enable all transport methods
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://omitv2.onrender.com"],
  credentials: true
}));
app.use(express.json());

// Store connected users and their chat types with timestamps
const waitingUsers = {
  text: new Map(),
  video: new Map()
};

// Store active connections
const activeConnections = new Map();

// Simple lock mechanism
const lock = {
  isLocked: false,
  queue: [],
  
  acquire: function() {
    return new Promise(resolve => {
      if (!this.isLocked) {
        this.isLocked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  },
  
  release: function() {
    if (this.queue.length > 0) {
      const nextResolve = this.queue.shift();
      nextResolve();
    } else {
      this.isLocked = false;
    }
  }
};

// Debug middleware for socket.io
io.use((socket, next) => {
  console.log('Socket attempting to connect:', socket.id);
  next();
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Send immediate acknowledgment
  socket.emit('connected', { id: socket.id });

  // Handle user joining the queue
  socket.on('findPartner', async (data) => {
    try {
      const { chatType } = data;
      await lock.acquire();

      console.log(`User ${socket.id} joining ${chatType} queue`);

      // Check if user is already in a chat
      if (activeConnections.has(socket.id)) {
        console.log(`User ${socket.id} is already in a chat`);
        lock.release();
        return;
      }

      // Check if there are any waiting users other than current user
      let partnerFound = false;
      for (const [waitingUserId, timestamp] of waitingUsers[chatType].entries()) {
        if (waitingUserId !== socket.id && io.sockets.sockets.has(waitingUserId)) {
          // Found a partner
          waitingUsers[chatType].delete(waitingUserId);
          
          // Set up the connection
          activeConnections.set(socket.id, { partnerId: waitingUserId, chatType });
          activeConnections.set(waitingUserId, { partnerId: socket.id, chatType });
          
          console.log(`Matched users: ${socket.id} and ${waitingUserId}`);
          
          // Notify both users
          io.to(socket.id).emit('partnerFound', { partnerId: waitingUserId, chatType });
          io.to(waitingUserId).emit('partnerFound', { partnerId: socket.id, chatType });
          
          partnerFound = true;
          break;
        }
      }

      // If no partner found, add user to waiting queue
      if (!partnerFound) {
        waitingUsers[chatType].set(socket.id, Date.now());
        socket.emit('waiting');
      }

    } catch (error) {
      console.error('Error in findPartner:', error);
      socket.emit('error', { message: 'Failed to find partner' });
    } finally {
      lock.release();
    }
  });

  // Handle text messages
  socket.on('message', (data) => {
    const { partnerId, message } = data;
    const connection = activeConnections.get(socket.id);
    
    // Verify the connection exists and partnerId matches
    if (connection && connection.partnerId === partnerId) {
      console.log(`Message from ${socket.id} to ${partnerId}`);
      io.to(partnerId).emit('message', { message, senderId: socket.id });
    }
  });

  // Handle WebRTC signaling
  socket.on('signal', (data) => {
    const { partnerId, signal } = data;
    const connection = activeConnections.get(socket.id);
    
    // Verify the connection exists and partnerId matches
    if (connection && connection.partnerId === partnerId) {
      console.log(`Signal from ${socket.id} to ${partnerId}`);
      io.to(partnerId).emit('signal', { signal, senderId: socket.id });
    }
  });

  // Handle next button
  socket.on('next', async (data) => {
    const { chatType } = data;
    console.log(`User ${socket.id} clicked next`);
    
    await cleanupUserConnections(socket.id, true);
    
    // Add user back to queue with new timestamp
    await lock.acquire();
    try {
      waitingUsers[chatType].set(socket.id, Date.now());
    } finally {
      lock.release();
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    await cleanupUserConnections(socket.id, true);
  });

  // Add error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Error handling for the server
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Helper function to clean up user connections
const cleanupUserConnections = async (userId, emitEvent = true) => {
  await lock.acquire();
  try {
    // Remove from all queues
    Object.values(waitingUsers).forEach(queue => queue.delete(userId));
    
    // Handle active connection
    const connection = activeConnections.get(userId);
    if (connection) {
      const { partnerId, chatType } = connection;
      
      // Notify partner if needed
      if (emitEvent) {
        console.log(`Notifying partner ${partnerId} about disconnect`);
        io.to(partnerId).emit('partnerLeft');
      }
      
      // Clean up connections
      activeConnections.delete(userId);
      activeConnections.delete(partnerId);
      
      // Check if partner is still connected
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket && emitEvent) {
        waitingUsers[chatType].set(partnerId, Date.now());
      }
    }
  } finally {
    lock.release();
  }
};

// Periodic cleanup of stale connections (every 5 minutes)
setInterval(async () => {
  await lock.acquire();
  try {
    const now = Date.now();
    for (const queue of Object.values(waitingUsers)) {
      for (const [userId, timestamp] of queue.entries()) {
        if (now - timestamp > 5 * 60 * 1000) { // 5 minutes
          queue.delete(userId);
        }
      }
    }
  } finally {
    lock.release();
  }
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 