// API-ийн тайлбар (Swagger UI: /api/doc). Route нэмэх, өөрчлөхдөө энд мөн засна.

// Бүх хариу { success, message, data } хэлбэртэй, HTTP 200 (helper/helper.js)
const reply = (description = "Амжилттай", data = {}) => ({
  200: {
    description,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: { success: { type: "boolean", example: true }, message: { type: "string", example: "Амжилттай" }, data },
        },
      },
    },
  },
});
const listData = (items = {}) => ({ type: "object", properties: { rows: { type: "array", items }, count: { type: "integer" }, summary: { type: "array" } } });

const json = (properties, required = []) => ({
  required: true,
  content: { "application/json": { schema: { type: "object", required, properties } } },
});
const str = (example, description) => ({ type: "string", example, description });
const num = (example, description) => ({ type: "integer", example, description });

const idParam = (description = "id") => ({ name: "id", in: "path", required: true, schema: { type: "integer" }, description });
const query = (name, description, example) => ({ name, in: "query", schema: { type: "string" }, description, example });

const admin = [{ adminToken: [] }];
const web = [{ webToken: [] }];

// Admin жагсаалтын нийтлэг query (middleware/base.js: list)
const listQuery = [
  query("take", "Хэдэн мөр авах (анхдагч 2000)", "20"),
  query("skip", "Хэдэн мөр алгасах", "0"),
  query("filter", "JSON шүүлтүүр", '["name","contains","цамц"]'),
  query("sort", "JSON эрэмбэ", '[{"selector":"id","desc":true}]'),
];

const op = (tag, summary, extra = {}) => ({ tags: [tag], summary, responses: reply(), ...extra });

const product = {
  name: str("Цамц"),
  categoryId: num(1),
  title: str("Хөвөн цамц"),
  description: str("Барааны тайлбар"),
  price: { type: "number", example: 45000 },
  mainPrice: { type: "number", example: 50000, description: "Хямдралаас өмнөх үнэ" },
  images: { type: "array", items: { type: "string" }, description: "/api/file/upload-ийн буцаасан id-ууд" },
  isActive: { type: "boolean", description: "Вэбэд нийтлэх эсэх" },
  attrs: { type: "array", items: { type: "object" }, description: "Сонголтууд (өнгө, хэмжээ) ба утгууд" },
  variants: {
    type: "array",
    description: "Хувилбар бүр (өнгө/хэмжээний хослол)",
    items: { type: "object", properties: { attr: { type: "array", items: { type: "object" } }, price: { type: "number" }, remain: { type: "integer" } } },
  },
};

