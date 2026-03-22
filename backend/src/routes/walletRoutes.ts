const express = require("express");
const { depositFunds, withdrawFunds } = require("../controllers/walletController");

const router = express.Router();

router.post("/deposit", depositFunds);
router.post("/withdraw", withdrawFunds);

module.exports = router;
