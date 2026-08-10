import { NextResponse } from 'next/server'
import {
  isContactTopic,
  sendContactMessage,
  type ContactTopic,
} from '@/lib/email/sendContactMessage'
import { clientIp, isSameOriginRequest, rateLimit } from '@/lib/api/rateLimit'

export const runtime = 'nodejs'

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 15 * 60 * 1000
const MAX_NAME = 120
const MAX_EMAIL = 254
const MAX_MESSAGE = 5000
const MAX_ORDER = 64

function isNonEmptyString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ip = clientIp(request)
    const limited = rateLimit(`contact:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limited.retryAfterSec) },
        }
      )
    }

    const body = (await request.json()) as Record<string, unknown>
    const name = body.name
    const email = body.email
    const topic = body.topic
    const message = body.message
    const orderNumber = body.orderNumber

    if (!isNonEmptyString(name, MAX_NAME)) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }
    if (!isNonEmptyString(email, MAX_EMAIL) || !isValidEmail(email.trim())) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    }
    if (!isContactTopic(topic)) {
      return NextResponse.json({ error: 'Choose a topic.' }, { status: 400 })
    }
    if (!isNonEmptyString(message, MAX_MESSAGE)) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    }
    if (
      orderNumber !== undefined &&
      orderNumber !== null &&
      orderNumber !== '' &&
      (typeof orderNumber !== 'string' || orderNumber.trim().length > MAX_ORDER)
    ) {
      return NextResponse.json({ error: 'Order number is too long.' }, { status: 400 })
    }

    const topicValue = topic as ContactTopic
    await sendContactMessage({
      name: name.trim(),
      email: email.trim(),
      topic: topicValue,
      message: message.trim(),
      orderNumber:
        typeof orderNumber === 'string' && orderNumber.trim()
          ? orderNumber.trim()
          : undefined,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[contact] failed', error)
    return NextResponse.json(
      { error: 'Could not send your message. Please try again.' },
      { status: 500 }
    )
  }
}
