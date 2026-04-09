/* eslint-disable @typescript-eslint/ban-ts-comment -- large MVP UI bundle */
// @ts-nocheck — MVP customizer; migrate to typed helpers incrementally
'use client'
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, @next/next/no-img-element, react/no-unescaped-entities -- MVP customizer UI */
import { useState, useRef, useEffect, useMemo } from 'react'

/** Tailwind class map — replaces the CSS module with dark-theme classes matching the sitewide design system. */
const styles: Record<string, string> = {
  main: 'font-body',
  header: 'mb-8',
  headerTop: 'flex flex-wrap items-start justify-between gap-4',
  btnNewProject: 'h-9 px-3.5 text-xs font-sub font-bold uppercase tracking-widest text-white bg-carbon border border-border cursor-pointer transition-colors shrink-0 hover:bg-white/10',
  title: 'font-heading text-2xl text-white mb-1',
  subtitle: 'text-sm text-muted m-0',
  sessionHint: 'text-xs text-muted mt-2.5 leading-relaxed m-0',
  setup: 'grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6',
  setupBlock: 'flex flex-col gap-1.5',
  vehicleFields: 'grid grid-cols-1 gap-3',
  vehicleActions: 'flex items-center gap-2.5 mt-1.5',
  radioRow: 'flex gap-4 items-center',
  radioLabel: 'flex items-center gap-1.5 text-sm text-white cursor-pointer [&_input]:accent-ignition [&_input]:cursor-pointer',
  styleRow: 'flex items-end gap-4 mt-0.5',
  styleToggleGroup: 'flex gap-1',
  styleToggle: 'w-9 h-9 flex items-center justify-center border border-border bg-carbon text-white text-[15px] cursor-pointer transition-all hover:border-white/30 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed',
  styleToggleActive: '!border-ignition bg-ignition/10 !text-white',
  styleToggleBold: 'font-extrabold font-serif',
  styleToggleItalic: 'italic font-medium font-serif',
  styleToggleUnderline: 'underline font-medium font-serif',
  shadowSwatchGroup: 'flex flex-col gap-1.5',
  shadowSwatches: 'flex gap-1',
  shadowSwatch: 'w-9 h-9 flex items-center justify-center border border-border bg-carbon cursor-pointer transition-all hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed',
  shadowSwatchActive: '!border-ignition bg-ignition/10',
  shadowSwatchOff: '',
  shadowSwatchBlack: '',
  shadowSwatchWhite: '',
  shadowSwatchPreview: 'w-[18px] h-[18px] rounded-full border border-border',
  label: 'font-sub text-xs font-bold uppercase tracking-widest text-muted',
  input: 'h-10 border border-border bg-carbon px-3 text-sm text-white w-full box-border transition-colors focus:outline-none focus:border-ignition disabled:opacity-50 disabled:cursor-not-allowed',
  hint: 'text-xs text-muted m-0 [&_a]:text-white [&_a]:underline-offset-2',
  uploadZone: 'border-[1.5px] border-dashed border-border min-h-[140px] flex items-center justify-center cursor-pointer bg-carbon transition-colors hover:bg-white/5 hover:border-white/20 overflow-hidden',
  hasImage: '!border-solid !border-border !min-h-0',
  preview: 'w-full h-[300px] object-cover bg-carbon block',
  uploadPlaceholder: 'flex flex-col items-center gap-2 text-muted text-sm',
  uploadIcon: 'text-2xl',
  promptBlock: 'mb-6 flex flex-col gap-1.5',
  textarea: 'border border-border bg-carbon px-3 py-2.5 text-sm font-mono text-white w-full box-border resize-y leading-relaxed transition-colors focus:outline-none focus:border-ignition disabled:opacity-50 disabled:cursor-not-allowed',
  tweakBlock: 'mb-6 flex flex-col gap-1.5',
  actions: 'flex gap-2.5 items-center',
  btnPrimary: 'h-10 px-5 bg-ignition text-white border-none text-xs font-sub font-bold uppercase tracking-widest cursor-pointer transition-colors hover:bg-ignition/90 disabled:opacity-35 disabled:cursor-not-allowed',
  btn: 'h-10 px-4 bg-carbon text-white border border-border text-sm cursor-pointer transition-colors hover:bg-white/10',
  results: 'mt-2',
  resultsTitle: 'text-lg font-heading text-white mb-5',
  grid: 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start',
  tweakPanel: 'flex flex-col gap-4',
  resultSidePanel: 'flex flex-col gap-5 [&_.actions]:mb-0',
  tweakPanelActions: 'flex gap-2.5 items-center',
  collapseToggle: 'inline-flex items-center gap-1.5 w-fit p-0 border-0 bg-transparent text-sm font-semibold text-white cursor-pointer',
  card: 'border border-border overflow-hidden bg-obsidian',
  resultCardSticky: 'md:sticky md:top-[18px] self-start',
  cardHeader: 'py-3.5 px-4 border-b border-border flex items-start justify-between gap-2',
  cardTitle: 'text-sm font-semibold text-white',
  cardTag: 'text-xs text-muted mt-0.5',
  badge: 'text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0',
  badgePending: 'bg-carbon text-muted',
  badgeRunning: 'bg-ignition/10 text-ignition',
  badgeDone: 'bg-emerald-500/10 text-emerald-400',
  badgeError: 'bg-redline/10 text-redline',
  cardBody: 'min-h-[460px] max-h-[460px] bg-carbon flex flex-col items-stretch justify-center overflow-hidden max-md:min-h-[360px] max-md:max-h-[360px]',
  errorWithImage: 'w-full self-stretch',
  spinnerWrap: 'flex flex-col items-center justify-center min-h-full gap-3',
  spinner: 'w-7 h-7 border-2 border-border border-t-muted rounded-full animate-spin',
  spinnerText: 'text-sm text-muted m-0',
  resultImg: 'w-full block',
  resultImgWrap: 'w-full leading-[0] max-md:max-w-[360px] max-md:mx-auto',
  checkered: '[background-color:#333] [background-image:linear-gradient(45deg,#444_25%,transparent_25%),linear-gradient(-45deg,#444_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#444_75%),linear-gradient(-45deg,transparent_75%,#444_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0px]',
  approveRow: 'flex flex-wrap items-center gap-3 px-4 py-3 border-t border-border bg-obsidian',
  btnApprove: 'h-10 px-[18px] bg-ignition text-white border-none text-xs font-sub font-bold uppercase tracking-widest cursor-pointer transition-colors hover:bg-ignition/90 disabled:opacity-45 disabled:cursor-not-allowed',
  approveHint: 'text-xs text-muted max-w-[420px] leading-relaxed',
  revThumbCheckered: '[background-color:#333] [background-image:linear-gradient(45deg,#444_25%,transparent_25%),linear-gradient(-45deg,#444_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#444_75%),linear-gradient(-45deg,transparent_75%,#444_75%)] [background-size:8px_8px] [background-position:0_0,0_4px,4px_-4px,-4px_0px]',
  resultFrame: 'relative w-full self-stretch',
  resultFrameComposite: '',
  generatingOverlay: 'absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/60 backdrop-blur-sm',
  overlayText: 'text-sm text-muted m-0',
  revisionBanner: 'absolute left-0 right-0 bottom-0 px-3 py-2.5 text-xs text-ignition bg-ignition/10 border-t border-ignition/20',
  revisionBar: 'flex items-center justify-center gap-3 px-3 py-2.5 border-t border-border bg-obsidian',
  revNav: 'w-9 h-8 border border-border bg-carbon text-base font-medium text-white cursor-pointer leading-[1] transition-colors hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed',
  revMeta: 'text-xs text-muted max-w-[min(60vw,420px)] overflow-hidden text-ellipsis whitespace-nowrap text-center',
  revisionStrip: 'flex flex-wrap gap-2 px-3 py-2.5 border-t border-border bg-obsidian',
  revThumb: 'relative w-14 h-14 p-0 border-2 border-border overflow-hidden cursor-pointer bg-carbon shrink-0 transition-colors [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:block hover:border-white/30',
  revThumbActive: '!border-ignition shadow-[0_0_0_1px_theme(colors.ignition)]',
  revThumbLabel: 'absolute bottom-0.5 right-0.5 text-[10px] font-semibold text-white bg-black/55 px-1.5 py-px leading-tight',
  errorText: 'text-xs text-redline p-4 text-center m-0 break-words',
  cardFooter: 'px-4 py-3 border-t border-border',
  cardDesc: 'text-xs text-muted leading-relaxed m-0',
  presetSection: 'mt-10 pt-8 border-t border-border',
  presetSectionInline: '!mt-0 !pt-0 !border-t-0',
  presetSectionTitle: 'text-lg font-heading text-white mb-2',
  presetSectionIntro: 'text-sm text-muted mb-5 max-w-[56ch] leading-relaxed m-0',
  backgroundProgress: 'inline-flex items-center gap-2.5 text-xs text-muted mb-3.5',
  btnBackgroundCancel: 'h-[30px] px-3 border border-border bg-carbon text-white text-xs cursor-pointer hover:bg-white/10',
  presetPicker: 'flex flex-wrap gap-3 mb-6 max-md:grid max-md:grid-cols-3 max-md:gap-2.5',
  presetOption: 'flex flex-col items-stretch w-[105px] p-0 border-2 border-border bg-obsidian cursor-pointer overflow-hidden transition-colors hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60 max-md:w-full max-md:min-w-0',
  presetOptionActive: '!border-ignition shadow-[0_0_0_1px_theme(colors.ignition)]',
  presetThumbWrap: 'block w-full aspect-square bg-void',
  presetThumb: 'w-full h-full object-cover block',
  presetNoneLabel: 'flex items-center justify-center aspect-square text-sm font-medium text-muted [background-image:repeating-conic-gradient(#222_0%_25%,#333_0%_50%)] [background-size:16px_16px]',
  presetNewLabel: 'flex items-center justify-center aspect-square text-[28px] font-light text-muted bg-carbon border-b border-border',
  presetOptionNew: '!border-dashed !border-border/60 hover:!border-white/30',
  presetOptionCaption: 'text-[11px] text-muted px-1.5 py-2 text-center leading-tight',
  presetOptionSub: 'text-[10px] text-muted/60 px-1.5 pb-2 -mt-1 text-center leading-tight',
  customBackgroundPanel: 'max-w-[720px] mb-5 flex flex-col gap-3',
  customBackgroundError: 'm-0 text-xs text-redline',
  compositeBlock: 'mt-2',
  compositeAdjustRow: 'flex flex-wrap items-end justify-start gap-3 mb-2.5 max-md:flex-col max-md:items-stretch max-md:gap-3.5',
  compositeAdjustControl: 'min-w-[260px] flex-1 max-md:min-w-0',
  compositeAdjustHead: 'flex items-center justify-between text-xs text-muted mb-1.5',
  compositeAdjustValue: 'font-semibold text-white',
  compositeAdjustInputRow: 'flex items-center gap-2 [&_input[type=range]]:w-full [&_input[type=range]]:min-w-0 [&_input[type=range]]:accent-ignition',
  compositeNudgeBtn: 'w-8 h-8 border border-border bg-carbon text-white text-lg leading-[1] cursor-pointer hover:bg-white/10 disabled:opacity-45 disabled:cursor-not-allowed',
  compositeLabel: 'text-xs font-sub font-bold uppercase tracking-widest text-muted mb-2.5',
  compositeStage: 'relative w-full max-w-[720px] mx-auto [background-color:#333] [background-image:linear-gradient(45deg,#444_25%,transparent_25%),linear-gradient(-45deg,#444_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#444_75%),linear-gradient(-45deg,transparent_75%,#444_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0px] overflow-hidden border border-border shadow-lg aspect-square touch-none cursor-grab max-md:[touch-action:pan-y_pinch-zoom] max-md:cursor-default',
  canvasSpaceControls: 'absolute top-2.5 right-2.5 z-[2] flex flex-col items-center gap-1.5 p-1.5 rounded-lg bg-black/80 border border-border backdrop-blur-sm max-md:top-2 max-md:right-2 [&>button]:w-7 [&>button]:h-7 [&>button]:text-base max-md:[&>button]:w-[30px] max-md:[&>button]:h-[30px] max-md:[&>button]:text-lg',
  canvasSpaceValue: 'min-w-[34px] text-center text-[11px] font-semibold text-white',
  compositeCanvas: 'block w-full h-auto',
  textOverlayBlock: 'mt-3.5 border border-border p-3 bg-obsidian',
  textOverlayHeader: 'flex items-center justify-between gap-2.5 mb-2.5 max-md:flex-wrap max-md:items-start',
  textOverlayEmpty: 'm-0 text-xs text-muted',
  textLayerList: 'flex flex-col gap-2',
  textLayerRow: 'flex items-center justify-between gap-2.5 border border-border p-2 bg-carbon cursor-pointer',
  textLayerRowActive: '!border-ignition bg-ignition/5',
  textLayerName: 'text-xs text-white whitespace-nowrap overflow-hidden text-ellipsis',
  textLayerActions: 'flex items-center gap-1.5',
  textLayerEditor: 'mt-3 flex flex-col gap-2.5',
  textLayerGrid: 'grid grid-cols-[1fr_auto] gap-2.5 items-end max-md:grid-cols-1',
  colorInput: 'w-14 h-10 border border-border bg-carbon p-0 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed',
  textOverlayHint: 'm-0 text-xs text-muted',
  alignBtnRow: 'flex gap-2 mb-2',
  alignBtn: 'h-[34px] min-w-[78px] px-2.5 border border-border bg-carbon text-white text-sm cursor-pointer hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed',
  alignBtnActive: '!border-ignition bg-ignition/10 font-semibold',
  compositeExportRow: 'flex flex-wrap items-center gap-3 mt-3.5',
  btnExport: 'h-10 px-[18px] bg-ignition text-white border-none text-xs font-sub font-bold uppercase tracking-widest cursor-pointer transition-colors hover:bg-ignition/90 disabled:opacity-50 disabled:cursor-not-allowed',
  compositeExportHint: 'text-xs text-muted max-w-[42ch] leading-relaxed',
  mobileResultDock: 'hidden max-md:block fixed right-3.5 bottom-3.5 w-[140px] h-[140px] p-0 border-2 border-ignition overflow-hidden [background-color:#333] [background-image:linear-gradient(45deg,#444_25%,transparent_25%),linear-gradient(-45deg,#444_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#444_75%),linear-gradient(-45deg,transparent_75%,#444_75%)] [background-size:12px_12px] [background-position:0_0,0_6px,6px_-6px,-6px_0px] shadow-[0_10px_20px_rgba(0,0,0,0.4)] z-[60] cursor-pointer opacity-0 translate-y-4 translate-x-2.5 pointer-events-none transition-all duration-200 [&_img]:w-full [&_img]:h-full [&_img]:object-contain [&_img]:block max-[380px]:w-[100px] max-[380px]:h-[100px]',
  mobileResultDockVisible: '!opacity-100 !translate-y-0 !translate-x-0 !pointer-events-auto',
}

