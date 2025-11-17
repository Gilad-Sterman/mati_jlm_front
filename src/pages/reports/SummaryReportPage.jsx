// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';

// export const SummaryReportPage = () => {
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const { t } = useTranslation();
  
//   const [report, setReport] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [emailStatus, setEmailStatus] = useState(null);

//   useEffect(() => {
//     // TODO: Fetch summary report for session
//     console.log('Loading summary report for session:', sessionId);
    
//     // Mock data for now
//     setTimeout(() => {
//       setReport({
//         id: 'summary-report-123',
//         sessionId,
//         type: 'summary',
//         title: 'Complete Session Summary & Analysis',
//         content: 'Executive summary and final analysis will be loaded here...',
//         status: 'completed',
//         version: 1,
//         createdAt: new Date().toISOString(),
//         emailSentAt: new Date().toISOString(),
//         crmUpdated: true
//       });
//       setEmailStatus('sent');
//       setIsLoading(false);
//     }, 1000);
//   }, [sessionId]);

//   const handleDownloadPDF = () => {
//     // TODO: Generate and download PDF
//     console.log('Downloading summary report PDF');
//   };

//   const handleEmailSummary = () => {
//     // TODO: Send summary report via email (optional feature)
//     console.log('Sending summary report via email');
//   };

//   const handleViewSession = () => {
//     navigate('/sessions');
//   };

//   if (isLoading) {
//     return (
//       <div className="summary-report-page">
//         <div className="loading-container">
//           <div className="loading-spinner"></div>
//           <p>{t('reports.loading')}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="summary-report-page">
//       <div className="report-header">
//         <div className="header-left">
//           <button 
//             className="back-button"
//             onClick={handleViewSession}
//           >
//             ← {t('reports.backToSessions')}
//           </button>
//           <h1>{t('reports.summaryReport')}</h1>
//           <span className="report-status completed">{t('reports.completed')}</span>
//         </div>
        
//         <div className="header-actions">
//           <button 
//             className="btn-secondary"
//             onClick={handleDownloadPDF}
//           >
//             📄 {t('reports.downloadPDF')}
//           </button>
//           <button 
//             className="btn-secondary"
//             onClick={handleEmailSummary}
//           >
//             📧 {t('reports.emailSummary')}
//           </button>
//         </div>
//       </div>

//       <div className="report-content">
//         <div className="report-meta">
//           <div className="meta-grid">
//             <div className="meta-item">
//               <strong>{t('reports.session')}:</strong>
//               <span>{sessionId}</span>
//             </div>
//             <div className="meta-item">
//               <strong>{t('reports.created')}:</strong>
//               <span>{new Date(report?.createdAt).toLocaleDateString()}</span>
//             </div>
//             <div className="meta-item">
//               <strong>{t('reports.clientEmailSent')}:</strong>
//               <span className={`status ${emailStatus}`}>
//                 {emailStatus === 'sent' ? '✅ ' + t('reports.sent') : '⏳ ' + t('reports.pending')}
//               </span>
//             </div>
//             <div className="meta-item">
//               <strong>{t('reports.crmUpdated')}:</strong>
//               <span className="status sent">
//                 {report?.crmUpdated ? '✅ ' + t('reports.updated') : '⏳ ' + t('reports.pending')}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="workflow-status">
//           <h3>{t('reports.workflowComplete')}</h3>
//           <div className="workflow-steps">
//             <div className="step completed">
//               <span className="step-icon">✅</span>
//               <span>{t('reports.adviserReportApproved')}</span>
//             </div>
//             <div className="step completed">
//               <span className="step-icon">✅</span>
//               <span>{t('reports.clientReportApproved')}</span>
//             </div>
//             <div className="step completed">
//               <span className="step-icon">✅</span>
//               <span>{t('reports.clientEmailSent')}</span>
//             </div>
//             <div className="step completed">
//               <span className="step-icon">✅</span>
//               <span>{t('reports.summaryGenerated')}</span>
//             </div>
//           </div>
//         </div>

//         <div className="report-body readonly">
//           <div className="report-display">
//             <h2>{report?.title}</h2>
//             <div className="content">
//               {report?.content || t('reports.noContent')}
//             </div>
//           </div>
//         </div>

//         <div className="report-notice">
//           <p>{t('reports.summaryNotice')}</p>
//         </div>
//       </div>
//     </div>
//   );
// };
