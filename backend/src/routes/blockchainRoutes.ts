const express = require("express");
const { writeAlgorandAudit, triggerSolanaMint } = require("../controllers/blockchainController");

const router = express.Router();

router.post("/algorand-audit", writeAlgorandAudit);
router.post("/solana-mint", triggerSolanaMint);

module.exports = router;
