import express from 'express';
import { redis, memoryStore } from '../index.js';

const router = express.Router();

// Mock Steps model for in-memory storage
const Steps = {
  async findOneAndUpdate(query, update, options) {
    const key = `${query.user}-${query.date}`;
    const existing = memoryStore.steps.get(key);
    
    if (existing) {
      existing.count = update.count;
      memoryStore.steps.set(key, existing);
      return existing;
    } else if (options.upsert) {
      const newStep = {
        ...query,
        ...update,
        _id: key,
        createdAt: new Date()
      };
      memoryStore.steps.set(key, newStep);
      return newStep;
    }
    
    return null;
  }
};

// Get leaderboard
router.get('/leaderboard/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { scope = 'global', date } = req.query;
    
    let key, data;
    
    switch (type) {
      case 'points':
        key = 'points';
        data = await redis.zrevrange(key, 0, 9, 'WITHSCORES');
        break;
      case 'steps':
        key = `steps:${date || new Date().toISOString().split('T')[0]}`;
        data = await redis.zrevrange(key, 0, 9, 'WITHSCORES');
        break;
      default:
        return res.status(400).json({ error: 'Invalid leaderboard type' });
    }
    
    // Format the data
    const leaderboard = [];
    for (let i = 0; i < data.length; i += 2) {
      leaderboard.push({
        user: data[i],
        score: parseInt(data[i + 1]),
        rank: Math.floor(i / 2) + 1
      });
    }
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit steps
router.post('/steps', async (req, res) => {
  try {
    const { count, date = new Date().toISOString().split('T')[0] } = req.body;
    const user = req.user.user;
    
    // Update database
    await Steps.findOneAndUpdate(
      { user, date },
      { count },
      { upsert: true, new: true }
    );
    
    // Update Redis leaderboard
    await redis.zincrby(`steps:${date}`, count, user);
    
    // Award milestone points
    const milestones = [1000, 5000, 10000, 20000];
    const currentSteps = await redis.zscore(`steps:${date}`, user) || 0;
    
    for (const milestone of milestones) {
      if (currentSteps >= milestone && (currentSteps - count) < milestone) {
        await redis.zincrby('points', 50, user);
        // Could emit badge here
      }
    }
    
    res.json({ success: true, totalSteps: currentSteps });
  } catch (error) {
    console.error('Error submitting steps:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user stats
router.get('/stats', async (req, res) => {
  try {
    const user = req.user.user;
    const today = new Date().toISOString().split('T')[0];
    
    const points = await redis.zscore('points', user) || 0;
    const todaySteps = await redis.zscore(`steps:${today}`, user) || 0;
    
    // Get user rank in points
    const pointsRank = await redis.zrevrank('points', user);
    const stepsRank = await redis.zrevrank(`steps:${today}`, user);
    
    res.json({
      points: parseInt(points),
      todaySteps: parseInt(todaySteps),
      pointsRank: pointsRank !== null ? pointsRank + 1 : null,
      stepsRank: stepsRank !== null ? stepsRank + 1 : null
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;