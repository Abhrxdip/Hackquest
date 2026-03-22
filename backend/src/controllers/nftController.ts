const supabase = require("../config/supabase");
const { logActivity } = require("../services/activityService");

function createFakeMintAddress() {
  return `FAKE_MINT_${Date.now()}`;
}

const mintNft = async (req, res) => {
  try {
    const { ownerId, nftDefId } = req.body;

    if (!ownerId || !nftDefId) {
      return res.status(400).json({ error: "ownerId and nftDefId are required" });
    }

    const fakeMint = createFakeMintAddress();

    const { data: ownership, error } = await supabase
      .from("nft_ownership")
      .insert({
        nft_def_id: nftDefId,
        owner_id: ownerId,
        solana_mint_addr: fakeMint,
        solana_tx_hash: `stub-tx-${Date.now()}`,
        acquired_via: "event_win"
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await supabase.rpc("increment_nft_count", { user_id_param: ownerId }).catch(() => null);

    await logActivity({
      userId: ownerId,
      activityType: "nft_mint",
      message: `Minted NFT ${nftDefId}`,
      metadata: { nftDefId, mintAddress: fakeMint }
    });

    return res.status(201).json({
      ownership,
      mintAddress: fakeMint,
      mode: "stub"
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const redeemNft = async (req, res) => {
  try {
    const { userId, nftDefId, xpCost } = req.body;

    if (!userId || !nftDefId || xpCost == null) {
      return res.status(400).json({ error: "userId, nftDefId and xpCost are required" });
    }

    const cost = Number(xpCost);

    if (!Number.isFinite(cost) || cost <= 0) {
      return res.status(400).json({ error: "xpCost must be a positive number" });
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

    const totalXp = Number(user.total_xp ?? user.xp ?? 0);

    if (totalXp < cost) {
      return res.status(400).json({ error: "Not enough XP to redeem this NFT" });
    }

    const nextXp = totalXp - cost;

    const { error: updateError } = await supabase
      .from("users")
      .update({ total_xp: nextXp, xp: nextXp })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    const fakeMint = createFakeMintAddress();

    const { data: ownership, error: ownershipError } = await supabase
      .from("nft_ownership")
      .insert({
        nft_def_id: nftDefId,
        owner_id: userId,
        solana_mint_addr: fakeMint,
        solana_tx_hash: `stub-tx-${Date.now()}`,
        acquired_via: "redeem"
      })
      .select("*")
      .single();

    if (ownershipError) {
      throw ownershipError;
    }

    await supabase.from("xp_logs").insert({
      user_id: userId,
      amount: -cost,
      source: "nft_redeem",
      source_id: nftDefId
    });

    await logActivity({
      userId,
      activityType: "nft_redeem",
      message: `${user.username} redeemed NFT ${nftDefId} for ${cost} XP`,
      metadata: { nftDefId, xpCost: cost }
    });

    return res.status(201).json({ ownership, remainingXp: nextXp });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const transferNft = async (req, res) => {
  try {
    const { ownershipId, fromUserId, toUserId } = req.body;

    if (!ownershipId || !fromUserId || !toUserId) {
      return res.status(400).json({ error: "ownershipId, fromUserId and toUserId are required" });
    }

    const { data: ownership, error: ownershipError } = await supabase
      .from("nft_ownership")
      .select("*")
      .eq("id", ownershipId)
      .single();

    if (ownershipError && ownershipError.code !== "PGRST116") {
      throw ownershipError;
    }

    if (!ownership) {
      return res.status(404).json({ error: "NFT ownership record not found" });
    }

    if (ownership.owner_id !== fromUserId) {
      return res.status(403).json({ error: "Sender is not current owner" });
    }

    const { data: updated, error: updateError } = await supabase
      .from("nft_ownership")
      .update({ owner_id: toUserId, is_listed: false })
      .eq("id", ownershipId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    await logActivity({
      userId: toUserId,
      activityType: "nft_transfer",
      message: `NFT ${ownershipId} transferred to user ${toUserId}`,
      metadata: { ownershipId, fromUserId, toUserId }
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  mintNft,
  redeemNft,
  transferNft
};
