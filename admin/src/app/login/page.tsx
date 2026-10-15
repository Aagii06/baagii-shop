import { defaultLocale, translate } from "@/lib/i18n/translations";
import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: translate(defaultLocale, "login.title") };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      {/* LoginForm reads ?next= via useSearchParams, which needs a boundary. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
