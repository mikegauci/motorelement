import sharp from 'sharp'


export type AlphaTrimRegion = { left: number; top: number; width: number; height: number }

export function computeAlphaBoundsRaw(
  rgba: Buffer,
  width: number,
  height: number,
  alphaMin = 8
): AlphaTrimRegion | null {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    const row = y * width * 4
    for (let x = 0; x < width; x++) {
      const a = rgba[row + x * 4 + 3]
      if (a > alphaMin) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

export function fullImageRegion(width: number, height: number): AlphaTrimRegion {
  return { left: 0, top: 0, width, height }
}

export function regionCoversFullImage(region: AlphaTrimRegion, width: number, height: number): boolean {
  return region.left === 0 && region.top === 0 && region.width === width && region.height === height
}

export async function trimPngToAlphaBounds(
  input: Buffer,
  alphaMin = 8,
  paddingPx = 0
): Promise<Buffer> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const box = computeAlphaBoundsRaw(data, w, h, alphaMin)

  const pad = Math.max(0, Math.round(paddingPx))
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 }

  if (!box || regionCoversFullImage(box, w, h)) {
    let pipeline = sharp(input)
    if (pad > 0) {
      pipeline = pipeline.extend({ top: pad, bottom: pad, left: pad, right: pad, background: transparent })
    }
    return pipeline.png().toBuffer()
  }

  let pipeline = sharp(input).extract(box)
  if (pad > 0) {
    pipeline = pipeline.extend({ top: pad, bottom: pad, left: pad, right: pad, background: transparent })
  }
  return pipeline.png().toBuffer()
}
