var express = require("express");
const passport = require("passport");
var router = express.Router();
var GoogleStrategy = require("passport-google-oidc");
var conn = require("../lib/db")();
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
/**
 * federated_credentials
user_id
provider
subject

users
id

 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env["GOOGLE_CLIENT_ID"],
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
      callbackURL: process.env.GOOGLE_REDIRECT_URL,
      scope: ["profile"],
    },
    function verify(issuer, profile, cb) {
      conn.get(
        "SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?",
        [issuer, profile.id],
        function (err, row) {
          if (err) {
            return cb(err);
          }
          if (!row) {
            conn.run(
              "INSERT INTO users (name) VALUES (?)",
              [profile.displayName],
              function (err) {
                if (err) {
                  return cb(err);
                }

                var id = this.lastID;
                conn.run(
                  "INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)",
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
            conn.get(
              "SELECT * FROM users WHERE id = ?",
              [row.user_id],
              function (err, row) {
                if (err) {
                  return cb(err);
                }
                if (!row) {
                  return cb(null, false);
                }
                return cb(null, row);
              }
            );
          }
        }
      );
    }
  )
);

//구글인증
router.get("/login/federated/google", passport.authenticate("google"));
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login2",
    failureMessage: true,
  }),
  function (req, res) {
    res.redirect("/");
  }
);

module.exports = router;
