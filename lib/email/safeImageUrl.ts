const ALLOWED_HOST_SUFFIXES = ['.supabase.co'] as const

export function isAllowedBriefImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false
  try {
    const parsed = new URL(url.trim())
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    if (ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix.slice(1) || host.endsWith(suffix))) {
      return true
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      const allowedHost = new URL(supabaseUrl).hostname.toLowerCase()
      if (host === allowedHost) return true
    }
    return false
  } catch {
    return false
  }
}

export function sanitizeBriefImageUrl(url: string | null | undefined): string | undefined {
  return isAllowedBriefImageUrl(url) ? url!.trim() : undefined
}
