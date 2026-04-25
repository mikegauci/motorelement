'use client'

import { useRef, useEffect, useCallback, useState, type PointerEvent } from 'react'
import { X } from 'lucide-react'
import { useCustomizer } from './CustomizerContext'
import { loadImageElement } from './helpers'
import { getMockupPrintZone } from './constants'
import { clampDpr, letterbox, printZoneRect, drawArtworkClipped } from './canvas'

interface Props {
  open: boolean
  onClose: () => void
}

const PREVIEW_ZOOM_MIN = 1
const PREVIEW_ZOOM_MAX = 2
const PREVIEW_ZOOM_STEP = 0.1
const PREVIEW_ZOOM_DEFAULT = 1.2
const PREVIEW_CROP_PADDING = 0.3

type PinchPointer = {
  x: number
  y: number
}

function clampPreviewZoom(value: number) {
  return Number(Math.min(PREVIEW_ZOOM_MAX, Math.max(PREVIEW_ZOOM_MIN, value)).toFixed(2))
}

/**
 * Full-screen modal showing a high-res mockup preview.
 * Same rendering as MockupPreview but at a much larger canvas size.
 */
export default function MockupPreviewModal({ open, onClose }: Props) {
  const {
    artworkUrl,
    compositeDataUrl,
    mockupPlacement,
    tshirtBaseImage,
    productType,
  } = useCustomizer()

  const overlayUrl = compositeDataUrl ?? artworkUrl
  const pz = getMockupPrintZone(productType)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)
  const artworkImgRef = useRef<HTMLImageElement | null>(null)
  const previewZoomRef = useRef(PREVIEW_ZOOM_DEFAULT)
  const pinchRef = useRef({
    pointers: new Map<number, PinchPointer>(),
    startDistance: 0,
    startZoom: PREVIEW_ZOOM_DEFAULT,
  })

  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const [previewZoom, setPreviewZoom] = useState(PREVIEW_ZOOM_DEFAULT)

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const baseImg = baseImgRef.current
    const artworkImg = artworkImgRef.current

    const size = Math.min(1200, window.innerWidth - 48, window.innerHeight - 120)
    const dpr = clampDpr()
    const px = Math.round(size * dpr)
    if (canvas.width !== px) canvas.width = px
    if (canvas.height !== px) canvas.height = px
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const ctx = canvas.getContext('2d', { alpha: false })!
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, px, px)

    if (!baseImg) return

    const fullSize = px * 2
    if (!offscreenRef.current) offscreenRef.current = document.createElement('canvas')
    const off = offscreenRef.current
    if (off.width !== fullSize) off.width = fullSize
    if (off.height !== fullSize) off.height = fullSize
    const offCtx = off.getContext('2d', { alpha: false })!
    offCtx.imageSmoothingEnabled = true
    offCtx.imageSmoothingQuality = 'high'
    offCtx.fillStyle = '#111'
    offCtx.fillRect(0, 0, fullSize, fullSize)

    const baseRect = letterbox(baseImg.naturalWidth, baseImg.naturalHeight, fullSize)
    offCtx.drawImage(baseImg, baseRect.x, baseRect.y, baseRect.w, baseRect.h)

    const pzr = printZoneRect(baseRect, pz)
    if (artworkImg) {
      drawArtworkClipped(offCtx, artworkImg, pzr, mockupPlacement)
    }

    const previewZoom = previewZoomRef.current
    const cropCx = pzr.x + pzr.w / 2
    const cropCy = pzr.y + pzr.h / 2
    const cropSide = Math.max(pzr.w, pzr.h) * (1 + PREVIEW_CROP_PADDING) / previewZoom
    const sx = Math.max(0, Math.min(cropCx - cropSide / 2, fullSize - cropSide))
    const sy = Math.max(0, Math.min(cropCy - cropSide / 2, fullSize - cropSide))

    ctx.drawImage(off, sx, sy, cropSide, cropSide, 0, 0, px, px)
  }, [mockupPlacement, pz])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const promises: Promise<void>[] = []

    if (tshirtBaseImage) {
      promises.push(
        loadImageElement(tshirtBaseImage).then((img) => {
          if (!cancelled) baseImgRef.current = img
        }).catch(() => {
          if (!cancelled) baseImgRef.current = null
        })
      )
    }
    if (overlayUrl) {
      promises.push(
        loadImageElement(overlayUrl).then((img) => {
          if (!cancelled) artworkImgRef.current = img
        }).catch(() => {
          if (!cancelled) artworkImgRef.current = null
        })
      )
    }

    Promise.all(promises).then(() => {
      if (!cancelled) paint()
    })

    return () => { cancelled = true }
  }, [open, tshirtBaseImage, overlayUrl, paint])

  useEffect(() => {
    previewZoomRef.current = previewZoom
    if (open) paint()
  }, [open, previewZoom, paint])

  useEffect(() => {
    if (!open) return
    function onResize() { paint() }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open, paint])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    const bodyPosition = document.body.style.position
    const bodyTop = document.body.style.top
    const bodyWidth = document.body.style.width
    const bodyOverflow = document.body.style.overflow
    const htmlOverscroll = document.documentElement.style.overscrollBehavior

    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'

    return () => {
      document.body.style.position = bodyPosition
      document.body.style.top = bodyTop
      document.body.style.width = bodyWidth
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overscrollBehavior = htmlOverscroll
      window.scrollTo(0, scrollY)
    }
  }, [open])

  function getPinchDistance() {
    const pointers = Array.from(pinchRef.current.pointers.values())
    if (pointers.length < 2) return 0
    return Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y)
  }

  function handlePreviewPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    if (e.pointerType !== 'touch') return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    pinchRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pinchRef.current.pointers.size === 2) {
      pinchRef.current.startDistance = getPinchDistance()
      pinchRef.current.startZoom = previewZoomRef.current
    }
  }

  function handlePreviewPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const pinch = pinchRef.current
    if (!pinch.pointers.has(e.pointerId)) return
    e.preventDefault()
    pinch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pinch.pointers.size !== 2 || pinch.startDistance <= 0) return
    const nextDistance = getPinchDistance()
    if (nextDistance <= 0) return
    setPreviewZoom(clampPreviewZoom(pinch.startZoom * (nextDistance / pinch.startDistance)))
  }

  function handlePreviewPointerUp(e: PointerEvent<HTMLCanvasElement>) {
    const pinch = pinchRef.current
    if (!pinch.pointers.has(e.pointerId)) return
    pinch.pointers.delete(e.pointerId)
    e.currentTarget.releasePointerCapture?.(e.pointerId)

    if (pinch.pointers.size < 2) {
      pinch.startDistance = 0
      pinch.startZoom = previewZoomRef.current
    }
  }

  if (!open) return null

  const previewZoomPct = Math.round(previewZoom * 100)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-1.5 text-muted hover:text-white transition"
          aria-label="Close preview"
        >
          <X size={22} />
        </button>
        <div className="absolute -top-11 left-0 flex items-center gap-1.5 rounded border border-border/70 bg-black/70 p-1 text-white backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setPreviewZoom(PREVIEW_ZOOM_DEFAULT)}
            disabled={previewZoom === PREVIEW_ZOOM_DEFAULT}
            className="flex h-8 items-center justify-center rounded px-2 text-xs transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Reset preview zoom"
            title="Reset preview zoom"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setPreviewZoom((value) => clampPreviewZoom(value - PREVIEW_ZOOM_STEP))}
            disabled={previewZoom <= PREVIEW_ZOOM_MIN}
            className="flex h-8 w-8 items-center justify-center rounded text-lg leading-none transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Zoom preview out"
          >
            -
          </button>
          <span className="min-w-12 text-center text-xs font-semibold tabular-nums text-white/80">
            {previewZoomPct}%
          </span>
          <button
            type="button"
            onClick={() => setPreviewZoom((value) => clampPreviewZoom(value + PREVIEW_ZOOM_STEP))}
            disabled={previewZoom >= PREVIEW_ZOOM_MAX}
            className="flex h-8 w-8 items-center justify-center rounded text-lg leading-none transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Zoom preview in"
          >
            +
          </button>
        </div>
        <canvas
          ref={canvasRef}
          className="touch-none rounded border border-border/50"
          aria-label="Mockup preview"
          onPointerDown={handlePreviewPointerDown}
          onPointerMove={handlePreviewPointerMove}
          onPointerUp={handlePreviewPointerUp}
          onPointerCancel={handlePreviewPointerUp}
        />
      </div>
    </div>
  )
}
