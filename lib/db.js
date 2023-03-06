const maria = require("mysql");
require("dotenv").config();
var conn = maria.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PW,
  database: process.env.DB_DB,
});

conn.connect();
module.exports = conn;
