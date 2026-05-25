import { useLanguageStore } from '@/store/language.store';
import translations, { type TranslationKey } from '@/lib/translations';

export function useTranslation() {
  const { language, setLanguage } = useLanguageStore();

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.es[key] || key;
  };

  return { t, language, setLanguage };
}
