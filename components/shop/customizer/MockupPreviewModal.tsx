'use client'

import { useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { useCustomizer } from './CustomizerContext'
import { loadImageElement } from './helpers'
import { getMockupPrintZone } from './constants'
import { clampDpr, letterbox, printZoneRect, drawArtworkClipped } from './canvas'

interface Props {
  open: boolean
  onClose: () => void
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
    selectedSide,
  } = useCustomizer()

  const overlayUrl = compositeDataUrl ?? artworkUrl
  const pz = getMockupPrintZone(productType, selectedSide)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)
  const artworkImgRef = useRef<HTMLImageElement | null>(null)

  const offscreenRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!open) return

    const scrollY = window.scrollY
    const { style } = document.body
    const previousStyles = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      width: style.width,
    }

    style.overflow = 'hidden'
    style.position = 'fixed'
    style.top = `-${scrollY}px`
    style.width = '100%'

    return () => {
      style.overflow = previousStyles.overflow
      style.position = previousStyles.position
      style.top = previousStyles.top
      style.width = previousStyles.width
      window.scrollTo(0, scrollY)
    }
  }, [open])

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

    // Size the offscreen so the artwork lands in the print zone at its
    // native resolution (no downscale). Cap for memory.
    const MAX_OFFSCREEN_PX = 6144
    const artNaturalW = artworkImg?.naturalWidth ?? 0
    const required = artNaturalW > 0 && pz.widthPct > 0
      ? Math.ceil(artNaturalW / pz.widthPct)
      : 0
    const fullSize = Math.min(MAX_OFFSCREEN_PX, Math.max(px * 2, required))
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

    const padding = 0.3
    const cropCx = pzr.x + pzr.w / 2
    const cropCy = pzr.y + pzr.h / 2
    const cropSide = Math.max(pzr.w, pzr.h) * (1 + padding)
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

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-contain bg-black/85 backdrop-blur-sm"
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
        <canvas
          ref={canvasRef}
          className="rounded border border-border/50"
          aria-label="Mockup preview"
        />
      </div>
    </div>
  )
}
