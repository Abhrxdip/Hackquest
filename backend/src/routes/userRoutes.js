const express = require("express");
const { loginUser, getUser } = require("../controllers/userController");

const router = express.Router();

router.post("/login", loginUser);
router.get("/:id", getUser);

module.exports = router;
