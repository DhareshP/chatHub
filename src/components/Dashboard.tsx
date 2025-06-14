import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Zap, Gift, Trophy, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Chat from './Chat';
import Shake from './Shake';
import RedPacket from './RedPacket';
import Leaderboard from './Leaderboard';
import Profile from './Profile';

const tabs = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'shake', label: 'Shake', icon: Zap },
  { id: 'redpacket', label: 'Red Packet', icon: Gift },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('chat');
  const { user, logout } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <Chat />;
      case 'shake':
        return <Shake />;
      case 'redpacket':
        return <RedPacket />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'profile':
        return <Profile />;
      default:
        return <Chat />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex-shrink-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar}
              alt={user?.username}
              className="w-10 h-10 rounded-full border-2 border-green-500"
            />
            <div>
              <h2 className="font-semibold text-gray-900">{user?.username}</h2>
              <p className="text-sm text-gray-500">{user?.points} points</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-t border-gray-200 px-4 py-2 flex-shrink-0"
      >
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-green-600' : ''}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-green-600' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="w-1 h-1 bg-green-600 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}