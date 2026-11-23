"use strict";

// Ajrug-ийн 50 жишээ бараа (хувилбар — хэмжээ × өнгө), seed-ajrug-categories-ийн
// дараа ажиллуулна. Зураг нь Unsplash-ийн үнэгүй (Unsplash License) зургийн CDN
// холбоос — вэб, апп, admin-ы fileUrl https холбоосыг шууд харуулна.
//
// Ajrug-д идэвхтэй бараа байвал юу ч хийхгүй (давхардахгүй); `down` нь зөвхөн
// энэ seeder-ийн үүсгэсэн барааг (created_at = AT) устгана.
//   npx sequelize-cli db:seed --seed 20261123000007-seed-ajrug-sample-products.js

const AT = "2026-11-23 00:00:07";
const DATE = "2026-11-23";
const SHOP_CODE = "ajrug";

const img = (id) => `https://images.unsplash.com/${id}?w=900&h=900&fit=crop&q=80`;
const IMG = {
  teeWhite: img("photo-1649318099944-dcda031180ed"),
  teeBlue: img("photo-1601127954825-cf21c1346ce1"),
  teeFlat: img("photo-1622290291720-ac961c43ee30"),
  teeGreen: img("photo-1602863211757-cfe6454947fe"),
  plaid: img("photo-1604303768345-038b79a8c47a"),
  sweaters: img("photo-1541580621-cb65cc53084b"),
  hoodie: img("photo-1542319272-42dba4f554be"),
  jeans: img("photo-1607289053334-f63fa3b3d418"),
  dressRed: img("photo-1578897367107-2828e351c8a8"),
  dressWhite: img("photo-1786189667100-6a137fa49cc6"),
  snowsuit: img("photo-1699516781997-21beee06a67f"),
  bear: img("photo-1522771930-78848d9293e8"),
  pufferTeal: img("photo-1695263747144-a52aa3739d62"),
  snowBlue: img("photo-1675833366391-582bb70c347c"),
  pufferGrey: img("photo-1606946185142-7b30e9a7abcc"),
  pajama: img("photo-1634188157846-c6e3bdf99420"),
  rackDresses: img("photo-1566454544259-f4b94c3d758c"),
  store: img("photo-1760287363879-6012adab292c"),
  babyShoes: img("photo-1624958797025-b119e2fa2b53"),
  sneakers: img("photo-1636130748629-655be0c60041"),
  rainboots: img("photo-1554995783-571a2b4d923a"),
  knitHat: img("photo-1649491069057-6ef542023360"),
  knitBeanie: img("photo-1544967919-44c1ef2f9e7a"),
  babyHat: img("photo-1546015720-b8b30df5aa27"),
  sunglasses: img("photo-1590995385808-7eb142fde16a"),
  onesie: img("photo-1622290319146-7b63df48a635"),
  drying: img("photo-1760727772969-cb5cd59c6f30"),
};

const range = (from, to, step = 6) => {
  const out = [];
  for (let v = from; v <= to; v += step) out.push(String(v));
  return out;
};
const shoes = (from, to) => range(from, to, 1);

