// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from "next";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const ASSISTANT_ID = "asst_SJGIYEAkr8Cn6jTw2pyakRjx";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const { messages, threadId } = req.body;
  console.log("➡️ Recibido mensaje:", messages[messages.length - 1]?.content);
  console.log("➡️ Enviando a thread:", threadId);

  try {
    const baseUrl = "https://api.openai.com/v1";
    let thread_id = threadId;

    // 1. Crear thread si no existe
    if (!thread_id) {
      const threadRes = await fetch(`${baseUrl}/threads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
      });
      const threadData = await threadRes.json();

      if (!threadRes.ok || !threadData.id) {
        console.error("❌ Error creando thread:", threadData);
        return res.status(500).json({ error: "Error al crear el thread." });
      }

      thread_id = threadData.id;
      console.log("🧵 Nuevo thread creado:", thread_id);
    }

    // 2. Añadir mensaje
    await fetch(`${baseUrl}/threads/${thread_id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        role: "user",
        content: messages[messages.length - 1].content,
      }),
    });

    // 3. Crear run
    const runRes = await fetch(`${baseUrl}/threads/${thread_id}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({ assistant_id: ASSISTANT_ID }),
    });

    const run = await runRes.json();
    if (!runRes.ok || !run.id) {
      console.error("❌ Error al crear run:", run);
      return res.status(500).json({ error: "No se pudo ejecutar el asistente." });
    }

    // 4. Esperar a que termine
    let status = run.status;
    let attempts = 0;
    let runResult = run;

    while (status !== "completed" && status !== "failed" && attempts < 10) {
      console.log(`⏳ Intento ${attempts + 1} – Estado: ${status}`);
      await new Promise((r) => setTimeout(r, 1500));

      const check = await fetch(`${baseUrl}/threads/${thread_id}/runs/${run.id}`, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      });

      runResult = await check.json();
      console.log("📥 Respuesta del run:", runResult);
      status = runResult.status;
      attempts++;
    }

    if (status !== "completed") {
      console.error("❌ El asistente nunca respondió o se demoró demasiado.");
      return res.status(500).json({ error: "El asistente no respondió a tiempo." });
    }

    // 5. Obtener mensaje final
    const messagesRes = await fetch(`${baseUrl}/threads/${thread_id}/messages`, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
    });

    const messagesData = await messagesRes.json();
    const assistantReply = messagesData.data.find(
      (msg: { role: string; content: { text?: { value: string }[] } }) => msg.role === "assistant"
    );
    
    console.log("✅ Respuesta del asistente:", assistantReply?.content[0]?.text?.value);
    
    return res.status(200).json({
      reply: {
        role: "assistant",
        content: assistantReply?.content[0]?.text?.value || "No se obtuvo respuesta.",
      },
      threadId: thread_id,
    });
  } catch {
    console.error("❌ Error capturado");
    return res.status(500).json({ error: "Error al comunicar con el asistente." });
  }  
}
