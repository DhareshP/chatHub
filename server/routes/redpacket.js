import express from 'express';
import { redis, memoryStore } from '../index.js';

const router = express.Router();

// Mock RedPacket model for in-memory storage
const RedPacket = {
  async save(redPacketData) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const redPacket = {
      ...redPacketData,
      _id: id,
      createdAt: new Date(),
      claims: [],
      claimedCount: 0,
      status: 'active'
    };
    memoryStore.redPackets.set(id, redPacket);
    return redPacket;
  },
  
  async findById(id) {
    return memoryStore.redPackets.get(id) || null;
  },
  
  async updateById(id, updates) {
    const redPacket = memoryStore.redPackets.get(id);
    if (redPacket) {
      Object.assign(redPacket, updates);
      memoryStore.redPackets.set(id, redPacket);
      return redPacket;
    }
    return null;
  }
};

// Create red packet
router.post('/', async (req, res) => {
  try {
    const { roomId, totalAmount, count, message } = req.body;
    const sender = req.user.user;
    
    // Validate input
    if (!roomId || !totalAmount || !count || totalAmount <= 0 || count <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    // Generate random allocations
    const allocations = generateRandomAllocations(totalAmount, count);
    
    const redPacketData = {
      roomId,
      sender,
      totalAmount,
      count,
      allocations,
      message: message || 'Congratulations! Good luck!'
    };
    
    const redPacket = await RedPacket.save(redPacketData);
    
    res.json({
      id: redPacket._id,
      roomId,
      sender,
      totalAmount,
      count,
      message: redPacket.message,
      createdAt: redPacket.createdAt
    });
  } catch (error) {
    console.error('Error creating red packet:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Grab red packet
router.post('/:id/grab', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user.user;
    
    const redPacket = await RedPacket.findById(id);
    
    if (!redPacket) {
      return res.status(404).json({ error: 'Red packet not found' });
    }
    
    if (redPacket.status !== 'active') {
      return res.status(400).json({ error: 'Red packet is no longer active' });
    }
    
    // Check if user already claimed
    const alreadyClaimed = redPacket.claims.find(claim => claim.user === user);
    if (alreadyClaimed) {
      return res.status(400).json({ error: 'Already claimed' });
    }
    
    // Check if all packets are claimed
    if (redPacket.claimedCount >= redPacket.count) {
      await RedPacket.updateById(id, { status: 'completed' });
      return res.status(400).json({ error: 'All packets claimed' });
    }
    
    // Grab a packet
    const amount = redPacket.allocations[redPacket.claimedCount];
    redPacket.claims.push({ user, amount, claimedAt: new Date() });
    redPacket.claimedCount += 1;
    
    const updates = {
      claims: redPacket.claims,
      claimedCount: redPacket.claimedCount,
      status: redPacket.claimedCount >= redPacket.count ? 'completed' : 'active'
    };
    
    await RedPacket.updateById(id, updates);
    
    // Award points
    await redis.zincrby('points', Math.floor(amount * 10), user);
    
    res.json({
      amount,
      message: 'Congratulations!',
      totalClaimed: redPacket.claimedCount,
      totalCount: redPacket.count
    });
  } catch (error) {
    console.error('Error grabbing red packet:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get red packet details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const redPacket = await RedPacket.findById(id);
    
    if (!redPacket) {
      return res.status(404).json({ error: 'Red packet not found' });
    }
    
    res.json({
      id: redPacket._id,
      sender: redPacket.sender,
      totalAmount: redPacket.totalAmount,
      count: redPacket.count,
      claimedCount: redPacket.claimedCount,
      message: redPacket.message,
      claims: redPacket.claims,
      status: redPacket.status,
      createdAt: redPacket.createdAt
    });
  } catch (error) {
    console.error('Error fetching red packet:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to generate random allocations
function generateRandomAllocations(totalAmount, count) {
  const allocations = [];
  let remaining = totalAmount;
  
  for (let i = 0; i < count - 1; i++) {
    // Ensure minimum allocation and leave some for remaining packets
    const min = 0.01;
    const max = Math.min(remaining - (count - i - 1) * min, remaining * 0.8);
    const allocation = Math.random() * (max - min) + min;
    
    allocations.push(Math.round(allocation * 100) / 100);
    remaining -= allocation;
  }
  
  // Last allocation gets the remainder
  allocations.push(Math.round(remaining * 100) / 100);
  
  // Shuffle allocations
  for (let i = allocations.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allocations[i], allocations[j]] = [allocations[j], allocations[i]];
  }
  
  return allocations;
}

export default router;