const express = require("express");
const { getQuests, completeQuest } = require("../controllers/questController");

const router = express.Router();

router.get("/", getQuests);
router.post("/complete", completeQuest);

module.exports = router;
