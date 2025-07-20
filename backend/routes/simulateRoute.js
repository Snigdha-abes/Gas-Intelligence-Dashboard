import express from "express";
import { simulateGasCost } from "../controllers/simulateController.js";

const router = express.Router();

router.post("/", simulateGasCost);

export default router;
