import { useTranslation } from "react-i18next";

export function AdminSettings() {
    const { t } = useTranslation();
    return (
        <section className="admin-settings" >
            <h1>{t('common.settings')}</h1>
            <div className="admin-content">
                <div className="admin-header">
                    <h2>{t('settings.header')}</h2>
                </div>
                <div className="admin-body">
                    <h2>{t('settings.body')}</h2>
                </div>
            </div>
        </section>
    )
}   