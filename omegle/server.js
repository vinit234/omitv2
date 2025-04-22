// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: "https://omitv2.onrender.com",
//     methods: ["GET", "POST"]
//   }
// });

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Store connected users and their chat types
// const waitingUsers = {
//   text: new Set(),
//   video: new Set()
// };

// // Store active connections
// const activeConnections = new Map();

// // Socket.IO connection handling
// io.on('connection', (socket) => {
//   console.log('New user connected:', socket.id);

//   // Handle user joining the queue
//   socket.on('findPartner', (data) => {
//     const { chatType } = data;
//     console.log(`User ${socket.id} attempting to join ${chatType} queue`);
  
//     // If user is already connected or in queue, do nothing
//     if (activeConnections.has(socket.id)) {
//       console.log(`User ${socket.id} is already in an active connection.`);
//       return;
//     }
  
//     if (waitingUsers[chatType].has(socket.id)) {
//       console.log(`User ${socket.id} is already in the ${chatType} queue.`);
//       return;
//     }
  
//     // Add user to the queue
//     waitingUsers[chatType].add(socket.id);
//     console.log(`User ${socket.id} added to ${chatType} queue`);
  
//     // Try to find a partner
//     const users = Array.from(waitingUsers[chatType]);
//     const availablePartner = users.find(id => id !== socket.id && !activeConnections.has(id));
  
//     if (availablePartner) {
//       // Remove both users from the queue
//       waitingUsers[chatType].delete(socket.id);
//       waitingUsers[chatType].delete(availablePartner);
  
//       // Store the connection
//       activeConnections.set(socket.id, { partnerId: availablePartner, chatType });
//       activeConnections.set(availablePartner, { partnerId: socket.id, chatType });
  
//       console.log(`Matched users: ${socket.id} and ${availablePartner}`);
  
//       // Notify both users
//       io.to(socket.id).emit('partnerFound', { partnerId: availablePartner, chatType });
//       io.to(availablePartner).emit('partnerFound', { partnerId: socket.id, chatType });
//     }
//   });
  
//   // Handle text messages
//   socket.on('message', (data) => {
//     const { partnerId, message } = data;
//     console.log(`Message from ${socket.id} to ${partnerId}`);
//     io.to(partnerId).emit('message', { message, senderId: socket.id });
//   });

//   // Handle WebRTC signaling
//   socket.on('signal', (data) => {
//     const { partnerId, signal } = data;
//     console.log(`Signal from ${socket.id} to ${partnerId}`);
//     io.to(partnerId).emit('signal', { signal, senderId: socket.id });
//   });

//   // Handle next button
//   socket.on('next', (data) => {
//     const { chatType } = data;
//     console.log(`User ${socket.id} clicked next`);
    
//     const connection = activeConnections.get(socket.id);
//     if (connection) {
//       const { partnerId } = connection;
//       console.log(`Notifying partner ${partnerId} about disconnect`);
//       io.to(partnerId).emit('partnerLeft');
      
//       // Add user back to queue
//       waitingUsers[chatType].add(socket.id);
      
//       // Clean up connections
//       activeConnections.delete(socket.id);
//       activeConnections.delete(partnerId);
//     }
//   });

//   // Handle disconnection
//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
    
//     // Remove from all queues
//     Object.values(waitingUsers).forEach(queue => queue.delete(socket.id));
    
//     // Handle active connection
//     const connection = activeConnections.get(socket.id);
//     if (connection) {
//       const { partnerId, chatType } = connection;
//       console.log(`Notifying partner ${partnerId} about disconnect`);
//       io.to(partnerId).emit('partnerLeft');
      
//       // Add partner back to queue
//       waitingUsers[chatType].add(partnerId);
      
//       // Clean up connections
//       activeConnections.delete(socket.id);
//       activeConnections.delete(partnerId);
//     }
//   });
// });

