import express from 'express';
import { memoryStore } from '../index.js';

const router = express.Router();

// Mock Message model for in-memory storage
const Message = {
  async find(query) {
    const messages = Array.from(memoryStore.messages.values())
      .filter(msg => msg.roomId === query.roomId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return messages;
  },
  
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

// Get chat history
router.get('/rooms/:roomId/history', async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await Message.find({ roomId });
    const limitedMessages = messages.slice(-limit);
    
    res.json(limitedMessages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new room
router.post('/rooms', async (req, res) => {
  try {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({ roomId, name: req.body.name || `Room ${roomId}` });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available rooms (for demo)
router.get('/rooms', async (req, res) => {
  try {
    // In a real app, you'd have a rooms collection
    const defaultRooms = [
      { id: 'general', name: 'General', description: 'General chat for everyone' },
      { id: 'gaming', name: 'Gaming', description: 'Gaming discussions' },
      { id: 'random', name: 'Random', description: 'Random conversations' }
    ];
    
    res.json(defaultRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;