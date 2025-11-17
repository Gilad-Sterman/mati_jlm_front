// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   User,
//   Calendar,
//   RotateCcw,
//   CheckCircle,
//   ArrowRight,
//   Lightbulb,
//   Download,
//   ArrowLeft,
//   Edit3,
//   Save,
//   X,
//   ChevronDown,
//   ChevronUp,
//   Mail,
//   Building,
//   FileText,
//   Smile,
//   Target,
//   Zap,
//   AlertTriangle,
//   MessageCircle,
//   Rocket
// } from 'lucide-react';
// import {
//   fetchReportsForSession,
// } from '../../store/reportSlice';
// import { useAppSocket } from '../../hooks/useAppSocket';
// import { fetchSessions } from '../../store/sessionSlice';

// export const AdviserReportPage = () => {
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const reportsFetched = useRef(false); // Track if reports already fetched
//   const { socketConnected, socketService } = useAppSocket();

//   const handleBackClick = () => {
//     // Use browser history to go back, fallback to sessions if no history
//     if (window.history.length > 1) {
//       navigate(-1);
//     } else {
//       navigate('/sessions');
//     }
//   };
//   const { t, i18n } = useTranslation();
//   const dispatch = useDispatch();

//   // Redux state - direct access like rest of app
//   const reportsBySession = useSelector(state => state.reports.reportsBySession);

//   // Get reports for this session
//   const sessionReports = reportsBySession[sessionId] || [];
//   const adviserReport = sessionReports.find(r => r.type === 'adviser');
//   const sessions = useSelector(state => state.sessions.sessions);
//   const currentSession = sessions.find(session => session.id === sessionId);
//   const [report, setReport] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [collapsedSections, setCollapsedSections] = useState({
//     quotes: true,
//     insights: true,
//     recommendations: true,
//     followup: true,
//     transcript: true,
//     rawContent: true,
//     tone: true,
//     speaking: true,
//     assessment: true
//   });

//   useEffect(() => {
//     // Fetch reports for this session if not already loaded (ONE TIME ONLY)
//     if (!adviserReport && !reportsFetched.current) {
//       reportsFetched.current = true;
//       dispatch(fetchReportsForSession(sessionId))
//         .unwrap()
//         .catch((error) => {
//           console.error('Error fetching reports:', error);
//           reportsFetched.current = false; // Allow retry on error
//         });
//     }
//   }, [dispatch, sessionId, adviserReport]);

//   useEffect(() => {
//     // Fetch sessions if current session is not loaded
//     if (!currentSession) {
//       dispatch(fetchSessions());
//     }
//   }, [dispatch, currentSession]);

//   // Socket listeners for regeneration events
//   useEffect(() => {
//     if (!socketConnected || !socketService.socket) return;

//     const socket = socketService.socket;

//     // Listen for regeneration events
//     const handleRegenerationStarted = (data) => {
//       console.log('🔄 Regeneration started:', data);
//       // Just log for now - the loading state is handled by the component that initiated it
//     };

//     const handleRegenerationComplete = async (data) => {
//       console.log('✅ Regeneration complete:', data);
//       if (data.sessionId === sessionId) {
//         // Refresh all reports to get the new version
//         console.log('🔄 Refreshing reports after regeneration...');
//         await dispatch(fetchReportsForSession(sessionId));
//         console.log('✅ Reports refreshed successfully');
//       }
//     };

//     const handleRegenerationError = (data) => {
//       console.error('❌ Regeneration error:', data);
//       if (data.sessionId === sessionId) {
//         // TODO: Show error notification to user
//         console.error('Regeneration failed:', data.message);
//       }
//     };

//     // Add listeners
//     socket.on('report_regeneration_started', handleRegenerationStarted);
//     socket.on('report_regeneration_complete', handleRegenerationComplete);
//     socket.on('report_regeneration_error', handleRegenerationError);

