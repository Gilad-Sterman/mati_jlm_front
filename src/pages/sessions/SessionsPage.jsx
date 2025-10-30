import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSessions } from "../../store/sessionSlice";
import { fetchAllReports } from "../../store/reportSlice";
import { FileAudio, Calendar, User, Building, Clock, FileText, ChevronRight, Eye, ChevronLeft, Loader2 } from "lucide-react";

export function SessionsPage() {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const reportsFetched = useRef(false); // Track if reports already fetched

    // Redux state
    const sessions = useSelector(state => state.sessions.sessions);
    const isLoadingSessions = useSelector(state => state.sessions.isLoading);
    const isLoadingReports = useSelector(state => state.reports.isLoading);
    const reportsBySession = useSelector(state => state.reports.reportsBySession);

    // Load sessions and reports SIMULTANEOUSLY on mount - they're independent!
    useEffect(() => {
        // Fetch sessions
        dispatch(fetchSessions());
        // Fetch reports at the same time - no need to wait!
        if (!reportsFetched.current && !isLoadingReports) {
            reportsFetched.current = true;
            dispatch(fetchAllReports())
                .unwrap()
                .then(() => {
                    // Reports loaded successfully
                })
                .catch((error) => {
                    console.error('Error fetching reports:', error);
                    reportsFetched.current = false; // Allow retry on error
                });
        }
    }, [dispatch]); // Only run once on mount

    // Calculate if both data sets are loaded
    const bothDataLoaded = !isLoadingSessions && !isLoadingReports && sessions.length > 0;

    // Data is connected and ready when bothDataLoaded is true

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
            case 'advisor_report_generated': return 'status-adviser-report-generated';
            case 'client_report_generated': return 'status-client-report-generated';
            case 'completed': return 'status-completed';
            case 'failed': return 'status-failed';
            default: return '';
        }
    };

    // Helper function to get status translation
    const getStatusTranslation = (status) => {
        return t(`sessions.status.${status}`) || status;
    };

    // Helper function to check if a report exists and is available
    const isReportAvailable = (report) => {
        return report && (report.status === 'approved' || report.status === 'draft');
    };

    // Navigation functions
    // Navigation functions for reports
    const navigateToAdviserReport = (sessionId) => {
        navigate(`/reports/adviser/${sessionId}`);
    };

    const navigateToClientReport = (sessionId) => {
        navigate(`/reports/client/${sessionId}`);
    };

    const navigateToSummaryReport = (sessionId) => {
        navigate(`/reports/summary/${sessionId}`);
    };

    // Show loading until BOTH sessions and reports are loaded
    if (!bothDataLoaded) {
        return (
            <section className="sessions-page">
                <div className="sessions-header">
                    <h1>{t('sessions.title')}</h1>
                </div>
                <div className="loading-container">
                    <div className="loading-content">
                        <Loader2 size={48} className="loading-spinner animate-spin" />
                        <h3>{t('sessions.loadingSessions')}</h3>
                        <p>{isLoadingSessions && isLoadingReports ? t('sessions.loadingSessionsAndReports') : isLoadingSessions ? t('sessions.loadingSessions') : t('sessions.loadingReports')}</p>
                    </div>
                </div>
            </section>
        );
    }

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
                        <SessionCard 
                            key={session.id} 
                            session={session} 
                            formatDate={formatDate}
                            getStatusClass={getStatusClass}
                            getStatusTranslation={getStatusTranslation}
                            isReportAvailable={isReportAvailable}
                            navigateToAdviserReport={navigateToAdviserReport}
                            navigateToClientReport={navigateToClientReport}
                            navigateToSummaryReport={navigateToSummaryReport}
                            availableReports={reportsBySession[session.id] || []}
                            navigate={navigate}
                            t={t}
                            i18n={i18n}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

// Session card with report buttons
const SessionCard = React.memo(function SessionCard({ 
    session, 
    formatDate, 
    getStatusClass, 
    getStatusTranslation, 
    isReportAvailable,
    navigateToAdviserReport,
    navigateToClientReport,
    navigateToSummaryReport,
    availableReports,
    navigate,
    t,
    i18n
}) {
    // Organize reports by type
    const reportsByType = {
        adviser: availableReports.find(r => r.type === 'adviser'),
        client: availableReports.find(r => r.type === 'client'),
        summary: availableReports.find(r => r.type === 'summary')
    };

    return (
        <div className="session-card">
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
                {isReportAvailable(reportsByType.client) && (
                    <button 
                        className="report-btn client-btn"
                        onClick={() => navigate(`/reports/${session.id}`)}
                        title={t('sessions.viewReports')}
                    >
                        <Eye size={16} />
                        <span>{t('sessions.clientReport')}</span>
                        {i18n.language === 'he' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                )}
                
                {!isReportAvailable(reportsByType.adviser) && 
                 !isReportAvailable(reportsByType.client) && (
                    <div className="no-reports">
                        <span>{t('sessions.noReportsAvailable')}</span>
                    </div>
                )}
            </div>
        </div>
    );
});