'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useCustomizer } from './CustomizerContext'
import { loadImageElement } from './helpers'
import { MOCKUP_PRINT_ZONE } from './constants'

/**
 * 2D t-shirt mockup that overlays the generated artwork onto the Printify
 * product image. The user can drag to reposition and scroll/pinch to resize.
 *
 * Designed with a stable interface so the internals can be swapped for a
 * React Three Fiber 3D scene later without changing the API.
 */
export default function MockupPreview() {
  const {
    artworkUrl,
    mockupPlacement,
    setMockupPlacement,
    tshirtBaseImage,
  } = useCustomizer()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)
  const artworkImgRef = useRef<HTMLImageElement | null>(null)

  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startPlacementX: 0,
    startPlacementY: 0,
  })

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
      // Draw t-shirt base image to fill canvas while maintaining aspect ratio
      const imgAspect = baseImg.naturalWidth / baseImg.naturalHeight
      let drawW = w
      let drawH = w / imgAspect
      if (drawH > h) {
        drawH = h
        drawW = h * imgAspect
      }
      const drawX = (w - drawW) / 2
      const drawY = (h - drawH) / 2
      ctx.drawImage(baseImg, drawX, drawY, drawW, drawH)

      // Draw artwork overlay within the print zone
      const artworkImg = artworkImgRef.current
      const pz = MOCKUP_PRINT_ZONE
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
    } else {
      // No base image yet - show placeholder text
      ctx.fillStyle = '#666'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Select a product to see mockup', w / 2, h / 2)
    }
  }, [mockupPlacement])

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

  // Load artwork image
  useEffect(() => {
    if (!artworkUrl) {
      artworkImgRef.current = null
      paint()
      return
    }
    let cancelled = false
    loadImageElement(artworkUrl).then((img) => {
      if (cancelled) return
      artworkImgRef.current = img
      paint()
    }).catch(() => {
      if (cancelled) return
      artworkImgRef.current = null
      paint()
    })
    return () => { cancelled = true }
  }, [artworkUrl, paint])

  // Repaint on resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => paint())
    ro.observe(container)
    return () => ro.disconnect()
  }, [paint])

  // Drag to reposition
  function handlePointerDown(e: React.PointerEvent) {
    if (!artworkUrl) return
    const d = dragRef.current
    d.active = true
    d.pointerId = e.pointerId
    d.startX = e.clientX
    d.startY = e.clientY
    d.startPlacementX = mockupPlacement.xPct
    d.startPlacementY = mockupPlacement.yPct
    containerRef.current?.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d.active || d.pointerId !== e.pointerId) return
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const baseImg = baseImgRef.current
    if (!baseImg) return

    // Map pixel delta to print zone fraction
    const imgAspect = baseImg.naturalWidth / baseImg.naturalHeight
    let drawW = rect.width
    let drawH = rect.width / imgAspect
    if (drawH > rect.width) {
      drawH = rect.width
      drawW = rect.width * imgAspect
    }
    const pzW = MOCKUP_PRINT_ZONE.widthPct * drawW
    const pzH = MOCKUP_PRINT_ZONE.heightPct * drawH

    const dxPct = (e.clientX - d.startX) / pzW
    const dyPct = (e.clientY - d.startY) / pzH

    setMockupPlacement({
      ...mockupPlacement,
      xPct: Math.min(1, Math.max(0, d.startPlacementX + dxPct)),
      yPct: Math.min(1, Math.max(0, d.startPlacementY + dyPct)),
    })
  }

  function handlePointerUp(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d.active || d.pointerId !== e.pointerId) return
    d.active = false
    d.pointerId = -1
    containerRef.current?.releasePointerCapture(e.pointerId)
  }

  // Scroll/wheel to resize
  function handleWheel(e: React.WheelEvent) {
    if (!artworkUrl) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.03 : 0.03
    setMockupPlacement({
      ...mockupPlacement,
      scale: Math.min(1, Math.max(0.1, mockupPlacement.scale + delta)),
    })
  }

  const hasArtwork = !!artworkUrl

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className={`relative w-full aspect-square overflow-hidden border border-border bg-obsidian ${hasArtwork ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-label="T-shirt mockup preview"
        />
        {hasArtwork && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-black/60 backdrop-blur-sm">
            <span className="text-[10px] text-muted">Size</span>
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round(mockupPlacement.scale * 100)}
              onChange={(e) => setMockupPlacement({
                ...mockupPlacement,
                scale: Number(e.target.value) / 100,
              })}
              className="flex-1 accent-ignition h-1"
            />
            <span className="text-[10px] text-white font-semibold w-8 text-right">
              {Math.round(mockupPlacement.scale * 100)}%
            </span>
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
