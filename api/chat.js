export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Use POST" });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const system = process.env.ASH_SYSTEM_PROMPT;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    if (!system) {
      return res.status(500).json({ error: "Missing ASH_SYSTEM_PROMPT" });
    }

    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Body must include messages array"
      });
    }

    // Keep last 20 messages only (basic safety trim)
    const trimmed = messages.slice(-20);

    const payload = {
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: system },
        ...trimmed
      ]
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Model call failed",
        details: data
      });
    }

    const reply =
      data.output_text ||
      (data.output?.[0]?.content?.find(c => c.type === "output_text")?.text) ||
      "...";

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: String(error)
    });
  }
}
