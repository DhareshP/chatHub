import React from 'react';
import { motion } from 'framer-motion';
import { User, Star, Gift, Zap, Trophy, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();

  const stats = [
    { icon: Star, label: 'Points', value: user?.points || 0, color: 'text-yellow-500' },
    { icon: Gift, label: 'Red Packets', value: '12', color: 'text-red-500' },
    { icon: Zap, label: 'Shakes', value: '36', color: 'text-blue-500' },
    { icon: Trophy, label: 'Rank', value: '#5', color: 'text-purple-500' },
  ];

  const menuItems = [
    { icon: Settings, label: 'Settings', onClick: () => {} },
    { icon: LogOut, label: 'Logout', onClick: logout, color: 'text-red-500' },
  ];

  return (
    <div className="min-h-full bg-gradient-to-br from-purple-50 to-pink-50 p-6 overflow-y-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 mb-6 shadow-sm"
      >
        <div className="flex items-center space-x-4">
          <motion.img
            whileHover={{ scale: 1.05 }}
            src={user?.avatar}
            alt={user?.username}
            className="w-16 h-16 rounded-full border-4 border-purple-200"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user?.username}</h2>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">{user?.points} points</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 text-center shadow-sm"
            >
              <Icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-4 mb-6 shadow-sm"
      >
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
          Achievement Badges
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {['🏆', '🎯', '🔥', '⭐', '🎊', '💎', '🌟', '🏅'].map((emoji, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl cursor-pointer hover:bg-gray-200 transition-colors"
            >
              {emoji}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Menu Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden mb-6"
      >
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              onClick={item.onClick}
              whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-4 flex items-center space-x-3 text-left transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <Icon className={`w-5 h-5 ${item.color || 'text-gray-500'}`} />
              <span className={`font-medium ${item.color || 'text-gray-900'}`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}