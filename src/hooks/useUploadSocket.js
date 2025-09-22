import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSocket } from './useAppSocket';
import {
  handleUploadStarted,
  handleUploadProgress,
  handleUploadComplete,
  handleUploadError
} from '../store/sessionSlice';

/**
 * Custom hook to handle upload-related socket events
 */
export const useUploadSocket = () => {
  const dispatch = useDispatch();
  const { socketConnected, socketService } = useAppSocket();
  
  // Get the actual socket instance
  const socket = socketService?.socket;

  useEffect(() => {
    if (!socket || !socketConnected) {
      console.log('🔌 Upload socket: No socket or not connected', { socket: !!socket, socketConnected });
      return;
    }

    console.log('🔌 Setting up upload socket listeners');

    // Handle upload started event
    const onUploadStarted = (data) => {
      console.log('🚀 Frontend received upload_started:', data);
      dispatch(handleUploadStarted(data));
    };

    // Handle upload progress event
    const onUploadProgress = (data) => {
      console.log('📈 Frontend received upload_progress:', data);
      dispatch(handleUploadProgress(data));
    };

    // Handle upload complete event
    const onUploadComplete = (data) => {
      console.log('✅ Frontend received upload_complete:', data);
      dispatch(handleUploadComplete(data));
    };

    // Handle upload error event
    const onUploadError = (data) => {
      console.error('❌ Frontend received upload_error:', data);
      dispatch(handleUploadError(data));
    };

    // Register socket event listeners
    console.log('📡 Registering upload socket event listeners');
    socket.on('upload_started', onUploadStarted);
    socket.on('upload_progress', onUploadProgress);
    socket.on('upload_complete', onUploadComplete);
    socket.on('upload_error', onUploadError);

    // Cleanup function to remove listeners
    return () => {
      console.log('🧹 Cleaning up upload socket event listeners');
      socket.off('upload_started', onUploadStarted);
      socket.off('upload_progress', onUploadProgress);
      socket.off('upload_complete', onUploadComplete);
      socket.off('upload_error', onUploadError);
    };
  }, [socket, socketConnected, dispatch]);

  return socket;
};
