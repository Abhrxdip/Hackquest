const { getLeaderboard } = require("../services/leaderboardService");

const getLeaderboardController = async (_req, res) => {
  try {
    const leaderboard = await getLeaderboard();
    return res.json(leaderboard);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getLeaderboard: getLeaderboardController };
