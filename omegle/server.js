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

// Store users waiting for text or video chat
const waitingUsers = {
  text: new Set(),
  video: new Set()
};

// Store currently active pairs with timestamps
const activeConnections = new Map();

// Matching timeout (in milliseconds)
const MATCHING_TIMEOUT = 5000;
const CONNECTION_HEARTBEAT = 30000;

// Function to find and match a partner
function matchPartner(socket, chatType) {
  // Don't match if already in an active connection
  if (activeConnections.has(socket.id)) {
    return false;
  }

  const users = Array.from(waitingUsers[chatType]);
  
  // Filter out disconnected sockets and the current user
  const availablePartners = users.filter(id => {
    // Check if user is still connected to socket
    const partnerSocket = io.sockets.sockets.get(id);
    return id !== socket.id && 
           partnerSocket && 
           !activeConnections.has(id);
  });

  if (availablePartners.length === 0) {
    return false;
  }

  // Pick a random partner to avoid always matching the same pairs
  const randomIndex = Math.floor(Math.random() * availablePartners.length);
  const availablePartner = availablePartners[randomIndex];

  // Remove from waiting queue
  waitingUsers[chatType].delete(socket.id);
  waitingUsers[chatType].delete(availablePartner);

  // Save active connection with timestamp
  const connectionData = {
    partnerId: availablePartner,
    chatType,
    timestamp: Date.now(),
    lastActivity: Date.now()
  };
  
  const partnerConnectionData = {
    partnerId: socket.id,
    chatType,
    timestamp: Date.now(),
    lastActivity: Date.now()
  };
  
  activeConnections.set(socket.id, connectionData);
  activeConnections.set(availablePartner, partnerConnectionData);

  // Notify both
  io.to(socket.id).emit('partnerFound', { partnerId: availablePartner, chatType });
  io.to(availablePartner).emit('partnerFound', { partnerId: socket.id, chatType });

  console.log(`Matched users: ${socket.id} <--> ${availablePartner}`);
  return true;
}

// Function to check if a socket is still valid
function isSocketValid(socketId) {
  const socket = io.sockets.sockets.get(socketId);
  return !!socket;
}

