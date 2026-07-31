import { NextResponse } from 'next/server'
import { sendDesignerBrief, type DesignerBriefItem } from '@/lib/email/sendDesignerBrief'
import { isRealBackgroundUrl } from '@/components/shop/customizer/constants'

export const runtime = 'nodejs'

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
      if (!item.customerPhotoUrl) {
        return NextResponse.json(
          { error: 'Designer items require the original car photo' },
          { status: 400 }
        )
      }
      briefs.push({
        productType: item.type,
        productName: item.name,
        color: item.color ?? '',
        customerPhotoUrl: item.customerPhotoUrl,
        customerNotes: item.customerNotes,
        aiArtworkUrl: item.aiArtworkUrl,
        backgroundUrl: isRealBackgroundUrl(item.backgroundUrl)
          ? item.backgroundUrl
          : undefined,
        textArtworkUrl: item.textArtworkUrl,
        requestedText: item.requestedText,
        artworkSide: item.artworkSide === 'back' ? 'back' : 'front',
        textPlacement: item.textPlacement === 'opposite' ? 'opposite' : 'same',
        textCorner: item.textCorner,
        cornerImageUrl: item.cornerImageUrl,
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
