import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en.json';
import heTranslation from './locales/he.json';

// Get language from localStorage or use browser detection
const savedLanguage = localStorage.getItem('language');

i18n
//   .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      he: {
        translation: heTranslation
      }
    },
    lng: savedLanguage || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Set document direction based on language
const setDocumentDirection = (language) => {
  document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
};

// Set initial direction
setDocumentDirection(i18n.language);

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  setDocumentDirection(lng);
  localStorage.setItem('language', lng);
});

export default i18n;