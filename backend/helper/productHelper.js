const { products, productVariants, categories, attrs: attrRows, attrValues, sequelize, op } = require("../models");
const { defaultBranch } = require("../config/constants");
const { toIso, toNumber, now, today } = require("./helper");
const { saveLog } = require("../utils/logHelper");

// Бараа (products) + хувилбар (productVariants, өнгө/хэмжээний хослол бүр нэг мөр).
// Admin нь `variants[].attr`, вэб нь eshop-ийн `postProducts` / `postAttrs` хэлбэрийг
// уншдаг тул нэг өгөгдлөөс хоёуланг нь энд угсарна.

const activeVariants = { model: productVariants, as: "variants", required: false, where: { status: "active" } };
module.exports.productInclude = [
  activeVariants,
  { model: categories, as: "category", attributes: ["id", "name", "image"] },
];
module.exports.variantOrder = [[{ model: productVariants, as: "variants" }, "order_number", "asc"]];

const money = (value) => toNumber(value).toFixed(2);

// Хувилбарыг таних түлхүүр: сонголтын утгууд (attrId:value), сонголтгүй бол нэр
const signature = (attr, name) =>
  attr?.length ? attr.map((a) => `${a.attrId}:${String(a.value).trim().toUpperCase()}`).sort().join("|") : `name:${name}`;

/**
 * Барааны сонголтууд, утга бүрийн зурагтай нь. Хадгалсан `attrs` байхгүй
 * (хуучин) бол хувилбаруудын `attr`-аас угсарна.
 * [{ attrId, attrName, viewType, orderNumber, values: [{ attrValueId, value, color, image, images, orderNumber }] }]
 */
const productAttrs = (product) => {
  if (Array.isArray(product.attrs) && product.attrs.length > 0) return product.attrs;
  const attrs = new Map();
  for (const variant of product.variants ?? []) {
    for (const a of variant.attr ?? []) {
      if (!a.value) continue;
      if (!attrs.has(a.attrId))
        attrs.set(a.attrId, { attrId: a.attrId, attrName: a.attrName ?? "", viewType: "text", orderNumber: attrs.size, values: [] });
      const attr = attrs.get(a.attrId);
      if (attr.values.some((v) => v.value === a.value)) continue;
      if (a.color || a.image) attr.viewType = "image";
      attr.values.push({ attrValueId: null, value: a.value, color: a.color ?? null, image: a.image ?? null, images: [], orderNumber: attr.values.length });
    }
  }
  return [...attrs.values()];
};

const remainOf = (product) => {
  const variants = product.variants ?? [];
  return variants.length > 0 ? variants.reduce((sum, v) => sum + (v.remain || 0), 0) : product.qty || 0;
};

// Admin `GET /product` мөр. `qty` нь хувилбарын одоогийн үлдэгдэл — admin түүнийг засна.
module.exports.toAdminProduct = (product) => ({
  id: product.id,
  companyId: 1,
  categoryId: product.category_id,
  date: product.date,
  name: product.name,
  title: product.title,
  description: product.description,
  images: product.images ?? [],
  qty: String(remainOf(product)),
  mainPrice: money(product.main_price),
  price: money(product.price),
  deepLink: String(product.id),
  isActive: !!product.is_active,
  statusId: product.is_active ? "active" : "inactive",
  createdAt: toIso(product.created_at),
  updatedAt: toIso(product.updated_at ?? product.created_at),
  attrs: productAttrs(product),
  variants: (product.variants ?? []).map((v) => ({
    id: v.id,
    productId: v.product_id,
    name: v.name,
    price: money(v.price),
    mainPrice: money(v.main_price),
    qty: String(v.remain),
    remain: String(v.remain),
    attr: v.attr ?? [],
  })),
});

// Хувилбарын зураг: өнгө (зурагтай сонголт)-ний утгын эхний зураг
const variantImage = (attrs, variant) => {
  for (const a of variant.attr ?? []) {
    const value = attrs.find((attr) => attr.attrId === a.attrId)?.values.find((v) => v.value === a.value);
    const image = value?.image ?? value?.images?.[0] ?? a.image;
    if (image) return image;
  }
  return null;
};
module.exports.variantImage = variantImage;

// Вэб `GET /post` мөр; `detail` бол `/post/{id}`-ийн хувилбар, сонголтуудыг нэмнэ
module.exports.toWebPost = (product, detail = false) => {
  const post = {
    id: product.id,
    productId: product.id,
    productName: product.name,
    name: product.name,
    note: product.description,
    price: money(product.price),
    mainPrice: money(product.main_price),
    remain: String(remainOf(product)),
    isActive: !!product.is_active,
    categoryId: product.category_id,
    category: product.category ? { id: product.category.id, name: product.category.name, image: product.category.image } : undefined,
    images: product.images ?? [],
    createdAt: toIso(product.created_at),
  };
  if (!detail) return post;

  const attrs = productAttrs(product);
  return {
    ...post,
    postProducts: (product.variants ?? []).map((v) => ({
      id: v.id,
      variantId: v.id,
      variantCode: v.code,
      variantName: v.name,
      image: variantImage(attrs, v),
      price: money(v.price),
      mainPrice: money(v.main_price),
      remain: String(v.remain),
      attr: Object.fromEntries((v.attr ?? []).map((a) => [String(a.attrId), a.value])),
      postProductBranches: [{ id: v.id, branchId: defaultBranch.id, remain: String(v.remain), branch: defaultBranch }],
    })),
    postAttrs: attrs.map((a) => ({
      attrId: a.attrId,
      attrName: a.attrName,
      viewType: a.viewType,
      orderNumber: a.orderNumber,
      postAttrValues: a.values.map((v) => ({ ...v, images: v.images ?? [] })),
    })),
  };
};

