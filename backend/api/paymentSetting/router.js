const router = require("express").Router();
const { body } = require("express-validator");
const { paymentSettings } = require("../../models");
const { isAdmin } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const { validate } = require("../../utils/validationHelper");
const { testQpay } = require("../../helper/qpayHelper");
const { ok, fail, handle, toNumber } = require("../../helper/helper");

// Хүргэлтийн төлбөр (admin-аас захиалга үүсгэхэд). Мөр байхгүй бол асаалттай, 6000₮
const DEFAULT_DELIVERY_FEE = 6000;
const toDelivery = (s) => ({
  enabled: s ? Boolean(s.delivery_enabled) : true,
  fee: s ? toNumber(s.delivery_fee) : DEFAULT_DELIVERY_FEE,
});

// Дэлгүүрийн төлбөрийн тохиргоо (зөвхөн ADMIN). QPay-ийн нууц үгийг буцаахгүй —
// хоосон илгээвэл хуучнаараа үлдэнэ.
const toAdmin = (s) => ({
  delivery: toDelivery(s),
  bank: {
    enabled: Boolean(s?.bank_enabled),
    bankName: s?.bank_name ?? "",
    accountName: s?.bank_account_name ?? "",
    accountNumber: s?.bank_account_number ?? "",
    iban: s?.bank_iban ?? "",
  },
  qpay: {
    enabled: Boolean(s?.qpay_enabled),
    sandbox: s ? Boolean(s.qpay_sandbox) : true,
    username: s?.qpay_username ?? "",
    hasPassword: Boolean(s?.qpay_password),
    invoiceCode: s?.qpay_invoice_code ?? "",
  },
});

const str = (v) => (typeof v === "string" ? v.trim() : "");

const saveValidation = validate([
  body("bank.enabled").isBoolean(),
  body("qpay.enabled").isBoolean(),
  body("qpay.sandbox").isBoolean(),
  body("delivery.enabled").optional().isBoolean(),
  body("delivery.fee").optional().isInt({ min: 0 }).withMessage("Хүргэлтийн үнэ 0-ээс багагүй бүхэл тоо байна"),
  body("bank").custom((b) => !b.enabled || (str(b.bankName) && str(b.accountName) && str(b.accountNumber)))
    .withMessage("Банк, хүлээн авагч, дансны дугаарыг оруулна уу"),
]);

// Захиалга үүсгэх хуудсанд — бүх нэвтэрсэн ажилтанд
router.get(
  "/delivery",
  handle("deliverySetting", async (req, res) => ok(res, toDelivery(await paymentSettings.findOne({ where: { shop_id: req.shopId } })))),
);

router.use(isAdmin);

router.get(
  "/",
  handle("paymentSetting", async (req, res) => ok(res, toAdmin(await paymentSettings.findOne({ where: { shop_id: req.shopId } })))),
);

router.put(
  "/",
  saveValidation,
  byAndAt,
  handle("savePaymentSetting", async (req, res) => {
    const { bank, qpay, delivery, by, at } = req.body;
    const existing = await paymentSettings.findOne({ where: { shop_id: req.shopId } });
    const values = {
      bank_enabled: bank.enabled,
      bank_name: str(bank.bankName) || null,
      bank_account_name: str(bank.accountName) || null,
      bank_account_number: str(bank.accountNumber) || null,
      bank_iban: str(bank.iban) || null,
      qpay_enabled: qpay.enabled,
      qpay_sandbox: qpay.sandbox,
      qpay_username: str(qpay.username) || null,
      qpay_password: str(qpay.password) || existing?.qpay_password || null,
      qpay_invoice_code: str(qpay.invoiceCode) || null,
      ...(delivery && { delivery_enabled: Boolean(delivery.enabled), delivery_fee: toNumber(delivery.fee) }),
      updated_by: by,
      updated_at: at,
    };
    if (values.qpay_enabled && !(values.qpay_username && values.qpay_password && values.qpay_invoice_code))
      return fail(res, "QPay-ийн нэвтрэх нэр, нууц үг, нэхэмжлэхийн кодыг оруулна уу");
    if (values.qpay_enabled) {
      try {
        await testQpay({ shop_id: req.shopId, ...values });
      } catch (error) {
        return fail(res, `QPay-д холбогдож чадсангүй: ${typeof error === "string" ? error : "сүлжээний алдаа"}`);
      }
    }
    const saved = existing
      ? await existing.update(values)
      : await paymentSettings.create({ shop_id: req.shopId, ...values, created_at: at });
    return ok(res, toAdmin(saved));
  }),
);

module.exports = router;
