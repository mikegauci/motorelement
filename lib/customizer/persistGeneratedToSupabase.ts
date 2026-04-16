import { randomUUID } from 'node:crypto'
import { getServiceClient, datedPath, uploadWithDbInsert } from '@/lib/supabase/storage'

function extFromMime(mime: string | null) {
  const m = (mime || '').split(';')[0].trim().toLowerCase()
  if (m === 'image/jpeg') return 'jpg'
  if (m === 'image/webp') return 'webp'
  if (m === 'image/gif') return 'gif'
  return 'png'
}

export type PersistFalKind = 'car' | 'background'

type PersistFalResult = {
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
  const supabase = getServiceClient()
  if (!supabase || typeof imageUrl !== 'string' || !imageUrl.trim()) return null

  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to fetch generated image (${res.status})`)
  const buf = Buffer.from(await res.arrayBuffer())
  const contentType = (res.headers.get('content-type') || 'image/png').split(';')[0].trim()
  const ext = extFromMime(contentType)
  const storagePath = datedPath('generated', `${randomUUID()}.${ext}`)
  const bucket = kind === 'background' ? 'backgrounds' : 'car-images'
  const table = kind === 'background' ? 'generated_backgrounds' : 'generated_car_images'

  return uploadWithDbInsert(supabase, {
    bucket, storagePath, data: buf, contentType, table,
    row: { storage_path: storagePath, content_type: contentType, bytes: buf.length, metadata },
  })
}
