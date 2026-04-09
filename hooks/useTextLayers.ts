'use client'

import { useState, useMemo, useRef } from 'react'
import type { TextLayer, FontOption } from '@/components/shop/customizer/types'
import {
  createTextLayer,
  clampTextPct,
  clampTextFontSizePct,
  getCanvasAlignedYPct,
  getLayerId,
} from '@/components/shop/customizer/helpers'

export function useTextLayers(availableFontOptions: FontOption[]) {
  const [textLayers, setTextLayers] = useState<TextLayer[]>([])
  const [selectedTextLayerId, setSelectedTextLayerId] = useState<string | null>(null)
  const textLayersRef = useRef<TextLayer[]>([])
  textLayersRef.current = textLayers

  const selectedTextLayer = useMemo(
    () => textLayers.find((l) => l.id === selectedTextLayerId) ?? null,
    [textLayers, selectedTextLayerId]
  )

  function addTextLayer() {
    const id = getLayerId()
    const layer = createTextLayer(id, availableFontOptions[0]?.value || 'Arial')
    setTextLayers((prev) => [...prev, layer])
    setSelectedTextLayerId(id)
  }

  function updateTextLayer(layerId: string, patch: Partial<TextLayer>) {
    setTextLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer
        const next = { ...layer, ...patch }
        if (typeof next.xPct === 'number') next.xPct = clampTextPct(next.xPct)
        if (typeof next.yPct === 'number') next.yPct = clampTextPct(next.yPct)
        if (typeof next.fontSizePct === 'number') next.fontSizePct = clampTextFontSizePct(next.fontSizePct)
        return next
      })
    )
  }

  function nudgeTextFontSize(layerId: string, delta: number) {
    const layer = textLayersRef.current.find((it) => it.id === layerId)
    if (!layer) return
    updateTextLayer(layerId, { fontSizePct: layer.fontSizePct + delta })
  }

  function alignTextLayerToCanvasVertical(layerId: string, nextAlignY: string) {
    updateTextLayer(layerId, { alignY: nextAlignY as 'top' | 'middle' | 'bottom', yPct: getCanvasAlignedYPct(nextAlignY as 'top' | 'middle' | 'bottom') })
  }

  function removeTextLayer(layerId: string) {
    setTextLayers((prev) => prev.filter((l) => l.id !== layerId))
  }

  function moveTextLayer(layerId: string, direction: number) {
    setTextLayers((prev) => {
      const index = prev.findIndex((l) => l.id === layerId)
      if (index < 0) return prev
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  function resetTextLayers() {
    setTextLayers([])
    setSelectedTextLayerId(null)
  }

  return {
    textLayers,
    setTextLayers,
    textLayersRef,
    selectedTextLayerId,
    setSelectedTextLayerId,
    selectedTextLayer,
    addTextLayer,
    updateTextLayer,
    nudgeTextFontSize,
    alignTextLayerToCanvasVertical,
    removeTextLayer,
    moveTextLayer,
    resetTextLayers,
  }
}
