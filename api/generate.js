// ============================================================
// /api/generate — proxy serverless (Vercel) hacia Claude
//
// Por qué existe: el navegador NO puede llamar a Anthropic directo
// (CORS lo bloquea y expondría la API key). Esta función corre en el
// servidor: guarda la key en una variable de entorno y, de paso,
// registra el nombre del negocio en Supabase para capturar leads.
//
// Contrato: el front envía { prompt: string, lead?: { negocio, tipo } }
// Respuesta: el JSON crudo de Anthropic (el front lee data.content[].text)
// ============================================================

const MODEL = "claude-sonnet-4-6"; // rápido y barato para el demo
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Usa POST." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta ANTHROPIC_API_KEY en el servidor." });
  }

  // Vercel ya parsea el body JSON en funciones Node.
  const body = req.body || {};
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return res.status(400).json({ error: "Falta 'prompt'." });
  }

  // 1) Registrar el lead en Supabase — best-effort, no bloquea la IA.
  //    Si Supabase no está configurado o falla, seguimos igual.
  if (body.lead && body.lead.negocio) {
    logLead(body.lead).catch((e) => console.error("Supabase lead falló:", e.message));
  }

  // 2) Llamar a Claude.
  try {
    const aiRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await aiRes.json();
    if (!aiRes.ok) {
      console.error("Anthropic error:", aiRes.status, data);
      return res.status(502).json({ error: "La IA no respondió bien.", detail: data });
    }
    return res.status(200).json(data);
  } catch (e) {
    console.error("Fallo llamando a la IA:", e.message);
    return res.status(502).json({ error: "No se pudo conectar con la IA." });
  }
}

// Inserta una fila en la tabla `leads` vía la REST API de Supabase.
// Usa la service role key (secreta, solo en el servidor).
async function logLead(lead) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return; // Supabase opcional: si no está, no pasa nada.

  await fetch(`${url}/rest/v1/leads`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: key,
      authorization: `Bearer ${key}`,
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      negocio: String(lead.negocio).slice(0, 200),
      tipo: String(lead.tipo || "afiche").slice(0, 80),
    }),
  });
}