// Periodically clean up stale connections
setInterval(() => {
  const now = Date.now();
  
  // Clean up stale active connections
  for (const [socketId, connection] of activeConnections.entries()) {
    // If connection is over 2 minutes old with no activity, or socket is invalid
    if (!isSocketValid(socketId) || 
        !isSocketValid(connection.partnerId) ||
        now - connection.lastActivity > CONNECTION_HEARTBEAT) {
      
      console.log(`Cleaning up stale connection: ${socketId} <--> ${connection.partnerId}`);
      
      // Notify partner if they're still connected
      if (isSocketValid(connection.partnerId)) {
        io.to(connection.partnerId).emit('partnerLeft');
        // Remove partner's connection too
        activeConnections.delete(connection.partnerId);
      }
      
      activeConnections.delete(socketId);
    }
  }
  
  // Clean up waiting users who are no longer connected
  for (const chatType in waitingUsers) {
    for (const userId of waitingUsers[chatType]) {
      if (!isSocketValid(userId)) {
        waitingUsers[chatType].delete(userId);
        console.log(`Removed disconnected user from waiting queue: ${userId}`);
      }
    }
  }
}, 10000);

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);
  
  // Handle heartbeat to keep track of active connections
  socket.on('heartbeat', () => {
    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  });

  socket.on('findPartner', ({ chatType }) => {
    console.log(`User ${socket.id} searching for ${chatType} partner`);
    
    // Clean up any existing connections first
    cleanupUserConnections(socket.id);
    
    // Don't add twice
    if (waitingUsers[chatType].has(socket.id)) {
      return;
    }
    
    // Add to waiting queue
    waitingUsers[chatType].add(socket.id);
    
    // Try immediate matching
    const matched = matchPartner(socket, chatType);
    
    // If not matched immediately, set a timeout to try again
    if (!matched) {
      setTimeout(() => {
        // If still waiting, try matching again
        if (waitingUsers[chatType].has(socket.id) && !activeConnections.has(socket.id)) {
          console.log(`Retrying match for user ${socket.id}`);
          matchPartner(socket, chatType);
        }
      }, MATCHING_TIMEOUT);
    }
  });

  socket.on('message', ({ partnerId, message }) => {
    const connection = activeConnections.get(socket.id);
    
    // Only forward if connection is valid and to the correct partner
    if (connection && connection.partnerId === partnerId) {
      connection.lastActivity = Date.now();
      io.to(partnerId).emit('message', { message, senderId: socket.id });
      
      // Update partner's activity timestamp too
      const partnerConnection = activeConnections.get(partnerId);
      if (partnerConnection) {
        partnerConnection.lastActivity = Date.now();
      }
    }
  });

  socket.on('signal', ({ partnerId, signal }) => {
    const connection = activeConnections.get(socket.id);
    
    // Only forward if connection is valid and to the correct partner
    if (connection && connection.partnerId === partnerId) {
      connection.lastActivity = Date.now();
      io.to(partnerId).emit('signal', { signal, senderId: socket.id });
      
      // Update partner's activity timestamp too
      const partnerConnection = activeConnections.get(partnerId);
      if (partnerConnection) {
        partnerConnection.lastActivity = Date.now();
      }
    }
  });

  socket.on('next', ({ chatType }) => {
    console.log(`User ${socket.id} clicked next`);
    
    // Get current connection
    const connection = activeConnections.get(socket.id);
    if (!connection) {
      // If no connection, just search for a new partner
      socket.emit('readyForNext');
      socket.emit('findPartner', { chatType });
      return;
    }
    
    const { partnerId } = connection;
    
    // Notify partner they'll need to find someone new
    if (isSocketValid(partnerId)) {
      io.to(partnerId).emit('partnerLeft');
    }
    
    // Clean up the connections
    activeConnections.delete(socket.id);
    activeConnections.delete(partnerId);
    
    // For the user who clicked next, immediately try to find new partner
    waitingUsers[chatType].add(socket.id);
    socket.emit('readyForNext');
    matchPartner(socket, chatType);
    
    // For the partner, only add back to queue if they're still connected
    if (isSocketValid(partnerId)) {
      waitingUsers[chatType].add(partnerId);
      
      // Let the partner know they can look for a new match
      io.to(partnerId).emit('readyForNext');
      
      // Get partner's socket and try to match them
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        setTimeout(() => {
          if (waitingUsers[chatType].has(partnerId) && !activeConnections.has(partnerId)) {
            matchPartner(partnerSocket, chatType);
          }
        }, 1000); // Small delay to ensure resources are freed
      }
    }
  });

  // Helper function to clean up a user's connections
  function cleanupUserConnections(userId) {
    // Remove from any waiting queues
    Object.values(waitingUsers).forEach(queue => queue.delete(userId));
    
    // Check if user has an active connection
    const connection = activeConnections.get(userId);
    if (connection) {
      const { partnerId, chatType } = connection;
      
      // Notify partner
      if (isSocketValid(partnerId)) {
        io.to(partnerId).emit('partnerLeft');
      }
      
      // Clean up both connections
      activeConnections.delete(userId);
      activeConnections.delete(partnerId);
    }
  }

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from waiting queues
    Object.values(waitingUsers).forEach(queue => queue.delete(socket.id));
    
    // Handle active connection
    const connection = activeConnections.get(socket.id);
    if (connection) {
      const { partnerId, chatType } = connection;
      
      // Notify partner
      if (isSocketValid(partnerId)) {
        io.to(partnerId).emit('partnerLeft');
        
        // Add partner back to waiting queue if they want to find someone new
        waitingUsers[chatType].add(partnerId);
        io.to(partnerId).emit('readyForNext');
        
        // Try to match partner with someone else
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          setTimeout(() => {
            if (waitingUsers[chatType].has(partnerId) && !activeConnections.has(partnerId)) {
              matchPartner(partnerSocket, chatType);
            }
          }, 1000);
        }
      }
      
      // Remove both connections
      activeConnections.delete(socket.id);
      activeConnections.delete(partnerId);
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Route to check server status
app.get('/status', (req, res) => {
  const stats = {
    connections: activeConnections.size / 2, // Divide by 2 since each connection is stored twice
    waitingText: waitingUsers.text.size,
    waitingVideo: waitingUsers.video.size,
    uptime: process.uptime()
  };
  res.json(stats);
});