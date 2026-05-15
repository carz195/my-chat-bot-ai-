// ============================================================
// LOCAL DEV SERVER (Codespaces / localhost only)
// ============================================================
// Vercel doesn't run this file in production — it auto-detects
// `api/chat.js` and `public/`. This file just lets you run the
// same app locally with `npm run dev`.
// ============================================================

import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

import chatHandler from "./api/chat.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: "1mb" }));

// Serve the static frontend.
app.use(express.static(join(__dirname, "public")));

// Wire the same handler Vercel uses in production.
app.post("/api/chat", (req, res) => chatHandler(req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Dev server running on http://localhost:${PORT}`);
});
