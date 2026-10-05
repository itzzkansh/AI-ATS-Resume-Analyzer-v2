import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: {
    success: false,
    message: "Too many attempts. Try again in a few minutes.",
  },
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: {
    success: false,
    message: "Upload limit reached. Try again later.",
  },
});

app.get("/", (req, res) =>
  res.json({ success: true, message: "AI ATS Resume Analyzer API" }),
);
app.get("/api/health", (req, res) => res.json({ success: true, status: "ok" }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/resume/upload", uploadLimiter);
app.use("/api/resume", resumeRoutes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large. Max size is 5MB."
        : err.message;
    return res.status(400).json({ success: false, message });
  }
  if (err.status) {
    return res
      .status(err.status)
      .json({ success: false, message: err.message });
  }
  console.error(err);
  res.status(500).json({ success: false, message: "Server error" });
});

export default app;
