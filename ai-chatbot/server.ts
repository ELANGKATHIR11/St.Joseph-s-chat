import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy-initialized GoogleGenAI client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please add it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" })); // Support larger payloads if needed

  // API Check / Health Route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Favicon fallback handler
  app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
  });

  // Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Invalid request. 'messages' must be an array." });
        return;
      }

      // Find the last user message
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      const userText = lastUserMsg ? lastUserMsg.content : "";

      // Call our FastAPI backend with guardrails
      const fastApiUrl = "http://127.0.0.1:8000/api/chat";
      const fastApiResponse = await fetch(fastApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userText,
          session_id: "ai-chatbot-session",
          language: "en"
        })
      });

      if (!fastApiResponse.ok) {
        throw new Error(`FastAPI backend returned status ${fastApiResponse.status}`);
      }

      const responseData = (await fastApiResponse.json()) as any;
      
      // Combine answer and disclaimer
      let replyText = responseData.answer;
      if (responseData.disclaimer) {
        replyText += `\n\n*⚠️ ${responseData.disclaimer}*`;
      }

      // Map citations to the expected sources format
      const sources = (responseData.citations || []).map((c: any) => ({
        title: `${c.title} (${c.publisher})`,
        uri: c.source_url
      }));

      res.json({
        role: "assistant",
        content: replyText,
        sources: sources.length > 0 ? sources : undefined,
      });
    } catch (error: any) {
      console.error("Error in /api/chat forwarding:", error);
      res.status(500).json({
        error: error.message || "An unexpected error occurred while communicating with MedLaw Guard backend.",
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
