import { memoryStore } from '../index.js';

// Mock Shake model for in-memory storage
const Shake = {
  async save(shakeData) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const shake = {
      ...shakeData,
      _id: id,
      createdAt: new Date()
    };
    memoryStore.shakes.set(id, shake);
    return shake;
  }
};

export function setupShakeSocket(namespace) {
  namespace.on('connection', (socket) => {
    const user = socket.user.user;
    console.log(`User ${user} connected to shake`);

    socket.on('shake', async (data) => {
      try {
        const { location } = data;
        
        // Save shake to database
        const shakeData = {
          user,
          location,
          deviceInfo: data.deviceInfo || ''
        };
        
        const shake = await Shake.save(shakeData);
        
        // Broadcast shake to all other users
        socket.broadcast.emit('user_shake', {
          user,
          timestamp: shake.createdAt,
          location: location || null
        });
        
        // Send shake confirmation back to user
        socket.emit('shake_confirmed', {
          timestamp: shake.createdAt
        });
        
      } catch (error) {
        console.error('Error handling shake:', error);
        socket.emit('error', { message: 'Failed to process shake' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${user} disconnected from shake`);
    });
  });
}