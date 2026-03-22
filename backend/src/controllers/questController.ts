const supabase = require("../config/supabase");
const { calculateLevel } = require("../services/xpService");
const { checkAchievements } = require("../services/achievementService");
const { mintAchievement } = require("../services/blockchainService");
const { getLeaderboard } = require("../services/leaderboardService");
const { logActivity } = require("../services/activityService");

const getQuests = async (_req, res) => {
  try {
    const { data: quests, error } = await supabase
      .from("quests")
      .select("*")
      .order("xp", { ascending: false });

    if (error) {
      throw error;
    }

    return res.json(quests);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const completeQuest = async (req, res) => {
  try {
    const { userId, questId } = req.body;

    if (!userId || !questId) {
      return res.status(400).json({ error: "userId and questId are required" });
    }

    const [{ data: user, error: userError }, { data: quest, error: questError }] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),
      supabase.from("quests").select("*").eq("id", questId).single()
    ]);

    if (userError && userError.code !== "PGRST116") {
      throw userError;
    }

    if (questError && questError.code !== "PGRST116") {
      throw questError;
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!quest) {
      return res.status(404).json({ error: "Quest not found" });
    }

    const currentAchievements = Array.isArray(user.achievements) ? user.achievements : [];
    const nextXp = user.xp + quest.xp;
    const nextLevel = calculateLevel(nextXp);

    const userState = {
      ...user,
      xp: nextXp,
      level: nextLevel,
      achievements: currentAchievements
    };

    const unlocked = checkAchievements(userState);
    const nextAchievements = [...currentAchievements, ...unlocked];

    unlocked.forEach((achievement) => {
      mintAchievement("solana", user.wallet, achievement);
      mintAchievement("algorand", user.wallet, achievement);
    });

    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        xp: nextXp,
        level: nextLevel,
        achievements: nextAchievements
      })
      .eq("id", user.id);

    if (updateUserError) {
      throw updateUserError;
    }

    await logActivity({
      userId: user.id,
      activityType: "quest_complete",
      message: `${user.username} completed ${quest.title} (+${quest.xp} XP)`,
      metadata: { questId: quest.id, xp: quest.xp }
    });

    const leaderboard = await getLeaderboard();

    return res.json({
      xpGained: quest.xp,
      totalXP: nextXp,
      level: nextLevel,
      achievementsUnlocked: unlocked,
      leaderboard
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getQuests, completeQuest };
