var express = require("express");
const passport = require("passport");
var router = express.Router();
var GoogleStrategy = require("passport-google-oidc");
var conn = require("../lib/db")();
var session = require("express-session");
var MySQLStore = require("express-mysql-session")(session);
var flash = require("connect-flash");

/**
 * federated_credentials
user_id
provider
subject

users
id
 */

var options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PW,
  database: process.env.DB_DB,
};

router.use(
  session({
    secret: "secret2",
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(options),
    //store: new FileStore(),
  })
);

router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env["GOOGLE_CLIENT_ID"],
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
      callbackURL: process.env.GOOGLE_REDIRECT_URL,
      scope: ["profile"],
    },
    function verify(issuer, profile, cb) {
      console.log(issuer);
      console.log(profile);
      conn.query(
        "SELECT * FROM project1.federated_credentials WHERE provider = ? AND subject = ?",
        [issuer, profile.id],
        function (err, row) {
          if (err) {
            return cb(err);
          }
          console.log(row);
          if (row.length === 0) {
            conn.query(
              "INSERT INTO project1.users VALUES (?)",
              [profile.displayName],
              function (err) {
                if (err) {
                  return cb(err);
                }

                var id = profile.displayName;
                conn.query(
                  "INSERT INTO project1.federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)",
                  [id, issuer, profile.id],
                  function (err) {
                    if (err) {
                      return cb(err);
                    }
                    var user = {
                      id: id,
                      name: profile.displayName,
                    };
                    return cb(null, user);
                  }
                );
              }
            );
          } else {
            console.log(row);
            conn.query(
              "SELECT * FROM project1.users WHERE id = ?",
              [row[0].user_id],
              function (err, row) {
                if (err) {
                  return cb(err);
                }
                if (!row) {
                  return cb(null, false);
                }
                return cb(null, row[0]);
              }
            );
          }
        }
      );
    }
  )
);

// passport.serializeUser(function (user, cb) {
//   console.log(user);
//   cb(null, user.user_id); //디시리얼라이즈드의 d_id로 이어진다
// });

// passport.deserializeUser(function (user, cb) {
//   conn.query(
//     "select * from project1.users where id like (?)",
//     d_name,
//     function (err, rows) {
//       cb(null, rows[0]);
//     }
//   );
// });

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

// passport.serializeUser(function (user, done) {
//   console.log("id: " + user.name + "의 세션이 만들어짐");
//   done(null, user.name); //디시리얼라이즈드의 d_id로 이어진다
// });

// //세션 데이터를 가진 사람을 DB에서 찾을 때 사용
// passport.deserializeUser(function (d_name, done) {
//   conn.query(
//     "select * from project1.member where name like (?)",
//     d_name,
//     function (err, rows) {
//       done(null, rows[0]);
//     }
//   );
// });

//구글인증
// router.get("/login/federated/google", passport.authenticate("google"), {
//});

router.get("/login/federated/google", passport.authenticate("google"));
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

router.get("/login2", (req, res, next) => {
  // if (req.user) {
  //   console.log("이미 로그인함");
  //   return res.send(
  //     "<script>alert('이미 로그인했잖니');location.href='/';</script>"
  //   );
  // }
  var msg;
  var errMsg = req.flash("error");
  if (errMsg.length) {
    msg = errMsg;
  }
  res.render("login2.ejs", {
    title: "login2",
    message: msg,
  });
});

//로그아웃
router.post("/logout2", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
module.exports = router;
