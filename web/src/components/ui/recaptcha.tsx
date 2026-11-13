"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

// Google reCAPTCHA v2 — the "I'm not a robot" checkbox. Off (renders nothing)
// while NEXT_PUBLIC_RECAPTCHA_SITE_KEY is empty; the backend then skips the
// check too as long as its RECAPTCHA_SECRET_KEY is empty.
const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
export const recaptchaEnabled = SITE_KEY !== "";

interface Grecaptcha {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => number;
  reset: (id?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
    __recaptchaOnLoad?: () => void;
  }
}

let loader: Promise<Grecaptcha> | null = null;

function loadRecaptcha(lang: string): Promise<Grecaptcha> {
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      window.__recaptchaOnLoad = () => resolve(window.grecaptcha!);
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?onload=__recaptchaOnLoad&render=explicit&hl=${lang}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        loader = null;
        script.remove();
        reject(new Error("reCAPTCHA failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return loader;
}

export interface RecaptchaHandle {
  reset: () => void;
}

export default function Recaptcha({
  onChange,
  lang = "mn",
  ref,
}: {
  /** The token once ticked, null when it expires or is reset. */
  onChange: (token: string | null) => void;
  lang?: string;
  ref?: Ref<RecaptchaHandle>;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetId.current !== null) window.grecaptcha?.reset(widgetId.current);
      onChangeRef.current(null);
    },
  }));

  useEffect(() => {
    if (!recaptchaEnabled) return;
    let cancelled = false;
    loadRecaptcha(lang)
      .then((grecaptcha) => {
        if (cancelled || !boxRef.current || widgetId.current !== null) return;
        widgetId.current = grecaptcha.render(boxRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => onChangeRef.current(token),
          "expired-callback": () => onChangeRef.current(null),
          "error-callback": () => onChangeRef.current(null),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // The widget's language is fixed once the script has loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!recaptchaEnabled) return null;
  // The widget is a fixed 304px wide; scale it down on very narrow phones.
  return (
    <div className="min-h-[78px] max-[360px]:origin-left max-[360px]:scale-[0.9]">
      <div ref={boxRef} />
    </div>
  );
}
