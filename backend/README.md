# UVS shop backend

GOLDEN UVS дэлгүүрийн backend: admin самбар (`../admin`) болон дэлгүүр
(`../web`) хоёулаа үүнийг ашиглана. Бүтэц нь `BaagiiCar/backend`-тэй ижил:
Express + Sequelize (MySQL), migration / seeder нь sequelize-cli.

## Эхлүүлэх

```bash
cp .env.example .env    # DB_*, JWT_SECRET, ADMIN_PASSWORD-оо бөглөнө
npm install
npm run migrate         # хүснэгтүүд
npm run seed            # админ, байршил, хаягийн төрөл, хүргэлтийн тэмдэглэл, сонголтын каталог
npm start               # http://localhost:5021
```

Frontend-ийн `.env`:

| Апп     | `NEXT_PUBLIC_API_URL`       | `NEXT_PUBLIC_FILE_URL`       |
| ------- | --------------------------- | ---------------------------- |
| admin   | `http://localhost:5021/api` | `http://localhost:5021/file` |
| web     | `http://localhost:5021/web` | `http://localhost:5021/file` |

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

- **Admin**: `POST /api/auth/login` `{ userName, password }` → `users`
  хүснэгт, токен 7 хоног. Анхны админыг `ADMIN_USERNAME` / `ADMIN_PASSWORD`-оор
  seed үүсгэнэ.
- **Дэлгүүр**: `POST /web/auth/loginGuest` → зочны токен (`guestId`), сагс
  үүгээр холбогдоно. `POST /web/auth/sendOtp` → `POST /web/auth/verifyOtp`
  (зочны токентой) нь `customers`-д бүртгэж, зочны сагсыг шилжүүлээд
  худалдан авагчийн токен буцаана. SMS холбогдоогүй тул код нь бүх дугаарт
  `OTP_DEV_CODE` (анхдагч 2222) — `helper/otpHelper.js`-ийн `deliver()`-д SMS
  холбоно.

## Захиалга

- Дэлгүүр: `POST /web/order` сагсыг захиалга болгоно — үнэ, хүргэлт
  (`deliveryFee`), хөнгөлөлтийн код (`coupons`, `config/constants.js`)-ыг
  backend тооцож, үлдэгдлийг хасна. `POST /web/order/{id}/pay` нь төлбөрийн
  сервис холбогдох хүртэл сонгосон аргаар төлсөн гэж тэмдэглэнэ.
- Admin: `pending → confirmed → delivered`, аль ч шатнаас `returned`
  (үлдсэн бүх бараа үлдэгдэлд буцна). `POST /api/order/{id}/return` нь нэг
  мөрөөс хэдэн ширхгийг буцаана.

## Анхаарах

- Устгал нь зөөлөн (`status = "deleted"`): хуучин захиалга дээрх бараа хэвээр.
- Улаанбаатарын дүүрэг, хороод seed-д бий; аймгийн сумдыг шаардлагатай үед
  `locations` хүснэгтэд нэмнэ (сумгүй аймагт вэб дараагийн сонголтыг алгасна).
- Хамтран ажиллах хүсэлт батлахад SHOPPER хэрэглэгч үүснэ, гэхдээ нууц үггүй.
