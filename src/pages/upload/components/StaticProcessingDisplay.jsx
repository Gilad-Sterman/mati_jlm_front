import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Check, Brain, FileText, ArrowLeft, Upload, Clock } from 'lucide-react';
import { returnToUpload } from '../../../store/sessionSlice';

export function StaticProcessingDisplay({ 
  fileName, 
  fileUrl, 
  duration, 
  fileSize
}) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const handleBackToUpload = () => {
    dispatch(returnToUpload());
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time estimates based on file size and duration
  const getTimeEstimates = () => {
    // Need at least fileSize OR duration to make estimates
    if (!fileSize && !duration) return null;
    
    const fileSizeInMB = fileSize ? fileSize / (1024 * 1024) : null;
    
    // Upload: Show ranges based on file size
    let uploadMinutes = 1; // default minimum
    if (fileSizeInMB) {
      if (fileSizeInMB <= 10) {
        uploadMinutes = 1; // "about 1 minute"
      } else if (fileSizeInMB <= 20) {
        uploadMinutes = { min: 1, max: 2 }; // "1-2 minutes"
      } else if (fileSizeInMB <= 30) {
        uploadMinutes = { min: 2, max: 3 }; // "2-3 minutes"
      } else if (fileSizeInMB <= 40) {
        uploadMinutes = { min: 3, max: 4 }; // "3-4 minutes"
      } else {
        uploadMinutes = { min: 4, max: 5 }; // "4-5 minutes"
      }
    }
    
    // Transcription: every 10-15 minutes of audio takes about 1 minute to process
    let transcriptionMinutes = 1; // minimum
    if (duration) {
      const audioDurationMinutes = duration / 60;
      // Use 12.5 minutes as average (between 10-15 minutes)
      transcriptionMinutes = Math.ceil(audioDurationMinutes / 12.5);
    } else if (fileSizeInMB) {
      // Estimate based on file size if no duration
      // Typical audio: ~0.6-1MB per minute for compressed audio
      // Use 0.8MB per minute as average, so duration ≈ fileSizeInMB / 0.8
      const estimatedDurationMinutes = fileSizeInMB / 0.8;
      transcriptionMinutes = Math.ceil(estimatedDurationMinutes / 12.5);
    }
    
    // Report generation: based on audio duration
    // <20min = 1min, 20-50min = 2min, >50min = 3min
    let reportMinutes = 2; // default
    if (duration) {
      const audioDurationMinutes = duration / 60;
      if (audioDurationMinutes < 20) {
        reportMinutes = 1;
      } else if (audioDurationMinutes <= 50) {
        reportMinutes = 2;
      } else {
        reportMinutes = 3;
      }
    }
    
    return {
      upload: uploadMinutes,
      transcription: transcriptionMinutes,
      report: reportMinutes
    };
  };

  const timeEstimates = getTimeEstimates();

  const formatTimeEstimate = (minutes) => {
    // Handle range objects {min, max}
    if (typeof minutes === 'object' && minutes.min && minutes.max) {
      if (minutes.min === minutes.max) {
        return t('upload.timeEstimate.minutes', { minutes: minutes.min });
      }
      return t('upload.timeEstimate.minuteRange', { min: minutes.min, max: minutes.max });
    }
    
    // Handle single numbers
    if (minutes <= 1) return t('upload.timeEstimate.lessThanMinute');
    if (minutes === 1) return t('upload.timeEstimate.oneMinute');
    return t('upload.timeEstimate.minutes', { minutes });
  };

  // Calculate total estimated time
  const getTotalEstimate = () => {
    if (!timeEstimates) return null;
    
    const getMinutes = (estimate) => {
      if (typeof estimate === 'object') {
        return { min: estimate.min, max: estimate.max };
      }
      return estimate;
    };
    
    const upload = getMinutes(timeEstimates.upload);
    const transcription = timeEstimates.transcription;
    const report = timeEstimates.report;
    
    if (typeof upload === 'object') {
      return {
        min: upload.min + transcription + report,
        max: upload.max + transcription + report
      };
    }
    
    return upload + transcription + report;
  };

  const totalEstimate = getTotalEstimate();

  return (
    <div className="ai-processing">
      <div className="processing-content">

        {/* Success Header */}
        {/* <div className="success-header">
          <div className="success-icon">
            <Check className="check-icon" />
          </div>
          <h2>{t('upload.fileUploadedSuccessfully')}</h2>
        </div> */}

        {/* File Details */}
        {/* <div className="file-details">
          <div className="file-info">
            <h4>{fileName}</h4>
            {duration && (
              <p className="duration">{t('upload.duration')}: {formatDuration(duration)}</p>
            )}
          </div>
        </div> */}

        {/* Processing Status */}
        <div className="processing-steps">
          <h3>{t('upload.aiProcessingInProgress')}</h3>
          <div className="processing-status-message" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <Clock className="clock-icon" style={{
              width: '32px',
              height: '32px',
              color: '#3498db',
              animation: 'pulse 2s infinite'
            }} />
            <p style={{ margin: 0, color: '#64748b', fontSize: '1rem', textAlign: 'center', lineHeight: 1.5 }}>
              {t('upload.processingInBackground')}
            </p>
            {totalEstimate && (
              <p className="total-estimate" style={{
                fontWeight: 600,
                color: '#3498db',
                fontSize: '1.1rem',
                margin: 0
              }}>
                {typeof totalEstimate === 'object' 
                  ? t('upload.timeEstimate.minuteRange', { 
                      min: totalEstimate.min, 
                      max: totalEstimate.max 
                    })
                  : t('upload.timeEstimate.totalMinutes', { minutes: totalEstimate })
                }
              </p>
            )}
          </div>

          <div className="steps-timeline">
            {/* Step 1: File Upload */}
            <div className="timeline-step pending">
              <div className="step-indicator">
                <div className="step-number">
                  <span>1</span>
                </div>
                <div className={`step-connector ${i18n.language === 'he' ? 'rtl' : 'ltr'}`}></div>
              </div>
              
              <div className="step-card">
                <div className="step-header">
                  <div className="step-icon-wrapper">
                    <Upload className="step-icon" />
                  </div>
                  <div className="step-info">
                    <h4>{t('upload.fileUpload')}</h4>
                    <p className="step-status">
                      {t('upload.uploadPending')}
                    </p>
                  </div>
                </div>
                <p className="step-description">
                  {timeEstimates ? 
                    t('upload.timeEstimate.uploadEstimate', { time: formatTimeEstimate(timeEstimates.upload) }) :
                    t('upload.uploadDescription')
                  }
                </p>
              </div>
            </div>

            {/* Step 2: Transcription */}
            <div className="timeline-step pending">
              <div className="step-indicator">
                <div className="step-number">
                  <span>2</span>
                </div>
                <div className={`step-connector ${i18n.language === 'he' ? 'rtl' : 'ltr'}`}></div>
              </div>
              
              <div className="step-card">
                <div className="step-header">
                  <div className="step-icon-wrapper">
                    <Brain className="step-icon" />
                  </div>
                  <div className="step-info">
                    <h4>{t('upload.aiTranscription')}</h4>
                    <p className="step-status">
                      {t('upload.transcriptionPending')}
                    </p>
                  </div>
                </div>
                <p className="step-description">
                  {timeEstimates ? 
                    t('upload.timeEstimate.transcriptionEstimate', { time: formatTimeEstimate(timeEstimates.transcription) }) :
                    t('upload.transcriptionDescription')
                  }
                </p>
              </div>
            </div>

            {/* Step 3: Report Generation */}
            <div className="timeline-step pending">
              <div className="step-indicator">
                <div className="step-number">
                  <span>3</span>
                </div>
                <div className={`step-connector ${i18n.language === 'he' ? 'rtl' : 'ltr'}`}></div>
              </div>
              
              <div className="step-card">
                <div className="step-header">
                  <div className="step-icon-wrapper">
                    <FileText className="step-icon" />
                  </div>
                  <div className="step-info">
                    <h4>{t('upload.advisorReportGeneration')}</h4>
                    <p className="step-status">
                      {t('upload.reportGenerationPending')}
                    </p>
                  </div>
                </div>
                <p className="step-description">
                  {timeEstimates ? 
                    t('upload.timeEstimate.reportEstimate', { time: formatTimeEstimate(timeEstimates.report) }) :
                    t('upload.advisorReportDescription')
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Section */}
        <div className="notification-section" style={{
          marginTop: '24px',
          padding: '24px',
          background: 'linear-gradient(135deg, #3498db 0%, #22303e 100%)',
          borderRadius: '8px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div className="notification-icon" style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Clock className="clock-icon" style={{
              width: '48px',
              height: '48px',
              color: 'white',
              animation: 'pulse 2s infinite'
            }} />
          </div>
          <div className="notification-text">
            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '1.2rem',
              fontWeight: 600
            }}>{t('upload.weWillNotifyYou')}</h4>
            <p style={{
              margin: 0,
              fontSize: '1rem',
              opacity: 0.9,
              lineHeight: 1.5
            }}>{t('upload.notificationDescription')}</p>
          </div>
        </div>

        {/* Back to Upload Button */}
        <div className="back-to-upload">
          <button 
            className="back-button"
            onClick={handleBackToUpload}
          >
            <ArrowLeft className="back-icon" />
            {t('upload.backToUpload')}
          </button>
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
