import { fal } from '@fal-ai/client'

const BG_REMOVE_MODEL = 'fal-ai/birefnet/v2'
const BG_REMOVE_VARIANT = 'General Use (Heavy)'

export async function POST(request: Request) {
  const apiKey = process.env.FAL_API_KEY
  if (!apiKey || typeof apiKey !== 'string') {
    return Response.json({ error: 'Server missing FAL_API_KEY' }, { status: 500 })
  }

  const body = (await request.json()) as {
    imageUrl?: string
    imageBase64?: string
  }
  const source = body.imageUrl || body.imageBase64
  if (!source || typeof source !== 'string') {
    return Response.json({ error: 'imageUrl or imageBase64 is required' }, { status: 400 })
  }

  try {
    fal.config({ credentials: apiKey.trim() })

    const result = await fal.subscribe(BG_REMOVE_MODEL, {
      input: {
        image_url: source,
        model: BG_REMOVE_VARIANT,
        refine_foreground: true,
        output_format: 'png',
      },
      logs: false,
    })

    const data = result.data as {
      image?: { url?: string }
    }
    const outUrl = data?.image?.url
    if (!outUrl) {
      return Response.json(
        { error: 'No output image URL from BiRefNet', detail: result.data },
        { status: 500 }
      )
    }

    const imgRes = await fetch(outUrl)
    if (!imgRes.ok) {
      return Response.json(
        { error: `Failed to fetch Bria output (${imgRes.status})` },
        { status: 502 }
      )
    }
    const buf = await imgRes.arrayBuffer()
    return new Response(buf, {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    })
  } catch (err: unknown) {
    const falErr = err as { message?: string; body?: unknown }
    const message = falErr?.message || String(err)
    const detail =
      falErr?.body && typeof falErr.body === 'object' ? JSON.stringify(falErr.body) : falErr?.body
    return Response.json(
      { error: detail ? `${message}: ${detail}` : message },
      { status: 500 }
    )
  }
}
