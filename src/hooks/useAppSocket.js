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
          // Set up connection state listeners
          const handleConnect = () => {
            setSocketConnected(true);
            console.log('✅ App socket connected');
          };
          
          const handleDisconnect = () => {
            setSocketConnected(false);
            console.log('❌ App socket disconnected');
          };
          
          socket.on('connect', handleConnect);
          socket.on('disconnect', handleDisconnect);
          
          // Set initial state if already connected
          if (socket.connected) {
            setSocketConnected(true);
          }
          
          // Cleanup function to remove listeners
          return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
          };
        }
      }
    }
    
    // Update connection state if socket already exists
    if (isAuthenticated && user?.id && socketService.getStatus().hasSocket) {
      const currentStatus = socketService.getStatus();
      setSocketConnected(currentStatus.isConnected);
      
      // Also set up listeners for existing socket
      const socket = socketService.socket;
      if (socket) {
        const handleConnect = () => setSocketConnected(true);
        const handleDisconnect = () => setSocketConnected(false);
        
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        
        return () => {
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
        };
      }
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
