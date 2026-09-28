import { SupportedLanguage } from '../types/shg';
import { translations, TranslationDictionary } from './translations';

export function getTranslations(lang: SupportedLanguage): TranslationDictionary {
  return translations[lang] || translations.en;
}

export function t(lang: SupportedLanguage, path: string): string {
  const dict = getTranslations(lang);
  const parts = path.split('.');
  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}
