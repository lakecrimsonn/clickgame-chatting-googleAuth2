module.exports = function () {
  const maria = require("mysql");
  require("dotenv").config();
  var options = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    database: process.env.DB_DB,
  };
  var conn = maria.createConnection(options);
  conn.connect();
  conn.query("truncate project1.banghistory", (err, result) => {
    if (err) {
      console.error(err);
    }
  });
  return conn;
  //꼭 require("dotev").config();후에 콘솔로 찍어야 값이 나온다.
};

//module.exports = conn;
