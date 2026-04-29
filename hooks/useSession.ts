'use client'

import { useState, useEffect } from 'react'
import type { TextLayer, Revision, SavedCustomBackground, PrintSide } from '@/components/shop/customizer/types'
import { SESSION_KEY, PENDING_GENERATION_KEY, PENDING_BACKGROUND_KEY } from '@/components/shop/customizer/constants'
import { normalizeTextLayer, clampCompositeZoom, clampBgScale } from '@/components/shop/customizer/helpers'
import { readPending } from './useGenerationJob'

interface SideDesignSnapshot {
  selectedPresetId: string | null
  carAdjustXPct: number
  carAdjustYPct: number
  carScale: number
  compositionZoom: number
  bgScale: number
  textLayers: TextLayer[]
  selectedTextLayerId: string | null
}

interface SessionState {
  customerNotes: string
  carImageDataUrl: string | null
  carImagePreview: string | null
  revisions: Revision[]
  viewIndex: number
  vehicleLocked: boolean
  composedPromptNotes: string
  tweakNotes: string
  savedCustomBackgrounds: SavedCustomBackground[]
  customBackgroundImageDataUrl: string | null
  customBackgroundImagePreview: string | null
  customBackgroundValue: string
  selectedSide: PrintSide
  backEnabled: boolean
  front: SideDesignSnapshot
  back: SideDesignSnapshot
}

interface SideDesignSetters {
  setSelectedPresetId: (v: string | null) => void
  setCarAdjustXPct: (v: number) => void
  setCarAdjustYPct: (v: number) => void
  setCarScale: (v: number) => void
  setCompositionZoom: (v: number | ((prev: number) => number)) => void
  setBgScale: (v: number) => void
  setTextLayers: (v: TextLayer[]) => void
  setSelectedTextLayerId: (v: string | null) => void
}

interface SessionSetters {
  setCustomerNotes: (v: string) => void
  setCarImageDataUrl: (v: string | null) => void
  setCarImagePreview: (v: string | null) => void
  setRevisions: (v: Revision[]) => void
  setViewIndex: (v: number) => void
  setVehicleLocked: (v: boolean) => void
  setComposedPromptNotes: (v: string | ((prev: string) => string)) => void
  setTweakNotes: (v: string) => void
  setSavedCustomBackgrounds: (v: SavedCustomBackground[]) => void
  setCustomBackgroundImageDataUrl: (v: string | null) => void
  setCustomBackgroundImagePreview: (v: string | null) => void
  setCustomBackgroundValue: (v: string) => void
  setSelectedSide: (v: PrintSide) => void
  setBackEnabled: (v: boolean) => void
  setFrontDesign: SideDesignSetters
  setBackDesign: SideDesignSetters
  setStatus: (v: string) => void
  resumePendingGeneration: (pending: { requestId: string; endpointId: string; notesForPrompt?: string; wasLocked?: boolean; tweakNotes?: string }) => void
  resumePendingBackgroundGeneration: (pending: { requestId: string; endpointId: string; kind: string; combinedValue?: string; baseLabel?: string; tweakText?: string; originalValue?: string }) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySideSnapshot(raw: any, setters: SideDesignSetters, idPrefix: string) {
  if (!raw || typeof raw !== 'object') return
  if (typeof raw.selectedPresetId === 'string' || raw.selectedPresetId === null) {
    setters.setSelectedPresetId(raw.selectedPresetId ?? null)
  }
  if (typeof raw.carAdjustXPct === 'number') setters.setCarAdjustXPct(raw.carAdjustXPct)
  if (typeof raw.carAdjustYPct === 'number') setters.setCarAdjustYPct(raw.carAdjustYPct)
  if (typeof raw.carScale === 'number') setters.setCarScale(raw.carScale)
  if (typeof raw.compositionZoom === 'number') {
    setters.setCompositionZoom(clampCompositeZoom(raw.compositionZoom))
  } else if (typeof raw.backgroundZoom === 'number') {
    setters.setCompositionZoom(clampCompositeZoom(raw.backgroundZoom))
  }
  if (typeof raw.bgScale === 'number') {
    setters.setBgScale(clampBgScale(raw.bgScale))
  }
  if (Array.isArray(raw.textLayers)) {
    setters.setTextLayers(raw.textLayers.map((layer: unknown, index: number) =>
      normalizeTextLayer(layer, `${idPrefix}-${index + 1}`)
    ))
  }
  if (typeof raw.selectedTextLayerId === 'string' || raw.selectedTextLayerId === null) {
    setters.setSelectedTextLayerId(raw.selectedTextLayerId ?? null)
  }
}

export function useSession(state: SessionState, setters: SessionSetters) {
  const [sessionRestored, setSessionRestored] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        if (typeof s.customerNotes === 'string') setters.setCustomerNotes(s.customerNotes)
        if (typeof s.carImageDataUrl === 'string') {
          setters.setCarImageDataUrl(s.carImageDataUrl)
          setters.setCarImagePreview(s.carImagePreview ?? s.carImageDataUrl)
        }
        if (Array.isArray(s.revisions) && s.revisions.length > 0) {
          setters.setRevisions(s.revisions)
          const max = s.revisions.length - 1
          const vi = typeof s.viewIndex === 'number' ? Math.min(Math.max(0, s.viewIndex), max) : max
          setters.setViewIndex(vi)
        }
        if (s.vehicleLocked === true) setters.setVehicleLocked(true)
        if (typeof s.composedPromptNotes === 'string') setters.setComposedPromptNotes(s.composedPromptNotes)
        if (typeof s.tweakNotes === 'string') setters.setTweakNotes(s.tweakNotes)
        if (Array.isArray(s.savedCustomBackgrounds)) setters.setSavedCustomBackgrounds(s.savedCustomBackgrounds)
        if (typeof s.customBackgroundImageDataUrl === 'string') {
          setters.setCustomBackgroundImageDataUrl(s.customBackgroundImageDataUrl)
          setters.setCustomBackgroundImagePreview(s.customBackgroundImagePreview ?? s.customBackgroundImageDataUrl)
        }
        if (typeof s.customBackgroundValue === 'string') setters.setCustomBackgroundValue(s.customBackgroundValue)

        // Per-side state. New format: { front: {...}, back: {...}, selectedSide, backEnabled }.
        // Legacy fallback: top-level fields hydrate the front side; back stays disabled.
        if (s.front && typeof s.front === 'object') {
          applySideSnapshot(s.front, setters.setFrontDesign, 'restored-front-text')
        } else {
          applySideSnapshot(s, setters.setFrontDesign, 'restored-text')
        }
        if (s.back && typeof s.back === 'object') {
          applySideSnapshot(s.back, setters.setBackDesign, 'restored-back-text')
        }
        if (s.selectedSide === 'front' || s.selectedSide === 'back') {
          setters.setSelectedSide(s.selectedSide)
        }
        if (s.backEnabled === true) setters.setBackEnabled(true)

        setters.setStatus('done')
      }
    } catch (e) {
      console.warn('Session restore failed', e)
    }
    setSessionRestored(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const pending = readPending(PENDING_GENERATION_KEY)
    if (pending) setters.resumePendingGeneration(pending)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const pending = readPending<{ requestId: string; endpointId: string; kind: string }>(PENDING_BACKGROUND_KEY)
    if (pending?.kind) setters.resumePendingBackgroundGeneration(pending)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!sessionRestored) return
    const handle = setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
      } catch (e) {
        console.warn('Session save failed (storage may be full)', e)
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [sessionRestored, state])

  return { sessionRestored }
}
