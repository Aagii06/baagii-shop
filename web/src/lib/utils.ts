import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMNT(amount: number) {
  return `${Math.round(amount).toLocaleString("mn-MN")}₮`
}
