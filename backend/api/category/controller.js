const { categories, categoryAttrs, attrs, products, sequelize } = require("../../models");
const { maxCategoryDepth, maxCategoryAttrs } = require("../../config/constants");
const { buildTree } = require("../../helper/categoryHelper");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle } = require("../../helper/helper");

module.exports.tree = handle("categoryTree", async (req, res) => ok(res, await buildTree(req.shopId, { withAttrs: true })));

// Эцгээс дээш хэдэн түвшин байгаа (үндсэн категори = 1). Эцэг нь энэ дэлгүүрийнх байх ёстой.
const depthOf = async (shopId, id, t) => {
  let depth = 0;
  for (let current = id; current; depth++) {
    const row = await categories.findOne({ where: { id: current, shop_id: shopId, status: "active" }, attributes: ["parent_id"], transaction: t, raw: true });
    if (!row) throw "Эцэг категори олдсонгүй";
    current = row.parent_id;
    if (depth > maxCategoryDepth) break;
  }
  return depth;
};

// Өөрийн доорх түвшний тоо (навч = 1)
const heightOf = async (id, t) => {
  const children = await categories.findAll({ where: { parent_id: id, status: "active" }, attributes: ["id"], transaction: t, raw: true });
  let height = 0;
  for (const child of children) height = Math.max(height, await heightOf(child.id, t));
  return height + 1;
};

const isBelow = async (id, ancestorId, t) => {
  for (let current = id; current; ) {
    if (current === ancestorId) return true;
    const row = await categories.findOne({ where: { id: current }, attributes: ["parent_id"], transaction: t, raw: true });
    current = row?.parent_id;
  }
  return false;
};

// Зөвхөн энэ дэлгүүрийн сонголтуудыг холбоно
const syncAttrs = async (shopId, categoryId, attrIds, t) => {
  const wanted = [...new Set((Array.isArray(attrIds) ? attrIds : []).map(Number).filter(Boolean))];
  if (wanted.length > maxCategoryAttrs) throw `Сонголт дээд тал нь ${maxCategoryAttrs} байна`;
  const own = wanted.length
    ? new Set((await attrs.findAll({ where: { id: wanted, shop_id: shopId, status: "active" }, attributes: ["id"], transaction: t, raw: true })).map((a) => a.id))
    : new Set();
  const ids = wanted.filter((id) => own.has(id));
  await categoryAttrs.destroy({ where: { category_id: categoryId }, transaction: t });
  if (ids.length)
    await categoryAttrs.bulkCreate(ids.map((attr_id, i) => ({ category_id: categoryId, attr_id, order_number: i })), { transaction: t });
  return ids;
};

const fields = (body) => ({
  name: body.name.trim(),
  parent_id: body.parentId || null,
  code: body.code ?? null,
  image: body.image ?? null,
  style: body.style ?? null,
  childs: body.childs ?? null,
});

const save = (getId) => async (req, res) => {
  const { by, at, attrIds, ...body } = req.body;
  const { shopId } = req;
  const id = getId(req) ? Number(getId(req)) : null;
  const t = await sequelize.transaction();
  try {
    const values = fields(body);
    if (values.parent_id) {
      if (id && (await isBelow(Number(values.parent_id), id, t))) throw "Категорийг өөрийнхөө доор зөөх боломжгүй";
      const height = id ? await heightOf(id, t) : 1;
      if ((await depthOf(shopId, Number(values.parent_id), t)) + height > maxCategoryDepth)
        throw `Категори дээд тал нь ${maxCategoryDepth} түвшин байна`;
    }

    let category;
    if (id) {
      category = await categories.findOne({ where: { id, shop_id: shopId, status: "active" }, transaction: t });
      if (!category) throw "Категори олдсонгүй";
      await category.update({ ...values, updated_by: by, updated_at: at }, { transaction: t });
    } else {
      category = await categories.create({ ...values, shop_id: shopId, status: "active", created_by: by, created_at: at }, { transaction: t });
    }
    const linked = attrIds !== undefined ? await syncAttrs(shopId, category.id, attrIds, t) : [];
    await saveLog(
      { shop_id: shopId, object_name: "categories", object_id: category.id, log_action: id ? "updated" : "created", modify_data: JSON.stringify(req.body), created_by: by, created_at: at },
      t,
    );
    await t.commit();
    return ok(res, { ...category.get({ plain: true }), attrIds: linked });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

module.exports.create = handle("categoryCreate", save(() => null));
module.exports.update = handle("categoryUpdate", save((req) => req.params.id));

// Дэд категори эсвэл бараатай категорийг устгахгүй
module.exports.destroy = handle("categoryDestroy", async (req, res) => {
  const { by, at } = req.body;
  const category = await categories.findOne({ where: { id: req.params.id, shop_id: req.shopId, status: "active" } });
  if (!category) return fail(res, "Категори олдсонгүй");
  if (await categories.count({ where: { parent_id: category.id, status: "active" } }))
    return fail(res, "Дэд категоритой тул устгах боломжгүй. Эхлээд дэд категориудыг устгана уу");
  if (await products.count({ where: { category_id: category.id, status: "active" } }))
    return fail(res, "Энэ категорид бараа бүртгэлтэй тул устгах боломжгүй");

  const t = await sequelize.transaction();
  try {
    await category.update({ status: "deleted", deleted_by: by, deleted_at: at }, { transaction: t });
    await categoryAttrs.destroy({ where: { category_id: category.id }, transaction: t });
    await saveLog({ shop_id: req.shopId, object_name: "categories", object_id: category.id, log_action: "deleted", created_by: by, created_at: at }, t);
    await t.commit();
    return ok(res, null);
  } catch (error) {
    await t.rollback();
    throw error;
  }
});
