import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { 
  User,
  Calendar,
  RotateCcw,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Download,
  ArrowLeft,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Mail,
  Building,
  FileText,
  Smile,
  Target,
  Zap,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';
import { 
  fetchReportsForSession
} from '../../store/reportSlice';
import { fetchSessions } from '../../store/sessionSlice';

export const AdviserReportPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const reportsFetched = useRef(false); // Track if reports already fetched

  const handleBackClick = () => {
    // Use browser history to go back, fallback to sessions if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/sessions');
    }
  };
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state - direct access like rest of app
  const reportsBySession = useSelector(state => state.reports.reportsBySession);
  
  // Get reports for this session
  const sessionReports = reportsBySession[sessionId] || [];
  const adviserReport = sessionReports.find(r => r.type === 'adviser');
  const sessions = useSelector(state => state.sessions.sessions);
  const currentSession = sessions.find(session => session.id === sessionId);
  const [report, setReport] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    quotes: true,
    insights: true,
    recommendations: true,
    followup: true,
    transcript: true,
    rawContent: true,
    tone: true,
    speaking: true,
    assessment: true
  });

  useEffect(() => {
    // Fetch reports for this session if not already loaded (ONE TIME ONLY)
    if (!adviserReport && !reportsFetched.current) {
      reportsFetched.current = true;
      dispatch(fetchReportsForSession(sessionId))
        .unwrap()
        .catch((error) => {
          console.error('Error fetching reports:', error);
          reportsFetched.current = false; // Allow retry on error
        });
    }
  }, [dispatch, sessionId, adviserReport]);

  useEffect(() => {
    // Fetch sessions if current session is not loaded
    if (!currentSession) {
      dispatch(fetchSessions());
    }
  }, [dispatch, currentSession]);

  // Helper function to parse markdown report content
  const parseMarkdownReport = (content) => {
    if (!content || typeof content !== 'string') {
      return null;
    }

    const sections = {};
    
    // Extract header information (client details, etc.)
    const headerMatch = content.match(/^([\s\S]*?)(?=---)/m);
    if (headerMatch) {
      const headerText = headerMatch[1];
      sections.header = headerText;
      
      // Extract specific header fields
      const clientNameMatch = headerText.match(/\*\*Client Name:\*\*\s*(.+)/i);
      const clientEmailMatch = headerText.match(/\*\*Client Email:\*\*\s*(.+)/i);
      const businessDomainMatch = headerText.match(/\*\*Business Domain:\*\*\s*(.+)/i);
      const adviserNameMatch = headerText.match(/\*\*Adviser Name:\*\*\s*(.+)/i);
      const adviserEmailMatch = headerText.match(/\*\*Adviser Email:\*\*\s*(.+)/i);
      const sessionTitleMatch = headerText.match(/\*\*Session Title:\*\*\s*(.+)/i);
      const audioFileMatch = headerText.match(/\*\*Audio File:\*\*\s*(.+)/i);
      
      sections.clientName = clientNameMatch ? clientNameMatch[1].trim() : null;
      sections.clientEmail = clientEmailMatch ? clientEmailMatch[1].trim() : null;
      sections.businessDomain = businessDomainMatch ? businessDomainMatch[1].trim() : null;
      sections.adviserName = adviserNameMatch ? adviserNameMatch[1].trim() : null;
      sections.adviserEmail = adviserEmailMatch ? adviserEmailMatch[1].trim() : null;
      sections.sessionTitle = sessionTitleMatch ? sessionTitleMatch[1].trim() : null;
      sections.audioFile = audioFileMatch ? audioFileMatch[1].trim() : null;
    }

    // Extract main sections using regex
    const sectionRegex = /##\s*(\d+\.\s*)?([^\n]+)\n([\s\S]*?)(?=##\s*\d+\.|##\s*[A-Z]|$)/g;
    let match;
    
    while ((match = sectionRegex.exec(content)) !== null) {
      const sectionTitle = match[2].trim();
      const sectionContent = match[3].trim();
      
      // Map section titles to keys
      if (sectionTitle.toLowerCase().includes('meeting summary') || sectionTitle.toLowerCase().includes('סיכום')) {
        sections.meetingSummary = sectionContent;
      } else if (sectionTitle.toLowerCase().includes('key discussion') || sectionTitle.toLowerCase().includes('נקודות מפתח')) {
        sections.keyDiscussionPoints = sectionContent;
      } else if (sectionTitle.toLowerCase().includes('action items') || sectionTitle.toLowerCase().includes('פעולות')) {
        sections.actionItems = sectionContent;
      } else if (sectionTitle.toLowerCase().includes('next steps') || sectionTitle.toLowerCase().includes('צעדים הבאים')) {
        sections.nextSteps = sectionContent;
      } else if (sectionTitle.toLowerCase().includes('important decisions') || sectionTitle.toLowerCase().includes('החלטות')) {
        sections.importantDecisions = sectionContent;
      } else if (sectionTitle.toLowerCase().includes('analytical insights') || sectionTitle.toLowerCase().includes('תובנות')) {
        sections.analyticalInsights = sectionContent;
      } else if (sectionTitle.toLowerCase().includes('recommendations for follow') || sectionTitle.toLowerCase().includes('המלצות')) {
        sections.followUpRecommendations = sectionContent;
      } else if (sectionTitle.toLowerCase().includes('areas requiring attention') || sectionTitle.toLowerCase().includes('תחומים הדורשים')) {
        sections.areasRequiringAttention = sectionContent;
      } else if (sectionTitle.toLowerCase().includes('meeting tone') || sectionTitle.toLowerCase().includes('engagement analysis') || sectionTitle.toLowerCase().includes('טון הפגישה')) {
        sections.meetingTone = sectionContent;
      } else if (sectionTitle.toLowerCase().includes('speaking time') || sectionTitle.toLowerCase().includes('זמן דיבור')) {
        sections.speakingTimeAnalysis = sectionContent;
      } else if (sectionTitle.toLowerCase().includes('key quotes') || sectionTitle.toLowerCase().includes('ציטוטים')) {
        sections.keyQuotes = sectionContent;
      } else if (sectionTitle.toLowerCase().includes('professional assessment') || sectionTitle.toLowerCase().includes('הערכה מקצועית')) {
        sections.professionalAssessment = sectionContent;
      }
    }

    return sections;
  };

  // Helper function to extract bullet points from text
  const extractBulletPoints = (text) => {
    if (!text) return [];
    
    const lines = text.split('\n').filter(line => line.trim());
    const bulletPoints = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Check if line starts with bullet point indicators
      if (trimmed.match(/^[-•*]\s/) || trimmed.match(/^\d+\.\s/)) {
        bulletPoints.push(trimmed.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, ''));
      } else if (trimmed && !trimmed.match(/^#{1,6}\s/)) {
        // If it's not a header and not empty, treat as bullet point
        bulletPoints.push(trimmed);
      }
    }
    
    return bulletPoints.length > 0 ? bulletPoints : [text];
  };

  // Helper function to get speaker colors
  const getSpeakerColor = (index) => {
    const colors = [
      '#007bff', // Blue
      '#28a745', // Green
      '#ffc107', // Yellow
      '#dc3545', // Red
      '#6f42c1', // Purple
      '#fd7e14', // Orange
      '#20c997', // Teal
      '#e83e8c'  // Pink
    ];
    return colors[index % colors.length];
  };

  // Update local report state when Redux data changes
  useEffect(() => {
    if (adviserReport) {
      const reportContent = adviserReport.content;
      
      // Parse the markdown content
      const parsedSections = parseMarkdownReport(reportContent);
      
      // Create enhanced report object with actual parsed data
      const enhancedReport = {
        // Use actual report data
        id: adviserReport.id,
        sessionId: adviserReport.session_id,
        type: adviserReport.type,
        title: adviserReport.title || 'ניתוח השיחה',
        content: adviserReport.content,
        status: adviserReport.status,
        version: adviserReport.version_number || 1,
        createdAt: adviserReport.created_at,
        
        // Use parsed sections from actual report content
        parsedSections: parsedSections || {},
        
        // Extract specific data for display
        clientInfo: parsedSections ? {
          name: parsedSections.clientName,
          email: parsedSections.clientEmail,
          businessDomain: parsedSections.businessDomain,
          sessionTitle: parsedSections.sessionTitle,
          audioFile: parsedSections.audioFile
        } : {},
        
        adviserInfo: parsedSections ? {
          name: parsedSections.adviserName,
          email: parsedSections.adviserEmail
        } : {}
      };

      setReport(enhancedReport);
    }
  }, [adviserReport]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Save report changes
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 1000);
  };

  const handleApprove = async () => {
    // TODO: Approve report and trigger client report generation
    console.log('Approving adviser report');
    // Navigate to client report when ready
    navigate(`/reports/client/${sessionId}`);
  };

  const handleRegenerate = async () => {
    // TODO: Trigger AI regeneration
    console.log('Regenerating adviser report');
  };

  // Helper component for percentage bars
  const PercentageBar = ({ value, label, description, color = '#007bff' }) => (
    <div className="percentage-item">
      <div className="percentage-header">
        <span className="percentage-value">{value}%</span>
        <span className="percentage-label">{label}</span>
      </div>
      <div className="percentage-bar">
        <div
          className="percentage-fill"
          style={{ width: `${value}%`, backgroundColor: color }}
        ></div>
      </div>
      <div className="percentage-description">{description}</div>
    </div>
  );

  // Helper component for energy score display
  const EnergyScore = ({ score, maxScore, details }) => (
    <div className="energy-score">
      <div className="score-display">
        <span className="score-number">{score}</span>
        <span className="score-max">{t('reports.outOf')} {maxScore}</span>
      </div>
      <div className="score-label">{t('reports.highEnergyLevel')}</div>
      <div className="score-details">
        <div>{t('reports.speechPace')} {details.speechPace}</div>
        <div>{t('reports.toneOfVoice')} {details.tone}</div>
        <div>{t('reports.positiveKeywords')} {details.positiveWords} {t('reports.times')}</div>
      </div>
    </div>
  );

  // Helper component for collapsible sections
  const CollapsibleSection = ({ id, title, children, defaultCollapsed = false }) => {
    const isCollapsed = collapsedSections[id];

    const toggleSection = () => {
      setCollapsedSections(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    };

    return (
      <section className={`collapsible-section ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="section-header" onClick={toggleSection}>
          <h3>{title}</h3>
          <span className="collapse-icon">{isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</span>
        </div>
        {!isCollapsed && (
          <div className="section-content">
            {children}
          </div>
        )}
      </section>
    );
  };

  // Show loading if we're fetching reports for the first time
  if (!adviserReport && reportsFetched.current) {
    return (
      <div className="adviser-report-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('reports.loading')}</p>
        </div>
      </div>
    );
  }

  if (!adviserReport && !reportsFetched.current) {
    return (
      <div className="adviser-report-page">
        <div className="error-container">
          <h2>{t('reports.noReportFound')}</h2>
          <p>{t('reports.noAdviserReportMessage')}</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/sessions')}
          >
            {t('common.backToSessions')}
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="adviser-report-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('reports.processingReport')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adviser-report-page">
      <div className="report-header">
        <div className="header-left">
          <button 
            className="back-button" 
            onClick={handleBackClick}
          >
            <ArrowLeft size={16} />
            {t('common.back')}
          </button>
          <h1>{t('reports.adviserReport')}</h1>
          <span className="report-status">{report?.status}</span>
        </div>

        <div className="header-actions">
          {!isEditing ? (
            <>
              <button
                className="btn-secondary"
                onClick={handleRegenerate}
              >
                {t('reports.regenerate')}
              </button>
              <button
                className="btn-secondary"
                onClick={handleEdit}
              >
                <Edit3 size={16} />
                {t('reports.edit')}
              </button>
              <button
                className="btn-primary"
                onClick={handleApprove}
              >
                {t('reports.approve')}
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                <X size={16} />
                {t('common.cancel')}
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Save size={16} /> : <Save size={16} />}
                {isSaving ? t('common.saving') : t('common.save')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="report-content">
        <div className="report-meta compact">
          <span><strong>{t('reports.session')}:</strong> {currentSession?.title}</span>
          <span><strong>{t('reports.version')}:</strong> {report?.version}</span>
          <span><strong>{t('reports.client')}:</strong> {currentSession?.client?.name}</span>
          <span><strong>{t('reports.created')}:</strong> {new Date(report?.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="report-body">
          {isEditing ? (
            <div className="report-editor-container">
              <div className="editor-note">
                <p>⚠️ {t('reports.structuredEditNote')}</p>
              </div>
              <textarea
                className="report-editor"
                value={JSON.stringify(report?.keyPoints, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setReport(prev => ({ ...prev, keyPoints: parsed }));
                  } catch (err) {
                    // Invalid JSON - don't update
                  }
                }}
                placeholder={t('reports.structuredContentPlaceholder')}
              />
            </div>
          ) : (
            <div className="report-display structured-report compact-layout">
              <h1 className="report-title">{currentSession?.title}</h1>

              {/* Client Information Header */}
              {(report?.clientInfo?.name || report?.adviserInfo?.name) && (
                <div className="client-info-section">
                  <div className="info-grid">
                    {report?.clientInfo?.name && (
                      <div className="info-item">
                        <User className="info-icon" size={16} />
                        <span><strong>{t('reports.client')}:</strong> {report.clientInfo.name}</span>
                      </div>
                    )}
                    {report?.clientInfo?.email && (
                      <div className="info-item">
                        <Mail className="info-icon" size={16} />
                        <span><strong>{t('reports.email')}:</strong> {report.clientInfo.email}</span>
                      </div>
                    )}
                    {report?.clientInfo?.businessDomain && report.clientInfo.businessDomain !== '[Not specified]' && (
                      <div className="info-item">
                        <Building className="info-icon" size={16} />
                        <span><strong>{t('reports.businessDomain')}:</strong> {report.clientInfo.businessDomain}</span>
                      </div>
                    )}
                    {report?.adviserInfo?.name && (
                      <div className="info-item">
                        <User className="info-icon" size={16} />
                        <span><strong>{t('reports.adviser')}:</strong> {report.adviserInfo.name}</span>
                      </div>
                    )}
                    {report?.clientInfo?.sessionTitle && (
                      <div className="info-item">
                        <FileText className="info-icon" size={16} />
                        <span><strong>{t('reports.sessionTitle')}:</strong> {report.clientInfo.sessionTitle}</span>
                      </div>
                    )}
                    {report?.clientInfo?.audioFile && (
                      <div className="info-item">
                        <RotateCcw className="info-icon" size={16} />
                        <span><strong>{t('reports.audioFile')}:</strong> {report.clientInfo.audioFile}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Report Sections */}
              {report?.parsedSections?.meetingSummary && (
                <section className="report-section">
                  <h2><Smile size={16} /> {t('reports.meetingSummary')}</h2>
                  <div className="section-content">
                    <p>{report.parsedSections.meetingSummary}</p>
                  </div>
                </section>
              )}

              {report?.parsedSections?.keyDiscussionPoints && (
                <CollapsibleSection id="discussion" title={t('reports.keyDiscussionPoints')}>
                  <div className="discussion-points">
                    {extractBulletPoints(report.parsedSections.keyDiscussionPoints).map((point, index) => (
                      <div key={index} className="discussion-point">
                        <ArrowRight className="point-icon" size={16} />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {report?.parsedSections?.actionItems && (
                <CollapsibleSection id="actions" title={t('reports.actionItems')}>
                  <div className="action-items">
                    {extractBulletPoints(report.parsedSections.actionItems).map((item, index) => (
                      <div key={index} className="action-item">
                        <CheckCircle className="action-icon" size={16} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {report?.parsedSections?.nextSteps && (
                <CollapsibleSection id="nextsteps" title={t('reports.nextSteps')}>
                  <div className="next-steps">
                    {extractBulletPoints(report.parsedSections.nextSteps).map((step, index) => (
                      <div key={index} className="next-step">
                        <Calendar className="step-icon" size={16} />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {report?.parsedSections?.importantDecisions && (
                <CollapsibleSection id="decisions" title={t('reports.importantDecisions')}>
                  <div className="important-decisions">
                    <p>{report.parsedSections.importantDecisions}</p>
                  </div>
                </CollapsibleSection>
              )}

              {report?.parsedSections?.analyticalInsights && (
                <CollapsibleSection id="insights" title={t('reports.analyticalInsights')}>
                  <div className="analytical-insights">
                    <p>{report.parsedSections.analyticalInsights}</p>
                  </div>
                </CollapsibleSection>
              )}

              {report?.parsedSections?.followUpRecommendations && (
                <CollapsibleSection id="recommendations" title={t('reports.followUpRecommendations')}>
                  <div className="followup-recommendations">
                    {extractBulletPoints(report.parsedSections.followUpRecommendations).map((recommendation, index) => (
                      <div key={index} className="recommendation-item">
                        <Lightbulb className="recommendation-icon" size={16} />
                        <span>{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {report?.parsedSections?.areasRequiringAttention && (
                <CollapsibleSection id="attention" title={t('reports.areasRequiringAttention')}>
                  <div className="attention-areas">
                    {extractBulletPoints(report.parsedSections.areasRequiringAttention).map((area, index) => (
                      <div key={index} className="attention-item">
                        <RotateCcw className="attention-icon" size={16} />
                        <span>{area}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {report?.parsedSections?.meetingTone && (
                <CollapsibleSection id="tone" title={t('reports.meetingTone')}>
                  <div className="meeting-tone">
                    {(() => {
                      const tonePoints = extractBulletPoints(report.parsedSections.meetingTone);
                      const toneData = {
                        overall: '',
                        engagement: '',
                        energy: '',
                        concerns: ''
                      };
                      
                      // Parse tone information
                      tonePoints.forEach(point => {
                        const lowerPoint = point.toLowerCase();
                        if (lowerPoint.includes('overall tone')) {
                          toneData.overall = point.split(':')[1]?.trim() || point;
                        } else if (lowerPoint.includes('engagement')) {
                          toneData.engagement = point.split(':')[1]?.trim() || point;
                        } else if (lowerPoint.includes('energy')) {
                          toneData.energy = point.split(':')[1]?.trim() || point;
                        } else if (lowerPoint.includes('concern') || lowerPoint.includes('resistance')) {
                          toneData.concerns = point.split(':')[1]?.trim() || point;
                        }
                      });
                      
                      return (
                        <div className="tone-analysis-grid">
                          {toneData.overall && (
                            <div className="tone-card overall-tone">
                              <div className="tone-icon">
                                <Smile size={32} />
                              </div>
                              <div className="tone-content">
                                <h4>Overall Tone</h4>
                                <p>{toneData.overall}</p>
                              </div>
                            </div>
                          )}
                          {toneData.engagement && (
                            <div className="tone-card engagement-tone">
                              <div className="tone-icon">
                                <Target size={32} />
                              </div>
                              <div className="tone-content">
                                <h4>Engagement Level</h4>
                                <p>{toneData.engagement}</p>
                              </div>
                            </div>
                          )}
                          {toneData.energy && (
                            <div className="tone-card energy-tone">
                              <div className="tone-icon">
                                <Zap size={32} />
                              </div>
                              <div className="tone-content">
                                <h4>Energy Level</h4>
                                <p>{toneData.energy}</p>
                              </div>
                            </div>
                          )}
                          {toneData.concerns && (
                            <div className="tone-card concerns-tone">
                              <div className="tone-icon">
                                <AlertTriangle size={32} />
                              </div>
                              <div className="tone-content">
                                <h4>Concerns/Resistance</h4>
                                <p>{toneData.concerns}</p>
                              </div>
                            </div>
                          )}
                          {/* Fallback for unstructured tone data */}
                          {!toneData.overall && !toneData.engagement && !toneData.energy && !toneData.concerns && (
                            tonePoints.map((tone, index) => (
                              <div key={index} className="tone-card general-tone">
                                <div className="tone-icon">
                                  <MessageCircle size={32} />
                                </div>
                                <div className="tone-content">
                                  <p>{tone}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })()} 
                  </div>
                </CollapsibleSection>
              )}

              {report?.parsedSections?.speakingTimeAnalysis && (
                <CollapsibleSection id="speaking" title={t('reports.speakingTimeAnalysis')}>
                  <div className="speaking-analysis">
                    {(() => {
                      const analysisPoints = extractBulletPoints(report.parsedSections.speakingTimeAnalysis);
                      const speakerData = [];
                      
                      // Parse speaker data and percentages with improved logic
                      analysisPoints.forEach(point => {
                        // Look for patterns like "Tony: 40%", "Tony (Role): ~35-45%", "- Tony: Dominant speaker - 40%"
                        // More comprehensive regex to capture various formats
                        const patterns = [
                          // Pattern 1: "Tony (Meeting Facilitator): ~40%" or "Tony: 40%"
                          /([A-Za-z]+)(?:\s*\([^)]+\))?:\s*[~]?(?:estimated\s+)?(\d+)(?:[-]\d+)?%/i,
                          // Pattern 2: "- Tony: Dominant speaker - 40%" or similar
                          /[-•*]?\s*([A-Za-z]+)(?:\s*\([^)]+\))?:?\s*[^\d]*[~]?(\d+)(?:[-]\d+)?%/i,
                          // Pattern 3: "Tony - 40%" or "Tony (~40%)"
                          /([A-Za-z]+)\s*[-:]?\s*[^\d]*[~(]?(\d+)(?:[-]\d+)?%/i
                        ];
                        
                        let match = null;
                        for (const pattern of patterns) {
                          match = point.match(pattern);
                          if (match && match[1] && match[2]) {
                            const name = match[1].trim();
                            const percentage = parseInt(match[2]);
                            
                            // Skip if name is just a number or too short
                            if (name.length >= 2 && !(/^\d+$/.test(name))) {
                              // Extract description (everything after the percentage or role)
                              let description = '';
                              const colonIndex = point.indexOf(':');
                              if (colonIndex !== -1) {
                                const afterColon = point.substring(colonIndex + 1);
                                // Remove the percentage part and get the description
                                description = afterColon.replace(/[~]?\d+(?:[-]\d+)?%/, '').replace(/^\s*[-]?\s*/, '').trim();
                              }
                              
                              speakerData.push({
                                name,
                                percentage,
                                description,
                                color: getSpeakerColor(speakerData.length)
                              });
                              break; // Found a match, stop trying other patterns
                            }
                          }
                        }
                      });
                      
                      // If no structured data found, show original format
                      if (speakerData.length === 0) {
                        return (
                          <div className="speaking-fallback">
                            {analysisPoints.map((analysis, index) => (
                              <div key={index} className="speaking-item">
                                <span>{analysis}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      
                      return (
                        <div className="speaking-breakdown">
                          <div className="speakers-list">
                            {speakerData.map((speaker, index) => (
                              <div key={index} className="speaker-card">
                                <div className="speaker-header">
                                  <div className="speaker-info">
                                    <div 
                                      className="speaker-avatar" 
                                      style={{ backgroundColor: speaker.color }}
                                    >
                                      {speaker.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="speaker-details">
                                      <h4>{speaker.name}</h4>
                                      <span className="speaker-percentage">{speaker.percentage}%</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="speaker-bar-container">
                                  <div 
                                    className="speaker-bar" 
                                    style={{ 
                                      width: `${speaker.percentage}%`,
                                      backgroundColor: speaker.color 
                                    }}
                                  ></div>
                                </div>
                                {speaker.description && (
                                  <p className="speaker-description">{speaker.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Visual pie chart representation */}
                          <div className="speaking-summary">
                            <div className="summary-chart">
                              <div className="chart-legend">
                                {speakerData.map((speaker, index) => (
                                  <div key={index} className="legend-item">
                                    <div 
                                      className="legend-color" 
                                      style={{ backgroundColor: speaker.color }}
                                    ></div>
                                    <span>{speaker.name}: {speaker.percentage}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()} 
                  </div>
                </CollapsibleSection>
              )}

              {report?.parsedSections?.keyQuotes && (
                <CollapsibleSection id="quotes" title={t('reports.keyQuotesFromConversation')}>
                  <div className="key-quotes">
                    {extractBulletPoints(report.parsedSections.keyQuotes).map((quote, index) => (
                      <div key={index} className="quote-item">
                        <blockquote>{quote}</blockquote>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {report?.parsedSections?.professionalAssessment && (
                <CollapsibleSection id="assessment" title={t('reports.professionalAssessment')}>
                  <div className="professional-assessment">
                    {extractBulletPoints(report.parsedSections.professionalAssessment).map((assessment, index) => (
                      <div key={index} className="assessment-item">
                        <span>{assessment}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Original Transcript Section */}
              {currentSession?.transcription_text && (
                <CollapsibleSection id="transcript" title={t('reports.originalTranscript')}>
                  <div className="transcript-content">
                    <div className="transcript-meta">
                      <span><strong>{t('reports.transcriptionLength')}:</strong> {currentSession.transcription_text.length.toLocaleString()} {t('reports.characters')}</span>
                      <span><strong>{t('reports.sessionDuration')}:</strong> {currentSession.duration ? `${Math.floor(currentSession.duration / 60)}:${(currentSession.duration % 60).toString().padStart(2, '0')}` : t('reports.unknown')}</span>
                    </div>
                    <div className="transcript-text">
                      <pre>{currentSession.transcription_text}</pre>
                    </div>
                  </div>
                </CollapsibleSection>
              )}


              {/* Download Section - Always Visible */}
              <section className="download-section">
                <button className="download-btn">
                  <Download size={16} />
                  {t('reports.downloadDetailedReport')}
                </button>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
