"use client";

import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  defaultLocale,
  dictionaries,
  setCurrentLocale,
  translate,
  type Locale,
  type TranslateVars,
} from "./translations";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: TranslateVars) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "uvs_admin_locale";

// There's no language switcher in the panel yet, so it stays on the default
// (Mongolian). A locale saved under STORAGE_KEY — or `setLocale` — switches it.
export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  setCurrentLocale(locale);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved locale only exists in the browser
      if (saved && saved in dictionaries) setLocaleState(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback((key: string, vars?: TranslateVars) => translate(locale, key, vars), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <LanguageContext.Provider value={value}>
      <Fragment key={locale}>{children}</Fragment>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
