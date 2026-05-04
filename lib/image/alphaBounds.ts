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

export function regionCoversFullImage(region: AlphaTrimRegion, width: number, height: number): boolean {
  return region.left === 0 && region.top === 0 && region.width === width && region.height === height
}
