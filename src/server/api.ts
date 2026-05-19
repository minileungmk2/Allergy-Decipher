import express from "express";
import { kv } from "@vercel/kv";

const router = express.Router();

router.get("/hello", (req, res) => {
  res.json({ 
    message: "API is working", 
    time: new Date().toISOString(),
    vercel: !!process.env.VERCEL
  });
});

router.get("/debug-kv", async (req, res) => {
  try {
    const start = Date.now();
    await kv.set("allerscan_test_ping", Date.now());
    const val = await kv.get("allerscan_test_ping");
    return res.json({ 
      status: "success", 
      latency: Date.now() - start, 
      val,
      env: {
        url: !!process.env.KV_REST_API_URL,
        token: !!process.env.KV_REST_API_TOKEN
      }
    });
  } catch (e: any) {
    return res.status(500).json({ 
      status: "error", 
      message: e.message, 
      code: e.code
    });
  }
});

router.get("/data", async (req, res) => {
  const reqId = Math.random().toString(36).substring(7);
  try {
    const [profiles, history] = await Promise.all([
      kv.get("allerscan_profiles"),
      kv.get("allerscan_history")
    ]);
    res.json({ profiles: profiles || [], history: history || [] });
  } catch (error: any) {
    console.error(`[${reqId}] KV FETCH ERROR:`, error);
    res.status(500).json({ 
      error: "Failed to fetch data.", 
      message: error?.message || "Unknown error"
    });
  }
});

router.post("/data", async (req, res) => {
  const reqId = Math.random().toString(36).substring(7);
  try {
    const { profiles, history } = req.body;
    const operations = [];
    if (profiles !== undefined) operations.push(kv.set("allerscan_profiles", profiles));
    if (history !== undefined) operations.push(kv.set("allerscan_history", history));
    await Promise.all(operations);
    res.json({ status: "ok" });
  } catch (error: any) {
    console.error(`[${reqId}] KV SAVE ERROR:`, error);
    res.status(500).json({ error: "Failed to save data.", message: error?.message });
  }
});

export default router;
