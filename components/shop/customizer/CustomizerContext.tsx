'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { MockupPlacement, PrintSide } from './types'

const DEFAULT_PLACEMENT: MockupPlacement = { xPct: 0.5, yPct: 0.5, scale: 1.0 }

function clampPlacement(p: MockupPlacement): MockupPlacement {
  return {
    xPct: Math.min(1, Math.max(0, p.xPct)),
    yPct: Math.min(1, Math.max(0, p.yPct)),
    scale: Math.min(1, Math.max(0.1, p.scale)),
  }
}

interface CustomizerContextValue {
  artworkUrl: string | null
  setArtworkUrl: (url: string | null) => void

  selectedSide: PrintSide
  setSelectedSide: (s: PrintSide) => void
  backEnabled: boolean
  setBackEnabled: (v: boolean) => void

  // Per-side composites and placements
  frontCompositeDataUrl: string | null
  setFrontCompositeDataUrl: (url: string | null) => void
  backCompositeDataUrl: string | null
  setBackCompositeDataUrl: (url: string | null) => void
  frontPlacement: MockupPlacement
  setFrontPlacement: (p: MockupPlacement) => void
  backPlacement: MockupPlacement
  setBackPlacement: (p: MockupPlacement) => void

  // Per-side garment images
  tshirtFrontImage: string | null
  setTshirtFrontImage: (url: string | null) => void
  tshirtBackImage: string | null
  setTshirtBackImage: (url: string | null) => void

  // Active-side accessors (derived from selectedSide).
  // These keep callers like MockupPreview/MockupPreviewModal simple.
  compositeDataUrl: string | null
  setCompositeDataUrl: (url: string | null) => void
  mockupPlacement: MockupPlacement
  setMockupPlacement: (p: MockupPlacement) => void
  tshirtBaseImage: string | null
  setTshirtBaseImage: (url: string | null) => void

  generationStatus: 'idle' | 'running' | 'done' | 'error'
  setGenerationStatus: (s: 'idle' | 'running' | 'done' | 'error') => void
  productType: string
  setProductType: (t: string) => void
  selectedColorHex: string | null
  setSelectedColorHex: (hex: string | null) => void
  mockupThumbnailUrl: string | null
  setMockupThumbnailUrl: (url: string | null) => void
}

const CustomizerContext = createContext<CustomizerContextValue | null>(null)

export function CustomizerProvider({ children }: { children: ReactNode }) {
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [selectedSide, setSelectedSide] = useState<PrintSide>('front')
  const [backEnabled, setBackEnabled] = useState<boolean>(false)

  const [frontCompositeDataUrl, setFrontCompositeDataUrl] = useState<string | null>(null)
  const [backCompositeDataUrl, setBackCompositeDataUrl] = useState<string | null>(null)
  const [frontPlacement, setFrontPlacementRaw] = useState<MockupPlacement>(DEFAULT_PLACEMENT)
  const [backPlacement, setBackPlacementRaw] = useState<MockupPlacement>(DEFAULT_PLACEMENT)

  const [tshirtFrontImage, setTshirtFrontImage] = useState<string | null>(null)
  const [tshirtBackImage, setTshirtBackImage] = useState<string | null>(null)

  const [generationStatus, setGenerationStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [productType, setProductType] = useState('t-shirt')
  const [selectedColorHex, setSelectedColorHex] = useState<string | null>(null)
  const [mockupThumbnailUrl, setMockupThumbnailUrl] = useState<string | null>(null)

  const setFrontPlacement = useCallback((p: MockupPlacement) => {
    setFrontPlacementRaw(clampPlacement(p))
  }, [])
  const setBackPlacement = useCallback((p: MockupPlacement) => {
    setBackPlacementRaw(clampPlacement(p))
  }, [])

  // Active-side derived values
  const compositeDataUrl = selectedSide === 'front' ? frontCompositeDataUrl : backCompositeDataUrl
  const mockupPlacement = selectedSide === 'front' ? frontPlacement : backPlacement
  const tshirtBaseImage = selectedSide === 'front' ? tshirtFrontImage : tshirtBackImage

  const setCompositeDataUrl = useCallback(
    (url: string | null) => {
      if (selectedSide === 'front') setFrontCompositeDataUrl(url)
      else setBackCompositeDataUrl(url)
    },
    [selectedSide],
  )

  const setMockupPlacement = useCallback(
    (p: MockupPlacement) => {
      if (selectedSide === 'front') setFrontPlacementRaw(clampPlacement(p))
      else setBackPlacementRaw(clampPlacement(p))
    },
    [selectedSide],
  )

  const setTshirtBaseImage = useCallback(
    (url: string | null) => {
      if (selectedSide === 'front') setTshirtFrontImage(url)
      else setTshirtBackImage(url)
    },
    [selectedSide],
  )

  const value = useMemo<CustomizerContextValue>(
    () => ({
      artworkUrl,
      setArtworkUrl,

      selectedSide,
      setSelectedSide,
      backEnabled,
      setBackEnabled,

      frontCompositeDataUrl,
      setFrontCompositeDataUrl,
      backCompositeDataUrl,
      setBackCompositeDataUrl,
      frontPlacement,
      setFrontPlacement,
      backPlacement,
      setBackPlacement,

      tshirtFrontImage,
      setTshirtFrontImage,
      tshirtBackImage,
      setTshirtBackImage,

      compositeDataUrl,
      setCompositeDataUrl,
      mockupPlacement,
      setMockupPlacement,
      tshirtBaseImage,
      setTshirtBaseImage,

      generationStatus,
      setGenerationStatus,
      productType,
      setProductType,
      selectedColorHex,
      setSelectedColorHex,
      mockupThumbnailUrl,
      setMockupThumbnailUrl,
    }),
    [
      artworkUrl,
      selectedSide,
      backEnabled,
      frontCompositeDataUrl,
      backCompositeDataUrl,
      frontPlacement,
      backPlacement,
      tshirtFrontImage,
      tshirtBackImage,
      compositeDataUrl,
      mockupPlacement,
      tshirtBaseImage,
      generationStatus,
      productType,
      selectedColorHex,
      mockupThumbnailUrl,
      setFrontPlacement,
      setBackPlacement,
      setCompositeDataUrl,
      setMockupPlacement,
      setTshirtBaseImage,
    ],
  )

  return <CustomizerContext.Provider value={value}>{children}</CustomizerContext.Provider>
}

export function useCustomizer() {
  const ctx = useContext(CustomizerContext)
  if (!ctx) throw new Error('useCustomizer must be used within CustomizerProvider')
  return ctx
}
