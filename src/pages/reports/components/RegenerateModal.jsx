import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, RefreshCw } from 'lucide-react';

export function RegenerateModal({ isOpen, onClose, onRegenerate, isLoading = false }) {
    const { t } = useTranslation();
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (notes.trim() && !isLoading) {
            onRegenerate(notes.trim());
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setNotes('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content regenerate-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('reports.regenerateClientReport')}</h2>
                    {!isLoading && (
                        <button className="modal-close-button" onClick={handleClose}>
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="modal-body">
                    <p className="modal-description">
                        {t('reports.regenerateDescription')}
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="regenerate-notes">
                                {t('reports.regenerateNotes')} <span className="required">*</span>
                            </label>
                            <textarea
                                id="regenerate-notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t('reports.regenerateNotesPlaceholder')}
                                rows={4}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary regenerate-btn"
                                disabled={!notes.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw size={16} className="spinning" />
                                        {t('reports.regenerating')}
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={16} />
                                        {t('reports.regenerate')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
