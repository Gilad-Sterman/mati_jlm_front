import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSessions } from "../../store/sessionSlice";
import { FileAudio, Calendar, User, Building, Clock, FileText, ChevronRight, Eye, ChevronLeft } from "lucide-react";

export function SessionsPage() {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

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

    // Helper function to determine available reports based on session status
    const getAvailableReports = (session) => {
        const reports = {
            adviser: false,
            client: false,
            summary: false
        };

        switch (session.status) {
            case 'completed':
                // All reports available for completed sessions
                reports.adviser = true;
                reports.client = true;
                reports.summary = true;
                break;
            case 'processing':
                // Only adviser report might be available during processing
                reports.adviser = true;
                break;
            case 'uploaded':
                // No reports available yet
                break;
            default:
                break;
        }

        return reports;
    };

    // Navigation functions
    const navigateToAdviserReport = (sessionId) => {
        navigate(`/reports/adviser/${sessionId}`);
    };

    const navigateToClientReport = (sessionId) => {
        navigate(`/reports/client/${sessionId}`);
    };

    const navigateToSummaryReport = (sessionId) => {
        navigate(`/reports/summary/${sessionId}`);
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
                    {sessions.map(session => {
                        const availableReports = getAvailableReports(session);
                        
                        return (
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

                                {/* Report Actions */}
                                <div className="session-actions">
                                    {availableReports.adviser && (
                                        <button 
                                            className="report-btn adviser-btn"
                                            onClick={() => navigateToAdviserReport(session.id)}
                                            title={t('sessions.viewAdviserReport')}
                                        >
                                            <Eye size={16} />
                                            <span>{t('sessions.adviserReport')}</span>
                                            {document.dir === 'rtl' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                                        </button>
                                    )}
                                    
                                    {availableReports.client && (
                                        <button 
                                            className="report-btn client-btn"
                                            onClick={() => navigateToClientReport(session.id)}
                                            title={t('sessions.viewClientReport')}
                                        >
                                            <Eye size={16} />
                                            <span>{t('sessions.clientReport')}</span>
                                            {document.dir === 'rtl' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                                        </button>
                                    )}
                                    
                                    {availableReports.summary && (
                                        <button 
                                            className="report-btn summary-btn"
                                            onClick={() => navigateToSummaryReport(session.id)}
                                            title={t('sessions.viewSummaryReport')}
                                        >
                                            <Eye size={16} />
                                            <span>{t('sessions.summaryReport')}</span>
                                            {document.dir === 'rtl' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                                        </button>
                                    )}
                                    
                                    {!availableReports.adviser && !availableReports.client && !availableReports.summary && (
                                        <div className="no-reports">
                                            <span>{t('sessions.noReportsAvailable')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    )
}