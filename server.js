const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const keys = require("./keys.json");

const app = express();
app.use(cors());
app.use(express.json());

// ─── HEALTH CHECK ───────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Aura Max backend is running!" });
});

// ─── MAIN CHAT ROUTE ────────────────────────────────────────────
// Frontend sends: { model: "deepseek-r1", message: "hello" }
// Backend returns: { reply: "AI response here" }

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
          "Authorization": `Bearer ${keys.DEEPSEEK_KEY}`
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
          "Authorization": `Bearer ${keys.QWEN_KEY}`
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.GEMINI_KEY}`,
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
          "Authorization": `Bearer ${keys.GROQ_KEY}`
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
          "Authorization": `Bearer ${keys.MISTRAL_KEY}`
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
          "Authorization": `Bearer ${keys.TOGETHER_KEY}`
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
      // For image models, return the image URL instead
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
