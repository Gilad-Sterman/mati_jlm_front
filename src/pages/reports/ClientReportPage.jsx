import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  Users, 
  Lightbulb,
  Search,
  Settings,
  DollarSign,
  MapPin,
  ArrowRight,
  Rocket,
  Monitor,
  BarChart3,
  Map,
  Zap,
  Flag
} from 'lucide-react';

export const ClientReportPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [report, setReport] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    // TODO: Fetch client report for session
    console.log('Loading client report for session:', sessionId);
    
    // Mock data for now - client-focused structure
    setTimeout(() => {
      setReport({
        id: 'client-report-123',
        sessionId,
        type: 'client',
        title: 'סיכום מנהלים',
        content: 'Structured client report content',
        status: 'draft',
        version: 1,
        createdAt: new Date().toISOString(),
        keyPoints: {
          executiveSummary: 'יזם מנוסה בתיירות עם פוטנציאל גבוה לצמיחה. מחזיק בידע עמוק בתחום הסיורים התרבותיים אך זקוק לחיזוק השיווק הדיגיטלי. המלצה: מעבר מיידי לפייסבוק עסקי + שותפות אסטרטגית.',
          immediateTasks: [
            {
              id: 1,
              title: 'פתיחת דף פייסבוק עסקי',
              description: 'יצירת נוכחות דיגיטלית ראשונית',
              deadline: '05/08/2025'
            },
            {
              id: 2,
              title: 'יצירת אתר נחיתה בסיסי',
              description: 'ויקס או וורדפרס פשוט עם טפסים',
              deadline: '15/08/2025'
            },
            {
              id: 3,
              title: 'חידוש קשר עם אברהם הוסטל',
              description: 'הצעת שותפות או חבילות משולבות',
              deadline: '08/08/2025'
            }
          ],
          businessJourney: {
            currentStage: 1, // 0-based index
            stages: [
              { id: 'idea', title: 'רעיון ראשוני', description: 'הרעיון נולד ומוגדר', icon: 'lightbulb' },
              { id: 'diagnosis', title: 'אבחון ראשוני', description: 'בוחן הזדמנויות ואתגרים', icon: 'search' },
              { id: 'mvp', title: 'פיתוח MVP', description: 'בניית גרסה ראשונית', icon: 'settings' },
              { id: 'customers', title: 'מציאת לקוחות', description: 'איתור והכשרת קהל יעד', icon: 'users' },
              { id: 'funding', title: 'גיוס השקעה', description: 'מימון לצמיחה', icon: 'dollarSign' }
            ]
          },
          currentStatus: {
            completed: ['הרעיון בשל ומוגדר', 'יש ניסיון וידע בתחום'],
            inProgress: ['בוחן דרכי התקדמות'],
            pending: ['זקוק לתכנית פעולה']
          },
          nextSteps: [
            'פיתוח MVP דיגיטלי',
            'בניית נוכחות אונליין',
            'בדיקת השוק',
            'מדידת תוצאות'
          ],
          whyNow: 'אתה בנקודה מושלמת - יש לך בסיס חזק ועכשיו צריך תכנית מותאמת אישית להתקדמות',
          strategicInsights: {
            speakingPercentage: 72,
            targetAudience: 'קהל משכיל ומבוגר'
          },
          nextMeeting: {
            date: '02/08/2025',
            time: '14:00',
            advisor: 'רונית כהן - מלווה מט"י תיירות',
            description: 'המלווה תתאם איתך את כל שלבי התכנית'
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
    setIsApproving(true);
    // TODO: Approve client report, send email, and generate summary report
    console.log('Approving client report - will send email and generate summary');
    
    setTimeout(() => {
      setIsApproving(false);
      // Navigate to summary report when ready
      navigate(`/reports/summary/${sessionId}`);
    }, 2000);
  };

  const handleRegenerate = async () => {
    // TODO: Trigger AI regeneration based on transcript + approved adviser report
    console.log('Regenerating client report');
  };

  // Helper component for business journey stages
  const BusinessJourneyStage = ({ stage, index, currentStage, isLast }) => {
    const isCurrent = index === currentStage;
    const isCompleted = index < currentStage;
    const isPending = index > currentStage;

    const getIcon = (iconName) => {
      const icons = {
        lightbulb: Lightbulb,
        search: Search,
        settings: Settings,
        users: Users,
        dollarSign: DollarSign
      };
      const IconComponent = icons[iconName] || Lightbulb;
      return <IconComponent size={20} />;
    };

    return (
      <div className={`journey-stage ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}>
        <div className="stage-icon">
          {getIcon(stage.icon)}
        </div>
        <div className="stage-content">
          <h4>{stage.title}</h4>
          <p>{stage.description}</p>
        </div>
        {isCurrent && <div className={`current-indicator ${document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'}`}>{t('reports.youAreHere')}</div>}
        {!isLast && <ArrowRight className="stage-arrow" size={16} />}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="client-report-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('reports.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-report-page">
      <div className="report-header">
        <div className="header-left">
          <button 
            className="back-button"
            onClick={() => navigate(`/reports/adviser/${sessionId}`)}
          >
            ← {t('reports.backToAdviserReport')}
          </button>
          <h1>{t('reports.clientReport')}</h1>
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
                disabled={isApproving}
              >
                {isApproving ? t('reports.approving') : t('reports.approveAndSend')}
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
        <div className="report-meta">
          <p><strong>{t('reports.session')}:</strong> {sessionId}</p>
          <p><strong>{t('reports.version')}:</strong> {report?.version}</p>
          <p><strong>{t('reports.created')}:</strong> {new Date(report?.createdAt).toLocaleDateString()}</p>
          <div className="client-notice">
            <p>{t('reports.clientNotice')}</p>
          </div>
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
            <div className="report-display client-report-display compact-layout">
              <h1 className="report-title">{report?.title}</h1>
              
              {/* Executive Summary */}
              <section className="executive-summary compact">
                <p className="summary-text">{report?.keyPoints?.executiveSummary}</p>
              </section>

              {/* Main Content Grid */}
              <div className="report-grid">
                {/* Left Column */}
                <div className="left-column">
                  {/* Immediate Tasks */}
                  <section className="immediate-tasks compact">
                    <h2>{t('reports.immediateTasks')}</h2>
                    <div className="tasks-list compact">
                      {report?.keyPoints?.immediateTasks?.map((task) => (
                        <div key={task.id} className="task-item compact">
                          <div className="task-number">{task.id}</div>
                          <div className="task-content">
                            <h4>{task.title}</h4>
                            <p>{task.description}</p>
                            <div className="task-deadline">
                              <Calendar size={14} />
                              {t('reports.dueBy')} {task.deadline}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Current Status */}
                  <section className="current-status compact">
                    <h3><MapPin size={16} className="section-icon" /> {t('reports.currentStatus')}</h3>
                    <div className="status-grid compact">
                      <div className="status-column completed">
                        <div className="status-header">
                          <CheckCircle size={16} />
                          <span>{t('reports.statusCompleted')}</span>
                        </div>
                        <div className="status-items">
                          {report?.keyPoints?.currentStatus?.completed?.map((item, index) => (
                            <div key={index} className="status-item">{item}</div>
                          ))}
                        </div>
                      </div>
                      <div className="status-column in-progress">
                        <div className="status-header">
                          <Clock size={16} />
                          <span>{t('reports.statusInProgress')}</span>
                        </div>
                        <div className="status-items">
                          {report?.keyPoints?.currentStatus?.inProgress?.map((item, index) => (
                            <div key={index} className="status-item">{item}</div>
                          ))}
                        </div>
                      </div>
                      <div className="status-column pending">
                        <div className="status-header">
                          <Target size={16} />
                          <span>{t('reports.statusPending')}</span>
                        </div>
                        <div className="status-items">
                          {report?.keyPoints?.currentStatus?.pending?.map((item, index) => (
                            <div key={index} className="status-item">{item}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Column */}
                <div className="right-column">
                  {/* Business Journey */}
                  <section className="business-journey compact">
                    <h3><Map size={16} className="section-icon" /> {t('reports.businessJourney')}</h3>
                    <div className="journey-stages compact">
                      {report?.keyPoints?.businessJourney?.stages?.map((stage, index) => (
                        <BusinessJourneyStage
                          key={stage.id}
                          stage={stage}
                          index={index}
                          currentStage={report?.keyPoints?.businessJourney?.currentStage}
                          isLast={index === report?.keyPoints?.businessJourney?.stages?.length - 1}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Next Steps & Why Now - Side by Side */}
                  <div className="side-by-side">
                    <section className="next-steps compact">
                      <h4><Target size={14} className="section-icon" /> {t('reports.nextStep')}</h4>
                      <div className="next-steps-list">
                        {report?.keyPoints?.nextSteps?.map((step, index) => (
                          <div key={index} className="next-step-item compact">
                            <Rocket size={12} />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="strategic-insights compact">
                      <h4>{t('reports.strategicInsights')}</h4>
                      <div className="insights-compact">
                        <div className="insight-item">
                          <div className="insight-value">{report?.keyPoints?.strategicInsights?.speakingPercentage}%</div>
                          <div className="insight-label">{t('reports.speakingPercentage')}</div>
                        </div>
                        <div className="insight-item">
                          <Target size={20} />
                          <div className="insight-label">{report?.keyPoints?.strategicInsights?.targetAudience}</div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Full Width */}
              <div className="bottom-section">
                {/* Why Now */}
                <section className="why-now compact">
                  <h4><Zap size={14} className="section-icon" /> {t('reports.whyNowTitle')}</h4>
                  <p className="why-now-text">{report?.keyPoints?.whyNow}</p>
                </section>

                {/* Next Meeting */}
                <section className="next-meeting compact">
                  <h4>{t('reports.nextMeetingTitle')}</h4>
                  <div className="meeting-details compact">
                    <div className="meeting-datetime">
                      <Calendar size={16} />
                      <span>{report?.keyPoints?.nextMeeting?.date} - {report?.keyPoints?.nextMeeting?.time}</span>
                    </div>
                    <div className="meeting-advisor">
                      <strong>{t('reports.meetingWith')} {report?.keyPoints?.nextMeeting?.advisor}</strong>
                    </div>
                    <div className="meeting-description">
                      {report?.keyPoints?.nextMeeting?.description}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>

      {isApproving && (
        <div className="approval-overlay">
          <div className="approval-progress">
            <div className="loading-spinner"></div>
            <p>{t('reports.sendingEmail')}</p>
            <p>{t('reports.generatingSummary')}</p>
          </div>
        </div>
      )}
    </div>
  );
};
