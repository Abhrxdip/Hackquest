const supabase = require("../config/supabase");
const { logActivity } = require("../services/activityService");

const createAuction = async (req, res) => {
  try {
    const {
      sellerId,
      nftOwnershipId,
      nftPackId = null,
      auctionType = "single_premium",
      startingPrice,
      endTime
    } = req.body;

    if (!sellerId || !startingPrice || !endTime) {
      return res.status(400).json({
        error: "sellerId, startingPrice and endTime are required"
      });
    }

    if (!nftOwnershipId && !nftPackId) {
      return res.status(400).json({ error: "Either nftOwnershipId or nftPackId is required" });
    }

    const { data: auction, error } = await supabase
      .from("auctions")
      .insert({
        seller_id: sellerId,
        nft_ownership_id: nftOwnershipId,
        nft_pack_id: nftPackId,
        auction_type: auctionType,
        starting_price: Number(startingPrice),
        current_bid: Number(startingPrice),
        end_time: endTime
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    if (nftOwnershipId) {
      await supabase
        .from("nft_ownership")
        .update({ is_listed: true })
        .eq("id", nftOwnershipId);
    }

    await logActivity({
      userId: sellerId,
      activityType: "auction_create",
      message: `Auction ${auction.id} created`,
      metadata: { auctionId: auction.id }
    });

    return res.status(201).json(auction);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const placeBid = async (req, res) => {
  try {
    const { auctionId, bidderId, bidAmount } = req.body;

    if (!auctionId || !bidderId || bidAmount == null) {
      return res.status(400).json({ error: "auctionId, bidderId and bidAmount are required" });
    }

    const amount = Number(bidAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "bidAmount must be a positive number" });
    }

    const [{ data: auction, error: auctionError }, { data: bidder, error: bidderError }] =
      await Promise.all([
        supabase.from("auctions").select("*").eq("id", auctionId).single(),
        supabase.from("users").select("*").eq("id", bidderId).single()
      ]);

    if (auctionError && auctionError.code !== "PGRST116") {
      throw auctionError;
    }

    if (bidderError && bidderError.code !== "PGRST116") {
      throw bidderError;
    }

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    if (!bidder) {
      return res.status(404).json({ error: "Bidder not found" });
    }

    if (auction.status !== "active") {
      return res.status(400).json({ error: "Auction is not active" });
    }

    if (new Date(auction.end_time).getTime() <= Date.now()) {
      return res.status(400).json({ error: "Auction already ended" });
    }

    if (amount <= Number(auction.current_bid)) {
      return res.status(400).json({ error: "Bid must be higher than current bid" });
    }

    if (Number(bidder.hacks_balance || 0) < amount) {
      return res.status(400).json({ error: "Insufficient Hacks balance" });
    }

    const [{ data: bid, error: bidError }, { data: updatedAuction, error: updateAuctionError }] =
      await Promise.all([
        supabase
          .from("auction_bids")
          .insert({ auction_id: auctionId, bidder_id: bidderId, bid_amount: amount })
          .select("*")
          .single(),
        supabase
          .from("auctions")
          .update({ current_bid: amount, highest_bidder: bidderId })
          .eq("id", auctionId)
          .select("*")
          .single()
      ]);

    if (bidError) {
      throw bidError;
    }

    if (updateAuctionError) {
      throw updateAuctionError;
    }

    await logActivity({
      userId: bidderId,
      activityType: "auction_bid",
      message: `${bidder.username} bid ${amount} HACKS`,
      metadata: { auctionId, bidAmount: amount }
    });

    return res.status(201).json({ bid, auction: updatedAuction });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const settleAuction = async (req, res) => {
  try {
    const { auctionId } = req.body;

    if (!auctionId) {
      return res.status(400).json({ error: "auctionId is required" });
    }

    const { data: auction, error: auctionError } = await supabase
      .from("auctions")
      .select("*")
      .eq("id", auctionId)
      .single();

    if (auctionError && auctionError.code !== "PGRST116") {
      throw auctionError;
    }

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    if (auction.status !== "active") {
      return res.status(400).json({ error: "Auction already settled" });
    }

    const shouldSettle = new Date(auction.end_time).getTime() <= Date.now() || req.body.force === true;

    if (!shouldSettle) {
      return res.status(400).json({ error: "Auction is still running. Use force=true to settle early." });
    }

    if (!auction.highest_bidder) {
      const { data: endedNoBid, error: noBidError } = await supabase
        .from("auctions")
        .update({ status: "ended" })
        .eq("id", auctionId)
        .select("*")
        .single();

      if (noBidError) {
        throw noBidError;
      }

      return res.json({ auction: endedNoBid, settlement: "No bids" });
    }

    const [{ data: winner, error: winnerError }, { data: seller, error: sellerError }] =
      await Promise.all([
        supabase.from("users").select("*").eq("id", auction.highest_bidder).single(),
        supabase.from("users").select("*").eq("id", auction.seller_id).single()
      ]);

    if (winnerError && winnerError.code !== "PGRST116") {
      throw winnerError;
    }

    if (sellerError && sellerError.code !== "PGRST116") {
      throw sellerError;
    }

    if (!winner || !seller) {
      return res.status(404).json({ error: "Could not resolve winner or seller" });
    }

    const finalPrice = Number(auction.current_bid || 0);

    if (Number(winner.hacks_balance || 0) < finalPrice) {
      return res.status(400).json({ error: "Winner balance is insufficient for settlement" });
    }

    await Promise.all([
      supabase
        .from("users")
        .update({ hacks_balance: Number(winner.hacks_balance || 0) - finalPrice })
        .eq("id", winner.id),
      supabase
        .from("users")
        .update({ hacks_balance: Number(seller.hacks_balance || 0) + finalPrice })
        .eq("id", seller.id),
      supabase.from("auctions").update({ status: "ended" }).eq("id", auctionId),
      auction.nft_ownership_id
        ? supabase
            .from("nft_ownership")
            .update({ owner_id: winner.id, is_listed: false })
            .eq("id", auction.nft_ownership_id)
        : Promise.resolve(),
      supabase.from("hacks_transactions").insert([
        {
          user_id: winner.id,
          tx_type: "auction_bid",
          amount: -finalPrice,
          currency: "HACKS",
          description: `Won auction ${auctionId}`
        },
        {
          user_id: seller.id,
          tx_type: "nft_sale",
          amount: finalPrice,
          currency: "HACKS",
          description: `Sold NFT in auction ${auctionId}`
        }
      ])
    ]);

    await logActivity({
      userId: winner.id,
      activityType: "auction_settle",
      message: `${winner.username} won auction ${auctionId} for ${finalPrice} HACKS`,
      metadata: { auctionId, finalPrice }
    });

    const { data: updatedAuction } = await supabase
      .from("auctions")
      .select("*")
      .eq("id", auctionId)
      .single();

    return res.json({ auction: updatedAuction, winner: winner.id, finalPrice });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createAuction,
  placeBid,
  settleAuction
};
