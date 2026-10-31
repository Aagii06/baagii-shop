const router = require("express").Router();
const { doNotes } = require("../../models");
const { ok, handle, toIso } = require("../../helper/helper");

// Хүргэлтийн бэлэн тэмдэглэлүүд
router.get(
  "/",
  handle("doNoteList", async (req, res) => {
    const rows = await doNotes.findAll({ where: { status: "active" }, order: [["id", "asc"]], raw: true });
    return ok(res, {
      rows: rows.map((r) => ({ id: r.id, name: r.name, description: r.description, createdAt: toIso(r.created_at), updatedAt: toIso(r.updated_at ?? r.created_at) })),
      count: rows.length,
      summary: [],
    });
  }),
);

module.exports = router;
