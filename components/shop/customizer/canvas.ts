interface PrintZone {
  xPct: number
  yPct: number
  widthPct: number
  heightPct: number
}

interface Placement {
  xPct: number
  yPct: number
  scale: number
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export function clampDpr(): number {
  return Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
}

export function letterbox(imgW: number, imgH: number, canvasSize: number): Rect {
  const aspect = imgW / imgH
  let w = canvasSize
  let h = canvasSize / aspect
  if (h > canvasSize) { h = canvasSize; w = canvasSize * aspect }
  return { x: (canvasSize - w) / 2, y: (canvasSize - h) / 2, w, h }
}

export function printZoneRect(drawRect: Rect, pz: PrintZone): Rect {
  return {
    x: drawRect.x + pz.xPct * drawRect.w,
    y: drawRect.y + pz.yPct * drawRect.h,
    w: pz.widthPct * drawRect.w,
    h: pz.heightPct * drawRect.h,
  }
}

function artworkDrawRect(pzRect: Rect, artW: number, artH: number, placement: Placement): Rect {
  const aspect = artW / artH
  const w = pzRect.w * placement.scale
  const h = w / aspect
  return {
    x: pzRect.x + placement.xPct * pzRect.w - w / 2,
    y: pzRect.y + placement.yPct * pzRect.h - h / 2,
    w,
    h,
  }
}

export function drawArtworkClipped(
  ctx: CanvasRenderingContext2D,
  artworkImg: HTMLImageElement,
  pzRect: Rect,
  placement: Placement,
  alpha = 0.92,
) {
  const art = artworkDrawRect(pzRect, artworkImg.naturalWidth, artworkImg.naturalHeight, placement)
  ctx.save()
  ctx.beginPath()
  ctx.rect(pzRect.x, pzRect.y, pzRect.w, pzRect.h)
  ctx.clip()
  ctx.globalAlpha = alpha
  ctx.drawImage(artworkImg, art.x, art.y, art.w, art.h)
  ctx.globalAlpha = 1.0
  ctx.restore()
}
