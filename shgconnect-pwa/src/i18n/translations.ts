import { SupportedLanguage } from '../types/shg';
import { TranslationDictionary } from './types';
import { mr } from './mr';
import { hi } from './hi';
import { en } from './en';

export type { TranslationDictionary };

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  mr,
  hi,
  en
};