// const PORT = process.env.PORT || 5001;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// }); 
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: "https://omitv2.onrender.com",
//     methods: ["GET", "POST"]
//   }
// });

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Store users waiting for text or video chat
// const waitingUsers = {
//   text: new Set(),
//   video: new Set()
// };

// // Store currently active pairs
// const activeConnections = new Map();

// // Function to find and match a partner
// function matchPartner(socket, chatType) {
//   const users = Array.from(waitingUsers[chatType]);
//   const availablePartner = users.find(id => id !== socket.id && !activeConnections.has(id));

//   if (availablePartner) {
//     // Remove from waiting queue
//     waitingUsers[chatType].delete(socket.id);
//     waitingUsers[chatType].delete(availablePartner);

//     // Save active connection
//     activeConnections.set(socket.id, { partnerId: availablePartner, chatType });
//     activeConnections.set(availablePartner, { partnerId: socket.id, chatType });

//     // Notify both
//     io.to(socket.id).emit('partnerFound', { partnerId: availablePartner, chatType });
//     io.to(availablePartner).emit('partnerFound', { partnerId: socket.id, chatType });

//     console.log(`Matched users: ${socket.id} <--> ${availablePartner}`);
//   }
// }

// // Socket.IO logic
// io.on('connection', (socket) => {
//   console.log('New user connected:', socket.id);

//   socket.on('findPartner', ({ chatType }) => {
//     if (activeConnections.has(socket.id) || waitingUsers[chatType].has(socket.id)) return;
//     waitingUsers[chatType].add(socket.id);
//     matchPartner(socket, chatType);
//   });

//   socket.on('message', ({ partnerId, message }) => {
//     io.to(partnerId).emit('message', { message, senderId: socket.id });
//   });

//   socket.on('signal', ({ partnerId, signal }) => {
//     io.to(partnerId).emit('signal', { signal, senderId: socket.id });
//   });

//   socket.on('next', ({ chatType }) => {
//     console.log(`User ${socket.id} clicked next`);
//     const connection = activeConnections.get(socket.id);
//     if (connection) {
//       const { partnerId } = connection;

//       // Notify partner
//       io.to(partnerId).emit('partnerLeft');

//       // Clean up
//       activeConnections.delete(socket.id);
//       activeConnections.delete(partnerId);

//       // Add both back to queue
//       waitingUsers[chatType].add(socket.id);
//       waitingUsers[chatType].add(partnerId);

//       // Attempt to re-match both
//       matchPartner(socket, chatType);
//       const partnerSocket = io.sockets.sockets.get(partnerId);
//       if (partnerSocket) matchPartner(partnerSocket, chatType);
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);

//     // Remove from queues
//     Object.values(waitingUsers).forEach(queue => queue.delete(socket.id));

//     const connection = activeConnections.get(socket.id);
//     if (connection) {
//       const { partnerId, chatType } = connection;

//       io.to(partnerId).emit('partnerLeft');

//       // Clean up and add partner back to queue
//       activeConnections.delete(socket.id);
//       activeConnections.delete(partnerId);
//       waitingUsers[chatType].add(partnerId);

//       const partnerSocket = io.sockets.sockets.get(partnerId);
//       if (partnerSocket) matchPartner(partnerSocket, chatType);
//     }
//   });
// });

// const PORT = process.env.PORT || 5001;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
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

// Queue implementation for better connection management
class ConnectionQueue {
  constructor() {
    this.textQueue = [];
    this.videoQueue = [];
    this.activeConnections = new Map();
    this.connectionTimeout = new Map();
    this.nextCooldown = new Map(); // Track cooldown for next button
  }

