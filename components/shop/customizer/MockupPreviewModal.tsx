'use client'

import { useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { useCustomizer } from './CustomizerContext'
import { loadImageElement } from './helpers'
import { getMockupPrintZone } from './constants'

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
  } = useCustomizer()

  const overlayUrl = compositeDataUrl ?? artworkUrl
  const pz = getMockupPrintZone(productType)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)
  const artworkImgRef = useRef<HTMLImageElement | null>(null)

  const offscreenRef = useRef<HTMLCanvasElement | null>(null)

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const baseImg = baseImgRef.current
    const artworkImg = artworkImgRef.current

    const size = Math.min(1200, window.innerWidth - 48, window.innerHeight - 120)
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
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

    // Draw full mockup to an offscreen canvas, then crop around the print zone
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

    const imgAspect = baseImg.naturalWidth / baseImg.naturalHeight
    let drawW = fullSize
    let drawH = fullSize / imgAspect
    if (drawH > fullSize) { drawH = fullSize; drawW = fullSize * imgAspect }
    const drawX = (fullSize - drawW) /2
    const drawY = (fullSize - drawH) / 2
    offCtx.drawImage(baseImg, drawX, drawY, drawW, drawH)

    if (artworkImg) {
      const pzX = drawX + pz.xPct * drawW
      const pzY = drawY + pz.yPct * drawH
      const pzW = pz.widthPct * drawW
      const pzH = pz.heightPct * drawH

      const artAspect = artworkImg.naturalWidth / artworkImg.naturalHeight
      const baseArtW = pzW * mockupPlacement.scale
      const baseArtH = baseArtW / artAspect
      const artX = pzX + mockupPlacement.xPct * pzW - baseArtW / 2
      const artY = pzY + mockupPlacement.yPct * pzH - baseArtH / 2

      offCtx.save()
      offCtx.beginPath()
      offCtx.rect(pzX, pzY, pzW, pzH)
      offCtx.clip()
      offCtx.globalAlpha = 0.92
      offCtx.drawImage(artworkImg, artX, artY, baseArtW, baseArtH)
      offCtx.globalAlpha = 1.0
      offCtx.restore()
    }

    // Crop: centre on the print zone with padding so the artwork fills the view
    const cropPzX = drawX + pz.xPct * drawW
    const cropPzY = drawY + pz.yPct * drawH
    const cropPzW = pz.widthPct * drawW
    const cropPzH = pz.heightPct * drawH
    const padding = 1
    const cropCx = cropPzX + cropPzW / 2
    const cropCy = cropPzY + cropPzH / 2
    const cropSide = Math.max(cropPzW, cropPzH) * (1 + padding)
    const sx = Math.max(0, Math.min(cropCx - cropSide / 2, fullSize - cropSide))
    const sy = Math.max(0, Math.min(cropCy - cropSide / 2, fullSize - cropSide))

    ctx.drawImage(off, sx, sy, cropSide, cropSide, 0, 0, px, px)
  }, [mockupPlacement, pz, tshirtBaseImage, overlayUrl])

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
        <canvas
          ref={canvasRef}
          className="rounded border border-border/50"
          aria-label="Mockup preview"
        />
      </div>
    </div>
  )
}
