'use client'

import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { useCustomizer } from './CustomizerContext'
import { loadImageElement } from './helpers'
import { getMockupPrintZone } from './constants'

/**
 * 2D t-shirt mockup that overlays the generated artwork onto the Printify
 * product image. Read-only preview — positioning is fixed.
 *
 * Designed with a stable interface so the internals can be swapped for a
 * React Three Fiber 3D scene later without changing the API.
 */
export default function MockupPreview() {
  const {
    artworkUrl,
    compositeDataUrl,
    mockupPlacement,
    setMockupPlacement,
    tshirtBaseImage,
    productType,
    selectedColorHex,
    setMockupThumbnailUrl,
  } = useCustomizer()

  const overlayUrl = compositeDataUrl ?? artworkUrl

  const pz = useMemo(() => getMockupPrintZone(productType), [productType])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)
  const artworkImgRef = useRef<HTMLImageElement | null>(null)
  const tintCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const thumbCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const [loaded, setLoaded] = useState(false)

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    const w = Math.round(rect.width * dpr)
    const h = Math.round(rect.width * dpr)
    if (canvas.width !== w) canvas.width = w
    if (canvas.height !== h) canvas.height = h

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Dark background
    ctx.fillStyle = '#181818'
    ctx.fillRect(0, 0, w, h)

    const baseImg = baseImgRef.current
    if (baseImg) {
      const imgAspect = baseImg.naturalWidth / baseImg.naturalHeight
      let drawW = w
      let drawH = w / imgAspect
      if (drawH > h) {
        drawH = h
        drawW = h * imgAspect
      }
      const drawX = (w - drawW) / 2
      const drawY = (h - drawH) / 2

      const isLocalMockup = tshirtBaseImage?.startsWith('/images/mockups/')
      const needsTint = !isLocalMockup && selectedColorHex && !/^#?f{3,6}$/i.test(selectedColorHex)
      if (needsTint) {
        if (!tintCanvasRef.current) tintCanvasRef.current = document.createElement('canvas')
        const tc = tintCanvasRef.current
        const tw = Math.round(drawW)
        const th = Math.round(drawH)
        if (tc.width !== tw) tc.width = tw
        if (tc.height !== th) tc.height = th
        const tctx = tc.getContext('2d', { alpha: true })!
        tctx.clearRect(0, 0, tw, th)
        tctx.drawImage(baseImg, 0, 0, tw, th)
        tctx.globalCompositeOperation = 'multiply'
        tctx.fillStyle = selectedColorHex!
        tctx.fillRect(0, 0, tw, th)
        tctx.globalCompositeOperation = 'destination-in'
        tctx.drawImage(baseImg, 0, 0, tw, th)
        tctx.globalCompositeOperation = 'source-over'
        ctx.drawImage(tc, drawX, drawY, drawW, drawH)
      } else {
        ctx.drawImage(baseImg, drawX, drawY, drawW, drawH)
      }

      // Draw artwork overlay within the print zone
      const artworkImg = artworkImgRef.current
      const pzX = drawX + pz.xPct * drawW
      const pzY = drawY + pz.yPct * drawH
      const pzW = pz.widthPct * drawW
      const pzH = pz.heightPct * drawH

      if (artworkImg) {
        const artAspect = artworkImg.naturalWidth / artworkImg.naturalHeight
        const baseArtW = pzW * mockupPlacement.scale
        const baseArtH = baseArtW / artAspect

        const artX = pzX + mockupPlacement.xPct * pzW - baseArtW / 2
        const artY = pzY + mockupPlacement.yPct * pzH - baseArtH / 2

        // Clip artwork to print zone so nothing bleeds outside
        ctx.save()
        ctx.beginPath()
        ctx.rect(pzX, pzY, pzW, pzH)
        ctx.clip()

        ctx.globalAlpha = 0.92
        ctx.drawImage(artworkImg, artX, artY, baseArtW, baseArtH)
        ctx.globalAlpha = 1.0
        ctx.restore()
      }

      // Print zone boundary (visible dashed outline)
      if (artworkImg) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([8, 5])
        ctx.strokeRect(pzX, pzY, pzW, pzH)
        ctx.setLineDash([])
      }

      // Generate a cropped print-zone thumbnail for the mobile dock
      if (artworkImg && pzW > 0 && pzH > 0) {
        try {
          const thumbSize = 280
          if (!thumbCanvasRef.current) thumbCanvasRef.current = document.createElement('canvas')
          const tc = thumbCanvasRef.current
          const aspect = pzW / pzH
          const tw = aspect >= 1 ? thumbSize : Math.round(thumbSize * aspect)
          const th = aspect >= 1 ? Math.round(thumbSize / aspect) : thumbSize
          if (tc.width !== tw) tc.width = tw
          if (tc.height !== th) tc.height = th
          const tctx = tc.getContext('2d', { alpha: false })!
          tctx.drawImage(canvas, pzX, pzY, pzW, pzH, 0, 0, tw, th)
          setMockupThumbnailUrl(tc.toDataURL('image/jpeg', 0.85))
        } catch { /* ignore */ }
      }
    } else {
      // No base image yet - show placeholder text
      ctx.fillStyle = '#666'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Select a product to see mockup', w / 2, h / 2)
    }
  }, [mockupPlacement, pz, selectedColorHex, setMockupThumbnailUrl])

  // Load base t-shirt image
  useEffect(() => {
    if (!tshirtBaseImage) {
      baseImgRef.current = null
      setLoaded(false)
      paint()
      return
    }
    let cancelled = false
    loadImageElement(tshirtBaseImage).then((img) => {
      if (cancelled) return
      baseImgRef.current = img
      setLoaded(true)
      paint()
    }).catch(() => {
      if (cancelled) return
      baseImgRef.current = null
      setLoaded(false)
      paint()
    })
    return () => { cancelled = true }
  }, [tshirtBaseImage, paint])

  // Load artwork/composite overlay image
  useEffect(() => {
    if (!overlayUrl) {
      artworkImgRef.current = null
      paint()
      return
    }
    let cancelled = false
    loadImageElement(overlayUrl).then((img) => {
      if (cancelled) return
      artworkImgRef.current = img
      paint()
    }).catch(() => {
      if (cancelled) return
      artworkImgRef.current = null
      paint()
    })
    return () => { cancelled = true }
  }, [overlayUrl, paint])

  // Repaint on resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => paint())
    ro.observe(container)
    return () => ro.disconnect()
  }, [paint])


  const hasArtwork = !!overlayUrl
  const scalePct = Math.round(mockupPlacement.scale * 100)

  function nudgeScale(delta: number) {
    setMockupPlacement({
      ...mockupPlacement,
      scale: mockupPlacement.scale + delta,
    })
  }

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="relative w-full aspect-square overflow-hidden border border-border bg-obsidian"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-label="T-shirt mockup preview"
        />
        {hasArtwork && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
            <button
              type="button"
              onClick={() => setMockupPlacement({ ...mockupPlacement, scale: 1.0 })}
              disabled={mockupPlacement.scale === 1.0}
              className="w-8 h-8 flex items-center justify-center rounded bg-black/70 text-white text-sm hover:bg-black/90 disabled:opacity-30 transition"
              aria-label="Reset size"
              title="Reset size"
            >
              ↻
            </button>
            <button
              type="button"
              onClick={() => nudgeScale(-0.05)}
              disabled={mockupPlacement.scale <= 0.1}
              className="w-8 h-8 flex items-center justify-center rounded bg-black/70 text-white text-sm hover:bg-black/90 disabled:opacity-30 transition"
              aria-label="Decrease size"
            >
              −
            </button>
            <span className="w-8 text-center text-[10px] text-white/70 font-mono leading-tight">{scalePct}%</span>
            <button
              type="button"
              onClick={() => nudgeScale(0.05)}
              disabled={mockupPlacement.scale >= 1.0}
              className="w-8 h-8 flex items-center justify-center rounded bg-black/70 text-white text-sm hover:bg-black/90 disabled:opacity-30 transition"
              aria-label="Increase size"
            >
              +
            </button>
          </div>
        )}
      </div>
      {!loaded && !tshirtBaseImage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted">Mockup preview will appear here</span>
        </div>
      )}
    </div>
  )
}
