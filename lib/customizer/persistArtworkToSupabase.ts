import { randomUUID } from 'node:crypto'
import { getServiceClient, datedPath, uploadWithDbInsert } from '@/lib/supabase/storage'

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
  const supabase = getServiceClient()
  if (!supabase || !buffer?.length) return null

  const ct = String(contentType || 'image/png').split(';')[0].trim() || 'image/png'
  const path = datedPath('exports', `${randomUUID()}.png`)

  return uploadWithDbInsert(supabase, {
    bucket: 'artwork',
    storagePath: path,
    data: buffer,
    contentType: ct,
    table: 'artwork',
    row: { storage_path: path, content_type: ct, bytes: buffer.length, metadata },
  })
}
