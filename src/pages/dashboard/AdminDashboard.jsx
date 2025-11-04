import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
    Users,
    FileText,
    TrendingUp,
    Activity,
    CheckCircle,
    AlertCircle,
    Calendar,
    BarChart3,
    Settings,
    Award,
    TrendingDown,
    Star,
    UserCheck,
    Link,
    ExternalLink,
    Link2Off,
    Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
    fetchDashboardStats, 
    selectDashboardStats, 
    selectIsDashboardLoading, 
    selectDashboardError 
} from '../../store/sessionSlice';

export function AdminDashboard() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Redux selectors
    const dashboardData = useSelector(selectDashboardStats);
    const loading = useSelector(selectIsDashboardLoading);
    const error = useSelector(selectDashboardError);

    // Fetch dashboard data on component mount
    useEffect(() => {
        dispatch(fetchDashboardStats());
    }, [dispatch]);

    // Calculate stats from data
    const getStats = () => {
        if (!dashboardData) return [];

        const { totalSessions, sessionsByStatus, averageScores } = dashboardData;
        const completedSessions = sessionsByStatus.completed || 0;
        const completionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : '0.0';

        return [
            {
                icon: FileText,
                label: t('dashboard.totalSessions'),
                value: totalSessions.toLocaleString(),
                change: "+8.2%",
                trend: "up"
            },
            {
                icon: TrendingUp,
                label: t('dashboard.avgAdvisorScore'),
                value: `${averageScores.advisorPerformance}%`,
                change: "+1.5%",
                trend: "up"
            },
            {
                icon: Activity,
                label: t('dashboard.avgEntrepreneurScore'),
                value: `${averageScores.entrepreneurReadiness}%`,
                change: "+3.2%",
                trend: "up"
            }
        ];
    };

    const getScoreColor = (score) => {
        if (score >= 85) return '#22c55e'; // Green
        if (score >= 70) return '#84cc16'; // Light green
        if (score >= 60) return '#f59e0b'; // Orange
        return '#ef4444'; // Red
    };

    if (loading) {
        return (
            <section className="admin-dashboard">
                <div className="dashboard-header">
                    <h1>{t('common.dashboard')}</h1>
                    <p>{t('dashboard.loading')}</p>
                </div>
                <div className="loading-spinner">
                    <Activity size={48} className="animate-spin" />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="admin-dashboard">
                <div className="dashboard-header">
                    <h1>{t('common.dashboard')}</h1>
                    <p className="error-message">Error loading dashboard: {error}</p>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => dispatch(fetchDashboardStats())}
                >
                    {t('common.retry')}
                </button>
            </section>
        );
    }

    if (!dashboardData && !loading) {
        return (
            <section className="admin-dashboard">
                <div className="dashboard-header">
                    <h1>{t('common.dashboard')}</h1>
                    <p>No data available</p>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => dispatch(fetchDashboardStats())}
                >
                    {t('common.loadData')}
                </button>
            </section>
        );
    }

    return (
        <section className="admin-dashboard">
            <div className="dashboard-header">
                <div className="header-content">
                    <h1>{t('common.dashboard')}</h1>
                </div>
            </div>

            <div className="dashboard-content">
                {/* Stats Cards */}
                <div className="stats-grid">
                    {getStats().map((stat, index) => (
                        <div key={index} className="stat-card">
                            <div className="stat-icon">
                                <stat.icon size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                                <div className={`stat-change ${stat.trend}`}>
                                    {stat.change}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Last Sessions */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>{t('dashboard.lastSessions')}</h2>
                        <button className="btn btn-primary" onClick={() => navigate('/sessions')}>{t('dashboard.viewAllSessions')}</button>
                    </div>
                    <div className="last-sessions">
                        {dashboardData?.lastSessions?.map((session) => (
                            <div key={session.id} className="session-card">
                                <div className="session-header">
                                    <div className="session-title-section">
                                        <h4 className="session-title">{session.title}</h4>
                                        <span className="session-status">{session.status}</span>
                                    </div>
                                    <div className="session-date-time">
                                        <span className="session-date">{session.date}</span>
                                        <span className="session-time">{session.time}</span>
                                    </div>
                                </div>

                                <div className="session-participants">
                                    <div className="participant advisor">
                                        <div className="participant-info">
                                            <span className="participant-label">{t('dashboard.advisor')}</span>
                                            <span className="participant-name">{session.advisor.name}</span>
                                            {session.advisor.email && (
                                                <span className="participant-email">{session.advisor.email}</span>
                                            )}
                                        </div>
                                        <div className={`score-badge ${session.scores.advisorColor}`}>
                                            {session.scores.advisor}%
                                        </div>
                                    </div>
                                    <div className="participant client">
                                        <div className="participant-info">
                                            <span className="participant-label">{t('dashboard.client')}</span>
                                            <span className="participant-name">{session.client.name}</span>
                                            {session.client.businessDomain && (
                                                <span className="participant-domain">{session.client.businessDomain}</span>
                                            )}
                                        </div>
                                        <div className={`score-badge ${session.scores.entrepreneurColor}`}>
                                            {session.scores.entrepreneur}%
                                        </div>
                                    </div>
                                </div>

                                {/* Topics and file info hidden but data preserved */}
                                
                                <div className="session-footer">
                                    {/* Only show button for sessions with reports */}
                                    {session.scores && (session.scores.advisor > 0 || session.scores.entrepreneur > 0) && (
                                        <button 
                                            className="btn btn-sm btn-primary"
                                            onClick={() => navigate(`/reports/${session.id}`)}
                                        >
                                            {t('dashboard.viewReports')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Adviser Rankings */}
                <div className="dashboard-grid">
                    {/* Top Advisers */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <div className="header-title">
                                <Award size={20} />
                                <h3>{t('dashboard.topAdvisers')}</h3>
                            </div>
                        </div>
                        <div className="card-content">
                            <div className="advisers-list">
                                {dashboardData.topAdvisers && dashboardData.topAdvisers.length > 0 ? (
                                    dashboardData.topAdvisers.map((adviser, index) => (
                                    <div key={adviser.id} className="adviser-item top-adviser">
                                        <div className="adviser-rank">
                                            <span className="rank-number">#{index + 1}</span>
                                        </div>
                                        <div className="adviser-info">
                                            <div className="adviser-name">{adviser.name}</div>
                                            <div className="adviser-email">{adviser.email}</div>
                                            <div className="adviser-stats">
                                                <span>{adviser.totalSessions} {t('dashboard.sessions')}</span>
                                                <span>{adviser.successRate}% {t('dashboard.successRate')}</span>
                                            </div>
                                        </div>
                                        <div className="adviser-score">
                                            <div
                                                className="score-circle"
                                                style={{ backgroundColor: getScoreColor(adviser.averageScore) }}
                                            >
                                                {adviser.averageScore}%
                                            </div>
                                        </div>
                                        <button className="btn btn-primary view-adviser-sessions" onClick={() => navigate(`/sessions?adviser_id=${adviser.id}`)}>{t('dashboard.viewAdviserSessions')}</button>
                                    </div>
                                    ))
                                ) : (
                                    <div className="no-data">
                                        <p>{t('dashboard.noAdvisersData')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}