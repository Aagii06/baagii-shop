"use client";

import PhoneAuthGate from "@/components/checkout/PhoneAuthGate";
import { useAuthStore } from "@/store/authStore";
import PageLoader from "@/components/ui/page-loader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const router = useRouter();
  const authLoading = useAuthStore((s) => s.loading);
  const isAuthed = useAuthStore((s) => s.user != null || s.phone != null);

  // Already signed in (or just verified the phone) — nothing to do here.
  useEffect(() => {
    if (!authLoading && isAuthed) router.replace("/profile");
  }, [authLoading, isAuthed, router]);

  if (authLoading || isAuthed) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <PhoneAuthGate />
    </div>
  );
}
