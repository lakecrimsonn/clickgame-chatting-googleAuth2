var router = require("express").Router();

router.get("/tetris", (req, res, next) => {
  res.render("tetris.ejs");
});

module.exports = router;
