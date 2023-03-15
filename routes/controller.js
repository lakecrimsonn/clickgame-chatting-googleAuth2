var router = require("express").Router();

router.get("/tetris", (req, res, next) => {
  res.render("tetris.ejs", {
    srUrl: srUrl,
  });
});

module.exports = router;
