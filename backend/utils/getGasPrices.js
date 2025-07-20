import { ethers } from "ethers";
import { chains } from "../config/chains.js";

export const getGasPrices = async () => {
  const gasPrices = {};

  for (const chain of chains) {
    try {
      const provider = new ethers.JsonRpcProvider(chain.rpc);
      const feeData = await provider.getFeeData();

      const gasPriceGwei = feeData.gasPrice
        ? Number(ethers.formatUnits(feeData.gasPrice, "gwei"))
        : null;

      if (!gasPriceGwei) {
        console.warn(`Gas price unavailable for ${chain.name}`);
        gasPrices[chain.name] = null;
      } else {
        gasPrices[chain.name] = gasPriceGwei;
      }
    } catch (err) {
      console.error(
        `Failed to fetch gas price for ${chain.name}:`,
        err.message
      );
      gasPrices[chain.name] = null;
    }
  }

  return gasPrices;
};
