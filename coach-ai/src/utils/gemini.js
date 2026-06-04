const GEMINI_MODEL = 'gemini-1.5-flash'
const API_BASE = 'https://generativelanguage.googleapis.com/v1/models'

export async function geminiText(apiKey, prompt) {
  const res = await fetch(`${API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function geminiImage(apiKey, base64, mimeType, prompt) {
  const res = await fetch(`${API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [
        { inline_data: { mime_type: mimeType, data: base64 } },
        { text: prompt },
      ]}],
      generationConfig: { temperature: 0.1 },
    }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export function parseJSON(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
}
