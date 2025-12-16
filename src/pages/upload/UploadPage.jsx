import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Upload, FileAudio, User, Plus, X, Check, AlertCircle, Search } from 'lucide-react';

// Redux imports
import {
    createSession,
    selectIsUploading,
    selectUploadProgress,
    selectUploadStatus,
    selectUploadMessage,
    selectCurrentUploadSession,
    selectActiveSessionId,
    selectUiState,
    selectError as selectSessionError,
    clearError as clearSessionError,
    resetUploadState,
    handleUploadStarted,
    selectProcessingStage,
    selectProcessingMessage,
    selectTranscriptionComplete,
    selectAdvisorReportGenerated,
    selectCurrentReport,
    resetProcessingState,
    restoreActiveSession
} from '../../store/sessionSlice';
import { fetchClientsForSelection, quickCreateClient, selectSelectionClients, selectIsCreating, selectError as selectClientError, clearError as clearClientError } from '../../store/clientSlice';
import { selectUser } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
// Custom hooks
import { useUploadSocket } from '../../hooks/useUploadSocket';

// Services
import { salesforceService } from '../../services/salesforceService';

// Components
import { AIProcessing } from './components/AIProcessing';


export function UploadPage() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Redux state
    const user = useSelector(selectUser);
    const clients = useSelector(selectSelectionClients);
    const isUploading = useSelector(selectIsUploading);
    const uploadProgress = useSelector(selectUploadProgress);
    const uploadStatus = useSelector(selectUploadStatus);
    const uploadMessage = useSelector(selectUploadMessage);
    const currentUploadSession = useSelector(selectCurrentUploadSession);
    const activeSessionId = useSelector(selectActiveSessionId);
    const uiState = useSelector(selectUiState);
    // const uiState = 'transcribing'
    const sessionError = useSelector(selectSessionError);
    const isCreatingClient = useSelector(selectIsCreating);
    const clientError = useSelector(selectClientError);

    // AI Processing state
    const processingStage = useSelector(selectProcessingStage);
    const processingMessage = useSelector(selectProcessingMessage);
    const transcriptionComplete = useSelector(selectTranscriptionComplete);
    const advisorReportGenerated = useSelector(selectAdvisorReportGenerated);
    const currentReport = useSelector(selectCurrentReport);

    // Initialize upload socket
    useUploadSocket();
    // Local state
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [sessionTitle, setSessionTitle] = useState('');
    const [clientMode, setClientMode] = useState('existing'); // 'existing' or 'new'
    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        phone: '',
        business_domain: '',
        business_number: ''
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [isFetchingSalesforce, setIsFetchingSalesforce] = useState(false);
    const [salesforceError, setSalesforceError] = useState('');

    // Email validation function
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Phone validation function
    const isValidPhone = (phone) => {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone.trim());
    };

    // Load clients on component mount
    useEffect(() => {
        dispatch(fetchClientsForSelection());
    }, [dispatch]);

    // Restore active session when returning to upload page during processing
    useEffect(() => {
        // If we have a processing UI state but no activeSessionId, restore it
        if ((uiState === 'uploading' || uiState === 'transcribing' || uiState === 'generating_report' || uiState === 'processing') && 
            currentUploadSession && 
            !activeSessionId) {
            
            const sessionId = currentUploadSession.id || currentUploadSession.sessionId;
            if (sessionId) {
                console.log(`🔄 Restoring active session: ${sessionId}`);
                // Restore the activeSessionId to re-enable socket events
                dispatch(restoreActiveSession({ sessionId }));
            }
        }
    }, [uiState, currentUploadSession, activeSessionId, dispatch]);

    // Reset form when returning to upload state
    useEffect(() => {
        if (uiState === 'upload' && uploadStatus === null) {
            setSelectedFile(null);
            setSelectedClientId('');
            setSessionTitle('');
            setClientMode('existing');
            setNewClient({ name: '', email: '', phone: '', business_domain: '', business_number: '' });
            setValidationErrors({}); // Clear validation errors
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [uiState, uploadStatus]);


    // File handling
    const handleFileSelect = (files) => {
        const file = files[0];
        if (file) {
            // Validate file type (audio files)
            const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg'];
            if (!allowedTypes.includes(file.type)) {
                alert(t('upload.errors.invalidFileType'));
                return;
            }

            // Validate file size (max 50MB)
            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                alert(t('upload.errors.fileTooLarge'));
                return;
            }

            setSelectedFile(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Client handling
    const handleClientModeChange = (mode) => {
        setClientMode(mode);
        if (mode === 'existing') {
            // Reset new client form when switching to existing
            setNewClient({ name: '', email: '', phone: '', business_domain: '', business_number: '' });
            setValidationErrors({}); // Clear validation errors
        } else {
            // Clear selected client when switching to new
            setSelectedClientId('');
        }
    };

    const handleNewClientChange = (field, value) => {
        setNewClient(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear validation error when user starts typing
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }

        // Validate email field in real-time
        if (field === 'email' && value.trim()) {
            if (!isValidEmail(value.trim())) {
                setValidationErrors(prev => ({
                    ...prev,
                    email: 'Please enter a valid email address'
                }));
            }
        }

        // Validate phone field in real-time
        if (field === 'phone' && value.trim()) {
            if (!isValidPhone(value.trim())) {
                setValidationErrors(prev => ({
                    ...prev,
                    phone: 'Please enter a valid phone number'
                }));
            }
        }
    };

    // Fetch client data from Salesforce
    const handleFetchFromSalesforce = async () => {
        if (!newClient.business_number.trim()) {
            setSalesforceError('Please enter a business number first');
            return;
        }

        setIsFetchingSalesforce(true);
        setSalesforceError('');

        try {
            const result = await salesforceService.lookupClientData(newClient.business_number.trim());
            
            if (result.success && result.data) {
                // Auto-fill form fields with Salesforce data
                setNewClient(prev => ({
                    ...prev,
                    name: result.data.contact_name || prev.name,
                    email: result.data.email || prev.email,
                    phone: result.data.phone || prev.phone,
                    business_domain: result.data.company_name || prev.business_domain
                }));
                
                // Clear any validation errors for auto-filled fields
                setValidationErrors({});
                setSalesforceError('');
            } else {
                setSalesforceError(result.error || 'No client data found for this business number');
            }
        } catch (error) {
            console.error('Salesforce fetch error:', error);
            setSalesforceError('Failed to fetch client data. Please try again.');
        } finally {
            setIsFetchingSalesforce(false);
        }
    };

    // Session upload
    const handleUpload = async () => {
        if (!selectedFile) {
            alert(t('upload.errors.noFileSelected'));
            return;
        }

        // Validate client selection
        if (clientMode === 'existing' && !selectedClientId) {
            alert(t('upload.errors.noClientSelected'));
            return;
        }

        if (clientMode === 'new') {
            if (!newClient.name.trim() || !newClient.email.trim() || !newClient.phone.trim() || !newClient.business_number.trim()) {
                alert(t('upload.errors.clientNameRequired') + ' / ' + t('upload.errors.clientEmailRequired') + ' / ' + t('upload.errors.clientPhoneRequired') + ' / ' + t('upload.errors.clientBusinessNumberRequired'));
                return;
            }
        }

        // Prepare session data object (not FormData)
        const sessionData = {
            file: selectedFile,
            title: sessionTitle.trim() || undefined,
        };

        if (clientMode === 'existing') {
            sessionData.client_id = selectedClientId;
        } else {
            sessionData.newClient = {
                name: newClient.name.trim(),
                email: newClient.email.trim(),
                phone: newClient.phone.trim(),
                business_domain: newClient.business_domain.trim() || null,
                business_number: newClient.business_number.trim() || null
            };
        }

        // Set current upload session info immediately for UI
        dispatch(handleUploadStarted({
            // sessionId: 'temp-' + Date.now(), // Temporary ID until real one comes from backend
            fileName: selectedFile.name,
            message: 'Preparing upload...'
        }));

        try {
            await dispatch(createSession(sessionData)).unwrap();
            // Don't reset form immediately - wait for upload completion via socket events
        } catch (error) {
            console.error('Upload failed:', error);
            // Reset UI state on error
            dispatch(resetUploadState());
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Render different UI states
    const renderContent = () => {
        switch (uiState) {
            case 'uploading':
                return (
                    <AIProcessing
                        fileName={currentUploadSession?.fileName}
                        fileUrl={currentUploadSession?.fileUrl}
                        duration={currentUploadSession?.duration}
                        stage="uploading"
                        message={uploadMessage}
                        uploadProgress={uploadProgress}
                        uploadComplete={uploadStatus === 'complete'}
                        transcriptionComplete={transcriptionComplete}
                        advisorReportGenerated={advisorReportGenerated}
                    />
                );

            case 'transcribing':
                return (
                    <AIProcessing
                        fileName={currentUploadSession?.fileName}
                        fileUrl={currentUploadSession?.fileUrl}
                        duration={currentUploadSession?.duration}
                        stage="transcribing"
                        message={processingMessage}
                        uploadProgress={uploadProgress}
                        uploadComplete={true}
                        transcriptionComplete={transcriptionComplete}
                        advisorReportGenerated={advisorReportGenerated}
                    />
                );

            case 'generating_report':
                return (
                    <AIProcessing
                        fileName={currentUploadSession?.fileName}
                        fileUrl={currentUploadSession?.fileUrl}
                        duration={currentUploadSession?.duration}
                        stage="generating_report"
                        message={processingMessage}
                        uploadProgress={uploadProgress}
                        uploadComplete={true}
                        transcriptionComplete={transcriptionComplete}
                        advisorReportGenerated={advisorReportGenerated}
                    />
                );

            case 'report_ready':
                return (
                    <div className="report-ready">
                        <div className="success-content">
                            <Check className="success-icon" />
                            <h3>{t('upload.advisorReportReady')}</h3>

                            {currentReport && (
                                <div className="report-preview">
                                    <h4>{t('upload.reportPreview')}</h4>
                                    <div className="report-content">
                                        {/* Check if new structure exists */}
                                        {currentReport.content.client_readiness_score !== undefined ? (
                                            // New Structure
                                            <>
                                                {/* Client Readiness Score */}
                                                <div className='entrepreneur-score'>
                                                    <span className='title'>{t('upload.entrepreneurScore')}</span>
                                                    <span>{currentReport.content.client_readiness_score}%</span>
                                                </div>

                                                {/* Quality Metrics Overview */}
                                                <div className='quality-metrics'>
                                                    <span className='title'>{t('upload.qualityMetrics')}</span>
                                                    <div className='metrics-grid'>
                                                        <div className='metric-item'>
                                                            <span className='metric-label'>{t('upload.listening')}</span>
                                                            <span className='metric-score'>
                                                                {'⭐'.repeat(Number(currentReport.content.listening?.score || 0))}
                                                                {' '}
                                                                {currentReport.content.listening?.score || 0}/5
                                                            </span>
                                                        </div>
                                                        <div className='metric-item'>
                                                            <span className='metric-label'>{t('upload.clarity')}</span>
                                                            <span className='metric-score'>
                                                                {'⭐'.repeat(Number(currentReport.content.clarity?.score || 0))}
                                                                {' '}
                                                                {currentReport.content.clarity?.score || 0}/5
                                                            </span>
                                                        </div>
                                                        <div className='metric-item'>
                                                            <span className='metric-label'>{t('upload.continuation')}</span>
                                                            <span className='metric-score'>
                                                                {'⭐'.repeat(Number(currentReport.content.continuation?.score || 0))}
                                                                {' '}
                                                                {currentReport.content.continuation?.score || 0}/5
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            // Legacy Structure
                                            <>
                                                <div className='adviser-score'>
                                                    <span className='title'>{t('upload.adviserScore')}</span>
                                                    <span>{currentReport.content.advisor_performance_score}%</span>
                                                </div>
                                                <div className='entrepreneur-score'>
                                                    <span className='title'>{t('upload.entrepreneurScore')}</span>
                                                    <span>{currentReport.content.entrepreneur_readiness_score}%</span>
                                                </div>
                                                <div className='advisor-speaking'>
                                                    <span className='title'>{t('upload.speakingPercentages')}</span>

                                                    {/* Visual bar */}
                                                    <div className='speaking-bar'>
                                                        <div
                                                            className='advisor-segment'
                                                            style={{ width: `${currentReport.content.advisor_speaking_percentage}%` }}
                                                        >
                                                            <span className='percentage'>{currentReport.content.advisor_speaking_percentage}%</span>
                                                        </div>
                                                        <div
                                                            className='entrepreneur-segment'
                                                            style={{ width: `${currentReport.content.entrepreneur_speaking_percentage}%` }}
                                                        >
                                                            <span className='percentage'>{currentReport.content.entrepreneur_speaking_percentage}%</span>
                                                        </div>
                                                    </div>

                                                    {/* Legend */}
                                                    <div className='speaking-legend'>
                                                        <div className='legend-item'>
                                                            <span className='advisor-dot'></span>
                                                            <span>{t('upload.advisorSpeakingPercentage')}</span>
                                                        </div>
                                                        <div className='legend-item'>
                                                            <span className='entrepreneur-dot'></span>
                                                            <span>{t('upload.entrepreneurSpeakingPercentage')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="action-buttons">
                                <button
                                    className="primary-button"
                                    onClick={() => {
                                        const sessionId = currentUploadSession?.id || currentUploadSession?.sessionId;
                                        if (sessionId) {
                                            navigate(`/reports/${sessionId}`);
                                        } else {
                                            console.error('No session ID available for navigation');
                                        }
                                    }}
                                >
                                    {t('upload.ViewEditReport')}
                                </button>

                                <button
                                    className="secondary-button"
                                    onClick={() => {
                                        dispatch(resetProcessingState());
                                        dispatch(resetUploadState());
                                    }}
                                >
                                    {t('upload.uploadAnother')}
                                </button>
                            </div>
                        </div>
                    </div>
                );
                return (
                    <div className="report-ready">
                        <div className="success-content">
                            <Check className="success-icon" />
                            <h3>{t('upload.advisorReportReady')}</h3>

                            {currentReport && (
                                <div className="report-preview">
                                    <h4>{t('upload.reportPreview')}</h4>
                                    <div className="report-content">
                                        <div className='adviser-score'>
                                            <span className='title'>{t('upload.adviserScore')}</span>
                                            <span>{currentReport.content.advisor_performance_score}%</span>
                                        </div>
                                        <div className='entrepreneur-score'>
                                            <span className='title'>{t('upload.entrepreneurScore')}</span>
                                            <span>{currentReport.content.entrepreneur_readiness_score}%</span>
                                        </div>
                                        <div className='advisor-speaking'>
                                            <span className='title'>{t('upload.speakingPercentages')}</span>

                                            {/* Visual bar */}
                                            <div className='speaking-bar'>
                                                <div
                                                    className='advisor-segment'
                                                    style={{ width: `${currentReport.content.advisor_speaking_percentage}%` }}
                                                >
                                                    <span className='percentage'>{currentReport.content.advisor_speaking_percentage}%</span>
                                                </div>
                                                <div
                                                    className='entrepreneur-segment'
                                                    style={{ width: `${currentReport.content.entrepreneur_speaking_percentage}%` }}
                                                >
                                                    <span className='percentage'>{currentReport.content.entrepreneur_speaking_percentage}%</span>
                                                </div>
                                            </div>

                                            {/* Legend */}
                                            <div className='speaking-legend'>
                                                <div className='legend-item'>
                                                    <span className='advisor-dot'></span>
                                                    <span>{t('upload.advisorSpeakingPercentage')}</span>
                                                </div>
                                                <div className='legend-item'>
                                                    <span className='entrepreneur-dot'></span>
                                                    <span>{t('upload.entrepreneurSpeakingPercentage')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="action-buttons">
                                <button
                                    className="primary-button"
                                    onClick={() => {
                                        const sessionId = currentUploadSession?.id || currentUploadSession?.sessionId;
                                        if (sessionId) {
                                            navigate(`/reports/${sessionId}`);
                                        } else {
                                            console.error('No session ID available for navigation');
                                        }
                                    }}
                                >
                                    {t('upload.ViewEditReport')}
                                </button>

                                <button
                                    className="secondary-button"
                                    onClick={() => {
                                        dispatch(resetProcessingState());
                                        dispatch(resetUploadState());
                                    }}
                                >
                                    {t('upload.uploadAnother')}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'processing': // Legacy fallback
                return (
                    <AIProcessing
                        fileName={currentUploadSession?.fileName}
                        fileUrl={currentUploadSession?.fileUrl}
                        duration={currentUploadSession?.duration}
                        stage={processingStage}
                        message={processingMessage}
                        uploadProgress={uploadProgress}
                        uploadComplete={true}
                        transcriptionComplete={transcriptionComplete}
                        advisorReportGenerated={advisorReportGenerated}
                    />
                );

            case 'error':
                return (
                    <div className="upload-error">
                        <div className="error-content">
                            <AlertCircle className="error-icon" />
                            <h3>{t('upload.processingFailed')}</h3>
                            <p>{processingMessage || uploadMessage || sessionError}</p>
                            <button
                                className="retry-button"
                                onClick={() => {
                                    dispatch(resetProcessingState());
                                    dispatch(resetUploadState());
                                }}
                            >
                                {t('upload.tryAgain')}
                            </button>
                        </div>
                    </div>
                );

            default: // 'upload' state
                return (
                    <div className="upload-card">
                        {/* File Upload Section */}
                        <div className="upload-area">
                            <h2>
                                {t('upload.fileUpload')}
                            </h2>

                            {!selectedFile ? (
                                <div
                                    className={`upload-dropzone ${dragActive ? 'active' : ''}`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="upload-icon" />
                                    <h3>{t('upload.dropzone.title')}</h3>
                                    <p>{t('upload.dropzone.description')}</p>
                                    <button type="button" className="upload-button">
                                        {t('upload.dropzone.button')}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="audio/*"
                                        onChange={handleFileInputChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            ) : (
                                <div className="file-selected">
                                    <div className="file-info">
                                        <FileAudio className="file-icon" />
                                        <div className="file-details">
                                            <h4>{selectedFile.name}</h4>
                                            <p>{formatFileSize(selectedFile.size)}</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="remove-file"
                                            onClick={removeFile}
                                            disabled={isUploading}
                                        >
                                            <X />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Session Details Form */}
                        <div className="upload-form">
                            <h2>{t('upload.sessionDetails')}</h2>

                            {/* Session Title */}
                            <div className="form-group">
                                <label htmlFor="sessionTitle">{t('upload.sessionTitle')}</label>
                                <input
                                    type="text"
                                    id="sessionTitle"
                                    value={sessionTitle}
                                    onChange={(e) => setSessionTitle(e.target.value)}
                                    placeholder={t('upload.sessionTitlePlaceholder')}
                                    disabled={isUploading}
                                />
                            </div>

                            {/* Client Selection Mode */}
                            <div className="form-group">
                                <label>{t('upload.clientSelection')}</label>
                                <div className="client-mode-selection">
                                    <div className="radio-group">
                                        <label className="radio-option">
                                            <input
                                                type="radio"
                                                name="clientMode"
                                                value="existing"
                                                checked={clientMode === 'existing'}
                                                onChange={(e) => handleClientModeChange(e.target.value)}
                                                disabled={isUploading}
                                            />
                                            <span>{t('upload.existingClient')}</span>
                                        </label>
                                        <label className="radio-option">
                                            <input
                                                type="radio"
                                                name="clientMode"
                                                value="new"
                                                checked={clientMode === 'new'}
                                                onChange={(e) => handleClientModeChange(e.target.value)}
                                                disabled={isUploading}
                                            />
                                            <span>{t('upload.newClient')}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Existing Client Selection */}
                            {clientMode === 'existing' && (
                                <div className="form-group">
                                    <label htmlFor="clientSelect">{t('upload.selectClient')}</label>
                                    <select
                                        id="clientSelect"
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                        disabled={isUploading}
                                    >
                                        <option value="">{t('upload.chooseClient')}</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.name} {client.email && `(${client.email})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* New Client Form */}
                            {clientMode === 'new' && (
                                <div className="new-client-form">
                                    <h3>{t('upload.newClientDetails')}</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('upload.businessNumber')} *</label>
                                            <div className="input-with-button">
                                                <input
                                                    type="text"
                                                    value={newClient.business_number}
                                                    onChange={(e) => handleNewClientChange('business_number', e.target.value)}
                                                    placeholder={t('upload.businessNumberPlaceholder')}
                                                    disabled={isUploading}
                                                />
                                                <button
                                                    type="button"
                                                    className="fetch-salesforce-btn"
                                                    onClick={handleFetchFromSalesforce}
                                                    disabled={isUploading || isFetchingSalesforce || !newClient.business_number.trim()}
                                                    title="Fetch client data from Salesforce"
                                                >
                                                    {isFetchingSalesforce ? (
                                                        <div className="loading-spinner"></div>
                                                    ) : (
                                                        <Search size={16} />
                                                    )}
                                                </button>
                                            </div>
                                            {salesforceError && (
                                                <div className="error-message">{salesforceError}</div>
                                            )}
                                        </div>
                                        <div className="form-group">
                                            <label>{t('upload.clientName')} *</label>
                                            <input
                                                type="text"
                                                value={newClient.name}
                                                onChange={(e) => handleNewClientChange('name', e.target.value)}
                                                placeholder={t('upload.clientNamePlaceholder')}
                                                disabled={isUploading}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('upload.clientEmail')} *</label>
                                            <input
                                                type="email"
                                                value={newClient.email}
                                                onChange={(e) => handleNewClientChange('email', e.target.value)}
                                                placeholder={t('upload.clientEmailPlaceholder')}
                                                disabled={isUploading}
                                                className={validationErrors.email ? 'error' : ''}
                                            />
                                            {validationErrors.email && (
                                                <span className="error-message">{validationErrors.email}</span>
                                            )}
                                        </div>
                                        <div className="form-group">
                                            <label>{t('upload.clientPhone')} *</label>
                                            <input
                                                type="tel"
                                                value={newClient.phone}
                                                onChange={(e) => handleNewClientChange('phone', e.target.value)}
                                                placeholder={t('upload.clientPhonePlaceholder')}
                                                disabled={isUploading}
                                                className={validationErrors.phone ? 'error' : ''}
                                            />
                                            {validationErrors.phone && (
                                                <span className="error-message">{validationErrors.phone}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('upload.businessDomain')}</label>
                                            <input
                                                type="text"
                                                value={newClient.business_domain}
                                                onChange={(e) => handleNewClientChange('business_domain', e.target.value)}
                                                placeholder={t('upload.businessDomainPlaceholder')}
                                                disabled={isUploading}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Messages */}
                            {sessionError && (
                                <div className="error-message">
                                    <AlertCircle />
                                    {sessionError}
                                </div>
                            )}

                            {clientError && (
                                <div className="error-message">
                                    <AlertCircle />
                                    {clientError}
                                </div>
                            )}

                            {/* Upload Progress */}
                            {(isUploading || uploadStatus) && (
                                <div className={`upload-progress ${uploadStatus}`}>
                                    <div className="progress-info">
                                        {currentUploadSession && (
                                            <h4>{currentUploadSession.fileName}</h4>
                                        )}
                                        <p className="progress-message">
                                            {uploadMessage || t('upload.uploading')}
                                        </p>
                                    </div>

                                    <div className="progress-bar">
                                        <div
                                            className={`progress-fill ${uploadStatus}`}
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>

                                    <div className="progress-details">
                                        <span className="progress-percentage">{uploadProgress}%</span>
                                        {uploadStatus === 'complete' && (
                                            <span className="progress-status success">
                                                <Check size={16} />
                                                {t('upload.complete')}
                                            </span>
                                        )}
                                        {uploadStatus === 'error' && (
                                            <span className="progress-status error">
                                                <AlertCircle size={16} />
                                                {t('upload.failed')}
                                            </span>
                                        )}
                                        {uploadStatus === 'uploading' && (
                                            <span className="progress-status uploading">
                                                <div className="spinner-small"></div>
                                                {t('upload.inProgress')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Upload Button */}
                            <button
                                type="button"
                                className={`process-button ${uploadStatus === 'complete' ? 'success' : ''}`}
                                onClick={handleUpload}
                                disabled={!selectedFile ||
                                    (clientMode === 'existing' && !selectedClientId) ||
                                    (clientMode === 'new' && (!newClient.name.trim() || !newClient.email.trim() || !newClient.phone.trim() || !isValidEmail(newClient.email.trim()) || !isValidPhone(newClient.phone.trim()))) ||
                                    isUploading ||
                                    uploadStatus === 'uploading'}
                            >
                                {uploadStatus === 'complete' ? (
                                    <>
                                        <Check />
                                        {t('upload.uploadComplete')}
                                    </>
                                ) : isUploading || uploadStatus === 'uploading' ? (
                                    <>
                                        <div className="spinner"></div>
                                        {uploadStatus === 'started' ? t('upload.creating') : t('upload.uploading')}
                                    </>
                                ) : uploadStatus === 'error' ? (
                                    <>
                                        <AlertCircle />
                                        {t('upload.retry')}
                                    </>
                                ) : (
                                    <>
                                        <Check />
                                        {t('upload.startProcessing')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="upload-page">
            <div className="page-header">
                <Upload className="upload-icon" />
                <h1>{t('upload.title')}</h1>
            </div>

            <div className="upload-content">
                {renderContent()}
            </div>
        </div>
    );
}
