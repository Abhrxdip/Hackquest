const supabase = require("../config/supabase");
const { calculateLevel } = require("../services/xpService");
const { logActivity } = require("../services/activityService");

const joinEvent = async (req, res) => {
  try {
    const { eventId, userId, teamId = null } = req.body;

    if (!eventId || !userId) {
      return res.status(400).json({ error: "eventId and userId are required" });
    }

    const { data: existing, error: existingError } = await supabase
      .from("event_participants")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .limit(1);

    if (existingError) {
      throw existingError;
    }

    if (existing?.length) {
      return res.status(409).json({ error: "User already joined this event" });
    }

    const { data: joined, error } = await supabase
      .from("event_participants")
      .insert({ event_id: eventId, user_id: userId, team_id: teamId })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await logActivity({
      userId,
      activityType: "event_join",
      message: `User ${userId} joined event ${eventId}`,
      metadata: { eventId, teamId }
    });

    return res.status(201).json(joined);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const awardXpToPlayer = async (req, res) => {
  try {
    const { eventId, userId, amount } = req.body;

    if (!eventId || !userId || amount == null) {
      return res.status(400).json({ error: "eventId, userId and amount are required" });
    }

    const xpAmount = Number(amount);

    if (!Number.isFinite(xpAmount) || xpAmount <= 0) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError && userError.code !== "PGRST116") {
      throw userError;
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const nextXp = Number(user.xp || 0) + xpAmount;
    const nextTotalXp = Number(user.total_xp || user.xp || 0) + xpAmount;
    const nextCumulativeXp = Number(user.cumulative_xp || user.xp || 0) + xpAmount;
    const nextLevel = calculateLevel(nextXp);

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        xp: nextXp,
        total_xp: nextTotalXp,
        cumulative_xp: nextCumulativeXp,
        player_level: nextLevel,
        level: nextLevel
      })
      .eq("id", userId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    await Promise.all([
      supabase.from("xp_logs").insert({
        user_id: userId,
        amount: xpAmount,
        source: "event_award",
        source_id: eventId
      }),
      supabase
        .from("event_participants")
        .update({ xp_earned: Number(updatedUser.total_xp || 0) })
        .eq("event_id", eventId)
        .eq("user_id", userId)
    ]);

    await logActivity({
      userId,
      activityType: "xp_award",
      message: `${updatedUser.username} earned ${xpAmount} XP from event ${eventId}`,
      metadata: { eventId, xpAmount }
    });

    return res.json({ user: updatedUser, xpAwarded: xpAmount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  joinEvent,
  awardXpToPlayer
};
