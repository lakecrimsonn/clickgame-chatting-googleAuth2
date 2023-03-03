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
var flash = require("connect-flash");
router.use(
  session({ secret: "secret1", resave: true, saveUninitialized: true })
);
router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

//회원가입 패스포트
passport.use(
  "local-join",
  new LocalStrategy(
    {
      usernameField: "name",
      passwordField: "pw",
      passReqToCallback: true,
    },
    function (req, name, pw, done) {
      var passChk = req.body.pwchk;
      var date = new Date();

      conn.query(
        "select * from project1.member where name like ?",
        name,
        function (err, rows) {
          if (err) return done(err);
          if (rows.length) {
            console.log("이미 있는 이름");
            return done(null, false, { message: "이름이 이미 있다우" });
          } else {
            conn.query(
              "select join_id from project1.number",
              function (err, rows) {
                if (err) throw err;
                console.log(rows[0].join_id);
                var join_id = rows[0].join_id + 1;
                var params = [join_id, pw, passChk, name, date];
                console.log("생성하는 회원 번호 : " + join_id);
                console.log(params);

                conn.query(
                  "insert into project1.member values(?,?,?,?,?);",
                  params,
                  function (err, rows) {
                    if (err) throw err;
                    if (rows[0]) console.log(rows[0]);
                  }
                );

                conn.query(
                  "update project1.number set join_id = (?)",
                  join_id,
                  function (err, rows) {
                    if (err) throw err;
                  }
                );
              }
            );
          }
        }
      );
    }
  )
);

//로그인 패스포트
passport.use(
  "local-login",
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: true,
    },
    function (req, name, pw, done) {
      conn.query(
        "select * from project1.member where name like (?)",
        name,
        function (err, rows) {
          if (err) return done(err);
          if (!rows[0]) {
            console.log("없는 아이디");
            return done(null, false, { message: "존재하지않는 아이디요" });
          }
          //done(서버에러(db에러), 성공시 사용자 db데이터, 에러메세지)
          if (pw == rows[0].password) {
            return done(null, rows[0]); //result는 req.user가 되고 user가 된다
          } else {
            console.log("비밀번호 틀림");
            return done(null, false, { message: "비번 틀렸다능" });
          }
        }
      );
    }
  )
);

//세션을 저장시키는 코드, 로그인 성공시 발동
//비밀번호 검증을 하고 난 뒤에 result가 user로 매핑이 된다
//아이디를 이용해서 세션을 쿠키에 저장시킨다
//서버를 껐다가 키면 세션이 사라진다
//user는 done(null,result);에서 result다
passport.serializeUser(function (user, done) {
  console.log("id: " + user.id + "의 세션이 만들어짐");
  done(null, user.id); //디시리얼라이즈드의 d_id로 이어진다
});

//세션 데이터를 가진 사람을 DB에서 찾을 때 사용
passport.deserializeUser(function (d_id, done) {
  conn.query(
    "select * from project1.member where id like (?)",
    d_id,
    function (err, rows) {
      done(null, rows[0]);
    }
  );
});

//테스트 조회
router.get("/send", function (req, res) {
  conn.query("SELECT * FROM test.test_table", function (err, rows) {
    if (err) throw err;

    if (rows[0]) console.log(rows[0]);
    console.log(rows[0].name);
    res.redirect("/");
  });
});

//회원가입 패스포트 검증
router.post(
  "/addJoin",
  passport.authenticate("local-join", {
    successRedirect: "/",
    failureRedirect: "/join",
    failureFlash: true,
  })
);

//회원가입 불러오기
router.get("/join", (req, res, next) => {
  var msg;
  var errMsg = req.flash("error");
  if (errMsg.length) {
    msg = errMsg;
  }
  res.render("join.ejs", {
    title: "join",
    message: msg,
  });
});

//로그인 불러오기
router.get("/", (req, res, next) => {
  var msg;
  var errMsg = req.flash("error");
  if (errMsg.length) {
    msg = errMsg;
  }
  res.render("login.ejs", {
    title: "login",
    message: msg,
  });
});

//로그인 패스포트 검증
router.post(
  "/login",
  passport.authenticate("local-login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

//로그아웃
router.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});
module.exports = router;
