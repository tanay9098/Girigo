import "dotenv/config";
import express from "express";
import cors from "cors";
import wishRoutes from "./routes/wishes.js";
import pushRoutes from "./routes/push.js";
import { authMiddleware } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 4000;

const stripTrailingSlash = (url) => url.replace(/\/+$/, "");

const allowedOrigins =
  process.env.NODE_ENV === "development"
    ? ["http://localhost:5173", "http://localhost:5174"]
    : (process.env.FRONTEND_URL || "")
        .split(",")
        .map((o) => stripTrailingSlash(o.trim()))
        .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header) and configured origins.
      if (!origin || allowedOrigins.includes(stripTrailingSlash(origin))) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// NOTE: No express.json() for wish routes — multer handles multipart parsing
// We still need json for push routes
app.use("/api/push", express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/wishes", authMiddleware, wishRoutes);
app.use("/api/push", authMiddleware, pushRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`🔴 Girigo backend running on port ${PORT}`);
});