// [ангиллын slug, нэр, үнэ, хямдралын өмнөх үнэ | null, хэмжээнүүд, өнгөнүүд, зураг, тайлбар]
const PRODUCTS = [
  ["podvolk", "Хөвөн подволк — цагаан", 19900, null, range(98, 122), ["Цагаан"], IMG.teeWhite, "Өдөр бүр өмсөхөд тохиромжтой, зөөлөн хөвөн подволк."],
  ["podvolk", "Хэвлэмэл подволк", 22900, null, range(104, 128), ["Цэнхэр", "Хөх"], IMG.teeBlue, "Тод хээтэй, агаар нэвтрүүлдэг хөвөн подволк."],
  ["podvolk", "Энгийн подволк (2 ширхэг)", 29900, 34900, range(92, 110), ["Цагаан"], IMG.teeFlat, "Хоёр ширхэгтэй багц, бяцхан үрсийн арьсанд зөөлөн."],
  ["tsamts", "Алаг цамц", 39900, null, range(110, 134), ["Улаан"], IMG.plaid, "Сонгодог алаг хээтэй, товчтой цамц."],
  ["tsamts", "Сургуулийн цагаан цамц", 34900, null, range(122, 152), ["Цагаан"], IMG.store, "Сургуульд өмсөхөд тохирох, индүүдэхэд хялбар цамц."],
  ["sviter", "Ноосон свитер", 59900, 69900, range(98, 122), ["Ногоон", "Бор"], IMG.sweaters, "Хүйтэн өдрүүдэд дулаан байлгах ноосон свитер."],
  ["sviter", "Зөөлөн трикотаж свитер", 45900, null, range(110, 134), ["Саарал"], IMG.sweaters, "Хөнгөн, зөөлөн трикотаж — давхарлаж өмсөхөд тохиромжтой."],
  ["hudi", "Худи — саарал", 49900, null, range(104, 128), ["Саарал", "Хар"], IMG.hoodie, "Малгайтай, урд халаастай дулаан худи."],
  ["hudi", "Флис худи", 54900, null, range(116, 146), ["Хөх"], IMG.hoodie, "Дотроо флистэй, дулаан бөгөөд хөнгөн худи."],
  ["hantaaz", "Сүлжмэл хантааз", 39900, null, range(104, 128), ["Бор"], IMG.sweaters, "Цамцан дээгүүр өмсөх сүлжмэл хантааз."],
  ["umd", "Хөвөн өмд", 29900, null, range(98, 122), ["Хар", "Саарал"], IMG.jeans, "Уян бүстэй, хөдөлгөөнд саадгүй хөвөн өмд."],
  ["jinsen-umd", "Жинсэн өмд", 44900, null, range(104, 140), ["Хөх"], IMG.jeans, "Бат бөх, уян жинсэн өмд — тохируулдаг бүстэй."],
  ["short", "Зуны шорт", 19900, 24900, range(98, 122), ["Цэнхэр"], IMG.teeBlue, "Халуун өдрүүдэд зориулсан хөнгөн шорт."],
  ["yubka", "Тюль юбка", 32900, null, range(98, 122), ["Ягаан"], IMG.dressWhite, "Давхар тюльтэй, баярын хөөрхөн юбка."],
  ["leggins", "Леггинс", 17900, null, range(92, 122), ["Саарал", "Хар"], IMG.teeWhite, "Уян, сунадаг леггинс — өдөр тутамд."],
  ["daashinz", "Улаан баярын даашинз", 79900, null, range(104, 134), ["Улаан"], IMG.dressRed, "Баяр ёслол, төрсөн өдөрт өмсөх гоёлын даашинз."],
  ["daashinz", "Цагаан хөвөн даашинз", 49900, 59900, range(92, 116), ["Цагаан"], IMG.dressWhite, "Зуны хөнгөн, хөвөн даашинз."],
  ["daashinz", "Цэцэгтэй даашинз", 54900, null, range(98, 128), ["Ягаан"], IMG.rackDresses, "Цэцэгт хээтэй, эвтэйхэн даашинз."],
  ["kombinezon", "Баавгай комбинезон", 59900, null, range(92, 104), ["Бор"], IMG.bear, "Чихтэй малгайтай, хөвсгөр баавгай комбинезон."],
  ["kombinezon", "Өвлийн комбинезон", 129900, 149900, range(92, 116), ["Шар"], IMG.snowsuit, "Салхи, цаснаас хамгаалах дулаан комбинезон."],
  ["kurtka", "Хаврын куртка", 89900, null, range(104, 134), ["Ногоон"], IMG.pufferTeal, "Хавар намрын сэрүүн өдрүүдэд тохирох куртка."],
  ["palto", "Ноосон пальто", 119900, null, range(110, 140), ["Саарал"], IMG.store, "Сонгодог загварын ноосон пальто."],
  ["uvliin-kurtka", "Өвлийн хөвсгөр куртка", 149900, 179900, range(98, 128), ["Хөх", "Цэнхэр"], IMG.snowBlue, "Малгайтай, дулаан дүүргэлттэй өвлийн куртка."],
  ["uvliin-kurtka", "Дулаан куртка — саарал", 139900, null, range(92, 116), ["Саарал"], IMG.pufferGrey, "Хүйтэнд дулаан, хөнгөн өвлийн куртка."],
  ["tsuvnii-kurtka", "Цувны куртка", 69900, null, range(104, 128), ["Шар"], IMG.rainboots, "Ус нэвтрүүлдэггүй, малгайтай цувны куртка."],
  ["pijama", "Хөвөн пижама", 34900, null, range(98, 134), ["Хөх"], IMG.pajama, "Зөөлөн хөвөн, тав тухтай унтлагын хувцас."],
  ["pijama", "Цэцэгтэй пижама", 34900, 39900, range(98, 128), ["Ягаан"], IMG.pajama, "Хээтэй, зөөлөн пижама."],
  ["halaad", "Зөөлөн халаад", 42900, null, range(104, 134), ["Ягаан"], IMG.drying, "Усанд орсны дараа өмсөх зөөлөн халаад."],
  ["dotuur", "Хөвөн дотуур хувцас (3 ширхэг)", 24900, null, range(92, 128), ["Цагаан"], IMG.drying, "Гурван ширхэгтэй багц, байгалийн хөвөн."],
  ["oims", "Өнгөлөг оймс (5 хос)", 14900, null, range(98, 128), ["Цагаан"], IMG.sneakers, "Таван хос өнгөлөг оймсны багц."],
  ["duremt-huvtsas", "Сургуулийн дүрэмт хувцас", 99900, null, range(122, 152), ["Хөх"], IMG.plaid, "Сургуулийн шаардлагад нийцсэн дүрэмт хувцас."],
  ["pidjak", "Хүүгийн пиджак", 79900, null, range(116, 146), ["Хар"], IMG.plaid, "Баяр, сургуульд өмсөх гоёлын пиджак."],
  ["sport-kostyum", "Спорт костюм", 64900, 74900, range(104, 140), ["Саарал"], IMG.hoodie, "Цахилгаан товчтой цамц, өмд бүхий спорт костюм."],
  ["usnii-huvtsas", "Усны хувцас", 29900, null, range(98, 128), ["Цэнхэр", "Ягаан"], IMG.sunglasses, "Усан бассейн, далайд зориулсан усны хувцас."],
  ["puuz", "Хүүхдийн пүүз", 59900, null, shoes(26, 33), ["Цагаан"], IMG.sneakers, "Хөнгөн, уян ултай өдөр тутмын пүүз."],
  ["puuz", "Нярайн зөөлөн пүүз", 34900, null, shoes(22, 25), ["Цэнхэр"], IMG.babyShoes, "Анхны алхамд зориулсан зөөлөн ултай пүүз."],
  ["gutal-engiin", "Резин гутал", 39900, null, shoes(24, 30), ["Шар"], IMG.rainboots, "Бороо, шавар шалбаагт зориулсан резин гутал."],
  ["gutal-engiin", "Улаан гутал", 49900, null, shoes(24, 30), ["Улаан"], IMG.dressWhite, "Тод улаан, урт түрийтэй гутал."],
  ["uvliin-gutal", "Өвлийн дулаан гутал", 89900, 99900, shoes(26, 34), ["Хар"], IMG.snowsuit, "Дотроо дулаалгатай, гулгадаггүй ултай өвлийн гутал."],
  ["shaahai", "Зуны шаахай", 24900, null, shoes(24, 33), ["Цэнхэр"], IMG.sunglasses, "Хөнгөн, хурдан хатдаг зуны шаахай."],
  ["malgai", "Сүлжмэл малгай", 24900, null, null, ["Бор"], IMG.knitHat, "Гар сүлжмэл хэв маягийн дулаан малгай."],
  ["malgai", "Нярайн чихтэй малгай", 19900, null, null, ["Саарал"], IMG.babyHat, "Хөөрхөн чихтэй, зөөлөн нярайн малгай."],
  ["oroolt", "Ноосон ороолт", 22900, null, null, ["Саарал"], IMG.knitBeanie, "Хүзүүгээ дулаан байлгах зөөлөн ороолт."],
  ["beelii", "Дулаан бээлий", 16900, null, null, ["Улаан"], IMG.snowsuit, "Цасанд тоглоход зориулсан дулаан бээлий."],
  ["tsunh", "Хүүхдийн цүнх", 39900, null, null, ["Хөх"], IMG.store, "Цэцэрлэг, сургуульд авч явах хөнгөн цүнх."],
  ["usnii-chimeglel", "Үсний чимэглэлийн багц", 9900, null, null, ["Ягаан"], IMG.sunglasses, "Үсний тууз, хавчаарын өнгөлөг багц."],
  ["bodi", "Хөвөн боди", 19900, null, ["56", "62", "68", "74", "80"], ["Цагаан"], IMG.onesie, "Товчоор тайлж өмсгөхөд хялбар хөвөн боди."],
  ["slip", "Баавгайтай слип", 34900, 39900, ["62", "68", "74", "80", "86"], ["Бор"], IMG.bear, "Хөлтэй, зөөлөн нярайн слип."],
  ["nyarain-bagts", "Нярайн 5 ширхэг багц", 69900, null, ["56", "62", "68"], ["Цагаан"], IMG.teeFlat, "Төрөх үеийн бэлтгэлд зориулсан 5 ширхэг хувцасны багц."],
  ["ulgii", "Хөвөн өлгий", 44900, null, ["56"], ["Цагаан"], IMG.drying, "Нярайг ороох зөөлөн хөвөн өлгий."],
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  PRODUCTS,

  async up(queryInterface) {
    const query = (sql, replacements = []) => queryInterface.sequelize.query(sql, { replacements });
    const [[shop]] = await query("SELECT id FROM shops WHERE code = ?", [SHOP_CODE]);
    if (!shop) return;
    const shop_id = shop.id;
    const [[{ cnt }]] = await query("SELECT COUNT(*) AS cnt FROM products WHERE shop_id = ? AND status = 'active'", [shop_id]);
    if (cnt > 0) {
      console.log(`Ajrug-д ${cnt} бараа байгаа тул алгаслаа.`);
      return;
    }

    // Ангилал (slug → id) ба тэдгээрийн хувилбарын сонголтууд (дарааллаар)
    const [cats] = await query("SELECT id, code FROM categories WHERE shop_id = ? AND status = 'active'", [shop_id]);
    const catId = new Map(cats.map((c) => [c.code, c.id]));
    const [links] = await query(
      `SELECT ca.category_id, a.id AS attr_id, a.name AS attr_name, ca.order_number
         FROM categoryAttrs ca JOIN attrs a ON a.id = ca.attr_id AND a.status = 'active'
        WHERE ca.category_id IN (?) ORDER BY ca.order_number`,
      [cats.map((c) => c.id)],
    );
    const [values] = await query(
      "SELECT av.id, av.attr_id, av.name, av.color FROM attrValues av JOIN attrs a ON a.id = av.attr_id WHERE a.shop_id = ? AND av.status = 'active'",
      [shop_id],
    );
    const valueOf = (attrId, name) => values.find((v) => v.attr_id === attrId && v.name === name);

    const t = await queryInterface.sequelize.transaction();
    const q = (sql, replacements = []) => queryInterface.sequelize.query(sql, { replacements, transaction: t });
    const insertId = async (table, row) => {
      const cols = Object.keys(row);
      const [id] = await q(
        `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
        cols.map((c) => (row[c] !== null && typeof row[c] === "object" ? JSON.stringify(row[c]) : row[c])),
      );
      return id;
    };

    try {
      for (const [index, [slug, name, price, original, sizes, colors, image, description]] of PRODUCTS.entries()) {
        const category_id = catId.get(slug);
        if (!category_id) throw new Error(`Ангилал олдсонгүй: ${slug}`);
        const catAttrs = links.filter((l) => l.category_id === category_id);
        // Сонголт бүрийн утгууд: хэмжээний attr → sizes, өнгө → colors
        const axes = catAttrs
          .map((l) => ({ ...l, picks: /өнгө/i.test(l.attr_name) ? colors : sizes }))
          .filter((a) => Array.isArray(a.picks) && a.picks.length > 0);

        const attrs = axes.map((a, i) => ({
          attrId: a.attr_id,
          attrName: a.attr_name,
          viewType: /өнгө/i.test(a.attr_name) ? "image" : "text",
          orderNumber: i,
          values: a.picks.map((value, j) => {
            const v = valueOf(a.attr_id, value);
            return { attrValueId: v?.id ?? null, value, color: v?.color ?? null, image: null, images: [], orderNumber: j };
          }),
        }));

        // Хэмжээ × өнгөний бүх хослол
        let combos = [[]];
        for (const a of axes) combos = combos.flatMap((c) => a.picks.map((value) => [...c, { a, value }]));

        const main_price = original ?? price;
        const variants = combos.map((combo, j) => ({
          name: combo.length ? combo.map((x) => x.value).join(" / ") : name,
          qty: ((index * 7 + j * 3) % 11) + 3,
          attr: combo.map(({ a, value }) => ({
            attrId: a.attr_id,
            attrName: a.attr_name,
            value,
            color: valueOf(a.attr_id, value)?.color ?? null,
            image: null,
          })),
        }));

        const product_id = await insertId("products", {
          shop_id,
          store_id: null,
          category_id,
          date: DATE,
          name,
          title: null,
          description,
          images: [image],
          attrs,
          qty: variants.reduce((s, v) => s + v.qty, 0),
          main_price,
          price,
          sale_start: null,
          sale_end: null,
          is_active: true,
          status: "active",
          created_at: AT,
        });
        for (const [j, v] of variants.entries()) {
          await insertId("productVariants", {
            product_id,
            code: null,
            name: v.name,
            main_price,
            price,
            qty: v.qty,
            remain: v.qty,
            attr: v.attr,
            order_number: j,
            status: "active",
            created_at: AT,
          });
        }
      }
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const query = (sql, replacements = []) => queryInterface.sequelize.query(sql, { replacements });
    const [[shop]] = await query("SELECT id FROM shops WHERE code = ?", [SHOP_CODE]);
    if (!shop) return;
    await query(
      "DELETE v FROM productVariants v JOIN products p ON p.id = v.product_id WHERE p.shop_id = ? AND p.created_at = ?",
      [shop.id, AT],
    );
    await query("DELETE FROM products WHERE shop_id = ? AND created_at = ?", [shop.id, AT]);
  },
};
