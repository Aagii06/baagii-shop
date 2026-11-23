const { toIso } = require("./helper");

// admin/src/lib/api/testimonials.ts-ийн Testimonial (вэб, апп ч үүнийг уншина)
module.exports.toTestimonial = (row) => ({
  id: row.id,
  quote: row.quote ?? "",
  name: row.name ?? "",
  role: row.role ?? "",
  rating: row.rating ?? 5,
  sortOrder: row.sort_order ?? 0,
  isActive: !!row.is_active,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at ?? row.created_at),
});

module.exports.ORDER = [["sort_order", "asc"], ["id", "desc"]];
