import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from "@vercel/kv";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === 'GET') {
    try {
      const [profiles, history] = await Promise.all([
        kv.get("allerscan_profiles"),
        kv.get("allerscan_history")
      ]);
      return response.json({ 
        profiles: profiles || [], 
        history: history || [] 
      });
    } catch (error: any) {
      console.error("Fetch error:", error);
      return response.status(500).json({ error: "Fetch failed", message: error.message });
    }
  }

  if (request.method === 'POST') {
    try {
      const { profiles, history } = request.body;
      const ops = [];
      if (profiles !== undefined) ops.push(kv.set("allerscan_profiles", profiles));
      if (history !== undefined) ops.push(kv.set("allerscan_history", history));
      await Promise.all(ops);
      return response.json({ status: "ok" });
    } catch (error: any) {
      console.error("Save error:", error);
      return response.status(500).json({ error: "Save failed", message: error.message });
    }
  }

  return response.status(405).end();
}
