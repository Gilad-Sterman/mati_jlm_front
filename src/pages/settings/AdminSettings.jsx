import { useTranslation } from "react-i18next";
import { Settings, Users, Database, Shield, Bell, Globe, Palette, HardDrive, Mail, Key, Save, RefreshCw } from "lucide-react";

export function AdminSettings() {
    const { t } = useTranslation();

    const settingsSections = [
        {
            id: 'general',
            title: 'General',
            icon: Settings,
            active: true
        },
        {
            id: 'users',
            title: 'Users',
            icon: Users,
            active: false
        },
        {
            id: 'database',
            title: 'Database',
            icon: Database,
            active: false
        },
        {
            id: 'security',
            title: 'Security',
            icon: Shield,
            active: false
        },
        {
            id: 'notifications',
            title: 'Notifications',
            icon: Bell,
            active: false
        },
        {
            id: 'integrations',
            title: 'Integrations',
            icon: Globe,
            active: false
        }
    ];

    return (
        <section className="admin-settings">
            <div className="settings-header">
                <div className="header-content">
                    <h1>{t('common.settings')}</h1>
                </div>
            </div>

            <div className="settings-content">
                <div className="settings-sidebar">
                    <nav className="settings-nav">
                        {settingsSections.map(section => (
                            <button 
                                key={section.id} 
                                className={`nav-item ${section.active ? 'active' : ''}`}
                            >
                                <section.icon size={20} />
                                <span>{t(`settings.${section.title}`)}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="settings-main">
                    {/* General Settings */}
                    <div className="settings-section">
                        <div className="section-header">
                            <h2>{t('settings.general')}</h2>
                            <p>{t('settings.general_description')}</p>
                        </div>

                        <div className="settings-cards">
                            {/* System Information */}
                            {/* <div className="settings-card">
                                <div className="card-header">
                                    <h3>System Information</h3>
                                </div>
                                <div className="card-content">
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>System Version</label>
                                            <span>v2.1.0</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Last Updated</label>
                                            <span>Oct 15, 2024</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Environment</label>
                                            <span className="badge production">Production</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Uptime</label>
                                            <span>15 days, 4 hours</span>
                                        </div>
                                    </div>
                                </div>
                            </div> */}

                            {/* Application Settings */}
                            <div className="settings-card">
                                <div className="card-header">
                                    <h3>{t('settings.application_settings')}</h3>
                                </div>
                                <div className="card-content">
                                    <div className="form-group">
                                        <label>{t('settings.application_name')}</label>
                                        <input type="text" placeholder="Mati Session Manager" />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('settings.default_language')}</label>
                                        <select>
                                            <option>{t('settings.english')}</option>
                                            <option>{t('settings.hebrew')}</option>
                                            <option>{t('settings.arabic')}</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('settings.timezone')}</label>
                                        <select>
                                            <option>UTC+03:00 (Jerusalem)</option>
                                            <option>UTC+00:00 (GMT)</option>
                                            <option>UTC-05:00 (EST)</option>
                                        </select>
                                    </div>
                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input type="checkbox" defaultChecked />
                                            <span>Enable automatic backups</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Storage Settings */}
                            <div className="settings-card">
                                <div className="card-header">
                                    <h3>
                                        <HardDrive size={20} />
                                        Storage Settings
                                    </h3>
                                </div>
                                <div className="card-content">
                                    <div className="storage-info">
                                        <div className="storage-item">
                                            <label>Total Storage</label>
                                            <div className="storage-bar">
                                                <div className="storage-used" style={{width: '68%'}}></div>
                                            </div>
                                            <span>68% used (340GB of 500GB)</span>
                                        </div>
                                        <div className="storage-breakdown">
                                            <div className="breakdown-item">
                                                <span className="color-indicator recordings"></span>
                                                <span>Audio Recordings: 245GB</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span className="color-indicator transcripts"></span>
                                                <span>Transcripts: 45GB</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span className="color-indicator other"></span>
                                                <span>Other: 50GB</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Auto-delete recordings after</label>
                                        <select>
                                            <option>Never</option>
                                            <option>30 days</option>
                                            <option>90 days</option>
                                            <option>1 year</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Email Settings */}
                            {/* <div className="settings-card">
                                <div className="card-header">
                                    <h3>
                                        <Mail size={20} />
                                        Email Configuration
                                    </h3>
                                </div>
                                <div className="card-content">
                                    <div className="form-group">
                                        <label>SMTP Server</label>
                                        <input type="text" placeholder="smtp.gmail.com" />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Port</label>
                                            <input type="number" placeholder="587" />
                                        </div>
                                        <div className="form-group">
                                            <label>Security</label>
                                            <select>
                                                <option>TLS</option>
                                                <option>SSL</option>
                                                <option>None</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>From Email</label>
                                        <input type="email" placeholder="noreply@yourcompany.com" />
                                    </div>
                                    <button className="btn btn-secondary">Test Connection</button>
                                </div>
                            </div> */}

                            {/* API Settings */}
                            {/* <div className="settings-card">
                                <div className="card-header">
                                    <h3>
                                        <Key size={20} />
                                        API Configuration
                                    </h3>
                                </div>
                                <div className="card-content">
                                    <div className="form-group">
                                        <label>API Rate Limit</label>
                                        <select>
                                            <option>100 requests/minute</option>
                                            <option>500 requests/minute</option>
                                            <option>1000 requests/minute</option>
                                            <option>Unlimited</option>
                                        </select>
                                    </div>
                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input type="checkbox" defaultChecked />
                                            <span>Enable API logging</span>
                                        </label>
                                    </div>
                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input type="checkbox" />
                                            <span>Require API key for all endpoints</span>
                                        </label>
                                    </div>
                                    <div className="api-keys">
                                        <h4>Active API Keys</h4>
                                        <div className="api-key-item">
                                            <span>Production Key</span>
                                            <span className="key-preview">••••••••••••1234</span>
                                            <button className="btn btn-ghost btn-sm">Regenerate</button>
                                        </div>
                                        <button className="btn btn-secondary">Generate New Key</button>
                                    </div>
                                </div>
                            </div> */}

                            {/* Theme Settings */}
                            <div className="settings-card">
                                <div className="card-header">
                                    <h3>
                                        <Palette size={20} />
                                        Theme & Appearance
                                    </h3>
                                </div>
                                <div className="card-content">
                                    <div className="form-group">
                                        <label>Theme</label>
                                        <div className="theme-options">
                                            <label className="theme-option">
                                                <input type="radio" name="theme" defaultChecked />
                                                <div className="theme-preview light">
                                                    <div className="preview-header"></div>
                                                    <div className="preview-content"></div>
                                                </div>
                                                <span>Light</span>
                                            </label>
                                            <label className="theme-option">
                                                <input type="radio" name="theme" />
                                                <div className="theme-preview dark">
                                                    <div className="preview-header"></div>
                                                    <div className="preview-content"></div>
                                                </div>
                                                <span>Dark</span>
                                            </label>
                                            <label className="theme-option">
                                                <input type="radio" name="theme" />
                                                <div className="theme-preview auto">
                                                    <div className="preview-header"></div>
                                                    <div className="preview-content"></div>
                                                </div>
                                                <span>Auto</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}   