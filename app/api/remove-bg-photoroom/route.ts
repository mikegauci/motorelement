import sharp from 'sharp'
import { trimPngToAlphaBounds } from '@/lib/image/alphaBounds'
import { fal } from '@fal-ai/client'

const PHOTOROOM_ENDPOINT = 'https://sdk.photoroom.com/v1/segment'

async function restoreShadowFromOriginal(
  originalBuffer: Buffer,
  photoroomBuffer: Buffer,
): Promise<Buffer> {
  const ORIGINAL_DARK_RGB_MAX = 200

  try {
    const [orig, photo] = await Promise.all([
      sharp(originalBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
      sharp(photoroomBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    ])

    if (orig.info.width !== photo.info.width || orig.info.height !== photo.info.height) {
      return photoroomBuffer
    }

    const w = photo.info.width
    const h = photo.info.height
    const out = Buffer.from(photo.data)
    const origData = orig.data

    for (let i = 0; i < out.length; i += 4) {
      const origR = origData[i]
      const origG = origData[i + 1]
      const origB = origData[i + 2]
      if (Math.max(origR, origG, origB) > ORIGINAL_DARK_RGB_MAX) continue

      const carA = out[i + 3] / 255
      out[i] = Math.round(out[i] * carA)
      out[i + 1] = Math.round(out[i + 1] * carA)
      out[i + 2] = Math.round(out[i + 2] * carA)
      out[i + 3] = 255
    }

    return await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
  } catch {
    return photoroomBuffer
  }
}

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
    const restored = await restoreShadowFromOriginal(buffer, buf)
    const trimmed = await trimPngToAlphaBounds(restored, 8, 100)

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
