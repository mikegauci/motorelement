import type { TextLayer } from './types'
import { COMPOSITE, CORNER_CLEAR_RADIUS_FR } from './constants'

// ---------------------------------------------------------------------------
// Text layer helpers
// ---------------------------------------------------------------------------

export function createTextLayer(id: string, defaultFontFamily = 'Arial'): TextLayer {
  return {
    id,
    text: 'Add text',
    xPct: 0.5,
    yPct: 0.2,
    fontFamily: defaultFontFamily,
    fontSizePct: 0.08,
    alignY: 'middle',
    bold: false,
    italic: false,
    underline: false,
    color: '#ffffff',
    shadow: 'black',
    visible: true,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeTextLayer(layer: any, fallbackId: string): TextLayer {
  const next = createTextLayer(fallbackId)
  const incomingColor =
    typeof layer?.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(layer.color)
      ? layer.color
      : next.color
  if (!layer || typeof layer !== 'object') return next
  return {
    ...next,
    ...layer,
    id: typeof layer.id === 'string' ? layer.id : fallbackId,
    text: typeof layer.text === 'string' ? layer.text : next.text,
    xPct: typeof layer.xPct === 'number' ? layer.xPct : next.xPct,
    yPct: typeof layer.yPct === 'number' ? layer.yPct : next.yPct,
    fontFamily:
      typeof layer.fontFamily === 'string' && layer.fontFamily.trim()
        ? layer.fontFamily
        : next.fontFamily,
    fontSizePct: typeof layer.fontSizePct === 'number' ? layer.fontSizePct : next.fontSizePct,
    alignY: ['top', 'middle', 'bottom'].includes(layer.alignY) ? layer.alignY : next.alignY,
    bold: !!layer.bold,
    italic: !!layer.italic,
    underline: !!layer.underline,
    color: incomingColor,
    shadow: ['off', 'black', 'white'].includes(layer.shadow) ? layer.shadow : next.shadow,
    visible: layer.visible !== false,
  }
}

export function clampTextPct(v: number) {
  return Math.min(1, Math.max(0, v))
}

export function clampTextFontSizePct(v: number) {
  return Math.min(0.25, Math.max(0.03, v))
}

export function clampCompositeZoom(v: number) {
  return Math.min(1.4, Math.max(0.7, v))
}

export function clampAdjust(v: number) {
  return Math.min(0.3, Math.max(-0.3, v))
}

export function clampCarScale(v: number) {
  return Math.min(1.4, Math.max(0.7, v))
}

export function getCanvasAlignedYPct(alignY: string) {
  const edgePadding = 0.08
  if (alignY === 'top') return edgePadding
  if (alignY === 'bottom') return 1 - edgePadding
  return 0.5
}

function getTextFontPx(size: number, layer: TextLayer) {
  return Math.round(size * clampTextFontSizePct(layer.fontSizePct))
}

function applyTextLayerFont(ctx: CanvasRenderingContext2D, size: number, layer: TextLayer) {
  const px = getTextFontPx(size, layer)
  const italic = layer.italic ? 'italic ' : ''
  const weight = layer.bold ? '700 ' : '400 '
  const family = layer.fontFamily || 'Arial'
  ctx.font = `${italic}${weight}${px}px "${family}", sans-serif`
  return px
}

function getCanvasTextBaseline(alignY: string): CanvasTextBaseline {
  if (alignY === 'top') return 'top'
  if (alignY === 'bottom') return 'bottom'
  return 'middle'
}

function drawTextLayer(ctx: CanvasRenderingContext2D, size: number, layer: TextLayer) {
  if (!layer?.visible) return
  const text = (layer.text || '').trim()
  if (!text) return
  const x = clampTextPct(layer.xPct) * size
  const y = clampTextPct(layer.yPct) * size
  const px = applyTextLayerFont(ctx, size, layer)
  ctx.textAlign = 'center'
  ctx.textBaseline = getCanvasTextBaseline(layer.alignY)
  ctx.fillStyle = layer.color || '#ffffff'
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  if (layer.shadow === 'black' || layer.shadow === 'white') {
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.lineWidth = Math.max(2, Math.round(px * 0.16))
    ctx.strokeStyle = layer.shadow === 'black' ? '#000000' : '#ffffff'
    ctx.strokeText(text, x, y)
  }
  ctx.fillText(text, x, y)
  if (layer.underline) {
    const metrics = ctx.measureText(text)
    const textW = metrics.width
    const baseline = getCanvasTextBaseline(layer.alignY)
    let lineY = y
    if (baseline === 'middle') lineY = y + px * 0.4
    else if (baseline === 'top') lineY = y + px * 1.1
    else lineY = y + px * 0.15
    ctx.strokeStyle = layer.color || '#ffffff'
    ctx.lineWidth = Math.max(1, Math.round(px * 0.05))
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - textW / 2, lineY)
    ctx.lineTo(x + textW / 2, lineY)
    ctx.stroke()
  }
}

export function getTextLayerBounds(ctx: CanvasRenderingContext2D, size: number, layer: TextLayer) {
  if (!layer?.visible) return null
  const text = (layer.text || '').trim()
  if (!text) return null
  const x = clampTextPct(layer.xPct) * size
  const y = clampTextPct(layer.yPct) * size
  const px = applyTextLayerFont(ctx, size, layer)
  const metrics = ctx.measureText(text)
  const width = Math.max(metrics.width, px * 0.5)
  const ascent = metrics.actualBoundingBoxAscent || px * 0.75
  const descent = metrics.actualBoundingBoxDescent || px * 0.25
  const height = Math.max(1, ascent + descent)
  const left = x - width / 2
  const top = layer.alignY === 'top' ? y : layer.alignY === 'bottom' ? y - height : y - height / 2
  return { left, top, width, height }
}

export function getLayerId() {
  return `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ---------------------------------------------------------------------------
// Image I/O
// ---------------------------------------------------------------------------

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function splitCarPhotoVertically(
  dataUrl: string,
  upscale: number = 1.5,
): Promise<[string, string, string]> {
  const img = await loadImageElement(dataUrl)
  const sliceW = Math.floor(img.naturalWidth / 3)
  const slices: string[] = []
  for (let i = 0; i < 3; i++) {
    const sx = i === 2 ? img.naturalWidth - sliceW : i * sliceW
    const c = document.createElement('canvas')
    c.width = Math.round(sliceW * upscale)
    c.height = Math.round(img.naturalHeight * upscale)
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, 0, sliceW, img.naturalHeight, 0, 0, c.width, c.height)
    slices.push(c.toDataURL('image/jpeg', 0.92))
  }
  return [slices[0], slices[1], slices[2]]
}

export async function flattenToWhite(
  src: string,
  quality: number = 0.95,
): Promise<string> {
  const img = await loadImageElement(src)
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(img, 0, 0)
  return c.toDataURL('image/jpeg', quality)
}

export async function removeWhiteBackground(src: string): Promise<string> {
  let body: string
  if (src.startsWith('http://') || src.startsWith('https://')) {
    body = JSON.stringify({ imageUrl: src })
  } else if (src.startsWith('data:')) {
    body = JSON.stringify({ imageBase64: src })
  } else {
    const blob = await fetch(src).then((r) => r.blob())
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result as string)
      fr.onerror = reject
      fr.readAsDataURL(blob)
    })
    body = JSON.stringify({ imageBase64: dataUrl })
  }

  const res = await fetch('/api/approve-transparent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Background removal failed (${res.status})`)
  }

  const blob = await res.blob()
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as string)
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
}

