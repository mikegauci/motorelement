'use client'

import { useState, useEffect } from 'react'
import type { TextLayer, Revision, SavedCustomBackground, PrintSide } from '@/components/shop/customizer/types'
import {
  SESSION_KEY,
  PENDING_GENERATION_KEY_FRONT,
  PENDING_GENERATION_KEY_BACK,
  PENDING_BACKGROUND_KEY,
} from '@/components/shop/customizer/constants'
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

interface SideVehicleSnapshot {
  carImageDataUrl: string | null
  carImagePreview: string | null
  customerNotes: string
  revisions: Revision[]
  viewIndex: number
  vehicleLocked: boolean
  composedPromptNotes: string
  tweakNotes: string
}

interface SessionState {
  savedCustomBackgrounds: SavedCustomBackground[]
  customBackgroundImageDataUrl: string | null
  customBackgroundImagePreview: string | null
  customBackgroundValue: string
  selectedSide: PrintSide
  backEnabled: boolean
  front: SideDesignSnapshot
  back: SideDesignSnapshot
  frontVehicle: SideVehicleSnapshot
  backVehicle: SideVehicleSnapshot
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

interface SideVehicleSetters {
  setCarImageDataUrl: (v: string | null) => void
  setCarImagePreview: (v: string | null) => void
  setCustomerNotes: (v: string) => void
  setRevisions: (v: Revision[]) => void
  setViewIndex: (v: number) => void
  setVehicleLocked: (v: boolean) => void
  setComposedPromptNotes: (v: string | ((prev: string) => string)) => void
  setTweakNotes: (v: string) => void
  setStatus: (v: string) => void
  resumePendingGeneration: (pending: { requestId: string; endpointId: string; notesForPrompt?: string; wasLocked?: boolean; tweakNotes?: string }) => void
}

interface SessionSetters {
  setSavedCustomBackgrounds: (v: SavedCustomBackground[]) => void
  setCustomBackgroundImageDataUrl: (v: string | null) => void
  setCustomBackgroundImagePreview: (v: string | null) => void
  setCustomBackgroundValue: (v: string) => void
  setSelectedSide: (v: PrintSide) => void
  setBackEnabled: (v: boolean) => void
  setFrontDesign: SideDesignSetters
  setBackDesign: SideDesignSetters
  setFrontVehicle: SideVehicleSetters
  setBackVehicle: SideVehicleSetters
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyVehicleSnapshot(raw: any, setters: SideVehicleSetters) {
  if (!raw || typeof raw !== 'object') return
  if (typeof raw.customerNotes === 'string') setters.setCustomerNotes(raw.customerNotes)
  if (typeof raw.carImageDataUrl === 'string') {
    setters.setCarImageDataUrl(raw.carImageDataUrl)
    setters.setCarImagePreview(raw.carImagePreview ?? raw.carImageDataUrl)
  }
  if (Array.isArray(raw.revisions) && raw.revisions.length > 0) {
    setters.setRevisions(raw.revisions)
    const max = raw.revisions.length - 1
    const vi = typeof raw.viewIndex === 'number' ? Math.min(Math.max(0, raw.viewIndex), max) : max
    setters.setViewIndex(vi)
    setters.setStatus('done')
  }
  if (raw.vehicleLocked === true) setters.setVehicleLocked(true)
  if (typeof raw.composedPromptNotes === 'string') setters.setComposedPromptNotes(raw.composedPromptNotes)
  if (typeof raw.tweakNotes === 'string') setters.setTweakNotes(raw.tweakNotes)
}

export function useSession(state: SessionState, setters: SessionSetters) {
  const [sessionRestored, setSessionRestored] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const s = JSON.parse(raw)

        if (Array.isArray(s.savedCustomBackgrounds)) setters.setSavedCustomBackgrounds(s.savedCustomBackgrounds)
        if (typeof s.customBackgroundImageDataUrl === 'string') {
          setters.setCustomBackgroundImageDataUrl(s.customBackgroundImageDataUrl)
          setters.setCustomBackgroundImagePreview(s.customBackgroundImagePreview ?? s.customBackgroundImageDataUrl)
        }
        if (typeof s.customBackgroundValue === 'string') setters.setCustomBackgroundValue(s.customBackgroundValue)

        // Per-side design snapshots. Legacy fallback: top-level fields hydrate front.
        if (s.front && typeof s.front === 'object') {
          applySideSnapshot(s.front, setters.setFrontDesign, 'restored-front-text')
        } else {
          applySideSnapshot(s, setters.setFrontDesign, 'restored-text')
        }
        if (s.back && typeof s.back === 'object') {
          applySideSnapshot(s.back, setters.setBackDesign, 'restored-back-text')
        }

        // Per-side vehicle snapshots. Legacy fallback: top-level vehicle fields → front.
        if (s.frontVehicle && typeof s.frontVehicle === 'object') {
          applyVehicleSnapshot(s.frontVehicle, setters.setFrontVehicle)
        } else {
          applyVehicleSnapshot(s, setters.setFrontVehicle)
        }
        if (s.backVehicle && typeof s.backVehicle === 'object') {
          applyVehicleSnapshot(s.backVehicle, setters.setBackVehicle)
        }

        if (s.selectedSide === 'front' || s.selectedSide === 'back') {
          setters.setSelectedSide(s.selectedSide)
        }
        if (s.backEnabled === true) setters.setBackEnabled(true)
      }
    } catch (e) {
      console.warn('Session restore failed', e)
    }
    setSessionRestored(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const pendingFront = readPending(PENDING_GENERATION_KEY_FRONT)
    if (pendingFront) setters.setFrontVehicle.resumePendingGeneration(pendingFront)
    const pendingBack = readPending(PENDING_GENERATION_KEY_BACK)
    if (pendingBack) setters.setBackVehicle.resumePendingGeneration(pendingBack)
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
