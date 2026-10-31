"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const { Op } = Sequelize;
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];

const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  dialectOptions: { dateStrings: true, typeCast: true },
  define: { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
  logging: false,
  pool: { max: 30, min: 0, acquire: 60000, idle: 5000 },
});

fs.readdirSync(__dirname)
  .filter((file) => file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js")
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.op = Op;

module.exports = db;
