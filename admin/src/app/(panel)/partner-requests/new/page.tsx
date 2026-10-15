"use client";

import Field from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPartnerRequest } from "@/lib/api/partnerRequests";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

export default function NewPartnerPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { run } = useToast();
  const errorId = useId();
  const phoneRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);

  const error = touched && phone.length < 8 ? t("checkout.phoneInvalid") : undefined;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (phone.length < 8) {
      phoneRef.current?.focus();
      return;
    }
    if (await run(() => createPartnerRequest(phone), t("pr.added"))) router.replace("/partner-requests");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DetailHeader
        backHref="/partner-requests"
        title={t("pr.add")}
        aside={
          <Button type="submit" className="h-10 px-5">
            {t("common.save")}
          </Button>
        }
      />
      <div className="space-y-4">
        <Field label={t("pr.phone")} hint={t("pr.phoneHint")} error={error} errorId={errorId}>
          <Input
            ref={phoneRef}
            type="tel"
            inputMode="numeric"
            autoFocus
            maxLength={8}
            className="font-mono"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            onBlur={() => setTouched(true)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            required
          />
        </Field>
      </div>
    </form>
  );
}
