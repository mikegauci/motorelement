import { randomUUID } from 'node:crypto'
import { getServiceClient, datedPath, buildPublicUrl, uploadToStorage } from '@/lib/supabase/storage'

type PersistResult = {
  publicUrl: string
  storagePath: string
}

export async function persistCustomBackgroundPng({
  buffer,
  label,
}: {
  buffer: Buffer
  label?: string
}): Promise<PersistResult | null> {
  const supabase = getServiceClient()
  if (!supabase || !buffer?.length) return null

  const slug = (label || '').replace(/[^a-z0-9]+/gi, '-').slice(0, 40).toLowerCase()
  const fileName = slug ? `${slug}-${randomUUID().slice(0, 8)}.png` : `${randomUUID()}.png`
  const storagePath = datedPath('backgrounds', fileName)
  const bucket = 'artwork'

  await uploadToStorage(supabase, bucket, storagePath, buffer, 'image/png')
  return { publicUrl: buildPublicUrl(bucket, storagePath), storagePath }
}
