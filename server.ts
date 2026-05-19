import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@vercel/kv";
import dotenv from "dotenv";

dotenv.config();

// WARNING: Hardcoding credentials is insecure. 
// Replace these placeholders with your actual Vercel KV credentials.
const kv = createClient({
  url: process.env.KV_REST_API_URL || "https://modest-bison-130262.upstash.io",
  token: process.env.KV_REST_API_TOKEN || "gQAAAAAAAfzWAAIgcDJkMjk2Zjk3YWQ2ZGE0OTJiYjJlY2I5NjFjNTVlZjM1NA",
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.get("/api/data", async (req, res) => {
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
