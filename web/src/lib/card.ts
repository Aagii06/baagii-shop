// Lightweight card-input masking and format validation for the demo
// checkout. No PAN ever leaves the browser, so these are UX helpers only.

/** Groups digits in fours: "4111111111111111" -> "4111 1111 1111 1111". */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/** Masks to "MM / YY", auto-inserting the separator after the month. */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

/** Digits only, 3-4 long. */
export function formatCvv(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function isValidCardNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 13 && digits.length <= 19 && luhnValid(digits);
}

/** Valid month (01-12) and not already past. */
export function isValidExpiry(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 4) return false;
  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2));
  if (month < 1 || month > 12) return false;
  // First day of the month *after* the card expires — valid through then.
  const expiresAfter = new Date(year, month, 1);
  return expiresAfter > new Date();
}

export function isValidCvv(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 3 && digits.length <= 4;
}
