import type { ProductProfile } from './constants'

export interface Placement {
  xPct: number
  yPct: number
  scale: number
}

export interface PrintZone {
  xPct: number
  yPct: number
  widthPct: number
  heightPct: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export function letterboxRect(imgW: number, imgH: number, canvasSize: number): Rect {
  const aspect = imgW / imgH
  let w = canvasSize
  let h = canvasSize / aspect
  if (h > canvasSize) {
    h = canvasSize
    w = canvasSize * aspect
  }
  return { x: (canvasSize - w) / 2, y: (canvasSize - h) / 2, w, h }
}

export function getMockupPrintZoneRect(baseRect: Rect, zone: PrintZone): Rect {
  return {
    x: baseRect.x + zone.xPct * baseRect.w,
    y: baseRect.y + zone.yPct * baseRect.h,
    w: zone.widthPct * baseRect.w,
    h: zone.heightPct * baseRect.h,
  }
}

export function getArtworkRect(
  target: Rect,
  srcAspect: number,
  placement: Placement,
): Rect {
  const w = target.w * placement.scale
  const h = w / srcAspect
  return {
    x: target.x + placement.xPct * target.w - w / 2,
    y: target.y + placement.yPct * target.h - h / 2,
    w,
    h,
  }
}

export function getPrintAreaRect(profile: ProductProfile): Rect {
  return { x: 0, y: 0, w: profile.printArea.width, h: profile.printArea.height }
}
