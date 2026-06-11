const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// ─── READ KEYS FROM ENVIRONMENT VARIABLES ───────────────────────
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const GROQ_KEY     = process.env.GROQ_KEY;
const GEMINI_KEY   = process.env.GEMINI_KEY;
const MISTRAL_KEY  = process.env.MISTRAL_KEY;
const TOGETHER_KEY = process.env.TOGETHER_KEY;
const QWEN_KEY     = process.env.QWEN_KEY;

// ─── HEALTH CHECK ───────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Aura Max backend is running!" });
});

// ─── MAIN CHAT ROUTE ────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { model, message } = req.body;

  if (!model || !message) {
    return res.status(400).json({ error: "model and message are required" });
  }

  try {
    let reply = "";

    // ── DeepSeek R1 ──────────────────────────────────────────────
    if (model === "deepseek-r1") {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-reasoner",
          messages: [{ role: "user", content: message }]
        })
      });
      const data = await response.json();
      reply = data.choices[0].message.content;
    }

    // ── Qwen 3 ───────────────────────────────────────────────────
    else if (model === "qwen3") {
      const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${QWEN_KEY}`
        },
        body: JSON.stringify({
          model: "qwen-max",
          messages: [{ role: "user", content: message }]
        })
      });
      const data = await response.json();
      reply = data.choices[0].message.content;
    }

    // ── Gemini 2.0 Flash ─────────────────────────────────────────
    else if (model === "gemini-flash") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }]
          })
        }
      );
      const data = await response.json();
      reply = data.candidates[0].content.parts[0].text;
    }

    // ── Llama 4 via Groq ─────────────────────────────────────────
    else if (model === "llama4") {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: message }]
        })
      });
      const data = await response.json();
      reply = data.choices[0].message.content;
    }

    // ── Mistral ──────────────────────────────────────────────────
    else if (model === "mistral") {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MISTRAL_KEY}`
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [{ role: "user", content: message }]
        })
      });
      const data = await response.json();
      reply = data.choices[0].message.content;
    }

    // ── FLUX / SDXL Image Generation ─────────────────────────────
    else if (model === "flux" || model === "sdxl") {
      const modelName = model === "flux"
        ? "black-forest-labs/FLUX.1-schnell-Free"
        : "stabilityai/stable-diffusion-xl-base-1.0";

      const response = await fetch("https://api.together.xyz/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TOGETHER_KEY}`
        },
        body: JSON.stringify({
          model: modelName,
          prompt: message,
          n: 1,
          width: 512,
          height: 512
        })
      });
      const data = await response.json();
      return res.json({ image_url: data.data[0].url });
    }

    else {
      return res.status(400).json({ error: `Unknown model: ${model}` });
    }

    res.json({ reply });

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Something went wrong: " + err.message });
  }
});

// ─── START SERVER ────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Aura Max backend running on port ${PORT}`);
});
