import sharp from 'sharp'

/**
 * Background removal: only near-white regions **connected to the image edge** (flood fill).
 * Interior whites (windshield streaks, highlights) stay — they are not connected to the edge.
 */
const WHITE_THRESHOLD = 248

/** Whitish semi-transparent **exterior** halos only (must touch transparency). */
const FRINGE_RGB = 235

/** Opaque mask: alpha above this counts as solid artwork (car + shadow). */
const ALPHA_SOLID = 28

/** Circular dilation radius per pass (smooth, rounded stroke). */
const BORDER_RADIUS = 2

/** How many dilation passes (total border thickness ≈ BORDER_RADIUS × passes). */
const BORDER_PASSES = 3

function parseDataUrl(dataUrl: string): Buffer | null {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl)
  if (!m) return null
  return Buffer.from(m[2], 'base64')
}

/** Max of mask values in a disk of radius r around (x,y). */
function dilateDisk(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const next = new Uint8Array(w * h)
  const r2 = r * r
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x
      if (mask[p]) {
        next[p] = 1
        continue
      }
      let hit = 0
      for (let dy = -r; dy <= r && !hit; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= h) continue
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r2) continue
          const nx = x + dx
          if (nx < 0 || nx >= w) continue
          if (mask[ny * w + nx]) {
            hit = 1
            break
          }
        }
      }
      next[p] = hit
    }
  }
  return next
}

function buildOpaqueMaskFromBuffer(out: Buffer, w: number, h: number): Uint8Array {
  const m = new Uint8Array(w * h)
  for (let i = 0, p = 0; i < out.length; i += 4, p++) {
    if (out[i + 3] > ALPHA_SOLID) m[p] = 1
  }
  return m
}

/** True if RGB reads as flat background white (before alpha is cleared). */
function isNearWhite(out: Buffer, i: number): boolean {
  return (
    out[i] >= WHITE_THRESHOLD &&
    out[i + 1] >= WHITE_THRESHOLD &&
    out[i + 2] >= WHITE_THRESHOLD
  )
}

/**
 * Flood-fill from border: only edge-connected white becomes transparent.
 * Enclosed white (streaks, highlights inside the subject) is unchanged.
 */
function removeEdgeConnectedWhiteBackground(out: Buffer, w: number, h: number): void {
  const bgMark = new Uint8Array(w * h)
  const stack: number[] = []
  const pToI = (p: number) => p * 4

  const trySeed = (x: number, y: number) => {
    const p = y * w + x
    if (bgMark[p]) return
    const i = pToI(p)
    if (!isNearWhite(out, i)) return
    bgMark[p] = 1
    stack.push(x, y)
  }

  for (let x = 0; x < w; x++) {
    trySeed(x, 0)
    trySeed(x, h - 1)
  }
  for (let y = 0; y < h; y++) {
    trySeed(0, y)
    trySeed(w - 1, y)
  }

  let qi = 0
  while (qi < stack.length) {
    const x = stack[qi++]
    const y = stack[qi++]
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]
    for (const [dx, dy] of dirs) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
      const np = ny * w + nx
      if (bgMark[np]) continue
      const ni = pToI(np)
      if (!isNearWhite(out, ni)) continue
      bgMark[np] = 1
      stack.push(nx, ny)
    }
  }

  for (let p = 0; p < w * h; p++) {
    if (bgMark[p]) {
      out[pToI(p) + 3] = 0
    }
  }
}

/**
 * Remove semi-transparent whitish pixels only on the **outside** of the subject
 * (touching a fully transparent pixel). Interior soft whites stay.
 */
function removeExteriorWhitishFringe(out: Buffer, w: number, h: number): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const a = out[i + 3]
      if (a === 0 || a === 255) continue
      if (out[i] < FRINGE_RGB || out[i + 1] < FRINGE_RGB || out[i + 2] < FRINGE_RGB) {
        continue
      }
      let touchesTransparent = false
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]
      for (const [dx, dy] of dirs) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
        if (out[(ny * w + nx) * 4 + 3] === 0) {
          touchesTransparent = true
          break
        }
      }
      if (touchesTransparent) out[i + 3] = 0
    }
  }
}

/**
 * For round background artwork: remove only pixels outside the detected circle.
 * Interior whites (e.g. clouds) are preserved exactly.
 */
/** Width (in px) of the soft alpha fade at the circle edge to eliminate white fringe. */
const CIRCLE_FEATHER_PX = 1

