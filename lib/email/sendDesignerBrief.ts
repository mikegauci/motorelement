import { getResend } from './resend'
import { isRealBackgroundUrl } from '@/components/shop/customizer/constants'

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
    parts.push(imageBlock('Generated car artwork', item.aiArtworkUrl))
  }
  if (item.customerNotes?.trim()) {
    parts.push(`<p><strong>Notes:</strong></p><p>${escapeHtml(item.customerNotes.trim()).replace(/\n/g, '<br/>')}</p>`)
  }
  if (isRealBackgroundUrl(item.backgroundUrl)) {
    parts.push(imageBlock('Background', item.backgroundUrl!))
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
  if (item.cornerImageUrl) {
    const cornerLabel = item.cornerImageLabel?.trim()
      ? `Corner image (${item.cornerImageLabel.trim()})`
      : 'Corner image'
    parts.push(imageBlock(cornerLabel, item.cornerImageUrl))
  }
  if (item.textArtworkUrl) {
    parts.push(imageBlock('Text artwork', item.textArtworkUrl))
  }

  return parts.join('\n')
}

export async function sendDesignerBrief(items: DesignerBriefItem[]) {
  const to = process.env.DESIGNER_EMAIL
  const from = process.env.EMAIL_FROM || 'Motor Element <onboarding@resend.dev>'

  console.log('[designer-email] preparing send', {
    to,
    from,
    itemCount: items.length,
    hasApiKey: Boolean(process.env.RESEND_API_KEY),
    subjects: items.map((item) => `${item.productType} / ${item.color}`),
    photoUrls: items.map((item) => item.customerPhotoUrl),
    backgroundUrls: items.map((item) => item.backgroundUrl ?? null),
    hasNotes: items.map((item) => Boolean(item.customerNotes?.trim())),
    hasRequestedText: items.map((item) => Boolean(item.requestedText?.trim())),
  })

  if (!to) {
    throw new Error('DESIGNER_EMAIL is not set')
  }
  if (!items.length) {
    throw new Error('No designer items provided')
  }

  const hasPriority = items.some((item) => item.designerPriority)
  const subject =
    items.length === 1
      ? `${hasPriority ? 'PRIORITY — ' : ''}Designer illustration brief — ${items[0].productType} (${items[0].color || 'no color'})`
      : `${hasPriority ? 'PRIORITY — ' : ''}Designer illustration brief — ${items.length} items`

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      ${items.map((item, i) => buildItemHtml(item, i)).join('<hr style="margin:24px 0;border:none;border-top:1px solid #ddd;" />')}
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
