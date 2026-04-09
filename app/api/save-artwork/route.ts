import { persistArtworkPngBuffer } from '@/lib/customizer/persistArtworkToSupabase'

export const runtime = 'nodejs'

const MAX_BYTES = 52 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'Missing PNG file' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_BYTES) {
      return Response.json({ error: 'File too large' }, { status: 413 })
    }
    const buffer = Buffer.from(arrayBuffer)

    const metadataRaw = formData.get('metadata')
    let metadata: Record<string, unknown> = {}
    if (typeof metadataRaw === 'string' && metadataRaw.trim()) {
      try {
        metadata = JSON.parse(metadataRaw) as Record<string, unknown>
      } catch {
        metadata = {}
      }
    }

    const contentType = typeof file.type === 'string' && file.type ? file.type : 'image/png'
    const result = await persistArtworkPngBuffer({ buffer, contentType, metadata })
    if (!result) {
      return Response.json(
        { error: 'Supabase not configured (set SUPABASE_SECRET_KEY and NEXT_PUBLIC_SUPABASE_URL)' },
        { status: 503 }
      )
    }

    return Response.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[save-artwork]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
