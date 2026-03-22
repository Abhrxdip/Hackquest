const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const questRoutes = require("./routes/questRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const activityRoutes = require("./routes/activityRoutes");
const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const pricingRoutes = require("./routes/pricingRoutes");
const nftRoutes = require("./routes/nftRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const eventRoutes = require("./routes/eventRoutes");
const blockchainRoutes = require("./routes/blockchainRoutes");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/users", userRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/nft", nftRoutes);
app.use("/api/auction", auctionRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/blockchain", blockchainRoutes);

module.exports = app;
