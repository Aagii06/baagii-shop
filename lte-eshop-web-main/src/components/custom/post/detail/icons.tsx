import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const ChevronLeftIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    {...props}
  >
    <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    {...props}
  >
    <path d="m5 12 5 5 9-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MoneyIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    {...props}
  >
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01M18 12h.01" strokeLinecap="round" />
  </svg>
);

export const BoxIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    {...props}
  >
    <path
      d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7Z"
      strokeLinejoin="round"
    />
    <path d="M12 12v8M3 8.5l9 4.5 9-4.5" strokeLinejoin="round" />
  </svg>
);

export const MinusIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    {...props}
  >
    <path d="M6 12h12" strokeLinecap="round" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    {...props}
  >
    <path d="M12 6v12M6 12h12" strokeLinecap="round" />
  </svg>
);
