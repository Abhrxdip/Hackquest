const express = require("express");
const {
  registerPlayer,
  loginPlayer,
  loginOrganiser
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerPlayer);
router.post("/login", loginPlayer);
router.post("/organiser-login", loginOrganiser);

module.exports = router;
