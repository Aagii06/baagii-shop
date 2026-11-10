const { Op } = require("sequelize");
const { notifications, users } = require("../models");
const { roles } = require("../config/constants");
const { now } = require("./helper");

// Үлдэгдэл үүнээс доош ороход "нөөц дуусч байна" мэдэгдэл (admin-ийн LOW_STOCK_THRESHOLD-тэй ижил)
const LOW_STOCK = 5;
module.exports.LOW_STOCK = LOW_STOCK;

/**
 * Дэлгүүрийн бүх ADMIN-д, storeId өгвөл тэр дэлгүүрийн SHOPPER-уудад ч мэдэгдэл бичнэ.
 * Мэдэгдэл үндсэн үйлдлийг хэзээ ч унагаахгүй — алдааг зөвхөн log-д бичнэ.
 */
module.exports.notify = async ({ shopId, type, title, body = null, link = null, storeId = null }) => {
  try {
    const recipients = await users.findAll({
      attributes: ["id"],
      where: {
        shop_id: shopId,
        status: "active",
        [Op.or]: [{ role: roles.admin }, ...(storeId ? [{ role: roles.shopper, store_id: storeId }] : [])],
      },
      raw: true,
    });
    if (recipients.length === 0) return;
    const at = now();
    await notifications.bulkCreate(
      recipients.map((u) => ({ shop_id: shopId, user_id: u.id, type, title, body, link, read_at: null, created_at: at })),
    );
  } catch (error) {
    console.error("notify failed:", error);
  }
};

/** Захиалгын дараа LOW_STOCK-оос доош шинээр орсон хувилбарууд: [{ name, productId, storeId, remain }] */
module.exports.notifyLowStock = (shopId, items) =>
  Promise.all(
    items.map((item) =>
      module.exports.notify({
        shopId,
        type: "low_stock",
        title: item.remain <= 0 ? `"${item.name}" дууслаа` : `"${item.name}" дуусч байна`,
        body: item.remain <= 0 ? "Үлдэгдэл 0 боллоо" : `${item.remain} ширхэг үлдлээ`,
        link: `/products/${item.productId}`,
        storeId: item.storeId,
      }),
    ),
  );
