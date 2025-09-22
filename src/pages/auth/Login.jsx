import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginUser, clearError, selectAuth } from '../../store/authSlice';
import authService from '../../services/authService';

export function Login() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isLoading, error, user } = useSelector(selectAuth);
    
    // Get the page user was trying to access before being redirected to login
    const from = location.state?.from?.pathname || null;

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [formErrors, setFormErrors] = useState({});

    // Track if this is the initial render to avoid navigation on mount
    const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);
    
    // Redirect if already authenticated (but not on initial mount unless truly authenticated)
    useEffect(() => {
        // Only navigate if user is truly authenticated AND we've attempted login OR this is a genuine auth state
        if (isAuthenticated && user && (hasAttemptedLogin || authService.getToken())) {
            // If user was trying to access a specific page, redirect there (if authorized)
            if (from) {
                // Check if user has access to the requested page
                const isAdminRoute = from.startsWith('/dashboard') || from.startsWith('/settings');
                if (isAdminRoute && user.role !== 'admin') {
                    // Non-admin trying to access admin route, redirect to their default page
                    navigate(user.role === 'adviser' ? '/upload' : '/');
                } else {
                    // User has access, redirect to requested page
                    navigate(from);
                }
            } else {
                // Default role-based navigation
                if (user.role === 'admin') {
                    navigate('/dashboard');
                } else if (user.role === 'adviser') {
                    navigate('/upload');
                }
            }
        }
    }, [isAuthenticated, user, navigate, from, hasAttemptedLogin]);

    // Clear errors only on component mount, not on every render
    useEffect(() => {
        dispatch(clearError());
    }, []); // Empty dependency array - only run once on mount

    const validateForm = () => {
        const errors = {};

        // Email validation
        if (!formData.email.trim()) {
            errors.email = t('login.errors.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = t('login.errors.emailInvalid');
        }

        // Password validation
        if (!formData.password.trim()) {
            errors.password = t('login.errors.passwordRequired');
        } else if (formData.password.length < 6) {
            errors.password = t('login.errors.passwordMinLength');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear field error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Only clear global error when user has typed substantial input
        if (error && value.length > 2) {
            dispatch(clearError());
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        setHasAttemptedLogin(true);

        if (!validateForm()) {
            console.log('Form validation failed');
            return;
        }

        try {
            const result = await dispatch(loginUser(formData)).unwrap();
            // Navigation will be handled by useEffect
        } catch (err) {
            // Error is handled by Redux, don't clear it
            console.error('Login failed:', err);
            // Make sure the error persists by not doing anything that might clear it
        }
    };

    return (
        <section className="login">
            <div className="login-container">
                <div className="login-header">
                    <h1>{t('login.title')} מט"י</h1>
                    <p>{t('login.subtitle')}</p>
                </div>

                <div className="login-form">
                    {error && (
                        <div className="error-message global-error">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">{t('login.email')}</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={t('login.emailPlaceholder')}
                            className={formErrors.email ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {formErrors.email && (
                            <span className="error-message">{formErrors.email}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t('login.password')}</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={t('login.passwordPlaceholder')}
                            className={formErrors.password ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {formErrors.password && (
                            <span className="error-message">{formErrors.password}</span>
                        )}
                    </div>

                    <button 
                        type="button"
                        onClick={handleSubmit}
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? t('login.loggingIn') : t('login.submit')}
                    </button>
                </div>

                <div className="login-footer">
                    <p>{t('login.forgotPassword')}</p>
                </div>
            </div>
        </section>
    );
}