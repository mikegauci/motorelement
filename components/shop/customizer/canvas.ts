import {
  letterboxRect,
  getMockupPrintZoneRect,
  getArtworkRect,
  type Placement,
  type PrintZone,
  type Rect,
} from './placement'

export function clampDpr(): number {
  return Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
}

export function letterbox(imgW: number, imgH: number, canvasSize: number): Rect {
  return letterboxRect(imgW, imgH, canvasSize)
}

export function printZoneRect(drawRect: Rect, pz: PrintZone): Rect {
  return getMockupPrintZoneRect(drawRect, pz)
}

export function drawArtworkClipped(
  ctx: CanvasRenderingContext2D,
  artworkImg: HTMLImageElement,
  pzRect: Rect,
  placement: Placement,
  alpha = 0.92,
) {
  const aspect = artworkImg.naturalWidth / artworkImg.naturalHeight
  const art = getArtworkRect(pzRect, aspect, placement)
  ctx.save()
  ctx.beginPath()
  ctx.rect(pzRect.x, pzRect.y, pzRect.w, pzRect.h)
  ctx.clip()
  ctx.globalAlpha = alpha
  ctx.drawImage(artworkImg, art.x, art.y, art.w, art.h)
  ctx.globalAlpha = 1.0
  ctx.restore()
}
