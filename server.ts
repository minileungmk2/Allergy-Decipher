import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

// WARNING: Hardcoding credentials is insecure. 
// Replace these placeholders with your actual Vercel KV credentials.
let kvClient: any = null;

function getKV() {
  if (!kvClient) {
    // Priority: Hardcoded values you provided
    const fallbackUrl = "https://modest-bison-130262.upstash.io";
    const fallbackToken = "gQAAAAAAAfzWAAIgcDJkMjk2Zjk3YWQ2ZGE0OTJiYjJlY2I5NjFjNTVlZjM1NA";

    let url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").trim();
    let token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();

    // Special case for AI Studio users who might paste the full rediss:// URL in KV_URL
    if (!url && process.env.KV_URL && process.env.KV_URL.startsWith("https")) {
      url = process.env.KV_URL;
    }

    // If env vars are missing or placeholders, use your hardcoded ones
    if (!url || url.includes("<YOUR") || url.includes("PLACEHOLDER") || url.startsWith("rediss://")) {
      url = fallbackUrl;
    }
    if (!token || token.includes("<YOUR") || token.includes("PLACEHOLDER")) {
      token = fallbackToken;
    }
    
    console.log("Initializing Upstash Redis with URL:", url.substring(0, 30));
    try {
      kvClient = new Redis({
        url: url.trim(),
        token: token.trim(),
      });
    } catch (e) {
      console.error("Failed to create Redis client instance:", e);
    }
  }
  return kvClient;
}

export const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// API routes - declared synchronously to avoid race conditions on Vercel
app.get("/api/debug-kv", async (req, res) => {
  try {
    const kv = getKV();
    if (!kv) return res.json({ status: "error", message: "KV not initialized (checks failed)" });
    
    const start = Date.now();
    await kv.set("allerscan_test_ping", Date.now());
    const val = await kv.get("allerscan_test_ping");
    return res.json({ 
      status: "success", 
      latency: Date.now() - start, 
      val,
      env_url: !!process.env.KV_REST_API_URL,
      env_token: !!process.env.KV_REST_API_TOKEN
    });
  } catch (e: any) {
    return res.status(500).json({ status: "error", message: e.message, stack: e.stack });
  }
});

app.get("/api/data", async (req, res) => {
  const reqId = Math.random().toString(36).substring(7);
  console.log(`[${reqId}] GET /api/data`);
  try {
    const kv = getKV();
    if (!kv) {
      console.warn(`[${reqId}] KV not configured (no URL/token)`);
      return res.json({ profiles: null, history: null, warning: "KV not configured" });
    }

    const startTime = Date.now();
    console.log(`[${reqId}] KV: Starting fetch...`);
    
    const [profiles, history] = await Promise.all([
      kv.get("allerscan_profiles").catch((e: any) => { console.error(`[${reqId}] Error fetching profiles:`, e); throw e; }),
      kv.get("allerscan_history").catch((e: any) => { console.error(`[${reqId}] Error fetching history:`, e); throw e; })
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`[${reqId}] KV Fetch completed in ${duration}ms. Profiles: ${profiles ? 'found' : 'missing'}`);
    
    res.json({ profiles, history });
  } catch (error: any) {
    console.error(`[${reqId}] KV FETCH CRITICAL ERROR:`, error);
    res.status(500).json({ 
      error: "Failed to fetch data from KV.", 
      message: error?.message || "Unknown error",
      details: error?.code || error?.name
    });
  }
});

app.post("/api/data", async (req, res) => {
  const reqId = Math.random().toString(36).substring(7);
  console.log(`[${reqId}] POST /api/data`);
  try {
    const kv = getKV();
    if (!kv) {
      console.warn(`[${reqId}] KV not configured in POST /api/data`);
      return res.status(503).json({ error: "KV storage not configured." });
    }

    const { profiles, history } = req.body;
    const startTime = Date.now();
    
    console.log(`[${reqId}] KV: Starting save...`);
    const operations = [];
    if (profiles !== undefined) {
      operations.push(kv.set("allerscan_profiles", profiles));
    }
    if (history !== undefined) {
      operations.push(kv.set("allerscan_history", history));
    }
    
    await Promise.all(operations);
    
    const duration = Date.now() - startTime;
    console.log(`[${reqId}] KV Save success in ${duration}ms`);
    
    res.json({ status: "ok" });
  } catch (error: any) {
    console.error(`[${reqId}] KV SAVE CRITICAL ERROR:`, error);
    res.status(500).json({ error: "Failed to save data to KV.", message: error?.message });
  }
});

// Catch-all for API to identify routing issues
app.all("/api/*", (req, res) => {
  console.log(`[API 404] No handler for: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: "API route not found on this server", 
    path: req.path,
    serverTime: new Date().toISOString()
  });
});

async function setupApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Only listen if this is the main module (not on Vercel)
  if (process.env.VITE || process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupApp().catch(err => {
  console.error("Failed to setup app:", err);
});

export default app;