//     // Cleanup listeners
//     return () => {
//       socket.off('report_regeneration_started', handleRegenerationStarted);
//       socket.off('report_regeneration_complete', handleRegenerationComplete);
//       socket.off('report_regeneration_error', handleRegenerationError);
//     };
//   }, [socketConnected, socketService.socket, sessionId, dispatch]);

//   // Helper function to parse JSON report content
//   const parseReportContent = (content) => {
//     if (!content) {
//       return null;
//     }

//     // If content is already an object (from socket), use it directly
//     if (typeof content === 'object') {
//       // Check if it's the new structured format
//       if (content.level1_structure_display || content.level2_insights_and_analysis) {
//         return {
//           isNewFormat: true,
//           level1: content.level1_structure_display || {},
//           level2: content.level2_insights_and_analysis || {}
//         };
//       }
//       return content;
//     }

//     // If content is a string, try to parse as JSON
//     if (typeof content === 'string') {
//       try {
//         const parsed = JSON.parse(content);
//         // Check if it's the new structured format
//         if (parsed.level1_structure_display || parsed.level2_insights_and_analysis) {
//           return {
//             isNewFormat: true,
//             level1: parsed.level1_structure_display || {},
//             level2: parsed.level2_insights_and_analysis || {}
//           };
//         }
//         return parsed;
//       } catch (error) {
//         console.warn('Failed to parse report content as JSON, falling back to legacy markdown parsing:', error);
//         // Fallback to legacy markdown parsing for old reports
//         return parseLegacyMarkdownReport(content);
//       }
//     }

//     return null;
//   };

//   // Legacy markdown parser for backward compatibility
//   const parseLegacyMarkdownReport = (content) => {
//     const sections = {};

//     // Extract header information (client details, etc.)
//     const headerMatch = content.match(/^([\s\S]*?)(?=---)/m);
//     if (headerMatch) {
//       const headerText = headerMatch[1];
//       sections.header = headerText;

//       // Extract specific fields from header
//       const clientNameMatch = headerText.match(/\*\*Client Name:\*\*\s*(.+)/i);
//       const clientEmailMatch = headerText.match(/\*\*Client Email:\*\*\s*(.+)/i);
//       const businessDomainMatch = headerText.match(/\*\*Business Domain:\*\*\s*(.+)/i);
//       const adviserNameMatch = headerText.match(/\*\*Adviser Name:\*\*\s*(.+)/i);
//       const adviserEmailMatch = headerText.match(/\*\*Adviser Email:\*\*\s*(.+)/i);
//       const sessionTitleMatch = headerText.match(/\*\*Session Title:\*\*\s*(.+)/i);
//       const audioFileMatch = headerText.match(/\*\*Audio File:\*\*\s*(.+)/i);

//       sections.clientName = clientNameMatch ? clientNameMatch[1].trim() : null;
//       sections.clientEmail = clientEmailMatch ? clientEmailMatch[1].trim() : null;
//       sections.businessDomain = businessDomainMatch ? businessDomainMatch[1].trim() : null;
//       sections.adviserName = adviserNameMatch ? adviserNameMatch[1].trim() : null;
//       sections.adviserEmail = adviserEmailMatch ? adviserEmailMatch[1].trim() : null;
//       sections.sessionTitle = sessionTitleMatch ? sessionTitleMatch[1].trim() : null;
//       sections.audioFile = audioFileMatch ? audioFileMatch[1].trim() : null;
//     }

//     // Extract main sections using regex
//     const sectionRegex = /##\s*(\d+\.\s*)?([^\n]+)\n([\s\S]*?)(?=##\s*\d+\.|##\s*[A-Z]|$)/g;
//     let match;

//     while ((match = sectionRegex.exec(content)) !== null) {
//       const sectionTitle = match[2].trim();
//       const sectionContent = match[3].trim();

