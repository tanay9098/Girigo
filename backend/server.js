import "dotenv/config";
import express from "express";
import cors from "cors";
import wishRoutes from "./routes/wishes.js";
import pushRoutes from "./routes/push.js";
import { authMiddleware } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/wishes", authMiddleware, wishRoutes);
app.use("/api/push", authMiddleware, pushRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => console.log(` Girigo running on port ${PORT}`));