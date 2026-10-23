import * as React from "react"

import { Input } from "@/components/ui/input"

const PHONE_DIGITS = 8

/** Keeps the 8-digit local number, dropping a leading +976 country code. */
export function phoneDigits(value: string) {
  let digits = value.replace(/\D/g, "")
  if (digits.length > PHONE_DIGITS && digits.startsWith("976")) {
    digits = digits.slice(3)
  }
  return digits.slice(0, PHONE_DIGITS)
}

/** "99112345" → "9911 2345" */
export function formatPhone(value: string) {
  const digits = phoneDigits(value)
  return digits.length > 4 ? `${digits.slice(0, 4)} ${digits.slice(4)}` : digits
}

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "type"
> & {
  /** Digits only; formatting is applied for display. */
  value: string
  onChange: (digits: string) => void
}

// Masked "XXXX XXXX" input for Mongolian mobile numbers. `pattern` makes a
// partly-typed number fail validation, so `required` + :invalid styling work
// the same as on a plain input.
const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, placeholder = "9911 2345", ...props }, ref) => (
    <Input
      ref={ref}
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      pattern="\d{4} \d{4}"
      maxLength={PHONE_DIGITS + 1}
      placeholder={placeholder}
      value={formatPhone(value)}
      onChange={(e) => onChange(phoneDigits(e.target.value))}
      {...props}
    />
  )
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
