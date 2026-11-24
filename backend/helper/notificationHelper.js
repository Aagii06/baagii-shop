const { Op } = require("sequelize");
const moment = require("moment");
const { notifications, users, customers, orders, orderItems, products } = require("../models");
const { roles, orderStatuses, unpaidCancelHours } = require("../config/constants");
const { now, toNumber, FORMAT } = require("./helper");
const { sendPush } = require("./pushHelper");

// Үлдэгдэл үүнээс доош ороход "нөөц дуусч байна" мэдэгдэл (admin-ийн LOW_STOCK_THRESHOLD-тэй ижил)
const LOW_STOCK = 5;
module.exports.LOW_STOCK = LOW_STOCK;

const money = (value) => `₮${Math.round(toNumber(value)).toLocaleString("en-US")}`;

// Мэдэгдлийн мөрүүдийг бичээд апп руу push илгээнэ
const deliver = async ({ shopId, ownerType, ownerIds, type, title, body, link }) => {
  if (ownerIds.length === 0) return;
  const at = now();
  const key = ownerType === "user" ? "user_id" : "customer_id";
  await notifications.bulkCreate(
    ownerIds.map((id) => ({ shop_id: shopId, [key]: id, type, title, body, link, read_at: null, created_at: at })),
  );
  await sendPush({ shopId, ownerType, ownerIds, type, title, body, link });
};

/**
 * Админ/худалдагчид: дэлгүүрийн бүх ADMIN-д (admins: false бол үгүй), storeId/storeIds өгвөл тэр
 * дэлгүүрүүдийн SHOPPER-уудад. Худалдагч захиалга хардаггүй тул тэдэнд shopperLink (байхгүй бол link).
 * except — үйлдлийг өөрөө хийсэн хэрэглэгч (өөртөө мэдэгдэхгүй).
 * Мэдэгдэл үндсэн үйлдлийг хэзээ ч унагаахгүй — алдааг зөвхөн log-д бичнэ.
 */
module.exports.notify = async ({
  shopId,
  type,
  title,
  body = null,
  link = null,
  storeId = null,
  storeIds = [],
  shopperLink,
  admins = true,
  except = null,
}) => {
  try {
    const stores = [...new Set([...(storeId ? [storeId] : []), ...storeIds].filter(Boolean))];
    const or = [...(admins ? [{ role: roles.admin }] : []), ...(stores.length ? [{ role: roles.shopper, store_id: { [Op.in]: stores } }] : [])];
    if (or.length === 0) return;
    const recipients = await users.findAll({
      attributes: ["id", "role"],
      where: { shop_id: shopId, status: "active", [Op.or]: or, ...(except ? { id: { [Op.ne]: except } } : {}) },
      raw: true,
    });
    const adminIds = recipients.filter((u) => u.role === roles.admin).map((u) => u.id);
    const shopperIds = recipients.filter((u) => u.role !== roles.admin).map((u) => u.id);
    const base = { shopId, ownerType: "user", type, title, body };
    await deliver({ ...base, ownerIds: adminIds, link });
    await deliver({ ...base, ownerIds: shopperIds, link: shopperLink === undefined ? link : shopperLink });
  } catch (error) {
    console.error("notify failed:", error);
  }
};

/** Утсаар нэвтэрсэн худалдан авагчид (апп-ын профайл → Мэдэгдэл, вэбийн /notifications). */
const notifyCustomer = async ({ shopId, customerId, type, title, body = null, link = null }) => {
  try {
    if (!customerId) return;
    await deliver({ shopId, ownerType: "customer", ownerIds: [customerId], type, title, body, link });
  } catch (error) {
    console.error("notifyCustomer failed:", error);
  }
};
module.exports.notifyCustomer = notifyCustomer;

/** Энэ дугаараар бүртгэлтэй худалдан авагч байвал түүнд. */
module.exports.notifyCustomerByPhone = async ({ shopId, phone, ...rest }) => {
  try {
    const customer = await customers.findOne({ attributes: ["id"], where: { shop_id: shopId, phone, status: "active" }, raw: true });
    if (customer) await notifyCustomer({ shopId, customerId: customer.id, ...rest });
  } catch (error) {
    console.error("notifyCustomerByPhone failed:", error);
  }
};

