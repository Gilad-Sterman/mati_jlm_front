import { useEffect, useState } from 'react';
import { useAppSocket } from './useAppSocket';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { returnToUpload } from '../store/sessionSlice';

export function useGlobalNotifications() {
    const { socketConnected, socketService } = useAppSocket();
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        if (!socketConnected || !socketService?.socket) {
            return;
        }

        const socket = socketService.socket;

        // Listen for completion events only
        const handleReportsGenerated = (data) => {
            const { sessionId, message } = data;
            
            // Clear processing state and return to upload page
            dispatch(returnToUpload());
            
            // Add success notification
            const notification = {
                id: `success-${sessionId}-${Date.now()}`,
                type: 'success',
                title: t('notifications.processingComplete'),
                message: message || t('notifications.sessionProcessedSuccessfully'),
                sessionId,
                timestamp: new Date(),
                action: {
                    label: t('notifications.viewReports'),
                    onClick: () => {
                        navigate(`/reports/${sessionId}`);
                        removeNotification(notification.id);
                    }
                }
            };

            setNotifications(prev => [...prev, notification]);

            // Auto-remove after 10 seconds if no action taken
            setTimeout(() => {
                removeNotification(notification.id);
            }, 10000);
        };

        const handleProcessingError = (data) => {
            const { sessionId, message, error } = data;
            
            // Add error notification
            const notification = {
                id: `error-${sessionId}-${Date.now()}`,
                type: 'error',
                title: t('notifications.processingFailed'),
                message: message || error || t('notifications.processingError'),
                sessionId,
                timestamp: new Date(),
                action: {
                    label: t('notifications.tryAgain'),
                    onClick: () => {
                        navigate('/upload');
                        removeNotification(notification.id);
                    }
                }
            };

            setNotifications(prev => [...prev, notification]);

            // Auto-remove after 15 seconds for errors
            setTimeout(() => {
                removeNotification(notification.id);
            }, 15000);
        };

        // Register event listeners
        socket.on('reports_generated', handleReportsGenerated);
        socket.on('processing_error', handleProcessingError);

        // Cleanup
        return () => {
            socket.off('reports_generated', handleReportsGenerated);
            socket.off('processing_error', handleProcessingError);
        };
    }, [socketConnected, socketService, navigate]);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    return {
        notifications,
        removeNotification,
        clearAllNotifications
    };
}
