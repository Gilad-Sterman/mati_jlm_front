import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from 'react-redux';
import { Users, UserCheck, UserX, AlertCircle, CheckCircle } from "lucide-react";
import { fetchUsers, updateUserStatus, fetchUserStats, clearError } from '../../store/userSlice';

export function AdminSettings() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    
    const { users, stats, isLoading, isUpdating, error } = useSelector(state => state.users);
    const [filter, setFilter] = useState('inactive'); // Show inactive users by default

    useEffect(() => {
        dispatch(fetchUsers());
        dispatch(fetchUserStats());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                dispatch(clearError());
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, dispatch]);

    const handleStatusToggle = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        dispatch(updateUserStatus({ userId, status: newStatus }));
    };

    const filteredUsers = users.filter(user => {
        if (filter === 'all') return true;
        return user.status === filter;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('he-IL');
    };

    return (
        <section className="admin-settings">
            <div className="settings-header">
                <div className="header-content">
                    <h1>{t('common.settings')} - {t('settings.userManagement')}</h1>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Stats Summary */}
            {stats && (
                <div className="stats-summary">
                    <div className="stat-card">
                        <Users size={24} />
                        <div>
                            <h3>{stats.total}</h3>
                            <p>{t('settings.totalUsers')}</p>
                        </div>
                    </div>
                    <div className="stat-card active">
                        <UserCheck size={24} />
                        <div>
                            <h3>{stats.active}</h3>
                            <p>{t('settings.activeUsers')}</p>
                        </div>
                    </div>
                    <div className="stat-card inactive">
                        <UserX size={24} />
                        <div>
                            <h3>{stats.inactive}</h3>
                            <p>{t('settings.inactiveUsers')}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button 
                    className={filter === 'inactive' ? 'active' : ''}
                    onClick={() => setFilter('inactive')}
                >
                    {t('settings.inactiveUsers')} ({stats?.inactive || 0})
                </button>
                <button 
                    className={filter === 'active' ? 'active' : ''}
                    onClick={() => setFilter('active')}
                >
                    {t('settings.activeUsers')} ({stats?.active || 0})
                </button>
                <button 
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    {t('settings.allUsers')} ({stats?.total || 0})
                </button>
            </div>

            {/* Users List */}
            <div className="users-section">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>{t('common.loading')}</p>
                    </div>
                ) : (
                    <div className="users-list">
                        {filteredUsers.length === 0 ? (
                            <div className="empty-state">
                                <Users size={48} />
                                <p>{t('settings.noUsersFound')}</p>
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <div key={user.id} className={`user-card ${user.status}`}>
                                    <div className="user-info">
                                        <div className="user-details">
                                            <h3>{user.name}</h3>
                                            <p className="user-email">{user.email}</p>
                                            <div className="user-meta">
                                                <span className="user-role">{t(`settings.role.${user.role}`)}</span>
                                                <span className="user-date">{t('settings.registered')}: {formatDate(user.created_at)}</span>
                                            </div>
                                        </div>
                                        <div className="user-status">
                                            <span className={`status-badge ${user.status}`}>
                                                {user.status === 'active' ? <CheckCircle size={16} /> : <UserX size={16} />}
                                                {t(`settings.status.${user.status}`)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="user-actions">
                                        <button
                                            className={`status-toggle ${user.status === 'active' ? 'deactivate' : 'activate'}`}
                                            onClick={() => handleStatusToggle(user.id, user.status)}
                                            disabled={isUpdating[user.id]}
                                        >
                                            {isUpdating[user.id] ? (
                                                <div className="spinner-small"></div>
                                            ) : user.status === 'active' ? (
                                                <>
                                                    <UserX size={16} />
                                                    {t('settings.deactivate')}
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck size={16} />
                                                    {t('settings.activate')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}   