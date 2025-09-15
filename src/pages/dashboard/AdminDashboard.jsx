import { useTranslation } from "react-i18next";

export function AdminDashboard () {
    const { t } = useTranslation();
return (
<section className="admin-dashboard" >
    <h1>{t('common.dashboard')}</h1>
    <div className="admin-content">
        <div className="admin-header">
            <h2>{t('dashboard.header')}</h2>
        </div>
        <div className="admin-body">
            <h2>{t('dashboard.body')}</h2>
        </div>
    </div>
</section>
)
}