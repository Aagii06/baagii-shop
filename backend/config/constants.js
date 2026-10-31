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
  // Захиалгын хүргэлтийн төлбөр (вэб: web/src/lib/pricing.ts SHIPPING_FEE)
  deliveryFee: 6000,
  // Хөнгөлөлтийн код → хасах дүн (вэб: VALID_COUPONS)
  coupons: { UVS25: 13500 },
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
