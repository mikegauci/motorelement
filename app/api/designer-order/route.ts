import { NextResponse } from 'next/server'
import { sendDesignerBrief, type DesignerBriefItem } from '@/lib/email/sendDesignerBrief'
import { isRealBackgroundUrl } from '@/components/shop/customizer/constants'
import { sanitizeBriefImageUrl } from '@/lib/email/safeImageUrl'
import { clientIp, isSameOriginRequest, rateLimit } from '@/lib/api/rateLimit'

export const runtime = 'nodejs'

const RATE_LIMIT = 8
const RATE_WINDOW_MS = 15 * 60 * 1000

interface DesignerOrderItem {
  productId: string
  name?: string
  type: string
  size: string
  color?: string
  quantity: number
  customerPhotoUrl?: string
  customerNotes?: string
  aiArtworkUrl?: string
  backgroundUrl?: string
  textArtworkUrl?: string
  requestedText?: string
  artworkSide?: 'front' | 'back'
  textPlacement?: 'same' | 'opposite'
  textCorner?: string
  cornerImageUrl?: string
  cornerImageLabel?: string
  illustrationMode?: 'ai' | 'designer'
  includeSourceFiles?: boolean
  designerPriority?: boolean
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ip = clientIp(request)
    const limited = rateLimit(`designer-order:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many designer requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limited.retryAfterSec) },
        }
      )
    }

    const { items } = (await request.json()) as { items: DesignerOrderItem[] }

    console.log('[designer-order] received', {
      totalItems: items?.length ?? 0,
      designerCount: items?.filter((i) => i.illustrationMode === 'designer').length ?? 0,
      modes: items?.map((i) => i.illustrationMode ?? 'unset') ?? [],
    })

    if (!items?.length) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const designerItems = items.filter((item) => item.illustrationMode === 'designer')
    if (!designerItems.length) {
      return NextResponse.json({ error: 'No designer items found' }, { status: 400 })
    }

    const briefs: DesignerBriefItem[] = []
    for (const item of designerItems) {
      const customerPhotoUrl = sanitizeBriefImageUrl(item.customerPhotoUrl)
      if (!customerPhotoUrl) {
        return NextResponse.json(
          { error: 'Designer items require a valid original car photo URL' },
          { status: 400 }
        )
      }
      const backgroundUrl = isRealBackgroundUrl(item.backgroundUrl)
        ? sanitizeBriefImageUrl(item.backgroundUrl)
        : undefined
      briefs.push({
        productType: item.type,
        productName: item.name,
        color: item.color ?? '',
        customerPhotoUrl,
        customerNotes: item.customerNotes,
        aiArtworkUrl: sanitizeBriefImageUrl(item.aiArtworkUrl),
        backgroundUrl,
        textArtworkUrl: sanitizeBriefImageUrl(item.textArtworkUrl),
        requestedText: item.requestedText,
        artworkSide: item.artworkSide === 'back' ? 'back' : 'front',
        textPlacement: item.textPlacement === 'opposite' ? 'opposite' : 'same',
        textCorner: item.textCorner,
        cornerImageUrl: sanitizeBriefImageUrl(item.cornerImageUrl),
        cornerImageLabel: item.cornerImageLabel,
        includeSourceFiles: !!item.includeSourceFiles,
        designerPriority: !!item.designerPriority,
      })
    }

    const data = await sendDesignerBrief(briefs)

    console.log('[designer-order] ok', {
      emailId: data?.id ?? null,
      itemCount: briefs.length,
      to: process.env.DESIGNER_EMAIL,
    })

    return NextResponse.json({
      ok: true,
      emailId: data?.id ?? null,
      itemCount: briefs.length,
      to: process.env.DESIGNER_EMAIL ?? null,
      from: process.env.EMAIL_FROM ?? 'Motor Element <onboarding@resend.dev>',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[designer-order] failed', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
