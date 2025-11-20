import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileText, Clock, Calendar } from 'lucide-react';

export function OriginalTranscriptModal({
    isOpen,
    onClose,
    transcript,
    session
}) {
    const { t, i18n } = useTranslation();

    if (!isOpen) return null;

    // Detect language for proper text alignment
    const currentLanguage = i18n.language || 'en';
    const isHebrew = currentLanguage === 'he';
    
    // Detect transcript language (simple heuristic)
    const detectTranscriptLanguage = (text) => {
        if (!text) return currentLanguage;
        // Check for Hebrew characters
        const hebrewRegex = /[\u0590-\u05FF]/;
        return hebrewRegex.test(text) ? 'he' : 'en';
    };
    
    const transcriptLanguage = detectTranscriptLanguage(transcript);
    const shouldUseColumns = transcript && transcript.length > 800; // Use columns for long text (lowered threshold)

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('he-IL');
    };

    const formatDuration = (duration) => {
        if (!duration) return 'N/A';
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className="modal-content original-transcript-modal" 
                data-lang={transcriptLanguage}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div className="modal-title-section">
                        <FileText size={24} />
                        <h2>{t('reports.originalTranscript')}</h2>
                    </div>
                    <button className="modal-close-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                
                {session && (
                    <div className="transcript-info" dir={isHebrew ? 'rtl' : 'ltr'}>
                        <div className="session-header-row">
                            <div className="session-title-item">
                                <span className="info-label">{t('reports.sessionTitle')}: </span>
                                <span className="info-value">{session.title}</span>
                            </div>
                            <div className="session-meta-items">
                                <div className="meta-item">
                                    <Calendar size={16} />
                                    <span>{formatDate(session.created_at)}</span>
                                </div>
                                {session.transcription_metadata?.duration && (
                                    <div className="meta-item">
                                        <Clock size={16} />
                                        <span>{formatDuration(session.transcription_metadata.duration)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="modal-body">
                    <div className="transcript-content">
                        {transcript ? (
                            <pre 
                                className={`transcript-text ${!shouldUseColumns ? 'single-column' : ''}`}
                                dir={transcriptLanguage === 'he' ? 'rtl' : 'ltr'}
                            >
                                {transcript}
                            </pre>
                        ) : (
                            <div className="no-transcript">
                                <FileText size={48} />
                                <p>{t('reports.noTranscriptAvailable')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}