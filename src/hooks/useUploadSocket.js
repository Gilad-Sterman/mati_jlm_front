import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSocket } from './useAppSocket';
import {
  handleUploadStarted,
  handleUploadProgress,
  handleUploadComplete,
  handleUploadError,
  handleTranscriptionStarted,
  handleTranscriptionComplete,
  handleReportGenerationStarted,
  handleAdvisorReportGenerated,
  handleProcessingError
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
      dispatch(handleUploadComplete(data));
    };

    // Handle upload error event
    const onUploadError = (data) => {
      console.error('❌ Frontend received upload_error:', data);
      dispatch(handleUploadError(data));
    };

    // Handle AI processing events
    const onTranscriptionStarted = (data) => {
      console.log('🎵 Frontend received transcription_started:', data);
      dispatch(handleTranscriptionStarted(data));
    };

    const onTranscriptionComplete = (data) => {
      console.log('✅ Frontend received transcription_complete:', data);
      dispatch(handleTranscriptionComplete(data));
    };

    const onReportGenerationStarted = (data) => {
      console.log('📝 Frontend received report_generation_started:', data);
      dispatch(handleReportGenerationStarted(data));
    };

    const onAdvisorReportGenerated = (data) => {
      console.log('✅ Frontend received advisor_report_generated:', data);
      dispatch(handleAdvisorReportGenerated(data));
    };

    const onTranscriptionError = (data) => {
      console.error('❌ Frontend received transcription_error:', data);
      dispatch(handleProcessingError({ ...data, stage: 'transcription' }));
    };

    const onReportGenerationError = (data) => {
      console.error('❌ Frontend received report_generation_error:', data);
      dispatch(handleProcessingError({ ...data, stage: 'report_generation' }));
    };

    // Register socket event listeners
    console.log('📡 Registering upload and AI processing socket event listeners');
    
    // Upload events
    socket.on('upload_started', onUploadStarted);
    socket.on('upload_progress', onUploadProgress);
    socket.on('upload_complete', onUploadComplete);
    socket.on('upload_error', onUploadError);
    
    // AI processing events
    socket.on('transcription_started', onTranscriptionStarted);
    socket.on('transcription_complete', onTranscriptionComplete);
    socket.on('report_generation_started', onReportGenerationStarted);
    socket.on('advisor_report_generated', onAdvisorReportGenerated);
    socket.on('transcription_error', onTranscriptionError);
    socket.on('report_generation_error', onReportGenerationError);

    // Cleanup function to remove listeners
    return () => {
      console.log('🧹 Cleaning up upload and AI processing socket event listeners');
      
      // Upload events
      socket.off('upload_started', onUploadStarted);
      socket.off('upload_progress', onUploadProgress);
      socket.off('upload_complete', onUploadComplete);
      socket.off('upload_error', onUploadError);
      
      // AI processing events
      socket.off('transcription_started', onTranscriptionStarted);
      socket.off('transcription_complete', onTranscriptionComplete);
      socket.off('report_generation_started', onReportGenerationStarted);
      socket.off('advisor_report_generated', onAdvisorReportGenerated);
      socket.off('transcription_error', onTranscriptionError);
      socket.off('report_generation_error', onReportGenerationError);
    };
  }, [socket, socketConnected, dispatch]);

  return socket;
};
