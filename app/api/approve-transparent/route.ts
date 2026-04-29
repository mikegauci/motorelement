import sharp from 'sharp'
import { parseDataUrlToBuffer } from '@/lib/api/fal'
import { computeAlphaBoundsRaw, regionCoversFullImage } from '@/lib/image/alphaBounds'

const WHITE_THRESHOLD = 248
const FRINGE_RGB = 235

/** True if RGB reads as flat background white (before alpha is cleared). */
function isNearWhite(out: Buffer, i: number): boolean {
  return (
    out[i] >= WHITE_THRESHOLD &&
    out[i + 1] >= WHITE_THRESHOLD &&
    out[i + 2] >= WHITE_THRESHOLD
  )
}

/** Checkerboard "transparency" patterns use alternating white and light gray. */
const CHECKER_GRAY_THRESHOLD = 180
const CHECKER_SATURATION_MAX = 12

function isBackgroundOrChecker(out: Buffer, i: number): boolean {
  if (isNearWhite(out, i)) return true
  const r = out[i], g = out[i + 1], b = out[i + 2]
  if (r >= CHECKER_GRAY_THRESHOLD && g >= CHECKER_GRAY_THRESHOLD && b >= CHECKER_GRAY_THRESHOLD) {
    if (Math.max(r, g, b) - Math.min(r, g, b) <= CHECKER_SATURATION_MAX) return true
  }
  return false
}

/**
 * Detect and remove baked-in checkerboard "transparency" patterns.
 * AI models sometimes render transparent areas as a visible checkerboard grid
 * instead of true alpha. This detects the grid from the image corners, then
 * flood-fills from edges only through pixels matching the grid — so artwork
 * whites/grays inside the circle are never touched.
 */
const CHECKER_COLOR_TOLERANCE = 25

function removeCheckerboardTransparency(out: Buffer, w: number, h: number): void {
  const px = (x: number, y: number) => {
    const i = (y * w + x) * 4
    return [out[i], out[i + 1], out[i + 2], out[i + 3]] as const
  }

  const corner = px(0, 0)
  if (corner[3] < 128) return
  const cr = corner[0], cg = corner[1], cb = corner[2]
  if (cr < CHECKER_GRAY_THRESHOLD || cg < CHECKER_GRAY_THRESHOLD || cb < CHECKER_GRAY_THRESHOLD) return
  if (Math.max(cr, cg, cb) - Math.min(cr, cg, cb) > CHECKER_SATURATION_MAX) return

  let blockSize = 0
  for (let x = 1; x < Math.min(w, 50); x++) {
    const p = px(x, 0)
    if (Math.abs(p[0] - cr) > 20 || Math.abs(p[1] - cg) > 20 || Math.abs(p[2] - cb) > 20) {
      blockSize = x
      break
    }
  }
  if (blockSize < 3 || blockSize > 30) return

  const c2 = px(blockSize, 0)
  if (c2[0] < CHECKER_GRAY_THRESHOLD || c2[1] < CHECKER_GRAY_THRESHOLD || c2[2] < CHECKER_GRAY_THRESHOLD) return
  if (Math.max(c2[0], c2[1], c2[2]) - Math.min(c2[0], c2[1], c2[2]) > CHECKER_SATURATION_MAX) return

  const colA = [cr, cg, cb] as const
  const colB = [c2[0], c2[1], c2[2]] as const

  let verified = 0
  for (let bx = 2; bx < 6 && bx * blockSize < w; bx++) {
    const p = px(bx * blockSize + 1, 1)
    const exp = bx % 2 === 0 ? colA : colB
    if (Math.abs(p[0] - exp[0]) < 20 && Math.abs(p[1] - exp[1]) < 20 && Math.abs(p[2] - exp[2]) < 20) verified++
  }
  for (let by = 1; by < 4 && by * blockSize < h; by++) {
    const p = px(1, by * blockSize + 1)
    const exp = by % 2 === 0 ? colA : colB
    if (Math.abs(p[0] - exp[0]) < 20 && Math.abs(p[1] - exp[1]) < 20 && Math.abs(p[2] - exp[2]) < 20) verified++
  }
  if (verified < 3) return

  const matchesGrid = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (out[i + 3] < 8) continue
      const bx = Math.floor(x / blockSize)
      const by = Math.floor(y / blockSize)
      const exp = (bx + by) % 2 === 0 ? colA : colB
      if (
        Math.abs(out[i] - exp[0]) <= CHECKER_COLOR_TOLERANCE &&
        Math.abs(out[i + 1] - exp[1]) <= CHECKER_COLOR_TOLERANCE &&
        Math.abs(out[i + 2] - exp[2]) <= CHECKER_COLOR_TOLERANCE
      ) {
        matchesGrid[y * w + x] = 1
      }
    }
  }

  const toRemove = new Uint8Array(w * h)
  const stack: number[] = []
  const seed = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return
    const p = y * w + x
    if (toRemove[p] || !matchesGrid[p]) return
    toRemove[p] = 1
    stack.push(x, y)
  }
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1) }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y) }
  let qi = 0
  while (qi < stack.length) {
    const sx = stack[qi++], sy = stack[qi++]
    seed(sx + 1, sy); seed(sx - 1, sy); seed(sx, sy + 1); seed(sx, sy - 1)
  }

  for (let p = 0; p < w * h; p++) {
    if (toRemove[p]) {
      const i = p * 4
      out[i] = 0; out[i + 1] = 0; out[i + 2] = 0; out[i + 3] = 0
    }
  }
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
      if (isBackgroundOrChecker(out, i)) continue
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
  let mode = 'default'
  let circleInsetPx = 0
  try {
    const body = (await request.json()) as Record<string, unknown>
    const { imageUrl, imageBase64 } = body
    if (typeof body?.mode === 'string' && body.mode.trim()) {
      mode = body.mode.trim()
    }
    if (typeof body?.circleInsetPx === 'number' && Number.isFinite(body.circleInsetPx)) {
      circleInsetPx = Math.max(0, Math.round(body.circleInsetPx))
    }

    if (imageBase64 && typeof imageBase64 === 'string') {
      const parsed = parseDataUrlToBuffer(imageBase64)
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
      removeCheckerboardTransparency(out, w, h)
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

    let rawPipeline = sharp(out, { raw: { width: w, height: h, channels: 4 } })
    const trimBox = computeAlphaBoundsRaw(out, w, h, 8)
    if (trimBox && !regionCoversFullImage(trimBox, w, h)) {
      rawPipeline = rawPipeline.extract(trimBox)
    }
    const png = await rawPipeline.png().toBuffer()

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
