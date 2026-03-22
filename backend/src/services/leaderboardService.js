const supabase = require("../config/supabase");

async function getLeaderboard() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("xp", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return data;
}

module.exports = { getLeaderboard };
