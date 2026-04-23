'use client'

import { useRef, useEffect, useState, type ReactNode } from 'react'
import type { TextLayer } from '@/components/shop/customizer/types'
import {
  loadImageElement,
  drawCompositeContent,
  getTextLayerBounds,
  clampAdjust,
} from '@/components/shop/customizer/helpers'
import { useCustomizer } from '@/components/shop/customizer/CustomizerContext'

interface CompositeCanvasDeps {
  transparentCarUrlForPreset: string | null
  selectedBackgroundSrc: string | null
  selectedBackgroundIsCustom: boolean
  selectedPreset: { id: string; label?: string } | undefined
  isCustomSavedSelection: boolean
  selectedCustomBg: { label?: string } | null
  carAdjustXPct: number
  setCarAdjustXPct: (v: number) => void
  carAdjustYPct: number
  setCarAdjustYPct: (v: number) => void
  carScale: number
  compositionZoom: number
  setCompositionZoom: (v: number | ((prev: number) => number)) => void
  bgScale: number
  textLayersRef: React.RefObject<TextLayer[]>
  textLayers: TextLayer[]
  selectedTextLayerId: string | null
  updateTextLayer: (id: string, patch: Partial<TextLayer>) => void
  backgroundControlsLocked: boolean
  showResults: boolean
  desktopDragEnabled: boolean
}