// Admin илгээсэн сонголтуудыг хадгалах хэлбэрт оруулна. Дэлгүүрийн каталогид байгаа утгыг attrValueId-аар холбоно.
const normalizeAttrs = async (shopId, input, variants) => {
  let attrs = Array.isArray(input)
    ? input
        .filter((a) => a && a.attrId != null)
        .map((a, i) => ({
          attrId: Number(a.attrId),
          attrName: a.name ?? a.attrName ?? "",
          orderNumber: i,
          values: (a.values ?? []).map((v, j) => ({
            attrValueId: v.attrValueId ?? null,
            value: String(v.value ?? "").trim(),
            color: v.color ?? null,
            image: v.image ?? null,
            images: Array.isArray(v.images) ? v.images.filter(Boolean) : [],
            orderNumber: j,
          })),
        }))
    : productAttrs({ variants });

  const catalog = attrs.length
    ? await attrValues.findAll({
        where: { attr_id: attrs.map((a) => a.attrId), status: "active" },
        include: [{ model: attrRows, as: "attr", attributes: [], where: { shop_id: shopId } }],
        raw: true,
      })
    : [];
  return attrs.map((a) => ({
    ...a,
    viewType: /өнгө/i.test(a.attrName) || a.values.some((v) => v.color || v.image) ? "image" : "text",
    values: a.values.map((v) => ({
      ...v,
      attrValueId:
        v.attrValueId ??
        catalog.find((c) => c.attr_id === a.attrId && c.name.trim().toUpperCase() === v.value.toUpperCase())?.id ??
        null,
    })),
  }));
};

/**
 * Admin-ийн `POST /product`, `PUT /product/{id}`. Хувилбарыг id-аар, эсвэл
 * сонголтын утгаар (`attr`) тааруулна; жагсаалтад байхгүй болсон хувилбар
 * устгагдана. `qty` бол үлдэгдэл.
 */
module.exports.saveProduct = async ({ shopId, id = null, body, by }) => {
  const at = now();
  const variantsIn = Array.isArray(body.variants) ? body.variants : [];
  if (!body.name?.trim()) throw "Барааны нэр оруулна уу";
  if (!body.categoryId) throw "Категори сонгоно уу";
  if (variantsIn.length === 0) throw "Дор хаяж нэг хувилбар оруулна уу";

  if (!(await categories.count({ where: { id: body.categoryId, shop_id: shopId, status: "active" } }))) throw "Категори олдсонгүй";

  const attrs = await normalizeAttrs(shopId, body.attrs, variantsIn);
  const values = {
    category_id: body.categoryId,
    date: body.date || today(),
    name: body.name.trim(),
    title: body.title ?? null,
    description: body.description ?? null,
    images: Array.isArray(body.images) ? body.images.filter(Boolean) : [],
    attrs,
    main_price: toNumber(body.mainPrice),
    price: toNumber(body.price),
    is_active: body.isActive !== false && body.statusId !== "inactive",
  };

  const t = await sequelize.transaction();
  try {
    let product;
    if (id) {
      product = await products.findOne({ where: { id, shop_id: shopId, status: { [op.ne]: "deleted" } }, transaction: t });
      if (!product) throw "Бараа олдсонгүй";
      await product.update({ ...values, updated_by: by, updated_at: at }, { transaction: t });
    } else {
      product = await products.create({ ...values, shop_id: shopId, status: "active", created_by: by, created_at: at }, { transaction: t });
    }

    const existing = await productVariants.findAll({ where: { product_id: product.id, status: "active" }, transaction: t });
    const kept = new Set();
    let total = 0;
    for (const [i, v] of variantsIn.entries()) {
      const attr = (v.attr ?? []).filter((a) => a && a.attrId != null && a.value);
      const name = v.name || product.name;
      const sig = signature(attr, name);
      const match =
        existing.find((e) => !kept.has(e.id) && v.id != null && e.id === Number(v.id)) ??
        existing.find((e) => !kept.has(e.id) && signature(e.attr, e.name) === sig);
      const qty = Math.max(0, Math.floor(toNumber(v.qty)));
      total += qty;
      const row = {
        name,
        attr,
        price: toNumber(v.price),
        main_price: toNumber(v.mainPrice),
        qty,
        remain: qty,
        order_number: i,
      };
      if (match) {
        kept.add(match.id);
        await match.update({ ...row, updated_by: by, updated_at: at }, { transaction: t });
      } else {
        await productVariants.create(
          { ...row, product_id: product.id, code: null, status: "active", created_by: by, created_at: at },
          { transaction: t },
        );
      }
    }
    for (const e of existing.filter((e) => !kept.has(e.id)))
      await e.update({ status: "deleted", deleted_by: by, deleted_at: at }, { transaction: t });
    await product.update({ qty: total }, { transaction: t });

    await saveLog(
      {
        shop_id: shopId,
        object_name: "products",
        object_id: product.id,
        log_action: id ? "updated" : "created",
        modify_data: JSON.stringify(body),
        created_by: by,
        created_at: at,
      },
      t,
    );
    await t.commit();
    return product.id;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// where-д shop_id заавал өгнө
module.exports.findProduct = (where) =>
  products.findOne({
    where: { ...where, status: "active" },
    include: module.exports.productInclude,
    order: module.exports.variantOrder,
  });
