var router = require("express").Router();

router.get("/chat", (req, res) => {
  res.render("chatting.ejs");
});

module.exports = router;
