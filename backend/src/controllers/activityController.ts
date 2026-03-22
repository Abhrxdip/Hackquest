const supabase = require("../config/supabase");

const getActivity = async (_req, res) => {
  try {
    const { data: activityFeed, error } = await supabase
      .from("activity_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error) {
      return res.json(activityFeed);
    }

    const { data: legacyActivity, error: legacyError } = await supabase
      .from("activities")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(20);

    if (legacyError) {
      throw legacyError;
    }

    return res.json(legacyActivity);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getActivity };
