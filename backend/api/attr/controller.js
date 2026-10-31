const { attrs, attrValues, categoryAttrs, sequelize, op } = require("../../models");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle } = require("../../helper/helper");

// Барааны сонголт (өнгө, хэмжээ, …) ба түүний утгууд. admin/src/lib/api/attrs.ts-ийн AttrRecord.
const valuesInclude = { model: attrValues, as: "attrValues", required: false, where: { status: "active" } };

const toRecord = (attr) => ({
  id: attr.id,
  code: attr.code,
  name: attr.name,
  shortName: attr.short_name,
  attrValueTypeId: attr.value_type,
  description: attr.description,
  image: attr.image,
  valuesCnt: attr.attrValues?.length ?? 0,
  attrValues: [...(attr.attrValues ?? [])]
    .sort((a, b) => a.order_number - b.order_number)
    .map((v) => ({
      id: v.id,
      code: v.code,
      name: v.name,
      nameEng: v.name_eng,
      description: v.description,
      orderNumber: v.order_number,
      image: v.image,
      color: v.color,
    })),
});

module.exports.list = handle("attrList", async (req, res) => {
  const { limit, offset, where, order } = req;
  const { rows, count } = await attrs.findAndCountAll({
    where: { [op.and]: [...where, { shop_id: req.shopId, status: "active" }] },
    include: [valuesInclude],
    distinct: true,
    limit,
    offset,
    order: order?.length ? order : [["id", "asc"]],
  });
  return ok(res, { rows: rows.map(toRecord), count, summary: [] });
});

module.exports.show = handle("attrShow", async (req, res) => {
  const attr = await attrs.findOne({ where: { id: req.params.id, shop_id: req.shopId, status: "active" }, include: [valuesInclude] });
  return ok(res, attr ? toRecord(attr) : null);
});

const fields = (body) => ({
  code: body.code ?? null,
  name: body.name.trim(),
  short_name: body.shortName ?? null,
  value_type: body.attrValueTypeId ?? "select",
  description: body.description ?? null,
  image: body.image ?? null,
});

// `attrValues`: id-тай нь засагдана, id-гүй нь шинээр үүснэ, жагсаалтад байхгүй болсон нь устна
const syncValues = async (attrId, values, by, at, t) => {
  const existing = await attrValues.findAll({ where: { attr_id: attrId, status: "active" }, transaction: t });
  const kept = new Set();
  for (const [i, v] of (Array.isArray(values) ? values : []).entries()) {
    const name = String(v.name ?? "").trim();
    if (!name) continue;
    const row = {
      code: v.code ?? null,
      name,
      name_eng: v.nameEng ?? null,
      description: v.description ?? null,
      order_number: v.orderNumber ?? i,
      image: v.image ?? null,
      color: v.color ?? null,
    };
    const match = v.id != null && existing.find((e) => e.id === Number(v.id));
    if (match) {
      kept.add(match.id);
      await match.update({ ...row, updated_by: by, updated_at: at }, { transaction: t });
    } else {
      await attrValues.create({ ...row, attr_id: attrId, status: "active", created_by: by, created_at: at }, { transaction: t });
    }
  }
  for (const e of existing.filter((e) => !kept.has(e.id)))
    await e.update({ status: "deleted", deleted_by: by, deleted_at: at }, { transaction: t });
};

const save = (id) => async (req, res) => {
  const { by, at, attrValues: values, ...body } = req.body;
  const t = await sequelize.transaction();
  try {
    let attr;
    if (id(req)) {
      attr = await attrs.findOne({ where: { id: id(req), shop_id: req.shopId, status: "active" }, transaction: t });
      if (!attr) throw "Сонголт олдсонгүй";
      await attr.update({ ...fields(body), updated_by: by, updated_at: at }, { transaction: t });
    } else {
      attr = await attrs.create({ ...fields(body), shop_id: req.shopId, status: "active", created_by: by, created_at: at }, { transaction: t });
    }
    await syncValues(attr.id, values, by, at, t);
    await saveLog(
      { shop_id: req.shopId, object_name: "attrs", object_id: attr.id, log_action: id(req) ? "updated" : "created", modify_data: JSON.stringify(req.body), created_by: by, created_at: at },
      t,
    );
    await t.commit();
    const saved = await attrs.findByPk(attr.id, { include: [valuesInclude] });
    return ok(res, toRecord(saved));
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

module.exports.create = handle("attrCreate", save(() => null));
module.exports.update = handle("attrUpdate", save((req) => req.params.id));

// Категориудаас нь хасаад устгана (бараан дээр хадгалсан утгууд хэвээр)
module.exports.destroy = handle("attrDestroy", async (req, res) => {
  const { by, at } = req.body;
  const attr = await attrs.findOne({ where: { id: req.params.id, shop_id: req.shopId, status: "active" } });
  if (!attr) return fail(res, "Сонголт олдсонгүй");
  const t = await sequelize.transaction();
  try {
    await attr.update({ status: "deleted", deleted_by: by, deleted_at: at }, { transaction: t });
    await categoryAttrs.destroy({ where: { attr_id: attr.id }, transaction: t });
    await saveLog({ shop_id: req.shopId, object_name: "attrs", object_id: attr.id, log_action: "deleted", created_by: by, created_at: at }, t);
    await t.commit();
    return ok(res, null);
  } catch (error) {
    await t.rollback();
    throw error;
  }
});
