'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { useCustomizer } from './CustomizerContext'
import { loadImageElement } from './helpers'
import { getMockupPrintZone } from './constants'
import { clampDpr, letterbox, printZoneRect, drawArtworkClipped } from './canvas'

interface Props {
  open: boolean
  onClose: () => void
}

export default function MockupPreviewModal({ open, onClose }: Props) {
  const {
    artworkUrl,
    compositeDataUrl,
    artworkOnlyDataUrl,
    textOnlyDataUrl,
    mockupPlacement,
    tshirtBaseImage,
    productType,
    artworkSide,
    textPlacement,
    mockupViewSide,
    setMockupViewSide,
  } = useCustomizer()

  const hasBothSides = textPlacement === 'opposite' && !!textOnlyDataUrl

  let overlayUrl: string | null = null
  if (mockupViewSide === artworkSide) {
    overlayUrl = textPlacement === 'opposite'
      ? (artworkOnlyDataUrl ?? compositeDataUrl ?? artworkUrl)
      : (compositeDataUrl ?? artworkUrl)
  } else if (textPlacement === 'opposite') {
    overlayUrl = textOnlyDataUrl
  }
  const pz = getMockupPrintZone(productType, mockupViewSide)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)
  const artworkImgRef = useRef<HTMLImageElement | null>(null)

  const offscreenRef = useRef<HTMLCanvasElement | null>(null)

  const [zoomedIn, setZoomedIn] = useState(true)

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

    let sx: number
    let sy: number
    let cropSide: number
    if (zoomedIn) {
      const padding = 0.3
      const cropCx = pzr.x + pzr.w / 2
      const cropCy = pzr.y + pzr.h / 2
      cropSide = Math.max(pzr.w, pzr.h) * (1 + padding)
      sx = Math.max(0, Math.min(cropCx - cropSide / 2, fullSize - cropSide))
      sy = Math.max(0, Math.min(cropCy - cropSide / 2, fullSize - cropSide))
    } else {
      cropSide = fullSize
      sx = 0
      sy = 0
    }

    ctx.drawImage(off, sx, sy, cropSide, cropSide, 0, 0, px, px)
  }, [mockupPlacement, pz, zoomedIn])

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
        <button
          onClick={() => setZoomedIn((v) => !v)}
          className="absolute -top-10 left-0 flex items-center gap-1.5 rounded border border-border/40 bg-black/40 px-3 py-1.5 text-sm text-muted hover:text-white hover:border-border/70 transition"
          aria-label={zoomedIn ? 'Zoom out' : 'Zoom in'}
        >
          {zoomedIn ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
          <span>{zoomedIn ? 'Zoom Out' : 'Zoom In'}</span>
        </button>
        {hasBothSides && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 rounded border border-border/40 bg-black/40 p-1">
            {(['front', 'back'] as const).map((side) => {
              const isActive = mockupViewSide === side
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => setMockupViewSide(side)}
                  aria-pressed={isActive}
                  className={`px-3 py-1 text-[11px] font-sub font-bold uppercase tracking-widest border transition-colors cursor-pointer ${
                    isActive
                      ? 'border-ignition bg-ignition/20 text-white'
                      : 'border-transparent text-muted hover:text-white'
                  }`}
                >
                  {side === 'front' ? 'Front' : 'Back'}
                </button>
              )
            })}
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="rounded border border-border/50"
          aria-label="Mockup preview"
        />
      </div>
    </div>
  )
}
