import { getResend } from './resend'

export const CONTACT_TOPICS = [
  'order',
  'customizer',
  'product',
  'partnership',
  'wholesale',
  'other',
] as const

export type ContactTopic = (typeof CONTACT_TOPICS)[number]

export interface ContactMessageInput {
  name: string
  email: string
  topic: ContactTopic
  message: string
  orderNumber?: string
}

const TOPIC_LABELS: Record<ContactTopic, string> = {
  order: 'Order',
  customizer: 'Customizer',
  product: 'Product',
  partnership: 'Partnership',
  wholesale: 'Wholesale',
  other: 'Other',
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function isContactTopic(value: unknown): value is ContactTopic {
  return typeof value === 'string' && (CONTACT_TOPICS as readonly string[]).includes(value)
}

export async function sendContactMessage(input: ContactMessageInput) {
  const to = process.env.CONTACT_EMAIL || process.env.DESIGNER_EMAIL
  const from = process.env.EMAIL_FROM || 'Motor Element <onboarding@resend.dev>'

  if (!to) {
    throw new Error('CONTACT_EMAIL is not set')
  }

  const topicLabel = TOPIC_LABELS[input.topic]
  const subject = `[Contact — ${topicLabel}] ${input.name}`

  const orderRow = input.orderNumber?.trim()
    ? `<p><strong>Order number:</strong> ${escapeHtml(input.orderNumber.trim())}</p>`
    : ''

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      <h2>New contact message</h2>
      <p><strong>Topic:</strong> ${escapeHtml(topicLabel)}</p>
      <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a></p>
      ${orderRow}
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(input.message).replace(/\n/g, '<br/>')}</p>
    </div>
  `

  const resend = getResend()
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: input.email,
    subject,
    html,
  })

  if (error) {
    console.error('[contact-email] Resend error', error)
    throw new Error(error.message || 'Failed to send contact message')
  }

  return data
}
