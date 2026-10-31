require("./env");

// Sequelize (models/index.js) болон sequelize-cli хоёулаа эндээс уншина.
// Нууц үгийг кодонд бичихгүй — .env дотор DB_* хувьсагчаар өгнө.
const connection = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "uvs_shop",
  dialect: "mysql",
};

module.exports = {
  development: connection,
  test: connection,
  production: connection,
};