//       // Map section titles to keys for backward compatibility
//       if (sectionTitle.toLowerCase().includes('meeting summary') || sectionTitle.toLowerCase().includes('סיכום')) {
//         sections.meeting_summary = sectionContent;
//       } else if (sectionTitle.toLowerCase().includes('key discussion') || sectionTitle.toLowerCase().includes('נקודות מפתח')) {
//         sections.keyDiscussionPoints = sectionContent;
//       } else if (sectionTitle.toLowerCase().includes('action items') || sectionTitle.toLowerCase().includes('פעולות')) {
//         sections.actionItems = sectionContent;
//       } else if (sectionTitle.toLowerCase().includes('next steps') || sectionTitle.toLowerCase().includes('צעדים הבאים')) {
//         sections.nextSteps = sectionContent;
//       } else if (sectionTitle.toLowerCase().includes('important decisions') || sectionTitle.toLowerCase().includes('החלטות')) {
//         sections.importantDecisions = sectionContent;
//       } else if (sectionTitle.toLowerCase().includes('analytical insights') || sectionTitle.toLowerCase().includes('תובנות')) {
//         sections.analyticalInsights = sectionContent;
//       } else if (sectionTitle.toLowerCase().includes('recommendations for follow') || sectionTitle.toLowerCase().includes('המלצות')) {
//         sections.followUpRecommendations = sectionContent;
//       } else if (sectionTitle.toLowerCase().includes('areas requiring attention') || sectionTitle.toLowerCase().includes('תחומים הדורשים')) {
//         sections.areasRequiringAttention = sectionContent;
//       } else if (sectionTitle.toLowerCase().includes('meeting tone') || sectionTitle.toLowerCase().includes('engagement analysis') || sectionTitle.toLowerCase().includes('טון הפגישה')) {
//         sections.meetingTone = sectionContent;
//       } else if (sectionTitle.toLowerCase().includes('speaking time') || sectionTitle.toLowerCase().includes('זמן דיבור')) {
//         sections.speakingTimeAnalysis = sectionContent;
//       } else if (sectionTitle.toLowerCase().includes('key quotes') || sectionTitle.toLowerCase().includes('ציטוטים')) {
//         sections.keyQuotes = sectionContent;
//       } else if (sectionTitle.toLowerCase().includes('professional assessment') || sectionTitle.toLowerCase().includes('הערכה מקצועית')) {
//         sections.professionalAssessment = sectionContent;
//       }
//     }

//     return sections;
//   };

//   // Update local report state when Redux data changes
//   useEffect(() => {
//     if (adviserReport) {
//       const reportContent = adviserReport.content;

//       // Parse the report content (JSON or legacy markdown)
//       const parsedSections = parseReportContent(reportContent);

//       // Create enhanced report object with actual parsed data
//       const enhancedReport = {
//         // Use actual report data
//         id: adviserReport.id,
//         sessionId: adviserReport.session_id,
//         type: adviserReport.type,
//         title: adviserReport.title || 'ניתוח השיחה',
//         content: adviserReport.content,
//         status: adviserReport.status,
//         version: adviserReport.version_number || 1,
//         createdAt: adviserReport.created_at,

//         // Use parsed sections from actual report content
//         parsedSections: parsedSections || {},

//         // Extract specific data for display
//         clientInfo: parsedSections ? {
//           name: parsedSections.clientName,
//           email: parsedSections.clientEmail,
//           businessDomain: parsedSections.businessDomain,
//           sessionTitle: parsedSections.sessionTitle,
//           audioFile: parsedSections.audioFile
//         } : {},

//         adviserInfo: parsedSections ? {
//           name: parsedSections.adviserName,
//           email: parsedSections.adviserEmail
//         } : {}
//       };

//       setReport(enhancedReport);
//     }
//   }, [adviserReport]);

//   const handleApprove = async () => {
//     // TODO: Approve report and trigger client report generation
//     console.log('Approving adviser report');
//     // Navigate to client report when ready
//     navigate(`/reports/client/${sessionId}`);
//   };

