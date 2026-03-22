const express = require("express");
const { joinEvent, awardXpToPlayer } = require("../controllers/eventController");

const router = express.Router();

router.post("/join", joinEvent);
router.post("/award-xp", awardXpToPlayer);

module.exports = router;
