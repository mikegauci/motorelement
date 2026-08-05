import { NextRequest, NextResponse } from 'next/server'

const MAX_BYTES = 15 * 1024 * 1024

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')?.trim()
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }
  if (!/^https:\/\//i.test(url)) {
    return NextResponse.json({ error: 'Only https:// URLs are allowed' }, { status: 400 })
  }

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'image/*,*/*' },
      signal: AbortSignal.timeout(20000),
    })
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image (${upstream.status})` },
        { status: 502 },
      )
    }

    const contentType = upstream.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL did not return an image' }, { status: 400 })
    }

    const buffer = Buffer.from(await upstream.arrayBuffer())
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 })
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
  }
}
