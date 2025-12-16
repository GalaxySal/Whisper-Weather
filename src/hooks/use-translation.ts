import { useLanguage } from './use-language'
import { en } from '../locales/en'
import { tr } from '../locales/tr'

type TranslationKey = keyof typeof en

export function useTranslation() {
  const { language } = useLanguage()
  
  const t = (key: TranslationKey): string => {
    const translations = language === 'tr' ? tr : en
    
    if (key in translations) {
      const value = translations[key]
      return typeof value === 'string' ? value : JSON.stringify(value)
    }
    
    // Fallback to English if key not found in current language
    if (key in en) {
      const value = en[key]
      return typeof value === 'string' ? value : JSON.stringify(value)
    }
    
    // Return key as fallback
    return key
  }
  
  return { t, language }
}
