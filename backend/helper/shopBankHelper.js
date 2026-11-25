const { shopBankAccounts } = require("../models");

// Дэлгүүрийн "Дансаар төлөх" данснууд, үндсэн нь эхэндээ.
// Хуучин хэлбэрээр ({ bankName, accountName, accountNumber, iban }) — web/app-ийн BankDetails.
const MAX_SHOP_BANKS = 5;

const toBankDetails = (b) => ({
  bankName: b.bank_name ?? "",
  accountName: b.account_name ?? "",
  accountNumber: b.account_number ?? "",
  iban: b.iban || null,
});

const shopBanks = async (shopId, transaction) =>
  (await shopBankAccounts.findAll({ where: { shop_id: shopId }, order: [["sort", "asc"], ["id", "asc"]], raw: true, transaction })).map(
    toBankDetails,
  );

module.exports = { MAX_SHOP_BANKS, shopBanks };
