const supabase = require("../config/supabase");

const getActivity = async (_req, res) => {
  try {
    const { data: activity, error } = await supabase
      .from("activities")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return res.json(activity);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getActivity };