function removeOutsideDetectedCircle(
  out: Buffer,
  w: number,
  h: number,
  insetPx = 0
): boolean {
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const a = out[i + 3]
      if (a < 8) continue
      if (isNearWhite(out, i)) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  if (maxX < 0) return false

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const rRaw = Math.min(maxX - minX + 1, maxY - minY + 1) / 2 + 1
  const r = Math.max(1, rRaw - Math.max(0, insetPx))
  const rInner = Math.max(1, r - CIRCLE_FEATHER_PX)
  const r2 = r * r
  const rInner2 = rInner * rInner
  const featherRange = r - rInner

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist2 = dx * dx + dy * dy
      if (dist2 <= rInner2) continue
      const i = (y * w + x) * 4
      if (dist2 > r2) {
        out[i] = 0
        out[i + 1] = 0
        out[i + 2] = 0
        out[i + 3] = 0
      } else {
        const dist = Math.sqrt(dist2)
        const t = Math.max(0, Math.min(1, (r - dist) / featherRange))
        out[i + 3] = Math.round(out[i + 3] * t)
      }
    }
  }
  return true
}

export async function POST(request: Request) {
  let buffer: Buffer
  let addWhiteBorder = true
  let mode = 'default'
  let circleInsetPx = 0
  try {
    const body = (await request.json()) as Record<string, unknown>
    const { imageUrl, imageBase64 } = body
    if (typeof body?.addWhiteBorder === 'boolean') {
      addWhiteBorder = body.addWhiteBorder
    }
    if (typeof body?.mode === 'string' && body.mode.trim()) {
      mode = body.mode.trim()
    }
    if (typeof body?.circleInsetPx === 'number' && Number.isFinite(body.circleInsetPx)) {
      circleInsetPx = Math.max(0, Math.round(body.circleInsetPx))
    }

    if (imageBase64 && typeof imageBase64 === 'string') {
      const parsed = parseDataUrl(imageBase64)
      if (!parsed) {
        return Response.json({ error: 'Invalid imageBase64 data URL' }, { status: 400 })
      }
      buffer = parsed
    } else if (imageUrl && typeof imageUrl === 'string') {
      if (!/^https?:\/\//i.test(imageUrl)) {
        return Response.json({ error: 'imageUrl must be http(s)' }, { status: 400 })
      }
      const res = await fetch(imageUrl)
      if (!res.ok) {
        return Response.json(
          { error: `Failed to fetch image: ${res.status}` },
          { status: 502 }
        )
      }
      buffer = Buffer.from(await res.arrayBuffer())
    } else {
      return Response.json(
        { error: 'Provide imageUrl (https) or imageBase64 (data URL)' },
        { status: 400 }
      )
    }

    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const w = info.width
    const h = info.height
    const out = Buffer.from(data)

    if (mode === 'circle-outside-only') {
      const ok = removeOutsideDetectedCircle(out, w, h, circleInsetPx)
      if (!ok) {
        removeEdgeConnectedWhiteBackground(out, w, h)
      }
      removeExteriorWhitishFringe(out, w, h)
    } else {
      // 1) Remove only edge-connected white (true background). Interior whites unchanged.
      removeEdgeConnectedWhiteBackground(out, w, h)
      // 2) Exterior halos only — not interior semi-transparent highlights
      removeExteriorWhitishFringe(out, w, h)
    }

    if (addWhiteBorder) {
      const original = Buffer.from(out)
      const opaque = buildOpaqueMaskFromBuffer(out, w, h)

      // 3) Expand silhouette with smooth circular dilation → outer ring for stroke
      let dilated = opaque
      for (let pass = 0; pass < BORDER_PASSES; pass++) {
        dilated = dilateDisk(dilated, w, h, BORDER_RADIUS)
      }

      // 4) Composite: subject on top, smooth white ring outside silhouette
      for (let p = 0, i = 0; p < w * h; p++, i += 4) {
        if (opaque[p]) {
          out[i] = original[i]
          out[i + 1] = original[i + 1]
          out[i + 2] = original[i + 2]
          out[i + 3] = original[i + 3]
        } else if (dilated[p]) {
          out[i] = 255
          out[i + 1] = 255
          out[i + 2] = 255
          out[i + 3] = 255
        } else {
          out[i] = 0
          out[i + 1] = 0
          out[i + 2] = 0
          out[i + 3] = 0
        }
      }
    }

    const png = await sharp(out, {
      raw: { width: w, height: h, channels: 4 },
    })
      .png()
      .toBuffer()

    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Processing failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
