import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMNT(amount: number) {
  return `${Math.round(amount).toLocaleString("mn-MN")}₮`
}

const mnMonthNames = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
  "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар",
]

const localeTags: Record<string, string> = {
  mn: "mn-MN",
  en: "en-US",
  ru: "ru-RU",
}

// Some browsers/ICU builds lack Mongolian month data and silently fall back
// to English, so Mongolian is formatted manually instead of via Intl.
export function formatDate(dateStr: string, locale: string) {
  const date = new Date(dateStr)
  if (locale === "mn") {
    return `${date.getDate()} ${mnMonthNames[date.getMonth()]}`
  }
  return date.toLocaleDateString(localeTags[locale] ?? "en-US", {
    month: "long",
    day: "numeric",
  })
}

export function formatDateTime(dateStr: string, locale: string) {
  const date = new Date(dateStr)
  if (locale === "mn") {
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${date.getFullYear()} оны ${mnMonthNames[date.getMonth()]} ${date.getDate()}, ${hours}:${minutes}`
  }
  return date.toLocaleString(localeTags[locale] ?? "en-US")
}
