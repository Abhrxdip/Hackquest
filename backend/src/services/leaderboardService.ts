const supabase = require("../config/supabase");

async function getLeaderboard() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("nft_count", { ascending: false })
    .order("total_xp", { ascending: false })
    .order("xp", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return data;
}

module.exports = { getLeaderboard };
