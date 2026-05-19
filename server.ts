import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { kv } from "@vercel/kv";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.get("/api/data", async (req, res) => {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("Vercel KV not configured. Using empty data.");
      return res.json({ profiles: [], history: [] });
    }
    try {
      const profiles = await kv.get("allerscan_profiles") || [];
      const history = await kv.get("allerscan_history") || [];
      res.json({ profiles, history });
    } catch (error) {
      console.error("KV fetch error:", error);
      res.status(500).json({ error: "Failed to fetch data from KV." });
    }
  });

  app.post("/api/data", async (req, res) => {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("Vercel KV not configured. Cannot save data.");
      return res.status(400).json({ error: "KV not configured" });
    }
    try {
      const { profiles, history } = req.body;
      if (profiles) await kv.set("allerscan_profiles", profiles);
      if (history) await kv.set("allerscan_history", history);
      res.json({ status: "ok" });
    } catch (error) {
      console.error("KV save error:", error);
      res.status(500).json({ error: "Failed to save data to KV." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
