import { en } from "./locales/en";
import { mn } from "./locales/mn";
import { ru } from "./locales/ru";

export type Locale = "mn" | "en" | "ru";

export type Dict = Record<string, string>;

export const locales: { code: Locale; label: string; short: string }[] = [
  { code: "mn", label: "Монгол", short: "MN" },
  { code: "en", label: "English", short: "EN" },
  { code: "ru", label: "Русский", short: "RU" },
];

export const defaultLocale: Locale = "mn";

export const dictionaries: Record<Locale, Dict> = { mn, en, ru };

export type TranslateVars = Record<string, string | number>;

// The locale the provider last rendered with, so code outside React (API
// errors, status labels) can translate too. The provider remounts its
// children when the locale changes, so readers never go stale.
let currentLocale: Locale = defaultLocale;

export function setCurrentLocale(locale: Locale) {
  currentLocale = locale;
}

export function translate(locale: Locale, key: string, vars?: TranslateVars) {
  let str = dictionaries[locale][key] ?? dictionaries[defaultLocale][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}

/** `t` for non-component code — follows the language the UI is showing. */
export function tr(key: string, vars?: TranslateVars) {
  return translate(currentLocale, key, vars);
}