//   const handleRegenerate = async (type, index) => {
//     // TODO: Trigger AI regeneration
//     console.log('Regenerating ' + type + ' ' + index);
//   };

//   // Helper component for collapsible sections
//   const CollapsibleSection = ({ id, title, children, defaultCollapsed = false }) => {
//     const isCollapsed = collapsedSections[id];

//     const toggleSection = () => {
//       setCollapsedSections(prev => ({
//         ...prev,
//         [id]: !prev[id]
//       }));
//     };

//     return (
//       <section className={`collapsible-section ${isCollapsed ? 'collapsed' : ''}`}>
//         <div className="section-header" onClick={toggleSection}>
//           <h3>{title}</h3>
//           <span className="collapse-icon">{isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</span>
//         </div>
//         {!isCollapsed && (
//           <div className="section-content">
//             {children}
//           </div>
//         )}
//       </section>
//     );
//   };

//   // Level 1 Structure Display Component (Non-editable metrics)
//   const Level1StructureDisplay = ({ level1Data, sessionData }) => {
//     if (!level1Data) return null;

//     const [notes, setNotes] = useState('');
//     const [isRegenerating, setIsRegenerating] = useState(false);
//     const [showRegenerationLoader, setShowRegenerationLoader] = useState(false);

//     // Listen for regeneration completion to clear loading state
//     useEffect(() => {
//       if (!socketConnected || !socketService.socket) return;

//       const socket = socketService.socket;

//       const handleRegenerationStarted = (data) => {
//         if (data.sessionId === sessionId) {
//           setShowRegenerationLoader(true);
//         }
//       };

//       const handleRegenerationComplete = (data) => {
//         if (data.sessionId === sessionId) {
//           setIsRegenerating(false);
//           setShowRegenerationLoader(false);
//         }
//       };

//       const handleRegenerationError = (data) => {
//         if (data.sessionId === sessionId) {
//           setIsRegenerating(false);
//           setShowRegenerationLoader(false);
//         }
//       };

//       socket.on('report_regeneration_started', handleRegenerationStarted);
//       socket.on('report_regeneration_complete', handleRegenerationComplete);
//       socket.on('report_regeneration_error', handleRegenerationError);

//       return () => {
//         socket.off('report_regeneration_started', handleRegenerationStarted);
//         socket.off('report_regeneration_complete', handleRegenerationComplete);
//         socket.off('report_regeneration_error', handleRegenerationError);
//       };
//     }, [socketConnected, socketService.socket, sessionId]);

//     // const handleRegenerateFullReport = async () => {
//     //   const trimmedNotes = notes.trim();
//     //   if (!trimmedNotes) {
//     //     return; // Button should be disabled, but extra safety check
//     //   }

//     //   if (!window.confirm(t('reports.confirmFullRegeneration'))) {
//     //     return;
//     //   }

//     //   setIsRegenerating(true);
//     //   try {
//     //     const jobInfo = await dispatch(regenerateFullReport({
//     //       sessionId,
//     //       notes: trimmedNotes
//     //     })).unwrap();

//     //     console.log('✅ Regeneration job started:', jobInfo);

//     //     // Clear notes after job starts successfully
//     //     setNotes('');

//     //     // Keep loading state - will be cleared by socket event
//     //     // Note: Don't refresh yet - wait for socket event when regeneration completes
//     //   } catch (error) {
//     //     console.error('Error regenerating full report:', error);
//     //     setIsRegenerating(false); // Clear loading on API error (not AI processing error)
//     //     // TODO: Show error message to user
//     //   }
//     //   // Note: Don't clear loading state on success - wait for socket events
//     // };

//     return (
//       <div className="level1-structure-display">
//         <div className="structure-header">
//           <h2>{sessionData?.title}</h2>
//         </div>

