import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zhTranslations from '../locales/zh';
import enTranslations from '../locales/en';

const resources = {
    zh: zhTranslations,
    en: enTranslations
};

// 初始化 i18n
i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
        resources,
        fallbackLng: 'zh',
        lng: localStorage.getItem('i18nextLng') || 'zh', // 优先 localStorage
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage']
        },
        react: {
            useSuspense: false // 防止闪烁或未渲染
        }
    });

export default i18n;
