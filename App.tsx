import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.status(200).json({
    message: "pong",
    time: new Date().toISOString(),
    vercel: !!process.env.VERCEL
  });
}