/** Persists session across refresh (same tab) so you can keep testing without re-generating. */
const SESSION_KEY = 'car-vector-session-v1'
const PENDING_GENERATION_KEY = 'car-vector-pending-generation-v1'
const PENDING_BACKGROUND_KEY = 'car-vector-pending-background-v1'

/** Served from /public/presets — retrowave & torii backgrounds. */
const BACKGROUND_PRESETS = [
  { id: 'retrowave-ii', name: 'Retrowave', src: '/presets/retrowave-ii.png' },
  { id: 'torii-gate', name: 'Torii gate', src: '/presets/torii-gate.png' },
]
const CUSTOM_BACKGROUND_NEW = 'custom-new'
const CUSTOM_BACKGROUND_PREFIX = 'custom-'

/**
 * Preset art is scaled inside the square; the car is scaled to the same width as that
 * layer so it matches the circular artwork diameter (not full canvas width).
 */
const COMPOSITE = {
  bgWidthPct: 0.74,
  bgTopPct: 0.055,
  /** Nudge car up from the bottom edge (fraction of canvas height). Tune to match print layout. */
  carLiftPct: 0.11,
  exportSize: 4096,
}

/** Outside this radius (fraction of min side), dark pixels are treated as outer matte and cleared. */
const CORNER_CLEAR_RADIUS_FR = 0.49
const TEXT_FONTS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Tahoma', label: 'Tahoma' },
]

function createTextLayer(id, defaultFontFamily = 'Arial') {
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
    shadow: 'off',
    visible: true,
  }
}

function normalizeTextLayer(layer, fallbackId) {
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

function clampTextPct(v) {
  return Math.min(1, Math.max(0, v))
}

function clampTextFontSizePct(v) {
  return Math.min(0.25, Math.max(0.03, v))
}

function clampCompositeZoom(v) {
  return Math.min(1.4, Math.max(0.7, v))
}

function getCanvasAlignedYPct(alignY) {
  const edgePadding = 0.08
  if (alignY === 'top') return edgePadding
  if (alignY === 'bottom') return 1 - edgePadding
  return 0.5
}

function getTextFontPx(size, layer) {
  return Math.round(size * clampTextFontSizePct(layer.fontSizePct))
}

function applyTextLayerFont(ctx, size, layer) {
  const px = getTextFontPx(size, layer)
  const italic = layer.italic ? 'italic ' : ''
  const weight = layer.bold ? '700 ' : '400 '
  const family = layer.fontFamily || 'Arial'
  ctx.font = `${italic}${weight}${px}px "${family}", sans-serif`
  return px
}

function getCanvasTextBaseline(alignY) {
  if (alignY === 'top' || alignY === 'bottom') return alignY
  return 'middle'
}

function drawTextLayer(ctx, size, layer) {
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

function getTextLayerBounds(ctx, size, layer) {
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
  return {
    left,
    top,
    width,
    height,
  }
}

function getLayerId() {
  return `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Call /api/approve-transparent to remove the white background from a generated image.
 * Returns a data URL of the transparent PNG.
 */
async function removeWhiteBackground(src) {
  let body
  if (src.startsWith('http://') || src.startsWith('https://')) {
    body = JSON.stringify({ imageUrl: src })
  } else if (src.startsWith('data:')) {
    body = JSON.stringify({ imageBase64: src })
  } else {
    const blob = await fetch(src).then((r) => r.blob())
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result)
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
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
}

/**
 * Resize + JPEG-compress an image data URL on the client so it stays
 * well under Vercel's ~4.5 MB body-size limit when sent as base64 JSON.
 */
function compressImageDataUrl(dataUrl, { maxDim = 2048, quality = 0.82 } = {}) {
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
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('Failed to load image for compression'))
    img.src = dataUrl
  })
}

/** Remove dark corner / outer matte outside the circle (before drawing the car). */
function stripOutsideCircleDarkCorners(ctx, size) {
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

/** Tight bounds of non-transparent pixels so the car sits on the bottom of the stage (not the bitmap). */
function getCarAlphaBounds(img) {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) return null
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d', { willReadFrequently: true })
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

/**
 * Custom generated backgrounds may include a large white square around the circle.
 * We trim to non-white painted content so composition matches built-in presets.
 */
function getBackgroundArtworkBounds(img) {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) return null
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d', { willReadFrequently: true })
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

/** Shared layout: bg → strip corners → car same width as bg layer, centered, lifted from bottom (trimmed alpha). */
function drawCompositeContent(ctx, size, bgImg, carImg, opts = {}) {
  const {
    cropBackgroundToArtwork = false,
    carOffsetXPct = 0,
    carOffsetYPct = 0,
    carScale = 1,
    textLayers = [],
    compositionZoom = 1,
  } = opts
  const safeCompositionZoom = clampCompositeZoom(compositionZoom)
  const center = size / 2
  const baseBgW = size * COMPOSITE.bgWidthPct
  const omitBackground = !bgImg
  const bgBounds =
    !omitBackground && cropBackgroundToArtwork ? getBackgroundArtworkBounds(bgImg) : null
  const srcW = omitBackground ? 1 : bgBounds ? bgBounds.w : bgImg.naturalWidth
  const srcH = omitBackground ? 1 : bgBounds ? bgBounds.h : bgImg.naturalHeight
  const baseBgH = (srcH / srcW) * baseBgW
  const baseBgX = (size - baseBgW) / 2
  const baseBgY = size * COMPOSITE.bgTopPct
  const bgW = baseBgW * safeCompositionZoom
  const bgH = baseBgH * safeCompositionZoom
  const bgX = center + (baseBgX - center) * safeCompositionZoom
  const bgY = center + (baseBgY - center) * safeCompositionZoom
  const lift = size * COMPOSITE.carLiftPct
  const carOffsetX = size * carOffsetXPct
  const carOffsetY = size * carOffsetYPct
  const safeCarScale = Math.min(1.6, Math.max(0.4, carScale))
  const baseCarW = baseBgW * safeCarScale
  const baseCarX = (size - baseCarW) / 2 + carOffsetX
  let carX = baseCarX
  let carY = 0
  let carW = baseCarW
  let carH = 0
  let carDrawSource = null
  const bounds = getCarAlphaBounds(carImg)
  if (bounds) {
    const { minX, minY, w: sw, h: sh } = bounds
    const baseCarH = (sh / sw) * baseCarW
    const baseCarY = Math.max(0, size - baseCarH - lift) + carOffsetY
    carW = baseCarW * safeCompositionZoom
    carH = baseCarH * safeCompositionZoom
    carX = center + (baseCarX - center) * safeCompositionZoom
    carY = center + (baseCarY - center) * safeCompositionZoom
    carDrawSource = { minX, minY, sw, sh }
  } else {
    const baseCarH = (carImg.naturalHeight / carImg.naturalWidth) * baseCarW
    const baseCarY = Math.max(0, size - baseCarH - lift) + carOffsetY
    carW = baseCarW * safeCompositionZoom
    carH = baseCarH * safeCompositionZoom
    carX = center + (baseCarX - center) * safeCompositionZoom
    carY = center + (baseCarY - center) * safeCompositionZoom
  }
  ctx.clearRect(0, 0, size, size)
  if (!omitBackground) {
    if (bgBounds) {
      ctx.drawImage(
        bgImg,
        bgBounds.minX,
        bgBounds.minY,
        bgBounds.w,
        bgBounds.h,
        bgX,
        bgY,
        bgW,
        bgH
      )
    } else {
      ctx.drawImage(bgImg, bgX, bgY, bgW, bgH)
    }
    stripOutsideCircleDarkCorners(ctx, size)
  }
  if (carDrawSource) {
    const { minX, minY, sw, sh } = carDrawSource
    ctx.drawImage(carImg, minX, minY, sw, sh, carX, carY, carW, carH)
  } else {
    ctx.drawImage(carImg, carX, carY, carW, carH)
  }

  for (const layer of textLayers) {
    ctx.save()
    drawTextLayer(ctx, size, layer)
    ctx.restore()
  }
}

async function drawCompositeFromSrc(ctx, size, bgSrc, carSrc, opts = {}) {
  const carImg = await loadImageElement(carSrc)
  if (!bgSrc) {
    drawCompositeContent(ctx, size, null, carImg, opts)
    return
  }
  const bgImg = await loadImageElement(bgSrc)
  drawCompositeContent(ctx, size, bgImg, carImg, opts)
}

function downloadPngBlob(blob, fileSlug) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileSlug || 'composite'}.png`
  a.click()
  URL.revokeObjectURL(url)
}

async function buildCompositePngBlob({
  bgSrc = null,
  carSrc,
  cropBackgroundToArtwork = false,
  carOffsetXPct = 0,
  carOffsetYPct = 0,
  carScale = 1,
  textLayers = [],
  compositionZoom = 1,
}) {
  const size = COMPOSITE.exportSize
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { alpha: true })
  await drawCompositeFromSrc(ctx, size, bgSrc || null, carSrc, {
    cropBackgroundToArtwork,
    carOffsetXPct,
    carOffsetYPct,
    carScale,
    textLayers,
    compositionZoom,
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not create PNG'))
          return
        }
        resolve(blob)
      },
      'image/png',
      1
    )
  })
}