const shippingInfo = {
  type: "object",
  required: ["fullName", "phone", "address"],
  properties: {
    fullName: str("Бат"),
    phone: str("95001122"),
    extraPhone: str("80011223"),
    email: str("bat@example.com"),
    address: str("3-р хороо, 12-р байр"),
    addressLabel: str("Гэр"),
    addressTypeId: num(1),
    cityId: num(1),
    districtId: num(2),
    subDistrictId: num(3),
    note: str("Орой 18 цагаас хойш"),
  },
};

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "UVS shop API",
    version: "1.0.0",
    description:
      "Бүх хариу `{ success, message, data }` хэлбэртэй, HTTP 200. Алдаа гарвал `success: false`, шалтгаан нь `message`-д.\n\n" +
      "- **/api/** нь admin самбарт зориулсан. `/api/auth/login`-оос авсан токеноор нэвтэрнэ (**adminToken**).\n" +
      "- **/web/** нь дэлгүүрийн вэбэд зориулсан. `/web/auth/loginGuest`-оос зочны токен авна. Утас + кодоор нэвтэрвэл худалдан авагчийн токен болно (**webToken**).\n" +
      "- **/file/** нь зураг. Нийтэд нээлттэй.",
  },
  servers: [{ url: "/", description: "Энэ сервер" }],
  components: {
    securitySchemes: {
      adminToken: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "/api/auth/login → data.token" },
      webToken: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "/web/auth/loginGuest эсвэл /web/auth/verifyOtp → data.token" },
    },
  },
  tags: [
    { name: "Admin: Нэвтрэх" },
    { name: "Admin: Бараа" },
    { name: "Admin: Категори" },
    { name: "Admin: Сонголт (attr)" },
    { name: "Admin: Захиалга" },
    { name: "Admin: Хамтрагч", description: "Зөвхөн ADMIN эрхтэй" },
    { name: "Admin: Бусад" },
    { name: "Web: Нэвтрэх" },
    { name: "Web: Каталог" },
    { name: "Web: Хаяг" },
    { name: "Web: Сагс", description: "Зочны эсвэл худалдан авагчийн токен" },
    { name: "Web: Захиалга", description: "Утсаар нэвтэрсэн байх ёстой" },
    { name: "Зураг" },
  ],
  paths: {
    // ───────── Admin ─────────
    "/api/auth/login": {
      post: op("Admin: Нэвтрэх", "Нэвтрэх", {
        requestBody: json({ userName: str("admin"), password: str("******") }, ["userName", "password"]),
        responses: reply("Токен ба хэрэглэгч", { type: "object", properties: { token: { type: "string" }, user: { type: "object" } } }),
      }),
    },
    "/api/auth/getUserData": { get: op("Admin: Нэвтрэх", "Нэвтэрсэн хэрэглэгчийн мэдээлэл", { security: admin }) },

    "/api/product": {
      get: op("Admin: Бараа", "Барааны жагсаалт", { security: admin, parameters: listQuery, responses: reply("Жагсаалт", listData()) }),
      post: op("Admin: Бараа", "Бараа нэмэх", { security: admin, requestBody: json(product, ["name"]) }),
    },
    "/api/product/{id}": {
      get: op("Admin: Бараа", "Нэг бараа", { security: admin, parameters: [idParam()] }),
      put: op("Admin: Бараа", "Бараа засах", { security: admin, parameters: [idParam()], requestBody: json(product, ["name"]) }),
      delete: op("Admin: Бараа", "Бараа устгах (хуучин захиалгад нэр, үнэ хэвээр үлдэнэ)", { security: admin, parameters: [idParam()] }),
    },

    "/api/category/tree": { get: op("Admin: Категори", "Категорийн мод", { security: admin }) },
    "/api/category": {
      post: op("Admin: Категори", "Категори нэмэх", {
        security: admin,
        requestBody: json({ name: str("Хувцас"), parentId: num(null, "Эцэг категори"), code: str("CLOTH"), image: str(""), attrIds: { type: "array", items: { type: "integer" } } }, ["name"]),
      }),
    },
    "/api/category/{id}": {
      put: op("Admin: Категори", "Категори засах", {
        security: admin,
        parameters: [idParam()],
        requestBody: json({ name: str("Хувцас"), parentId: num(null), attrIds: { type: "array", items: { type: "integer" } } }, ["name"]),
      }),
      delete: op("Admin: Категори", "Категори устгах (дэд категоригүй байх ёстой)", { security: admin, parameters: [idParam()] }),
    },

    "/api/attr": {
      get: op("Admin: Сонголт (attr)", "Сонголтын жагсаалт (өнгө, хэмжээ, …)", { security: admin, parameters: listQuery, responses: reply("Жагсаалт", listData()) }),
      post: op("Admin: Сонголт (attr)", "Сонголт нэмэх", {
        security: admin,
        requestBody: json(
          {
            name: str("Өнгө"),
            code: str("COLOR"),
            shortName: str("Өнгө"),
            attrValueTypeId: str("select"),
            attrValues: { type: "array", items: { type: "object", properties: { id: num(), code: str(), name: str("Улаан") } } },
          },
          ["name"],
        ),
      }),
    },
    "/api/attr/{id}": {
      get: op("Admin: Сонголт (attr)", "Нэг сонголт", { security: admin, parameters: [idParam()] }),
      put: op("Admin: Сонголт (attr)", "Сонголт засах", { security: admin, parameters: [idParam()], requestBody: json({ name: str("Өнгө"), attrValues: { type: "array", items: { type: "object" } } }, ["name"]) }),
      delete: op("Admin: Сонголт (attr)", "Сонголт устгах", { security: admin, parameters: [idParam()] }),
    },

    "/api/order": {
      get: op("Admin: Захиалга", "Захиалгын жагсаалт", { security: admin, responses: reply("Жагсаалт", listData()) }),
      post: op("Admin: Захиалга", "Худалдан авагчийн өмнөөс захиалга үүсгэх", {
        security: admin,
        requestBody: json({
          customer: { type: "object", properties: { name: str("Бат"), phone: str("95001122"), address: str("3-р хороо") } },
          items: { type: "array", items: { type: "object", properties: { variantId: num(1), qty: num(2), price: { type: "number", example: 45000 } } } },
          deliveryFee: { type: "number", example: 6000 },
        }),
      }),
    },
    "/api/order/sales": {
      get: op("Admin: Захиалга", "Борлуулалтын тайлан", { security: admin, parameters: [query("range", "today | yesterday | week | month", "today")] }),
    },
    "/api/order/{id}": { get: op("Admin: Захиалга", "Нэг захиалга", { security: admin, parameters: [idParam()] }) },
    "/api/order/{id}/status": {
      put: op("Admin: Захиалга", "Төлөв солих: pending → confirmed → delivered, аль ч шатнаас returned", {
        security: admin,
        parameters: [idParam()],
        requestBody: json({ status: { type: "string", enum: ["confirmed", "delivered", "returned"] } }, ["status"]),
      }),
    },
    "/api/order/{id}/return": {
      post: op("Admin: Захиалга", "Нэг мөрөөс бараа буцаах (үлдэгдэлд нэмэгдэнэ)", {
        security: admin,
        parameters: [idParam()],
        requestBody: json({ itemId: num(1, "Захиалгын мөрийн id"), qty: num(1) }, ["itemId", "qty"]),
      }),
    },

    "/api/partnerRequest": {
      get: op("Admin: Хамтрагч", "Хамтран ажиллах хүсэлтүүд", { security: admin, responses: reply("Жагсаалт", listData()) }),
      post: op("Admin: Хамтрагч", "Дугаараар шууд борлуулагч нэмэх", { security: admin, requestBody: json({ phone: str("95001122") }, ["phone"]) }),
    },
    "/api/partnerRequest/{id}/approve": { post: op("Admin: Хамтрагч", "Хүсэлт батлах (борлуулагч хэрэглэгч үүснэ)", { security: admin, parameters: [idParam()] }) },
    "/api/partnerRequest/{id}/reject": { post: op("Admin: Хамтрагч", "Хүсэлт татгалзах", { security: admin, parameters: [idParam()] }) },

    "/api/file/upload": {
      post: op("Admin: Бусад", "Барааны зураг хуулах (PNG, JPG, WEBP, GIF, SVG, 20MB хүртэл)", {
        security: admin,
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } },
        },
        responses: reply("Зургийн id", { type: "object", properties: { id: { type: "string" } } }),
      }),
    },
    "/api/doNote": { get: op("Admin: Бусад", "Хүргэлтийн бэлэн тэмдэглэлүүд", { security: admin, responses: reply("Жагсаалт", listData()) }) },

    // ───────── Web ─────────
    "/web/auth/loginGuest": {
      post: op("Web: Нэвтрэх", "Зочны токен авах", { responses: reply("Токен", { type: "object", properties: { token: { type: "string" }, guestId: { type: "string" } } }) }),
    },
    "/web/auth/getUserData": { get: op("Web: Нэвтрэх", "Зочин бол {}, худалдан авагч бол { customer }", { security: web }) },
    "/web/auth/sendOtp": { post: op("Web: Нэвтрэх", "Утас руу нэвтрэх код илгээх", { requestBody: json({ phone: str("95001122") }, ["phone"]) }) },
    "/web/auth/verifyOtp": {
      post: op("Web: Нэвтрэх", "Кодоор нэвтрэх (зочны сагс худалдан авагчид шилжинэ)", {
        security: web,
        requestBody: json({ phone: str("95001122"), code: str("2222") }, ["phone", "code"]),
      }),
    },
    "/web/auth/me": { put: op("Web: Нэвтрэх", "Нэрээ солих", { security: web, requestBody: json({ name: str("Бат") }, ["name"]) }) },
    "/web/auth/register": { post: op("Web: Нэвтрэх", "Хамтран ажиллах хүсэлт илгээх (/seller)", { requestBody: json({ userName: str("95001122", "Утасны дугаар") }, ["userName"]) }) },

    "/web/category/getCategoryTree": { get: op("Web: Каталог", "Категорийн мод") },
    "/web/post": {
      get: op("Web: Каталог", "Нийтэлсэн барааны жагсаалт", {
        parameters: [query("categoryId", "Категори"), query("search", "Нэрээр хайх"), query("page", "Хуудас", "1"), query("limit", "Нэг хуудсанд (1000 хүртэл)", "20")],
        responses: reply("Жагсаалт", listData()),
      }),
    },
    "/web/post/{id}": { get: op("Web: Каталог", "Барааны дэлгэрэнгүй", { parameters: [idParam()] }) },

    "/web/customerAddress/addressTypes": { get: op("Web: Хаяг", "Хаягийн төрөл (Гэр, Ажил, …)", { responses: reply("Жагсаалт", listData()) }) },
    "/web/customerAddress/cities": { get: op("Web: Хаяг", "Аймаг / Нийслэл", { responses: reply("Жагсаалт", listData()) }) },
    "/web/customerAddress/districts": {
      get: op("Web: Хаяг", "Сум / Дүүрэг", { parameters: [{ ...query("cityId", "Аймаг / Нийслэлийн id", "1"), required: true }], responses: reply("Жагсаалт", listData()) }),
    },
    "/web/customerAddress/subDistricts": {
      get: op("Web: Хаяг", "Баг / Хороо", { parameters: [{ ...query("districtId", "Сум / Дүүргийн id"), required: true }], responses: reply("Жагсаалт", listData()) }),
    },

    "/web/cart/getActiveCarts": { get: op("Web: Сагс", "Идэвхтэй сагс (зарагдахаа больсон бараа автоматаар хасагдана)", { security: web, responses: reply("Жагсаалт", listData()) }) },
    "/web/cart/getCartsProductCnt": { get: op("Web: Сагс", "Сагсан дахь барааны нийт тоо", { security: web, responses: reply("Тоо", { type: "integer" }) }) },
    "/web/cart/addProduct": {
      post: op("Web: Сагс", "Сагсанд нэмэх / тоо солих (qty: 0 бол хасна)", {
        security: web,
        requestBody: json({ postProductId: num(1, "Хувилбарын id"), qty: num(2, "Шинэ нийт тоо") }, ["postProductId", "qty"]),
      }),
    },
    "/web/cart/{id}": { delete: op("Web: Сагс", "Сагсыг хоослох", { security: web, parameters: [idParam("Сагсны id")] }) },

    "/web/order": {
      get: op("Web: Захиалга", "Миний захиалгууд", { security: web, responses: reply("Жагсаалт", listData()) }),
      post: op("Web: Захиалга", "Сагснаас захиалга үүсгэх (үнэ, хүргэлт, хөнгөлөлтийг backend тооцно)", {
        security: web,
        requestBody: json({ shippingInfo, couponCode: str("UVS25") }, ["shippingInfo"]),
      }),
    },
    "/web/order/{id}": { get: op("Web: Захиалга", "Нэг захиалга", { security: web, parameters: [idParam()] }) },
    "/web/order/{id}/pay": {
      post: op("Web: Захиалга", "Төлбөр тэмдэглэх (төлбөрийн сервис холбогдоогүй)", {
        security: web,
        parameters: [idParam()],
        requestBody: json({ paymentMethod: { type: "string", enum: ["card", "qpay", "bank", "cash"] } }, ["paymentMethod"]),
      }),
    },

    // ───────── Зураг ─────────
    "/file/{name}": {
      get: {
        tags: ["Зураг"],
        summary: "Эх зураг",
        parameters: [{ name: "name", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Зураг" }, 404: { description: "Олдсонгүй" } },
      },
    },
    "/file/thumbnail/{name}": {
      get: {
        tags: ["Зураг"],
        summary: "Жижиг зураг (байхгүй бол эх зураг)",
        parameters: [{ name: "name", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Зураг" }, 404: { description: "Олдсонгүй" } },
      },
    },
  },
};
