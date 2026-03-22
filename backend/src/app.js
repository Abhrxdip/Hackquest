const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const questRoutes = require("./routes/questRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();

app.use(express.json());
app.use(cors());

// Makes socket available in route handlers once server initializes it.
app.use((req, _res, next) => {
  req.io = req.app.get("io");
  next();
});

app.use("/api/users", userRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/activity", activityRoutes);

module.exports = app;
