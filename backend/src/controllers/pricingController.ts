const { getMarketPrices } = require("../services/pricingService");

const getPricing = async (_req, res) => {
  try {
    const prices = await getMarketPrices();
    return res.json(prices);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getPricing };
