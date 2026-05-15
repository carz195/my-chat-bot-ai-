// ============================================================
// AI CHAT HANDLER
// ============================================================
// This file runs on Vercel as a serverless function. It receives
// the chat history from the browser, asks Google Gemini for a
// reply, and streams the reply back chunk-by-chunk as SSE.
//
// MOST STUDENTS WILL ONLY EDIT THE SYSTEM_PROMPT BELOW.
// ============================================================

import { GoogleGenAI } from "@google/genai";

// ============================================================
// CHANGE THIS to give your AI a personality!
// Try: "You are a sarcastic pirate." or "You are a calm yoga
// instructor who answers every question with a deep breath."
// ============================================================
const SYSTEM_PROMPT =
  "You are a friendly, helpful assistant. Keep answers concise unless asked otherwise.";

const MODEL = "gemini-2.5-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error:
          "GEMINI_API_KEY is not set. Add it to .env locally, or to Vercel env vars in production.",
      })
    );
    return;
  }

  // Body may already be parsed (Vercel/Express) or a raw string.
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const messages = Array.isArray(body?.messages) ? body.messages : [];

  if (messages.length === 0) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "messages array is required" }));
    return;
  }

  // Convert our simple {role, text} messages into Gemini's format.
  // Gemini uses role "model" instead of "assistant".
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.text ?? "") }],
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // Flush headers immediately so chunks reach the browser as they arrive,
  // rather than getting buffered until the function ends on Vercel's runtime.
  res.flushHeaders?.();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    for await (const chunk of stream) {
      const text = chunk?.text ?? "";
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    res.write(
      `data: ${JSON.stringify({
        error: err?.message ?? "Unknown error from AI provider",
      })}\n\n`
    );
    res.end();
  }
}
