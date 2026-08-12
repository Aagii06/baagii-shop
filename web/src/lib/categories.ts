export interface Category {
  slug: string;
  name: string;
  letter: string;
  color: string;
}

export const categories: Category[] = [
  { slug: "huns", name: "Хүнс", letter: "Х", color: "bg-emerald-100 text-emerald-700" },
  { slug: "huvtsas", name: "Хувцас", letter: "Х", color: "bg-violet-100 text-violet-700" },
  { slug: "goo-saihan", name: "Гоо сайхан", letter: "Г", color: "bg-orange-100 text-orange-700" },
  { slug: "tsahilgaan-baraa", name: "Цахилгаан бараа", letter: "Ц", color: "bg-blue-100 text-blue-700" },
  { slug: "ger-akhui", name: "Гэр ахуй", letter: "Г", color: "bg-amber-100 text-amber-700" },
  { slug: "huuhdiin-baraa", name: "Хүүхдийн бараа", letter: "Х", color: "bg-pink-100 text-pink-700" },
  { slug: "sport-ayalal", name: "Спорт, аялал", letter: "С", color: "bg-cyan-100 text-cyan-700" },
  { slug: "bichig-hereg", name: "Бичиг хэрэг", letter: "Б", color: "bg-lime-100 text-lime-700" },
];

export const brands = ["Гоби", "Эрдэнэт", "Буян", "Бусад"] as const;

export function getCategory(slug?: string) {
  return categories.find((c) => c.slug === slug);
}
