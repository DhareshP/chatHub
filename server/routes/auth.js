import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { redis, memoryStore } from '../index.js';

const router = express.Router();

// Mock User model for in-memory storage
const User = {
  async findOne(query) {
    for (const [id, user] of memoryStore.users) {
      if (query.$or) {
        const matches = query.$or.some(condition => {
          return Object.keys(condition).some(key => user[key] === condition[key]);
        });
        if (matches) return { ...user, _id: id };
      } else {
        const matches = Object.keys(query).every(key => user[key] === query[key]);
        if (matches) return { ...user, _id: id };
      }
    }
    return null;
  },
  
  async save(userData) {
    const id = Date.now().toString();
    const user = {
      ...userData,
      _id: id,
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
      points: 0,
      createdAt: new Date()
    };
    memoryStore.users.set(id, user);
    return user;
  }
};

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Stub authentication - hardcoded admin account
    if (username === 'admin' && password === 'admin') {
      const token = jwt.sign(
        { user: 'admin', id: 'admin' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      // Award login points
      await redis.zincrby('points', 10, 'admin');
      
      return res.json({
        token,
        user: {
          id: 'admin',
          username: 'admin',
          email: 'admin@wechat.com',
          avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
          points: await redis.zscore('points', 'admin') || 0
        }
      });
    }

    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // For demo purposes, we'll create a simple registration
    // In production, you'd want proper validation and password hashing
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userData = {
      username,
      email,
      password: hashedPassword
    };

    const user = await User.save(userData);

    const token = jwt.sign(
      { user: username, id: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        points: user.points
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;