function checkAchievements(user) {
  const unlocked = [];

  if (user.xp > 0 && !user.achievements.includes("FIRST_QUEST")) {
    unlocked.push("FIRST_QUEST");
  }

  if (user.xp >= 100 && !user.achievements.includes("XP_100")) {
    unlocked.push("XP_100");
  }

  if (user.xp >= 500 && !user.achievements.includes("XP_500")) {
    unlocked.push("XP_500");
  }

  return unlocked;
}

module.exports = { checkAchievements };
