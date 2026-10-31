const { shops } = require("../models");

// Frontend бүр X-Shop-Id толгойгоор (.env: NEXT_PUBLIC_SHOP_ID) аль дэлгүүрийнх болохоо хэлнэ.
// Дараагийн бүх query req.shopId-аар шүүгдэнэ.
let cache = null;
const activeShops = async () => {
  if (!cache) {
    const rows = await shops.findAll({ where: { status: "active" }, attributes: ["id"], raw: true });
    cache = new Set(rows.map((r) => r.id));
    setTimeout(() => (cache = null), 60 * 1000);
  }
  return cache;
};

module.exports.resolveShop = async (req, res, next) => {
  try {
    const shopId = Number(req.headers["x-shop-id"]);
    if (!shopId || !(await activeShops()).has(shopId))
      return res.status(200).json({ success: false, message: "Дэлгүүр тодорхойгүй байна (X-Shop-Id)" });
    req.shopId = shopId;
    next();
  } catch (error) {
    console.log("resolveShopError:", error);
    return res.status(200).json({ success: false, message: "Алдаа гарлаа" });
  }
};
