'use client'

import { useState, useCallback } from 'react'
import type { FontOption } from '@/components/shop/customizer/types'
import { useTextLayers } from './useTextLayers'

/**
 * Bundles all per-side composition state for one side (front or back) of a
 * garment: background preset, car position/scale, composition zoom, bg scale,
 * and text layers.
 *
 * Mount once per side and pick the active one via `selectedSide`.
 */
export function useSideDesign(availableFontOptions: FontOption[]) {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [carAdjustXPct, setCarAdjustXPct] = useState(0)
  const [carAdjustYPct, setCarAdjustYPct] = useState(0)
  const [carScale, setCarScale] = useState(0.7)
  const [compositionZoom, setCompositionZoom] = useState(1)
  const [bgScale, setBgScale] = useState(1)
  const text = useTextLayers(availableFontOptions)

  const reset = useCallback(() => {
    setSelectedPresetId(null)
    setCarAdjustXPct(0)
    setCarAdjustYPct(0)
    setCarScale(0.7)
    setCompositionZoom(1)
    setBgScale(1)
    text.resetTextLayers()
  }, [text])

  return {
    selectedPresetId,
    setSelectedPresetId,
    carAdjustXPct,
    setCarAdjustXPct,
    carAdjustYPct,
    setCarAdjustYPct,
    carScale,
    setCarScale,
    compositionZoom,
    setCompositionZoom,
    bgScale,
    setBgScale,
    text,
    reset,
  }
}
