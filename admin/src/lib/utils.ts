import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The API sends DECIMAL(18,6) columns as strings ("4500000.000000"). */
export function toNumber(value: string | number | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** "₮68,000" */
export function formatMNT(amount: number) {
  return `₮${Math.round(amount).toLocaleString("en-US")}`;
}

/** Short money for stat tiles: "₮2.5сая", "₮178мянга". Rounds down so a tile never overstates. */
export function formatMNTCompact(amount: number) {
  if (amount >= 1_000_000) return `₮${Math.floor(amount / 100_000) / 10}сая`;
  if (amount >= 1_000) return `₮${Math.floor(amount / 1_000)}мянга`;
  return formatMNT(amount);
}

export function formatQty(amount: number) {
  return amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-09-14" */
export function formatDate(value: Date | string | null | undefined) {
  const date = toDate(value);
  if (!date) return "—";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "14:20" */
export function formatTime(value: Date | string | null | undefined) {
  const date = toDate(value);
  return date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : "—";
}

/** "14:20" for today, "09-13 16:30" for earlier days. */
export function formatWhen(value: Date | string | null | undefined) {
  const date = toDate(value);
  if (!date) return "—";
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  return sameDay
    ? formatTime(date)
    : `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${formatTime(date)}`;
}

/** Mongolian numbers are 8 digits, read as two groups: "99112233" → "9911 2233". */
export function formatPhone(digits: string) {
  return digits.length > 4 ? `${digits.slice(0, 4)} ${digits.slice(4)}` : digits;
}
