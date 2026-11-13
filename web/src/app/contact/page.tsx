"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Recaptcha, { recaptchaEnabled, type RecaptchaHandle } from "@/components/ui/recaptcha";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { sendFeedback } from "@/lib/api/feedback";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  CheckCircle,
  // Clock, // "Ажиллах цаг"-ийг буцааж нээхэд
  Headset,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Shield,
} from "lucide-react";
import { useRef, useState } from "react";

export default function Contact() {
  const { t, locale } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<RecaptchaHandle>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recaptchaEnabled && !captchaToken) {
      setSubmitError(t("contact.form.captchaRequired"));
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");

    try {
      await sendFeedback({ ...formData, recaptchaToken: captchaToken ?? undefined });
    } catch (error) {
      // A token works only once, so a fresh tick is needed to retry.
      captchaRef.current?.reset();
      setSubmitError(
        error instanceof ApiError && error.message ? error.message : t("contact.form.error")
      );
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    captchaRef.current?.reset();

    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: "", email: "", phone: "", message: "" });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: t("contact.info.email.title"),
      details: ["mandal.battogtokh@gmail.com"], // TODO: түр — hello@uvs.mn, support@uvs.mn-г буцааж тавих
      description: t("contact.info.email.desc"),
    },
    {
      icon: Phone,
      title: t("contact.info.phone.title"),
      details: ["9110-1256"],
      description: t("contact.info.phone.desc"),
    },
    {
      icon: MapPin,
      title: t("contact.info.address.title"),
      details: [t("contact.info.address.line1"), t("contact.info.address.line2")],
      description: t("contact.info.address.desc"),
    },
    // TODO: түр нуусан — "Ажиллах цаг"
    // {
    //   icon: Clock,
    //   title: t("contact.info.hours.title"),
    //   details: [t("contact.info.hours.line1"), t("contact.info.hours.line2")],
    //   description: t("contact.info.hours.desc"),
    // },
  ];

  const features = [
    {
      icon: Headset,
      title: t("contact.why.support247.title"),
      description: t("contact.why.support247.desc"),
    },
    {
      icon: MessageSquare,
      title: t("contact.why.quickReply.title"),
      description: t("contact.why.quickReply.desc"),
    },
    {
      icon: Shield,
      title: t("contact.why.secure.title"),
      description: t("contact.why.secure.desc"),
    },
  ];

  const faqs = [
    { question: t("contact.faq.q1"), answer: t("contact.faq.a1") },
    { question: t("contact.faq.q2"), answer: t("contact.faq.a2") },
    { question: t("contact.faq.q3"), answer: t("contact.faq.a3") },
    { question: t("contact.faq.q4"), answer: t("contact.faq.a4") },
  ];

  return (
    <div className="bg-background">
      <section className="py-14 lg:py-20 brand-gradient text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <Badge className="mb-5 bg-white/15 text-white border-transparent hover:bg-white/15">
              {t("contact.badge")}
            </Badge>
            <h1 className="text-3xl lg:text-5xl font-bold mb-5 text-balance">
              {t("contact.heroTitle")}
            </h1>
            <p className="text-white/85 max-w-xl mx-auto">
              {t("contact.heroDesc")}
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h2 className="text-xl font-bold text-foreground mb-1">
                  {t("contact.formTitle")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t("contact.formDesc")}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        {t("contact.form.name")}
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder={t("contact.form.namePlaceholder")}
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        {t("contact.form.email")}
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={t("contact.form.emailPlaceholder")}
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      {t("contact.form.phone")}
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder={t("contact.form.phone")}
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      {t("contact.form.message")}
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder={t("contact.form.messagePlaceholder")}
                      rows={3}
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      className="resize-none"
                    />
                  </div>

                  <Recaptcha
                    ref={captchaRef}
                    lang={locale}
                    onChange={(token) => {
                      setCaptchaToken(token);
                      if (token) setSubmitError("");
                    }}
                  />

                  {submitError && (
                    <p role="alert" className="text-sm font-medium text-destructive">
                      {submitError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || isSubmitted}
                    className="w-full sm:w-auto brand-gradient text-white"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {t("contact.form.sending")}
                      </span>
                    ) : isSubmitted ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {t("contact.form.sent")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        {t("contact.form.send")}
                      </span>
                    )}
                  </Button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-5">
                  {t("contact.info.title")}
                </h3>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="p-2.5 bg-accent rounded-xl shrink-0">
                        <info.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-foreground text-sm mb-1">
                          {info.title}
                        </h4>
                        {info.details.map((detail, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground">
                            {detail}
                          </p>
                        ))}
                        <p className="text-xs text-muted-foreground mt-1">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {t("contact.why.title")}
                </h3>
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index}>
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-accent rounded-lg">
                          <feature.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground text-sm">
                            {feature.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      {index < features.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20 bg-muted/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-5">
              {t("contact.faq.badge")}
            </Badge>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("contact.faq.title")}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl brand-gradient text-white p-10 sm:p-14 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold mb-3">
              {t("contact.cta.title")}
            </h2>
            <p className="text-white/85 mb-8 max-w-xl mx-auto">
              {t("contact.cta.desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <a href="tel:91101256">
                  <Phone className="h-4 w-4 mr-2" />
                  {t("contact.cta.call")}
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/70 bg-transparent text-white shadow-none hover:bg-white/15 hover:text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                {t("contact.cta.chat")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
