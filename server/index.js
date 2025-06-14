import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import gamificationRoutes from './routes/gamification.js';
import redPacketRoutes from './routes/redpacket.js';
import { authenticateSocket, authenticateJWT } from './middleware/auth.js';
import { setupChatSocket } from './sockets/chat.js';
import { setupShakeSocket } from './sockets/shake.js';
import { setupGameSocket } from './sockets/game.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// In-memory storage for WebContainer compatibility
export const memoryStore = {
  users: new Map(),
  messages: new Map(),
  redPackets: new Map(),
  shakes: new Map(),
  steps: new Map(),
  points: new Map()
};

// Mock Redis interface for compatibility
export const redis = {
  async zincrby(key, increment, member) {
    if (!memoryStore.points.has(member)) {
      memoryStore.points.set(member, 0);
    }
    const currentScore = memoryStore.points.get(member);
    const newScore = currentScore + increment;
    memoryStore.points.set(member, newScore);
    return newScore;
  },
  
  async zscore(key, member) {
    return memoryStore.points.get(member) || 0;
  },
  
  async zrevrange(key, start, stop, withScores = false) {
    const entries = Array.from(memoryStore.points.entries());
    entries.sort((a, b) => b[1] - a[1]);
    const slice = entries.slice(start, stop + 1);
    
    if (withScores) {
      return slice.flat();
    }
    return slice.map(entry => entry[0]);
  },
  
  async set(key, value, ex) {
    // Simple key-value storage
    if (!memoryStore.cache) memoryStore.cache = new Map();
    memoryStore.cache.set(key, value);
    if (ex) {
      setTimeout(() => {
        memoryStore.cache.delete(key);
      }, ex * 1000);
    }
    return 'OK';
  },
  
  async get(key) {
    if (!memoryStore.cache) memoryStore.cache = new Map();
    return memoryStore.cache.get(key) || null;
  },
  
  async del(key) {
    if (!memoryStore.cache) memoryStore.cache = new Map();
    return memoryStore.cache.delete(key) ? 1 : 0;
  }
};

console.log('Using in-memory storage for WebContainer compatibility');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', authenticateJWT, chatRoutes);
app.use('/api/game', authenticateJWT, gamificationRoutes);
app.use('/api/redpacket', authenticateJWT, redPacketRoutes);

// Socket.IO middleware and namespaces
io.use(authenticateSocket);

// Chat namespace
const chatNamespace = io.of('/chat');
chatNamespace.use(authenticateSocket);
setupChatSocket(chatNamespace);

// Shake namespace
const shakeNamespace = io.of('/shake');
shakeNamespace.use(authenticateSocket);
setupShakeSocket(shakeNamespace);

// Game namespace
const gameNamespace = io.of('/game');
gameNamespace.use(authenticateSocket);
setupGameSocket(gameNamespace);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };