import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail } from 'lucide-react';
import { forgotPassword, clearError, selectAuth } from '../../store/authSlice';

export function ForgotPassword() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { isLoading, error } = useSelector(selectAuth);
    
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const validateForm = () => {
        const errors = {};

        if (!email.trim()) {
            errors.email = t('forgotPassword.errors.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = t('forgotPassword.errors.emailInvalid');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        setEmail(e.target.value);
        
        // Clear field error when user starts typing
        if (formErrors.email) {
            setFormErrors({});
        }

        // Clear global error when user types
        if (error) {
            dispatch(clearError());
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await dispatch(forgotPassword(email.trim().toLowerCase())).unwrap();
            setEmailSent(true);
        } catch (err) {
            console.error('Forgot password failed:', err);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    if (emailSent) {
        return (
            <section className="login">
                <div className="login-container">
                    <div className="login-header">
                        <div className="success-icon">
                            <Mail size={48} />
                        </div>
                        <h1>{t('forgotPassword.emailSent.title')}</h1>
                        <p>{t('forgotPassword.emailSent.message', { email })}</p>
                    </div>

                    <div className="login-footer">
                        <p>
                            <Link to="/login" className="back-link">
                                <ArrowLeft size={16} />
                                {t('forgotPassword.backToLogin')}
                            </Link>
                        </p>
                        <p>
                            {t('forgotPassword.didntReceive')}{' '}
                            <button 
                                type="button"
                                onClick={() => setEmailSent(false)}
                                className="resend-link"
                            >
                                {t('forgotPassword.tryAgain')}
                            </button>
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="login">
            <div className="login-container">
                <div className="login-header">
                    <h1>{t('forgotPassword.title')}</h1>
                    <p>{t('forgotPassword.subtitle')}</p>
                </div>

                <div className="login-form">
                    {error && (
                        <div className="error-message global-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">{t('forgotPassword.email')}</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder={t('forgotPassword.emailPlaceholder')}
                                className={formErrors.email ? 'error' : ''}
                                disabled={isLoading}
                                autoFocus
                            />
                            {formErrors.email && (
                                <span className="error-message">{formErrors.email}</span>
                            )}
                        </div>

                        <button 
                            type="submit"
                            className="login-button"
                            disabled={isLoading || !email.trim()}
                        >
                            {isLoading ? t('forgotPassword.sending') : t('forgotPassword.submit')}
                        </button>
                    </form>
                </div>

                <div className="login-footer">
                    <p>
                        <Link to="/login" className="back-link">
                            <ArrowLeft size={16} />
                            {t('forgotPassword.backToLogin')}
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}
