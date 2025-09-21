import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LangSelect() {
    const { t, i18n } = useTranslation();
  
    const toggleLanguage = (lang) => {
      i18n.changeLanguage(lang);
    };
    return (
        <section className="lang-select">
            <Globe />
            <button className={i18n.language === 'en' ? 'active' : ''} onClick={() => toggleLanguage('en')}>English</button>
            <button className={i18n.language === 'he' ? 'active' : ''} onClick={() => toggleLanguage('he')}>עברית</button>
        </section>
    )
}