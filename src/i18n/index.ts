import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhTranslations from '../locales/zh';
import enTranslations from '../locales/en';

const resources = {
  zh: {
    translation: zhTranslations
  },
  en: {
    translation: enTranslations
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh', // 默认语言
    fallbackLng: 'zh', // 备用语言
    interpolation: {
      escapeValue: false
    },
    detection: {
      // 从localStorage中读取语言设置
      lookupLocalStorage: 'i18nextLng',
      // 缓存语言设置到localStorage
      caches: ['localStorage']
    }
  });

export default i18n;