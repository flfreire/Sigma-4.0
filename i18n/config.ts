import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧' },
  pt: { name: 'Português', flag: '🇧🇷' },
  es: { name: 'Español', flag: '🇪🇸' },
};

export type Language = keyof typeof LANGUAGES;

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Helper function to get nested keys from a JSON object
const getNestedTranslation = (obj: any, key: string): string | undefined => {
    if (!obj) return undefined;
    return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
};

// Cache translations to avoid re-fetching
const translationsCache = new Map<Language, any>();

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');
  const [currentTranslations, setCurrentTranslations] = useState<any>(null);

  useEffect(() => {
    const fetchTranslations = async (lang: Language) => {
        // First, ensure English translations are loaded and cached for fallbacks.
        if (!translationsCache.has('en')) {
            try {
                const response = await fetch('./i18n/translations/en.json');
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                translationsCache.set('en', data);
            } catch (error) {
                console.error("Fatal: Could not load fallback English translations.", error);
                // Can't proceed without fallback translations
                return;
            }
        }

        // If the requested language is already cached, use it.
        if (translationsCache.has(lang)) {
            setCurrentTranslations(translationsCache.get(lang));
            return;
        }

        // Otherwise, fetch the new language.
        try {
            const response = await fetch(`./i18n/translations/${lang}.json`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            translationsCache.set(lang, data);
            setCurrentTranslations(data);
        } catch (error) {
            console.error(`Failed to load translations for ${lang}. Falling back to English.`, error);
            setCurrentTranslations(translationsCache.get('en'));
        }
    };

    fetchTranslations(language);
  }, [language]);

  const t = useCallback((key: string, replacements?: Record<string, string>): string => {
    let translation = getNestedTranslation(currentTranslations, key);
    
    // Fallback to English if the translation is missing in the current language
    if (translation === undefined) {
        const englishTranslations = translationsCache.get('en');
        if (englishTranslations) {
            translation = getNestedTranslation(englishTranslations, key);
        }
    }
    
    if (translation === undefined) {
      // Return the key if it's still not found, to help with debugging.
      console.warn(`Translation key "${key}" not found in any language.`);
      return key;
    }

    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation!.replace(`{${placeholder}}`, replacements[placeholder]);
        });
    }

    return translation!;
  }, [currentTranslations]);

  const value = {
    language,
    setLanguage,
    t
  };

  // Don't render children until the initial translations are loaded to prevent flicker.
  if (!currentTranslations) {
      return null;
  }

  return React.createElement(I18nContext.Provider, { value: value }, children);
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
