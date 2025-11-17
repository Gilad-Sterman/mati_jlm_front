import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchSessionsWithReports, selectAdvisers } from "../../store/sessionSlice";
import { FileAudio, Calendar, User, Building, Clock, FileText, ChevronRight, Eye, ChevronLeft, Loader2, Search, Filter, SortAsc, SortDesc, FileCheck } from "lucide-react";

export function SessionsPage() {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Redux state
    const sessions = useSelector(state => state.sessions.sessions);
    const advisers = useSelector(selectAdvisers);
    const isLoading = useSelector(state => state.sessions.isLoading);
    const currentUser = useSelector(state => state.auth.user);
    const isAdmin = currentUser?.role === 'admin';

    // Initialize filters from URL parameters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [adviserFilter, setAdviserFilter] = useState(searchParams.get('adviser_id') || '');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Debounce search term to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Load sessions with reports in a single API call with filters
    useEffect(() => {
        const params = {};

        if (debouncedSearchTerm) params.search_term = debouncedSearchTerm;
        if (statusFilter) params.status = statusFilter;
        if (isAdmin && adviserFilter) params.adviser_id = adviserFilter;
        if (sortBy) params.sort_by = sortBy;
        if (sortDirection) params.sort_direction = sortDirection;

        dispatch(fetchSessionsWithReports(params));
    }, [dispatch, debouncedSearchTerm, statusFilter, adviserFilter, sortBy, sortDirection, isAdmin]);

    // Handle URL parameter changes (e.g., when navigating from dashboard)
    useEffect(() => {
        const adviserIdFromUrl = searchParams.get('adviser_id');
        if (adviserIdFromUrl && adviserIdFromUrl !== adviserFilter) {
            setAdviserFilter(adviserIdFromUrl);
        }
    }, [searchParams, adviserFilter]);

    // Format advisers for dropdown
    const formattedAdvisers = React.useMemo(() => {
        if (!isAdmin || !advisers.length) return [];
        
        return advisers.map(adviser => ({
            value: adviser.id,
            label: `${adviser.name || adviser.email}${adviser.role === 'admin' ? ' (Admin)' : ''}`
        }));
    }, [advisers, isAdmin]);

    // Data is loaded when not loading (sessions can be empty due to filters)
    const dataLoaded = !isLoading;

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
            case 'reports_generated': return 'status-reports-generated';
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
    const navigateToAdviserReport = (sessionId) => {
        navigate(`/reports/adviser/${sessionId}`);
    };

    const navigateToClientReport = (sessionId) => {
        navigate(`/reports/client/${sessionId}`);
    };

    const navigateToSummaryReport = (sessionId) => {
        navigate(`/reports/summary/${sessionId}`);
    };

    // Render the main content with filters always visible

    // Handle sort toggle
    const toggleSort = (field) => {
        if (sortBy === field) {
            // Toggle direction if already sorting by this field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort field with default desc direction
            setSortBy(field);
            setSortDirection('desc');
        }
    };

    // Get status options
    const statusOptions = [
        { value: '', label: t('sessions.filterAllStatuses') },
        { value: 'uploaded', label: t('sessions.status.uploaded') },
        { value: 'processing', label: t('sessions.status.processing') },
        { value: 'reports_generated', label: t('sessions.status.reports_generated') },
        { value: 'completed', label: t('sessions.status.completed') },
        { value: 'failed', label: t('sessions.status.failed') }
    ];

    // Reset all filters
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setAdviserFilter('');
        setSortBy('created_at');
        setSortDirection('desc');
        
        // Clear URL parameters
        navigate('/sessions', { replace: true });
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

            {/* Search and Filter Controls */}
            <div className="sessions-controls">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={t('sessions.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}>
                            &times;
                        </button>
                    )}
                </div>

                <div className="filter-controls">
                    <div className="filter-item">
                        <label>{t('sessions.filterStatus')}</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isAdmin && (
                        <div className="filter-item">
                            <label>
                                {t('sessions.filterAdviser')}
                                {searchParams.get('adviser_id') && (
                                    <span className="filter-badge">{t('sessions.fromDashboard')}</span>
                                )}
                            </label>
                            <select
                                value={adviserFilter}
                                onChange={(e) => {
                                    setAdviserFilter(e.target.value);
                                    // Clear URL parameters when changing filter manually
                                    if (searchParams.get('adviser_id')) {
                                        navigate('/sessions', { replace: true });
                                    }
                                }}
                            >
                                <option value="">{t('sessions.filterAllAdvisers')}</option>
                                {formattedAdvisers.map(adviser => (
                                    <option key={adviser.value} value={adviser.value}>
                                        {adviser.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="sort-controls">
                        <button
                            className={`sort-button ${sortBy === 'created_at' ? 'active' : ''}`}
                            onClick={() => toggleSort('created_at')}
                            title={t('sessions.sortDate')}
                        >
                            {sortBy === 'created_at' && sortDirection === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                            {t('sessions.sortDate')}
                        </button>

                        <button
                            className={`sort-button ${sortBy === 'title' ? 'active' : ''}`}
                            onClick={() => toggleSort('title')}
                            title={t('sessions.sortTitle')}
                        >
                            {sortBy === 'title' && sortDirection === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                            {t('sessions.sortTitle')}
                        </button>
                    </div>

                    {(searchTerm || statusFilter || adviserFilter || sortBy !== 'created_at' || sortDirection !== 'desc') && (
                        <button className="reset-filters" onClick={resetFilters}>
                            {t('sessions.filterReset')}
                        </button>
                    )}
                </div>
            </div>

            {/* Sessions List with Loading States */}
            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-content">
                        <Loader2 size={48} className="loading-spinner animate-spin" />
                        <h3>{t('sessions.loadingSessions')}</h3>
                        <p>{t('sessions.loadingSessionsAndReports')}</p>
                    </div>
                </div>
            ) : sessions.length === 0 ? (
                <div className="no-sessions">
                    <FileText size={48} />
                    <p>{t('sessions.noSessions')}</p>
                </div>
            ) : (
                <div className="sessions-list">
                    {/* {sessions.length > 0 && <div className="sessions-avg">
                        <div className="avg-item">
                            <span className="avg-label">{t('sessions.avgEntrepreneurScore')}</span>
                            <span className="avg-value">{Math.round(sessions.reduce((total, session) => total + Number(JSON.parse(session.reports?.adviser?.content).entrepreneur_readiness_score) , 0) / sessions.length)}%</span>
                        </div>
                        <div className="avg-item">
                            <span className="avg-label">{t('sessions.avgAdviserScore')}</span>
                            <span className="avg-value">{Math.round(sessions.reduce((total, session) => total + Number(JSON.parse(session.reports?.adviser?.content).advisor_performance_score), 0) / sessions.length)}%</span>
                        </div>
                    </div>} */}
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
    navigate,
    t,
    i18n
}) {
    // Reports are already attached to the session object
    const reportsByType = session.reports || {};

    return (
        <div className="session-card">
            <div className="session-header">
                <div className="header-left">
                    <h2 className="session-title">{session.title}</h2>
                    <div className="session-meta">
                        <div className="meta-item">
                            <Calendar size={14} />
                            <span>{formatDate(session.created_at)}</span>
                        </div>

                        {session.duration && (
                            <div className="meta-item">
                                <Clock size={14} />
                                <span>{Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}</span>
                            </div>
                        )}

                        <div className="meta-item">
                            <FileAudio size={14} />
                            <span className="file-name">{session.file_name}</span>
                        </div>

                        <div className="meta-item file-size">
                            <span>{(session.file_size / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                    </div>
                </div>

                <div className={`session-status ${getStatusClass(session.status)}`}>
                    {session.status === 'completed' && (
                        <div className="completed-badge">
                            <FileCheck size={18} />
                            <span className="completed-text">{getStatusTranslation(session.status)}</span>
                        </div>
                    )}
                    {session.status !== 'completed' && getStatusTranslation(session.status)}
                </div>
            </div>

            <div className="session-content">

                {/* Client Section */}
                <div className="participant-section client-section">
                    <div className="participant-header">
                        <User size={16} />
                        <span className="participant-title">{t('sessions.client')}</span>
                    </div>
                    <div className="participant-info">
                        <div className="participant-name">{session.client?.name || t('sessions.unknownClient')}</div>
                        {session.client?.email && (
                            <div className="participant-email">{session.client.email}</div>
                        )}
                        {session.client?.metadata?.business_domain && (
                            <div className="participant-detail">
                                <Building size={14} />
                                <span>{session.client.metadata.business_domain}</span>
                            </div>
                        )}
                    </div>

                    {/* Entrepreneur Score from Adviser Report */}
                    {reportsByType.adviser && reportsByType.adviser.content && (
                        <div className="performance-scores">
                            {(() => {
                                // Parse content if it's a string
                                let content = reportsByType.adviser.content;
                                if (typeof content === 'string') {
                                    try {
                                        content = JSON.parse(content);
                                    } catch (e) {
                                        return null;
                                    }
                                }

                                // Helper function to get score class and text
                                const getScoreInfo = (score) => {
                                    if (score >= 90) return { class: 'score-excellent', text: t('sessions.scoreExcellent') };
                                    if (score >= 75) return { class: 'score-good', text: t('sessions.scoreGood') };
                                    if (score >= 60) return { class: 'score-average', text: t('sessions.scoreAverage') };
                                    if (score >= 40) return { class: 'score-poor', text: t('sessions.scorePoor') };
                                    return { class: 'score-very-poor', text: t('sessions.scoreVeryPoor') };
                                };

                                return (
                                    <>
                                        {content.entrepreneur_readiness_score && (
                                            <div className="score-item">
                                                <div className={`score-circle ${getScoreInfo(content.entrepreneur_readiness_score).class}`}>
                                                    {content.entrepreneur_readiness_score}%
                                                </div>
                                                <div className="score-details">
                                                    <div className="score-label">{t('sessions.entrepreneurReadiness')}</div>
                                                    <div className="score-text">{getScoreInfo(content.entrepreneur_readiness_score).text}</div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Adviser Section */}
                {session.adviser && (
                    <div className="participant-section adviser-section">
                        <div className="participant-header">
                            <User size={16} />
                            <span className="participant-title">{t('sessions.adviser')}</span>
                        </div>
                        <div className="participant-info">
                            <div className="participant-name">{session.adviser.name || session.adviser.email}</div>
                            {session.adviser.email && session.adviser.name && (
                                <div className="participant-email">{session.adviser.email}</div>
                            )}
                        </div>

                        {/* Advisor Performance Score from Adviser Report */}
                        {reportsByType.adviser && reportsByType.adviser.content && (
                            <div className="performance-scores">
                                {(() => {
                                    // Parse content if it's a string
                                    let content = reportsByType.adviser.content;
                                    if (typeof content === 'string') {
                                        try {
                                            content = JSON.parse(content);
                                        } catch (e) {
                                            return null;
                                        }
                                    }

                                    // Helper function to get score class and text
                                    const getScoreInfo = (score) => {
                                        if (score >= 90) return { class: 'score-excellent', text: t('sessions.scoreExcellent') };
                                        if (score >= 75) return { class: 'score-good', text: t('sessions.scoreGood') };
                                        if (score >= 60) return { class: 'score-average', text: t('sessions.scoreAverage') };
                                        if (score >= 40) return { class: 'score-poor', text: t('sessions.scorePoor') };
                                        return { class: 'score-very-poor', text: t('sessions.scoreVeryPoor') };
                                    };

                                    return (
                                        <>
                                            {content.advisor_performance_score && (
                                                <div className="score-item">
                                                    <div className={`score-circle ${getScoreInfo(content.advisor_performance_score).class}`}>
                                                        {content.advisor_performance_score}%
                                                    </div>
                                                    <div className="score-details">
                                                        <div className="score-label">{t('sessions.advisorPerformance')}</div>
                                                        <div className="score-text">{getScoreInfo(content.advisor_performance_score).text}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )}
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
                        <span>{t('sessions.viewReports')}</span>
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