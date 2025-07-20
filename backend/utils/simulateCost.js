import { ethers } from "ethers";

const UNISWAP_POOL = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8";

const SLOT_0_TOPIC = "0xddf252ad";

const ABI = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
];

export const getEthUsdPrice = async () => {
  const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
  const contract = new ethers.Contract(UNISWAP_POOL, ABI, provider);

  const { sqrtPriceX96 } = await contract.slot0();

  const priceX96 = BigInt(sqrtPriceX96);
  const price = (priceX96 * priceX96 * 1_000_000n) / 2n ** 192n;

  return Number(price) / 1_000_000;
};

export const calculateCost = async (txValueEth, gasPrices) => {
  const ethUsd = await getEthUsdPrice();

  const gasLimit = 21000;

  const results = {};

  for (const [chain, gasPrice] of Object.entries(gasPrices)) {
    if (typeof gasPrice === "number") {
      const gasCostEth = (gasPrice * gasLimit) / 1e9; // gwei to ETH
      const totalCostEth = gasCostEth + Number(txValueEth);
      results[chain] = {
        gasCostUsd: (gasCostEth * ethUsd).toFixed(2),
        totalCostUsd: (totalCostEth * ethUsd).toFixed(2),
      };
    } else {
      results[chain] = { gasCostUsd: "N/A", totalCostUsd: "N/A" };
    }
  }

  return results;
};
