const DEFAULT_PRICES = {
  sol_usd: 180,
  algo_usd: 0.25,
  usdc_usd: 1
};

async function getMarketPrices() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana,algorand,usd-coin&vs_currencies=usd"
    );

    if (!response.ok) {
      throw new Error(`CoinGecko responded with ${response.status}`);
    }

    const data = await response.json();

    return {
      sol_usd: data?.solana?.usd ?? DEFAULT_PRICES.sol_usd,
      algo_usd: data?.algorand?.usd ?? DEFAULT_PRICES.algo_usd,
      usdc_usd: data?.["usd-coin"]?.usd ?? DEFAULT_PRICES.usdc_usd
    };
  } catch (_error) {
    return DEFAULT_PRICES;
  }
}

function cryptoToHacks(chain, cryptoAmount, prices) {
  const amount = Number(cryptoAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("cryptoAmount must be a positive number");
  }

  const chainKey = String(chain || "").toLowerCase();

  if (chainKey !== "sol" && chainKey !== "algo") {
    throw new Error("chain must be either 'sol' or 'algo'");
  }

  const usdValue = chainKey === "sol" ? amount * prices.sol_usd : amount * prices.algo_usd;

  // 1 USD = 100 Hacks
  const hacksAmount = Math.round(usdValue * 100);

  return { usdValue, hacksAmount };
}

function hacksToCrypto(chain, hacksAmount, prices) {
  const amount = Number(hacksAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("hacksAmount must be a positive number");
  }

  const chainKey = String(chain || "").toLowerCase();

  if (chainKey !== "sol" && chainKey !== "algo") {
    throw new Error("chain must be either 'sol' or 'algo'");
  }

  const usdValue = amount / 100;
  const cryptoAmount = chainKey === "sol" ? usdValue / prices.sol_usd : usdValue / prices.algo_usd;

  return { usdValue, cryptoAmount };
}

module.exports = {
  getMarketPrices,
  cryptoToHacks,
  hacksToCrypto
};
