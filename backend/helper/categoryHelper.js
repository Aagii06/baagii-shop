const { categories, categoryAttrs, attrs } = require("../models");

// Категорийн мод (admin: /api/category/tree, вэб: /web/category/getCategoryTree).
// withAttrs - навч категорийн сонголтуудыг `attrs: [{ id, name }]`-аар нэмнэ (admin)
module.exports.buildTree = async ({ withAttrs = false } = {}) => {
  const rows = await categories.findAll({
    where: { status: "active" },
    order: [["order_number", "asc"], ["id", "asc"]],
    raw: true,
  });
  const links = withAttrs
    ? await categoryAttrs.findAll({
        include: [{ model: attrs, as: "attr", attributes: ["id", "name"], where: { status: "active" } }],
        order: [["order_number", "asc"]],
      })
    : [];

  const nodes = new Map(
    rows.map((r) => [
      r.id,
      {
        id: r.id,
        parentId: r.parent_id,
        code: r.code,
        name: r.name,
        image: r.image,
        style: r.style ?? null,
        childs: r.childs ?? null,
        ...(withAttrs && {
          attrs: links.filter((l) => l.category_id === r.id).map((l) => ({ id: l.attr.id, name: l.attr.name })),
        }),
        children: [],
      },
    ]),
  );
  const roots = [];
  for (const node of nodes.values()) {
    const parent = node.parentId != null ? nodes.get(node.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
};
