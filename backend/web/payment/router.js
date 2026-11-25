const router = require("express").Router();
const { paymentSettings } = require("../../models");
const { qpayReady } = require("../../helper/qpayHelper");
const { shopBanks } = require("../../helper/shopBankHelper");
const { ok, handle } = require("../../helper/helper");

// Төлбөрийн хуудсанд: идэвхтэй аргууд ба дансны мэдээлэл (QPay-ийн нууц мэдээлэл ордоггүй).
// banks — бүх данс (5 хүртэл, үндсэн нь эхэндээ); bank — эхнийх нь (хуучин app-д).
router.get(
  "/methods",
  handle("paymentMethods", async (req, res) => {
    const s = await paymentSettings.findOne({ where: { shop_id: req.shopId } });
    const banks = s?.bank_enabled ? await shopBanks(req.shopId) : [];
    return ok(res, { bank: banks[0] ?? null, banks, qpay: qpayReady(s) });
  }),
);

module.exports = router;
