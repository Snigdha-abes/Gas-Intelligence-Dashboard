import express from "express";
import cors from "cors";
import gasRoutes from "./routes/gasRoutes.js";
import simulateRoute from "./routes/simulateRoute.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api", gasRoutes);
app.use("/api/v1/simulate", simulateRoute);

app.get("/", (req, res) => {
  res.send("Real-Time Gas Tracker Backend is running");
});

app.listen(PORT, () => {
  console.log(`Server is live on http://localhost:${PORT}`);
});