export function compressImageDataUrl(
  dataUrl: string,
  { maxDim = 2048, quality = 0.82 } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h)
        w = Math.round(w * scale)
        h = Math.round(h * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('Failed to load image for compression'))
    img.src = dataUrl
  })
}

// ---------------------------------------------------------------------------
// Canvas composite helpers
// ---------------------------------------------------------------------------

function stripOutsideCircleDarkCorners(ctx: CanvasRenderingContext2D, size: number) {
  const img = ctx.getImageData(0, 0, size, size)
  const d = img.data
  const cx = size / 2
  const cy = size / 2
  const R = Math.min(size, size) * CORNER_CLEAR_RADIUS_FR
  const R2 = R * R

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= R2) continue
      const i = (y * size + x) * 4
      if (d[i + 3] === 0) continue
      if (d[i] < 28 && d[i + 1] < 28 && d[i + 2] < 28) {
        d[i + 3] = 0
      }
    }
  }
  ctx.putImageData(img, 0, 0)
}

function getCarAlphaBounds(img: HTMLImageElement) {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) return null
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.drawImage(img, 0, 0)
  const id = x.getImageData(0, 0, w, h).data
  const threshold = 12
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x_ = 0; x_ < w; x_++) {
      if (id[(y * w + x_) * 4 + 3] > threshold) {
        if (x_ < minX) minX = x_
        if (x_ > maxX) maxX = x_
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  const bw = maxX - minX + 1
  const bh = maxY - minY + 1
  return { minX, minY, w: bw, h: bh }
}

export function getBackgroundArtworkBounds(img: HTMLImageElement) {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) return null
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.drawImage(img, 0, 0)
  const id = x.getImageData(0, 0, w, h).data

  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x_ = 0; x_ < w; x_++) {
      const i = (y * w + x_) * 4
      const a = id[i + 3]
      if (a < 8) continue
      const r = id[i]
      const g = id[i + 1]
      const b = id[i + 2]
      const isNearWhite = r > 245 && g > 245 && b > 245
      if (isNearWhite) continue
      if (x_ < minX) minX = x_
      if (x_ > maxX) maxX = x_
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return null
  return { minX, minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

interface CompositeOpts {
  cropBackgroundToArtwork?: boolean
  carOffsetXPct?: number
  carOffsetYPct?: number
  carScale?: number
  textLayers?: TextLayer[]
  compositionZoom?: number
  bgScale?: number
}

export function clampBgScale(v: number) {
  return Math.min(1.4, Math.max(0.5, v))
}

export function drawCompositeContent(
  ctx: CanvasRenderingContext2D,
  size: number,
  bgImg: HTMLImageElement | null,
  carImg: HTMLImageElement,
  opts: CompositeOpts = {}
) {
  const {
    cropBackgroundToArtwork = false,
    carOffsetXPct = 0,
    carOffsetYPct = 0,
    carScale: carScaleVal = 1,
    textLayers: layers = [],
    compositionZoom = 1,
    bgScale: bgScaleVal = 1,
  } = opts
  const safeCompositionZoom = clampCompositeZoom(compositionZoom)
  const safeBgScale = clampBgScale(bgScaleVal)
  const bgZoom = safeCompositionZoom * safeBgScale
  const center = size / 2
  const baseBgW = size * COMPOSITE.bgWidthPct
  const omitBackground = !bgImg
  const bgBounds =
    !omitBackground && cropBackgroundToArtwork ? getBackgroundArtworkBounds(bgImg!) : null
  const srcW = omitBackground ? 1 : bgBounds ? bgBounds.w : bgImg!.naturalWidth
  const srcH = omitBackground ? 1 : bgBounds ? bgBounds.h : bgImg!.naturalHeight
  const baseBgH = (srcH / srcW) * baseBgW
  const baseBgX = (size - baseBgW) / 2
  const baseBgY = size * COMPOSITE.bgTopPct
  const bgW = baseBgW * bgZoom
  const bgH = baseBgH * bgZoom
  const bgX = center + (baseBgX - center) * bgZoom
  const bgY = center + (baseBgY - center) * bgZoom
  const lift = size * COMPOSITE.carLiftPct
  const carOffsetX = size * carOffsetXPct
  const carOffsetY = size * carOffsetYPct
  const safeCarScale = Math.min(1.6, Math.max(0.4, carScaleVal))
  const baseCarW = baseBgW * safeCarScale
  const baseCarX = (size - baseCarW) / 2 + carOffsetX
  let carX = baseCarX
  let carY = 0
  let carW = baseCarW
  let carH = 0
  let carDrawSource: { minX: number; minY: number; sw: number; sh: number } | null = null
  const bounds = getCarAlphaBounds(carImg)
  const computeBaseCarY = (baseCarH: number) =>
    omitBackground
      ? (size - baseCarH) / 2 + carOffsetY
      : Math.max(0, size - baseCarH - lift) + carOffsetY
  if (bounds) {
    const { minX, minY, w: sw, h: sh } = bounds
    const baseCarH = (sh / sw) * baseCarW
    const baseCarY = computeBaseCarY(baseCarH)
    carW = baseCarW * safeCompositionZoom
    carH = baseCarH * safeCompositionZoom
    carX = center + (baseCarX - center) * safeCompositionZoom
    carY = center + (baseCarY - center) * safeCompositionZoom
    carDrawSource = { minX, minY, sw, sh }
  } else {
    const baseCarH = (carImg.naturalHeight / carImg.naturalWidth) * baseCarW
    const baseCarY = computeBaseCarY(baseCarH)
    carW = baseCarW * safeCompositionZoom
    carH = baseCarH * safeCompositionZoom
    carX = center + (baseCarX - center) * safeCompositionZoom
    carY = center + (baseCarY - center) * safeCompositionZoom
  }
  ctx.clearRect(0, 0, size, size)
  if (!omitBackground) {
    if (bgBounds) {
      ctx.drawImage(bgImg!, bgBounds.minX, bgBounds.minY, bgBounds.w, bgBounds.h, bgX, bgY, bgW, bgH)
    } else {
      ctx.drawImage(bgImg!, bgX, bgY, bgW, bgH)
    }
    stripOutsideCircleDarkCorners(ctx, size)
  }
  if (carDrawSource) {
    const { minX, minY, sw, sh } = carDrawSource
    ctx.drawImage(carImg, minX, minY, sw, sh, carX, carY, carW, carH)
  } else {
    ctx.drawImage(carImg, carX, carY, carW, carH)
  }

  for (const layer of layers) {
    ctx.save()
    drawTextLayer(ctx, size, layer)
    ctx.restore()
  }
}

export function readFileAsDataUrl(file: File, onDone: (result: string) => void) {
  const reader = new FileReader()
  reader.onload = (ev) => onDone(ev.target!.result as string)
  reader.readAsDataURL(file)
}

export function joinNotes(base: string, extra: string) {
  const a = typeof base === 'string' ? base.trim() : ''
  const b = typeof extra === 'string' ? extra.trim() : ''
  return [a, b].filter(Boolean).join('\n\n')
}

/**
 * Renders a small mockup thumbnail (garment + artwork overlay) for use in
 * the cart / order summary. Returns a JPEG blob at 400px.
 */
export async function buildMockupThumbnail(
  baseSrc: string,
  artworkSrc: string,
  placement: { xPct: number; yPct: number; scale: number },
  productType?: string
): Promise<Blob> {
  const { getMockupPrintZone } = await import('./constants')
  const { letterbox, printZoneRect, drawArtworkClipped } = await import('./canvas')
  const pz = getMockupPrintZone(productType)

  const [baseImg, artImg] = await Promise.all([
    loadImageElement(baseSrc),
    loadImageElement(artworkSrc),
  ])

  const size = 400
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { alpha: false })!
  ctx.fillStyle = '#181818'
  ctx.fillRect(0, 0, size, size)

  const baseRect = letterbox(baseImg.naturalWidth, baseImg.naturalHeight, size)
  ctx.drawImage(baseImg, baseRect.x, baseRect.y, baseRect.w, baseRect.h)

  const pzr = printZoneRect(baseRect, pz)
  drawArtworkClipped(ctx, artImg, pzr, placement)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create thumbnail'))),
      'image/jpeg',
      0.85
    )
  })
}

