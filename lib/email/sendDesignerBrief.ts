import { getResend } from './resend'
import { isRealBackgroundUrl } from '@/components/shop/customizer/constants'
import { sanitizeBriefImageUrl } from './safeImageUrl'

export interface DesignerBriefItem {
  productType: string
  productName?: string
  color: string
  customerPhotoUrl: string
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
  includeSourceFiles?: boolean
  designerPriority?: boolean
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function imageBlock(label: string, url: string) {
  return `
    <p><strong>${escapeHtml(label)}</strong></p>
    <p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>
    <p><img src="${escapeHtml(url)}" alt="${escapeHtml(label)}" style="max-width:420px;height:auto;border:1px solid #ddd;" /></p>
  `
}

function buildItemHtml(item: DesignerBriefItem, index: number) {
  const parts: string[] = [
    `<h2>Item ${index + 1}</h2>`,
    `<p><strong>Product:</strong> ${escapeHtml(item.productType)}${item.productName ? ` — ${escapeHtml(item.productName)}` : ''}</p>`,
    `<p><strong>Color:</strong> ${escapeHtml(item.color || '—')}</p>`,
    `<p><strong>Artwork placement:</strong> ${escapeHtml(item.artworkSide === 'back' ? 'Back' : 'Front')}</p>`,
    `<p><strong>Turnaround:</strong> ${escapeHtml(
      item.designerPriority ? 'PRIORITY — under 24 hours' : 'Standard — 1–3 days'
    )}</p>`,
    `<p><strong>Include source files:</strong> ${item.includeSourceFiles ? 'Yes' : 'No'}</p>`,
    imageBlock('Original car image', item.customerPhotoUrl),
  ]

  if (item.aiArtworkUrl) {
    const safeAi = sanitizeBriefImageUrl(item.aiArtworkUrl)
    if (safeAi) parts.push(imageBlock('Generated car artwork', safeAi))
  }
  if (item.customerNotes?.trim()) {
    parts.push(`<p><strong>Notes:</strong></p><p>${escapeHtml(item.customerNotes.trim()).replace(/\n/g, '<br/>')}</p>`)
  }
  const safeBackground = isRealBackgroundUrl(item.backgroundUrl)
    ? sanitizeBriefImageUrl(item.backgroundUrl)
    : undefined
  if (safeBackground) {
    parts.push(imageBlock('Background', safeBackground))
  }
  if (item.requestedText?.trim()) {
    parts.push(
      `<p><strong>Text:</strong> ${escapeHtml(item.requestedText.trim()).replace(/\n/g, ' · ')}</p>`
    )
    parts.push(
      `<p><strong>Text placement:</strong> ${escapeHtml(
        item.textPlacement === 'opposite' ? 'Opposite side' : 'Same side as artwork'
      )}</p>`
    )
  }
  if (item.textCorner?.trim()) {
    parts.push(
      `<p><strong>Text corner:</strong> ${escapeHtml(item.textCorner.trim())}</p>`
    )
  }
  const safeCornerImage = sanitizeBriefImageUrl(item.cornerImageUrl)
  if (safeCornerImage) {
    const cornerLabel = item.cornerImageLabel?.trim()
      ? `Corner image (${item.cornerImageLabel.trim()})`
      : 'Corner image'
    parts.push(imageBlock(cornerLabel, safeCornerImage))
  }
  const safeTextArtwork = sanitizeBriefImageUrl(item.textArtworkUrl)
  if (safeTextArtwork) {
    parts.push(imageBlock('Text artwork', safeTextArtwork))
  }

  return parts.join('\n')
}

export async function sendDesignerBrief(items: DesignerBriefItem[]) {
  const to = process.env.DESIGNER_EMAIL
  const from = process.env.EMAIL_FROM || 'Motor Element <onboarding@resend.dev>'

  const safeItems = items.map((item) => {
    const customerPhotoUrl = sanitizeBriefImageUrl(item.customerPhotoUrl)
    if (!customerPhotoUrl) {
      throw new Error('Designer brief requires a valid original car photo URL')
    }
    return {
      ...item,
      customerPhotoUrl,
      aiArtworkUrl: sanitizeBriefImageUrl(item.aiArtworkUrl),
      backgroundUrl: sanitizeBriefImageUrl(item.backgroundUrl),
      cornerImageUrl: sanitizeBriefImageUrl(item.cornerImageUrl),
      textArtworkUrl: sanitizeBriefImageUrl(item.textArtworkUrl),
    }
  })

  console.log('[designer-email] preparing send', {
    to,
    from,
    itemCount: safeItems.length,
    hasApiKey: Boolean(process.env.RESEND_API_KEY),
    subjects: safeItems.map((item) => `${item.productType} / ${item.color}`),
    photoUrls: safeItems.map((item) => item.customerPhotoUrl),
    backgroundUrls: safeItems.map((item) => item.backgroundUrl ?? null),
    hasNotes: safeItems.map((item) => Boolean(item.customerNotes?.trim())),
    hasRequestedText: safeItems.map((item) => Boolean(item.requestedText?.trim())),
  })

  if (!to) {
    throw new Error('DESIGNER_EMAIL is not set')
  }
  if (!safeItems.length) {
    throw new Error('No designer items provided')
  }

  const hasPriority = safeItems.some((item) => item.designerPriority)
  const subject =
    safeItems.length === 1
      ? `${hasPriority ? 'PRIORITY — ' : ''}Designer illustration brief — ${safeItems[0].productType} (${safeItems[0].color || 'no color'})`
      : `${hasPriority ? 'PRIORITY — ' : ''}Designer illustration brief — ${safeItems.length} items`

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      ${safeItems.map((item, i) => buildItemHtml(item, i)).join('<hr style="margin:24px 0;border:none;border-top:1px solid #ddd;" />')}
    </div>
  `

  const resend = getResend()
  console.log('[designer-email] calling Resend…', { subject, to, from })

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  })

  if (error) {
    console.error('[designer-email] Resend error', error)
    throw new Error(error.message || 'Failed to send designer brief email')
  }

  console.log('[designer-email] Resend success', {
    id: data?.id ?? null,
    to,
    from,
    subject,
  })

  return data
}