//         {/* Key Metrics - from AI */}
//         {level1Data.key_metrics && (
//           <section className="key-metrics-section">
//             <h3>{t('reports.keyMetrics')}</h3>
//             <div className="metrics-grid">
//               {level1Data.key_metrics.word_count && (
//                 <div className="metric-card">
//                   <div className="metric-icon">
//                     <FileText size={24} />
//                   </div>
//                   <div className="metric-content">
//                     <div className="metric-value">{level1Data.key_metrics.word_count}</div>
//                     <div className="metric-label">{t('reports.wordCount')}</div>
//                   </div>
//                 </div>
//               )}
//               {level1Data.key_metrics.speaker_count && (
//                 <div className="metric-card">
//                   <div className="metric-icon">
//                     <User size={24} />
//                   </div>
//                   <div className="metric-content">
//                     <div className="metric-value">{level1Data.key_metrics.speaker_count}</div>
//                     <div className="metric-label">{t('reports.speakerCount')}</div>
//                   </div>
//                 </div>
//               )}
//               {level1Data.key_metrics.engagement_score && (
//                 <div className="metric-card">
//                   <div className="metric-icon">
//                     <Target size={24} />
//                   </div>
//                   <div className="metric-content">
//                     <div className="metric-value">{level1Data.key_metrics.engagement_score}</div>
//                     <div className="metric-label">{t('reports.engagementScore')}</div>
//                   </div>
//                 </div>
//               )}
//               {sessionData?.duration && (
//                 <div className="metric-card">
//                   <div className="metric-icon">
//                     <Calendar size={24} />
//                   </div>
//                   <div className="metric-content">
//                     <div className="metric-value">{Math.floor(sessionData.duration / 60)}:{(sessionData.duration % 60).toString().padStart(2, '0')}</div>
//                     <div className="metric-label">{t('reports.duration')}</div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </section>
//         )}

//         {/* Main Topics */}
//         {level1Data.main_topics && Array.isArray(level1Data.main_topics) && level1Data.main_topics.length > 0 && (
//           <section className="main-topics-section">
//             <div>
//               <h3>{t('reports.mainTopics')}</h3>
//               <div className="topics-list">
//                 {level1Data.main_topics.map((topic, index) => (
//                   <div key={index} className="topic-item">
//                     <Lightbulb className="topic-icon" size={16} />
//                     <span>{topic}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//             {/* General Sentiment */}
//             {level1Data.general_sentiment && (
//               <section className="general-sentiment-section">
//                 <h3>{t('reports.generalSentiment')}</h3>
//                 <div className="sentiment-display">
//                   <Smile className="sentiment-icon" size={20} />
//                   <span className="sentiment-value">{level1Data.general_sentiment}</span>
//                 </div>
//               </section>
//             )}
//           </section>
//         )}

//         {/* Conversation Summary */}
//         {level1Data.conversation_summary && (
//           <section className="conversation-summary-section">
//             <h3>{t('reports.conversationSummary')}</h3>
//             <div className="summary-grid">
//               {level1Data.conversation_summary.ai_summary && (
//                 <div className="summary-card">
//                   <h4>{t('reports.aiSummary')}</h4>
//                   <p>{level1Data.conversation_summary.ai_summary}</p>
//                 </div>
//               )}
//               {level1Data.conversation_summary.advisor_summary && (
//                 <div className="summary-card">
//                   <h4>{t('reports.advisorSummary')}</h4>
//                   <p>{level1Data.conversation_summary.advisor_summary}</p>
//                 </div>
//               )}
//             </div>
//           </section>
//         )}

//         {/* Notes Section with Regenerate Button */}
//         <section className="notes-regenerate-section">
//           <div className="section-header-with-regenerate">
//             <h3>{t('reports.notesAndActions')}</h3>
//           </div>

