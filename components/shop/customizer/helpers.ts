import type { PrintZoneCorner, PrintZoneCornerImage, TextLayer } from './types'
import {
  getArtworkRect,
  getMockupPrintZoneRect,
  letterboxRect,
  type Placement,
} from './placement'
import {
  COMPOSITE,
  CORNER_CLEAR_RADIUS_FR,
  getMockupPrintZone,
  getPrintExportMultiplier,
  type PrintExportMultiplierOverrides,
} from './constants'

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
    bold: false,
    italic: false,
    underline: false,
    color: '#ffffff',
    shadow: 'black',
    visible: true,
    printZoneCorner: null,
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
  const layerRest = { ...layer } as Record<string, unknown>
  delete layerRest.alignY
  delete layerRest.printZoneTopRight
  const printZoneCorner = getPrintZoneCorner(layer.printZoneCorner)
    ?? (layer.printZoneTopRight === true ? 'top-right' : null)
  return {
    ...next,
    ...layerRest,
    id: typeof layer.id === 'string' ? layer.id : fallbackId,
    text: typeof layer.text === 'string' ? layer.text : next.text,
    xPct: typeof layer.xPct === 'number' ? layer.xPct : next.xPct,
    yPct: typeof layer.yPct === 'number' ? layer.yPct : next.yPct,
    fontFamily:
      typeof layer.fontFamily === 'string' && layer.fontFamily.trim()
        ? layer.fontFamily
        : next.fontFamily,
    fontSizePct: typeof layer.fontSizePct === 'number' ? layer.fontSizePct : next.fontSizePct,
    bold: !!layer.bold,
    italic: !!layer.italic,
    underline: !!layer.underline,
    color: incomingColor,
    shadow: ['off', 'black', 'white'].includes(layer.shadow) ? layer.shadow : next.shadow,
    visible: layer.visible !== false,
    printZoneCorner,
    printZonePreviousXPct:
      typeof layer.printZonePreviousXPct === 'number'
        ? clampTextPct(layer.printZonePreviousXPct)
        : undefined,
    printZonePreviousYPct:
      typeof layer.printZonePreviousYPct === 'number'
        ? clampTextPct(layer.printZonePreviousYPct)
        : undefined,
  }
}

function getPrintZoneCorner(value: unknown): PrintZoneCorner | null {
  return value === 'top-left' ||
    value === 'top-right' ||
    value === 'bottom-left' ||
    value === 'bottom-right'
    ? value
    : null
}

export function createPrintZoneCornerImage(): PrintZoneCornerImage {
  return {
    enabled: false,
    src: null,
    presetId: null,
    corner: 'top-right',
    sizePct: 0.12,
  }
}

export function clampCornerImageSizePct(v: number) {
  return Math.min(0.35, Math.max(0.05, v))
}

