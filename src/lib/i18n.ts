import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import authEn from '@/locales/en/auth.json'
import commonEn from '@/locales/en/common.json'
import errorsEn from '@/locales/en/errors.json'
import authVi from '@/locales/vi/auth.json'
import commonVi from '@/locales/vi/common.json'
import errorsVi from '@/locales/vi/errors.json'

export const LANGUAGES = ['vi', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

const STORAGE_KEY = 'language'

export const resources = {
  vi: { common: commonVi, auth: authVi, errors: errorsVi },
  en: { common: commonEn, auth: authEn, errors: errorsEn },
} as const

function readStoredLanguage(): Language {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'vi' || value === 'en') return value
  } catch {
    // localStorage bị chặn: dùng mặc định
  }
  return 'vi'
}

void i18n.use(initReactI18next).init({
  resources,
  lng: readStoredLanguage(),
  fallbackLng: 'vi',
  defaultNS: 'common',
  ns: ['common', 'auth', 'errors'],
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // bỏ qua
  }
})

export default i18n
