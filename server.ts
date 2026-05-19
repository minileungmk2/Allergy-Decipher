import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

// WARNING: Hardcoding credentials is insecure. 
// Replace these placeholders with your actual Vercel KV credentials.
let kvClient: any = null;

function getKV() {
  if (!kvClient) {
    let url = (process.env.KV_REST_API_URL || "https://modest-bison-130262.upstash.io").trim();
    let token = (process.env.KV_REST_API_TOKEN || "gQAAAAAAAfzWAAIgcDJkMjk2Zjk3YWQ2ZGE0OTJiYjJlY2I5NjFjNTVlZjM1NA").trim();
    
    if (!url || !token || url.includes("<YOUR") || url.includes("PLACEHOLDER")) {
      console.warn("KV credentials missing or appear to be placeholders. Sync will be disabled.");
      return null;
    }
    
    // Ensure URL has protocol
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    
    console.log("Initializing Upstash Redis with URL:", url.substring(0, 30));
    try {
      kvClient = new Redis({
        url,
        token,
      });
    } catch (e) {
      console.error("Failed to create Redis client instance:", e);
    }
  }
  return kvClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.get("/api/data", async (req, res) => {
    console.log("[API] GET /api/data - Request received");
    try {
      const kv = getKV();
      if (!kv) {
        console.warn("[API] KV not configured in GET /api/data - url or token missing");
        return res.json({ profiles: null, history: null, warning: "KV not configured" });
      }

      const startTime = Date.now();
      console.log("[API] KV: Starting fetch...");
      
      const [profiles, history] = await Promise.all([
        kv.get("allerscan_profiles").catch(e => { console.error("Error fetching profiles:", e); return null; }),
        kv.get("allerscan_history").catch(e => { console.error("Error fetching history:", e); return null; })
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`[KV Fetch] Completed in ${duration}ms. Profiles exists: ${!!profiles}`);
      
      res.json({ profiles, history });
    } catch (error: any) {
      console.error("KV fetch critical error:", error);
      res.status(500).json({ error: "Failed to fetch data from KV.", message: error?.message, stack: error?.stack });
    }
  });

  app.post("/api/data", async (req, res) => {
    console.log("[API] POST /api/data - Payload size:", JSON.stringify(req.body).length);
    try {
      const kv = getKV();
      if (!kv) {
        console.warn("[API] KV not configured in POST /api/data");
        return res.status(503).json({ error: "KV storage not configured." });
      }

      const { profiles, history } = req.body;
      const startTime = Date.now();
      
      console.log("[API] KV: Starting save...");
      const operations = [];
      if (profiles !== undefined) {
        operations.push(kv.set("allerscan_profiles", profiles));
      }
      if (history !== undefined) {
        operations.push(kv.set("allerscan_history", history));
      }
      
      await Promise.all(operations);
      
      const duration = Date.now() - startTime;
      console.log(`[KV Save] Completed in ${duration}ms`);
      
      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("KV save critical error:", error);
      res.status(500).json({ error: "Failed to save data to KV.", message: error?.message });
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
