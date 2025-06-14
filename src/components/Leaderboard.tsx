import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Footprints, Crown, Medal, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardEntry {
  user: string;
  score: number;
  rank: number;
}

interface UserStats {
  points: number;
  todaySteps: number;
  pointsRank: number | null;
  stepsRank: number | null;
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<'points' | 'steps'>('points');
  const [pointsLeaderboard, setPointsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stepsLeaderboard, setStepsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    loadLeaderboards();
    loadUserStats();
  }, []);

  const loadLeaderboards = async () => {
    setLoading(true);
    try {
      const [pointsResponse, stepsResponse] = await Promise.all([
        fetch('http://localhost:3001/api/game/leaderboard/points', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`http://localhost:3001/api/game/leaderboard/steps?date=${new Date().toISOString().split('T')[0]}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const pointsData = await pointsResponse.json();
      const stepsData = await stepsResponse.json();

      setPointsLeaderboard(pointsData);
      setStepsLeaderboard(stepsData);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/game/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const stats = await response.json();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const submitSteps = async () => {
    const steps = Math.floor(Math.random() * 10000) + 1000; // Mock step count
    try {
      await fetch('http://localhost:3001/api/game/steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ count: steps })
      });
      
      loadLeaderboards();
      loadUserStats();
    } catch (error) {
      console.error('Error submitting steps:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const currentLeaderboard = activeTab === 'points' ? pointsLeaderboard : stepsLeaderboard;

  return (
    <div className="min-h-full bg-gradient-to-br from-yellow-50 to-orange-50 p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 rounded-full mb-4"
        >
          <Trophy className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        <p className="text-gray-600">View points and steps rankings</p>
      </div>

      {/* User Stats */}
      {userStats && (
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">My Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Star className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Points</p>
              <p className="text-xl font-bold text-gray-900">{userStats.points}</p>
              {userStats.pointsRank && (
                <p className="text-xs text-gray-500">Rank #{userStats.pointsRank}</p>
              )}
            </div>
            <div className="text-center">
              <Footprints className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Today's Steps</p>
              <p className="text-xl font-bold text-gray-900">{userStats.todaySteps}</p>
              {userStats.stepsRank && (
                <p className="text-xs text-gray-500">Rank #{userStats.stepsRank}</p>
              )}
            </div>
          </div>
          <button
            onClick={submitSteps}
            className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Sync Steps (Mock)
          </button>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex bg-white rounded-xl p-1 mb-6 shadow-sm">
        <button
          onClick={() => setActiveTab('points')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'points'
              ? 'bg-yellow-500 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Points
        </button>
        <button
          onClick={() => setActiveTab('steps')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'steps'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Steps
        </button>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            {activeTab === 'points' ? 'Points Leaderboard' : 'Steps Leaderboard'}
          </h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
              <p>Loading...</p>
            </div>
          ) : currentLeaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No ranking data yet</p>
              <p className="text-sm">Start earning points!</p>
            </div>
          ) : (
            currentLeaderboard.map((entry, index) => (
              <motion.div
                key={entry.user}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 border-b border-gray-50 last:border-b-0 flex items-center justify-between ${
                  entry.user === user?.username ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getRankIcon(entry.rank)}
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      entry.rank === 1 ? 'bg-yellow-500' :
                      entry.rank === 2 ? 'bg-gray-400' :
                      entry.rank === 3 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {entry.user.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {entry.user}
                        {entry.user === user?.username && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            Me
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">Rank #{entry.rank}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {activeTab === 'points' ? `${entry.score} points` : `${entry.score} steps`}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}