//           {showRegenerationLoader ? (
//             // Show animated loader during regeneration
//             <div className="regeneration-loader">
//               <div className="loader-content">
//                 <div className="loader-animation">
//                   <div className="spinner-ring">
//                     <div></div>
//                     <div></div>
//                     <div></div>
//                     <div></div>
//                   </div>
//                 </div>
//                 <div className="loader-text">
//                   <h4>🤖 {t('reports.regeneratingReport')}</h4>
//                   <p>{t('reports.regenerationInProgress')}</p>
//                   <div className="progress-dots">
//                     <span></span>
//                     <span></span>
//                     <span></span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             // Show normal notes content
//             <div className="notes-content">
//               <div className="regenerate-warning">
//                 <AlertTriangle size={16} />
//                 <span>{t('reports.regenerateWarning')}</span>
//               </div>

//               <div className="notes-input-section">
//                 <label className="notes-label">
//                   <Edit3 size={14} />
//                   {t('reports.notesForRegeneration')}
//                 </label>
//                 <textarea
//                   className="notes-textarea"
//                   value={notes}
//                   onChange={(e) => setNotes(e.target.value)}
//                   placeholder={t('reports.notesPlaceholder')}
//                   rows={3}
//                 />
//               </div>
//               <button
//                 className={`regenerate-full-btn ${isRegenerating ? 'loading' : ''}`}
//                 onClick={handleRegenerateFullReport}
//                 disabled={isRegenerating || !notes.trim()}
//                 title={t('reports.regenerateFullReportTooltip')}
//               >
//                 <RotateCcw size={16} className={isRegenerating ? 'spinning' : ''} />
//                 {isRegenerating ? t('reports.regenerating') : t('reports.regenerateFullReport')}
//               </button>
//             </div>
//           )}
//         </section>
//       </div>
//     );
//   };

//   // Level 2 Insights and Analysis Component (Editable advisor workspace)
//   const Level2InsightsAndAnalysis = ({ level2Data }) => {
//     if (!level2Data) return null;

//     const getInsightTypeIcon = (type) => {
//       switch (type) {
//         case 'opportunity': return <Rocket size={16} />;
//         case 'challenge': return <AlertTriangle size={16} />;
//         case 'strength': return <CheckCircle size={16} />;
//         case 'concern': return <AlertTriangle size={16} />;
//         default: return <Lightbulb size={16} />;
//       }
//     };

//     const getInsightTypeColor = (type) => {
//       switch (type) {
//         case 'opportunity': return 'insight-opportunity';
//         case 'challenge': return 'insight-challenge';
//         case 'strength': return 'insight-strength';
//         case 'concern': return 'insight-concern';
//         default: return 'insight-default';
//       }
//     };

//     const getConfidenceColor = (level) => {
//       switch (level) {
//         case 'high': return 'confidence-high';
//         case 'medium': return 'confidence-medium';
//         case 'low': return 'confidence-low';
//         default: return 'confidence-medium';
//       }
//     };

//     const getPriorityColor = (priority) => {
//       switch (priority) {
//         case 'high': return 'priority-high';
//         case 'medium': return 'priority-medium';
//         case 'low': return 'priority-low';
//         default: return 'priority-medium';
//       }
//     };

//     return (
//       <div className="level2-insights-analysis">
//         <div className="workspace-header">
//           <h2>{t('reports.insightsAndAnalysis')}</h2>
//         </div>

//         {/* Side by Side Layout for Insights and Recommendations */}
//         <div className="insights-recommendations-container">
//           {/* Part A - Insights */}
//           <div className="insights-section">
//             <div className="section-header-with-add">
//               <h3>{t('reports.insights')}</h3>
//               <button className="add-btn" onClick={() => console.log('Add insight')}>
//                 <Lightbulb size={16} />
//                 {t('reports.addInsight')}
//               </button>
//             </div>

