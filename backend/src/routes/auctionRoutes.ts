const express = require("express");
const { createAuction, placeBid, settleAuction } = require("../controllers/auctionController");

const router = express.Router();

router.post("/create", createAuction);
router.post("/bid", placeBid);
router.post("/settle", settleAuction);

module.exports = router;
