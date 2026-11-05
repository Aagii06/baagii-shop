"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ErrorState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import PaymentSettingsForm from "@/components/payment/PaymentSettingsForm";
import PaymentSettingsSkeleton from "@/components/payment/PaymentSettingsSkeleton";
import { getPaymentSettings } from "@/lib/api/paymentSettings";
import { useApi } from "@/lib/useApi";

export default function PaymentSettingsPage() {
  const { t } = useLanguage();
  const { data, error, reload } = useApi(getPaymentSettings);

  if (data) return <PaymentSettingsForm settings={data} />;

  return (
    <>
      <DetailHeader backHref="/profile" title={t("pay.title")} />
      {error ? <ErrorState error={error} onRetry={reload} /> : <PaymentSettingsSkeleton />}
    </>
  );
}
