import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { X, FileText, Send, Eye, Download, Edit3, Save, XCircle } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { updateReport } from '../../../store/reportSlice';

export function ExportReportModal({ 
    isOpen, 
    onClose, 
    onExport, 
    report, 
    session, 
    isLoading = false 
}) {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const [previewMode, setPreviewMode] = useState('preview'); // 'preview' or 'details'
    const [isDownloading, setIsDownloading] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [logoDataUrl, setLogoDataUrl] = useState('/logo-full.svg');
    const [pdfLogoUrl, setPdfLogoUrl] = useState('/logo-full.svg');
    const pdfContentRef = useRef(null);
    
    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Parse report content
    const getReportContent = () => {
        if (!report?.content) return null;
        
        try {
            return typeof report.content === 'string' ? JSON.parse(report.content) : report.content;
        } catch (error) {
            console.error('Error parsing report content:', error);
            return null;
        }
    };

    const content = getReportContent();
    
    // Get display content (edited or saved)
    const getDisplayContent = () => {
        return isEditing ? editedContent : content;
    };
    
    // Get PDF content (always saved content)
    const getPdfContent = () => {
        return content;
    };
    
    const displayContent = getDisplayContent();

    // Convert SVG to canvas image for PDF compatibility while keeping original for display
    useEffect(() => {
        const convertSvgForPdf = async () => {
            try {
                // Create an image element to load the SVG
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    // Create canvas and draw the SVG
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Set canvas size to match SVG dimensions
                    canvas.width = 342; // SVG viewBox width
                    canvas.height = 210; // SVG viewBox height
                    
                    // Draw the image to canvas
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Convert to PNG data URL for PDF
                    const pngDataUrl = canvas.toDataURL('image/png');
                    setPdfLogoUrl(pngDataUrl);
                };
                
                img.onerror = () => {
                    console.error('Failed to load SVG for conversion');
                    setPdfLogoUrl('/logo-t.png'); // Fallback to PNG
                };
                
                // Load the SVG
                img.src = '/logo-full.svg';
                
            } catch (error) {
                console.error('Error converting SVG for PDF:', error);
                setPdfLogoUrl('/logo-t.png'); // Fallback to PNG
            }
        };

        if (isOpen) {
            convertSvgForPdf();
        }
    }, [isOpen]);

    // Function to translate categories from English to current language
    const translateCategory = (category) => {
        const categoryMap = {
            'what we learned about the clients business': t('reports.categoryBusiness'),
            'decisions made': t('reports.categoryDecisions'),
            'opportunities/risks or concerns that came up': t('reports.categoryOpportunities')
        };
        return categoryMap[category] || category;
    };

    // Function to translate owner values
    const translateOwner = (owner) => {
        const ownerMap = {
            'client': t('reports.ownerClient'),
            'adviser': t('reports.ownerAdviser'),
            'advisor': t('reports.ownerAdviser') // Handle both spellings
        };
        return ownerMap[owner?.toLowerCase()] || owner;
    };

    // Function to translate status values
    const translateStatus = (status) => {
        const statusMap = {
            'open': t('reports.statusOpen'),
            'in progress': t('reports.statusInProgress'),
            'completed': t('reports.statusCompleted')
        };
        return statusMap[status?.toLowerCase()] || status;
    };

    // Edit mode handlers
    const handleEdit = () => {
        if (!content) return;
        setEditedContent(JSON.parse(JSON.stringify(content))); // Deep copy
        setIsEditing(true);
        setHasUnsavedChanges(false);
    };
    
    const handleSave = async () => {
        if (!editedContent || isSaving) return;
        
        try {
            setIsSaving(true);
            
            // Clean up empty quotes before saving
            const cleanedContent = { ...editedContent };
            if (cleanedContent.key_insights && Array.isArray(cleanedContent.key_insights)) {
                cleanedContent.key_insights = cleanedContent.key_insights.map(insight => ({
                    ...insight,
                    supporting_quotes: insight.supporting_quotes ? 
                        insight.supporting_quotes.filter(quote => quote && quote.trim()) : []
                }));
            }
            
            await dispatch(updateReport({ 
                reportId: report.id, 
                updateData: { content: cleanedContent } 
            })).unwrap();
            
            setIsEditing(false);
            setHasUnsavedChanges(false);
            setEditedContent(null);
        } catch (error) {
            console.error('Error saving report:', error);
            alert(t('reports.saveError') || 'Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancel = () => {
        if (hasUnsavedChanges) {
            if (window.confirm(t('reports.discardChanges') || 'Discard unsaved changes?')) {
                setEditedContent(null);
                setIsEditing(false);
                setHasUnsavedChanges(false);
            }
        } else {
            setEditedContent(null);
            setIsEditing(false);
            setHasUnsavedChanges(false);
        }
    };
    
    const handleContentChange = (field, value, index = null, subField = null) => {
        if (!isEditing || !editedContent) return;
        
        const newContent = { ...editedContent };
        
        if (index !== null && subField) {
            // Handle array items with subfields (e.g., key_insights[0].content)
            newContent[field][index][subField] = value;
        } else if (index !== null) {
            // Handle array items (e.g., supporting_quotes[0])
            newContent[field][index] = value;
        } else {
            // Handle direct fields (e.g., general_summary)
            newContent[field] = value;
        }
        
        setEditedContent(newContent);
        setHasUnsavedChanges(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading || isGeneratingPDF || !pdfContentRef.current || isEditing) return;
        
        if (isEditing) {
            alert(t('reports.saveChangesBeforePDF') || 'Please save your changes before exporting.');
            return;
        }
        
        try {
            setIsGeneratingPDF(true);
            
            // Switch to PNG logo for PDF generation
            const logoImg = pdfContentRef.current.querySelector('.mati-logo');
            const originalSrc = logoImg.src;
            logoImg.src = pdfLogoUrl;
            
            // Generate PDF first
            const element = pdfContentRef.current;
            const clientName = session?.client?.name || 'Client';
            const sessionDate = new Date(session?.created_at).toLocaleDateString().replace(/\//g, '-');
            const filename = `${clientName}_Report_${sessionDate}.pdf`;
            
            const opt = {
                margin: 1,
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    allowTaint: true
                },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            
            // Generate PDF as blob instead of downloading
            const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
            
            // Create FormData to send PDF to backend
            const formData = new FormData();
            formData.append('pdf', pdfBlob, filename);
            
            // Call the export function with the PDF
            await onExport(formData);
            
            // Restore original logo after PDF generation
            logoImg.src = originalSrc;
            
        } catch (error) {
            console.error('Error generating PDF for export:', error);
            alert(t('reports.pdfGenerationError') || 'Failed to generate PDF. Please try again.');
            // Restore original logo on error too
            const logoImg = pdfContentRef.current?.querySelector('.mati-logo');
            if (logoImg) logoImg.src = logoDataUrl;
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleClose = () => {
        if (!isLoading && !isDownloading && !isGeneratingPDF) {
            onClose();
        }
    };

    const handleDownloadPDF = async () => {
        if (isDownloading || !pdfContentRef.current || isEditing) return;
        
        if (isEditing) {
            alert(t('reports.saveChangesBeforePDF') || 'Please save your changes before downloading PDF.');
            return;
        }
        
        try {
            setIsDownloading(true);
            
            // Switch to PNG logo for PDF generation
            const logoImg = pdfContentRef.current.querySelector('.mati-logo');
            const originalSrc = logoImg.src;
            logoImg.src = pdfLogoUrl;
            
            const element = pdfContentRef.current;
            const clientName = session?.client?.name || 'Client';
            const sessionDate = new Date(session?.created_at).toLocaleDateString().replace(/\//g, '-');
            const filename = `${clientName}_Report_${sessionDate}.pdf`;
            
            const opt = {
                margin: 1,
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    allowTaint: true
                },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            
            await html2pdf().set(opt).from(element).save();
            
            // Restore original logo after PDF generation
            logoImg.src = originalSrc;
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert(t('reports.pdfDownloadError') || 'Failed to download PDF. Please try again.');
            // Restore original logo on error too
            const logoImg = pdfContentRef.current?.querySelector('.mati-logo');
            if (logoImg) logoImg.src = logoDataUrl;
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('reports.exportClientReport')}</h2>
                    {!isLoading && (
                        <button className="modal-close-button" onClick={handleClose}>
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="modal-body">
                    <div className="export-description">
                        <p>{t('reports.exportDescription')}</p>
                    </div>

                    {/* Preview/Details Toggle */}
                    <div className="preview-toggle">
                        <div className="toggle-buttons">
                            <button
                                className={`toggle-btn ${previewMode === 'preview' ? 'active' : ''}`}
                                onClick={() => setPreviewMode('preview')}
                            >
                                <Eye size={16} />
                                {t('reports.preview')}
                            </button>
                            <button
                                className={`toggle-btn ${previewMode === 'details' ? 'active' : ''}`}
                                onClick={() => setPreviewMode('details')}
                            >
                                <FileText size={16} />
                                {t('reports.details')}
                            </button>
                        </div>
                        
                        {/* Edit Controls - only show in preview mode */}
                        {previewMode === 'preview' && (
                            <div className="edit-controls-header">
                                {!isEditing ? (
                                    <button
                                        className="btn btn-edit"
                                        onClick={handleEdit}
                                        disabled={!content || isLoading || isDownloading || isGeneratingPDF}
                                        title={t('reports.editReport')}
                                    >
                                        <Edit3 size={16} />
                                        {t('reports.edit')}
                                    </button>
                                ) : (
                                    <div className="edit-action-buttons">
                                        <button
                                            className="btn btn-save"
                                            onClick={handleSave}
                                            disabled={!hasUnsavedChanges || isSaving}
                                            title={t('reports.saveChanges')}
                                        >
                                            {isSaving ? (
                                                <div className="spinner-sm"></div>
                                            ) : (
                                                <Save size={16} />
                                            )}
                                            {isSaving ? t('reports.saving') : t('reports.save')}
                                        </button>
                                        <button
                                            className="btn btn-cancel"
                                            onClick={handleCancel}
                                            disabled={isSaving}
                                            title={t('reports.cancelEdit')}
                                        >
                                            <XCircle size={16} />
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Edit Mode Indicator */}
                    {isEditing && (
                        <div className="edit-indicator">
                            <Edit3 size={14} />
                            {t('reports.editModeActive')}
                            {hasUnsavedChanges && <span className="unsaved-indicator">•</span>}
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="export-content">
                        {previewMode === 'preview' ? (
                            <div className="pdf-preview">
                                <div className="preview-header">
                                    <h3>{t('reports.pdfPreview')}</h3>
                                </div>
                                <div className="preview-document">
                                    {/* PDF Preview Mockup */}
                                    <div className="document-page" ref={pdfContentRef} style={{
                                        pageBreakInside: 'auto',
                                        orphans: 3,
                                        widows: 3
                                    }}>
                                        {/* Professional Header */}
                                        <div className="document-header" style={{marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #000000'}}>
                                            <div className="header-content" style={{display: 'table', width: '100%', tableLayout: 'fixed'}}>
                                                <div className="header-left" style={{display: 'table-cell', verticalAlign: 'top', width: '70%', paddingRight: '2rem'}}>
                                                    <h1 className="report-title" style={{fontSize: '1.8rem', fontWeight: '700', color: '#000000', marginBottom: '0.5rem', lineHeight: '1.2'}}>{t('reports.clientReport')}</h1>
                                                    {session?.client?.name && (
                                                        <h2 className="client-name" style={{fontSize: '1.3rem', fontWeight: '600', color: '#000000', marginBottom: '1rem', lineHeight: '1.3'}}>{session.client.name}</h2>
                                                    )}
                                                    <div className="report-meta">
                                                        <div className="meta-item" style={{display: 'block', marginBottom: '0.4rem', lineHeight: '1.4'}}>
                                                            <span className="meta-label" style={{fontWeight: '600', color: '#000000', display: 'inline'}}>{t('reports.date')}: </span>
                                                            <span className="meta-value" style={{color: '#000000', fontWeight: '400', display: 'inline', marginLeft: '0.5rem'}}>{new Date(session?.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="meta-item" style={{display: 'block', marginBottom: '0.4rem', lineHeight: '1.4'}}>
                                                            <span className="meta-label" style={{fontWeight: '600', color: '#000000', display: 'inline'}}>{t('reports.adviser')}: </span>
                                                            <span className="meta-value" style={{color: '#000000', fontWeight: '400', display: 'inline', marginLeft: '0.5rem'}}>{session?.adviser?.name}</span>
                                                        </div>
                                                        {session?.adviser?.email && (
                                                            <div className="meta-item" style={{display: 'block', marginBottom: '0.4rem', lineHeight: '1.4'}}>
                                                                <span className="meta-label" style={{fontWeight: '600', color: '#000000', display: 'inline'}}>{t('common.email')}: </span>
                                                                <span className="meta-value" style={{color: '#000000', fontWeight: '400', display: 'inline', marginLeft: '0.5rem'}}>{session.adviser.email}</span>
                                                            </div>
                                                        )}
                                                        {session?.adviser?.phone && (
                                                            <div className="meta-item" style={{display: 'block', marginBottom: '0.4rem', lineHeight: '1.4'}}>
                                                                <span className="meta-label" style={{fontWeight: '600', color: '#000000', display: 'inline'}}>{t('common.phone')}: </span>
                                                                <span className="meta-value" style={{color: '#000000', fontWeight: '400', display: 'inline', marginLeft: '0.5rem'}}>{session.adviser.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="header-right" style={{display: 'table-cell', verticalAlign: 'top', width: '30%', textAlign: 'right'}}>
                                                    <img src={logoDataUrl} alt="MATI" className="mati-logo" style={{height: '90px', width: 'auto', maxWidth: '100%', display: 'block'}} />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="document-content">
                                            {/* NEW STRUCTURE: General Summary */}
                                            {displayContent?.general_summary && (
                                                <div className="content-section">
                                                    <h5 style={{fontSize: '1.5rem', fontWeight: '600', color: '#000000', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #000000', pageBreakAfter: 'avoid'}}>{t('reports.generalSummary')}</h5>
                                                    <div className="content-preview">
                                                        {isEditing ? (
                                                            <textarea
                                                                className="editable-content editable-text"
                                                                value={displayContent.general_summary}
                                                                onChange={(e) => handleContentChange('general_summary', e.target.value)}
                                                                style={{width: '100%', minHeight: '80px', lineHeight: '1.6', border: '2px dashed #3498db', borderRadius: '4px', padding: '8px', backgroundColor: 'rgba(52, 152, 219, 0.05)'}}
                                                            />
                                                        ) : (
                                                            <p style={{pageBreakInside: 'avoid', lineHeight: '1.6'}}>{displayContent.general_summary}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* NEW STRUCTURE: Key Insights */}
                                            {displayContent?.key_insights && Array.isArray(displayContent.key_insights) && displayContent.key_insights.length > 0 && (
                                                <div className="content-section">
                                                    <h5 style={{fontSize: '1.5rem', fontWeight: '600', color: '#000000', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #000000', pageBreakAfter: 'avoid'}}>{t('reports.keyInsights')}</h5>
                                                    <div className="content-preview">
                                                        {displayContent.key_insights.map((insight, index) => (
                                                            <div key={index} className="insight-item" style={{pageBreakInside: 'avoid', marginBottom: '1rem'}}>
                                                                <div className="insight-category" style={{marginBottom: '0.5rem'}}>
                                                                    <strong>{translateCategory(insight.category)}</strong>
                                                                </div>
                                                                <div className="insight-content" style={{marginBottom: '0.5rem'}}>
                                                                    {isEditing ? (
                                                                        <textarea
                                                                            className="editable-content editable-text"
                                                                            value={insight.content}
                                                                            onChange={(e) => handleContentChange('key_insights', e.target.value, index, 'content')}
                                                                            style={{width: '100%', minHeight: '60px', lineHeight: '1.6', border: '2px dashed #3498db', borderRadius: '4px', padding: '8px', backgroundColor: 'rgba(52, 152, 219, 0.05)'}}
                                                                        />
                                                                    ) : (
                                                                        <p style={{pageBreakInside: 'avoid', lineHeight: '1.6'}}>{insight.content}</p>
                                                                    )}
                                                                </div>
                                                                {insight.supporting_quotes && insight.supporting_quotes.filter(quote => quote && quote.trim()).length > 0 && (
                                                                    <div className="supporting-quotes" style={{pageBreakInside: 'avoid'}}>
                                                                        <strong>{t('reports.supportingQuotes')}:</strong>
                                                                        {isEditing ? (
                                                                            <div className="editable-quotes" style={{marginTop: '0.5rem'}}>
                                                                                {insight.supporting_quotes.map((quote, qIndex) => (
                                                                                    <div key={qIndex} style={{marginBottom: '0.5rem', display: 'flex', alignItems: 'center'}}>
                                                                                        <span style={{marginRight: '0.5rem'}}>"</span>
                                                                                        <input
                                                                                            type="text"
                                                                                            className="editable-content editable-quote"
                                                                                            value={quote}
                                                                                            onChange={(e) => {
                                                                                                const newQuotes = [...insight.supporting_quotes];
                                                                                                newQuotes[qIndex] = e.target.value;
                                                                                                handleContentChange('key_insights', newQuotes, index, 'supporting_quotes');
                                                                                            }}
                                                                                            style={{flex: 1, border: '1px dashed #3498db', borderRadius: '3px', padding: '4px', backgroundColor: 'rgba(52, 152, 219, 0.05)'}}
                                                                                        />
                                                                                        <span style={{marginLeft: '0.5rem'}}>"</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <ul style={{marginTop: '0.5rem'}}>
                                                                                {insight.supporting_quotes.filter(quote => quote && quote.trim()).map((quote, qIndex) => (
                                                                                    <li key={qIndex} style={{pageBreakInside: 'avoid', marginBottom: '0.25rem'}}>"{ quote}"</li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* NEW STRUCTURE: Action Items */}
                                            {displayContent?.action_items && Array.isArray(displayContent.action_items) && displayContent.action_items.length > 0 && (
                                                <div className="content-section">
                                                    <h5 style={{fontSize: '1.5rem', fontWeight: '600', color: '#000000', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #000000', pageBreakAfter: 'avoid'}}>{t('reports.actionItems')}</h5>
                                                    <div className="content-preview">
                                                        {displayContent.action_items.map((item, index) => (
                                                            <div key={index} className="action-item" style={{pageBreakInside: 'avoid', marginBottom: '1rem'}}>
                                                                <div className="action-task" style={{marginBottom: '0.5rem'}}>
                                                                    {isEditing ? (
                                                                        <textarea
                                                                            className="editable-content editable-text"
                                                                            value={item.task}
                                                                            onChange={(e) => handleContentChange('action_items', e.target.value, index, 'task')}
                                                                            style={{width: '100%', minHeight: '40px', fontWeight: '600', border: '2px dashed #3498db', borderRadius: '4px', padding: '6px', backgroundColor: 'rgba(52, 152, 219, 0.05)'}}
                                                                        />
                                                                    ) : (
                                                                        <strong>{item.task}</strong>
                                                                    )}
                                                                </div>
                                                                <div className="action-details" style={{paddingLeft: '1rem'}}>
                                                                    <div className="action-owner" style={{marginBottom: '0.25rem'}}>{t('reports.owner')}: {translateOwner(item.owner)}</div>
                                                                    {item.deadline && (
                                                                        <div className="action-deadline" style={{marginBottom: '0.25rem'}}>{t('reports.deadline')}: {item.deadline}</div>
                                                                    )}
                                                                    <div className={`action-status status-${item.status?.replace(/\s+/g, '-').toLowerCase()}`}>
                                                                        {t('reports.status')}: {translateStatus(item.status)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* NEW STRUCTURE: Target Summary */}
                                            {displayContent?.target_summary && (
                                                <div className="content-section">
                                                    <h5 style={{fontSize: '1.5rem', fontWeight: '600', color: '#000000', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #000000', pageBreakAfter: 'avoid'}}>{t('reports.targetSummary')}</h5>
                                                    <div className="content-preview">
                                                        {isEditing ? (
                                                            <textarea
                                                                className="editable-content editable-text"
                                                                value={displayContent.target_summary}
                                                                onChange={(e) => handleContentChange('target_summary', e.target.value)}
                                                                style={{width: '100%', minHeight: '80px', lineHeight: '1.6', border: '2px dashed #3498db', borderRadius: '4px', padding: '8px', backgroundColor: 'rgba(52, 152, 219, 0.05)'}}
                                                            />
                                                        ) : (
                                                            <p style={{pageBreakInside: 'avoid', lineHeight: '1.6'}}>{displayContent.target_summary}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* LEGACY STRUCTURE: Executive Summary */}
                                            {!content?.key_insights && content?.executive_summary && (
                                                <div className="content-section">
                                                    <h5 style={{fontSize: '1.5rem', fontWeight: '600', color: '#000000', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #000000'}}>{t('reports.executiveSummarySection')}</h5>
                                                    <div className="content-preview">
                                                        {content.executive_summary}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* LEGACY STRUCTURE: Entrepreneur Needs */}
                                            {!content?.key_insights && content?.entrepreneur_needs && (
                                                <div className="content-section">
                                                    <h5 style={{fontSize: '1.5rem', fontWeight: '600', color: '#000000', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #000000'}}>{t('reports.entrepreneurNeeds')}</h5>
                                                    <div className="content-preview">
                                                        {Array.isArray(content.entrepreneur_needs) ? (
                                                            content.entrepreneur_needs.map((need, index) => (
                                                                <div key={index} className="need-item">
                                                                    <strong>{need.need_conceptualization}</strong>
                                                                    <p>{need.need_explanation}</p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div>
                                                                {content.entrepreneur_needs.need_conceptualization && (
                                                                    <p><strong>{content.entrepreneur_needs.need_conceptualization}</strong></p>
                                                                )}
                                                                {content.entrepreneur_needs.need_explanation && (
                                                                    <p>{content.entrepreneur_needs.need_explanation}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* LEGACY STRUCTURE: Advisor Solutions */}
                                            {!content?.key_insights && content?.advisor_solutions && (
                                                <div className="content-section">
                                                    <h5 style={{fontSize: '1.5rem', fontWeight: '600', color: '#000000', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #000000'}}>{t('reports.advisorSolutions')}</h5>
                                                    <div className="content-preview">
                                                        {Array.isArray(content.advisor_solutions) ? (
                                                            content.advisor_solutions.map((solution, index) => (
                                                                <div key={index} className="solution-item">
                                                                    <strong>{solution.solution_conceptualization}</strong>
                                                                    <p>{solution.solution_explanation}</p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div>
                                                                {content.advisor_solutions.solution_conceptualization && (
                                                                    <p><strong>{content.advisor_solutions.solution_conceptualization}</strong></p>
                                                                )}
                                                                {content.advisor_solutions.solution_explanation && (
                                                                    <p>{content.advisor_solutions.solution_explanation}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* LEGACY STRUCTURE: Agreed Actions */}
                                            {!content?.action_items && content?.agreed_actions && (
                                                (content.agreed_actions.immediate_actions && content.agreed_actions.immediate_actions.length > 0) ||
                                                (content.agreed_actions.concrete_recommendation && typeof content.agreed_actions.concrete_recommendation === 'string' && content.agreed_actions.concrete_recommendation.trim())
                                            ) && (
                                                <div className="content-section">
                                                    <h5 style={{fontSize: '1.5rem', fontWeight: '600', color: '#000000', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #000000'}}>{t('reports.agreedActions')}</h5>
                                                    <div className="content-preview">
                                                        {content.agreed_actions.immediate_actions && content.agreed_actions.immediate_actions.length > 0 && (
                                                            <div className="actions-item">
                                                                <strong>{t('reports.immediateActions')}</strong>
                                                                <ul className="actions-list">
                                                                    {content.agreed_actions.immediate_actions.map((action, index) => (
                                                                        <li key={index}>{action}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {content.agreed_actions.concrete_recommendation && typeof content.agreed_actions.concrete_recommendation === 'string' && content.agreed_actions.concrete_recommendation.trim() && (
                                                            <div className="actions-item">
                                                                <strong>{t('reports.concreteRecommendation')}</strong>
                                                                <p>{content.agreed_actions.concrete_recommendation}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Fallback if no content */}
                                            {!content && (
                                                <div className="content-section">
                                                    <div className="content-preview">
                                                        {t('reports.contentPreview')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="export-details">
                                <div className="details-section">
                                    <h4>{t('reports.exportDetails')}</h4>
                                    <div className="detail-item">
                                        <span className="label">{t('reports.reportType')}:</span>
                                        <span className="value">{t('reports.clientReport')}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">{t('reports.client')}:</span>
                                        <span className="value">{session?.client?.name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">{t('reports.sessionDate')}:</span>
                                        <span className="value">{new Date(session?.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">{t('reports.reportVersion')}:</span>
                                        <span className="value">v{report?.version_number || 1}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">{t('reports.format')}:</span>
                                        <span className="value">PDF</span>
                                    </div>
                                </div>

                                <div className="delivery-info">
                                    <h4>{t('reports.deliveryInfo')}</h4>
                                    <p>{t('reports.deliveryDescription')}</p>
                                    <div className="client-email">
                                        <span className="label">{t('reports.clientEmail')}:</span>
                                        <span className="email">{session?.client?.email}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-actions">
                            {/* Edit Mode Actions */}
                            {isEditing ? (
                                <div className="edit-actions-bottom">
                                    <button
                                        type="button"
                                        className="btn btn-cancel"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        title={t('reports.cancelEdit')}
                                    >
                                        <XCircle size={16} />
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-save"
                                        onClick={handleSave}
                                        disabled={!hasUnsavedChanges || isSaving}
                                        title={t('reports.saveChanges')}
                                    >
                                        {isSaving ? (
                                            <div className="spinner-sm"></div>
                                        ) : (
                                            <Save size={16} />
                                        )}
                                        {isSaving ? t('reports.saving') : t('reports.saveChanges')}
                                    </button>
                                </div>
                            ) : (
                                /* Normal Mode Actions */
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleClose}
                                        disabled={isLoading || isDownloading || isGeneratingPDF}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    {previewMode === 'preview' && <button
                                        type="button"
                                        className="btn btn-outline download-btn"
                                        onClick={handleDownloadPDF}
                                        disabled={isLoading || isDownloading || isGeneratingPDF}
                                    >
                                        {isDownloading ? (
                                            <>
                                                <div className="spinner-small"></div>
                                                {t('reports.downloading')}
                                            </>
                                        ) : (
                                            <>
                                                <Download size={16} />
                                                {t('reports.downloadPDF')}
                                            </>
                                        )}
                                    </button>}
                                    {previewMode === 'preview' && <button
                                        type="submit"
                                        className="btn btn-primary export-btn"
                                        disabled={isLoading || isDownloading || isGeneratingPDF}
                                    >
                                        {isLoading || isGeneratingPDF ? (
                                            <>
                                                <div className="spinner-small"></div>
                                                {isGeneratingPDF ? 'Generating PDF...' : t('reports.exporting')}
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                {t('reports.exportAndSend')}
                                            </>
                                        )}
                                    </button>}
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
