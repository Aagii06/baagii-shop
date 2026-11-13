import { defaultLocale, translate } from "@/lib/i18n/translations";
import type { Metadata } from "next";
import { Suspense } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: translate(defaultLocale, "forgot.title") };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      {/* The form reads ?phone= via useSearchParams, which needs a boundary. */}
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
