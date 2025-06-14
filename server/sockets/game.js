import { redis } from '../index.js';

export function setupGameSocket(namespace) {
  namespace.on('connection', (socket) => {
    const user = socket.user.user;
    console.log(`User ${user} connected to game`);

    // Handle badge earned notifications
    socket.on('badge_earned', async (data) => {
      try {
        const { badge } = data;
        
        // Broadcast badge achievement
        namespace.emit('user_badge_earned', {
          user,
          badge,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error handling badge earned:', error);
      }
    });

    // Handle points updates
    socket.on('points_update', async () => {
      try {
        const points = await redis.zscore('points', user) || 0;
        socket.emit('points_updated', { points: parseInt(points) });
      } catch (error) {
        console.error('Error handling points update:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${user} disconnected from game`);
    });
  });
}