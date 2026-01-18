import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { resetPassword, clearError, selectAuth } from '../../store/authSlice';

export function ResetPassword() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isLoading, error } = useSelector(selectAuth);
    
    const token = searchParams.get('token');
    
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    useEffect(() => {
        // Clear any existing errors when component mounts
        dispatch(clearError());
        
        // Check if token exists
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate, dispatch]);

    const validatePassword = (password) => {
        const errors = [];
        
        if (password.length < 6) {
            errors.push(t('resetPassword.validation.minLength'));
        }
        if (!/[A-Z]/.test(password)) {
            errors.push(t('resetPassword.validation.uppercase'));
        }
        if (!/[a-z]/.test(password)) {
            errors.push(t('resetPassword.validation.lowercase'));
        }
        if (!/\d/.test(password)) {
            errors.push(t('resetPassword.validation.number'));
        }
        
        return errors;
    };

    const validateForm = () => {
        const errors = {};

        // Password validation
        if (!formData.password.trim()) {
            errors.password = t('resetPassword.errors.passwordRequired');
        } else {
            const passwordErrors = validatePassword(formData.password);
            if (passwordErrors.length > 0) {
                errors.password = passwordErrors[0]; // Show first error
            }
        }

        // Confirm password validation
        if (!formData.confirmPassword.trim()) {
            errors.confirmPassword = t('resetPassword.errors.confirmPasswordRequired');
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = t('resetPassword.errors.passwordMismatch');
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
            await dispatch(resetPassword({ 
                token, 
                password: formData.password 
            })).unwrap();
            setResetSuccess(true);
        } catch (err) {
            console.error('Reset password failed:', err);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const getPasswordRequirements = () => {
        const password = formData.password;
        return [
            {
                text: t('resetPassword.requirements.minLength'),
                met: password.length >= 6
            },
            {
                text: t('resetPassword.requirements.uppercase'),
                met: /[A-Z]/.test(password)
            },
            {
                text: t('resetPassword.requirements.lowercase'),
                met: /[a-z]/.test(password)
            },
            {
                text: t('resetPassword.requirements.number'),
                met: /\d/.test(password)
            }
        ];
    };

    if (resetSuccess) {
        return (
            <section className="login">
                <div className="login-container">
                    <div className="login-header">
                        <div className="success-icon">
                            <CheckCircle size={48} />
                        </div>
                        <h1>{t('resetPassword.success.title')}</h1>
                        <p>{t('resetPassword.success.message')}</p>
                    </div>

                    <div className="login-form">
                        <button 
                            type="button"
                            onClick={() => navigate('/login')}
                            className="login-button"
                        >
                            {t('resetPassword.success.loginButton')}
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="login">
            <div className="login-container">
                <div className="login-header">
                    <h1>{t('resetPassword.title')}</h1>
                    <p>{t('resetPassword.subtitle')}</p>
                </div>

                <div className="login-form">
                    {error && (
                        <div className="error-message global-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="password">{t('resetPassword.newPassword')}</label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    onKeyPress={handleKeyPress}
                                    placeholder={t('resetPassword.newPasswordPlaceholder')}
                                    className={formErrors.password ? 'error' : ''}
                                    disabled={isLoading}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {formErrors.password && (
                                <span className="error-message">{formErrors.password}</span>
                            )}
                        </div>

                        {formData.password && (
                            <div className="password-requirements">
                                <p className="requirements-title">{t('resetPassword.requirements.title')}</p>
                                <ul className="requirements-list">
                                    {getPasswordRequirements().map((req, index) => (
                                        <li key={index} className={req.met ? 'met' : 'unmet'}>
                                            <span className="requirement-icon">
                                                {req.met ? '✓' : '✗'}
                                            </span>
                                            {req.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="confirmPassword">{t('resetPassword.confirmPassword')}</label>
                            <div className="password-input-container">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    onKeyPress={handleKeyPress}
                                    placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                                    className={formErrors.confirmPassword ? 'error' : ''}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={isLoading}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {formErrors.confirmPassword && (
                                <span className="error-message">{formErrors.confirmPassword}</span>
                            )}
                        </div>

                        <button 
                            type="submit"
                            className="login-button"
                            disabled={isLoading || !formData.password || !formData.confirmPassword}
                        >
                            {isLoading ? t('resetPassword.resetting') : t('resetPassword.submit')}
                        </button>
                    </form>
                </div>

                <div className="login-footer">
                    <p>
                        <Link to="/login" className="back-link">
                            <ArrowLeft size={16} />
                            {t('resetPassword.backToLogin')}
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}
