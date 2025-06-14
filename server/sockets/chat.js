import { redis, memoryStore } from '../index.js';
import { checkKeywordTriggers } from '../utils/keywords.js';

// Mock Message model for in-memory storage
const Message = {
  async save(messageData) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const message = {
      ...messageData,
      _id: id,
      createdAt: new Date()
    };
    memoryStore.messages.set(id, message);
    return message;
  }
};

export function setupChatSocket(namespace) {
  const connectedUsers = new Map();

  namespace.on('connection', (socket) => {
    const user = socket.user.user;
    console.log(`User ${user} connected to chat`);
    
    connectedUsers.set(user, socket.id);

    // Join room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      socket.currentRoom = roomId;
      console.log(`User ${user} joined room ${roomId}`);
    });

    // Handle messages
    socket.on('message', async (data) => {
      try {
        const { roomId, text, type = 'text' } = data;
        
        // Save message to database
        const messageData = {
          roomId,
          sender: user,
          text,
          type
        };
        
        const message = await Message.save(messageData);
        
        // Award points for messaging
        await redis.zincrby('points', 1, user);
        
        // Check for keyword triggers
        const triggers = checkKeywordTriggers(text);
        
        const messageResponse = {
          id: message._id,
          roomId,
          sender: user,
          text,
          type,
          createdAt: message.createdAt,
          triggers
        };
        
        // Broadcast to room
        namespace.to(roomId).emit('message', messageResponse);
        
        // If there are animation triggers, broadcast them
        if (triggers.length > 0) {
          namespace.to(roomId).emit('animation', {
            roomId,
            animations: triggers,
            sender: user
          });
        }
        
      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('user_typing', {
        user,
        roomId: data.roomId
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(data.roomId).emit('user_stop_typing', {
        user,
        roomId: data.roomId
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${user} disconnected from chat`);
      connectedUsers.delete(user);
    });
  });
}