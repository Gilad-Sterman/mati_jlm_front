import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, X, ExternalLink } from 'lucide-react';
import { useGlobalNotifications } from '../hooks/useGlobalNotifications';

export function GlobalNotifications() {
    const { t } = useTranslation();
    const { notifications, removeNotification, clearAllNotifications } = useGlobalNotifications();

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="global-notifications">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`notification ${notification.type}`}
                >
                    <div className="notification-icon">
                        {notification.type === 'success' ? (
                            <CheckCircle className="success-icon" />
                        ) : (
                            <XCircle className="error-icon" />
                        )}
                    </div>
                    
                    <div className="notification-content">
                        <h4 className="notification-title">
                            {notification.title}
                        </h4>
                        <p className="notification-message">
                            {notification.message}
                        </p>
                        
                        {notification.action && (
                            <button
                                className="notification-action"
                                onClick={notification.action.onClick}
                            >
                                <ExternalLink className="action-icon" />
                                {notification.action.label}
                            </button>
                        )}
                    </div>
                    
                    <button
                        className="notification-close"
                        onClick={() => removeNotification(notification.id)}
                        aria-label="Close notification"
                    >
                        <X className="close-icon" />
                    </button>
                </div>
            ))}
            
            {notifications.length > 1 && (
                <div className="notifications-footer">
                    <button
                        className="clear-all-button"
                        onClick={clearAllNotifications}
                    >
                        {t('notifications.clearAll')}
                    </button>
                </div>
            )}
        </div>
    );
}