export function useCompositeCanvas(deps: CompositeCanvasDeps) {
  const { setCompositeDataUrl } = useCustomizer()
  const compositeStageRef = useRef<HTMLDivElement>(null)
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null)
  const compositeRenderRef = useRef(() => {})
  const carAdjustXRef = useRef(0)
  const carAdjustYRef = useRef(0)
  const carScaleRef = useRef(1)
  const compositionZoomRef = useRef(1)
  const bgScaleRef = useRef(1)
  const resultCardRef = useRef<HTMLDivElement>(null)

  const [mobileCompositePreviewSrc, setMobileCompositePreviewSrc] = useState('')
  const [showMobileResultDock, setShowMobileResultDock] = useState(false)

  const carDragRef = useRef({
    active: false,
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  })
  const textDragRef = useRef({
    active: false,
    pointerId: null as number | null,
    layerId: null as string | null,
    startPointerX: 0,
    startPointerY: 0,
    startSize: 1,
    startXPct: 0,
    startYPct: 0,
  })

  // Sync refs for paint callback
  useEffect(() => {
    carAdjustXRef.current = deps.carAdjustXPct
    carAdjustYRef.current = deps.carAdjustYPct
    carScaleRef.current = deps.carScale
    compositionZoomRef.current = deps.compositionZoom
    bgScaleRef.current = deps.bgScale
    compositeRenderRef.current()
  }, [deps.carAdjustXPct, deps.carAdjustYPct, deps.carScale, deps.compositionZoom, deps.bgScale])

  useEffect(() => { compositeRenderRef.current() }, [deps.textLayers])

  // Canvas paint loop
  useEffect(() => {
    if (!deps.transparentCarUrlForPreset) return
    const stage = compositeStageRef.current
    const canvas = compositeCanvasRef.current
    if (!stage || !canvas) return
    let cancelled = false
    let bgImg: HTMLImageElement | null = null
    let carImg: HTMLImageElement | null = null
    function paint() {
      if (cancelled || !carImg) return
      if (deps.selectedBackgroundSrc && !bgImg) return
      const cssSize = Math.min(Math.floor(stage!.clientWidth), 720)
      if (cssSize < 2) return
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3))
      const pixelSize = Math.round(cssSize * dpr)
      if (canvas!.width !== pixelSize) canvas!.width = pixelSize
      if (canvas!.height !== pixelSize) canvas!.height = pixelSize
      const ctx = canvas!.getContext('2d', { alpha: true })!
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
      ctx.clearRect(0, 0, pixelSize, pixelSize)
      drawCompositeContent(ctx, pixelSize, deps.selectedBackgroundSrc ? bgImg : null, carImg, {
        cropBackgroundToArtwork: deps.selectedBackgroundIsCustom,
        carOffsetXPct: carAdjustXRef.current, carOffsetYPct: carAdjustYRef.current,
        carScale: carScaleRef.current, textLayers: deps.textLayersRef.current ?? [],
        compositionZoom: compositionZoomRef.current,
        bgScale: bgScaleRef.current,
      })
      try {
        const dataUrl = canvas!.toDataURL('image/png')
        setMobileCompositePreviewSrc(dataUrl)
        setCompositeDataUrl(dataUrl)
      } catch (_) { /* ignore */ }
    }
    compositeRenderRef.current = paint
    const bgPromise = deps.selectedBackgroundSrc ? loadImageElement(deps.selectedBackgroundSrc) : Promise.resolve(null)
    Promise.all([bgPromise, loadImageElement(deps.transparentCarUrlForPreset)]).then(([nextBgImg, nextCarImg]) => {
      if (cancelled) return
      bgImg = nextBgImg; carImg = nextCarImg; paint()
    })
    const ro = new ResizeObserver(() => paint())
    ro.observe(stage)
    return () => { cancelled = true; compositeRenderRef.current = () => {}; ro.disconnect() }
  }, [deps.selectedBackgroundSrc, deps.selectedBackgroundIsCustom, deps.transparentCarUrlForPreset])

  useEffect(() => {
    if (!deps.transparentCarUrlForPreset) {
      setMobileCompositePreviewSrc('')
      setCompositeDataUrl(null)
    }
  }, [deps.transparentCarUrlForPreset, setCompositeDataUrl])

  // Mobile dock visibility
  useEffect(() => {
    if (!deps.showResults) { setShowMobileResultDock(false); return }
    function syncMobileDockVisibility() {
      const card = resultCardRef.current
      if (!card) { setShowMobileResultDock(false); return }
      const rect = card.getBoundingClientRect()
      setShowMobileResultDock(rect.bottom < 2400)
    }
    syncMobileDockVisibility()
    window.addEventListener('scroll', syncMobileDockVisibility, { passive: true })
    window.addEventListener('resize', syncMobileDockVisibility)
    return () => { window.removeEventListener('scroll', syncMobileDockVisibility); window.removeEventListener('resize', syncMobileDockVisibility) }
  }, [deps.showResults])

  // Pointer helpers
  function getCompositePointerPixel(e: React.PointerEvent) {
    const stage = compositeStageRef.current
    const canvas = compositeCanvasRef.current
    if (!stage || !canvas) return null
    const rect = stage.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function handleCompositePointerDown(e: React.PointerEvent) {
    if (!deps.transparentCarUrlForPreset) return
    const stage = compositeStageRef.current
    const canvas = compositeCanvasRef.current
    if (!stage) return
    if (deps.selectedTextLayerId && canvas) {
      const activeLayer = (deps.textLayersRef.current ?? []).find((l) => l.id === deps.selectedTextLayerId)
      const pointer = getCompositePointerPixel(e)
      if (activeLayer && pointer) {
        const ctx = canvas.getContext('2d', { alpha: true })
        if (ctx) {
          const bounds = getTextLayerBounds(ctx, canvas.width, activeLayer)
          if (bounds) {
            const pad = Math.max(10, canvas.width * 0.015)
            const inBounds =
              pointer.x >= bounds.left - pad && pointer.x <= bounds.left + bounds.width + pad &&
              pointer.y >= bounds.top - pad && pointer.y <= bounds.top + bounds.height + pad
            if (inBounds) {
              const drag = textDragRef.current
              drag.active = true; drag.pointerId = e.pointerId; drag.layerId = activeLayer.id
              drag.startPointerX = pointer.x; drag.startPointerY = pointer.y
              drag.startSize = Math.max(1, canvas.width)
              drag.startXPct = activeLayer.xPct; drag.startYPct = activeLayer.yPct
              stage.setPointerCapture?.(e.pointerId)
              return
            }
          }
        }
      }
    }
    const drag = carDragRef.current
    drag.active = true; drag.pointerId = e.pointerId
    drag.startX = e.clientX; drag.startY = e.clientY
    drag.startOffsetX = deps.carAdjustXPct; drag.startOffsetY = deps.carAdjustYPct
    stage.setPointerCapture?.(e.pointerId)
  }

  function handleCompositePointerMove(e: React.PointerEvent) {
    const tDrag = textDragRef.current
    if (tDrag.active && tDrag.pointerId === e.pointerId) {
      const pointer = getCompositePointerPixel(e)
      if (!pointer || !tDrag.layerId) return
      deps.updateTextLayer(tDrag.layerId, {
        xPct: tDrag.startXPct + (pointer.x - tDrag.startPointerX) / tDrag.startSize,
        yPct: tDrag.startYPct + (pointer.y - tDrag.startPointerY) / tDrag.startSize,
      })
      return
    }
    const drag = carDragRef.current
    if (!drag.active || drag.pointerId !== e.pointerId) return
    const stage = compositeStageRef.current
    if (!stage) return
    const size = Math.max(1, stage.clientWidth)
    deps.setCarAdjustXPct(clampAdjust(drag.startOffsetX + (e.clientX - drag.startX) / size))
    deps.setCarAdjustYPct(clampAdjust(drag.startOffsetY + (e.clientY - drag.startY) / size))
  }

  function handleCompositePointerUp(e: React.PointerEvent) {
    const tDrag = textDragRef.current
    if (tDrag.active && tDrag.pointerId === e.pointerId) {
      tDrag.active = false; tDrag.pointerId = null; tDrag.layerId = null
      compositeStageRef.current?.releasePointerCapture?.(e.pointerId)
      return
    }
    const drag = carDragRef.current
    if (!drag.active || drag.pointerId !== e.pointerId) return
    drag.active = false; drag.pointerId = null
    compositeStageRef.current?.releasePointerCapture?.(e.pointerId)
  }

  function renderHiddenCanvas(): ReactNode {
    return (
      <div
        ref={compositeStageRef}
        style={{ position: 'absolute', left: -9999, width: 720, height: 720, visibility: 'hidden', pointerEvents: 'none' }}
        aria-hidden
      >
        <canvas ref={compositeCanvasRef} width={720} height={720} />
      </div>
    )
  }

  return {
    compositeRenderRef,
    resultCardRef,
    mobileCompositePreviewSrc,
    showMobileResultDock,
    renderHiddenCanvas,
  }
}
