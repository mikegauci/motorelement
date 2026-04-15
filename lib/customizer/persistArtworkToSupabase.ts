import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

type PersistArtworkResult = {
  id: string
  publicUrl: string
  storagePath: string
  bucket: string
}

export async function persistArtworkPngBuffer({
  buffer,
  contentType = 'image/png',
  metadata = {},
}: {
  buffer: Buffer
  contentType?: string
  metadata?: Record<string, unknown>
}): Promise<PersistArtworkResult | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!baseUrl || !secretKey || !buffer?.length) {
    return null
  }

  const supabase = createClient(baseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const day = new Date().toISOString().slice(0, 10)
  const storagePath = `exports/${day}/${randomUUID()}.png`
  const bucket = 'artwork'
  const ct = String(contentType || 'image/png').split(';')[0].trim() || 'image/png'

  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: ct,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: row, error: insertError } = await supabase
    .from('artwork')
    .insert({
      storage_path: storagePath,
      content_type: ct,
      bytes: buffer.length,
      metadata,
    })
    .select('id')
    .single()

  if (insertError) {
    try {
      await supabase.storage.from(bucket).remove([storagePath])
    } catch {
      /* ignore */
    }
    throw insertError
  }

  const root = baseUrl.replace(/\/$/, '')
  const publicUrl = `${root}/storage/v1/object/public/${bucket}/${storagePath}`

  return {
    id: row.id,
    publicUrl,
    storagePath,
    bucket,
  }
}
