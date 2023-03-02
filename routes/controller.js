var router = require("express").Router();

router.get("/", (req, res) => {
  res.render("index.ejs");
});

router.get("/join", (req, res) => {
  res.render("join.ejs");
});

router.get("/login", (req, res) => {
  res.render("login.ejs");
});

module.exports = router;
