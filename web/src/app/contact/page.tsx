"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Clock,
  Headset,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Shield,
} from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "И-мэйл",
      details: ["hello@uvs.mn", "support@uvs.mn"],
      description: "Бид танд хамгийн богино хугацаанд хариу өгнө",
    },
    {
      icon: Phone,
      title: "Утас",
      details: ["7045-1234", "+976 8811 2345"],
      description: "Даваа-Баасан 09:00 - 18:00",
    },
    {
      icon: MapPin,
      title: "Хаяг",
      details: ["Улаанбаатар хот", "Сүхбаатар дүүрэг"],
      description: "Бидэнтэй уулзаарай",
    },
    {
      icon: Clock,
      title: "Ажиллах цаг",
      details: ["Даваа - Баасан: 09:00 - 18:00", "Бямба: 10:00 - 16:00"],
      description: "Ням гараг амарна",
    },
  ];

  const features = [
    {
      icon: Headset,
      title: "24/7 тусламж",
      description: "Хүссэн үедээ тусламж авах боломжтой",
    },
    {
      icon: MessageSquare,
      title: "Түргэн хариу",
      description: "2 цагийн дотор хариу өгнө",
    },
    {
      icon: Shield,
      title: "Аюулгүй, нууцлалтай",
      description: "Таны мэдээлэл хамгаалагдсан",
    },
  ];

  const faqs = [
    {
      question: "Хүргэлтийн нөхцөл ямар вэ?",
      answer:
        "50,000₮-с дээш захиалгад Улаанбаатар хотод хүргэлт үнэгүй. Стандарт хүргэлт 1-2 хоногт хийгдэнэ.",
    },
    {
      question: "Захиалгаа хэрхэн хянах вэ?",
      answer:
        "Захиалга баталгаажсаны дараа 'Миний захиалга' хэсгээс явцыг бодит цагт хянах боломжтой.",
    },
    {
      question: "Буцаалт, солилтын нөхцөл?",
      answer:
        "Бүтээгдэхүүнийг 14 хоногийн дотор, анхны байдлаар нь буцаах боломжтой.",
    },
    {
      question: "Орон нутагт хүргэлт хийдэг үү?",
      answer: "Тийм ээ, Монгол даяар 21 аймаг, 330 сум руу хүргэлт хийдэг.",
    },
  ];

  return (
    <div className="bg-background">
      <section className="py-14 lg:py-20 brand-gradient text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <Badge className="mb-5 bg-white/15 text-white border-transparent hover:bg-white/15">
              Холбоо барих
            </Badge>
            <h1 className="text-3xl lg:text-5xl font-bold mb-5 text-balance">
              Танд туслахад бид үргэлж бэлэн
            </h1>
            <p className="text-white/85 max-w-xl mx-auto">
              Асуулт, санал хүсэлт байвал бидэнтэй чөлөөтэй холбогдоорой.
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
                  Бидэнд бичнэ үү
                </h2>
                <p className="text-muted-foreground mb-6">
                  Доорх маягтыг бөглөнө үү, бид тун удахгүй хариу өгөх болно.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Таны нэр
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Бат-Эрдэнэ"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        И-мэйл
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="tanii@email.mn"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">
                      Гарчиг
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Танд юугаар туслах вэ?"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Мессеж
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Асуулт, санал хүсэлтээ энд бичнэ үү..."
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || isSubmitted}
                    className="w-full sm:w-auto brand-gradient text-white"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Илгээж байна...
                      </span>
                    ) : isSubmitted ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Илгээгдлээ!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Илгээх
                      </span>
                    )}
                  </Button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-5">
                  Холбоо барих мэдээлэл
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
                  Яагаад бидэнтэй холбогдох вэ?
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
              Түгээмэл асуулт
            </Badge>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
              Танд туслах хариултууд
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
              Өөр асуулт байна уу?
            </h2>
            <p className="text-white/85 mb-8 max-w-xl mx-auto">
              Манай үйлчилгээний баг танд туслахад бэлэн байна.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                <Phone className="h-4 w-4 mr-2" />
                Одоо залгах
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Чатаар холбогдох
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
