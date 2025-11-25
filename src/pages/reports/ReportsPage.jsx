import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, FileText, User, Calendar, Clock, ChevronDown, ChevronUp, RefreshCw, BookOpenText, FileWarning, FileCheck, FileQuestion, Flag, ArrowDown, Download, RotateCcw, Loader2, AlertCircle, Building2, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import {
    fetchReportsForSession,
    regenerateClientReport,
    exportClientReport,
    regenerationStarted,
    regenerationCompleted,
    regenerationError,
    selectIsRegeneratingSessionReports,
    selectIsExportingSessionReports
} from '../../store/reportSlice';
import { fetchSessionById } from '../../store/sessionSlice';
import { RegenerateModal } from './components/RegenerateModal';
import { ExportReportModal } from './components/ExportReportModal';
import { OriginalTranscriptModal } from './components/OriginalTranscriptModal';
import { useAppSocket } from '../../hooks/useAppSocket';

export function ReportsPage() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(true);
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showTranscriptModal, setShowTranscriptModal] = useState(false);
    const [isSubmittingRegeneration, setIsSubmittingRegeneration] = useState(false);

    // Socket connection for regeneration events
    const { socketConnected, socketService } = useAppSocket();

    // Get reports and session data from Redux
    const reports = useSelector(state => state.reports.reportsBySession[sessionId]) || [];
    const session = useSelector(state =>
        state.sessions.currentSession?.id === sessionId
            ? state.sessions.currentSession
            : state.sessions.sessions.find(s => s.id === sessionId)
    );
    const isLoadingReports = useSelector(state => state.reports.isLoadingSession[sessionId]);
    const isLoadingSessions = useSelector(state => state.sessions.isLoading);
    const isRegeneratingReports = useSelector(selectIsRegeneratingSessionReports(sessionId));
    const isExportingReports = useSelector(selectIsExportingSessionReports(sessionId));

    // Memoize filtered reports to prevent unnecessary re-renders
    const clientReport = useMemo(() =>
        reports.find(r => r.type === 'client' && r.is_current_version),
        [reports]
    );
    const advisorReport = useMemo(() =>
        reports.find(r => r.type === 'adviser' && r.is_current_version),
        [reports]
    );

    useEffect(() => {
        if (sessionId) {
            // Fetch both reports and session data
            dispatch(fetchReportsForSession(sessionId));
            dispatch(fetchSessionById(sessionId))
                .catch((error) => {
                    console.error('fetchSessionById error:', error);
                });
        }
    }, [sessionId, dispatch]);

    useEffect(() => {
        // Only stop loading when both reports and session are loaded
        if (!isLoadingReports && !isLoadingSessions) {
            setLoading(false);
        }
    }, [isLoadingReports, isLoadingSessions]);

    // Socket event listeners for regeneration
    useEffect(() => {
        if (!socketConnected || !sessionId) return;

        const socket = socketService.socket;
        if (!socket) return;

        const handleRegenerationStarted = (data) => {
            if (data.sessionId === sessionId) {
                dispatch(regenerationStarted({ sessionId }));
                // Close modal and clear submission loading when regeneration starts
                setShowRegenerateModal(false);
                setIsSubmittingRegeneration(false);
            }
        };

        const handleRegenerationComplete = (data) => {
            if (data.sessionId === sessionId) {
                dispatch(regenerationCompleted({
                    sessionId,
                    report: data.report
                }));
                // Refresh reports to get the new version
                dispatch(fetchReportsForSession(sessionId));
            }
        };

        const handleRegenerationError = (data) => {
            console.error('❌ Regeneration error:', data);
            if (data.sessionId === sessionId) {
                dispatch(regenerationError({
                    sessionId,
                    error: data.message || 'Regeneration failed'
                }));
            }
        };

        // Add event listeners
        socket.on('report_regeneration_started', handleRegenerationStarted);
        socket.on('report_regeneration_complete', handleRegenerationComplete);
        socket.on('report_regeneration_error', handleRegenerationError);

        // Cleanup
        return () => {
            socket.off('report_regeneration_started', handleRegenerationStarted);
            socket.off('report_regeneration_complete', handleRegenerationComplete);
            socket.off('report_regeneration_error', handleRegenerationError);
        };
    }, [socketConnected, sessionId, dispatch, socketService]);

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/sessions');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('he-IL');
    };

    const formatDuration = (duration) => {
        if (!duration) return 'N/A';
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleRegenerateClick = () => {
        setShowRegenerateModal(true);
    };

    const handleRegenerateSubmit = async (notes) => {
        setIsSubmittingRegeneration(true);
        try {
            await dispatch(regenerateClientReport({ sessionId, notes })).unwrap();
            // Don't close modal here - it will be closed by socket event
            // The report will be updated via socket events
        } catch (error) {
            console.error('Failed to regenerate client report:', error);
            setIsSubmittingRegeneration(false);
            // Keep modal open to show error or allow retry
        }
    };

    const handleModalClose = () => {
        if (!isLoadingReports && !isRegeneratingReports && !isSubmittingRegeneration) {
            setShowRegenerateModal(false);
        }
    };

    const handleExportClick = () => {
        setShowExportModal(true);
    };

    const handleExportSubmit = async () => {
        try {
            await dispatch(exportClientReport({ sessionId })).unwrap();

            // Close modal and show success
            setShowExportModal(false);

            // TODO: Show success notification/toast
            alert('Report exported successfully! Session marked as completed.');

        } catch (error) {
            console.error('Failed to export report:', error);
            // TODO: Show error notification/toast
            alert(`Export failed: ${error}`);
        }
    };

    const handleExportModalClose = () => {
        if (!isExportingReports) {
            setShowExportModal(false);
        }
    };

    const handleViewTranscriptClick = () => {
        setShowTranscriptModal(true);
    };

    const handleTranscriptModalClose = () => {
        setShowTranscriptModal(false);
    };


    if (loading) {
        return (
            <div className="reports-page">
                <div className="reports-container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>{t('common.loading')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-page">
            <div className="reports-container">
                {/* Header */}
                <div className="reports-header">
                    <button className="back-button" onClick={handleBack}>
                        <ArrowLeft size={16} />
                        {t('common.back')}
                    </button>

                    <div className="session-info">
                        <div className="session-title-row">
                            <h1>{session?.title || t('reports.session')}</h1>
                            {session?.status === 'completed' && (
                                <span className="session-status-badge completed">
                                    <FileCheck size={16} />
                                    {t('reports.sessionCompleted')}
                                </span>
                            )}
                        </div>
                        <div className="session-meta">
                            <span><User size={16} /> {session?.client?.name}</span>
                            <span><Calendar size={16} /> {new Date(session?.created_at).toLocaleDateString()}</span>
                            {session?.duration && (
                                <span><Clock size={16} /> {formatDuration(session.duration)}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reports Content */}
                <div className="reports-content">
                    <div className="reports-grid">
                        {/* Client Report Section */}
                        <div className="report-section client-section">
                            <div className="report-section-header">
                                <div className="header-left">
                                    <div className="report-title-section">
                                        <h2>{t('reports.clientReport')}</h2>
                                        {clientReport?.status !== 'approved' && <span className="client-report-msg">{t('reports.clientFacing')}</span>}
                                        {!!session && <div className='client-report-client-row'>
                                            <span className="client-report-client">
                                                {t('reports.adviser')}: {session?.adviser?.name}
                                            </span>
                                            <span className="client-report-date">
                                                <Calendar size={16} />
                                                {new Date(session?.created_at).toLocaleDateString()}
                                            </span>
                                            {session?.transcription_metadata?.duration && <span className="client-report-duration">
                                                <Clock size={16} />
                                                {formatDuration(session.transcription_metadata?.duration)}
                                            </span>}
                                        </div>}
                                        <div className="report-badges">
                                            {clientReport && clientReport.version_number > 1 && (
                                                <span className="version-badge">
                                                    {t('reports.regenerated')} v{clientReport.version_number}
                                                </span>
                                            )}
                                            {clientReport && clientReport.status === 'approved' && (
                                                <span className="status-badge approved">
                                                    <FileCheck size={16} />
                                                    {t('reports.approved')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {clientReport && clientReport.status !== 'approved' && (
                                        <button
                                            className="export-pdf-button"
                                            title={t('reports.exportAsPDF')}
                                            onClick={handleExportClick}
                                            disabled={isExportingReports}
                                        >
                                            <FileText size={16} />
                                            {t('reports.exportAsPDF')}
                                        </button>
                                    )}

                                    {clientReport && clientReport.status !== 'approved' && (
                                        <button
                                            className="regenerate-button"
                                            onClick={handleRegenerateClick}
                                            title={t('reports.regenerateReport')}
                                            disabled={isLoadingReports || isRegeneratingReports}
                                        >
                                            <RefreshCw size={16} />
                                            {t('reports.regenerate')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isLoadingReports ? (
                                <div className="report-loading">
                                    <div className="spinner"></div>
                                    <p>{t('common.loading')}</p>
                                </div>
                            ) : isRegeneratingReports ? (
                                <div className="report-loading">
                                    <div className="spinner"></div>
                                    <p>{t('reports.regeneratingReport')}</p>
                                </div>
                            ) : clientReport ? (
                                <ClientReportDisplay report={clientReport} />
                            ) : (
                                <div className="no-report">
                                    <FileText size={48} />
                                    <p>{t('reports.noClientReport')}</p>
                                </div>
                            )}
                        </div>

                        {/* Advisor Report Section */}
                        <div className="report-section advisor-section">
                            <div className="report-section-header">
                                <div className="header-left">
                                    <div className="report-title-section">
                                        <h2>{t('reports.advisorReport')}</h2>
                                        <div className="report-badges">
                                            <span className="report-type-badge advisor">{t('reports.internalUse')}</span>
                                            {advisorReport && advisorReport.status === 'approved' && (
                                                <span className="status-badge approved">
                                                    <FileCheck size={16} />
                                                    {t('reports.approved')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {session?.transcription_text && (
                                    <button
                                        className="view-transcript-button"
                                        onClick={handleViewTranscriptClick}
                                        title={t('reports.viewOriginalTranscript')}
                                    >
                                        <FileText size={16} />
                                        {t('reports.viewOriginalTranscript')}
                                    </button>
                                )}
                            </div>

                            {advisorReport ? (
                                <AdvisorReportDisplay report={advisorReport} />
                            ) : (
                                <div className="no-report">
                                    <FileText size={48} />
                                    <p>{t('reports.noAdvisorReport')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Regenerate Modal */}
            <RegenerateModal
                isOpen={showRegenerateModal}
                onClose={handleModalClose}
                onRegenerate={handleRegenerateSubmit}
                isLoading={isSubmittingRegeneration}
            />

            {/* Export Modal */}
            <ExportReportModal
                isOpen={showExportModal}
                onClose={handleExportModalClose}
                onExport={handleExportSubmit}
                report={clientReport}
                session={session}
                isLoading={isExportingReports}
            />

            {/* Original Transcript Modal */}
            <OriginalTranscriptModal
                isOpen={showTranscriptModal}
                onClose={handleTranscriptModalClose}
                transcript={session?.transcription_text}
                session={session}
            />
        </div>
    );
}

// Collapsible Section Component
function CollapsibleSection({ title, children, defaultOpen = true, icon, forceOpen = null, color = 'primary' }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    // Sync internal state when forceOpen changes
    useEffect(() => {
        if (forceOpen !== null) {
            setIsOpen(forceOpen);
        }
    }, [forceOpen]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`collapsible-section ${isOpen ? 'section-open' : 'section-closed'} section-color-${color}`}>
            <button
                className="collapsible-header"
                onClick={handleToggle}
            >
                <div className="header-content">
                    <span className="header-icon">{icon}</span>
                    <h3>{title}</h3>
                </div>
                <div className={`chevron-icon ${isOpen ? 'chevron-open' : 'chevron-closed'}`}>
                    {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
            </button>
            {isOpen && (
                <div className="collapsible-content">
                    {children}
                </div>
            )}
        </div>
    );
}

// Helper function to get category icon
function getCategoryIcon(category) {
    switch (category) {
        case 'what we learned about the clients business':
            return <Building2 size={20} />;
        case 'decisions made':
            return <CheckCircle size={20} />;
        case 'opportunities/risks or concerns that came up':
            return <AlertTriangle size={20} />;
        default:
            return <BookOpenText size={20} />;
    }
}

// Helper function to get category translation key
function getCategoryTranslationKey(category) {
    switch (category) {
        case 'what we learned about the clients business':
            return 'reports.categoryBusiness';
        case 'decisions made':
            return 'reports.categoryDecisions';
        case 'opportunities/risks or concerns that came up':
            return 'reports.categoryOpportunities';
        default:
            return 'reports.categoryOther';
    }
}

// Helper function to get status icon
function getStatusIcon(status) {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'הושלם':
            return <CheckCircle size={16} />;
        case 'in progress':
        case 'בתהליך':
            return <Clock size={16} />;
        case 'open':
        case 'פתוח':
            return <AlertCircle size={16} />;
        default:
            return <FileQuestion size={16} />;
    }
}

// Helper function to get status translation key
function getStatusTranslationKey(status) {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'הושלם':
            return 'reports.statusCompleted';
        case 'in progress':
        case 'בתהליך':
            return 'reports.statusInProgress';
        case 'open':
        case 'פתוח':
            return 'reports.statusOpen';
        default:
            return 'reports.statusUnknown';
    }
}

// Helper function to get status CSS class
function getStatusClass(status) {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'הושלם':
            return 'status-completed';
        case 'in progress':
        case 'בתהליך':
            return 'status-in-progress';
        case 'open':
        case 'פתוח':
            return 'status-open';
        default:
            return 'status-unknown';
    }
}

// Helper function to render insights grouped by category
function renderInsightsByCategory(insights, t) {
    // Group insights by category
    const groupedInsights = insights.reduce((acc, insight) => {
        const category = insight.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(insight);
        return acc;
    }, {});

    return Object.entries(groupedInsights).map(([category, categoryInsights]) => (
        <div className="category-group" key={category}>
            <div className="category-header">
                <div className="category-icon">
                    {getCategoryIcon(category)}
                </div>
                <h3 className="category-title">
                    {t(getCategoryTranslationKey(category))}
                </h3>
                <span className="insights-count">
                    {categoryInsights.length} {categoryInsights.length === 1 ? t('reports.insight') : t('reports.insights')}
                </span>
            </div>
            <div className="category-insights">
                {categoryInsights.map((insight, index) => (
                    <div className="insight-card" key={index}>
                        <div className="insight-content">
                            <p>{insight.content}</p>
                        </div>
                        {insight.supporting_quotes && insight.supporting_quotes.length > 0 && (
                            <div className="quotes-section">
                                <h5>{t('reports.supportingQuotes')}</h5>
                                <ul className="quotes-list">
                                    {insight.supporting_quotes.map((quote, quoteIndex) => (
                                        <li key={quoteIndex} className="quote-item">"{quote}"</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    ));
}

// Client Report Display Component
function ClientReportDisplay({ report }) {
    const { t } = useTranslation();
    const [allExpanded, setAllExpanded] = useState(true); // Default to expanded since sections default to open

    if (!report.content) return null;

    let content;
    try {
        content = typeof report.content === 'string' ? JSON.parse(report.content) : report.content;
    } catch (error) {
        console.error('Error parsing client report content:', error);
        return <div className="error-message">{t('reports.errorParsingReport')}</div>;
    }

    const handleExpandAllClick = () => {
        setAllExpanded(!allExpanded);
    };

    // Detect if this is the new report structure (has key_insights and action_items)
    const isNewStructure = content.key_insights && content.action_items;

    return (
        <div className="client-report-content">
            <button
                className="expand-all-button"
                title={allExpanded ? t('reports.collapseAll') : t('reports.expandAll')}
                onClick={handleExpandAllClick}
            >
                {allExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {allExpanded ? t('reports.collapseAll') : t('reports.expandAll')}
            </button>

            {isNewStructure ? (
                // NEW REPORT STRUCTURE
                <>
                    {/* Key Insights Section */}
                    {content.key_insights && content.key_insights.length > 0 && (
                        <CollapsibleSection title={t('reports.keyInsights')} defaultOpen={true} icon={<BookOpenText size={20} />} forceOpen={allExpanded} color="blue">
                            <div className="insights-by-category">
                                {renderInsightsByCategory(content.key_insights, t)}
                            </div>
                        </CollapsibleSection>
                    )}

                    {/* Action Items Section */}
                    {content.action_items && content.action_items.length > 0 && (
                        <CollapsibleSection title={t('reports.actionItems')} defaultOpen={true} icon={<Flag size={20} />} forceOpen={allExpanded} color="green">
                            <div className="action-items-grid">
                                {content.action_items.map((item, index) => (
                                    <div className="action-item-card" key={index}>
                                        <div className="action-card-header">
                                            <h4 className="action-task">{item.task}</h4>
                                            <span className={`action-status-badge ${getStatusClass(item.status)}`}>
                                                {getStatusIcon(item.status)}
                                                {item.status ? t(getStatusTranslationKey(item.status)) : t('reports.statusUnknown')}
                                            </span>
                                        </div>
                                        <div className="action-card-body">
                                            <div className="action-detail-row">
                                                <div className="action-detail">
                                                    <Users size={16} />
                                                    <span className="detail-label">{t('reports.owner')}:</span>
                                                    <span className="detail-value">{item.owner || t('reports.notSpecified')}</span>
                                                </div>
                                            </div>
                                            <div className="action-detail-row">
                                                <div className="action-detail">
                                                    <Calendar size={16} />
                                                    <span className="detail-label">{t('reports.deadline')}:</span>
                                                    <span className={`detail-value ${!item.deadline ? 'no-deadline' : ''}`}>
                                                        {item.deadline || t('reports.notSpecified')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}
                </>
            ) : (
                // OLD REPORT STRUCTURE (backwards compatibility)
                <>
                    {/* Executive Summary */}
                    {content.executive_summary && (
                        <CollapsibleSection title={t('reports.sessionSummary')} defaultOpen={true} icon={<BookOpenText size={20} />} forceOpen={allExpanded} color="blue">
                            <p>{content.executive_summary}</p>
                        </CollapsibleSection>
                    )}

                    {/* Entrepreneur Needs */}
                    {content.entrepreneur_needs?.length > 0 && (
                        <CollapsibleSection title={t('reports.entrepreneurNeeds')} defaultOpen={true} icon={<FileQuestion size={20} />} forceOpen={allExpanded} color="orange">
                            {content.entrepreneur_needs.map((need, index) => (
                                <div className="need-item" key={index}>
                                    <h4>{t('reports.needConceptualization')}: {need.need_conceptualization}</h4>
                                    <p>{need.need_explanation}</p>
                                    {need.supporting_quotes && need.supporting_quotes.length > 0 && (
                                        <div className="quotes-section">
                                            <h5>{t('reports.supportingQuotes')}</h5>
                                            <ul className="quotes-list">
                                                {need.supporting_quotes.map((quote, index) => (
                                                    <li key={index} className="quote-item">"{quote}"</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {content.entrepreneur_needs.need_explanation && (
                                <div className="need-item">
                                    <h4>{t('reports.needExplanation')}</h4>
                                    <p>{content.entrepreneur_needs.need_explanation}</p>
                                </div>
                            )}
                            {content.entrepreneur_needs.supporting_quotes && content.entrepreneur_needs.supporting_quotes.length > 0 && (
                                <div className="quotes-section">
                                    <h4>{t('reports.supportingQuotes')}</h4>
                                    <ul className="quotes-list">
                                        {content.entrepreneur_needs.supporting_quotes.map((quote, index) => (
                                            <li key={index} className="quote-item">"{quote}"</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CollapsibleSection>
                    )}

                    {content.entrepreneur_needs && content.entrepreneur_needs.need_conceptualization && (
                        <CollapsibleSection title={t('reports.entrepreneurNeeds')} defaultOpen={true} icon={<FileQuestion size={20} />} forceOpen={allExpanded} color="orange">
                            {content.entrepreneur_needs.need_conceptualization && (
                                <div className="need-item">
                                    <h4>{t('reports.needConceptualization')}</h4>
                                    <p>{content.entrepreneur_needs.need_conceptualization}</p>
                                </div>
                            )}
                            {content.entrepreneur_needs.need_explanation && (
                                <div className="need-item">
                                    <h4>{t('reports.needExplanation')}</h4>
                                    <p>{content.entrepreneur_needs.need_explanation}</p>
                                </div>
                            )}
                            {content.entrepreneur_needs.supporting_quotes && content.entrepreneur_needs.supporting_quotes.length > 0 && (
                                <div className="quotes-section">
                                    <h4>{t('reports.supportingQuotes')}</h4>
                                    <ul className="quotes-list">
                                        {content.entrepreneur_needs.supporting_quotes.map((quote, index) => (
                                            <li key={index} className="quote-item">"{quote}"</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CollapsibleSection>
                    )}

                    {/* Advisor Solutions */}
                    {content.advisor_solutions?.length > 0 && (
                        <CollapsibleSection title={t('reports.advisorSolutions')} defaultOpen={true} icon={<FileQuestion size={20} />} forceOpen={allExpanded} color="purple">
                            {content.advisor_solutions.map((solution, index) => (
                                <div className="need-item" key={index}>
                                    <h4>{t('reports.solutionConceptualization')}: {solution.solution_conceptualization}</h4>
                                    <p>{solution.solution_explanation}</p>
                                    {solution.supporting_quotes && solution.supporting_quotes.length > 0 && (
                                        <div className="quotes-section">
                                            <h5>{t('reports.supportingQuotes')}</h5>
                                            <ul className="quotes-list">
                                                {solution.supporting_quotes.map((quote, index) => (
                                                    <li key={index} className="quote-item">"{quote}"</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {content.advisor_solutions.solution_explanation && (
                                <div className="need-item">
                                    <h4>{t('reports.solutionExplanation')}</h4>
                                    <p>{content.advisor_solutions.solution_explanation}</p>
                                </div>
                            )}
                            {content.entrepreneur_needs.supporting_quotes && content.entrepreneur_needs.supporting_quotes.length > 0 && (
                                <div className="quotes-section">
                                    <h4>{t('reports.supportingQuotes')}</h4>
                                    <ul className="quotes-list">
                                        {content.entrepreneur_needs.supporting_quotes.map((quote, index) => (
                                            <li key={index} className="quote-item">"{quote}"</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CollapsibleSection>
                    )}

                    {content.advisor_solutions && content.advisor_solutions.solution_conceptualization && (
                        <CollapsibleSection title={t('reports.advisorSolutions')} defaultOpen={true} icon={<FileCheck size={20} />} forceOpen={allExpanded} color="purple">
                            {content.advisor_solutions.solution_conceptualization && (
                                <div className="solution-item">
                                    <h4>{t('reports.solutionConceptualization')}</h4>
                                    <p>{content.advisor_solutions.solution_conceptualization}</p>
                                </div>
                            )}
                            {content.advisor_solutions.solution_explanation && (
                                <div className="solution-item">
                                    <h4>{t('reports.solutionExplanation')}</h4>
                                    <p>{content.advisor_solutions.solution_explanation}</p>
                                </div>
                            )}
                            {content.advisor_solutions.supporting_quotes && content.advisor_solutions.supporting_quotes.length > 0 && (
                                <div className="quotes-section">
                                    <h4>{t('reports.supportingQuotes')}</h4>
                                    <ul className="quotes-list">
                                        {content.advisor_solutions.supporting_quotes.map((quote, index) => (
                                            <li key={index} className="quote-item">"{quote}"</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CollapsibleSection>
                    )}

                    {/* Agreed Actions */}
                    {content.agreed_actions && (
                        <CollapsibleSection title={t('reports.agreedActions')} defaultOpen={true} icon={<Flag size={20} />} forceOpen={allExpanded} color="green">
                            {content.agreed_actions.immediate_actions && content.agreed_actions.immediate_actions.length > 0 && (
                                <div className="actions-item">
                                    <h4>{t('reports.immediateActions')}</h4>
                                    <ul className="actions-list">
                                        {content.agreed_actions.immediate_actions.map((action, index) => (
                                            <li key={index}>{action}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {content.agreed_actions.concrete_recommendation && (
                                <div className="actions-item">
                                    <h4>{t('reports.concreteRecommendation')}</h4>
                                    <p>{content.agreed_actions.concrete_recommendation}</p>
                                </div>
                            )}
                        </CollapsibleSection>
                    )}
                </>
            )}
        </div>
    );
}

// Helper function to get score description and color
function getScoreInfo(score) {
    if (score >= 90) return { text: 'Excellent', color: '#2ecc71', bgColor: 'rgba(46, 204, 113, 0.1)' };
    if (score >= 80) return { text: 'Very Good', color: '#27ae60', bgColor: 'rgba(39, 174, 96, 0.1)' };
    if (score >= 70) return { text: 'Good', color: '#f1c40f', bgColor: 'rgba(241, 196, 15, 0.1)' };
    if (score >= 60) return { text: 'Fair', color: '#e67e22', bgColor: 'rgba(230, 126, 34, 0.1)' };
    if (score >= 50) return { text: 'Poor', color: '#e74c3c', bgColor: 'rgba(231, 76, 60, 0.1)' };
    return { text: 'Very Poor', color: '#c0392b', bgColor: 'rgba(192, 57, 43, 0.1)' };
}

// Advisor Report Display Component
function AdvisorReportDisplay({ report }) {
    const { t } = useTranslation();
    const [allExpanded, setAllExpanded] = useState(true);

    if (!report.content) return null;

    let content;
    try {
        content = typeof report.content === 'string' ? JSON.parse(report.content) : report.content;
    } catch (error) {
        console.error('Error parsing advisor report content:', error);
        return <div className="error-message">{t('reports.errorParsingReport')}</div>;
    }

    const handleExpandAllClick = () => {
        setAllExpanded(!allExpanded);
    };

    // Detect if this is new structure or legacy structure
    const isNewStructure = content.client_readiness_score !== undefined && content.listening !== undefined;

    // Helper function to render star rating
    const renderStars = (score) => {
        const numScore = Number(score);
        return '⭐'.repeat(numScore) + '☆'.repeat(5 - numScore);
    };

    return (
        <div className="advisor-report-content">
            <button
                className="expand-all-button"
                title={allExpanded ? t('reports.collapseAll') : t('reports.expandAll')}
                onClick={handleExpandAllClick}
            >
                {allExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {allExpanded ? t('reports.collapseAll') : t('reports.expandAll')}
            </button>

            {isNewStructure ? (
                // NEW STRUCTURE
                <>
                    {/* Section 1: General Performance */}
                    <CollapsibleSection
                        title={t('reports.generalPerformance')}
                        defaultOpen={true}
                        forceOpen={allExpanded}
                        color="purple"
                    >
                        {/* Topics Covered Breakdown */}
                        {content.topics_covered && (
                            <div className="topics-breakdown">
                                <h4>{t('reports.topicsCovered')}</h4>
                                <div className="topics-bar-container">
                                    <div className="topics-bar-visual">
                                        {Number(content.topics_covered.introducing_advisor_percentage) > 0 && (
                                            <div
                                                className="topic-segment advisor-intro"
                                                style={{ width: `${content.topics_covered.introducing_advisor_percentage}%` }}
                                                title={`${t('reports.introducingAdvisor')}: ${content.topics_covered.introducing_advisor_percentage}%`}
                                            >
                                                {Number(content.topics_covered.introducing_advisor_percentage) >= 10 && (
                                                    <span className="segment-label">{content.topics_covered.introducing_advisor_percentage}%</span>
                                                )}
                                            </div>
                                        )}
                                        {Number(content.topics_covered.introducing_mati_percentage) > 0 && (
                                            <div
                                                className="topic-segment mati-intro"
                                                style={{ width: `${content.topics_covered.introducing_mati_percentage}%` }}
                                                title={`${t('reports.introducingMati')}: ${content.topics_covered.introducing_mati_percentage}%`}
                                            >
                                                {Number(content.topics_covered.introducing_mati_percentage) >= 10 && (
                                                    <span className="segment-label">{content.topics_covered.introducing_mati_percentage}%</span>
                                                )}
                                            </div>
                                        )}
                                        {Number(content.topics_covered.opening_percentage) > 0 && (
                                            <div
                                                className="topic-segment opening"
                                                style={{ width: `${content.topics_covered.opening_percentage}%` }}
                                                title={`${t('reports.opening')}: ${content.topics_covered.opening_percentage}%`}
                                            >
                                                {Number(content.topics_covered.opening_percentage) >= 10 && (
                                                    <span className="segment-label">{content.topics_covered.opening_percentage}%</span>
                                                )}
                                            </div>
                                        )}
                                        {Number(content.topics_covered.collecting_info_percentage) > 0 && (
                                            <div
                                                className="topic-segment collecting"
                                                style={{ width: `${content.topics_covered.collecting_info_percentage}%` }}
                                                title={`${t('reports.collectingInfo')}: ${content.topics_covered.collecting_info_percentage}%`}
                                            >
                                                {Number(content.topics_covered.collecting_info_percentage) >= 10 && (
                                                    <span className="segment-label">{content.topics_covered.collecting_info_percentage}%</span>
                                                )}
                                            </div>
                                        )}
                                        {Number(content.topics_covered.actual_content_percentage) > 0 && (
                                            <div
                                                className="topic-segment content"
                                                style={{ width: `${content.topics_covered.actual_content_percentage}%` }}
                                                title={`${t('reports.actualContent')}: ${content.topics_covered.actual_content_percentage}%`}
                                            >
                                                {Number(content.topics_covered.actual_content_percentage) >= 10 && (
                                                    <span className="segment-label">{content.topics_covered.actual_content_percentage}%</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="topics-legend">
                                        <div className="legend-item">
                                            <span className="legend-dot advisor-intro"></span>
                                            <span>{t('reports.introducingAdvisor')} ({content.topics_covered.introducing_advisor_percentage}%)</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-dot mati-intro"></span>
                                            <span>{t('reports.introducingMati')} ({content.topics_covered.introducing_mati_percentage}%)</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-dot opening"></span>
                                            <span>{t('reports.opening')} ({content.topics_covered.opening_percentage}%)</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-dot collecting"></span>
                                            <span>{t('reports.collectingInfo')} ({content.topics_covered.collecting_info_percentage}%)</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-dot content"></span>
                                            <span>{t('reports.actualContent')} ({content.topics_covered.actual_content_percentage}%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Client Readiness Score */}
                        <div className="performance-card" style={{
                            backgroundColor: getScoreInfo(content.client_readiness_score).bgColor,
                            borderLeft: `4px solid ${getScoreInfo(content.client_readiness_score).color}`
                        }}>
                            <div className="card-header">
                                <h4>{t('reports.clientReadiness')}</h4>
                            </div>
                            <div className="card-content">
                                <div className="score-display">
                                    <span className="score-number" style={{ color: getScoreInfo(content.client_readiness_score).color }}>
                                        {content.client_readiness_score}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Score Breakdown */}
                        <div className="score-breakdown">
                            <h4>{t('reports.scoreBreakdown')}</h4>
                            <div className="score-breakdown-content entrepreneur">
                                <ul>
                                    <li>
                                        <span>{t('reports.entrepreneurBreakdown1')}: 25%</span>
                                    </li>
                                    <li>
                                        <span>{t('reports.entrepreneurBreakdown2')}: 25%</span>
                                    </li>
                                    <li>
                                        <span>{t('reports.entrepreneurBreakdown3')}: 25%</span>
                                    </li>
                                    <li>
                                        <span>{t('reports.entrepreneurBreakdown4')}: 25%</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Section 2: Advisor Quality Metrics */}
                    <CollapsibleSection
                        title={t('reports.advisorQualityMetrics')}
                        defaultOpen={true}
                        forceOpen={allExpanded}
                        color="teal"
                    >
                        <div className="quality-metrics-grid">
                            {/* Listening */}
                            {content.listening && (
                                <div className="quality-metric-card">
                                    <div className="metric-header">
                                        <h4>{t('reports.listening')}</h4>
                                        <div className="metric-score">
                                            <span className="stars">{renderStars(content.listening.score)}</span>
                                            <span className="score-text">{content.listening.score}/5</span>
                                        </div>
                                    </div>
                                    <div className="metric-description">
                                        <p>{content.listening.description}</p>
                                    </div>
                                    {content.listening.supporting_quote && (
                                        <div className="metric-quote">
                                            <span className="quote-icon">💬</span>
                                            <p>"{content.listening.supporting_quote}"</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Clarity */}
                            {content.clarity && (
                                <div className="quality-metric-card">
                                    <div className="metric-header">
                                        <h4>{t('reports.clarity')}</h4>
                                        <div className="metric-score">
                                            <span className="stars">{renderStars(content.clarity.score)}</span>
                                            <span className="score-text">{content.clarity.score}/5</span>
                                        </div>
                                    </div>
                                    <div className="metric-description">
                                        <p>{content.clarity.description}</p>
                                    </div>
                                    {content.clarity.supporting_quote && (
                                        <div className="metric-quote">
                                            <span className="quote-icon">💬</span>
                                            <p>"{content.clarity.supporting_quote}"</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Continuation */}
                            {content.continuation && (
                                <div className="quality-metric-card">
                                    <div className="metric-header">
                                        <h4>{t('reports.continuation')}</h4>
                                        <div className="metric-score">
                                            <span className="stars">{renderStars(content.continuation.score)}</span>
                                            <span className="score-text">{content.continuation.score}/5</span>
                                        </div>
                                    </div>
                                    <div className="metric-description">
                                        <p>{content.continuation.description}</p>
                                    </div>
                                    {content.continuation.supporting_quote && (
                                        <div className="metric-quote">
                                            <span className="quote-icon">💬</span>
                                            <p>"{content.continuation.supporting_quote}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>

                    {/* Section 3: Things to Preserve */}
                    {content.things_to_preserve && content.things_to_preserve.length > 0 && (
                        <CollapsibleSection
                            title={t('reports.thingsToPreserve')}
                            defaultOpen={true}
                            forceOpen={allExpanded}
                            color="green"
                        >
                            <div className="feedback-section positive">
                                {content.things_to_preserve.map((item, index) => (
                                    <div className="feedback-item" key={index}>
                                        <div className="feedback-header">
                                            <span className="feedback-icon">✅</span>
                                            <h5>{item.title}</h5>
                                        </div>
                                        <p className="feedback-description">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}

                    {/* Section 4: Needs Improvement */}
                    {content.needs_improvement && content.needs_improvement.length > 0 && (
                        <CollapsibleSection
                            title={t('reports.needsImprovement')}
                            defaultOpen={true}
                            forceOpen={allExpanded}
                            color="orange"
                        >
                            <div className="feedback-section improvement">
                                {content.needs_improvement.map((item, index) => (
                                    <div className="feedback-item" key={index}>
                                        <div className="feedback-header">
                                            <span className="feedback-icon">💡</span>
                                            <h5>{item.title}</h5>
                                        </div>
                                        <p className="feedback-description">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}
                </>
            ) : (
                // LEGACY STRUCTURE
                <>
                    {/* Speaking Time Analysis */}
                    <CollapsibleSection title={t('reports.speakingTimeAnalysis')} defaultOpen={true} forceOpen={allExpanded} color="purple">
                        <div className="speaking-time-visual">
                            <div className="duration-info">
                                <h4>{t('reports.duration')}: {content.conversation_duration.split('.')[0]} דקות</h4>
                            </div>
                            <div className="speaking-comparison">
                                <div className="speaker-section advisor-section">
                                    <div className="speaker-info">
                                        <span className="speaker-label">{t('reports.advisorSpeaking')}</span>
                                        <span className="speaker-percentage">{content.advisor_speaking_percentage}%</span>
                                    </div>
                                    <div className="speaker-bar">
                                        <div
                                            className="speaker-fill advisor-fill"
                                            style={{ width: `${content.advisor_speaking_percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="speaker-section entrepreneur-section">
                                    <div className="speaker-info">
                                        <span className="speaker-label">{t('reports.entrepreneurSpeaking')}</span>
                                        <span className="speaker-percentage">{content.entrepreneur_speaking_percentage}%</span>
                                    </div>
                                    <div className="speaker-bar">
                                        <div
                                            className="speaker-fill entrepreneur-fill"
                                            style={{ width: `${content.entrepreneur_speaking_percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Main Topics */}
                    {content.main_topics && content.main_topics.length > 0 && (
                        <CollapsibleSection title={t('reports.level2Insights')} defaultOpen={true} forceOpen={allExpanded} color="teal">
                            <div className="topics-tags">
                                {content.main_topics.map((topic, index) => (
                                    <span key={index} className="topic-tag">{topic}</span>
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}

                    {/* Performance Scores */}
                    <CollapsibleSection title={t('reports.level3Recommendations')} defaultOpen={true} forceOpen={allExpanded} color="pink">
                        <div className="performance-cards">
                            <div className="performance-card" style={{
                                backgroundColor: getScoreInfo(content.entrepreneur_readiness_score).bgColor,
                                borderLeft: `4px solid ${getScoreInfo(content.entrepreneur_readiness_score).color}`
                            }}>
                                <div className="card-header">
                                    <h4>{t('reports.entrepreneurReadiness')}</h4>
                                </div>
                                <div className="card-content">
                                    <div className="score-display">
                                        <span className="score-number" style={{ color: getScoreInfo(content.entrepreneur_readiness_score).color }}>
                                            {content.entrepreneur_readiness_score}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="performance-card" style={{
                                backgroundColor: getScoreInfo(content.advisor_performance_score).bgColor,
                                borderLeft: `4px solid ${getScoreInfo(content.advisor_performance_score).color}`
                            }}>
                                <div className="card-header">
                                    <h4>{t('reports.advisorPerformance')}</h4>
                                </div>
                                <div className="card-content">
                                    <div className="score-display">
                                        <span className="score-number" style={{ color: getScoreInfo(content.advisor_performance_score).color }}>
                                            {content.advisor_performance_score}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="score-breakdown">
                            <h4>{t('reports.scoreBreakdown')}</h4>
                            <div className="score-breakdown-content adviser">
                                <h5>{t('reports.advisorPerformance')}</h5>
                                <ul>
                                    <li>
                                        <span>{t('reports.adviserBreakdown1')}: 25%</span>
                                    </li>
                                    <li>
                                        <span>{t('reports.adviserBreakdown2')}: 25%</span>
                                    </li>
                                    <li>
                                        <span>{t('reports.adviserBreakdown3')}: 25%</span>
                                    </li>
                                    <li>
                                        <span>{t('reports.adviserBreakdown4')}: 25%</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="score-breakdown-content entrepreneur">
                                <h5>{t('reports.entrepreneurReadiness')}</h5>
                                <ul>
                                    <li>
                                        <span>{t('reports.entrepreneurBreakdown1')}: 25%</span>
                                    </li>
                                    <li>
                                        <span>{t('reports.entrepreneurBreakdown2')}: 25%</span>
                                    </li>
                                    <li>
                                        <span>{t('reports.entrepreneurBreakdown3')}: 25%</span>
                                    </li>
                                    <li>
                                        <span>{t('reports.entrepreneurBreakdown4')}: 25%</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Feedback Section */}
                    <CollapsibleSection title={t('reports.level1Structure')} defaultOpen={true} forceOpen={allExpanded} color="indigo">
                        {/* Points to Preserve */}
                        {content.points_to_preserve?.length > 0 && (
                            <div className="feedback-section">
                                <h4>{t('reports.pointsToPreserve')}</h4>
                                <div className="points-content positive">
                                    {content.points_to_preserve.map((point, index) => (
                                        <div className="points-item" key={index}>
                                            <ul>
                                                <li>
                                                    <span className="title">{point.title}:</span>
                                                    <span>{point.description}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {typeof content.points_to_preserve === 'object' && content.points_to_preserve.demonstrations && (
                            <div className="feedback-section">
                                <h4>{t('reports.pointsToPreserve')}</h4>
                                <div className="points-content positive">
                                    <div className="points-item">
                                        <ul>
                                            {content.points_to_preserve.demonstrations.map((point, index) => (
                                                <li key={index}>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Points for Improvement */}
                        {content.points_for_improvement && (
                            <div className="feedback-section">
                                <h4>{t('reports.pointsForImprovement')}</h4>
                                <div className="points-content improvement">
                                    {content.points_for_improvement.recommendations && content.points_for_improvement.recommendations.length > 0 && (
                                        <div className="points-item">
                                            <h5>{t('reports.recommendations')}</h5>
                                            <ul>
                                                {content.points_for_improvement.recommendations.map((rec, index) => (
                                                    <li key={index}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {content.points_for_improvement.missed_opportunities && content.points_for_improvement.missed_opportunities.length > 0 && (
                                        <div className="points-item">
                                            <h5>{t('reports.missedOpportunities')}</h5>
                                            <ul>
                                                {content.points_for_improvement.missed_opportunities.map((opp, index) => (
                                                    <li key={index}>{opp}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CollapsibleSection>
                </>
            )}
        </div>
    );
}