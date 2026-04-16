import { fal } from '@fal-ai/client'

function parseDataUrl(dataUrl: string): { mime: string; base64: string } {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl)
  if (!m) throw new Error('Invalid image data URL')
  return { mime: m[1], base64: m[2] }
}

export function parseDataUrlToBuffer(dataUrl: string): Buffer | null {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl)
  if (!m) return null
  return Buffer.from(m[2], 'base64')
}

export async function uploadDataUrl(dataUrl: string): Promise<string> {
  const { mime, base64 } = parseDataUrl(dataUrl)
  const buffer = Buffer.from(base64, 'base64')
  const blob = new Blob([buffer], { type: mime })
  return fal.storage.upload(blob)
}

export function requireFalKey(): string {
  const key = process.env.FAL_API_KEY
  if (!key || typeof key !== 'string') {
    throw new FalKeyMissingError()
  }
  return key.trim()
}

export class FalKeyMissingError extends Error {
  constructor() { super('Server missing FAL_API_KEY') }
}

export function jsonError(err: unknown, status = 500): Response {
  const message = err instanceof Error ? err.message : String(err)
  return Response.json({ error: message }, { status })
}
