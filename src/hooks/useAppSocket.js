import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAuthenticated } from '../store/authSlice';
import socketService from '../services/socketService';

export function useAppSocket() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Only connect if authenticated, user exists, and no socket exists yet
    if (isAuthenticated && user?.id && !socketService.getStatus().hasSocket) {
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('🔌 Connecting app-level socket...');
        
        const socket = socketService.connect(token);
        if (socket) {
          socket.on('connect', () => {
            setSocketConnected(true);
            console.log('✅ App socket connected');
          });
          
          socket.on('disconnect', () => {
            setSocketConnected(false);
            console.log('❌ App socket disconnected');
          });
        }
      }
    }
    
    // Update connection state if socket already exists
    if (isAuthenticated && user?.id && socketService.getStatus().hasSocket) {
      setSocketConnected(socketService.getStatus().isConnected);
    }
    
    // Disconnect when user logs out
    if (!isAuthenticated && socketService.getStatus().hasSocket) {
      console.log('🔌 Disconnecting socket on logout');
      socketService.disconnect();
      setSocketConnected(false);
    }
  }, [isAuthenticated, user?.id]);

  return {
    socketConnected,
    socketService
  };
}
