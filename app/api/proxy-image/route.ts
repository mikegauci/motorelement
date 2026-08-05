import { NextRequest, NextResponse } from 'next/server'

const MAX_BYTES = 15 * 1024 * 1024

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')?.trim()
  if (!raw) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only http(s) urls are allowed' }, { status: 400 })
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      redirect: 'follow',
      headers: { Accept: 'image/*' },
    })
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream failed (${upstream.status})` },
        { status: 502 },
      )
    }

    const contentType = upstream.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL is not an image' }, { status: 400 })
    }

    const buffer = await upstream.arrayBuffer()
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 })
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('proxy-image failed:', err)
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
  }
}
