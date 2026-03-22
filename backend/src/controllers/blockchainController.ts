const { logActivity } = require("../services/activityService");

const writeAlgorandAudit = async (req, res) => {
  try {
    const txId = `algo-stub-${Date.now()}`;

    await logActivity({
      activityType: "algorand_audit",
      message: "Algorand audit entry written (stub)",
      metadata: {
        txId,
        payload: req.body
      }
    });

    return res.json({
      mode: "stub",
      network: "algorand",
      txId,
      payload: req.body
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const triggerSolanaMint = async (req, res) => {
  try {
    const txHash = `solana-stub-${Date.now()}`;
    const mintAddress = `FAKE_MINT_${Date.now()}`;

    await logActivity({
      activityType: "solana_mint",
      message: "Solana mint triggered (stub)",
      metadata: {
        txHash,
        mintAddress,
        payload: req.body
      }
    });

    return res.json({
      mode: "stub",
      network: "solana",
      txHash,
      mintAddress,
      payload: req.body
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  writeAlgorandAudit,
  triggerSolanaMint
};
