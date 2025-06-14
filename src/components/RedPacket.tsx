import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Plus, Users, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RedPacketData {
  id: string;
  sender: string;
  totalAmount: number;
  count: number;
  claimedCount: number;
  message: string;
  status: string;
  createdAt: string;
  claims: Array<{
    user: string;
    amount: number;
    claimedAt: string;
  }>;
}

interface CreateRedPacketForm {
  totalAmount: string;
  count: string;
  message: string;
  roomId: string;
}

export default function RedPacket() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [myRedPackets, setMyRedPackets] = useState<RedPacketData[]>([]);
  const [createForm, setCreateForm] = useState<CreateRedPacketForm>({
    totalAmount: '',
    count: '',
    message: 'Congratulations! Good luck!',
    roomId: 'general'
  });
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    // In a real app, you'd fetch user's red packets here
  }, []);

  const handleCreateRedPacket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/redpacket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          totalAmount: parseFloat(createForm.totalAmount),
          count: parseInt(createForm.count),
          message: createForm.message,
          roomId: createForm.roomId
        })
      });

      if (response.ok) {
        const newRedPacket = await response.json();
        setMyRedPackets(prev => [newRedPacket, ...prev]);
        setShowCreateForm(false);
        setCreateForm({
          totalAmount: '',
          count: '',
          message: 'Congratulations! Good luck!',
          roomId: 'general'
        });
      }
    } catch (error) {
      console.error('Error creating red packet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrabRedPacket = async (redPacketId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/redpacket/${redPacketId}/grab`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`Congratulations! You got $${result.amount.toFixed(2)}`);
      } else {
        alert(result.error || 'All red packets have been claimed');
      }
    } catch (error) {
      console.error('Error grabbing red packet:', error);
      alert('Failed to grab red packet');
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-red-50 to-orange-50 p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-4"
        >
          <Gift className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Red Packets</h1>
        <p className="text-gray-600">Send red packets to friends and spread good fortune</p>
      </div>

      {/* Create Button */}
      <div className="flex justify-center mb-8">
        <motion.button
          onClick={() => setShowCreateForm(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-red-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg flex items-center space-x-2 hover:bg-red-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Send Red Packet</span>
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <Gift className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Sent</p>
          <p className="text-2xl font-bold text-gray-900">{myRedPackets.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">
            ${myRedPackets.reduce((sum, rp) => sum + rp.totalAmount, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Recipients</p>
          <p className="text-2xl font-bold text-gray-900">
            {myRedPackets.reduce((sum, rp) => sum + rp.claimedCount, 0)}
          </p>
        </div>
      </div>

      {/* Red Packets List */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">My Red Packets</h3>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {myRedPackets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No red packets sent yet</p>
              <p className="text-sm">Click the button above to send your first red packet!</p>
            </div>
          ) : (
            myRedPackets.map((redPacket) => (
              <div key={redPacket.id} className="p-4 border-b border-gray-50 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{redPacket.message}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(redPacket.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-500">${redPacket.totalAmount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {redPacket.claimedCount}/{redPacket.count}
                    </p>
                  </div>
                </div>
                
                {redPacket.claims.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {redPacket.claims.map((claim, index) => (
                      <div key={index} className="flex justify-between text-sm text-gray-600">
                        <span>{claim.user}</span>
                        <span>${claim.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Red Packet Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Send Red Packet</h3>
              
              <form onSubmit={handleCreateRedPacket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={createForm.totalAmount}
                    onChange={(e) => setCreateForm({ ...createForm, totalAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Packets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={createForm.count}
                    onChange={(e) => setCreateForm({ ...createForm, count: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <input
                    type="text"
                    value={createForm.message}
                    onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Congratulations! Good luck!"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Sending...' : 'Send Red Packet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}