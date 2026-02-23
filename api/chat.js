// api/chat.js
export default async function handler(req, res) {
  // 允许跨域（NoCode/浏览器能调用）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Proxy-Token");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // 简单防盗用：NoCode 请求里带一个你自定义的 token
    const proxyToken = req.headers["x-proxy-token"];
    if (!proxyToken || proxyToken !== process.env.PROXY_TOKEN) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { question } = req.body || {};
    if (!question) return res.status(400).json({ error: "Missing question" });

    const r = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: question }
        ],
        stream: false,
      }),
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    const text = data?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ text, raw: data });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
