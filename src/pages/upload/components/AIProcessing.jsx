import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Check, Brain, FileText, ArrowLeft, Upload } from 'lucide-react';
import { returnToUpload } from '../../../store/sessionSlice';

export function AIProcessing({ 
  fileName, 
  fileUrl, 
  duration, 
  stage = 'uploading', 
  message = '', 
  uploadProgress = 0,
  uploadComplete = false,
  transcriptionComplete = false, 
  advisorReportGenerated = false 
}) {
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
          {message && (
            <p className="current-message">{t(`upload.${message.split(' ').join('_').split('...')[0]}`)}</p>
          )}

          <div className="steps-timeline">
            {/* Step 1: File Upload */}
            <div className={`timeline-step ${
              stage === 'uploading' ? 'active' : 
              uploadComplete ? 'completed' : 'pending'
            }`}>
              <div className="step-indicator">
                <div className="step-number">
                  {uploadComplete ? (
                    <Check className="check-icon" />
                  ) : (
                    <span>1</span>
                  )}
                </div>
                <div className={`step-connector ${i18n.language === 'he' ? 'rtl' : 'ltr'}`}></div>
              </div>
              
              <div className="step-card">
                <div className="step-header">
                  <div className="step-icon-wrapper">
                    <Upload className="step-icon" />
                    {stage === 'uploading' && <div className="pulse-ring"></div>}
                  </div>
                  <div className="step-info">
                    <h4>{t('upload.fileUpload')}</h4>
                    <p className="step-status">
                      {uploadComplete ? 
                        t('upload.uploadComplete') : 
                        stage === 'uploading' ? 
                        t('upload.uploading') :
                        t('upload.uploadPending')
                      }
                    </p>
                    {stage === 'uploading' && (
                      <div className="upload-progress-bar">
                        <div 
                          className="upload-progress-fill" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                        <span className="upload-progress-text">{uploadProgress}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="step-description">{t('upload.uploadDescription')}</p>
              </div>
            </div>

            {/* Step 2: Transcription */}
            <div className={`timeline-step ${
              stage === 'transcribing' ? 'active' : 
              transcriptionComplete ? 'completed' : 'pending'
            }`}>
              <div className="step-indicator">
                <div className="step-number">
                  {transcriptionComplete ? (
                    <Check className="check-icon" />
                  ) : (
                    <span>2</span>
                  )}
                </div>
                <div className={`step-connector ${i18n.language === 'he' ? 'rtl' : 'ltr'}`}></div>
              </div>
              
              <div className="step-card">
                <div className="step-header">
                  <div className="step-icon-wrapper">
                    <Brain className="step-icon" />
                    {stage === 'transcribing' && <div className="pulse-ring"></div>}
                  </div>
                  <div className="step-info">
                    <h4>{t('upload.aiTranscription')}</h4>
                    <p className="step-status">
                      {transcriptionComplete ? 
                        t('upload.transcriptionComplete') : 
                        stage === 'transcribing' ? 
                        t('upload.transcriptionInProgress') :
                        t('upload.transcriptionPending')
                      }
                    </p>
                  </div>
                </div>
                <p className="step-description">{t('upload.transcriptionDescription')}</p>
              </div>
            </div>

            {/* Step 3: Report Generation */}
            <div className={`timeline-step ${
              stage === 'generating_report' ? 'active' : 
              advisorReportGenerated ? 'completed' : 'pending'
            }`}>
              <div className="step-indicator">
                <div className="step-number">
                  {advisorReportGenerated ? (
                    <Check className="check-icon" />
                  ) : (
                    <span>3</span>
                  )}
                </div>
                <div className={`step-connector ${i18n.language === 'he' ? 'rtl' : 'ltr'}`}></div>
              </div>
              
              <div className="step-card">
                <div className="step-header">
                  <div className="step-icon-wrapper">
                    <FileText className="step-icon" />
                    {stage === 'generating_report' && <div className="pulse-ring"></div>}
                  </div>
                  <div className="step-info">
                    <h4>{t('upload.advisorReportGeneration')}</h4>
                    <p className="step-status">
                      {advisorReportGenerated ? 
                        t('upload.advisorReportComplete') : 
                        stage === 'generating_report' ? 
                        t('upload.reportGenerationInProgress') :
                        t('upload.reportGenerationPending')
                      }
                    </p>
                  </div>
                </div>
                <p className="step-description">{t('upload.advisorReportDescription')}</p>
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
