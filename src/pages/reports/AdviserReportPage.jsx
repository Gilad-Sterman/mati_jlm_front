import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Calendar, 
  RotateCcw, 
  CheckCircle, 
  ArrowRight, 
  Lightbulb, 
  Download 
} from 'lucide-react';

export const AdviserReportPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [report, setReport] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    quotes: true,
    insights: true,
    recommendations: true,
    followup: true
  });

  useEffect(() => {
    // TODO: Fetch adviser report for session
    console.log('Loading adviser report for session:', sessionId);
    
    // Mock data for now - structured analysis format
    setTimeout(() => {
      setReport({
        id: 'report-123',
        sessionId,
        type: 'adviser',
        title: 'ניתוח השיחה',
        content: 'Structured content will be rendered from key_points',
        status: 'draft',
        version: 1,
        createdAt: new Date().toISOString(),
        keyPoints: {
          energyAnalysis: {
            overallEnergy: { value: 87, label: 'רמת אנרגיה כללית', description: 'גבוהה - יזם מעורב ומתלהב' },
            readinessLevel: { value: 73, label: 'מוכנות להמשך', description: 'טובה - כדאי לשמור על קשר' },
            projectPotential: { value: 92, label: 'פוטנציאל לפרויקט', description: 'גבוה מאוד - המשך מיידי' }
          },
          systemRecommendation: 'היזם מציג רמת עניין גבוהה ופוטנציאל חזק. מומלץ לקדם לשלב הבא - שיחה ראשונה עם מלווה תוך 24-48 שעות.',
          speakingTime: {
            entrepreneur: { percentage: 72, minutes: 17.6 },
            advisor: { percentage: 28, minutes: 6.4 }
          },
          conversationQuality: {
            clarity: 'מעולה',
            depth: 'טוב',
            engagement: 'גבוהה'
          },
          keyQuotes: [
            {
              text: 'אני מאמין שאם הייתי משווק את עצמי נכון, הייתי עמוס בעבודה',
              timestamp: '18:34',
              insight: 'אמונה עצמית גבוהה'
            },
            {
              text: 'הקורונה פגעה בי קשה, אבל אני יודע שיש לי מה להציע',
              timestamp: '12:15',
              insight: 'מודעות לאתגרים'
            }
          ],
          energyDetails: {
            score: 8.5,
            maxScore: 10,
            speechPace: 'מהיר ונמרץ',
            tone: 'נלהב ומעורב',
            positiveWords: 47
          },
          professionalInsights: {
            strengths: ['ניסיון עשיר', 'קשרים איכותיים', 'תשוקה למקצוע'],
            improvements: ['שיווק דיגיטלי', 'מיתוג אישי', 'מדידת ביצועים']
          },
          consultingRecommendations: [
            'הוספת שאלות פתוחות להעמקת השיחה - היזם דיבר 72% מהזמן, אפשר להגיע ליחס מאוזן יותר של 60:40',
            'מיקוד יותר בתכנון מעשי ופחות בסיפור האישי',
            'הוספת שאלות על מדדי הצלחה ומטרות כמותיות'
          ],
          followUpPlan: {
            assignedAdvisor: 'רונית כהן - מלווה מט"י תיירות',
            handoverMeeting: '02/08/2025',
            continuousSupport: 'רונית תמשיך את כל התהליך'
          }
        }
      });
      setIsLoading(false);
    }, 1000);
  }, [sessionId]);

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
          <span className="collapse-icon">{isCollapsed ? '▼' : '▲'}</span>
        </div>
        {!isCollapsed && (
          <div className="section-content">
            {children}
          </div>
        )}
      </section>
    );
  };

  if (isLoading) {
    return (
      <div className="adviser-report-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('reports.loading')}</p>
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
            onClick={() => navigate('/sessions')}
          >
            ← {t('common.back')}
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
                {t('common.cancel')}
              </button>
              <button 
                className="btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? t('common.saving') : t('common.save')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="report-content">
        <div className="report-meta compact">
          <span><strong>{t('reports.session')}:</strong> {sessionId}</span>
          <span><strong>{t('reports.version')}:</strong> {report?.version}</span>
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
              <h1 className="report-title">⚡ {report?.title}</h1>
              
              {/* Main Grid Layout */}
              <div className="report-grid">
                {/* Left Column - Key Metrics */}
                <div className="metrics-column">
                  {/* Energy Analysis */}
                  <section className="analysis-section compact">
                    <h2>⚡ {t('reports.energyInConversation')}</h2>
                    <div className="energy-metrics horizontal">
                      <PercentageBar 
                        value={report?.keyPoints?.energyAnalysis?.overallEnergy?.value}
                        label={report?.keyPoints?.energyAnalysis?.overallEnergy?.label}
                        description={report?.keyPoints?.energyAnalysis?.overallEnergy?.description}
                        color="#28a745"
                      />
                      <PercentageBar 
                        value={report?.keyPoints?.energyAnalysis?.readinessLevel?.value}
                        label={report?.keyPoints?.energyAnalysis?.readinessLevel?.label}
                        description={report?.keyPoints?.energyAnalysis?.readinessLevel?.description}
                        color="#ffc107"
                      />
                      <PercentageBar 
                        value={report?.keyPoints?.energyAnalysis?.projectPotential?.value}
                        label={report?.keyPoints?.energyAnalysis?.projectPotential?.label}
                        description={report?.keyPoints?.energyAnalysis?.projectPotential?.description}
                        color="#dc3545"
                      />
                    </div>
                  </section>

                  {/* Energy Score */}
                  <section className="energy-details-section compact">
                    <EnergyScore 
                      score={report?.keyPoints?.energyDetails?.score}
                      maxScore={report?.keyPoints?.energyDetails?.maxScore}
                      details={report?.keyPoints?.energyDetails}
                    />
                  </section>
                </div>

                {/* Right Column - Analysis & Stats */}
                <div className="analysis-column">
                  {/* System Recommendation */}
                  <section className="recommendation-section compact">
                    <h3>{t('reports.systemRecommendation')}</h3>
                    <p className="system-recommendation">{report?.keyPoints?.systemRecommendation}</p>
                  </section>

                  {/* Speaking Time & Quality - Side by side */}
                  <div className="stats-row">
                    <section className="speaking-time-section compact">
                      <h3>{t('reports.speakingTime')}</h3>
                      <div className="speaking-stats vertical">
                        <div className="speaker-stat">
                          <span className="speaker-label">{t('reports.entrepreneur')}</span>
                          <span className="speaker-percentage">{report?.keyPoints?.speakingTime?.entrepreneur?.percentage}%</span>
                          <span className="speaker-time">({report?.keyPoints?.speakingTime?.entrepreneur?.minutes} {t('common.minutes')})</span>
                        </div>
                        <div className="speaker-stat">
                          <span className="speaker-label">{t('reports.advisor')}</span>
                          <span className="speaker-percentage">{report?.keyPoints?.speakingTime?.advisor?.percentage}%</span>
                          <span className="speaker-time">({report?.keyPoints?.speakingTime?.advisor?.minutes} {t('common.minutes')})</span>
                        </div>
                      </div>
                    </section>

                    <section className="quality-section compact">
                      <h3>{t('reports.conversationQuality')}</h3>
                      <div className="quality-metrics compact">
                        <div className="quality-item">
                          <span>{t('reports.clarity')}</span>
                          <span className="quality-value">{report?.keyPoints?.conversationQuality?.clarity}</span>
                        </div>
                        <div className="quality-item">
                          <span>{t('reports.depth')}</span>
                          <span className="quality-value">{report?.keyPoints?.conversationQuality?.depth}</span>
                        </div>
                        <div className="quality-item">
                          <span>{t('reports.engagement')}</span>
                          <span className="quality-value">{report?.keyPoints?.conversationQuality?.engagement}</span>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              {/* Collapsible Sections */}
              <CollapsibleSection id="quotes" title={t('reports.keyQuotes')}>
                <div className="quotes-list">
                  {report?.keyPoints?.keyQuotes?.map((quote, index) => (
                    <div key={index} className="quote-item">
                      <blockquote>"{quote.text}"</blockquote>
                      <div className="quote-meta">
                        <span className="quote-time">{t('reports.minute')} {quote.timestamp}</span>
                        <span className="quote-insight"> - {quote.insight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection id="insights" title={t('reports.professionalInsights')}>
                <div className="insights-grid">
                  <div className="insight-column">
                    <h4>{t('reports.strengths')}</h4>
                    <ul className="styled-list strengths-list">
                      {report?.keyPoints?.professionalInsights?.strengths?.map((strength, index) => (
                        <li key={index}>
                          <CheckCircle className="list-icon" size={16} />
                          <span className="list-text">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="insight-column">
                    <h4>{t('reports.improvements')}</h4>
                    <ul className="styled-list improvements-list">
                      {report?.keyPoints?.professionalInsights?.improvements?.map((improvement, index) => (
                        <li key={index}>
                          <ArrowRight className="list-icon" size={16} />
                          <span className="list-text">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection id="recommendations" title={t('reports.consultingRecommendations')}>
                <ul className="styled-list recommendations-list">
                  {report?.keyPoints?.consultingRecommendations?.map((recommendation, index) => (
                    <li key={index}>
                      <Lightbulb className="list-icon" size={16} />
                      <span className="list-text">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>

              <CollapsibleSection id="followup" title={t('reports.followUpPlan')}>
                <div className="followup-details styled-followup">
                  <div className="followup-item">
                    <User className="followup-icon" size={20} />
                    <div className="followup-content">
                      <strong>{t('reports.handoverTo')}</strong>
                      <span>{report?.keyPoints?.followUpPlan?.assignedAdvisor}</span>
                    </div>
                  </div>
                  <div className="followup-item">
                    <Calendar className="followup-icon" size={20} />
                    <div className="followup-content">
                      <strong>{t('reports.handoverMeeting')}</strong>
                      <span>{report?.keyPoints?.followUpPlan?.handoverMeeting}</span>
                    </div>
                  </div>
                  <div className="followup-item">
                    <RotateCcw className="followup-icon" size={20} />
                    <div className="followup-content">
                      <strong>{t('reports.continuousSupport')}</strong>
                      <span>{report?.keyPoints?.followUpPlan?.continuousSupport}</span>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

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
