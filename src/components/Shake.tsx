import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, MapPin } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

interface ShakeEvent {
  user: string;
  timestamp: string;
  location?: { latitude: number; longitude: number };
}

export default function Shake() {
  const [isShaking, setIsShaking] = useState(false);
  const [recentShakes, setRecentShakes] = useState<ShakeEvent[]>([]);
  const [shakeCount, setShakeCount] = useState(0);
  
  const { shakeSocket, connected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!shakeSocket) return;

    shakeSocket.on('user_shake', (data: ShakeEvent) => {
      setRecentShakes(prev => [data, ...prev.slice(0, 9)]);
    });

    shakeSocket.on('shake_confirmed', () => {
      setShakeCount(prev => prev + 1);
    });

    return () => {
      shakeSocket.off('user_shake');
      shakeSocket.off('shake_confirmed');
    };
  }, [shakeSocket]);

  const handleShake = () => {
    if (!shakeSocket || !connected || isShaking) return;

    setIsShaking(true);
    
    // Get location if available
    navigator.geolocation.getCurrentPosition(
      (position) => {
        shakeSocket.emit('shake', {
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          deviceInfo: navigator.userAgent
        });
      },
      () => {
        // If location fails, shake without location
        shakeSocket.emit('shake', {
          deviceInfo: navigator.userAgent
        });
      }
    );

    // Reset shake animation
    setTimeout(() => setIsShaking(false), 1000);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4"
        >
          <Zap className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Shake</h1>
        <p className="text-gray-600">Shake your phone to discover nearby friends</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Online Users</p>
          <p className="text-2xl font-bold text-gray-900">{recentShakes.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <Zap className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">My Shakes</p>
          <p className="text-2xl font-bold text-gray-900">{shakeCount}</p>
        </div>
      </div>

      {/* Shake Button */}
      <div className="flex justify-center mb-8">
        <motion.button
          onClick={handleShake}
          disabled={!connected || isShaking}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={isShaking ? { 
            x: [-10, 10, -10, 10, 0],
            transition: { duration: 0.5, repeat: 1 }
          } : {}}
          className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-lg disabled:opacity-50 transition-all"
        >
          {isShaking ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-12 h-12" />
            </motion.div>
          ) : (
            'SHAKE'
          )}
        </motion.button>
      </div>

      {/* Recent Shakes */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Shakes</h3>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <AnimatePresence>
            {recentShakes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No one has shaken yet</p>
                <p className="text-sm">Be the first!</p>
              </div>
            ) : (
              recentShakes.map((shake, index) => (
                <motion.div
                  key={`${shake.user}-${shake.timestamp}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border-b border-gray-50 last:border-b-0 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {shake.user.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{shake.user}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{new Date(shake.timestamp).toLocaleTimeString()}</span>
                        {shake.location && (
                          <>
                            <MapPin className="w-3 h-3" />
                            <span>Nearby</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-blue-500"
                  >
                    <Zap className="w-5 h-5" />
                  </motion.div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}