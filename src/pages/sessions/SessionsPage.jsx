import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchSessions } from "../../store/sessionSlice";
import { FileAudio, Calendar, User, Building, Clock, FileText } from "lucide-react";

export function SessionsPage() {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();

    // Redux state
    const sessions = useSelector(state => state.sessions.sessions);

    useEffect(() => {
        dispatch(fetchSessions());
    }, [dispatch]);

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(i18n.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Helper function to get status class
    const getStatusClass = (status) => {
        switch (status) {
            case 'uploaded': return 'status-uploaded';
            case 'processing': return 'status-processing';
            case 'completed': return 'status-completed';
            case 'failed': return 'status-failed';
            default: return '';
        }
    };

    // Helper function to get status translation
    const getStatusTranslation = (status) => {
        return t(`sessions.status.${status}`) || status;
    };

    return (
        <section className="sessions-page">
            <div className="sessions-header">
                <h1>{t('sessions.title')}</h1>
                <div className="sessions-count">
                    <span className="count-number">{sessions.length}</span>
                    <span className="count-label">{t('sessions.sessionsCount', { count: sessions.length })}</span>
                </div>
            </div>
            
            {sessions.length === 0 ? (
                <div className="no-sessions">
                    <FileText size={48} />
                    <p>{t('sessions.noSessions')}</p>
                </div>
            ) : (
                <div className="sessions-list">
                    {sessions.map(session => (
                        <div className="session-card" key={session.id}>
                            <div className="session-header">
                                <h2 className="session-title">{session.title}</h2>
                                <div className={`session-status ${getStatusClass(session.status)}`}>
                                    {getStatusTranslation(session.status)}
                                </div>
                            </div>
                            
                            <div className="session-content">
                                <div className="session-info">
                                    <div className="info-item">
                                        <Calendar size={16} />
                                        <span>{formatDate(session.created_at)}</span>
                                    </div>
                                    
                                    <div className="info-item">
                                        <User size={16} />
                                        <span>{session.client?.name || t('sessions.unknownClient')}</span>
                                    </div>
                                    
                                    {session.client?.metadata?.business_domain && (
                                        <div className="info-item">
                                            <Building size={16} />
                                            <span>{session.client.metadata.business_domain}</span>
                                        </div>
                                    )}
                                    
                                    {session.duration && (
                                        <div className="info-item">
                                            <Clock size={16} />
                                            <span>{Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="file-info">
                                    <div className="file-icon">
                                        <FileAudio size={24} />
                                    </div>
                                    <div className="file-details">
                                        <div className="file-name">{session.file_name}</div>
                                        <div className="file-size">{(session.file_size / (1024 * 1024)).toFixed(2)} MB</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}