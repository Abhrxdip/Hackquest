const supabase = require("../config/supabase");
const { logActivity } = require("../services/activityService");

const registerPlayer = async (req, res) => {
  try {
    const { username, wallet } = req.body;

    if (!username || !wallet) {
      return res.status(400).json({ error: "username and wallet are required" });
    }

    const { data: existing, error: findError } = await supabase
      .from("users")
      .select("id,username,wallet")
      .eq("wallet", wallet)
      .limit(1);

    if (findError) {
      throw findError;
    }

    if (existing?.length) {
      return res.status(409).json({ error: "Wallet already registered" });
    }

    const { data: created, error: insertError } = await supabase
      .from("users")
      .insert({ username, wallet, role: "player" })
      .select("*")
      .single();

    if (insertError) {
      throw insertError;
    }

    await logActivity({
      userId: created.id,
      activityType: "register",
      message: `${created.username} joined HackQuest`,
      metadata: { wallet: created.wallet }
    });

    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const loginPlayer = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: "identifier is required" });
    }

    const { data: users, error } = await supabase.from("users").select("*").or(
      `username.eq.${identifier},wallet.eq.${identifier},email.eq.${identifier},phone.eq.${identifier}`
    );

    if (error) {
      throw error;
    }

    if (!users?.length) {
      return res.status(404).json({ error: "Player not found" });
    }

    const user = users[0];

    if (user.role && user.role !== "player") {
      return res.status(403).json({ error: "Account is not a player account" });
    }

    await logActivity({
      userId: user.id,
      activityType: "login",
      message: `${user.username} logged in`
    });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const loginOrganiser = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: "identifier is required" });
    }

    const { data: users, error } = await supabase.from("users").select("*").or(
      `username.eq.${identifier},wallet.eq.${identifier},email.eq.${identifier},phone.eq.${identifier}`
    );

    if (error) {
      throw error;
    }

    if (!users?.length) {
      return res.status(404).json({ error: "Organiser not found" });
    }

    const user = users[0];

    if (user.role !== "organiser" && user.role !== "admin") {
      return res.status(403).json({ error: "Not authorised as organiser" });
    }

    await logActivity({
      userId: user.id,
      activityType: "organiser_login",
      message: `${user.username} logged in as organiser`
    });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  registerPlayer,
  loginPlayer,
  loginOrganiser
};
