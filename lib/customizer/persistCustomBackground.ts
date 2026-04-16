import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

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
  const slug = (label || '').replace(/[^a-z0-9]+/gi, '-').slice(0, 40).toLowerCase()
  const fileName = slug ? `${slug}-${randomUUID().slice(0, 8)}.png` : `${randomUUID()}.png`
  const storagePath = `backgrounds/${day}/${fileName}`
  const bucket = 'artwork'

  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: 'image/png',
    upsert: false,
  })
  if (uploadError) throw uploadError

  const root = baseUrl.replace(/\/$/, '')
  const publicUrl = `${root}/storage/v1/object/public/${bucket}/${storagePath}`

  return { publicUrl, storagePath }
}
