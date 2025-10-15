import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Upload, FileAudio, User, Plus, X, Check, AlertCircle } from 'lucide-react';

// Redux imports
import { 
  createSession, 
  selectIsUploading, 
  selectUploadProgress, 
  selectUploadStatus,
  selectUploadMessage,
  selectCurrentUploadSession,
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
  resetProcessingState
} from '../../store/sessionSlice';
import { fetchClientsForSelection, quickCreateClient, selectSelectionClients, selectIsCreating, selectError as selectClientError, clearError as clearClientError } from '../../store/clientSlice';
import { selectUser } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
// Custom hooks
import { useUploadSocket } from '../../hooks/useUploadSocket';

// Components
import { UploadingLoader } from './components/UploadingLoader';
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
    const uiState = useSelector(selectUiState);
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
        business_domain: '',
        business_number: ''
    });

    // Load clients on component mount
    useEffect(() => {
        dispatch(fetchClientsForSelection());
    }, [dispatch]);

    // Reset form when returning to upload state
    useEffect(() => {
        if (uiState === 'upload' && uploadStatus === null) {
            setSelectedFile(null);
            setSelectedClientId('');
            setSessionTitle('');
            setClientMode('existing');
            setNewClient({ name: '', email: '', business_domain: '', business_number: '' });
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
            const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/aac', 'audio/ogg'];
            if (!allowedTypes.includes(file.type)) {
                alert(t('upload.errors.invalidFileType'));
                return;
            }

            // Validate file size (max 100MB)
            const maxSize = 100 * 1024 * 1024; // 100MB
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
            setNewClient({ name: '', email: '', business_domain: '', business_number: '' });
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
            if (!newClient.name.trim() || !newClient.email.trim()) {
                alert(t('upload.errors.clientNameRequired') + ' / ' + t('upload.errors.clientEmailRequired'));
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
                business_domain: newClient.business_domain.trim() || null,
                business_number: newClient.business_number.trim() || null
            };
        }

        // Set current upload session info immediately for UI
        dispatch(handleUploadStarted({
            sessionId: 'temp-' + Date.now(), // Temporary ID until real one comes from backend
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
                    <UploadingLoader 
                        fileName={currentUploadSession?.fileName}
                        progress={uploadProgress}
                        message={uploadMessage}
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
                        transcriptionComplete={transcriptionComplete}
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
                                        {currentReport.content.substring(0, 200)}...
                                    </div>
                                </div>
                            )}
                            
                            <div className="action-buttons">
                                <button 
                                    className="primary-button"
                                    onClick={() => {
                                        // TODO: Navigate to report view/edit page
                                        navigate(`/reports/adviser/${currentUploadSession.id}`);
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
                        <h2>{t('upload.fileUpload')}</h2>
                        
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
                                        />
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
                                    <div className="form-group">
                                        <label>{t('upload.businessNumber')}</label>
                                        <input
                                            type="text"
                                            value={newClient.business_number}
                                            onChange={(e) => handleNewClientChange('business_number', e.target.value)}
                                            placeholder={t('upload.businessNumberPlaceholder')}
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
                                     (clientMode === 'new' && (!newClient.name.trim() || !newClient.email.trim())) || 
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
                <h1>{t('upload.title')}</h1>                
            </div>
            
            <div className="upload-content">
                {renderContent()}
            </div>
        </div>
    );
}
