import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@vercel/kv";
import dotenv from "dotenv";

dotenv.config();

// WARNING: Hardcoding credentials is insecure. 
// Replace these placeholders with your actual Vercel KV credentials.
let kvClient: any = null;

function getKV() {
  if (!kvClient) {
    const url = process.env.KV_REST_API_URL || "https://modest-bison-130262.upstash.io";
    const token = process.env.KV_REST_API_TOKEN || "gQAAAAAAAfzWAAIgcDJkMjk2Zjk3YWQ2ZGE0OTJiYjJlY2I5NjFjNTVlZjM1NA";
    
    if (!url || !token || url.includes("PLACEHOLDER")) {
      console.warn("KV credentials missing or placeholders used. Persistence will be limited.");
      return null;
    }
    
    kvClient = createClient({
      url,
      token,
    });
  }
  return kvClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.get("/api/data", async (req, res) => {
    try {
      const kv = getKV();
      if (!kv) {
        return res.json({ profiles: null, history: null, warning: "KV not configured" });
      }

      const startTime = Date.now();
      const profiles = await kv.get("allerscan_profiles");
      const history = await kv.get("allerscan_history");
      const duration = Date.now() - startTime;
      
      console.log(`[KV Fetch] Request took ${duration}ms`);
      res.json({ profiles, history });
    } catch (error) {
      console.error("KV fetch error:", error);
      res.status(500).json({ error: "Failed to fetch data from KV." });
    }
  });

  app.post("/api/data", async (req, res) => {
    try {
      const kv = getKV();
      if (!kv) {
        return res.status(503).json({ error: "KV storage not configured." });
      }

      const { profiles, history } = req.body;
      const startTime = Date.now();
      
      if (profiles !== undefined) {
        await kv.set("allerscan_profiles", profiles);
      }
      if (history !== undefined) {
        await kv.set("allerscan_history", history);
      }
      
      const duration = Date.now() - startTime;
      console.log(`[KV Save] Request took ${duration}ms`);
      
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
