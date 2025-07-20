import { getGasPrices } from "../utils/getGasPrices.js";
import { chains } from "../config/chains.js";
import { addGasPrice } from "../utils/gasHistory.js";

export const simulateGasCost = async (req, res) => {
  const { ethAmount } = req.body;

  if (!ethAmount) {
    return res.status(400).json({ error: "ethAmount is required" });
  }

  try {
    const gasPrices = await getGasPrices();
    const results = [];

    for (const chain of chains) {
      const price = gasPrices[chain.name];

      if (!price) {
        results.push({ chain: chain.name, error: "Gas price unavailable" });
        continue;
      }

      const gasPriceGwei = parseFloat(price);
      const gasLimit = 21000;
      const gasCostInEth = ((gasPriceGwei * gasLimit) / 1e9).toFixed(6);
      const gasCostInUsd = (
        parseFloat(gasCostInEth) *
        parseFloat(ethAmount) *
        2734856
      ).toFixed(2); // Adjust if needed

      addGasPrice(
        chain.name,
        gasPriceGwei,
        gasLimit,
        gasCostInEth,
        gasCostInUsd
      );

      results.push({
        chain: chain.name,
        gasPriceGwei,
        gasLimit,
        gasCostInEth,
        gasCostInUsd,
      });
    }

    res.json({ data: results });
  } catch (error) {
    console.error("Simulation failed:", error);
    res.status(500).json({ error: "Simulation failed" });
  }
};
