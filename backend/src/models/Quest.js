const mongoose = require("mongoose");

const questSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  xp: { type: Number, required: true },
  difficulty: { type: String, default: "medium", trim: true }
});

module.exports = mongoose.model("Quest", questSchema);