//             <div className="insights-list">
//               {level2Data.insights && Array.isArray(level2Data.insights) && level2Data.insights.length > 0 ? (
//                 level2Data.insights.map((insight, index) => (
//                   <div key={index} className={`insight-card ${getInsightTypeColor(insight.insight_type)}`}>
//                     <div className="insight-header">
//                       <div className="insight-type">
//                         {getInsightTypeIcon(insight.insight_type)}
//                         <span className="insight-type-label">{insight.insight_type}</span>
//                       </div>
//                       <div className="card-actions">
//                         {insight.confidence_level && (
//                           <div className={`confidence-badge ${getConfidenceColor(insight.confidence_level)}`}>
//                             {insight.confidence_level}
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     <div className="insight-content">
//                       <h4 className="insight-title">{insight.insight_title}</h4>
//                       <p className="insight-description">{insight.description}</p>

//                       {insight.entrepreneur_quote && (
//                         <div className="insight-quote">
//                           <MessageCircle size={14} />
//                           <blockquote>"{insight.entrepreneur_quote}"</blockquote>
//                         </div>
//                       )}

//                       {/* Notes Section */}
//                       <div className="notes-section">
//                         <div>
//                           <label className="notes-label">
//                             <Edit3 size={12} />
//                             {t('reports.notes')}:
//                           </label>
//                           <button className="regenerate-btn" onClick={() => handleRegenerate("insight", index)}>
//                             <RotateCcw size={14} />
//                           </button>
//                         </div>
//                         <textarea
//                           className="notes-textarea"
//                           placeholder={t('reports.addNotesPlaceholder')}
//                           rows={2}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="empty-state">
//                   <Lightbulb size={48} />
//                   <p>{t('reports.noInsightsYet')}</p>
//                   <button className="add-btn primary" onClick={() => console.log('Add first insight')}>
//                     <Lightbulb size={16} />
//                     {t('reports.addFirstInsight')}
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Part B - Recommendations */}
//           <div className="recommendations-section">
//             <div className="section-header-with-add">
//               <h3>{t('reports.recommendations')}</h3>
//               <button className="add-btn" onClick={() => console.log('Add recommendation')}>
//                 <Target size={16} />
//                 {t('reports.addRecommendation')}
//               </button>
//             </div>

//             <div className="recommendations-list">
//               {level2Data.recommendations && Array.isArray(level2Data.recommendations) && level2Data.recommendations.length > 0 ? (
//                 level2Data.recommendations.map((recommendation, index) => (
//                   <div key={index} className="recommendation-card">
//                     <div className="recommendation-header">
//                       <div className="priority-domain">
//                         <div className={`priority-badge ${getPriorityColor(recommendation.priority)}`}>
//                           {recommendation.priority} {t('reports.priority')}
//                         </div>
//                         {recommendation.domain && (
//                           <div className="domain-badge">
//                             {recommendation.domain}
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     <div className="recommendation-content">
//                       <p className="recommendation-description">{recommendation.recommendation_description}</p>

//                       {recommendation.execution_target && (
//                         <div className="execution-target">
//                           <Calendar size={14} />
//                           <span><strong>{t('reports.executionTarget')}:</strong> {recommendation.execution_target}</span>
//                         </div>
//                       )}

//                       {recommendation.linked_insight_id !== null && recommendation.linked_insight_id !== undefined && level2Data.insights && level2Data.insights[recommendation.linked_insight_id] && (
//                         <div className="linked-insight">
//                           <ArrowRight size={14} />
//                           <span><strong>{t('reports.linkedTo')}:</strong> {level2Data.insights[recommendation.linked_insight_id].insight_title}</span>
//                         </div>
//                       )}

//                       {/* Notes Section */}
//                       <div className="notes-section">
//                         <div>

