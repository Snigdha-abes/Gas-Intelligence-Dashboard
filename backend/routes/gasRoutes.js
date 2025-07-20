import express from "express";
import { getGasPrices } from "../utils/getGasPrices.js";

const router = express.Router();

router.get("/gas-history", async (req, res) => {
  try {
    const prices = await getGasPrices();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch gas prices" });
  }
});

export default router;
