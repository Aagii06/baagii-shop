const router = require("express").Router();
const { body } = require("express-validator");
const { paymentSettings, shopBankAccounts, sequelize } = require("../../models");
const { MAX_SHOP_BANKS, shopBanks } = require("../../helper/shopBankHelper");
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
// хоосон илгээвэл хуучнаараа үлдэнэ. bank.accounts — 5 хүртэл данс (эхнийх нь үндсэн);
// bankName… нь эхний данс (хуучин клиентэд).
const toAdmin = (s, accounts = []) => ({
  delivery: toDelivery(s),
  bank: {
    enabled: Boolean(s?.bank_enabled),
    accounts,
    bankName: accounts[0]?.bankName ?? "",
    accountName: accounts[0]?.accountName ?? "",
    accountNumber: accounts[0]?.accountNumber ?? "",
    iban: accounts[0]?.iban ?? "",
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

// bank.accounts (шинэ) эсвэл хуучин ганц данс (bankName…). Хоосон мөрийг алгасна, давхардлыг нэг удаа.
const accountsOf = (bank) => {
  const list = Array.isArray(bank?.accounts) ? bank.accounts : [bank ?? {}];
  const seen = new Set();
  return list
    .map((a) => ({
      bankName: str(a?.bankName),
      accountNumber: str(a?.accountNumber).replace(/\s+/g, "").toUpperCase(),
      accountName: str(a?.accountName),
      iban: str(a?.iban).replace(/\s+/g, "").toUpperCase() || null,
    }))
    .filter((a) => (a.bankName || a.accountNumber || a.accountName) && !seen.has(a.accountNumber) && seen.add(a.accountNumber));
};

const saveValidation = validate([
  body("bank.enabled").isBoolean(),
  body("qpay.enabled").isBoolean(),
  body("qpay.sandbox").isBoolean(),
  body("delivery.enabled").optional().isBoolean(),
  body("delivery.fee").optional().isInt({ min: 0 }).withMessage("Хүргэлтийн үнэ 0-ээс багагүй бүхэл тоо байна"),
  body("bank").custom((b) => accountsOf(b).length <= MAX_SHOP_BANKS).withMessage(`Данс ${MAX_SHOP_BANKS} хүртэл байна`),
  body("bank").custom((b) => accountsOf(b).every((a) => a.bankName && a.accountName && a.accountNumber))
    .withMessage("Данс бүрт банк, дансны дугаар, хүлээн авагчийн нэрийг оруулна уу"),
  body("bank").custom((b) => accountsOf(b).every((a) => /^(MN\d{18}|\d{6,20})$/.test(a.accountNumber)))
    .withMessage("Дансны дугаар буруу байна"),
  body("bank").custom((b) => !b.enabled || accountsOf(b).length > 0).withMessage("Дор хаяж нэг данс оруулна уу"),
]);

// Захиалга үүсгэх хуудсанд — бүх нэвтэрсэн ажилтанд
router.get(
  "/delivery",
  handle("deliverySetting", async (req, res) => ok(res, toDelivery(await paymentSettings.findOne({ where: { shop_id: req.shopId } })))),
);

router.use(isAdmin);

router.get(
  "/",
  handle("paymentSetting", async (req, res) =>
    ok(res, toAdmin(await paymentSettings.findOne({ where: { shop_id: req.shopId } }), await shopBanks(req.shopId))),
  ),
);

router.put(
  "/",
  saveValidation,
  byAndAt,
  handle("savePaymentSetting", async (req, res) => {
    const { bank, qpay, delivery, by, at } = req.body;
    const existing = await paymentSettings.findOne({ where: { shop_id: req.shopId } });
    const accounts = accountsOf(bank);
    const main = accounts[0];
    const values = {
      bank_enabled: bank.enabled,
      // Эхний данс — хуучин клиент (app) эндээс уншина
      bank_name: main?.bankName || null,
      bank_account_name: main?.accountName || null,
      bank_account_number: main?.accountNumber || null,
      bank_iban: main?.iban || null,
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
    const t = await sequelize.transaction();
    let saved;
    try {
      saved = existing
        ? await existing.update(values, { transaction: t })
        : await paymentSettings.create({ shop_id: req.shopId, ...values, created_at: at }, { transaction: t });
      await shopBankAccounts.destroy({ where: { shop_id: req.shopId }, transaction: t });
      if (accounts.length)
        await shopBankAccounts.bulkCreate(
          accounts.map((a, i) => ({
            shop_id: req.shopId,
            bank_name: a.bankName,
            account_number: a.accountNumber,
            account_name: a.accountName,
            iban: a.iban,
            sort: i,
          })),
          { transaction: t },
        );
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
    return ok(res, toAdmin(saved, await shopBanks(req.shopId)));
  }),
);

module.exports = router;
