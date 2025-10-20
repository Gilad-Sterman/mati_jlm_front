import { useTranslation } from "react-i18next";
import { Users, FileText, TrendingUp, Activity, Calendar, Settings, BarChart3, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AdminDashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Placeholder data for demo
    const stats = [
        { icon: Users, label: "Total Users", value: "1,234", change: "+12%", trend: "up" },
        { icon: FileText, label: "Sessions Today", value: "89", change: "+5%", trend: "up" },
        { icon: TrendingUp, label: "Success Rate", value: "94.2%", change: "+2.1%", trend: "up" },
        { icon: Activity, label: "Active Sessions", value: "23", change: "-3%", trend: "down" }
    ];

    const recentSessions = [
        { id: 1, client: "John Doe", adviser: "Sarah Smith", status: "completed", time: "2 hours ago" },
        { id: 2, client: "Jane Wilson", adviser: "Mike Johnson", status: "in-progress", time: "30 min ago" },
        { id: 3, client: "Bob Brown", adviser: "Lisa Davis", status: "scheduled", time: "1 hour ago" },
        { id: 4, client: "Alice Green", adviser: "Tom Wilson", status: "completed", time: "3 hours ago" }
    ];

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="status-icon completed" />;
            case 'in-progress': return <Activity className="status-icon in-progress" />;
            case 'scheduled': return <Calendar className="status-icon scheduled" />;
            default: return <AlertCircle className="status-icon" />;
        }
    };

    return (
        <section className="admin-dashboard">
            <div className="dashboard-header">
                <div className="header-content">
                    <h1>{t('common.dashboard')}</h1>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => navigate('/settings')}>
                        <Settings size={16} />
                        {t('common.settings')}
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                        <FileText size={16} />
                        {t('common.new_session')}
                    </button>
                </div>
            </div>

            <div className="dashboard-content">
                {/* Stats Cards */}
                <div className="stats-grid">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-card">
                            <div className="stat-icon">
                                <stat.icon size={24} />
                            </div>
                            <div className="stat-content">
                                <h3>{stat.value}</h3>
                                <p>{stat.label}</p>
                                <span className={`stat-change ${stat.trend}`}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="dashboard-grid">
                    {/* Recent Sessions */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>{t('dashboard.recent_sessions')}</h2>
                            <button className="btn btn-ghost">{t('common.view_all')}</button>
                        </div>
                        <div className="card-content">
                            <div className="sessions-list">
                                {recentSessions.map(session => (
                                    <div key={session.id} className="session-item">
                                        <div className="session-info">
                                            <div className="session-details">
                                                <h4>{session.client}</h4>
                                                <p>with {session.adviser}</p>
                                            </div>
                                            <div className="session-meta">
                                                <div className="session-status">
                                                    {getStatusIcon(session.status)}
                                                    <span className={`status-text ${session.status}`}>
                                                        {session.status.replace('-', ' ')}
                                                    </span>
                                                </div>
                                                <div className="session-time">
                                                    <Clock size={14} />
                                                    {session.time}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Analytics Chart Placeholder */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>Session Analytics</h2>
                            <select className="chart-filter">
                                <option>Last 7 days</option>
                                <option>Last 30 days</option>
                                <option>Last 3 months</option>
                            </select>
                        </div>
                        <div className="card-content">
                            <div className="chart-placeholder">
                                <BarChart3 size={48} />
                                <p>Chart visualization will be displayed here</p>
                                <div className="chart-mock">
                                    <div className="chart-bars">
                                        <div className="bar" style={{height: '60%'}}></div>
                                        <div className="bar" style={{height: '80%'}}></div>
                                        <div className="bar" style={{height: '45%'}}></div>
                                        <div className="bar" style={{height: '90%'}}></div>
                                        <div className="bar" style={{height: '70%'}}></div>
                                        <div className="bar" style={{height: '85%'}}></div>
                                        <div className="bar" style={{height: '65%'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>Quick Actions</h2>
                        </div>
                        <div className="card-content">
                            <div className="quick-actions">
                                <button className="action-btn">
                                    <FileText size={20} />
                                    <span>Upload Recording</span>
                                </button>
                                <button className="action-btn">
                                    <Users size={20} />
                                    <span>Manage Users</span>
                                </button>
                                <button className="action-btn">
                                    <BarChart3 size={20} />
                                    <span>View Reports</span>
                                </button>
                                <button className="action-btn">
                                    <Settings size={20} />
                                    <span>System Settings</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>System Status</h2>
                        </div>
                        <div className="card-content">
                            <div className="status-items">
                                <div className="status-item">
                                    <div className="status-indicator online"></div>
                                    <span>API Server</span>
                                    <span className="status-value">Online</span>
                                </div>
                                <div className="status-item">
                                    <div className="status-indicator online"></div>
                                    <span>Database</span>
                                    <span className="status-value">Connected</span>
                                </div>
                                <div className="status-item">
                                    <div className="status-indicator warning"></div>
                                    <span>Storage</span>
                                    <span className="status-value">85% Full</span>
                                </div>
                                <div className="status-item">
                                    <div className="status-indicator online"></div>
                                    <span>AI Processing</span>
                                    <span className="status-value">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}