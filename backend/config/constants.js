const constant = {
  // Админ самбарын хэрэглэгчийн эрх (users.role)
  roles: {
    admin: "ADMIN",
    // Хамтран ажиллах хүсэлт батлагдсан борлуулагч
    shopper: "SHOPPER",
  },

  // Захиалгын төлөв: pending → confirmed → delivered, эсвэл бүгдийг буцаавал returned
  orderStatuses: {
    pending: "pending",
    confirmed: "confirmed",
    delivered: "delivered",
    returned: "returned",
  },
  // Админ шилжүүлж болох төлөв (одоогийн → дараагийн)
  orderTransitions: {
    pending: ["confirmed", "returned"],
    confirmed: ["delivered", "returned"],
    delivered: ["returned"],
    returned: [],
  },
  // Дэлгүүр бүрийн (shops.id) хүргэлтийн сонголт, хөнгөлөлтийн код — вэбийн
  // web/src/lib/pricing.ts (DELIVERY_OPTIONS / SHIPPING_FEE, VALID_COUPONS)-тэй ижил байна.
  // freeAbove: дэд дүн үүнээс их бол тухайн хүргэлт үнэгүй
  shopSettings: {
    1: {
      delivery: { standard: { fee: 6000, freeAbove: null } },
      coupons: { UVS25: 13500 },
    },
    2: {
      delivery: {
        standard: { fee: 5000, freeAbove: 60000 },
        express: { fee: 8000, freeAbove: null },
        regional: { fee: 15000, freeAbove: null },
      },
      coupons: { AJRUG10: 10000, EEJ25: 22000 },
    },
  },
  paymentMethods: ["card", "qpay", "bank", "cash"],

  partnerStatuses: {
    pending: "pending",
    approved: "approved",
    rejected: "rejected",
  },

  // Бараа нэг агуулахаас зарагдана. Вэбийн сагс branchId шаарддаг тул тогтмол утга буцаана.
  defaultBranch: { id: 1, name: "Үндсэн агуулах" },

  // Категори дээд тал нь 4 түвшин, сонголт (attr) дээд тал нь 3 (admin: MAX_CATEGORY_DEPTH, MAX_ATTRS)
  maxCategoryDepth: 4,
  maxCategoryAttrs: 3,
};

module.exports = constant;
