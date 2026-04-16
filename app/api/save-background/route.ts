import { persistCustomBackgroundPng } from '@/lib/customizer/persistCustomBackground'

export const runtime = 'nodejs'

const MAX_BYTES = 10 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { imageDataUrl?: string; label?: string }

    if (!body.imageDataUrl || typeof body.imageDataUrl !== 'string') {
      return Response.json({ error: 'Missing imageDataUrl' }, { status: 400 })
    }

    const match = /^data:image\/png;base64,([\s\S]+)$/.exec(body.imageDataUrl)
    if (!match) {
      return Response.json({ error: 'Expected a PNG data URL' }, { status: 400 })
    }

    const buffer = Buffer.from(match[1], 'base64')
    if (buffer.length > MAX_BYTES) {
      return Response.json({ error: 'Image too large (max 10 MB)' }, { status: 413 })
    }

    const result = await persistCustomBackgroundPng({
      buffer,
      label: typeof body.label === 'string' ? body.label : undefined,
    })

    if (!result) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 503 },
      )
    }

    return Response.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[save-background]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
