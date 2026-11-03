const router = require("express").Router();
const { paymentSettings } = require("../../models");
const { qpayReady } = require("../../helper/qpayHelper");
const { ok, handle } = require("../../helper/helper");

// Төлбөрийн хуудсанд: идэвхтэй аргууд ба дансны мэдээлэл (QPay-ийн нууц мэдээлэл ордоггүй)
router.get(
  "/methods",
  handle("paymentMethods", async (req, res) => {
    const s = await paymentSettings.findOne({ where: { shop_id: req.shopId } });
    const bank = s?.bank_enabled
      ? { bankName: s.bank_name, accountName: s.bank_account_name, accountNumber: s.bank_account_number, iban: s.bank_iban }
      : null;
    return ok(res, { bank, qpay: qpayReady(s) });
  }),
);

module.exports = router;
