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
  handleProcessingError,
  handleChunkingStarted,
  handleChunksCreated,
  handleChunkProgress,
  handleChunkCompleted,
  handleChunkFailed,
  handleChunkingCompleted
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

    // Handle upload started event
    const onUploadStarted = (data) => {
      dispatch(handleUploadStarted(data));
    };

    // Handle upload progress event
    const onUploadProgress = (data) => {
      // Subscribe to session room for chunked transcription events (only on first progress update)
      if (data.sessionId && socketService && data.progress <= 10) {
        socketService.subscribeToSession(data.sessionId);
      }
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
      dispatch(handleTranscriptionStarted(data));
    };

    const onTranscriptionComplete = (data) => {
      dispatch(handleTranscriptionComplete(data));
    };

    const onReportGenerationStarted = (data) => {
      dispatch(handleReportGenerationStarted(data));
    };

    const onAdvisorReportGenerated = (data) => {
      dispatch(handleAdvisorReportGenerated(data));
    };

    const onReportsGenerated = (data) => {
      // Map the new payload structure to the expected format
      const mappedData = {
        sessionId: data.sessionId,
        message: data.message,
        report: data.reports?.advisor || data.reports?.client || data.report // Fallback to advisor report for compatibility
      };
      dispatch(handleAdvisorReportGenerated(mappedData));
    };

    const onTranscriptionError = (data) => {
      console.error('❌ Frontend received transcription_error:', data);
      dispatch(handleProcessingError({ ...data, stage: 'transcription' }));
    };

    const onReportGenerationError = (data) => {
      console.error('❌ Frontend received report_generation_error:', data);
      dispatch(handleProcessingError({ ...data, stage: 'report_generation' }));
    };

    // Chunked transcription event handlers
    const onChunkingStarted = (data) => {
      dispatch(handleChunkingStarted(data));
    };

    const onChunksCreated = (data) => {
      dispatch(handleChunksCreated(data));
    };

    const onChunkProgress = (data) => {
      dispatch(handleChunkProgress(data));
    };

    const onChunkCompleted = (data) => {
      dispatch(handleChunkCompleted(data));
    };

    const onChunkFailed = (data) => {
      dispatch(handleChunkFailed(data));
    };

    const onChunkingCompleted = (data) => {
      dispatch(handleChunkingCompleted(data));
    };

    // Register socket event listeners
    
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
    socket.on('reports_generated', onReportsGenerated);
    socket.on('transcription_error', onTranscriptionError);
    socket.on('report_generation_error', onReportGenerationError);
    
    // Chunked transcription events
    socket.on('transcription_chunking_started', onChunkingStarted);
    socket.on('transcription_chunks_created', onChunksCreated);
    socket.on('transcription_chunk_progress', onChunkProgress);
    socket.on('transcription_chunk_completed', onChunkCompleted);
    socket.on('transcription_chunk_failed', onChunkFailed);
    socket.on('transcription_chunking_completed', onChunkingCompleted);

    // Cleanup function to remove listeners
    return () => {
      
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
      socket.off('reports_generated', onReportsGenerated);
      socket.off('transcription_error', onTranscriptionError);
      socket.off('report_generation_error', onReportGenerationError);
      
      // Chunked transcription events
      socket.off('transcription_chunking_started', onChunkingStarted);
      socket.off('transcription_chunks_created', onChunksCreated);
      socket.off('transcription_chunk_progress', onChunkProgress);
      socket.off('transcription_chunk_completed', onChunkCompleted);
      socket.off('transcription_chunk_failed', onChunkFailed);
      socket.off('transcription_chunking_completed', onChunkingCompleted);
    };
  }, [socket, socketConnected, dispatch]);

  return socket;
};
