import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Check, Brain, FileText, ArrowLeft } from 'lucide-react';
import { returnToUpload } from '../../../store/sessionSlice';

export function AIProcessing({ fileName, fileUrl, duration }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const handleBackToUpload = () => {
    dispatch(returnToUpload());
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="ai-processing">
      <div className="processing-content">
        {/* Back Button */}
        <div className="actions">
          <button
            type="button"
            className={`back-button ${i18n.language === 'he' ? 'he' : 'en'}`}
            onClick={handleBackToUpload}
          >
            <ArrowLeft />
            {t('upload.uploadAnother')}
          </button>
        </div>

        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">
            <Check className="check-icon" />
          </div>
          <h2>{t('upload.fileUploadedSuccessfully')}</h2>
        </div>

        {/* File Details */}
        <div className="file-details">
          <div className="file-info">
            <h4>{fileName}</h4>
            {duration && (
              <p className="duration">{t('upload.duration')}: {formatDuration(duration)}</p>
            )}
          </div>
        </div>

        {/* AI Processing Steps */}
        <div className="processing-steps">
          <h3>{t('upload.aiProcessingInProgress')}</h3>

          <div className="steps-list">
            <div className="step active">
              <div className="step-icon">
                <Brain className="brain-icon" />
                <div className="pulse-animation"></div>
              </div>
              <div className="step-content">
                <h4>{t('upload.aiTranscription')}</h4>
                <p>{t('upload.transcriptionDescription')}</p>
              </div>
            </div>

            <div className="step pending">
              <div className="step-icon">
                <FileText className="report-icon" />
              </div>
              <div className="step-content">
                <h4>{t('upload.reportGeneration')}</h4>
                <p>{t('upload.reportDescription')}</p>
              </div>
            </div>
          </div>
        </div>



        {/* Processing Animation */}
        <div className="processing-animation">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
      </div>
    </div>
  );
}