  // Add user to appropriate queue with randomization
  addToQueue(socketId, chatType) {
    try {
      const queue = chatType === 'text' ? this.textQueue : this.videoQueue;
      
      // Only add if not already in queue or active connection
      if (!queue.includes(socketId) && !this.activeConnections.has(socketId)) {
        // Add at random position for more randomized matching
        const position = Math.floor(Math.random() * (queue.length + 1));
        queue.splice(position, 0, socketId);
        console.log(`Added ${socketId} to ${chatType} queue at position ${position}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error adding to queue: ${error.message}`);
      return false;
    }
  }

  // Remove user from queues
  removeFromQueues(socketId) {
    try {
      this.textQueue = this.textQueue.filter(id => id !== socketId);
      this.videoQueue = this.videoQueue.filter(id => id !== socketId);
    } catch (error) {
      console.error(`Error removing from queues: ${error.message}`);
    }
  }

  // Find and connect partners
  processQueue(chatType, io) {
    try {
      const queue = chatType === 'text' ? this.textQueue : this.videoQueue;
      
      // Process queue in batches of 2
      while (queue.length >= 2) {
        const user1 = queue.shift();
        const user2 = queue.shift();
        
        // Check if both users are still connected
        const socket1 = io.sockets.sockets.get(user1);
        const socket2 = io.sockets.sockets.get(user2);
        
        if (!socket1 || !socket2) {
          // Put back valid socket if the other is disconnected
          if (socket1) queue.unshift(user1);
          if (socket2) queue.unshift(user2);
          continue;
        }
        
        // Create connection
        this.createConnection(user1, user2, chatType, io);
      }
    } catch (error) {
      console.error(`Error processing queue: ${error.message}`);
    }
  }
  
  // Create connection between two users
  createConnection(user1Id, user2Id, chatType, io) {
    try {
      // Register active connection
      this.activeConnections.set(user1Id, { partnerId: user2Id, chatType });
      this.activeConnections.set(user2Id, { partnerId: user1Id, chatType });
      
      // Notify both users with small delay for video setup
      setTimeout(() => {
        io.to(user1Id).emit('partnerFound', { partnerId: user2Id, chatType });
      }, 200);
      
      setTimeout(() => {
        io.to(user2Id).emit('partnerFound', { partnerId: user1Id, chatType });
      }, 200);
      
      console.log(`Matched users: ${user1Id} <--> ${user2Id} (${chatType})`);
      
      // Clear any existing timeouts
      if (this.connectionTimeout.has(user1Id)) {
        clearTimeout(this.connectionTimeout.get(user1Id));
        this.connectionTimeout.delete(user1Id);
      }
      if (this.connectionTimeout.has(user2Id)) {
        clearTimeout(this.connectionTimeout.get(user2Id));
        this.connectionTimeout.delete(user2Id);
      }
    } catch (error) {
      console.error(`Error creating connection: ${error.message}`);
    }
  }
  
  // Handle user clicking "next"
  handleNext(socketId, chatType, io) {
    try {
      // Check for cooldown to prevent spam
      if (this.nextCooldown.has(socketId)) {
        io.to(socketId).emit('error', { message: 'Please wait before clicking next again' });
        return false;
      }
      
      const connection = this.activeConnections.get(socketId);
      if (!connection) return false;
      
      const { partnerId } = connection;
      
      // Notify partner that user left
      io.to(partnerId).emit('partnerLeft');
      
      // Clean up connections
      this.activeConnections.delete(socketId);
      this.activeConnections.delete(partnerId);
      
      // Set cooldown for next button (1.5 seconds)
      this.nextCooldown.set(socketId, true);
      setTimeout(() => {
        this.nextCooldown.delete(socketId);
      }, 1500);
      
      // Add both back to queue with delay to ensure camera has time to reset
      setTimeout(() => {
        this.addToQueue(socketId, chatType);
        this.addToQueue(partnerId, chatType);
        this.processQueue(chatType, io);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error(`Error handling next: ${error.message}`);
      return false;
    }
  }
  
  // Handle disconnection
  handleDisconnect(socketId, io) {
    try {
      // Remove from queues
      this.removeFromQueues(socketId);
      
      // Check if user was in an active connection
      const connection = this.activeConnections.get(socketId);
      if (connection) {
        const { partnerId, chatType } = connection;
        
        // Notify partner
        io.to(partnerId).emit('partnerLeft');
        
        // Clean up
        this.activeConnections.delete(socketId);
        this.activeConnections.delete(partnerId);
        
        // Add partner back to queue with delay
        setTimeout(() => {
          this.addToQueue(partnerId, chatType);
          this.processQueue(chatType, io);
        }, 1000);
      }
      
      // Clean up timeouts
      if (this.connectionTimeout.has(socketId)) {
        clearTimeout(this.connectionTimeout.get(socketId));
        this.connectionTimeout.delete(socketId);
      }
      
      if (this.nextCooldown.has(socketId)) {
        this.nextCooldown.delete(socketId);
      }
    } catch (error) {
      console.error(`Error handling disconnect: ${error.message}`);
    }
  }
  
  // Get queue statistics
  getStats() {
    return {
      textQueueSize: this.textQueue.length,
      videoQueueSize: this.videoQueue.length,
      activeConnections: this.activeConnections.size / 2 // Each connection counts twice
    };
  }
}

// Create queue instance
const connectionManager = new ConnectionQueue();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Simple status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    ...connectionManager.getStats()
  });
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);
  
  // Handle errors for this socket
  socket.on('error', (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });
  
  socket.on('findPartner', ({ chatType }) => {
    try {
      if (!['text', 'video'].includes(chatType)) {
        socket.emit('error', { message: 'Invalid chat type' });
        return;
      }
      
      connectionManager.removeFromQueues(socket.id); // Remove from any existing queues
      const added = connectionManager.addToQueue(socket.id, chatType);
      
      if (added) {
        socket.emit('queueStatus', { status: 'searching' });
        
        // Set connection timeout (30 seconds)
        const timeout = setTimeout(() => {
          socket.emit('queueStatus', { status: 'timeout' });
          connectionManager.removeFromQueues(socket.id);
        }, 30000);
        
        connectionManager.connectionTimeout.set(socket.id, timeout);
        
        // Process queue after adding new user
        connectionManager.processQueue(chatType, io);
      }
    } catch (error) {
      console.error(`Error finding partner: ${error.message}`);
      socket.emit('error', { message: 'Error finding partner' });
    }
  });
  
  socket.on('message', ({ partnerId, message }) => {
    try {
      const connection = connectionManager.activeConnections.get(socket.id);
      
      // Validate the partnership
      if (connection && connection.partnerId === partnerId) {
        io.to(partnerId).emit('message', { 
          message, 
          senderId: socket.id 
        });
      } else {
        socket.emit('error', { message: 'Invalid partner' });
      }
    } catch (error) {
      console.error(`Error sending message: ${error.message}`);
      socket.emit('error', { message: 'Error sending message' });
    }
  });
  
  socket.on('signal', ({ partnerId, signal }) => {
    try {
      const connection = connectionManager.activeConnections.get(socket.id);
      
      // Validate the partnership
      if (connection && connection.partnerId === partnerId) {
        io.to(partnerId).emit('signal', { 
          signal, 
          senderId: socket.id 
        });
      } else {
        socket.emit('error', { message: 'Invalid partner for signaling' });
      }
    } catch (error) {
      console.error(`Error sending signal: ${error.message}`);
      socket.emit('error', { message: 'Error with WebRTC signaling' });
    }
  });
  
  socket.on('next', ({ chatType }) => {
    try {
      connectionManager.handleNext(socket.id, chatType, io);
    } catch (error) {
      console.error(`Error with next button: ${error.message}`);
      socket.emit('error', { message: 'Error finding next partner' });
    }
  });
  
  socket.on('disconnect', () => {
    try {
      console.log('User disconnected:', socket.id);
      connectionManager.handleDisconnect(socket.id, io);
    } catch (error) {
      console.error(`Error handling disconnect: ${error.message}`);
    }
  });
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});