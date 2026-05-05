'use client'

import { useState, useEffect } from 'react'
import type { TextLayer, Revision, SavedCustomBackground } from '@/components/shop/customizer/types'
import type { ArtworkSide, TextPlacement } from '@/components/shop/customizer/CustomizerContext'
import { SESSION_KEY, PENDING_GENERATION_KEY, PENDING_BACKGROUND_KEY } from '@/components/shop/customizer/constants'
import { normalizeTextLayer, clampCompositeZoom, clampBgScale } from '@/components/shop/customizer/helpers'
import { readPending } from './useGenerationJob'

interface SessionState {
  customerNotes: string
  carImageDataUrl: string | null
  carImagePreview: string | null
  revisions: Revision[]
  viewIndex: number
  vehicleLocked: boolean
  composedPromptNotes: string
  tweakNotes: string
  selectedPresetId: string | null
  savedCustomBackgrounds: SavedCustomBackground[]
  customBackgroundImageDataUrl: string | null
  customBackgroundImagePreview: string | null
  customBackgroundValue: string
  carAdjustXPct: number
  carAdjustYPct: number
  carScale: number
  compositionZoom: number
  bgScale: number
  textLayers: TextLayer[]
  selectedTextLayerId: string | null
  artworkSide: ArtworkSide
  addTextEnabled: boolean
  textPlacement: TextPlacement
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
  setSelectedPresetId: (v: string | null) => void
  setSavedCustomBackgrounds: (v: SavedCustomBackground[]) => void
  setCustomBackgroundImageDataUrl: (v: string | null) => void
  setCustomBackgroundImagePreview: (v: string | null) => void
  setCustomBackgroundValue: (v: string) => void
  setCarAdjustXPct: (v: number) => void
  setCarAdjustYPct: (v: number) => void
  setCarScale: (v: number) => void
  setCompositionZoom: (v: number) => void
  setBgScale: (v: number) => void
  setTextLayers: (v: TextLayer[]) => void
  setSelectedTextLayerId: (v: string | null) => void
  setArtworkSide: (v: ArtworkSide) => void
  setAddTextEnabled: (v: boolean) => void
  setTextPlacement: (v: TextPlacement) => void
  setStatus: (v: string) => void
  resumePendingGeneration: (pending: { requestId: string; endpointId: string; notesForPrompt?: string; wasLocked?: boolean; tweakNotes?: string }) => void
  resumePendingBackgroundGeneration: (pending: { requestId: string; endpointId: string; kind: string; combinedValue?: string; baseLabel?: string; tweakText?: string; originalValue?: string }) => void
}

export function useSession(state: SessionState, setters: SessionSetters) {
  const [sessionRestored, setSessionRestored] = useState(false)

  // Restore session on mount
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
        if (typeof s.selectedPresetId === 'string' || s.selectedPresetId === null) {
          setters.setSelectedPresetId(s.selectedPresetId ?? null)
        }
        if (Array.isArray(s.savedCustomBackgrounds)) setters.setSavedCustomBackgrounds(s.savedCustomBackgrounds)
        if (typeof s.customBackgroundImageDataUrl === 'string') {
          setters.setCustomBackgroundImageDataUrl(s.customBackgroundImageDataUrl)
          setters.setCustomBackgroundImagePreview(s.customBackgroundImagePreview ?? s.customBackgroundImageDataUrl)
        }
        if (typeof s.customBackgroundValue === 'string') setters.setCustomBackgroundValue(s.customBackgroundValue)
        if (typeof s.carAdjustXPct === 'number') setters.setCarAdjustXPct(s.carAdjustXPct)
        if (typeof s.carAdjustYPct === 'number') setters.setCarAdjustYPct(s.carAdjustYPct)
        if (typeof s.carScale === 'number') setters.setCarScale(s.carScale)
        if (typeof s.compositionZoom === 'number') {
          setters.setCompositionZoom(clampCompositeZoom(s.compositionZoom))
        } else if (typeof s.backgroundZoom === 'number') {
          setters.setCompositionZoom(clampCompositeZoom(s.backgroundZoom))
        }
        if (typeof s.bgScale === 'number') {
          setters.setBgScale(clampBgScale(s.bgScale))
        }
        if (Array.isArray(s.textLayers)) {
          setters.setTextLayers(s.textLayers.map((layer: unknown, index: number) =>
            normalizeTextLayer(layer, `restored-text-${index + 1}`)
          ))
        }
        if (typeof s.selectedTextLayerId === 'string' || s.selectedTextLayerId === null) {
          setters.setSelectedTextLayerId(s.selectedTextLayerId ?? null)
        }
        if (s.artworkSide === 'front' || s.artworkSide === 'back') {
          setters.setArtworkSide(s.artworkSide)
        }
        if (typeof s.addTextEnabled === 'boolean') {
          setters.setAddTextEnabled(s.addTextEnabled)
        }
        if (s.textPlacement === 'same' || s.textPlacement === 'opposite') {
          setters.setTextPlacement(s.textPlacement)
        }
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
