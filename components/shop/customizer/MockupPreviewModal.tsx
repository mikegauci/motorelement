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
  } = useCustomizer()

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

  const [transform, setTransform] = useState({ scale: 1, tx: 0, ty: 0 })
  const pinchRef = useRef<{
    initialDistance: number
    initialScale: number
    initialTx: number
    initialTy: number
  } | null>(null)
  const panRef = useRef<{
    startX: number
    startY: number
    initialTx: number
    initialTy: number
  } | null>(null)
  const lastTapRef = useRef<number>(0)

  useEffect(() => {
    setTransform({ scale: 1, tx: 0, ty: 0 })
  }, [zoomedIn, open])

  function clampPan(scale: number, tx: number, ty: number, size: number) {
    const max = (size * (scale - 1)) / 2
    return {
      tx: Math.max(-max, Math.min(max, tx)),
      ty: Math.max(-max, Math.min(max, ty)),
    }
  }

  function touchDistance(t1: React.Touch, t2: React.Touch) {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchRef.current = {
        initialDistance: touchDistance(e.touches[0], e.touches[1]),
        initialScale: transform.scale,
        initialTx: transform.tx,
        initialTy: transform.ty,
      }
      panRef.current = null
      return
    }
    if (e.touches.length === 1) {
      const now = Date.now()
      if (now - lastTapRef.current < 300) {
        setTransform({ scale: 1, tx: 0, ty: 0 })
        lastTapRef.current = 0
        return
      }
      lastTapRef.current = now
      if (transform.scale > 1) {
        panRef.current = {
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          initialTx: transform.tx,
          initialTy: transform.ty,
        }
      }
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    const canvas = canvasRef.current
    const size = canvas?.clientWidth ?? 0

    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const newDist = touchDistance(e.touches[0], e.touches[1])
      const ratio = newDist / pinchRef.current.initialDistance
      let newScale = pinchRef.current.initialScale * ratio
      newScale = Math.max(1, Math.min(4, newScale))
      let newTx = pinchRef.current.initialTx
      let newTy = pinchRef.current.initialTy
      if (newScale === 1) {
        newTx = 0
        newTy = 0
      } else {
        const clamped = clampPan(newScale, newTx, newTy, size)
        newTx = clamped.tx
        newTy = clamped.ty
      }
      setTransform({ scale: newScale, tx: newTx, ty: newTy })
      return
    }

    if (e.touches.length === 1 && panRef.current && transform.scale > 1) {
      e.preventDefault()
      const dx = e.touches[0].clientX - panRef.current.startX
      const dy = e.touches[0].clientY - panRef.current.startY
      const clamped = clampPan(
        transform.scale,
        panRef.current.initialTx + dx,
        panRef.current.initialTy + dy,
        size
      )
      setTransform((prev) => ({ scale: prev.scale, tx: clamped.tx, ty: clamped.ty }))
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) pinchRef.current = null
    if (e.touches.length === 0) panRef.current = null
  }

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
        <div
          className="overflow-hidden rounded border border-border/50"
          style={{ touchAction: 'none' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <canvas
            ref={canvasRef}
            className="block"
            style={{
              transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
              transformOrigin: 'center center',
              transition: pinchRef.current || panRef.current ? 'none' : 'transform 120ms ease-out',
            }}
            aria-label="Mockup preview"
          />
        </div>
      </div>
    </div>
  )
}
