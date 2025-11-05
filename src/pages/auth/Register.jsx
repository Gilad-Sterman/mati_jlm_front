import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registerUser, clearError, selectAuth } from '../../store/authSlice';

export function Register() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, error, user } = useSelector(selectAuth);
    
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        confirmPassword: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'admin') {
                navigate('/dashboard');
            } else if (user.role === 'adviser') {
                navigate('/upload');
            }
        }
    }, [isAuthenticated, user, navigate]);

    // Clear errors on component mount
    useEffect(() => {
        dispatch(clearError());
    }, []);

    const validateForm = () => {
        const errors = {};

        // Name validation
        if (!formData.name.trim()) {
            errors.name = t('register.errors.nameRequired');
        } else if (formData.name.trim().length < 2) {
            errors.name = t('register.errors.nameMinLength');
        }

        // Email validation
        if (!formData.email.trim()) {
            errors.email = t('register.errors.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = t('register.errors.emailInvalid');
        }

        // Password validation - match backend requirements
        if (!formData.password.trim()) {
            errors.password = t('register.errors.passwordRequired');
        } else {
            const passwordErrors = [];
            if (formData.password.length < 6) {
                passwordErrors.push(t('register.errors.passwordMinLength'));
            }
            if (!/[A-Z]/.test(formData.password)) {
                passwordErrors.push(t('register.errors.passwordUppercase'));
            }
            if (!/[a-z]/.test(formData.password)) {
                passwordErrors.push(t('register.errors.passwordLowercase'));
            }
            if (!/\d/.test(formData.password)) {
                passwordErrors.push(t('register.errors.passwordNumber'));
            }
            
            if (passwordErrors.length > 0) {
                errors.password = passwordErrors[0]; // Show first error
            }
        }

        // Confirm password validation
        if (!formData.confirmPassword.trim()) {
            errors.confirmPassword = t('register.errors.confirmPasswordRequired');
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = t('register.errors.passwordMismatch');
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

        // Clear global error when user has typed substantial input
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

        if (!validateForm()) {
            return;
        }

        try {
            await dispatch(registerUser({
                email: formData.email,
                name: formData.name,
                password: formData.password
            })).unwrap();
            
            setRegistrationSuccess(true);
            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err) {
            console.error('Registration failed:', err);
        }
    };

    if (registrationSuccess) {
        return (
            <section className="login">
                <div className="login-container">
                    <div className="login-header">
                        <h1>{t('register.success.title')}</h1>
                        <p>{t('register.success.message')}</p>
                    </div>
                    <div className="success-message">
                        <p>{t('register.success.redirecting')}</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="login">
            <div className="login-container">
                <div className="login-header">
                    <h1>{t('register.title')} מט"י</h1>
                    <p>{t('register.subtitle')}</p>
                </div>

                <div className="login-form">
                    {error && (
                        <div className="error-message global-error">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="name">{t('register.name')}</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={t('register.namePlaceholder')}
                            className={formErrors.name ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {formErrors.name && (
                            <span className="error-message">{formErrors.name}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">{t('register.email')}</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={t('register.emailPlaceholder')}
                            className={formErrors.email ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {formErrors.email && (
                            <span className="error-message">{formErrors.email}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t('register.password')}</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={t('register.passwordPlaceholder')}
                            className={formErrors.password ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {formErrors.password && (
                            <span className="error-message">{formErrors.password}</span>
                        )}
                        <div className="password-requirements">
                            <p className="requirements-title">{t('register.passwordRequirements.title')}</p>
                            <ul className="requirements-list">
                                <li className={formData.password.length >= 6 ? 'valid' : 'invalid'}>
                                    {t('register.passwordRequirements.minLength')}
                                </li>
                                <li className={/[A-Z]/.test(formData.password) ? 'valid' : 'invalid'}>
                                    {t('register.passwordRequirements.uppercase')}
                                </li>
                                <li className={/[a-z]/.test(formData.password) ? 'valid' : 'invalid'}>
                                    {t('register.passwordRequirements.lowercase')}
                                </li>
                                <li className={/\d/.test(formData.password) ? 'valid' : 'invalid'}>
                                    {t('register.passwordRequirements.number')}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">{t('register.confirmPassword')}</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={t('register.confirmPasswordPlaceholder')}
                            className={formErrors.confirmPassword ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {formErrors.confirmPassword && (
                            <span className="error-message">{formErrors.confirmPassword}</span>
                        )}
                    </div>

                    <button 
                        type="button"
                        onClick={handleSubmit}
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? t('register.registering') : t('register.submit')}
                    </button>
                </div>

                <div className="login-footer">
                    <p>
                        {t('register.haveAccount')}{' '}
                        <Link to="/" className="register-link">
                            {t('register.loginLink')}
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}
