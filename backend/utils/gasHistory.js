import fs from "fs";
import path from "path";

const GAS_HISTORY_PATH = path.join(process.cwd(), "data", "GasHistory.json");

export const addGasPrice = (
  chain,
  gasPrice,
  gasLimit,
  gasCostEth,
  gasCostUsd
) => {
  const newEntry = {
    chain,
    gasPrice,
    gasLimit,
    gasCostEth,
    gasCostUsd,
    timestamp: new Date().toISOString(),
  };

  let history = [];

  try {
    const fileContent = fs.readFileSync(GAS_HISTORY_PATH, "utf-8");
    history = JSON.parse(fileContent || "[]");
  } catch (err) {
    console.warn("Creating new GasHistory.json file.");
  }

  history.push(newEntry);
  fs.writeFileSync(GAS_HISTORY_PATH, JSON.stringify(history, null, 2));
};

export const getGasHistory = () => {
  try {
    const fileContent = fs.readFileSync(GAS_HISTORY_PATH, "utf-8");
    return JSON.parse(fileContent || "[]");
  } catch (err) {
    console.error("Failed to read gas history:", err.message);
    return [];
  }
};
