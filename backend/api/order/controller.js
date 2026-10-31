const moment = require("moment");
const { orders, orderItems, sequelize, op } = require("../../models");
const { orderStatuses, orderTransitions } = require("../../config/constants");
const { itemsInclude, toAdminOrder, placeOrder, restock, findOrder, revenueOf } = require("../../helper/orderHelper");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle, toNumber, phoneDigits, isPhone, FORMAT } = require("../../helper/helper");

// Бүх захиалга, шинэ нь эхэндээ
module.exports.list = handle("orderList", async (req, res) => {
  const rows = await orders.findAll({ include: itemsInclude, order: [["id", "desc"]] });
  return ok(res, { rows: rows.map(toAdminOrder), count: rows.length, summary: [] });
});

module.exports.show = handle("orderShow", async (req, res) => {
  const order = await findOrder({ id: req.params.id });
  return ok(res, order ? toAdminOrder(order) : null);
});

// Админ худалдан авагчийн өмнөөс: { customer: { phone, address }, items: [{ variantId, qty, price }], deliveryFee }
module.exports.create = handle("orderCreate", async (req, res) => {
  const { customer = {}, items = [], deliveryFee = 0, by } = req.body;
  if (!isPhone(customer.phone)) return fail(res, "Утасны дугаар 8 оронтой байна");
  if (!String(customer.address ?? "").trim()) return fail(res, "Хүргэлтийн хаяг оруулна уу");
  const id = await placeOrder({
    lines: items.map((item) => ({ variantId: item.variantId, qty: item.qty, price: item.price })),
    info: {
      source: "admin",
      customer_name: customer.name ?? null,
      phone: phoneDigits(customer.phone),
      address: customer.address.trim(),
      delivery_fee: Math.max(0, toNumber(deliveryFee)),
    },
    by,
  });
  return ok(res, toAdminOrder(await findOrder({ id })));
});

const stampOf = { confirmed: "confirmed_at", delivered: "delivered_at", returned: "returned_at" };

// pending → confirmed → delivered; аль ч шатнаас returned (үлдсэн бүх бараа үлдэгдэлд буцна)
module.exports.setStatus = handle("orderStatus", async (req, res) => {
  const { status, by, at } = req.body;
  const t = await sequelize.transaction();
  try {
    const order = await findOrder({ id: req.params.id }, t);
    if (!order) throw "Захиалга олдсонгүй";
    if (!(orderTransitions[order.status] ?? []).includes(status)) throw "Энэ төлөв рүү шилжүүлэх боломжгүй";

    if (status === orderStatuses.returned) {
      for (const item of order.items) {
        const left = item.qty - item.returned_qty;
        await restock(item.variant_id, left, t);
        await item.update({ returned_qty: item.qty }, { transaction: t });
      }
    }
    await order.update({ status, [stampOf[status]]: at, updated_by: by, updated_at: at }, { transaction: t });
    await saveLog({ object_name: "orders", object_id: order.id, log_action: status, created_by: by, created_at: at }, t);
    await t.commit();
    return ok(res, toAdminOrder(await findOrder({ id: order.id })));
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

// Нэг мөрөөс qty ширхгийг буцаана. Бүх мөр бүрэн буцвал захиалга returned болно.
module.exports.returnItem = handle("orderReturn", async (req, res) => {
  const { itemId, qty, by, at } = req.body;
  const count = Math.floor(toNumber(qty));
  const t = await sequelize.transaction();
  try {
    const order = await findOrder({ id: req.params.id }, t);
    if (!order) throw "Захиалга олдсонгүй";
    if (order.status === orderStatuses.returned) throw "Захиалга бүхэлдээ буцаагдсан байна";
    const item = order.items.find((i) => i.id === Number(itemId));
    if (!item) throw "Захиалгын бараа олдсонгүй";
    if (count <= 0 || count > item.qty - item.returned_qty) throw "Буцаах тоо буруу байна";

    await item.update({ returned_qty: item.returned_qty + count }, { transaction: t });
    await restock(item.variant_id, count, t);
    if (order.items.every((i) => i.returned_qty >= i.qty))
      await order.update({ status: orderStatuses.returned, returned_at: at }, { transaction: t });
    await order.update({ updated_by: by, updated_at: at }, { transaction: t });
    await saveLog(
      { object_name: "orders", object_id: order.id, log_action: "itemReturned", modify_data: JSON.stringify({ itemId, qty: count }), created_by: by, created_at: at },
      t,
    );
    await t.commit();
    return ok(res, toAdminOrder(await findOrder({ id: order.id })));
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

// Борлуулалтын тойм: тухайн хугацааны болон өмнөх ижил хугацааны захиалга, орлого,
// цаг (өнөөдөр/өчигдөр) эсвэл өдрөөр (7/30 хоног) задаргаа. Буцаагдсан захиалга тоологдохгүй.
const ranges = {
  today: () => ({ start: moment().utcOffset("+0800").startOf("day"), unit: "hour", buckets: 24 }),
  yesterday: () => ({ start: moment().utcOffset("+0800").startOf("day").subtract(1, "day"), unit: "hour", buckets: 24 }),
  week: () => ({ start: moment().utcOffset("+0800").startOf("day").subtract(6, "days"), unit: "day", buckets: 7 }),
  month: () => ({ start: moment().utcOffset("+0800").startOf("day").subtract(29, "days"), unit: "day", buckets: 30 }),
};

module.exports.sales = handle("orderSales", async (req, res) => {
  const range = ranges[req.query.range] ? req.query.range : "today";
  const { start, unit, buckets } = ranges[range]();
  const end = start.clone().add(buckets, unit === "hour" ? "hours" : "days");
  const prevStart = start.clone().subtract(end.diff(start));

  const rows = await orders.findAll({
    where: {
      created_at: { [op.gte]: prevStart.format(FORMAT), [op.lt]: end.format(FORMAT) },
      status: { [op.ne]: orderStatuses.returned },
    },
    include: itemsInclude,
  });

  const series = Array.from({ length: buckets }, (_, i) => ({
    start: start.clone().add(i, unit === "hour" ? "hours" : "days").format(),
    value: 0,
  }));
  let current = { orders: 0, revenue: 0 };
  let previous = { orders: 0, revenue: 0 };
  for (const order of rows) {
    const at = moment(order.created_at, FORMAT).utcOffset("+0800", true);
    const revenue = revenueOf(order);
    if (at.isBefore(start)) {
      previous.orders++;
      previous.revenue += revenue;
      continue;
    }
    current.orders++;
    current.revenue += revenue;
    series[Math.floor(at.diff(start, unit === "hour" ? "hours" : "days", true))].value += revenue;
  }
  return ok(res, { range, unit, ...current, previous, series });
});