export default function ProductCustomizer() {
  const [carModel, setCarModel] = useState('')
  const [showNumberPlate, setShowNumberPlate] = useState(false)
  const [numberPlate, setNumberPlate] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')

  const [carImageDataUrl, setCarImageDataUrl] = useState(null)
  const [carImagePreview, setCarImagePreview] = useState(null)

  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [elapsed, setElapsed] = useState(0)

  /** Each successful output (initial + tweaks); viewIndex selects which is shown. */
  const [revisions, setRevisions] = useState([])
  const [viewIndex, setViewIndex] = useState(0)

  /** After first successful generation: vehicle fields stay fixed; tweaks extend prompt notes cumulatively. */
  const [vehicleLocked, setVehicleLocked] = useState(false)
  const [composedPromptNotes, setComposedPromptNotes] = useState('')
  const [tweakNotes, setTweakNotes] = useState('')

  const carFileRef = useRef()
  const timerRef = useRef(null)
  const resultSectionRef = useRef(null)
  const resultCardRef = useRef(null)
  const compositeStageRef = useRef(null)
  const compositeCanvasRef = useRef(null)
  const compositeRenderRef = useRef(() => {})
  const carAdjustXRef = useRef(0)
  const carAdjustYRef = useRef(0)
  const carScaleRef = useRef(1)
  const compositionZoomRef = useRef(1)
  const textLayersRef = useRef([])

  const [sessionRestored, setSessionRestored] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState(null)
  const [exportingComposite, setExportingComposite] = useState(false)
  const [savedCustomBackgrounds, setSavedCustomBackgrounds] = useState([])
  const [customBackgroundImageDataUrl, setCustomBackgroundImageDataUrl] = useState(null)
  const [customBackgroundImagePreview, setCustomBackgroundImagePreview] = useState(null)
  const [customBackgroundValue, setCustomBackgroundValue] = useState('')
  const [customBackgroundGenerating, setCustomBackgroundGenerating] = useState(false)
  const [customBackgroundRemoving, setCustomBackgroundRemoving] = useState(false)
  const [customBackgroundElapsed, setCustomBackgroundElapsed] = useState(0)
  const [customBackgroundError, setCustomBackgroundError] = useState('')
  const [backgroundTweakNotes, setBackgroundTweakNotes] = useState('')
  const [isVehicleTweakOpen, setIsVehicleTweakOpen] = useState(false)
  const [isBackgroundTweakOpen, setIsBackgroundTweakOpen] = useState(false)
  const [carAdjustXPct, setCarAdjustXPct] = useState(0)
  const [carAdjustYPct, setCarAdjustYPct] = useState(0)
  const [carScale, setCarScale] = useState(1)
  const [compositionZoom, setCompositionZoom] = useState(1)
  const [textLayers, setTextLayers] = useState([])
  const [selectedTextLayerId, setSelectedTextLayerId] = useState(null)
  const [customFontOptions, setCustomFontOptions] = useState([])
  const [desktopDragEnabled, setDesktopDragEnabled] = useState(false)
  const [showMobileResultDock, setShowMobileResultDock] = useState(false)
  const [mobileCompositePreviewSrc, setMobileCompositePreviewSrc] = useState('')
  const [activeCarRequest, setActiveCarRequest] = useState(null)
  const [activeBackgroundRequest, setActiveBackgroundRequest] = useState(null)
  const customBackgroundTimerRef = useRef(null)
  const carDragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  })
  const textDragRef = useRef({
    active: false,
    pointerId: null,
    layerId: null,
    startPointerX: 0,
    startPointerY: 0,
    startSize: 1,
    startXPct: 0,
    startYPct: 0,
  })
  const customBackgroundFileRef = useRef(null)
  const generationPollRunRef = useRef(0)
  const backgroundPollRunRef = useRef(0)
  const loadedCustomFontFamiliesRef = useRef(new Set())

  const availableFontOptions = customFontOptions.length > 0 ? customFontOptions : TEXT_FONTS

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 721px) and (pointer: fine)')
    const update = () => setDesktopDragEnabled(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadFontOptions() {
      try {
        const res = await fetch('/api/fonts')
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !Array.isArray(data.fonts)) return
        if (!cancelled) setCustomFontOptions(data.fonts)
      } catch (_) {}
    }
    loadFontOptions()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!customFontOptions.length) return
    if (typeof FontFace === 'undefined' || !document?.fonts) return
    let cancelled = false
    async function loadCustomFonts() {
      for (const font of customFontOptions) {
        if (cancelled) return
        if (!font?.value || !font?.url) continue
        if (loadedCustomFontFamiliesRef.current.has(font.value)) continue
        try {
          const fontFace = new FontFace(font.value, `url(${font.url})`)
          await fontFace.load()
          document.fonts.add(fontFace)
          loadedCustomFontFamiliesRef.current.add(font.value)
        } catch (_) {}
      }
      if (!cancelled) compositeRenderRef.current()
    }
    loadCustomFonts()
    return () => {
      cancelled = true
    }
  }, [customFontOptions])

  useEffect(() => {
    if (!customFontOptions.length) return
    const allowed = new Set(availableFontOptions.map((font) => font.value))
    if (!allowed.size) return
    setTextLayers((prev) => {
      let changed = false
      const next = prev.map((layer) => {
        if (allowed.has(layer.fontFamily)) return layer
        changed = true
        return { ...layer, fontFamily: availableFontOptions[0].value }
      })
      return changed ? next : prev
    })
  }, [customFontOptions, availableFontOptions])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_GENERATION_KEY)
      if (!raw) return
      const pending = JSON.parse(raw)
      if (!pending?.requestId || !pending?.endpointId) {
        sessionStorage.removeItem(PENDING_GENERATION_KEY)
        return
      }
      resumePendingGeneration(pending)
    } catch (_) {}
  }, [])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_BACKGROUND_KEY)
      if (!raw) return
      const pending = JSON.parse(raw)
      if (!pending?.requestId || !pending?.endpointId || !pending?.kind) {
        sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
        return
      }
      resumePendingBackgroundGeneration(pending)
    } catch (_) {}
  }, [])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        if (typeof s.carModel === 'string' || typeof s.year === 'string') {
          const model = typeof s.carModel === 'string' ? s.carModel.trim() : ''
          const yearFromOldSession = typeof s.year === 'string' ? s.year.trim() : ''
          const combinedVehicle = [model, yearFromOldSession].filter(Boolean).join(', ')
          setCarModel(combinedVehicle)
        }
        if (typeof s.showNumberPlate === 'boolean') setShowNumberPlate(s.showNumberPlate)
        if (typeof s.numberPlate === 'string') setNumberPlate(s.numberPlate)
        if (typeof s.customerNotes === 'string') setCustomerNotes(s.customerNotes)
        if (typeof s.carImageDataUrl === 'string') {
          setCarImageDataUrl(s.carImageDataUrl)
          setCarImagePreview(s.carImagePreview ?? s.carImageDataUrl)
        }
        if (Array.isArray(s.revisions) && s.revisions.length > 0) {
          setRevisions(s.revisions)
          const max = s.revisions.length - 1
          const vi =
            typeof s.viewIndex === 'number'
              ? Math.min(Math.max(0, s.viewIndex), max)
              : max
          setViewIndex(vi)
        }
        if (s.vehicleLocked === true) setVehicleLocked(true)
        if (typeof s.composedPromptNotes === 'string') {
          setComposedPromptNotes(s.composedPromptNotes)
        }
        if (typeof s.tweakNotes === 'string') setTweakNotes(s.tweakNotes)
        if (typeof s.selectedPresetId === 'string' || s.selectedPresetId === null) {
          setSelectedPresetId(s.selectedPresetId ?? null)
        }
        if (Array.isArray(s.savedCustomBackgrounds)) {
          setSavedCustomBackgrounds(s.savedCustomBackgrounds)
        }
        if (typeof s.customBackgroundImageDataUrl === 'string') {
          setCustomBackgroundImageDataUrl(s.customBackgroundImageDataUrl)
          setCustomBackgroundImagePreview(
            s.customBackgroundImagePreview ?? s.customBackgroundImageDataUrl
          )
        }
        if (typeof s.customBackgroundValue === 'string') {
          setCustomBackgroundValue(s.customBackgroundValue)
        }
        if (typeof s.carAdjustXPct === 'number') setCarAdjustXPct(s.carAdjustXPct)
        if (typeof s.carAdjustYPct === 'number') setCarAdjustYPct(s.carAdjustYPct)
        if (typeof s.carScale === 'number') setCarScale(s.carScale)
        if (typeof s.compositionZoom === 'number') {
          setCompositionZoom(clampCompositeZoom(s.compositionZoom))
        } else if (typeof s.backgroundZoom === 'number') {
          setCompositionZoom(clampCompositeZoom(s.backgroundZoom))
        }
        if (Array.isArray(s.textLayers)) {
          const normalized = s.textLayers.map((layer, index) =>
            normalizeTextLayer(layer, `restored-text-${index + 1}`)
          )
          setTextLayers(normalized)
        }
        if (typeof s.selectedTextLayerId === 'string' || s.selectedTextLayerId === null) {
          setSelectedTextLayerId(s.selectedTextLayerId ?? null)
        }
        setStatus('done')
      }
    } catch (e) {
      console.warn('Session restore failed', e)
    }
    setSessionRestored(true)
  }, [])

  useEffect(() => {
    if (!sessionRestored) return
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          carModel,
          showNumberPlate,
          numberPlate,
          customerNotes,
          carImageDataUrl,
          carImagePreview,
          revisions,
          viewIndex,
          vehicleLocked,
          composedPromptNotes,
          tweakNotes,
          selectedPresetId,
          savedCustomBackgrounds,
          customBackgroundImageDataUrl,
          customBackgroundImagePreview,
          customBackgroundValue,
          carAdjustXPct,
          carAdjustYPct,
          carScale,
          compositionZoom,
          textLayers,
          selectedTextLayerId,
        })
      )
    } catch (e) {
      console.warn('Session save failed (storage may be full)', e)
    }
  }, [
    sessionRestored,
    carModel,
    showNumberPlate,
    numberPlate,
    customerNotes,
    carImageDataUrl,
    carImagePreview,
    revisions,
    viewIndex,
    vehicleLocked,
    composedPromptNotes,
    tweakNotes,
    selectedPresetId,
    customBackgroundImageDataUrl,
    customBackgroundImagePreview,
    customBackgroundValue,
    savedCustomBackgrounds,
    carAdjustXPct,
    carAdjustYPct,
    carScale,
    compositionZoom,
    textLayers,
    selectedTextLayerId,
  ])

  function readFileAsDataUrl(file, onDone) {
    const reader = new FileReader()
    reader.onload = (ev) => onDone(ev.target.result)
    reader.readAsDataURL(file)
  }

  function handleCarFile(e) {
    const file = e.target.files[0]
    if (!file) return
    readFileAsDataUrl(file, async (dataUrl) => {
      setCarImagePreview(dataUrl)
      try {
        const compressed = await compressImageDataUrl(dataUrl)
        setCarImageDataUrl(compressed)
        setCarImagePreview(compressed)
      } catch {
        setCarImageDataUrl(dataUrl)
      }
    })
  }

  function handleCustomBackgroundFile(e) {
    const file = e.target.files[0]
    if (!file) return
    readFileAsDataUrl(file, async (dataUrl) => {
      setCustomBackgroundImagePreview(dataUrl)
      setCustomBackgroundError('')
      setSelectedPresetId(CUSTOM_BACKGROUND_NEW)
      try {
        const compressed = await compressImageDataUrl(dataUrl)
        setCustomBackgroundImageDataUrl(compressed)
        setCustomBackgroundImagePreview(compressed)
      } catch {
        setCustomBackgroundImageDataUrl(dataUrl)
      }
    })
  }

  function startTimer() {
    let t = 0
    timerRef.current = setInterval(() => {
      t++
      setElapsed(t)
    }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  async function pollGenerationUntilComplete({ requestId, endpointId, runId }) {
    while (generationPollRunRef.current === runId) {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', requestId, endpointId, mode: 'car' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || `Status check failed (${res.status})`)
      }
      const st = String(data.status || '').toUpperCase()
      if (st === 'COMPLETED') {
        if (!data.url) throw new Error('No image URL in completed result')
        return data.url
      }
      if (st === 'FAILED' || st === 'CANCELED') {
        throw new Error(data.error || `Generation ${st.toLowerCase()}`)
      }
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
    throw new Error('Generation polling cancelled')
  }

  async function finalizeGenerationFromUrl(url, notesSnapshot, wasLocked, tweakSnapshot) {
    let finalUrl = url
    let isTransparent = false
    try {
      finalUrl = await removeWhiteBackground(url)
      isTransparent = true
    } catch (bgErr) {
      console.warn('Auto background removal failed, keeping original:', bgErr)
    }

    setStatus('done')
    if (!wasLocked) {
      setRevisions([{ url: finalUrl, label: '1 · Initial', transparent: isTransparent }])
      setViewIndex(0)
      setVehicleLocked(true)
      setComposedPromptNotes(notesSnapshot || '')
    } else {
      const applied = (tweakSnapshot || '').trim()
      const short = applied.length > 42 ? `${applied.slice(0, 42)}…` : applied
      setRevisions((prev) => {
        const next = [
          ...prev,
          {
            url: finalUrl,
            label: `${prev.length + 1} · Tweak${short ? ` — ${short}` : ''}`,
            transparent: isTransparent,
          },
        ]
        setViewIndex(next.length - 1)
        return next
      })
      setComposedPromptNotes((prev) => joinNotes(prev, tweakSnapshot))
      setTweakNotes('')
    }
  }

  async function resumePendingGeneration(pending) {
    setStatus('running')
    setRunning(true)
    setElapsed(0)
    startTimer()
    const runId = Date.now()
    generationPollRunRef.current = runId
    setActiveCarRequest({
      requestId: pending.requestId,
      endpointId: pending.endpointId,
    })
    try {
      const generatedUrl = await pollGenerationUntilComplete({
        requestId: pending.requestId,
        endpointId: pending.endpointId,
        runId,
      })
      if (generationPollRunRef.current !== runId) return
      stopTimer()
      sessionStorage.removeItem(PENDING_GENERATION_KEY)
      await finalizeGenerationFromUrl(
        generatedUrl,
        pending.notesForPrompt || '',
        !!pending.wasLocked,
        pending.tweakNotes || ''
      )
    } catch (err) {
      if (generationPollRunRef.current !== runId) return
      stopTimer()
      setStatus('error:' + (err.message || 'Generation failed'))
      sessionStorage.removeItem(PENDING_GENERATION_KEY)
    } finally {
      if (generationPollRunRef.current === runId) {
        setRunning(false)
        setActiveCarRequest(null)
      }
    }
  }

  async function cancelCarGeneration() {
    const req = activeCarRequest
    generationPollRunRef.current++
    stopTimer()
    setElapsed(0)
    setRunning(false)
    setStatus(revisions.length > 0 ? 'done' : '')
    setActiveCarRequest(null)
    try {
      sessionStorage.removeItem(PENDING_GENERATION_KEY)
    } catch (_) {}
    if (!req?.requestId || !req?.endpointId) return
    try {
      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          requestId: req.requestId,
          endpointId: req.endpointId,
        }),
      })
    } catch (_) {}
  }

  function startBackgroundTimer() {
    if (customBackgroundTimerRef.current) clearInterval(customBackgroundTimerRef.current)
    let t = 0
    setCustomBackgroundElapsed(0)
    customBackgroundTimerRef.current = setInterval(() => {
      t++
      setCustomBackgroundElapsed(t)
    }, 1000)
  }

  function stopBackgroundTimer() {
    if (customBackgroundTimerRef.current) clearInterval(customBackgroundTimerRef.current)
    customBackgroundTimerRef.current = null
  }

  async function pollBackgroundUntilComplete({ requestId, endpointId, runId }) {
    while (backgroundPollRunRef.current === runId) {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', requestId, endpointId, mode: 'background' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Status check failed (${res.status})`)
      const st = String(data.status || '').toUpperCase()
      if (st === 'COMPLETED') {
        if (!data.url) throw new Error('No image URL in completed background result')
        return data.url
      }
      if (st === 'FAILED' || st === 'CANCELED') {
        throw new Error(data.error || `Background generation ${st.toLowerCase()}`)
      }
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
    throw new Error('Background generation polling cancelled')
  }

  async function finalizeCustomBackgroundResult(rawUrl, originalValue) {
    const cleaned = await removeBackgroundForCustomBackground(rawUrl)
    const thumb = await generateCustomThumb(cleaned)
    const newId = `${CUSTOM_BACKGROUND_PREFIX}${Date.now()}`
    const label = (originalValue || '').slice(0, 30) || 'Custom'
    setSavedCustomBackgrounds((prev) => [
      ...prev,
      { id: newId, resultUrl: cleaned, thumbUrl: thumb, label, value: originalValue || '' },
    ])
    setSelectedPresetId(newId)
    setCustomBackgroundImageDataUrl(null)
    setCustomBackgroundImagePreview(null)
    setCustomBackgroundValue('')
    if (customBackgroundFileRef.current) customBackgroundFileRef.current.value = ''
  }

  async function finalizeBackgroundTweakResult(rawUrl, combinedValue, baseLabel, tweakText) {
    const cleaned = await removeBackgroundForCustomBackground(rawUrl)
    const thumb = await generateCustomThumb(cleaned)
    const newId = `${CUSTOM_BACKGROUND_PREFIX}${Date.now()}`
    const short = (tweakText || '').trim().slice(0, 24)
    const label = `${baseLabel || 'Custom'} · ${short}`
    setSavedCustomBackgrounds((prev) => [
      ...prev,
      { id: newId, resultUrl: cleaned, thumbUrl: thumb, label, value: combinedValue || '' },
    ])
    setSelectedPresetId(newId)
    setBackgroundTweakNotes('')
  }

  async function resumePendingBackgroundGeneration(pending) {
    setCustomBackgroundGenerating(true)
    startBackgroundTimer()
    setCustomBackgroundError('')
    const runId = Date.now()
    backgroundPollRunRef.current = runId
    setActiveBackgroundRequest({
      requestId: pending.requestId,
      endpointId: pending.endpointId,
    })
    try {
      const rawUrl = await pollBackgroundUntilComplete({
        requestId: pending.requestId,
        endpointId: pending.endpointId,
        runId,
      })
      if (backgroundPollRunRef.current !== runId) return
      if (pending.kind === 'tweak') {
        await finalizeBackgroundTweakResult(
          rawUrl,
          pending.combinedValue || '',
          pending.baseLabel || 'Custom',
          pending.tweakText || ''
        )
      } else {
        await finalizeCustomBackgroundResult(rawUrl, pending.originalValue || '')
      }
      sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
    } catch (err) {
      if (backgroundPollRunRef.current !== runId) return
      setCustomBackgroundError(err.message || 'Background generation failed')
      sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
    } finally {
      if (backgroundPollRunRef.current === runId) {
        stopBackgroundTimer()
        setCustomBackgroundGenerating(false)
        setActiveBackgroundRequest(null)
      }
    }
  }

  async function cancelBackgroundGeneration() {
    const req = activeBackgroundRequest
    backgroundPollRunRef.current++
    stopBackgroundTimer()
    setCustomBackgroundElapsed(0)
    setCustomBackgroundGenerating(false)
    setActiveBackgroundRequest(null)
    try {
      sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
    } catch (_) {}
    if (!req?.requestId || !req?.endpointId) return
    try {
      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          requestId: req.requestId,
          endpointId: req.endpointId,
        }),
      })
    } catch (_) {}
  }

  function joinNotes(base, extra) {
    const a = typeof base === 'string' ? base.trim() : ''
    const b = typeof extra === 'string' ? extra.trim() : ''
    return [a, b].filter(Boolean).join('\n\n')
  }

  async function runGeneration() {
    if (!carImageDataUrl) {
      setStatus('error:Upload the car photo')
      return
    }
    if (vehicleLocked && !tweakNotes.trim()) {
      setStatus('error:Add tweak notes to describe what to change')
      return
    }

    setStatus('running')
    setElapsed(0)
    startTimer()
    setRunning(true)
    const runId = Date.now()
    generationPollRunRef.current = runId
    try {
      const notesForPrompt = vehicleLocked
        ? joinNotes(composedPromptNotes, tweakNotes)
        : customerNotes

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          carImageDataUrl,
          carModel,
          showNumberPlate,
          numberPlate,
          customerNotes: notesForPrompt,
        }),
      })
      if (res.status === 413) {
        stopTimer()
        setStatus('error:Image too large — try a smaller photo or lower resolution')
        setRunning(false)
        return
      }
      const data = await res.json()
      if (!data.requestId || !data.endpointId) {
        throw new Error(data.error || 'Failed to start generation')
      }
      setActiveCarRequest({
        requestId: data.requestId,
        endpointId: data.endpointId,
      })

      const pendingPayload = {
        requestId: data.requestId,
        endpointId: data.endpointId,
        wasLocked: vehicleLocked,
        notesForPrompt,
        tweakNotes,
      }
      sessionStorage.setItem(PENDING_GENERATION_KEY, JSON.stringify(pendingPayload))

      const generatedUrl = await pollGenerationUntilComplete({
        requestId: data.requestId,
        endpointId: data.endpointId,
        runId,
      })
      if (generationPollRunRef.current !== runId) return
      stopTimer()
      sessionStorage.removeItem(PENDING_GENERATION_KEY)
      await finalizeGenerationFromUrl(generatedUrl, notesForPrompt, vehicleLocked, tweakNotes)
    } catch (err) {
      if (generationPollRunRef.current === runId) {
        stopTimer()
        sessionStorage.removeItem(PENDING_GENERATION_KEY)
        setStatus('error:' + err.message)
      }
    }
    if (generationPollRunRef.current === runId) {
      setRunning(false)
      setActiveCarRequest(null)
    }
  }

  /** Clears session storage and all UI state so you can start a brand new image (refresh will not restore old work). */
  function reset() {
    stopTimer()
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch (_) {}
    if (carFileRef.current) carFileRef.current.value = ''
    setStatus('')
    setElapsed(0)
    setRunning(false)
    setVehicleLocked(false)
    setComposedPromptNotes('')
    setTweakNotes('')
    setRevisions([])
    setViewIndex(0)
    setSelectedPresetId(null)
    setSavedCustomBackgrounds([])
    setCustomBackgroundImageDataUrl(null)
    setCustomBackgroundImagePreview(null)
    setCustomBackgroundValue('')
    setCustomBackgroundGenerating(false)
    setCustomBackgroundRemoving(false)
    setCustomBackgroundError('')
    setBackgroundTweakNotes('')
    setCarAdjustXPct(0)
    setCarAdjustYPct(0)
    setCarScale(1)
    setCompositionZoom(1)
    setTextLayers([])
    setSelectedTextLayerId(null)
    setActiveCarRequest(null)
    setActiveBackgroundRequest(null)
    generationPollRunRef.current++
    backgroundPollRunRef.current++
    try {
      sessionStorage.removeItem(PENDING_GENERATION_KEY)
      sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
    } catch (_) {}
    if (customBackgroundFileRef.current) customBackgroundFileRef.current.value = ''
    setCarImageDataUrl(null)
    setCarImagePreview(null)
    setCarModel('')
    setNumberPlate('')
    setCustomerNotes('')
  }

  const baseReady =
    carImageDataUrl && !running
  const canRun = vehicleLocked
    ? baseReady && !!tweakNotes.trim()
    : baseReady

  const isRunning = status === 'running'
  const isDone = status === 'done'
  const isError = status.startsWith('error')
  const errorMsg = isError ? status.replace('error:', '') : null
  const showResults = isRunning || isError || revisions.length > 0

  const revCount = revisions.length
  const latestIdx = revCount > 0 ? revCount - 1 : -1
  const viewingUrl = revCount > 0 ? revisions[viewIndex]?.url : null
  const currentLabel = revCount > 0 ? revisions[viewIndex]?.label : ''
  const canGoPrev = viewIndex > 0
  const canGoNext = viewIndex < latestIdx
  const viewingLatest = revCount > 0 && viewIndex === latestIdx
  const showGeneratingOnLatest = isRunning && revCount > 0 && viewingLatest
  const showGeneratingWhileBrowsing = isRunning && revCount > 0 && !viewingLatest

  const viewingTransparent = !!revisions[viewIndex]?.transparent

  function renderMainResultImg(url, alt) {
    const inner = <img src={url} alt={alt || ''} className={styles.resultImg} />
    if (!viewingTransparent) {
      return <div className={styles.resultImgWrap}>{inner}</div>
    }
    return <div className={`${styles.resultImgWrap} ${styles.checkered}`}>{inner}</div>
  }

  const hasTransparentRevision = revisions.some((r) => r.transparent)

  const transparentCarUrlForPreset = useMemo(() => {
    const cur = revisions[viewIndex]
    if (cur?.transparent) return cur.url
    for (let i = revisions.length - 1; i >= 0; i--) {
      if (revisions[i].transparent) return revisions[i].url
    }
    return null
  }, [revisions, viewIndex])

  const selectedPreset = BACKGROUND_PRESETS.find((p) => p.id === selectedPresetId)
  const isCustomSavedSelection =
    typeof selectedPresetId === 'string' &&
    selectedPresetId.startsWith(CUSTOM_BACKGROUND_PREFIX) &&
    selectedPresetId !== CUSTOM_BACKGROUND_NEW
  const selectedCustomBg = isCustomSavedSelection
    ? savedCustomBackgrounds.find((bg) => bg.id === selectedPresetId)
    : null
  const selectedBackgroundSrc = isCustomSavedSelection
    ? selectedCustomBg?.resultUrl ?? null
    : selectedPreset?.src ?? null
  const selectedBackgroundIsCustom = isCustomSavedSelection
  const showUnifiedCompositeResult = !!transparentCarUrlForPreset
  const mobileResultDockSrc = showUnifiedCompositeResult
    ? mobileCompositePreviewSrc || transparentCarUrlForPreset || viewingUrl
    : viewingUrl
  const showCustomPanel = selectedPresetId === CUSTOM_BACKGROUND_NEW
  const backgroundControlsLocked = customBackgroundGenerating
  const canGenerateCustomBackground =
    !!customBackgroundValue.trim() && !customBackgroundGenerating && !customBackgroundRemoving
  const selectedTextLayer = useMemo(
    () => textLayers.find((layer) => layer.id === selectedTextLayerId) || null,
    [textLayers, selectedTextLayerId]
  )

  useEffect(() => {
    carAdjustXRef.current = carAdjustXPct
    carAdjustYRef.current = carAdjustYPct
    carScaleRef.current = carScale
    compositionZoomRef.current = compositionZoom
    compositeRenderRef.current()
  }, [carAdjustXPct, carAdjustYPct, carScale, compositionZoom])

  useEffect(() => {
    textLayersRef.current = textLayers
    compositeRenderRef.current()
  }, [textLayers])

  useEffect(() => {
    if (!selectedTextLayerId) return
    if (textLayers.some((layer) => layer.id === selectedTextLayerId)) return
    setSelectedTextLayerId(textLayers[0]?.id ?? null)
  }, [textLayers, selectedTextLayerId])

  useEffect(() => {
    if (!transparentCarUrlForPreset) return
    const stage = compositeStageRef.current
    const canvas = compositeCanvasRef.current
    if (!stage || !canvas) return

    let cancelled = false
    let bgImg = null
    let carImg = null

    function paint() {
      if (cancelled || !carImg) return
      if (selectedBackgroundSrc && !bgImg) return
      const cssSize = Math.min(Math.floor(stage.clientWidth), 720)
      if (cssSize < 2) return
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3))
      const pixelSize = Math.round(cssSize * dpr)
      if (canvas.width !== pixelSize) canvas.width = pixelSize
      if (canvas.height !== pixelSize) canvas.height = pixelSize
      const ctx = canvas.getContext('2d', { alpha: true })
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.clearRect(0, 0, pixelSize, pixelSize)
      drawCompositeContent(ctx, pixelSize, selectedBackgroundSrc ? bgImg : null, carImg, {
        cropBackgroundToArtwork: selectedBackgroundIsCustom,
        carOffsetXPct: carAdjustXRef.current,
        carOffsetYPct: carAdjustYRef.current,
        carScale: carScaleRef.current,
        textLayers: textLayersRef.current,
        compositionZoom: compositionZoomRef.current,
      })
      try {
        setMobileCompositePreviewSrc(canvas.toDataURL('image/png'))
      } catch (_) {}
    }

    compositeRenderRef.current = paint

    const bgPromise = selectedBackgroundSrc
      ? loadImageElement(selectedBackgroundSrc)
      : Promise.resolve(null)

    Promise.all([bgPromise, loadImageElement(transparentCarUrlForPreset)]).then(
      ([nextBgImg, nextCarImg]) => {
        if (cancelled) return
        bgImg = nextBgImg
        carImg = nextCarImg
        paint()
      }
    )

    const ro = new ResizeObserver(() => {
      paint()
    })
    ro.observe(stage)

    return () => {
      cancelled = true
      compositeRenderRef.current = () => {}
      ro.disconnect()
    }
  }, [selectedBackgroundSrc, selectedBackgroundIsCustom, transparentCarUrlForPreset])

  useEffect(() => {
    if (showUnifiedCompositeResult) return
    setMobileCompositePreviewSrc('')
  }, [showUnifiedCompositeResult, viewingUrl])

  useEffect(() => {
    if (!showResults) {
      setShowMobileResultDock(false)
      return
    }

    function syncMobileDockVisibility() {
      const card = resultCardRef.current
      if (!card) {
        setShowMobileResultDock(false)
        return
      }
      const rect = card.getBoundingClientRect()
      const earlyShowOffsetPx = 200
      const scrolledPastResult = rect.bottom < earlyShowOffsetPx
      setShowMobileResultDock(scrolledPastResult)
    }

    syncMobileDockVisibility()
    window.addEventListener('scroll', syncMobileDockVisibility, { passive: true })
    window.addEventListener('resize', syncMobileDockVisibility)
    return () => {
      window.removeEventListener('scroll', syncMobileDockVisibility)
      window.removeEventListener('resize', syncMobileDockVisibility)
    }
  }, [showResults])

  async function handleExportComposite() {
    if (!transparentCarUrlForPreset) return
    setExportingComposite(true)
    try {
      const fileSlug = !selectedBackgroundSrc
        ? 'car-transparent'
        : isCustomSavedSelection
        ? 'car-custom-background'
        : `car-${selectedPreset?.id || 'background'}`
      const compositeOpts = {
        bgSrc: selectedBackgroundSrc || null,
        carSrc: transparentCarUrlForPreset,
        cropBackgroundToArtwork: selectedBackgroundIsCustom,
        carOffsetXPct: carAdjustXPct,
        carOffsetYPct: carAdjustYPct,
        carScale,
        textLayers,
        compositionZoom,
      }
      const blob = await buildCompositePngBlob(compositeOpts)
      downloadPngBlob(blob, fileSlug)

      const fd = new FormData()
      fd.append('file', blob, `${fileSlug}.png`)
      fd.append(
        'metadata',
        JSON.stringify({
          kind: 'print_export',
          file_slug: fileSlug,
          preset_id: selectedPreset?.id ?? null,
          preset_label: selectedPreset?.label ?? null,
          is_custom_saved_background: isCustomSavedSelection,
          custom_background_label: selectedCustomBg?.label ?? null,
          crop_background_to_artwork: selectedBackgroundIsCustom,
          car_adjust_x_pct: carAdjustXPct,
          car_adjust_y_pct: carAdjustYPct,
          car_scale: carScale,
          composition_zoom: compositionZoom,
          text_layer_count: textLayers.length,
        })
      )
      const saveRes = await fetch('/api/save-artwork', { method: 'POST', body: fd })
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}))
        console.warn('Could not save artwork to Supabase:', err.error || saveRes.status)
      }
    } catch (e) {
      alert(e.message || 'Export failed')
    } finally {
      setExportingComposite(false)
    }
  }

  async function runCustomBackgroundGeneration() {
    if (!customBackgroundValue.trim()) {
      setCustomBackgroundError('Enter a value for Location/Theme')
      return
    }

    setCustomBackgroundGenerating(true)
    const runId = Date.now()
    backgroundPollRunRef.current = runId
    startBackgroundTimer()
    setCustomBackgroundError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          mode: 'background',
          backgroundImageDataUrl: customBackgroundImageDataUrl,
          backgroundValue: customBackgroundValue.trim(),
        }),
      })
      if (res.status === 413) {
        setCustomBackgroundError('Image too large — try a smaller photo or lower resolution')
        return
      }
      const originalValue = customBackgroundValue.trim()
      const data = await res.json()
      if (!res.ok || !data.requestId || !data.endpointId) {
        setCustomBackgroundError(data.error || 'Background generation failed')
        return
      }
      setActiveBackgroundRequest({
        requestId: data.requestId,
        endpointId: data.endpointId,
      })
      sessionStorage.setItem(
        PENDING_BACKGROUND_KEY,
        JSON.stringify({
          kind: 'custom',
          requestId: data.requestId,
          endpointId: data.endpointId,
          originalValue,
        })
      )
      const rawUrl = await pollBackgroundUntilComplete({
        requestId: data.requestId,
        endpointId: data.endpointId,
        runId,
      })
      if (backgroundPollRunRef.current !== runId) return
      await finalizeCustomBackgroundResult(rawUrl, originalValue)
      sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
    } catch (err) {
      if (backgroundPollRunRef.current === runId) {
        setCustomBackgroundError(err.message || 'Background generation failed')
        sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
      }
    } finally {
      if (backgroundPollRunRef.current === runId) {
        stopBackgroundTimer()
        setCustomBackgroundGenerating(false)
        setActiveBackgroundRequest(null)
      }
    }
  }

  async function removeBackgroundForCustomBackground(sourceUrlOrDataUrl) {
    setCustomBackgroundRemoving(true)
    try {
      const body = sourceUrlOrDataUrl.startsWith('http://') || sourceUrlOrDataUrl.startsWith('https://')
        ? {
            imageUrl: sourceUrlOrDataUrl,
            addWhiteBorder: false,
            mode: 'circle-outside-only',
            circleInsetPx: 4,
          }
        : {
            imageBase64: sourceUrlOrDataUrl,
            addWhiteBorder: false,
            mode: 'circle-outside-only',
            circleInsetPx: 4,
          }
      const res = await fetch('/api/approve-transparent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Background remove failed (${res.status})`)
      }
      const blob = await res.blob()
      const dataUrlOut = await new Promise((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(fr.result)
        fr.onerror = reject
        fr.readAsDataURL(blob)
      })
      return dataUrlOut
    } finally {
      setCustomBackgroundRemoving(false)
    }
  }

  async function runBackgroundTweak() {
    if (!selectedCustomBg || !backgroundTweakNotes.trim()) return
    if (customBackgroundGenerating || customBackgroundRemoving) return

    const combinedValue = `${selectedCustomBg.value}\n\n${backgroundTweakNotes.trim()}`
    setCustomBackgroundGenerating(true)
    const runId = Date.now()
    backgroundPollRunRef.current = runId
    startBackgroundTimer()
    setCustomBackgroundError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          mode: 'background',
          backgroundValue: combinedValue,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.requestId || !data.endpointId) {
        setCustomBackgroundError(data.error || 'Background tweak failed')
        return
      }
      setActiveBackgroundRequest({
        requestId: data.requestId,
        endpointId: data.endpointId,
      })
      const tweakText = backgroundTweakNotes.trim()
      sessionStorage.setItem(
        PENDING_BACKGROUND_KEY,
        JSON.stringify({
          kind: 'tweak',
          requestId: data.requestId,
          endpointId: data.endpointId,
          combinedValue,
          baseLabel: selectedCustomBg.label,
          tweakText,
        })
      )
      const rawUrl = await pollBackgroundUntilComplete({
        requestId: data.requestId,
        endpointId: data.endpointId,
        runId,
      })
      if (backgroundPollRunRef.current !== runId) return
      await finalizeBackgroundTweakResult(rawUrl, combinedValue, selectedCustomBg.label, tweakText)
      sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
    } catch (err) {
      if (backgroundPollRunRef.current === runId) {
        setCustomBackgroundError(err.message || 'Background tweak failed')
        sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
      }
    } finally {
      if (backgroundPollRunRef.current === runId) {
        stopBackgroundTimer()
        setCustomBackgroundGenerating(false)
        setActiveBackgroundRequest(null)
      }
    }
  }

  async function generateCustomThumb(resultUrl) {
    try {
      const img = await loadImageElement(resultUrl)
      const bounds = getBackgroundArtworkBounds(img)
      const sx = bounds ? bounds.minX : 0
      const sy = bounds ? bounds.minY : 0
      const sw = bounds ? bounds.w : img.naturalWidth
      const sh = bounds ? bounds.h : img.naturalHeight
      const size = 512
      const c = document.createElement('canvas')
      c.width = size
      c.height = size
      const x = c.getContext('2d', { alpha: true })
      x.fillStyle = '#0a0a0a'
      x.fillRect(0, 0, size, size)
      const targetW = size * 0.9
      const targetH = (sh / sw) * targetW
      const dx = (size - targetW) / 2
      const dy = (size - targetH) / 2
      x.drawImage(img, sx, sy, sw, sh, dx, dy, targetW, targetH)
      return c.toDataURL('image/png')
    } catch (_) {
      return resultUrl
    }
  }

  function clampAdjust(v) {
    return Math.min(0.3, Math.max(-0.3, v))
  }

  function clampCarScale(v) {
    return Math.min(1.4, Math.max(0.7, v))
  }

  function nudgeCarAdjustY(deltaPct) {
    setCarAdjustYPct((prev) => clampAdjust(prev + deltaPct))
  }

  function nudgeCarScale(delta) {
    setCarScale((prev) => clampCarScale(prev + delta))
  }

  function nudgeCompositeZoom(delta) {
    setCompositionZoom((prev) => clampCompositeZoom(prev + delta))
  }

  function resetCompositeZoom() {
    setCompositionZoom(1)
  }
  const activeZoom = compositionZoom

  function renderCompositeStage() {
    return (
      <div
        className={styles.compositeStage}
        ref={compositeStageRef}
        onPointerDown={desktopDragEnabled ? handleCompositePointerDown : undefined}
        onPointerMove={desktopDragEnabled ? handleCompositePointerMove : undefined}
        onPointerUp={desktopDragEnabled ? handleCompositePointerUp : undefined}
        onPointerCancel={desktopDragEnabled ? handleCompositePointerUp : undefined}
      >
        <div
          className={styles.canvasSpaceControls}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={styles.compositeNudgeBtn}
            onClick={() => resetCompositeZoom()}
            disabled={backgroundControlsLocked || compositionZoom === 1}
            aria-label="Reset zoom"
            title="Reset zoom"
          >
            ↻
          </button>
          <button
            type="button"
            className={styles.compositeNudgeBtn}
            onClick={() => nudgeCompositeZoom(-0.05)}
            disabled={backgroundControlsLocked || activeZoom <= 0.7}
            aria-label="Zoom out"
          >
            -
          </button>
          <span className={styles.canvasSpaceValue}>
            {Math.round(activeZoom * 100)}%
          </span>
          <button
            type="button"
            className={styles.compositeNudgeBtn}
            onClick={() => nudgeCompositeZoom(0.05)}
            disabled={backgroundControlsLocked || activeZoom >= 1.4}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
        <canvas ref={compositeCanvasRef} className={styles.compositeCanvas} aria-hidden />
      </div>
    )
  }

  function addTextLayer() {
    const id = getLayerId()
    const layer = createTextLayer(id, availableFontOptions[0]?.value || 'Arial')
    setTextLayers((prev) => [...prev, layer])
    setSelectedTextLayerId(id)
  }

  function updateTextLayer(layerId, patch) {
    setTextLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer
        const next = { ...layer, ...patch }
        if (typeof next.xPct === 'number') next.xPct = clampTextPct(next.xPct)
        if (typeof next.yPct === 'number') next.yPct = clampTextPct(next.yPct)
        if (typeof next.fontSizePct === 'number') {
          next.fontSizePct = clampTextFontSizePct(next.fontSizePct)
        }
        return next
      })
    )
  }

  function nudgeTextFontSize(layerId, delta) {
    const layer = textLayersRef.current.find((it) => it.id === layerId)
    if (!layer) return
    updateTextLayer(layerId, { fontSizePct: layer.fontSizePct + delta })
  }

  function alignTextLayerToCanvasVertical(layerId, nextAlignY) {
    updateTextLayer(layerId, {
      alignY: nextAlignY,
      yPct: getCanvasAlignedYPct(nextAlignY),
    })
  }

  function removeTextLayer(layerId) {
    setTextLayers((prev) => prev.filter((layer) => layer.id !== layerId))
  }

  function moveTextLayer(layerId, direction) {
    setTextLayers((prev) => {
      const index = prev.findIndex((layer) => layer.id === layerId)
      if (index < 0) return prev
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  function getCompositePointerPixel(e) {
    const stage = compositeStageRef.current
    const canvas = compositeCanvasRef.current
    if (!stage || !canvas) return null
    const rect = stage.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function handleCompositePointerDown(e) {
    if (!transparentCarUrlForPreset) return
    const stage = compositeStageRef.current
    const canvas = compositeCanvasRef.current
    if (!stage) return
    if (selectedTextLayerId && canvas) {
      const activeLayer = textLayersRef.current.find((layer) => layer.id === selectedTextLayerId)
      const pointer = getCompositePointerPixel(e)
      if (activeLayer && pointer) {
        const ctx = canvas.getContext('2d', { alpha: true })
        if (ctx) {
          const bounds = getTextLayerBounds(ctx, canvas.width, activeLayer)
          if (bounds) {
            const pad = Math.max(10, canvas.width * 0.015)
            const inBounds =
              pointer.x >= bounds.left - pad &&
              pointer.x <= bounds.left + bounds.width + pad &&
              pointer.y >= bounds.top - pad &&
              pointer.y <= bounds.top + bounds.height + pad
            if (inBounds) {
              const drag = textDragRef.current
              drag.active = true
              drag.pointerId = e.pointerId
              drag.layerId = activeLayer.id
              drag.startPointerX = pointer.x
              drag.startPointerY = pointer.y
              drag.startSize = Math.max(1, canvas.width)
              drag.startXPct = activeLayer.xPct
              drag.startYPct = activeLayer.yPct
              stage.setPointerCapture?.(e.pointerId)
              return
            }
          }
        }
      }
    }
    const drag = carDragRef.current
    drag.active = true
    drag.pointerId = e.pointerId
    drag.startX = e.clientX
    drag.startY = e.clientY
    drag.startOffsetX = carAdjustXPct
    drag.startOffsetY = carAdjustYPct
    stage.setPointerCapture?.(e.pointerId)
  }

  function handleCompositePointerMove(e) {
    const textDrag = textDragRef.current
    if (textDrag.active && textDrag.pointerId === e.pointerId) {
      const pointer = getCompositePointerPixel(e)
      if (!pointer) return
      const dxPct = (pointer.x - textDrag.startPointerX) / textDrag.startSize
      const dyPct = (pointer.y - textDrag.startPointerY) / textDrag.startSize
      updateTextLayer(textDrag.layerId, {
        xPct: textDrag.startXPct + dxPct,
        yPct: textDrag.startYPct + dyPct,
      })
      return
    }
    const drag = carDragRef.current
    if (!drag.active || drag.pointerId !== e.pointerId) return
    const stage = compositeStageRef.current
    if (!stage) return
    const size = Math.max(1, stage.clientWidth)
    const dxPct = (e.clientX - drag.startX) / size
    const dyPct = (e.clientY - drag.startY) / size
    setCarAdjustXPct(clampAdjust(drag.startOffsetX + dxPct))
    setCarAdjustYPct(clampAdjust(drag.startOffsetY + dyPct))
  }

  function handleCompositePointerUp(e) {
    const textDrag = textDragRef.current
    if (textDrag.active && textDrag.pointerId === e.pointerId) {
      textDrag.active = false
      textDrag.pointerId = null
      textDrag.layerId = null
      const stage = compositeStageRef.current
      stage?.releasePointerCapture?.(e.pointerId)
      return
    }
    const drag = carDragRef.current
    if (!drag.active || drag.pointerId !== e.pointerId) return
    drag.active = false
    drag.pointerId = null
    const stage = compositeStageRef.current
    stage?.releasePointerCapture?.(e.pointerId)
  }

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Motor Element Product Customizer</h1>
          </div>
          <button type="button" className={styles.btnNewProject} onClick={reset}>
            New project
          </button>
        </div>
        <p className={styles.sessionHint}>
          Upload a photo of your car and we'll generate a vector illustration of it.
        </p>
      </div>

      <div className={styles.setup}>
        <div className={styles.setupBlock}>
          {/* <label className={styles.label}>Uploaded</label> */}
          <div
            className={`${styles.uploadZone} ${carImagePreview ? styles.hasImage : ''}`}
            onClick={() => carFileRef.current.click()}
          >
            {carImagePreview ? (
              <img src={carImagePreview} alt="Car preview" className={styles.preview} />
            ) : (
              <div className={styles.uploadPlaceholder}>
                <span className={styles.uploadIcon}>↑</span>
                <span>Click to upload your car photo</span>
              </div>
            )}
          </div>
          <input
            ref={carFileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleCarFile}
          />
        </div>

        <div className={styles.vehicleFields}>
          <div className={styles.setupBlock}>
            <label className={styles.label}>Car model and year</label>
            <input
              className={styles.input}
              type="text"
              placeholder="Honda NSX 1991"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              disabled={vehicleLocked}
            />
          </div>
          <div className={styles.setupBlock}>
            <label className={styles.label}>Show number plate?</label>
            <div className={styles.radioRow}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="showNumberPlate"
                  checked={!showNumberPlate}
                  onChange={() => { setShowNumberPlate(false); setNumberPlate('') }}
                  disabled={vehicleLocked}
                />
                No
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="showNumberPlate"
                  checked={showNumberPlate}
                  onChange={() => setShowNumberPlate(true)}
                  disabled={vehicleLocked}
                />
                Yes
              </label>
            </div>
            {showNumberPlate && (
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. ABC 123"
                value={numberPlate}
                onChange={(e) => setNumberPlate(e.target.value)}
                disabled={vehicleLocked}
              />
            )}
          </div>
          <div className={styles.setupBlock}>
            <label className={styles.label}>Customisation Notes</label>
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="Add any details you wish to include or exclude"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              disabled={vehicleLocked}
            />
          </div>
          {!vehicleLocked && (
            <div className={styles.vehicleActions}>
              <button className={styles.btnPrimary} onClick={runGeneration} disabled={!canRun}>
                {running ? 'Generating…' : 'Generate illustration'}
              </button>
              {running && (
                <button type="button" className={styles.btn} onClick={cancelCarGeneration}>
                  Cancel request
                </button>
              )}
              {isDone && revCount > 0 && (
                <button type="button" className={styles.btn} onClick={reset}>
                  Start over
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showResults && (
        <div className={styles.results} ref={resultSectionRef}>
          <h2 className={styles.resultsTitle}>Result</h2>
          <div className={styles.grid}>
            <div className={`${styles.card} ${styles.resultCardSticky}`} ref={resultCardRef}>
              <div className={styles.cardHeader}>
                <span
                  className={`${styles.badge} ${
                    isDone
                      ? styles.badgeDone
                      : isError
                      ? styles.badgeError
                      : isRunning
                      ? styles.badgeRunning
                      : styles.badgePending
                  }`}
                >
                  {isDone
                    ? `Done · ${elapsed}s`
                    : isError
                    ? 'Error'
                    : isRunning
                    ? `${elapsed}s…`
                    : 'Waiting'}
                </span>
              </div>

              <div className={styles.cardBody}>
                {isRunning && revCount === 0 && (
                  <div className={styles.spinnerWrap}>
                    <div className={styles.spinner} />
                    <p className={styles.spinnerText}>Generating… {elapsed}s</p>
                  </div>
                )}
                {showGeneratingOnLatest && (viewingUrl || showUnifiedCompositeResult) && (
                  <div
                    className={`${styles.resultFrame} ${
                      showUnifiedCompositeResult ? styles.resultFrameComposite : ''
                    }`}
                  >
                    {showUnifiedCompositeResult ? (
                      renderCompositeStage()
                    ) : (
                      renderMainResultImg(viewingUrl, '')
                    )}
                    <div className={styles.generatingOverlay}>
                      <div className={styles.spinner} />
                      <p className={styles.overlayText}>Generating new version… {elapsed}s</p>
                    </div>
                  </div>
                )}
                {showGeneratingWhileBrowsing && (viewingUrl || showUnifiedCompositeResult) && (
                  <div className={styles.resultFrame}>
                    {showUnifiedCompositeResult ? (
                      renderCompositeStage()
                    ) : (
                      renderMainResultImg(viewingUrl, '')
                    )}
                    <div className={styles.revisionBanner}>
                      New version generating… {elapsed}s
                    </div>
                  </div>
                )}
                {isDone && !isRunning && (showUnifiedCompositeResult || viewingUrl) && (
                  showUnifiedCompositeResult ? (
                    renderCompositeStage()
                  ) : (
                    renderMainResultImg(viewingUrl, 'Vector result')
                  )
                )}
                {isError && (
                  <div className={styles.errorWithImage}>
                    {showUnifiedCompositeResult ? (
                      renderCompositeStage()
                    ) : (
                      viewingUrl && renderMainResultImg(viewingUrl, '')
                    )}
                    <p className={styles.errorText}>{errorMsg}</p>
                  </div>
                )}
              </div>

              {revCount > 1 && (
                <div className={styles.revisionBar}>
                  <button
                    type="button"
                    className={styles.revNav}
                    onClick={() => setViewIndex((i) => Math.max(0, i - 1))}
                    disabled={!canGoPrev}
                    aria-label="Previous revision"
                  >
                    ←
                  </button>
                  <span className={styles.revMeta}>
                    {viewIndex + 1} / {revCount}
                    {currentLabel ? ` · ${currentLabel}` : ''}
                  </span>
                  <button
                    type="button"
                    className={styles.revNav}
                    onClick={() =>
                      setViewIndex((i) => Math.min(latestIdx, i + 1))
                    }
                    disabled={!canGoNext}
                    aria-label="Next revision"
                  >
                    →
                  </button>
                </div>
              )}

              {revCount > 0 && (
                <div className={styles.revisionStrip}>
                  {revisions.map((rev, i) => (
                    <button
                      key={`${rev.url}-${i}`}
                      type="button"
                      className={`${styles.revThumb} ${
                        i === viewIndex ? styles.revThumbActive : ''
                      } ${rev.transparent ? styles.revThumbCheckered : ''}`}
                      onClick={() => setViewIndex(i)}
                      title={rev.label}
                    >
                      <img src={rev.url} alt="" />
                      <span className={styles.revThumbLabel}>{i + 1}</span>
                    </button>
                  ))}
                </div>
              )}

            </div>

            {(vehicleLocked || hasTransparentRevision) && (
              <div className={styles.resultSidePanel}>
                {vehicleLocked && (
                  <div className={styles.tweakPanel}>
                    <button
                      type="button"
                      className={styles.collapseToggle}
                      aria-expanded={isVehicleTweakOpen}
                      onClick={() => setIsVehicleTweakOpen((v) => !v)}
                    >
                      {isVehicleTweakOpen ? '▼' : '►'} Tweak vehicle (optional)
                    </button>
                    {isVehicleTweakOpen && (
                      <>
                        <div className={styles.setupBlock}>
                          <textarea
                            className={styles.textarea}
                            rows={4}
                            placeholder="Add more detail, or fix any issues with the generated vehicle."
                            value={tweakNotes}
                            onChange={(e) => setTweakNotes(e.target.value)}
                          />
                        </div>
                        <div className={styles.tweakPanelActions}>
                          <button className={styles.btnPrimary} onClick={runGeneration} disabled={!canRun}>
                            {running ? 'Generating…' : 'Tweak'}
                          </button>
                          {running && (
                            <button type="button" className={styles.btn} onClick={cancelCarGeneration}>
                              Cancel request
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {hasTransparentRevision && (
                  <section
                    className={`${styles.presetSection} ${styles.presetSectionInline}`}
                    aria-label="Background presets"
                  >
                    <h2 className={styles.presetSectionTitle}>Background preset</h2>
                    <p className={styles.presetSectionIntro}>
                      Choose a background preset or stay transparent — then add text and download a print-ready PNG.
                    </p>
                    {customBackgroundGenerating && (
                      <div className={styles.backgroundProgress}>
                        <div className={styles.spinner} />
                        <span>Generating background… {customBackgroundElapsed}s</span>
                        <button
                          type="button"
                          className={styles.btnBackgroundCancel}
                          onClick={cancelBackgroundGeneration}
                        >
                          Cancel request
                        </button>
                      </div>
                    )}
                    <div className={styles.presetPicker}>
                      <button
                        type="button"
                        className={`${styles.presetOption} ${selectedPresetId === null ? styles.presetOptionActive : ''}`}
                        onClick={() => setSelectedPresetId(null)}
                        disabled={backgroundControlsLocked}
                      >
                        <span className={styles.presetNoneLabel}>None</span>
                        <span className={styles.presetOptionCaption}>Transparent only</span>
                        <span className={styles.presetOptionSub}>Text overlays below</span>
                      </button>
                      {BACKGROUND_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`${styles.presetOption} ${selectedPresetId === p.id ? styles.presetOptionActive : ''}`}
                          onClick={() => setSelectedPresetId(p.id)}
                          disabled={backgroundControlsLocked}
                        >
                          <span className={styles.presetThumbWrap}>
                            <img src={p.src} alt="" className={styles.presetThumb} />
                          </span>
                          <span className={styles.presetOptionCaption}>{p.name}</span>
                        </button>
                      ))}
                      {savedCustomBackgrounds.map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          className={`${styles.presetOption} ${selectedPresetId === bg.id ? styles.presetOptionActive : ''}`}
                          onClick={() => setSelectedPresetId(bg.id)}
                          disabled={backgroundControlsLocked}
                        >
                          <span className={styles.presetThumbWrap}>
                            <img
                              src={bg.thumbUrl || bg.resultUrl}
                              alt=""
                              className={styles.presetThumb}
                            />
                          </span>
                          <span className={styles.presetOptionCaption}>{bg.label}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        className={`${styles.presetOption} ${styles.presetOptionNew} ${selectedPresetId === CUSTOM_BACKGROUND_NEW ? styles.presetOptionActive : ''}`}
                        onClick={() => {
                          setCustomBackgroundImageDataUrl(null)
                          setCustomBackgroundImagePreview(null)
                          setCustomBackgroundValue('')
                          setCustomBackgroundError('')
                          if (customBackgroundFileRef.current) customBackgroundFileRef.current.value = ''
                          setSelectedPresetId(CUSTOM_BACKGROUND_NEW)
                        }}
                        disabled={backgroundControlsLocked}
                      >
                        <span className={styles.presetNewLabel}>+</span>
                        <span className={styles.presetOptionCaption}>Custom background</span>
                      </button>
                    </div>

                    {showCustomPanel && (
                      <div className={styles.customBackgroundPanel}>
                        <div className={styles.setupBlock}>
                          <label className={styles.label}>Attach image for background reference (optional)</label>
                          <div
                            className={`${styles.uploadZone} ${customBackgroundImagePreview ? styles.hasImage : ''}`}
                            onClick={() => {
                              if (backgroundControlsLocked) return
                              customBackgroundFileRef.current?.click()
                            }}
                          >
                            {customBackgroundImagePreview ? (
                              <img
                                src={customBackgroundImagePreview}
                                alt="Custom background preview"
                                className={styles.preview}
                              />
                            ) : (
                              <div className={styles.uploadPlaceholder}>
                                <span className={styles.uploadIcon}>↑</span>
                                <span>Click to upload JPG or PNG</span>
                              </div>
                            )}
                          </div>
                          <input
                            ref={customBackgroundFileRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleCustomBackgroundFile}
                            disabled={backgroundControlsLocked}
                          />
                        </div>
                        <div className={styles.setupBlock}>
                          <label className={styles.label}>Describe location and theme</label>
                          <input
                            className={styles.input}
                            type="text"
                            placeholder="e.g. Tokyo city lights at sunset"
                            value={customBackgroundValue}
                            onChange={(e) => setCustomBackgroundValue(e.target.value)}
                            disabled={backgroundControlsLocked}
                          />
                        </div>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={runCustomBackgroundGeneration}
                            disabled={!canGenerateCustomBackground}
                          >
                            {customBackgroundGenerating ? 'Generating background…' : 'Generate custom background'}
                          </button>
                        </div>
                        {customBackgroundError && (
                          <p className={styles.customBackgroundError}>{customBackgroundError}</p>
                        )}
                      </div>
                    )}

                    {isCustomSavedSelection && selectedCustomBg && (
                      <div className={styles.customBackgroundPanel}>
                        <button
                          type="button"
                          className={styles.collapseToggle}
                          aria-expanded={isBackgroundTweakOpen}
                          onClick={() => setIsBackgroundTweakOpen((v) => !v)}
                          disabled={backgroundControlsLocked}
                        >
                          {isBackgroundTweakOpen ? '▼' : '►'} Tweak background (optional)
                        </button>
                        {isBackgroundTweakOpen && (
                          <>
                            <div className={styles.setupBlock}>
                              <textarea
                                className={styles.textarea}
                                rows={3}
                                placeholder="Describe any changes you want to make to the background."
                                value={backgroundTweakNotes}
                                onChange={(e) => setBackgroundTweakNotes(e.target.value)}
                                disabled={backgroundControlsLocked}
                              />
                            </div>
                            <div className={styles.actions}>
                              <button
                                type="button"
                                className={styles.btnPrimary}
                                onClick={runBackgroundTweak}
                                disabled={!backgroundTweakNotes.trim() || customBackgroundGenerating || customBackgroundRemoving}
                              >
                                {customBackgroundGenerating ? 'Generating…' : 'Tweak background'}
                              </button>
                            </div>
                            {customBackgroundError && (
                              <p className={styles.customBackgroundError}>{customBackgroundError}</p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {transparentCarUrlForPreset && (
                      <div className={styles.compositeBlock}>
                        <p className={styles.compositeLabel}>Adjust composition</p>
                        <div className={styles.compositeAdjustRow}>
                          <div className={styles.compositeAdjustControl}>
                            <div className={styles.compositeAdjustHead}>
                              <span>Car vertical adjust</span>
                              <span className={styles.compositeAdjustValue}>
                                {Math.round(carAdjustYPct * 100)}
                              </span>
                            </div>
                            <div className={styles.compositeAdjustInputRow}>
                              <button
                                type="button"
                                className={styles.compositeNudgeBtn}
                                onClick={() => nudgeCarAdjustY(-0.01)}
                                disabled={backgroundControlsLocked}
                              >
                                -
                              </button>
                              <input
                                type="range"
                                min={-30}
                                max={30}
                                value={Math.round(carAdjustYPct * 100)}
                                onChange={(e) => setCarAdjustYPct(clampAdjust(Number(e.target.value) / 100))}
                                disabled={backgroundControlsLocked}
                              />
                              <button
                                type="button"
                                className={styles.compositeNudgeBtn}
                                onClick={() => nudgeCarAdjustY(0.01)}
                                disabled={backgroundControlsLocked}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className={styles.compositeAdjustControl}>
                            <div className={styles.compositeAdjustHead}>
                              <span>Car size</span>
                              <span className={styles.compositeAdjustValue}>
                                {Math.round(carScale * 100)}%
                              </span>
                            </div>
                            <div className={styles.compositeAdjustInputRow}>
                              <button
                                type="button"
                                className={styles.compositeNudgeBtn}
                                onClick={() => nudgeCarScale(-0.01)}
                                disabled={backgroundControlsLocked}
                              >
                                -
                              </button>
                              <input
                                type="range"
                                min={70}
                                max={140}
                                value={Math.round(carScale * 100)}
                                onChange={(e) => setCarScale(clampCarScale(Number(e.target.value) / 100))}
                                disabled={backgroundControlsLocked}
                              />
                              <button
                                type="button"
                                className={styles.compositeNudgeBtn}
                                onClick={() => nudgeCarScale(0.01)}
                                disabled={backgroundControlsLocked}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.btn}
                            onClick={() => {
                              setCarAdjustXPct(0)
                              setCarAdjustYPct(0)
                              setCarScale(1)
                              setCompositionZoom(1)
                            }}
                            disabled={backgroundControlsLocked}
                          >
                            Reset position
                          </button>
                        </div>
                        <div className={styles.textOverlayBlock}>
                          <div className={styles.textOverlayHeader}>
                            <p className={`${styles.compositeLabel} !mb-0`}>Text overlays</p>
                            <button
                              type="button"
                              className={styles.btn}
                              onClick={addTextLayer}
                              disabled={backgroundControlsLocked}
                            >
                              + Add text layer
                            </button>
                          </div>
                          {textLayers.length === 0 ? (
                            <p className={styles.textOverlayEmpty}>No text layers yet.</p>
                          ) : (
                            <div className={styles.textLayerList}>
                              {textLayers.map((layer, idx) => (
                                <div
                                  key={layer.id}
                                  className={`${styles.textLayerRow} ${
                                    selectedTextLayerId === layer.id ? styles.textLayerRowActive : ''
                                  }`}
                                  onClick={() => setSelectedTextLayerId(layer.id)}
                                >
                                  <span className={styles.textLayerName}>
                                    {idx + 1}. {layer.text.trim() || 'Untitled text'}
                                  </span>
                                  <div className={styles.textLayerActions}>
                                    <button
                                      type="button"
                                      className={styles.compositeNudgeBtn}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        moveTextLayer(layer.id, -1)
                                      }}
                                      disabled={idx === 0 || backgroundControlsLocked}
                                      aria-label="Move layer up"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.compositeNudgeBtn}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        moveTextLayer(layer.id, 1)
                                      }}
                                      disabled={idx === textLayers.length - 1 || backgroundControlsLocked}
                                      aria-label="Move layer down"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.compositeNudgeBtn}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeTextLayer(layer.id)
                                      }}
                                      disabled={backgroundControlsLocked}
                                      aria-label="Delete layer"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {selectedTextLayer && (
                            <div className={styles.textLayerEditor}>
                              <div className={styles.setupBlock}>
                                <label className={styles.label}>Text</label>
                                <input
                                  className={styles.input}
                                  type="text"
                                  value={selectedTextLayer.text}
                                  onChange={(e) =>
                                    updateTextLayer(selectedTextLayer.id, { text: e.target.value })
                                  }
                                  disabled={backgroundControlsLocked}
                                />
                              </div>
                              <div className={styles.textLayerGrid}>
                                <div className={styles.setupBlock}>
                                  <label className={styles.label}>Font family</label>
                                  <select
                                    className={styles.input}
                                    value={selectedTextLayer.fontFamily}
                                    onChange={(e) =>
                                      updateTextLayer(selectedTextLayer.id, {
                                        fontFamily: e.target.value,
                                      })
                                    }
                                    disabled={backgroundControlsLocked}
                                  >
                                    {availableFontOptions.map((font) => (
                                      <option key={font.value} value={font.value}>
                                        {font.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className={styles.setupBlock}>
                                  <label className={styles.label}>Text color</label>
                                  <input
                                    className={styles.colorInput}
                                    type="color"
                                    value={selectedTextLayer.color}
                                    onChange={(e) =>
                                      updateTextLayer(selectedTextLayer.id, { color: e.target.value })
                                    }
                                    disabled={backgroundControlsLocked}
                                  />
                                </div>
                              </div>
                              <div className={styles.setupBlock}>
                                <div className={styles.compositeAdjustHead}>
                                  <span>Font size</span>
                                  <span className={styles.compositeAdjustValue}>
                                    {Math.round(selectedTextLayer.fontSizePct * 100)}%
                                  </span>
                                </div>
                                <div className={styles.compositeAdjustInputRow}>
                                  <button
                                    type="button"
                                    className={styles.compositeNudgeBtn}
                                    onClick={() => nudgeTextFontSize(selectedTextLayer.id, -0.005)}
                                    disabled={backgroundControlsLocked}
                                  >
                                    -
                                  </button>
                                  <input
                                    type="range"
                                    min={3}
                                    max={25}
                                    value={Math.round(selectedTextLayer.fontSizePct * 100)}
                                    onChange={(e) =>
                                      updateTextLayer(selectedTextLayer.id, {
                                        fontSizePct: Number(e.target.value) / 100,
                                      })
                                    }
                                    disabled={backgroundControlsLocked}
                                  />
                                  <button
                                    type="button"
                                    className={styles.compositeNudgeBtn}
                                    onClick={() => nudgeTextFontSize(selectedTextLayer.id, 0.005)}
                                    disabled={backgroundControlsLocked}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className={styles.setupBlock}>
                                <label className={styles.label}>Text vertical alignment</label>
                                <div className={styles.alignBtnRow}>
                                  <button
                                    type="button"
                                    className={`${styles.alignBtn} ${
                                      selectedTextLayer.alignY === 'top' ? styles.alignBtnActive : ''
                                    }`}
                                    onClick={() =>
                                      alignTextLayerToCanvasVertical(selectedTextLayer.id, 'top')
                                    }
                                    disabled={backgroundControlsLocked}
                                  >
                                    Top
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.alignBtn} ${
                                      selectedTextLayer.alignY === 'middle' ? styles.alignBtnActive : ''
                                    }`}
                                    onClick={() =>
                                      alignTextLayerToCanvasVertical(selectedTextLayer.id, 'middle')
                                    }
                                    disabled={backgroundControlsLocked}
                                  >
                                    Middle
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.alignBtn} ${
                                      selectedTextLayer.alignY === 'bottom' ? styles.alignBtnActive : ''
                                    }`}
                                    onClick={() =>
                                      alignTextLayerToCanvasVertical(selectedTextLayer.id, 'bottom')
                                    }
                                    disabled={backgroundControlsLocked}
                                  >
                                    Bottom
                                  </button>
                                </div>
                              </div>
                              <div className={styles.styleRow}>
                                <div className={styles.shadowSwatchGroup}>
                                  <label className={styles.label}>Format</label>
                                  <div className={styles.styleToggleGroup}>
                                    <button
                                      type="button"
                                      className={`${styles.styleToggle} ${selectedTextLayer.bold ? styles.styleToggleActive : ''}`}
                                      onClick={() =>
                                        updateTextLayer(selectedTextLayer.id, { bold: !selectedTextLayer.bold })
                                      }
                                      disabled={backgroundControlsLocked}
                                      title="Bold"
                                    >
                                      <span className={styles.styleToggleBold}>B</span>
                                    </button>
                                    <button
                                      type="button"
                                      className={`${styles.styleToggle} ${selectedTextLayer.italic ? styles.styleToggleActive : ''}`}
                                      onClick={() =>
                                        updateTextLayer(selectedTextLayer.id, { italic: !selectedTextLayer.italic })
                                      }
                                      disabled={backgroundControlsLocked}
                                      title="Italic"
                                    >
                                      <span className={styles.styleToggleItalic}>I</span>
                                    </button>
                                    <button
                                      type="button"
                                      className={`${styles.styleToggle} ${selectedTextLayer.underline ? styles.styleToggleActive : ''}`}
                                      onClick={() =>
                                        updateTextLayer(selectedTextLayer.id, { underline: !selectedTextLayer.underline })
                                      }
                                      disabled={backgroundControlsLocked}
                                      title="Underline"
                                    >
                                      <span className={styles.styleToggleUnderline}>U</span>
                                    </button>
                                  </div>
                                </div>
                                <div className={styles.shadowSwatchGroup}>
                                  <label className={styles.label}>Shadow</label>
                                  <div className={styles.shadowSwatches}>
                                    <button
                                      type="button"
                                      className={`${styles.shadowSwatch} ${styles.shadowSwatchOff} ${selectedTextLayer.shadow === 'off' ? styles.shadowSwatchActive : ''}`}
                                      onClick={() => updateTextLayer(selectedTextLayer.id, { shadow: 'off' })}
                                      disabled={backgroundControlsLocked}
                                      title="No shadow"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="3" y1="3" x2="13" y2="13" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/><line x1="13" y1="3" x2="3" y2="13" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                    </button>
                                    <button
                                      type="button"
                                      className={`${styles.shadowSwatch} ${styles.shadowSwatchBlack} ${selectedTextLayer.shadow === 'black' ? styles.shadowSwatchActive : ''}`}
                                      onClick={() => updateTextLayer(selectedTextLayer.id, { shadow: 'black' })}
                                      disabled={backgroundControlsLocked}
                                      title="Dark shadow"
                                    >
                                      <span className={styles.shadowSwatchPreview} style={{ background: '#000' }} />
                                    </button>
                                    <button
                                      type="button"
                                      className={`${styles.shadowSwatch} ${styles.shadowSwatchWhite} ${selectedTextLayer.shadow === 'white' ? styles.shadowSwatchActive : ''}`}
                                      onClick={() => updateTextLayer(selectedTextLayer.id, { shadow: 'white' })}
                                      disabled={backgroundControlsLocked}
                                      title="Light shadow"
                                    >
                                      <span className={styles.shadowSwatchPreview} style={{ background: '#fff' }} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={styles.compositeExportRow}>
                          <button
                            type="button"
                            className={styles.btnExport}
                            onClick={handleExportComposite}
                            disabled={exportingComposite || backgroundControlsLocked}
                          >
                            {exportingComposite ? 'Preparing PNG…' : 'Download PNG for print'}
                          </button>
                          <span className={styles.compositeExportHint}>
                            Use top-right controls to zoom from center. Drag selected text to position it.
                          </span>
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!!mobileResultDockSrc && (
        <button
          type="button"
          className={`${styles.mobileResultDock} ${
            showMobileResultDock ? styles.mobileResultDockVisible : ''
          }`}
          onClick={() => resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          aria-label="Jump to result preview"
          aria-hidden={!showMobileResultDock}
          tabIndex={showMobileResultDock ? 0 : -1}
        >
          <img src={mobileResultDockSrc} alt="" />
        </button>
      )}
    </main>
  )
}
