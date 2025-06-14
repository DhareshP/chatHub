import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, Hash } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import Confetti from 'react-confetti';

interface Message {
  id: string;
  sender: string;
  text: string;
  type: string;
  createdAt: string;
  triggers?: string[];
}

interface Room {
  id: string;
  name: string;
  description: string;
}

export default function Chat() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showAnimation, setShowAnimation] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const { chatSocket, connected } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Load rooms and join default room
  useEffect(() => {
    loadRooms();
    if (chatSocket && connected) {
      chatSocket.emit('join_room', currentRoom);
    }
  }, [chatSocket, connected, currentRoom]);

  // Load chat history when room changes
  useEffect(() => {
    if (currentRoom) {
      loadChatHistory();
    }
  }, [currentRoom]);

  // Socket event listeners
  useEffect(() => {
    if (!chatSocket) return;

    chatSocket.on('message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    chatSocket.on('animation', (data) => {
      if (data.animations.length > 0) {
        setShowAnimation(data.animations[0]);
        setTimeout(() => setShowAnimation(null), 3000);
      }
    });

    chatSocket.on('user_typing', (data) => {
      if (data.user !== user?.username) {
        setTypingUsers(prev => new Set(prev).add(data.user));
      }
    });

    chatSocket.on('user_stop_typing', (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.user);
        return newSet;
      });
    });

    return () => {
      chatSocket.off('message');
      chatSocket.off('animation');
      chatSocket.off('user_typing');
      chatSocket.off('user_stop_typing');
    };
  }, [chatSocket, user]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRooms = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chat/rooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/chat/rooms/${currentRoom}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatSocket) return;

    chatSocket.emit('message', {
      roomId: currentRoom,
      text: newMessage.trim(),
      type: 'text'
    });

    setNewMessage('');
    handleStopTyping();
  };

  const handleTyping = () => {
    if (!chatSocket) return;
    
    chatSocket.emit('typing', { roomId: currentRoom });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (!chatSocket) return;
    chatSocket.emit('stop_typing', { roomId: currentRoom });
  };

  const currentRoomData = rooms.find(room => room.id === currentRoom);

  return (
    <div className="flex flex-col bg-white min-h-full">
      {/* Animation Overlay */}
      <AnimatePresence>
        {showAnimation && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {showAnimation === 'confetti' && (
              <Confetti
                width={window.innerWidth}
                height={window.innerHeight}
                recycle={false}
                numberOfPieces={200}
              />
            )}
            {showAnimation === 'fireworks' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-6xl">🎆</div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Room Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Hash className="w-5 h-5 text-gray-500" />
          <div>
            <h3 className="font-semibold text-gray-900">{currentRoomData?.name}</h3>
            <p className="text-sm text-gray-500">{currentRoomData?.description}</p>
          </div>
        </div>
        
        {/* Room Selector */}
        <div className="flex space-x-2 mt-3 overflow-x-auto">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setCurrentRoom(room.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                currentRoom === room.id
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender === user?.username ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender === user?.username
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.sender !== user?.username && (
                  <p className="text-xs font-medium mb-1 opacity-70">{message.sender}</p>
                )}
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === user?.username ? 'text-green-100' : 'text-gray-500'
                }`}>
                  {new Date(message.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 px-4 py-2 rounded-2xl">
              <p className="text-sm text-gray-600">
                {Array.from(typingUsers).join(', ')} is typing...
              </p>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <form onSubmit={sendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={!newMessage.trim() || !connected}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}