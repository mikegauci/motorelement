import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function getServiceClient(): SupabaseClient | null {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!baseUrl || !secretKey) return null
  return createClient(baseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function datedPath(prefix: string, filename: string): string {
  const day = new Date().toISOString().slice(0, 10)
  return `${prefix}/${day}/${filename}`
}

export function buildPublicUrl(bucket: string, storagePath: string): string {
  const root = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
  return `${root}/storage/v1/object/public/${bucket}/${storagePath}`
}

export async function uploadToStorage(
  supabase: SupabaseClient,
  bucket: string,
  storagePath: string,
  data: Buffer,
  contentType: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(storagePath, data, {
    contentType,
    upsert: false,
  })
  if (error) throw error
}

export async function uploadWithDbInsert(
  supabase: SupabaseClient,
  opts: {
    bucket: string
    storagePath: string
    data: Buffer
    contentType: string
    table: string
    row: Record<string, unknown>
  },
): Promise<{ id: string; publicUrl: string; storagePath: string; bucket: string }> {
  await uploadToStorage(supabase, opts.bucket, opts.storagePath, opts.data, opts.contentType)

  const { data: inserted, error: insertError } = await supabase
    .from(opts.table)
    .insert(opts.row)
    .select('id')
    .single()

  if (insertError) {
    try { await supabase.storage.from(opts.bucket).remove([opts.storagePath]) } catch { /* ignore */ }
    throw insertError
  }

  return {
    id: inserted.id,
    publicUrl: buildPublicUrl(opts.bucket, opts.storagePath),
    storagePath: opts.storagePath,
    bucket: opts.bucket,
  }
}