/**
 * Renders the artwork at the user's chosen position/scale into a canvas
 * matching Printify's exact print area dimensions. Returns a PNG Blob
 * ready for upload — what you see in the mockup is what gets printed.
 */
export async function buildPrintAreaPng(
  artworkSrc: string,
  placement: { xPct: number; yPct: number; scale: number },
  productType?: string
): Promise<Blob> {
  const { getPrintifyPrintArea, getPrintScaleFactor, getPrintYOffsetPx } = await import('./constants')
  const { width: paW, height: paH } = getPrintifyPrintArea(productType)
  const printFactor = getPrintScaleFactor(productType)
  const yOffset = getPrintYOffsetPx(productType)

  const img = await loadImageElement(artworkSrc)

  // Trim transparent padding so the actual artwork drives sizing
  const bounds = getCarAlphaBounds(img)
  const srcX = bounds?.minX ?? 0
  const srcY = bounds?.minY ?? 0
  const srcW = bounds?.w ?? img.naturalWidth
  const srcH = bounds?.h ?? img.naturalHeight
  const artAspect = srcW / srcH

  const artW = paW * placement.scale * printFactor
  const artH = artW / artAspect
  const artX = placement.xPct * paW - artW / 2
  const artY = placement.yPct * paH - artH / 2 + yOffset

  const canvas = document.createElement('canvas')
  canvas.width = paW
  canvas.height = paH
  const ctx = canvas.getContext('2d', { alpha: true })!
  ctx.clearRect(0, 0, paW, paH)
  ctx.drawImage(img, srcX, srcY, srcW, srcH, artX, artY, artW, artH)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create PNG'))),
      'image/png',
      1
    )
  })
}