export function normalizePrintZoneCornerImage(value: unknown): PrintZoneCornerImage {
  const next = createPrintZoneCornerImage()
  if (!value || typeof value !== 'object') return next
  const image = value as Record<string, unknown>
  const rawPreset = image.presetId
  const presetId =
    typeof rawPreset === 'string' && rawPreset.trim() ? rawPreset.trim() : null
  return {
    enabled: image.enabled === true,
    src: typeof image.src === 'string' && image.src ? image.src : null,
    presetId,
    corner: getPrintZoneCorner(image.corner) ?? next.corner,
    sizePct: typeof image.sizePct === 'number' ? clampCornerImageSizePct(image.sizePct) : next.sizePct,
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
  return Math.min(0.5, Math.max(-0.5, v))
}

export function clampCarScale(v: number) {
  return Math.min(1.3, Math.max(0.7, v))
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

function getTextLayerHeight(ctx: CanvasRenderingContext2D, text: string, px: number) {
  const metrics = ctx.measureText(text)
  const ascent = metrics.actualBoundingBoxAscent || px * 0.75
  const descent = metrics.actualBoundingBoxDescent || px * 0.25
  return Math.max(1, ascent + descent)
}

function getTextLayerCenterY(ctx: CanvasRenderingContext2D, layer: TextLayer, textHeight: number) {
  const canvasHeight = Math.max(1, ctx.canvas.height)
  const minY = textHeight / 2
  const maxY = canvasHeight - textHeight / 2
  return minY + clampTextPct(layer.yPct) * Math.max(0, maxY - minY)
}

export interface PrintZoneCornerAnchorOptions {
  productType?: string
  side: 'front' | 'back'
  placement: Placement
  mockupBaseNaturalWidth?: number | null
  mockupBaseNaturalHeight?: number | null
}

function getPrintZoneCornerAnchor(
  canvasWidth: number,
  canvasHeight: number,
  corner: PrintZoneCorner | null,
  options?: PrintZoneCornerAnchorOptions,
) {
  if (!corner) return null
  if (!options) return null
  const { mockupBaseNaturalWidth, mockupBaseNaturalHeight } = options
  if (!mockupBaseNaturalWidth || !mockupBaseNaturalHeight) return null
  if (mockupBaseNaturalWidth <= 0 || mockupBaseNaturalHeight <= 0) return null
  const baseRect = letterboxRect(mockupBaseNaturalWidth, mockupBaseNaturalHeight, 1)
  const zoneRect = getMockupPrintZoneRect(baseRect, getMockupPrintZone(options.productType, options.side))
  const artworkRect = getArtworkRect(zoneRect, canvasWidth / canvasHeight, options.placement)
  if (artworkRect.w <= 0 || artworkRect.h <= 0) return null
  const basePad = Math.min(zoneRect.w, zoneRect.h)
  const xPad = basePad * 0.05
  const yPad = basePad * 0.02
  const xPadLeft = xPad + basePad * 0.02
  const isLeft = corner.endsWith('left')
  const isTop = corner.startsWith('top')
  return {
    x: canvasWidth * (((isLeft ? zoneRect.x + xPadLeft : zoneRect.x + zoneRect.w - xPad) - artworkRect.x) / artworkRect.w),
    y: canvasHeight * (((isTop ? zoneRect.y + yPad : zoneRect.y + zoneRect.h - yPad) - artworkRect.y) / artworkRect.h),
    horizontal: isLeft ? 'left' as const : 'right' as const,
    vertical: isTop ? 'top' as const : 'bottom' as const,
    printZoneWidth: canvasWidth * (zoneRect.w / artworkRect.w),
    printZoneHeight: canvasHeight * (zoneRect.h / artworkRect.h),
  }
}

export function getPrintZoneCornerTextPosition(
  canvasWidth: number,
  canvasHeight: number,
  corner: PrintZoneCorner | null,
  options?: PrintZoneCornerAnchorOptions,
) {
  const anchor = getPrintZoneCornerAnchor(canvasWidth, canvasHeight, corner, options)
  if (!anchor) return null
  return {
    xPct: clampTextPct(anchor.x / Math.max(1, canvasWidth)),
    yPct: clampTextPct(anchor.y / Math.max(1, canvasHeight)),
  }
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  size: number,
  layer: TextLayer,
  printZoneCornerOptions?: PrintZoneCornerAnchorOptions,
) {
  if (!layer?.visible) return
  const text = (layer.text || '').trim()
  if (!text) return
  const px = applyTextLayerFont(ctx, size, layer)
  const height = getTextLayerHeight(ctx, text, px)
  const anchor = layer.printZoneCorner
    ? getPrintZoneCornerAnchor(ctx.canvas.width, ctx.canvas.height, layer.printZoneCorner, printZoneCornerOptions)
    : null
  const x = anchor ? anchor.x : clampTextPct(layer.xPct) * size
  const y = anchor ? anchor.y : getTextLayerCenterY(ctx, layer, height)
  ctx.textAlign = anchor ? anchor.horizontal : 'center'
  ctx.textBaseline = anchor ? anchor.vertical : 'middle'
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
    const lineY = anchor
      ? anchor.vertical === 'top' ? y + px * 0.92 : y - px * 0.08
      : y + px * 0.4
    const left = anchor
      ? anchor.horizontal === 'left' ? x : x - textW
      : x - textW / 2
    const right = anchor
      ? anchor.horizontal === 'left' ? x + textW : x
      : x + textW / 2
    ctx.strokeStyle = layer.color || '#ffffff'
    ctx.lineWidth = Math.max(1, Math.round(px * 0.05))
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(left, lineY)
    ctx.lineTo(right, lineY)
    ctx.stroke()
  }
}

export function getTextLayerBounds(
  ctx: CanvasRenderingContext2D,
  size: number,
  layer: TextLayer,
  printZoneCornerOptions?: PrintZoneCornerAnchorOptions,
) {
  if (!layer?.visible) return null
  const text = (layer.text || '').trim()
  if (!text) return null
  const px = applyTextLayerFont(ctx, size, layer)
  const metrics = ctx.measureText(text)
  const width = Math.max(metrics.width, px * 0.5)
  const height = getTextLayerHeight(ctx, text, px)
  const anchor = layer.printZoneCorner
    ? getPrintZoneCornerAnchor(ctx.canvas.width, ctx.canvas.height, layer.printZoneCorner, printZoneCornerOptions)
    : null
  const x = anchor ? anchor.x : clampTextPct(layer.xPct) * size
  const y = anchor ? anchor.y : getTextLayerCenterY(ctx, layer, height)
  const left = anchor
    ? anchor.horizontal === 'left' ? x : x - width
    : x - width / 2
  const top = anchor
    ? anchor.vertical === 'top' ? y : y - height
    : y - height / 2
  return { left, top, width, height }
}

function getPrintZoneCornerImageRect(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cornerImage: PrintZoneCornerImage,
  printZoneCornerOptions?: PrintZoneCornerAnchorOptions,
) {
  if (!cornerImage.enabled || !cornerImage.src) return null
  const anchor = getPrintZoneCornerAnchor(
    ctx.canvas.width,
    ctx.canvas.height,
    cornerImage.corner,
    printZoneCornerOptions,
  )
  if (!anchor) return null
  const naturalW = image.naturalWidth || image.width
  const naturalH = image.naturalHeight || image.height
  if (naturalW <= 0 || naturalH <= 0) return null
  const sizePct = clampCornerImageSizePct(cornerImage.sizePct)
  const maxW = anchor.printZoneWidth * sizePct
  const maxH = anchor.printZoneHeight * sizePct
  let width = maxW
  let height = width * (naturalH / naturalW)
  if (height > maxH) {
    height = maxH
    width = height * (naturalW / naturalH)
  }
  return {
    x: anchor.horizontal === 'left' ? anchor.x : anchor.x - width,
    y: anchor.vertical === 'top' ? anchor.y : anchor.y - height,
    width,
    height,
  }
}

function drawPrintZoneCornerImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null | undefined,
  cornerImage: PrintZoneCornerImage | null | undefined,
  printZoneCornerOptions?: PrintZoneCornerAnchorOptions,
) {
  if (!image || !cornerImage) return
  const rect = getPrintZoneCornerImageRect(ctx, image, cornerImage, printZoneCornerOptions)
  if (!rect) return
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height)
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
  omitArtwork?: boolean
  omitText?: boolean
  productType?: string
  mockupPlacement?: Placement
  printZoneSide?: 'front' | 'back'
  mockupBaseNaturalWidth?: number | null
  mockupBaseNaturalHeight?: number | null
  printZoneCornerImage?: PrintZoneCornerImage
  printZoneCornerImageElement?: HTMLImageElement | null
}

