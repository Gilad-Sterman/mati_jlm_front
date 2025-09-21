import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Upload, FileAudio, User, Plus, X, Check, AlertCircle } from 'lucide-react';

// Redux imports
import { createSession, selectIsUploading, selectUploadProgress, selectError as selectSessionError, clearError as clearSessionError } from '../../store/sessionSlice';
import { fetchClientsForSelection, quickCreateClient, selectSelectionClients, selectIsCreating, selectError as selectClientError, clearError as clearClientError } from '../../store/clientSlice';
import { selectUser } from '../../store/authSlice';

export function UploadPage() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);

    // Redux state
    const user = useSelector(selectUser);
    const clients = useSelector(selectSelectionClients);
    const isUploading = useSelector(selectIsUploading);
    const uploadProgress = useSelector(selectUploadProgress);
    const sessionError = useSelector(selectSessionError);
    const isCreatingClient = useSelector(selectIsCreating);
    const clientError = useSelector(selectClientError);

    // Local state
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [sessionTitle, setSessionTitle] = useState('');
    const [showNewClientForm, setShowNewClientForm] = useState(false);
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
    const handleNewClientSubmit = async (e) => {
        e.preventDefault();
        
        if (!newClient.name.trim()) {
            alert(t('upload.errors.clientNameRequired'));
            return;
        }

        try {
            const result = await dispatch(quickCreateClient(newClient)).unwrap();
            setSelectedClientId(result.id);
            setShowNewClientForm(false);
            setNewClient({ name: '', email: '', business_domain: '', business_number: '' });
        } catch (error) {
            console.error('Failed to create client:', error);
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

        if (!selectedClientId) {
            alert(t('upload.errors.noClientSelected'));
            return;
        }

        const sessionData = {
            file: selectedFile,
            client_id: selectedClientId,
            title: sessionTitle.trim() || null
        };

        try {
            await dispatch(createSession(sessionData)).unwrap();
            
            // Reset form on success
            setSelectedFile(null);
            setSelectedClientId('');
            setSessionTitle('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            alert(t('upload.success'));
        } catch (error) {
            console.error('Upload failed:', error);
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

    return (
        <div className="upload-page">
            <div className="page-header">
                <h1>{t('upload.title')}</h1>
                <p>{t('upload.welcome', { name: user?.firstName || user?.email })}</p>
            </div>
            
            <div className="upload-content">
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

                        {/* Client Selection */}
                        <div className="form-group">
                            <label htmlFor="clientSelect">{t('upload.selectClient')}</label>
                            <div className="client-selection">
                                <select
                                    id="clientSelect"
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    disabled={isUploading || showNewClientForm}
                                >
                                    <option value="">{t('upload.chooseClient')}</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.name} {client.email && `(${client.email})`}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="new-client-btn"
                                    onClick={() => setShowNewClientForm(!showNewClientForm)}
                                    disabled={isUploading}
                                >
                                    <Plus />
                                    {t('upload.newClient')}
                                </button>
                            </div>
                        </div>

                        {/* New Client Form */}
                        {showNewClientForm && (
                            <div className="new-client-form">
                                <h3>{t('upload.createNewClient')}</h3>
                                <form onSubmit={handleNewClientSubmit}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('upload.clientName')} *</label>
                                            <input
                                                type="text"
                                                value={newClient.name}
                                                onChange={(e) => handleNewClientChange('name', e.target.value)}
                                                placeholder={t('upload.clientNamePlaceholder')}
                                                required
                                                disabled={isCreatingClient}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('upload.clientEmail')}</label>
                                            <input
                                                type="email"
                                                value={newClient.email}
                                                onChange={(e) => handleNewClientChange('email', e.target.value)}
                                                placeholder={t('upload.clientEmailPlaceholder')}
                                                disabled={isCreatingClient}
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
                                                disabled={isCreatingClient}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('upload.businessNumber')}</label>
                                            <input
                                                type="text"
                                                value={newClient.business_number}
                                                onChange={(e) => handleNewClientChange('business_number', e.target.value)}
                                                placeholder={t('upload.businessNumberPlaceholder')}
                                                disabled={isCreatingClient}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="cancel-btn"
                                            onClick={() => setShowNewClientForm(false)}
                                            disabled={isCreatingClient}
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="create-btn"
                                            disabled={isCreatingClient || !newClient.name.trim()}
                                        >
                                            {isCreatingClient ? t('upload.creating') : t('upload.createClient')}
                                        </button>
                                    </div>
                                </form>
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
                        {isUploading && (
                            <div className="upload-progress">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <p>{t('upload.uploading')} {uploadProgress}%</p>
                            </div>
                        )}

                        {/* Upload Button */}
                        <button
                            type="button"
                            className="process-button"
                            onClick={handleUpload}
                            disabled={!selectedFile || !selectedClientId || isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <div className="spinner"></div>
                                    {t('upload.processing')}
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
            </div>
        </div>
    );
}
