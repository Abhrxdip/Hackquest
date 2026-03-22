const supabase = require("../config/supabase");

async function logActivity({ userId = null, activityType = "system", message, metadata = {} }) {
  if (!message) {
    return;
  }

  // Prefer the plan table, fallback to legacy table.
  const { error } = await supabase.from("activity_feed").insert({
    user_id: userId,
    activity_type: activityType,
    message,
    metadata
  });

  if (!error) {
    return;
  }

  await supabase.from("activities").insert({ message });
}

module.exports = { logActivity };
