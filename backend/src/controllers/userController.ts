const supabase = require("../config/supabase");

const loginUser = async (req, res) => {
  try {
    const { username, wallet } = req.body;

    if (!username || !wallet) {
      return res.status(400).json({ error: "username and wallet are required" });
    }

    const { data: existingUsers, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet", wallet)
      .limit(1);

    if (findError) {
      throw findError;
    }

    let user = existingUsers[0];

    if (!user) {
      const { data: createdUser, error: createError } = await supabase
        .from("users")
        .insert({ username, wallet })
        .select("*")
        .single();

      if (createError) {
        throw createError;
      }

      user = createdUser;
    } else if (user.username !== username) {
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ username })
        .eq("id", user.id)
        .select("*")
        .single();

      if (updateError) {
        throw updateError;
      }

      user = updatedUser;
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getUser = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { loginUser, getUser };
