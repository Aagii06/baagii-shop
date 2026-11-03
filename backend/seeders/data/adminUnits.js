const units = require("./mongolia_admin_units.json");

// ҮСХ-ны засаг захиргааны нэгж (aimag → soum → bag) → locations (city → district → subDistrict).
// Нийслэл эхэнд, аймаг/сум цагаан толгойн дарааллаар, баг/хороо дугаараар.
const levels = { aimag: "city", soum: "district", bag: "subDistrict" };
const byName = (a, b) => a.name.localeCompare(b.name, "mn");
const byNumber = (a, b) => (a.number ?? Infinity) - (b.number ?? Infinity) || byName(a, b);
const sorters = {
  aimag: (a, b) => (b.type === "capital") - (a.type === "capital") || byName(a, b),
  soum: byName,
  bag: byNumber,
};

async function insertLocations(queryInterface, transaction) {
  const ids = {};
  for (const level of ["aimag", "soum", "bag"]) {
    const rows = units.filter((u) => u.level === level);
    const groups = {};
    rows.forEach((u) => (groups[u.parent_code ?? ""] ||= []).push(u));
    const data = Object.values(groups).flatMap((g) =>
      g.sort(sorters[level]).map((u, i) => ({
        parent_id: u.parent_code ? ids[u.parent_code] : null,
        level: levels[level],
        code: u.code,
        name: u.name,
        sort_order: i,
      })),
    );
    await queryInterface.bulkInsert("locations", data, { transaction });
    const [inserted] = await queryInterface.sequelize.query("SELECT id, code FROM locations WHERE level = ?", {
      replacements: [levels[level]],
      transaction,
    });
    inserted.forEach((r) => (ids[r.code] = r.id));
  }
}

module.exports = { insertLocations };
