import { useTranslation } from "react-i18next";
import { Settings, Users, Database, Shield, Bell, Globe, Palette, HardDrive, Mail, Key, Save, RefreshCw } from "lucide-react";

export function AdminSettings() {
    const { t } = useTranslation();

    return (
        <section className="admin-settings">
            <div className="settings-header">
                <div className="header-content">
                    <h1>{t('common.settings')}</h1>
                </div>
            </div>
        </section>
    );
}   