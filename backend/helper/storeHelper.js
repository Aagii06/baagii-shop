const { stores, users, storeBankAccounts } = require("../models");
const { roles } = require("../config/constants");
const { toIso } = require("./helper");

// Тооцоо шилжүүлэх данснууд (storeBankAccounts), үндсэн нь эхэндээ
const toBank = (b) => ({ id: b.id, name: b.bank_name ?? null, account: b.account, holder: b.holder ?? null });
module.exports.toBank = toBank;

// Дэлгүүр бүрийн данснууд: Map<store_id, bank[]>
module.exports.banksByStore = async (shopId, storeIds, transaction) => {
  const map = new Map();
  if (!storeIds.length) return map;
  const rows = await storeBankAccounts.findAll({
    where: { shop_id: shopId, store_id: storeIds },
    order: [["sort", "asc"], ["id", "asc"]],
    raw: true,
    transaction,
  });
  for (const r of rows) map.set(r.store_id, [...(map.get(r.store_id) ?? []), toBank(r)]);
  return map;
};

// admin/src/lib/api/stores.ts-ийн Store
module.exports.toStore = (row, productsCnt = undefined, banks = []) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  phones: stores.listOf(row, "phones", "phone"),
  email: row.email,
  emails: stores.listOf(row, "emails", "email"),
  address: row.address,
  addresses: stores.listOf(row, "addresses", "address"),
  logo: row.logo,
  tier: row.tier || "normal",
  banks,
  ...(productsCnt !== undefined && { productsCnt }),
  createdAt: toIso(row.created_at),
});

module.exports.findStore = (shopId, id, transaction) =>
  id ? stores.findOne({ where: { id, shop_id: shopId, status: "active" }, transaction }) : null;

// SHOPPER зөвхөн өөрийн дэлгүүрийнхтэй ажиллана: ADMIN бол undefined (хязгааргүй),
// SHOPPER бол түүний store_id (дэлгүүргүй бол null — юу ч харахгүй).
// Токенд биш DB-д хардаг тул админ дэлгүүрийг нь солиход шууд үйлчилнэ.
module.exports.ownStoreId = async (req) => {
  if (req.loggedUser?.role === roles.admin) return undefined;
  const user = await users.findOne({
    where: { id: req.loggedUser.id, shop_id: req.shopId, status: "active" },
    attributes: ["store_id"],
    raw: true,
  });
  return user?.store_id ?? null;
};
