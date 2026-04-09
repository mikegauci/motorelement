import { fal } from '@fal-ai/client'

const MODEL_ID = 'fal-ai/moondream3-preview/query'

const QUERY_PROMPT = `Look at the main car in this image. Identify its make and model (common public name). If a model year is visible on a badge or is clearly inferable from the body style, include it.

Respond with ONLY valid JSON (no markdown, no code fences), one line:
{"model":"<short text like Honda Civic Type R>","year":"<exactly four digits like 2022, or empty string if unknown>"}

If you cannot identify the car at all, respond with: {"model":"","year":""}`

function parseDataUrl(dataUrl: string) {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl)
  if (!m) throw new Error('Invalid image data URL')
  return { mime: m[1], base64: m[2] }
}

async function uploadDataUrl(dataUrl: string) {
  const { mime, base64 } = parseDataUrl(dataUrl)
  const buffer = Buffer.from(base64, 'base64')
  const blob = new Blob([buffer], { type: mime })
  return fal.storage.upload(blob)
}

function normalizeYear(raw: unknown) {
  if (raw == null) return ''
  const s = String(raw).trim()
  const m = s.match(/\b(19|20)\d{2}\b/)
  return m ? m[0] : ''
}

function extractJsonObject(text: string | undefined) {
  if (!text || typeof text !== 'string') return null
  let t = text.trim()
  const fenced = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(t)
  if (fenced) t = fenced[1].trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(t.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

function parseGuessOutput(output: unknown) {
  const obj = extractJsonObject(typeof output === 'string' ? output : undefined)
  if (!obj || typeof obj !== 'object') return { model: '', year: '' }
  const model = typeof obj.model === 'string' ? obj.model.trim() : ''
  const year = normalizeYear(obj.year)
  return { model, year }
}

export async function POST(request: Request) {
  const apiKey = process.env.FAL_API_KEY
  const body = (await request.json()) as { carImageDataUrl?: string }

  if (!apiKey || typeof apiKey !== 'string') {
    return Response.json({ error: 'Server missing FAL_API_KEY' }, { status: 500 })
  }
  if (!body.carImageDataUrl || typeof body.carImageDataUrl !== 'string') {
    return Response.json({ error: 'Missing car image' }, { status: 400 })
  }

  try {
    fal.config({ credentials: apiKey.trim() })
    const imageUrl = await uploadDataUrl(body.carImageDataUrl)

    const result = await fal.subscribe(MODEL_ID, {
      input: {
        image_url: imageUrl,
        prompt: QUERY_PROMPT,
        reasoning: false,
      },
      logs: false,
    })

    const output = result?.data?.output
    const { model, year } = parseGuessOutput(output)

    return Response.json({ model, year })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message, model: '', year: '' }, { status: 500 })
  }
}
