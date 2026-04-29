import sharp from 'sharp'

/** Region compatible with sharp.extract() */
export type AlphaTrimRegion = { left: number; top: number; width: number; height: number }

/**
 * Bounding box of pixels with alpha > alphaMin (Photoshop-style trim of transparent margins).
 */
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

/**
 * Decode a PNG (or other raster), crop to non-transparent bounds, re-encode as PNG.
 */
export async function trimPngToAlphaBounds(input: Buffer, alphaMin = 8): Promise<Buffer> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const box = computeAlphaBoundsRaw(data, w, h, alphaMin)
  if (!box || regionCoversFullImage(box, w, h)) {
    return sharp(input).png().toBuffer()
  }
  return sharp(input).extract(box).png().toBuffer()
}
