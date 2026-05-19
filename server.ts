import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import apiRouter from "./src/server/api";

dotenv.config();

export const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Mount API routes
app.use("/api", apiRouter);

if (process.env.NODE_ENV !== "production") {
  (async () => {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })().catch(err => console.error("Dev server failed:", err));
} else {
  // Production branch
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("SPA entry point not found. Build may have failed.");
      }
    });
  }
  
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

export default app;

