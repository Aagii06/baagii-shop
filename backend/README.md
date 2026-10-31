# UVS shop backend

Олон дэлгүүрийн нэг backend: GOLDEN UVS (`../admin`, `../web`) болон Ajrug
(`../../AjrugShop/admin`, `web`) бүгд үүнийг ашиглана. Бүтэц нь
`BaagiiCar/backend`-тэй ижил: Express + Sequelize (MySQL), migration / seeder нь
sequelize-cli.

## Дэлгүүрүүд

Frontend бүр `.env`-ийн `NEXT_PUBLIC_SHOP_ID`-аа хүсэлт бүрийн `X-Shop-Id`
толгойд илгээнэ (`middleware/shop.js`). Толгойгүй / мэдэгдэхгүй id-тай хүсэлт
хүлээн авахгүй.

| id | Дэлгүүр    |
| -- | ---------- |
| 1  | GOLDEN UVS |
| 2  | Ajrug      |

- Бараа, категори, сонголт (attr), захиалга, сагс, худалдан авагч, admin
  хэрэглэгч, хамтран ажиллах хүсэлт, хүргэлтийн тэмдэглэл бүгд `shop_id`-аар
  тусдаа: нэг дэлгүүрийнх нөгөөд харагдахгүй, өөрчлөгдөхгүй. Нэг утасны дугаар
  дэлгүүр бүрт тусдаа худалдан авагч болно.
- Токен нь нэг дэлгүүрийнх: өөр `X-Shop-Id`-тай ирвэл хүчингүй.
- Байршил (аймаг, дүүрэг, хороо), хаягийн төрөл нийтлэг.
- Хүргэлтийн сонголт, үнэ, хөнгөлөлтийн код дэлгүүр бүрт өөр —
  `config/constants.js`-ийн `shopSettings` (вэбийн `src/lib/pricing.ts`-тэй ижил байлгана).
- Шинэ дэлгүүр: `shops`-д мөр, `shopSettings`-д тохиргоо нэмээд `npm run seed`
  (admin, тэмдэглэл, сонголтын каталогийг тэр дэлгүүрт үүсгэнэ).

## Эхлүүлэх

```bash
cp .env.example .env    # DB_*, JWT_SECRET, ADMIN_PASSWORD-оо бөглөнө
npm install
npm run migrate         # хүснэгтүүд
npm run seed            # админ, байршил, хаягийн төрөл, хүргэлтийн тэмдэглэл, сонголтын каталог
npm start               # http://localhost:5021
```

Frontend-ийн `.env`:

| Апп     | `NEXT_PUBLIC_API_URL`       | `NEXT_PUBLIC_FILE_URL`       | `NEXT_PUBLIC_SHOP_ID` |
| ------- | --------------------------- | ---------------------------- | --------------------- |
| admin   | `http://localhost:5021/api` | `http://localhost:5021/file` | 1 (UVS) / 2 (Ajrug)   |
| web     | `http://localhost:5021/web` | `http://localhost:5021/file` | 1 (UVS) / 2 (Ajrug)   |

Бүх хариу HTTP 200, `{ success, message, data }` хэлбэртэй. Жагсаалт нь
`data: { rows, count }`. Admin-ийн жагсаалт `take`, `skip`, `filter`
(`["name","contains","цамц"]`), `sort` (`[{"selector":"id","desc":true}]`)
query-г хүлээж авна (`middleware/base.js`).

## Бүтэц

```
api/       admin (/api)  — auth, attr, category, product, file, doNote, order, partnerRequest
web/       дэлгүүр (/web) — auth, category, post, cart, customerAddress, order
file/      зураг (/file/{id}, /file/thumbnail/{id}) — public/uploads/products
helper/    бараа, захиалга, сагс, категори, OTP, файлын логик
models/    Sequelize моделиуд (snake_case багана)
migrations/, seeders/
```

## Нэвтрэлт

- **Admin**: `POST /api/auth/login` `{ phone, password }` — утасны дугаар
  (8 оронтой), нууц үгээр `users` хүснэгтээс; токен 7 хоног. Анхны админыг
  дэлгүүр бүрт `ADMIN_PHONE` / `ADMIN_PASSWORD`-оор seed үүсгэнэ.
- **Дэлгүүр**: `POST /web/auth/loginGuest` → зочны токен (`guestId`), сагс
  үүгээр холбогдоно. `POST /web/auth/sendOtp` → `POST /web/auth/verifyOtp`
  (зочны токентой) нь `customers`-д бүртгэж, зочны сагсыг шилжүүлээд
  худалдан авагчийн токен буцаана. SMS холбогдоогүй тул код нь бүх дугаарт
  `OTP_DEV_CODE` (анхдагч 2222) — `helper/otpHelper.js`-ийн `deliver()`-д SMS
  холбоно.

## Захиалга

- Дэлгүүр: `POST /web/order` сагсыг захиалга болгоно — үнэ, хүргэлт
  (`shippingInfo.deliveryMethod`), хөнгөлөлтийн кодыг дэлгүүрийн `shopSettings`-ээр
  backend тооцож, үлдэгдлийг хасна. `POST /web/order/{id}/pay` нь төлбөрийн
  сервис холбогдох хүртэл сонгосон аргаар төлсөн гэж тэмдэглэнэ.
- Admin: `pending → confirmed → delivered`, аль ч шатнаас `returned`
  (үлдсэн бүх бараа үлдэгдэлд буцна). `POST /api/order/{id}/return` нь нэг
  мөрөөс хэдэн ширхгийг буцаана.

## Анхаарах

- Устгал нь зөөлөн (`status = "deleted"`): хуучин захиалга дээрх бараа хэвээр.
- Улаанбаатарын дүүрэг, хороод seed-д бий; аймгийн сумдыг шаардлагатай үед
  `locations` хүснэгтэд нэмнэ (сумгүй аймагт вэб дараагийн сонголтыг алгасна).
- Хамтран ажиллах хүсэлт батлахад тухайн утасны дугаартай SHOPPER хэрэглэгч
  үүснэ, гэхдээ нууц үггүй.
