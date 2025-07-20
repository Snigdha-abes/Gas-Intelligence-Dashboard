import express from "express";
import { getGasHistory } from "../utils/gasHistory.js";

const router = express.Router();

router.get("/gas-history", async (req, res) => {
  try {
    const history = await getGasHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch gas history" });
  }
});

export default router;
