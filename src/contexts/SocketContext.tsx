import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  chatSocket: Socket | null;
  shakeSocket: Socket | null;
  gameSocket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [chatSocket, setChatSocket] = useState<Socket | null>(null);
  const [shakeSocket, setShakeSocket] = useState<Socket | null>(null);
  const [gameSocket, setGameSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const auth = { token };
    
    // Initialize sockets
    const chat = io('http://localhost:3001/chat', { auth });
    const shake = io('http://localhost:3001/shake', { auth });
    const game = io('http://localhost:3001/game', { auth });

    // Connection handlers
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    chat.on('connect', handleConnect);
    chat.on('disconnect', handleDisconnect);

    setChatSocket(chat);
    setShakeSocket(shake);
    setGameSocket(game);

    return () => {
      chat.disconnect();
      shake.disconnect();
      game.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ chatSocket, shakeSocket, gameSocket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}