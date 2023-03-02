var router = require("express").Router();
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

//패스포트
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

router.use(
  session({ secret: "secret1", resave: true, saveUninitialized: false })
);
router.use(passport.initialize());
router.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (입력한아이디, 입력한비번, done) {
      //console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne(
        { id: 입력한아이디 },
        function (에러, 결과) {
          if (에러) return done(에러);

          if (!결과)
            return done(null, false, { message: "존재하지않는 아이디요" });
          if (입력한비번 == 결과.pw) {
            return done(null, 결과);
          } else {
            return done(null, false, { message: "비번틀렸어요" });
          }
        }
      );
    }
  )
);
//테스트 조회
router.get("/send", function (req, res) {
  conn.query("SELECT * FROM test.test_table", function (err, rows) {
    if (err) throw err;

    if (rows[0]) console.log(rows[0]);
    console.log(rows[0].name);
    res.redirect("/");
  });
});

//회원가입
router.post("/addJoin", function (req, res) {
  var pw = req.body.pw;
  var pwChk = req.body.pwchk;
  var name = req.body.name;
  var date = new Date();

  conn.query("select join_id from project1.number", function (err, rows) {
    if (err) throw err;
    console.log(rows[0].join_id);
    var join_id = rows[0].join_id + 1;
    var params = [join_id, pw, pwChk, name, date];
    console.log("생성하는 회원 번호 : " + join_id);
    console.log(params);

    conn.query(
      "insert into project1.member values(?,?,?,?,?);",
      params,
      function (err, rows) {
        if (err) throw err;

        if (rows[0]) console.log(rows[0]);
        res.redirect("/");
      }
    );

    conn.query(
      "update project1.number set join_id = (?)",
      join_id,
      function (err, rows) {
        if (err) throw err;
      }
    );
  });
});

//로그인
router.post("/login", function (req, res) {
  conn.query("SELECT * FROM test.test_table", function (err, rows) {
    if (err) throw err;

    if (rows[0]) console.log(rows[0]);
    console.log(rows[0].name);
    res.redirect("/");
  });
});

module.exports = router;
