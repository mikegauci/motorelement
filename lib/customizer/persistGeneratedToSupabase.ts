import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

function extFromMime(mime: string | null) {
  const m = (mime || '').split(';')[0].trim().toLowerCase()
  if (m === 'image/jpeg') return 'jpg'
  if (m === 'image/webp') return 'webp'
  if (m === 'image/gif') return 'gif'
  return 'png'
}

export type PersistFalKind = 'car' | 'background'

export type PersistFalResult = {
  id: string
  publicUrl: string
  storagePath: string
  bucket: string
}

export async function persistFalImageToSupabase({
  imageUrl,
  kind,
  metadata = {},
}: {
  imageUrl: string
  kind: PersistFalKind
  metadata?: Record<string, unknown>
}): Promise<PersistFalResult | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!baseUrl || !secretKey || typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return null
  }

  const supabase = createClient(baseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const res = await fetch(imageUrl)
  if (!res.ok) {
    throw new Error(`Failed to fetch generated image (${res.status})`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/png'
  const ext = extFromMime(contentType)
  const day = new Date().toISOString().slice(0, 10)
  const storagePath = `generated/${day}/${randomUUID()}.${ext}`

  const bucket = kind === 'background' ? 'backgrounds' : 'car-images'
  const table = kind === 'background' ? 'generated_backgrounds' : 'generated_car_images'

  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, buf, {
    contentType: contentType.split(';')[0].trim(),
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: row, error: insertError } = await supabase
    .from(table)
    .insert({
      storage_path: storagePath,
      content_type: contentType.split(';')[0].trim(),
      bytes: buf.length,
      metadata,
    })
    .select('id')
    .single()

  if (insertError) {
    try {
      await supabase.storage.from(bucket).remove([storagePath])
    } catch {
      /* ignore cleanup failure */
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