// Захиалгын төлөв өөрчлөгдөхөд худалдан авагчид очих текст
const customerTexts = {
  paid: (o, amount) => ({
    type: "order_paid",
    title: `Захиалга ${o.order_number ?? `#${o.id}`}-ийн төлбөр төлөгдлөө`,
    body: amount != null ? `${money(amount)} амжилттай төлөгдлөө. Баярлалаа!` : "Төлбөр амжилттай төлөгдлөө. Баярлалаа!",
  }),
  confirmed: (o) => ({ type: "order_confirmed", title: `Захиалга ${o.order_number ?? `#${o.id}`} баталгаажлаа`, body: "Таны захиалгыг хүлээн авч, бэлтгэж байна." }),
  delivered: (o) => ({ type: "order_delivered", title: `Захиалга ${o.order_number ?? `#${o.id}`} хүргэгдлээ`, body: "Манайхаар үйлчлүүлсэнд баярлалаа!" }),
  cancelled: (o) => ({
    type: "order_cancelled",
    title: `Захиалга ${o.order_number ?? `#${o.id}`} цуцлагдлаа`,
    body: `Төлбөр ${unpaidCancelHours} цагийн дотор төлөгдөөгүй тул захиалга цуцлагдлаа.`,
  }),
  returned: (o) => ({ type: "order_returned", title: `Захиалга ${o.order_number ?? `#${o.id}`} буцаагдлаа`, body: "Захиалгын бүх бараа буцаагдлаа." }),
  itemReturned: (o, item, qty) => ({
    type: "order_returned",
    title: `Захиалга ${o.order_number ?? `#${o.id}`}-ээс бараа буцаагдлаа`,
    body: `${item.name} × ${qty}`,
  }),
};

/** event: paid | confirmed | delivered | cancelled | returned | itemReturned */
module.exports.notifyOrderCustomer = (order, event, ...args) =>
  notifyCustomer({ shopId: order.shop_id, customerId: order.customer_id, link: `/orders/${order.order_number ?? order.id}`, ...customerTexts[event](order, ...args) });

/**
 * Нэг захиалгад олон дэлгүүрийн бараа орж болно — дэлгүүр бүрийн худалдагчдад (админд биш)
 * зөвхөн өөрийнх нь бараа, дүнгээр тусад нь мэдэгдэнэ. Худалдагч захиалга хардаггүй тул
 * холбоос нь /products. items[].store_id — захиалах үеийн дэлгүүр (null — үндсэн дэлгүүр).
 * event: placed (шинэ захиалга) | confirmed (баталгаажсан — бэлтгэнэ)
 */
module.exports.notifyOrderStores = async (order, event) => {
  try {
    const byStore = new Map();
    for (const item of order.items ?? []) {
      const qty = item.qty - (item.returned_qty || 0);
      if (!item.store_id || qty <= 0) continue;
      const s = byStore.get(item.store_id) ?? { lines: 0, qty: 0, total: 0 };
      s.lines++;
      s.qty += qty;
      s.total += qty * toNumber(item.price);
      byStore.set(item.store_id, s);
    }
    const number = order.order_number ?? `#${order.id}`;
    for (const [storeId, s] of byStore) {
      const summary = `Таны ${s.lines} бараа (${s.qty} ширхэг) · ${money(s.total)}`;
      await module.exports.notify({
        shopId: order.shop_id,
        storeId,
        admins: false,
        shopperLink: "/products",
        ...(event === "confirmed"
          ? { type: "order_confirmed", title: `Захиалга ${number} баталгаажлаа — бэлтгэнэ үү`, body: summary }
          : { type: "order", title: `Шинэ захиалга ${number}`, body: summary }),
      });
    }
  } catch (error) {
    console.error("notifyOrderStores failed:", error);
  }
};

/** Захиалгын бараанууд аль дэлгүүрийнх вэ (худалдагчдад мэдэгдэхэд). */
const orderStoreIds = async (order) => {
  const ids = [...new Set((order.items ?? []).map((i) => i.product_id).filter(Boolean))];
  if (ids.length === 0) return [];
  const rows = await products.findAll({ attributes: ["store_id"], where: { id: { [Op.in]: ids } }, raw: true });
  return [...new Set(rows.map((r) => r.store_id).filter(Boolean))];
};

/**
 * Захиалга цуцлагдсан / буцаагдсан — бусад админд (өөрөө хийснээс бусад), бараа нь
 * үлдэгдэлд буцсан худалдагчдад. kind: cancelled | returned | itemReturned
 */
module.exports.notifyOrderStaff = async (order, kind, { by = null, item = null, qty = 0 } = {}) => {
  try {
    const who = [order.customer_name, order.phone].filter(Boolean).join(" · ");
    const texts = {
      cancelled: { type: "order_cancelled", title: `Захиалга ${order.order_number ?? `#${order.id}`} цуцлагдлаа`, body: `${who} · төлөгдөөгүй удсан` },
      customerCancelled: { type: "order_cancelled", title: `Захиалга ${order.order_number ?? `#${order.id}`} цуцлагдлаа`, body: `${who} · худалдан авагч өөрөө цуцаллаа` },
      returned: { type: "order_returned", title: `Захиалга ${order.order_number ?? `#${order.id}`} буцаагдлаа`, body: who },
      itemReturned: { type: "order_returned", title: `Захиалга ${order.order_number ?? `#${order.id}`}-ээс бараа буцлаа`, body: item ? `${item.name} × ${qty}` : who },
    };
    const storeIds = kind === "itemReturned" && item ? await orderStoreIds({ items: [item] }) : await orderStoreIds(order);
    await module.exports.notify({
      shopId: order.shop_id,
      ...texts[kind],
      link: `/orders/${order.id}`,
      storeIds,
      shopperLink: "/products",
      except: by,
    });
  } catch (error) {
    console.error("notifyOrderStaff failed:", error);
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

/**
 * unpaidCancelHours-аас удаан төлөгдөөгүй pending захиалгыг админд нэг удаа сануулна
 * (server.js 10 минут тутам дуудна). Сервер унтарч байсан үеийн хуучин захиалгыг
 * бөөнөөр нь илгээхгүйн тулд сүүлийн 2 хоногт хугацаа нь хэтэрснийг л авна.
 */
module.exports.scanOverdueOrders = async () => {
  try {
    const at = moment().utcOffset("+0800");
    const rows = await orders.findAll({
      where: {
        status: orderStatuses.pending,
        paid_at: null,
        overdue_notified_at: null,
        created_at: {
          [Op.lte]: at.clone().subtract(unpaidCancelHours, "hours").format(FORMAT),
          [Op.gte]: at.clone().subtract(unpaidCancelHours + 48, "hours").format(FORMAT),
        },
      },
      include: [{ model: orderItems, as: "items" }],
    });
    for (const order of rows) {
      // Олон процесс зэрэг ажиллавал нэг л нь илгээнэ
      const [changed] = await orders.update({ overdue_notified_at: now() }, { where: { id: order.id, overdue_notified_at: null } });
      if (!changed) continue;
      const total = (order.items ?? []).reduce((sum, i) => sum + toNumber(i.price) * (i.qty - (i.returned_qty || 0)), 0);
      await module.exports.notify({
        shopId: order.shop_id,
        type: "order_overdue",
        title: `Захиалга ${order.order_number ?? `#${order.id}`} ${unpaidCancelHours} цаг төлөгдөөгүй байна`,
        body: `${[order.customer_name, order.phone].filter(Boolean).join(" · ")} · ${money(total)} · цуцлах боломжтой`,
        link: `/orders/${order.id}`,
      });
    }
  } catch (error) {
    console.error("scanOverdueOrders failed:", error);
  }
};
