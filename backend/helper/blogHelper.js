const { blogs, op } = require("../models");
const { toIso } = require("./helper");

// Монгол кирилл → латин (вэбийн холбоос /blog/{slug})
const LATIN = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l",
  м: "m", н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

const slugify = (title) =>
  Array.from(String(title).toLowerCase())
    .map((ch) => LATIN[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";

// Дэлгүүр дотроо давхцахгүй slug
module.exports.uniqueSlug = async (shopId, title, t) => {
  const base = slugify(title);
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    if (!(await blogs.count({ where: { shop_id: shopId, slug, status: { [op.ne]: "deleted" } }, transaction: t }))) return slug;
  }
};

// admin/src/lib/api/blog.ts-ийн BlogPost (вэб ч үүнийг уншина)
module.exports.toBlogPost = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  tag: row.tag,
  author: row.author,
  date: row.date,
  readMinutes: row.read_minutes,
  image: row.image,
  body: row.body ?? "",
  isActive: !!row.is_active,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at ?? row.created_at),
});
