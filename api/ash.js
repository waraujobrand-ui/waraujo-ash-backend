export default async function handler(req, res) {
  // CORS (lets browser-based tools like ReqBin call this)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST required" });
  }

  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "Missing JSON body: { message: \"...\" }" });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Ash, a sharp, confident AI assistant representing the Waraujo brand." },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await r.json();

    // 🔥 THIS is the important part: show the real OpenAI error if it fails
    if (!r.ok) {
      return res.status(r.status).json({
        error: "OpenAI request failed",
        status: r.status,
        openai: data,
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "OpenAI returned no message content",
        openai: data,
      });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err?.message || err) });
  }
}
