const { stores, users } = require("../models");
const { roles } = require("../config/constants");
const { toIso } = require("./helper");

// admin/src/lib/api/stores.ts-ийн Store
module.exports.toStore = (row, productsCnt = undefined) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  phones: stores.listOf(row, "phones", "phone"),
  email: row.email,
  emails: stores.listOf(row, "emails", "email"),
  address: row.address,
  addresses: stores.listOf(row, "addresses", "address"),
  logo: row.logo,
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
