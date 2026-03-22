const express = require("express");
const { mintNft, redeemNft, transferNft } = require("../controllers/nftController");

const router = express.Router();

router.post("/mint", mintNft);
router.post("/redeem", redeemNft);
router.post("/transfer", transferNft);

module.exports = router;
