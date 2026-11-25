const { stores, storeBankAccounts, products, users, sequelize } = require("../../models");
const { toStore, findStore, ownStoreId, banksByStore } = require("../../helper/storeHelper");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle, phoneDigits } = require("../../helper/helper");
const { storeTiers } = require("../../config/constants");

// Борлуулагч дэлгүүрүүд, нэрээр. SHOPPER зөвхөн өөрийнхөө дэлгүүрийг харна.
module.exports.list = handle("storeList", async (req, res) => {
  const own = await ownStoreId(req);
  const where = { shop_id: req.shopId, status: "active" };
  if (own !== undefined) where.id = own ?? 0;
  const rows = await stores.findAll({ where, order: [["name", "asc"], ["id", "asc"]] });
  const counts = await products.findAll({
    where: { shop_id: req.shopId, status: "active", store_id: rows.map((r) => r.id) },
    attributes: ["store_id", [sequelize.fn("COUNT", sequelize.col("id")), "cnt"]],
    group: ["store_id"],
    raw: true,
  });
  const cntOf = new Map(counts.map((c) => [c.store_id, Number(c.cnt)]));
  const banks = await banksByStore(req.shopId, rows.map((r) => r.id));
  return ok(res, { rows: rows.map((r) => toStore(r, cntOf.get(r.id) ?? 0, banks.get(r.id))), count: rows.length, summary: [] });
});

module.exports.show = handle("storeShow", async (req, res) => {
  const own = await ownStoreId(req);
  if (own !== undefined && own !== Number(req.params.id)) return ok(res, null);
  const row = await findStore(req.shopId, req.params.id);
  if (!row) return ok(res, null);
  const banks = await banksByStore(req.shopId, [row.id]);
  return ok(res, toStore(row, undefined, banks.get(row.id)));
});

// phones / emails / addresses: эхнийх нь үндсэн тул phone / email / address-д мөн хадгална
const cleanList = (list, clean) => [...new Set((Array.isArray(list) ? list : []).map(clean).filter(Boolean))];

const fields = (body) => {
  const phones = cleanList(body.phones, phoneDigits);
  const emails = cleanList(body.emails, (v) => String(v ?? "").trim().toLowerCase());
  const addresses = cleanList(body.addresses, (v) => String(v ?? "").trim());
  return {
    name: body.name.trim(),
    phone: phones[0] ?? null,
    phones: JSON.stringify(phones),
    email: emails[0] ?? null,
    emails: JSON.stringify(emails),
    address: addresses[0] ?? null,
    addresses: JSON.stringify(addresses),
    logo: body.logo || null,
    // Түвшин ирээгүй бол (хуучин клиент) өмнөхөө хадгална
    ...(storeTiers.includes(body.tier) && { tier: body.tier }),
  };
};

// banks: [{ name, account, holder }] — дансгүй мөрийг алгасна, давхардсан дансыг нэг удаа
const cleanBanks = (list) => {
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .map((b) => ({
      bank_name: String(b?.name ?? "").trim().slice(0, 100) || null,
      account: String(b?.account ?? "").replace(/\s+/g, "").toUpperCase().slice(0, 50),
      holder: String(b?.holder ?? "").trim().slice(0, 150) || null,
    }))
    .filter((b) => b.account && !seen.has(b.account) && seen.add(b.account));
};

// Данснуудыг бүгдийг нь сольж бичнэ. banks ирээгүй бол (хуучин клиент) хөндөхгүй.
const saveBanks = async (shopId, storeId, list, transaction) => {
  if (!Array.isArray(list)) return;
  await storeBankAccounts.destroy({ where: { shop_id: shopId, store_id: storeId }, transaction });
  const rows = cleanBanks(list).map((b, i) => ({ ...b, shop_id: shopId, store_id: storeId, sort: i }));
  if (rows.length) await storeBankAccounts.bulkCreate(rows, { transaction });
};

const withBanks = async (shopId, row) => toStore(row, undefined, (await banksByStore(shopId, [row.id])).get(row.id));

module.exports.create = handle("storeCreate", async (req, res) => {
  const { by, at, ...body } = req.body;
  const t = await sequelize.transaction();
  let row;
  try {
    row = await stores.create({ ...fields(body), shop_id: req.shopId, status: "active", created_by: by, created_at: at }, { transaction: t });
    await saveBanks(req.shopId, row.id, body.banks, t);
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
  await saveLog({ shop_id: req.shopId, object_name: "stores", object_id: row.id, log_action: "created", modify_data: JSON.stringify(body), created_by: by, created_at: at });
  return ok(res, await withBanks(req.shopId, row));
});

module.exports.update = handle("storeUpdate", async (req, res) => {
  const { by, at, ...body } = req.body;
  const row = await findStore(req.shopId, req.params.id);
  if (!row) return fail(res, "Дэлгүүр олдсонгүй");
  const t = await sequelize.transaction();
  try {
    await row.update({ ...fields(body), updated_by: by, updated_at: at }, { transaction: t });
    await saveBanks(req.shopId, row.id, body.banks, t);
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
  await saveLog({ shop_id: req.shopId, object_name: "stores", object_id: row.id, log_action: "updated", modify_data: JSON.stringify(body), created_by: by, created_at: at });
  return ok(res, await withBanks(req.shopId, row));
});

// Бараа эсвэл хэрэглэгч холбогдсон дэлгүүрийг устгахгүй — эхлээд тэднийг шилжүүлнэ
module.exports.destroy = handle("storeDestroy", async (req, res) => {
  const { by, at } = req.body;
  const row = await findStore(req.shopId, req.params.id);
  if (!row) return fail(res, "Дэлгүүр олдсонгүй");
  if (await products.count({ where: { shop_id: req.shopId, store_id: row.id, status: "active" } }))
    return fail(res, "Дэлгүүрт бараа бүртгэлтэй тул устгах боломжгүй");
  if (await users.count({ where: { shop_id: req.shopId, store_id: row.id, status: "active" } }))
    return fail(res, "Дэлгүүрт хэрэглэгч бүртгэлтэй тул устгах боломжгүй");
  await row.update({ status: "deleted", deleted_by: by, deleted_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "stores", object_id: row.id, log_action: "deleted", created_by: by, created_at: at });
  return ok(res, null);
});