//                           <label className="notes-label">
//                             <Edit3 size={12} />
//                             {t('reports.notes')}:
//                           </label>
//                           <button className="regenerate-btn" onClick={() => console.log('Regenerate recommendation', index)}>
//                             <RotateCcw size={14} />
//                           </button>
//                         </div>
//                         <textarea
//                           className="notes-textarea"
//                           placeholder={t('reports.addNotesPlaceholder')}
//                           rows={2}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="empty-state">
//                   <Target size={48} />
//                   <p>{t('reports.noRecommendationsYet')}</p>
//                   <button className="add-btn primary" onClick={() => console.log('Add first recommendation')}>
//                     <Target size={16} />
//                     {t('reports.addFirstRecommendation')}
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Show loading if we're fetching reports for the first time
//   if (!adviserReport && reportsFetched.current) {
//     return (
//       <div className="adviser-report-page">
//         <div className="loading-container">
//           <div className="loading-spinner"></div>
//           <p>{t('reports.loading')}</p>
//         </div>
//       </div>
//     );
//   }

//   if (!adviserReport && !reportsFetched.current) {
//     return (
//       <div className="adviser-report-page">
//         <div className="error-container">
//           <h2>{t('reports.noReportFound')}</h2>
//           <p>{t('reports.noAdviserReportMessage')}</p>
//           <button
//             className="btn-primary"
//             onClick={() => navigate('/sessions')}
//           >
//             {t('common.backToSessions')}
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!report) {
//     return (
//       <div className="adviser-report-page">
//         <div className="loading-container">
//           <div className="loading-spinner"></div>
//           <p>{t('reports.processingReport')}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="adviser-report-page">
//       <div className="report-header">
//         <div className="header-left">
//           <button
//             className="back-button"
//             onClick={handleBackClick}
//           >
//             {i18n.language === 'he' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
//             {t('common.back')}
//           </button>
//           <h1>{t('reports.adviserReport')}</h1>
//         </div>

//         <div className="header-actions">
//           <>
//             <button
//               className="btn-primary"
//               onClick={handleApprove}
//             >
//               {t('reports.approve')}
//             </button>
//           </>
//         </div>
//       </div>

//       <div className="report-content">
//         <div className="report-meta compact">
//           <span><strong>{t('reports.version')}:</strong> {report?.version}</span>
//           <span><strong>{t('reports.client')}:</strong> {currentSession?.client?.name}</span>
//           <span><strong>{t('reports.created')}:</strong> {new Date(report?.createdAt).toLocaleDateString()}</span>
//         </div>

//         <div className="report-body">
//           <div className="report-display structured-report compact-layout">
//             {/* Check if this is the new structured format */}
//             {report?.parsedSections?.isNewFormat ? (
//               <div className="new-structured-report">
//                 {/* Level 1 - Structure Display (Non-editable metrics) */}
//                 <Level1StructureDisplay
//                   level1Data={report.parsedSections.level1}
//                   sessionData={currentSession}
//                 />

//                 {/* Level 2 - Insights and Analysis (Editable advisor workspace) */}
//                 <Level2InsightsAndAnalysis
//                   level2Data={report.parsedSections.level2}
//                 />
//               </div>
//             ) : (
//               <div className="legacy-report">
//                 <h1 className="report-title">{currentSession?.title}</h1>

//                 {/* Original Transcript Section */}
//                 {currentSession?.transcription_text && (
//                   <CollapsibleSection id="transcript" title={t('reports.originalTranscript')}>
//                     <div className="transcript-content">
//                       <div className="transcript-meta">
//                         <span><strong>{t('reports.transcriptionLength')}:</strong> {currentSession.transcription_text.length.toLocaleString()} {t('reports.characters')}</span>
//                         <span><strong>{t('reports.sessionDuration')}:</strong> {currentSession.duration ? `${Math.floor(currentSession.duration / 60)}:${(currentSession.duration % 60).toString().padStart(2, '0')}` : t('reports.unknown')}</span>
//                       </div>
//                       <div className="transcript-text">
//                         <pre>{currentSession.transcription_text}</pre>
//                       </div>
//                     </div>
//                   </CollapsibleSection>
//                 )}


//                 {/* Download Section - Always Visible */}
//                 <section className="download-section">
//                   <button className="download-btn">
//                     <Download size={16} />
//                     {t('reports.downloadDetailedReport')}
//                   </button>
//                 </section>
//               </div>
//             )}
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };
