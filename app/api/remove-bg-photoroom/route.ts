import { trimPngToAlphaBounds } from '@/lib/image/alphaBounds'
import { fal } from '@fal-ai/client'

const PHOTOROOM_ENDPOINT = 'https://sdk.photoroom.com/v1/segment'

async function uploadTransparentPngToFal(buf: Buffer): Promise<string | null> {
  try {
    const apiKey = process.env.FAL_API_KEY
    if (!apiKey || typeof apiKey !== 'string') return null
    fal.config({ credentials: apiKey.trim() })
    const blob = new Blob([new Uint8Array(buf)], { type: 'image/png' })
    return await fal.storage.upload(blob)
  } catch {
    return null
  }
}

function parseBase64DataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl)
  if (!m) return null
  return { mime: m[1], buffer: Buffer.from(m[2], 'base64') }
}

export async function POST(request: Request) {
  const apiKey = process.env.PHOTOROOM_API_KEY
  if (!apiKey || typeof apiKey !== 'string') {
    return Response.json({ error: 'Server missing PHOTOROOM_API_KEY' }, { status: 500 })
  }

  const body = (await request.json()) as {
    imageUrl?: string
    imageBase64?: string
  }

  let mime = 'image/png'
  let buffer: Buffer
  if (body.imageBase64 && typeof body.imageBase64 === 'string') {
    const parsed = parseBase64DataUrl(body.imageBase64)
    if (!parsed) {
      return Response.json({ error: 'Invalid imageBase64 data URL' }, { status: 400 })
    }
    mime = parsed.mime
    buffer = parsed.buffer
  } else if (body.imageUrl && typeof body.imageUrl === 'string') {
    if (!/^https?:\/\//i.test(body.imageUrl)) {
      return Response.json({ error: 'imageUrl must be http(s)' }, { status: 400 })
    }
    const upstream = await fetch(body.imageUrl)
    if (!upstream.ok) {
      return Response.json(
        { error: `Failed to fetch imageUrl (${upstream.status})` },
        { status: 502 }
      )
    }
    mime = upstream.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png'
    buffer = Buffer.from(await upstream.arrayBuffer())
  } else {
    return Response.json(
      { error: 'Provide imageUrl (https) or imageBase64 (data URL)' },
      { status: 400 }
    )
  }

  const form = new FormData()
  const blob = new Blob([new Uint8Array(buffer)], { type: mime })
  const ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png'
  form.append('image_file', blob, `input.${ext}`)

  try {
    const res = await fetch(PHOTOROOM_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey.trim(),
        Accept: 'image/png, application/json',
      },
      body: form,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return Response.json(
        { error: `Photoroom failed (${res.status}): ${text || res.statusText}` },
        { status: 502 }
      )
    }

    const buf = Buffer.from(await res.arrayBuffer())
    const trimmed = await trimPngToAlphaBounds(buf, 8, 100)

    const transparentUrl = await uploadTransparentPngToFal(trimmed)
    if (transparentUrl) {
      console.log(`\n[remove-bg-photoroom] Result (with transparency): ${transparentUrl}\n`)
    }

    return new Response(new Uint8Array(trimmed), {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Photoroom request failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
