const router = require("express").Router();
const { locations, addressTypes } = require("../../models");
const { ok, fail, handle } = require("../../helper/helper");

// Хаягийн төрөл (Гэр, Ажил, …) ба Аймаг/Нийслэл → Сум/Дүүрэг → Баг/Хороо
const list = (res, rows) => ok(res, { rows, count: rows.length, summary: [] });
const areas = (where) =>
  locations.findAll({ where, attributes: ["id", "code", "name"], order: [["sort_order", "asc"], ["id", "asc"]], raw: true });

router.get(
  "/addressTypes",
  handle("addressTypes", async (req, res) =>
    list(res, await addressTypes.findAll({ attributes: ["id", "code", "name", "style", "icon"], order: [["sort_order", "asc"]], raw: true })),
  ),
);
router.get("/cities", handle("cities", async (req, res) => list(res, await areas({ level: "city" }))));
router.get(
  "/districts",
  handle("districts", async (req, res) => {
    if (!req.query.cityId) return fail(res, "Хот сонгоно уу");
    return list(res, await areas({ level: "district", parent_id: Number(req.query.cityId) }));
  }),
);
router.get(
  "/subDistricts",
  handle("subDistricts", async (req, res) => {
    if (!req.query.districtId) return fail(res, "Дүүрэг сонгоно уу");
    return list(res, await areas({ level: "subDistrict", parent_id: Number(req.query.districtId) }));
  }),
);

module.exports = router;
