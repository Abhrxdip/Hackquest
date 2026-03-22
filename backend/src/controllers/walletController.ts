const supabase = require("../config/supabase");
const { logActivity } = require("../services/activityService");
const {
  getMarketPrices,
  cryptoToHacks,
  hacksToCrypto
} = require("../services/pricingService");

const depositFunds = async (req, res) => {
  try {
    const { userId, chain, cryptoAmount } = req.body;

    if (!userId || !chain || cryptoAmount == null) {
      return res.status(400).json({ error: "userId, chain and cryptoAmount are required" });
    }

    const [{ data: user, error: userError }, prices] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),
      getMarketPrices()
    ]);

    if (userError && userError.code !== "PGRST116") {
      throw userError;
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const conversion = cryptoToHacks(chain, cryptoAmount, prices);
    const nextBalance = Number(user.hacks_balance || 0) + conversion.hacksAmount;

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ hacks_balance: nextBalance })
      .eq("id", userId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    await supabase.from("hacks_transactions").insert({
      user_id: userId,
      tx_type: "deposit",
      amount: conversion.hacksAmount,
      currency: chain.toUpperCase(),
      crypto_amount: Number(cryptoAmount),
      description: `Deposited ${cryptoAmount} ${chain.toUpperCase()} and received ${conversion.hacksAmount} HACKS`
    });

    await logActivity({
      userId,
      activityType: "deposit",
      message: `${updatedUser.username} deposited ${cryptoAmount} ${String(chain).toUpperCase()}`,
      metadata: {
        chain: String(chain).toLowerCase(),
        cryptoAmount: Number(cryptoAmount),
        hacksAmount: conversion.hacksAmount
      }
    });

    return res.json({
      user: updatedUser,
      conversion,
      prices
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const withdrawFunds = async (req, res) => {
  try {
    const { userId, chain, hacksAmount } = req.body;

    if (!userId || !chain || hacksAmount == null) {
      return res.status(400).json({ error: "userId, chain and hacksAmount are required" });
    }

    const requestedHacks = Number(hacksAmount);

    if (!Number.isFinite(requestedHacks) || requestedHacks <= 0) {
      return res.status(400).json({ error: "hacksAmount must be a positive number" });
    }

    const [{ data: user, error: userError }, prices] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),
      getMarketPrices()
    ]);

    if (userError && userError.code !== "PGRST116") {
      throw userError;
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentBalance = Number(user.hacks_balance || 0);

    if (currentBalance < requestedHacks) {
      return res.status(400).json({ error: "Insufficient Hacks balance" });
    }

    const conversion = hacksToCrypto(chain, requestedHacks, prices);
    const nextBalance = currentBalance - requestedHacks;

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ hacks_balance: nextBalance })
      .eq("id", userId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    await supabase.from("hacks_transactions").insert({
      user_id: userId,
      tx_type: "withdraw",
      amount: -requestedHacks,
      currency: chain.toUpperCase(),
      crypto_amount: conversion.cryptoAmount,
      description: `Withdrew ${requestedHacks} HACKS to ${conversion.cryptoAmount} ${String(chain).toUpperCase()}`
    });

    await logActivity({
      userId,
      activityType: "withdraw",
      message: `${updatedUser.username} withdrew ${requestedHacks} HACKS`,
      metadata: {
        chain: String(chain).toLowerCase(),
        hacksAmount: requestedHacks,
        cryptoAmount: conversion.cryptoAmount
      }
    });

    return res.json({
      user: updatedUser,
      conversion,
      prices
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  depositFunds,
  withdrawFunds
};
