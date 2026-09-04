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