export function clampBgScale(v: number) {
  return Math.min(1.2, Math.max(0.8, v))
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
    omitArtwork = false,
    omitText = false,
    productType,
    mockupPlacement,
    printZoneSide = 'front',
    mockupBaseNaturalWidth,
    mockupBaseNaturalHeight,
    printZoneCornerImage,
    printZoneCornerImageElement,
  } = opts
  const safeCompositionZoom = clampCompositeZoom(compositionZoom)
  const safeBgScale = clampBgScale(bgScaleVal)
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
  const composedBgW = baseBgW * safeCompositionZoom
  const composedBgH = baseBgH * safeCompositionZoom
  const composedBgX = center + (baseBgX - center) * safeCompositionZoom
  const composedBgY = center + (baseBgY - center) * safeCompositionZoom
  const bgW = composedBgW * safeBgScale
  const bgH = composedBgH * safeBgScale
  const bgX = composedBgX + (composedBgW - bgW) / 2
  const bgY = composedBgY
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
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  if (!omitArtwork) {
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
  }

  if (!omitText) {
    const printZoneCornerOptions = mockupPlacement
      ? {
          productType,
          side: printZoneSide,
          placement: mockupPlacement,
          mockupBaseNaturalWidth,
          mockupBaseNaturalHeight,
        }
      : undefined
    for (const layer of layers) {
      ctx.save()
      drawTextLayer(ctx, size, layer, printZoneCornerOptions)
      ctx.restore()
    }
    ctx.save()
    drawPrintZoneCornerImage(ctx, printZoneCornerImageElement, printZoneCornerImage, printZoneCornerOptions)
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

export function withPrintExportMultiplier(
  placement: Placement,
  productType: string | undefined,
  side: 'front' | 'back',
  overrides?: PrintExportMultiplierOverrides | null,
): Placement {
  const m = getPrintExportMultiplier(productType, side, overrides)
  return { ...placement, scale: placement.scale * m }
}

/**
 * Renders a small mockup thumbnail (garment + artwork overlay) for use in
 * the cart / order summary. Returns a JPEG blob at 400px.
 */
export async function buildMockupThumbnail(
  baseSrc: string,
  artworkSrc: string,
  placement: Placement,
  productType?: string,
  side: 'front' | 'back' = 'front',
): Promise<Blob> {
  const { getMockupPrintZone } = await import('./constants')
  const { letterbox, printZoneRect, drawArtworkClipped } = await import('./canvas')
  const zone = getMockupPrintZone(productType, side)

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

  const pzr = printZoneRect(baseRect, zone)
  drawArtworkClipped(ctx, artImg, pzr, placement)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create thumbnail'))),
      'image/jpeg',
      0.85
    )
  })
}

export async function buildPrintAreaPng(
  artworkSrc: string,
  placement: Placement,
  productType?: string,
  side: 'front' | 'back' = 'front',
  printMultiplierOverrides?: PrintExportMultiplierOverrides | null,
): Promise<Blob> {
  const { getProductProfile } = await import('./constants')
  const { getArtworkRect, getPrintAreaRect } = await import('./placement')
  const profile = getProductProfile(productType)
  const { width: paW, height: paH } = profile.printArea[side]

  const img = await loadImageElement(artworkSrc)

  const aspect = img.naturalWidth / img.naturalHeight

  const art = getArtworkRect(
    getPrintAreaRect(profile, side),
    aspect,
    withPrintExportMultiplier(placement, productType, side, printMultiplierOverrides),
  )

  const canvas = document.createElement('canvas')
  canvas.width = paW
  canvas.height = paH
  const ctx = canvas.getContext('2d', { alpha: true })!
  ctx.clearRect(0, 0, paW, paH)
  ctx.drawImage(img, art.x, art.y, art.w, art.h)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create PNG'))),
      'image/png',
      1
    )
  })
}
