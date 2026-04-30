'use client'

import { useState } from 'react'
import { useCarGeneration } from './useCarGeneration'

/**
 * Bundles all per-side vehicle inputs (photo + customer notes) and the
 * underlying car-generation state for one side (front or back). Each side
 * has its own pending-generation key so the two can operate independently.
 */
export function useSideVehicle(pendingKey: string) {
  const [carImageDataUrl, setCarImageDataUrl] = useState<string | null>(null)
  const [carImagePreview, setCarImagePreview] = useState<string | null>(null)
  const [customerNotes, setCustomerNotes] = useState('')
  const [vehicleLocked, setVehicleLocked] = useState(false)
  const [composedPromptNotes, setComposedPromptNotes] = useState('')
  const [tweakNotes, setTweakNotes] = useState('')

  const carGen = useCarGeneration({
    pendingKey,
    carImageDataUrl,
    customerNotes,
    vehicleLocked,
    setVehicleLocked,
    composedPromptNotes,
    setComposedPromptNotes,
    tweakNotes,
    setTweakNotes,
  })

  function reset() {
    setCarImageDataUrl(null)
    setCarImagePreview(null)
    setCustomerNotes('')
    setVehicleLocked(false)
    setComposedPromptNotes('')
    setTweakNotes('')
    carGen.resetCarGeneration()
  }

  return {
    carImageDataUrl,
    setCarImageDataUrl,
    carImagePreview,
    setCarImagePreview,
    customerNotes,
    setCustomerNotes,
    vehicleLocked,
    setVehicleLocked,
    composedPromptNotes,
    setComposedPromptNotes,
    tweakNotes,
    setTweakNotes,
    carGen,
    reset,
  }
}
