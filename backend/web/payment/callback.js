const { qpayInvoices } = require("../../models");
const { checkInvoice } = require("../../helper/qpayHelper");

// QPay төлбөр орсны дараа callback_url-г дуудна (X-Shop-Id-гүй). Илгээсэн өгөгдөлд
// итгэхгүй — нэхэмжлэхийг QPay-ээс өөрөөс нь шалгаж тэмдэглэнэ.
module.exports = async (req, res) => {
  try {
    const invoice = await qpayInvoices.findOne({ where: { sender_invoice_no: req.params.no } });
    if (invoice) await checkInvoice(invoice);
  } catch (error) {
    console.log("qpayCallbackError:", error);
  }
  return res.status(200).json({ success: true });
};
