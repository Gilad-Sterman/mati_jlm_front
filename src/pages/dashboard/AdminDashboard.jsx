import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
    UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
    const { t } = useTranslation();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Demo data structure - ready for API integration
    const demoData = {
        totalSessions: 47,
        sessionsByStatus: {
            uploaded: 5,
            processing: 12,
            reports_generated: 8,
            completed: 20,
            failed: 2
        },
        averageScores: {
            advisorPerformance: 78.5,
            entrepreneurReadiness: 72.3
        },
        topAdvisers: [
            {
                id: 1,
                name: "Sarah Cohen",
                email: "sarah.cohen@example.com",
                averageScore: 92.5,
                totalSessions: 156,
                successRate: 98.1
            },
            {
                id: 2,
                name: "David Levi",
                email: "david.levi@example.com",
                averageScore: 89.2,
                totalSessions: 134,
                successRate: 96.3
            },
            {
                id: 3,
                name: "Rachel Ben-David",
                email: "rachel.bendavid@example.com",
                averageScore: 87.8,
                totalSessions: 98,
                successRate: 95.9
            }
        ],
        worstAdvisers: [
            {
                id: 4,
                name: "Michael Green",
                email: "michael.green@example.com",
                averageScore: 58.3,
                totalSessions: 67,
                successRate: 78.2
            },
            {
                id: 5,
                name: "Lisa Brown",
                email: "lisa.brown@example.com",
                averageScore: 61.7,
                totalSessions: 45,
                successRate: 82.1
            },
            {
                id: 6,
                name: "Tom Wilson",
                email: "tom.wilson@example.com",
                averageScore: 64.2,
                totalSessions: 52,
                successRate: 84.6
            }
        ]
    };

    // Simulate API call - ready for real implementation
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // TODO: Replace with real API call
                // const response = await dashboardService.getDashboardStats();
                // setDashboardData(response.data);
                
                // Simulate API delay
                setTimeout(() => {
                    setDashboardData(demoData);
                    setLoading(false);
                }, 1000);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setDashboardData(demoData); // Fallback to demo data
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Calculate stats from data
    const getStats = () => {
        if (!dashboardData) return [];
        
        const { totalSessions, sessionsByStatus, averageScores } = dashboardData;
        const completionRate = ((sessionsByStatus.completed / totalSessions) * 100).toFixed(1);
        
        return [
            { 
                icon: FileText, 
                label: t('dashboard.totalSessions'), 
                value: totalSessions.toLocaleString(), 
                change: "+8.2%", 
                trend: "up" 
            },
            { 
                icon: CheckCircle, 
                label: t('dashboard.completionRate'), 
                value: `${completionRate}%`, 
                change: "+2.1%", 
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
                    <h1>{t('dashboard.header')}</h1>
                    <p>{t('dashboard.loading')}</p>
                </div>
                <div className="loading-spinner">
                    <Activity size={48} className="animate-spin" />
                </div>
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

                {/* Session Status Breakdown */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>{t('dashboard.sessionBreakdown')}</h2>
                        <button className="btn btn-primary" onClick={() => navigate('/sessions')}>{t('dashboard.viewAllSessions')}</button>
                    </div>
                    <div className="status-breakdown">
                        {Object.entries(dashboardData.sessionsByStatus).map(([status, count]) => (
                            <div key={status} className="status-item">
                                <div className="status-info">
                                    <span className="status-label">{t(`sessions.status.${status}`)}</span>
                                    <span className="status-count">{count}</span>
                                </div>
                                <div className="status-bar">
                                    <div 
                                        className={`status-fill status-${status}`}
                                        style={{ width: `${(count / dashboardData.totalSessions) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="status-percentage">
                                    {((count / dashboardData.totalSessions) * 100).toFixed(1)}%
                                </span>
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
                                {dashboardData.topAdvisers.map((adviser, index) => (
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Worst Advisers */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <div className="header-title">
                                <TrendingDown size={20} />
                                <h3>{t('dashboard.needsImprovement')}</h3>
                            </div>
                        </div>
                        <div className="card-content">
                            <div className="advisers-list">
                                {dashboardData.worstAdvisers.map((adviser, index) => (
                                    <div key={adviser.id} className="adviser-item worst-adviser">
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}