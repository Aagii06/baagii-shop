const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Орчны тохиргоо ачаална. Давуу эрэмбэ (өндрөөс нь):
//   1. shell / pm2-оор өгсөн хувьсагч
//   2. .env.<NODE_ENV>  (жишээ нь .env.production)
//   3. .env             (нийтлэг тохиргоо, нууц түлхүүрүүд)
// NODE_ENV нь shell-ээс эсвэл .env-ээс авна (.env.<NODE_ENV> дотор бичих нь утгагүй).
const root = path.join(__dirname, "..");
const read = (file) => {
  const full = path.join(root, file);
  return fs.existsSync(full) ? dotenv.parse(fs.readFileSync(full)) : {};
};

const base = read(".env");
const envName = process.env.NODE_ENV || base.NODE_ENV || "development";
const merged = { ...base, ...read(`.env.${envName}`), NODE_ENV: envName };

for (const [key, value] of Object.entries(merged))
  if (process.env[key] === undefined) process.env[key] = value;

module.exports = envName;
