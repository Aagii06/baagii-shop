import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const TruckIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    {...props}
  >
    <path d="M3 7h11v10H3z" strokeLinejoin="round" />
    <path d="M14 10h4l3 3v4h-7v-7Z" strokeLinejoin="round" />
    <circle cx="7" cy="18.5" r="1.5" />
    <circle cx="17.5" cy="18.5" r="1.5" />
  </svg>
);

export const RadioOnIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="5" fill="currentColor" />
  </svg>
);

export const RadioOffIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

export const CheckOnIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect
      x="3.5"
      y="3.5"
      width="17"
      height="17"
      rx="4"
      fill="currentColor"
    />
    <path
      d="m8 12 3 3 5-6"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CheckOffIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect
      x="3.5"
      y="3.5"
      width="17"
      height="17"
      rx="4"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);
